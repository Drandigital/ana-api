// services/geolocationService.js
import config from '../config/index.js';
import { ApiError } from '../middleware/errorHandler.js';
import cacheService from './cacheService.js';
import axios from 'axios';

/**
 * Servicio optimizado de geolocalización para Ana-IA
 * Proporciona búsquedas eficientes y precisas basadas en ubicación
 */

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine optimizada
 * @param {number} lat1 - Latitud del punto 1
 * @param {number} lng1 - Longitud del punto 1
 * @param {number} lat2 - Latitud del punto 2
 * @param {number} lng2 - Longitud del punto 2
 * @returns {number} - Distancia en kilómetros
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  // Validación de coordenadas
  if (!isValidCoordinate(lat1, lng1) || !isValidCoordinate(lat2, lng2)) {
    return null;
  }

  const R = 6371; // Radio de la Tierra en km
  const dLat = degreesToRadians(lat2 - lat1);
  const dLng = degreesToRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 1000) / 1000; // Redondear a 3 decimales para precisión
}

/**
 * Valida si las coordenadas son válidas
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @returns {boolean} - True si las coordenadas son válidas
 */
export function isValidCoordinate(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Convierte grados a radianes
 * @param {number} degrees - Ángulo en grados
 * @returns {number} - Ángulo en radianes
 */
function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Formatea la distancia para mostrar de manera user-friendly
 * @param {number} distance - Distancia en kilómetros
 * @param {string} language - Idioma ('es' o 'en')
 * @returns {string} - Cadena de distancia formateada
 */
export function formatDistance(distance, language = 'es') {
  if (distance === undefined || distance === null || isNaN(distance)) {
    return language === 'es' ? 'Distancia no disponible' : 'Distance unavailable';
  }
  
  if (distance < 0.1) {
    // Muy cerca - menos de 100m
    return language === 'es' ? 'Muy cerca' : 'Very close';
  } else if (distance < 1) {
    // Convertir a metros para distancias menores a 1km
    const meters = Math.round(distance * 1000);
    return language === 'es' ? `${meters}m` : `${meters}m`;
  } else if (distance < 10) {
    // Hasta 10km, mostrar un decimal
    return `${distance.toFixed(1)}km`;
  } else {
    // Para distancias mayores, redondear a entero
    return `${Math.round(distance)}km`;
  }
}

/**
 * Ordena una lista de lugares por proximidad a una ubicación
 * @param {Array} places - Lista de lugares con coordenadas
 * @param {Object} userLocation - Ubicación del usuario {lat, lng}
 * @param {number} maxDistance - Distancia máxima en km (opcional)
 * @returns {Array} - Lugares ordenados por distancia (limitados por maxDistance si se especifica)
 */
export function sortPlacesByProximity(places, userLocation, maxDistance = null) {
  if (!places || places.length === 0) {
    return [];
  }

  if (!isValidCoordinate(userLocation.lat, userLocation.lng)) {
    console.warn('Ubicación del usuario no válida para ordenamiento por proximidad');
    return places;
  }

  console.log(`📏 Ordenando ${places.length} lugares por proximidad${maxDistance ? ` (máximo ${maxDistance}km)` : ''}`);

  // Calcular distancias y filtrar si es necesario
  const placesWithDistance = places
    .map(place => {
      const placeLocation = place.location || place.geometry?.location;
      if (!placeLocation) {
        return { ...place, distance: Infinity, distance_formatted: 'Sin ubicación' };
      }

      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        placeLocation.lat || placeLocation.latitude,
        placeLocation.lng || placeLocation.longitude
      );

      return {
        ...place,
        distance: distance || Infinity,
        distance_formatted: formatDistance(distance, 'es')
      };
    })
    .filter(place => {
      // Filtrar por distancia máxima si se especifica
      if (maxDistance && place.distance !== Infinity) {
        const withinRange = place.distance <= maxDistance;
        if (!withinRange) {
          console.log(`📍 Lugar ${place.name} filtrado: ${place.distance.toFixed(1)}km > ${maxDistance}km`);
        }
        return withinRange;
      }
      return place.distance !== Infinity; // Solo excluir lugares sin ubicación válida
    })
    .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));

  console.log(`✅ ${placesWithDistance.length} lugares ordenados por proximidad (filtrados: ${places.length - placesWithDistance.length})`);
  
  return placesWithDistance;
}

/**
 * Encuentra lugares dentro de un radio específico
 * @param {Array} places - Lista de lugares
 * @param {Object} userLocation - Ubicación del usuario {lat, lng}
 * @param {number} radius - Radio de búsqueda en km
 * @returns {Array} - Lugares dentro del radio especificado
 */
export function getPlacesWithinRadius(places, userLocation, radius = 5) {
  if (!places || places.length === 0) {
    return [];
  }

  if (!isValidCoordinate(userLocation.lat, userLocation.lng)) {
    return [];
  }

  return places
    .map(place => {
      const placeLocation = place.location || place.geometry?.location;
      if (!placeLocation) {
        return null;
      }

      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        placeLocation.lat,
        placeLocation.lng
      );

      if (distance !== null && distance <= radius) {
        return {
          ...place,
          distance,
          distance_text: formatDistance(distance, 'es')
        };
      }

      return null;
    })
    .filter(place => place !== null)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Determina la ciudad más cercana basada en coordenadas
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @returns {string|null} - Nombre de la ciudad más cercana
 */
export function getNearestCity(lat, lng) {
  if (!isValidCoordinate(lat, lng)) {
    return null;
  }

  // Coordenadas de las principales ciudades colombianas (actualizadas y ampliadas)
  const colombianCities = [
    { name: 'Cartagena', department: 'Bolívar', lat: 10.4236, lng: -75.5378 },
    { name: 'Bogotá', department: 'Cundinamarca', lat: 4.7110, lng: -74.0721 },
    { name: 'Medellín', department: 'Antioquia', lat: 6.2442, lng: -75.5812 },
    { name: 'Cali', department: 'Valle del Cauca', lat: 3.4516, lng: -76.5320 },
    { name: 'Barranquilla', department: 'Atlántico', lat: 10.9685, lng: -74.7813 },
    { name: 'Santa Marta', department: 'Magdalena', lat: 11.2408, lng: -74.2087 },
    { name: 'Bucaramanga', department: 'Santander', lat: 7.1193, lng: -73.1227 },
    { name: 'Pereira', department: 'Risaralda', lat: 4.8133, lng: -75.6961 },
    { name: 'Manizales', department: 'Caldas', lat: 5.0700, lng: -75.5138 },
    { name: 'Cúcuta', department: 'Norte de Santander', lat: 7.8939, lng: -72.5078 },
    { name: 'Ibagué', department: 'Tolima', lat: 4.4389, lng: -75.2322 },
    { name: 'Pasto', department: 'Nariño', lat: 1.2136, lng: -77.2811 },
    { name: 'Villavicencio', department: 'Meta', lat: 4.1420, lng: -73.6266 },
    { name: 'Montería', department: 'Córdoba', lat: 8.7479, lng: -75.8814 },
    { name: 'Valledupar', department: 'Cesar', lat: 10.4631, lng: -73.2532 },
    { name: 'Neiva', department: 'Huila', lat: 2.9273, lng: -75.2819 },
    { name: 'Sincelejo', department: 'Sucre', lat: 9.3047, lng: -75.3978 },
    { name: 'Popayán', department: 'Cauca', lat: 2.4448, lng: -76.6147 },
    { name: 'Armenia', department: 'Quindío', lat: 4.5339, lng: -75.6811 },
    { name: 'Tunja', department: 'Boyacá', lat: 5.5353, lng: -73.3678 }
  ];

  let nearestCity = null;
  let minDistance = Infinity;

  for (const city of colombianCities) {
    const distance = calculateDistance(lat, lng, city.lat, city.lng);
    if (distance !== null && distance < minDistance) {
      minDistance = distance;
      nearestCity = {
        name: city.name,
        department: city.department,
        distance: minDistance
      };
    }
  }

  // Solo retornar la ciudad si está dentro de un radio razonable (50km para mayor precisión)
  return minDistance <= 50 ? nearestCity : null;
}

/**
 * Valida y normaliza coordenadas de ubicación del usuario
 * @param {Object} userLocation - Objeto de ubicación del usuario
 * @returns {Object|null} - Coordenadas normalizadas o null si son inválidas
 */
export function validateAndNormalizeUserLocation(userLocation) {
  if (!userLocation) {
    return null;
  }

  // Intentar parsear si es string
  if (typeof userLocation === 'string') {
    try {
      userLocation = JSON.parse(userLocation);
    } catch (e) {
      console.error('Error parsing user location string:', e);
      return null;
    }
  }

  // Validar estructura del objeto
  if (typeof userLocation !== 'object') {
    return null;
  }

  // Extraer y convertir coordenadas
  let lat = userLocation.lat || userLocation.latitude;
  let lng = userLocation.lng || userLocation.longitude;

  // Convertir strings a números si es necesario
  if (typeof lat === 'string') lat = parseFloat(lat);
  if (typeof lng === 'string') lng = parseFloat(lng);

  // Validar coordenadas
  if (!isValidCoordinate(lat, lng)) {
    return null;
  }

  return {
    lat: Math.round(lat * 1000000) / 1000000, // Precisión de ~0.1m
    lng: Math.round(lng * 1000000) / 1000000
  };
}

/**
 * Genera un radio de búsqueda inteligente basado en el tipo de lugar y la densidad urbana
 * @param {string} placeType - Tipo de lugar
 * @param {string} city - Ciudad
 * @param {string} intent - Intento del usuario ('proximity' o 'general')
 * @returns {number} - Radio en metros
 */
export function getIntelligentSearchRadius(placeType, city, intent = 'general') {
  // Radios base por tipo de lugar (en metros)
  const baseRadii = {
    'lodging': 3000,      // Hoteles - radio más amplio
    'restaurant': 2000,   // Restaurantes - radio medio
    'bar': 1500,         // Bares - radio medio-pequeño
    'museum': 5000,      // Museos - radio amplio
    'attraction': 5000,   // Atracciones - radio amplio
    'beach': 10000,      // Playas - radio muy amplio
    'park': 3000         // Parques - radio medio-amplio
  };

  // Factores de ajuste por ciudad
  const cityFactors = {
    'cartagena': 0.8,    // Ciudad más compacta
    'bogotá': 1.2,       // Ciudad más extensa
    'medellín': 1.0,     // Tamaño medio
    'cali': 1.1,         // Relativamente extensa
    'barranquilla': 0.9, // Compacta
    'santa marta': 0.8   // Compacta
  };

  // Factor por intento del usuario
  const intentFactor = intent === 'proximity' ? 0.6 : 1.0;

  const baseRadius = baseRadii[placeType] || 2500; // Default 2.5km
  const cityFactor = cityFactors[city?.toLowerCase()] || 1.0;
  
  const adjustedRadius = baseRadius * cityFactor * intentFactor;
  
  // Límites mínimos y máximos
  return Math.max(500, Math.min(15000, adjustedRadius));
}

/**
 * Crea una clave de caché optimizada para búsquedas georreferenciadas
 * @param {Object} userLocation - Ubicación del usuario
 * @param {string} placeType - Tipo de lugar
 * @param {string} city - Ciudad
 * @param {number} radius - Radio de búsqueda
 * @param {string} sortBy - Criterio de ordenación
 * @returns {string} - Clave de caché
 */
export function createGeoCacheKey(userLocation, placeType, city, radius, sortBy) {
  if (!userLocation) {
    return `places:${city}:${placeType}:${sortBy}`;
  }

  // Redondear coordenadas para optimizar caché (precisión ~100m)
  const lat = Math.round(userLocation.lat * 1000) / 1000;
  const lng = Math.round(userLocation.lng * 1000) / 1000;
  
  return `geo:${lat},${lng}:${placeType}:${radius}:${sortBy}`;
}

/**
 * Obtiene la ubicación por dirección IP
 * @param {string} ipAddress - Dirección IP del usuario
 * @returns {Promise<Object>} - Información de ubicación
 */
export async function getLocationByIP(ipAddress) {
  try {
    // Usar un servicio gratuito de geolocalización por IP
    const response = await axios.get(`http://ip-api.com/json/${ipAddress}`, {
      timeout: 5000
    });
    
    if (response.data.status === 'success') {
      return {
        success: true,
        city: response.data.city,
        region: response.data.regionName,
        country: response.data.country,
        countryCode: response.data.countryCode,
        lat: response.data.lat,
        lng: response.data.lon,
        timezone: response.data.timezone,
        isp: response.data.isp
      };
    } else {
      return {
        success: false,
        error: 'No se pudo determinar la ubicación por IP'
      };
    }
  } catch (error) {
    console.error('Error obteniendo ubicación por IP:', error);
    return {
      success: false,
      error: 'Error del servicio de geolocalización'
    };
  }
}

/**
 * Detecta ubicación automáticamente desde la petición HTTP
 * @param {Object} req - Objeto request de Express
 * @returns {Promise<Object>} - Información de ubicación detectada
 */
export async function detectUserLocation(reqOrLocation) {
  try {
    let lat, lng, city;
    
    // 1. Verificar si recibimos coordenadas directamente o un objeto req completo
    if (reqOrLocation.lat && reqOrLocation.lng) {
      // Coordenadas directas
      lat = parseFloat(reqOrLocation.lat);
      lng = parseFloat(reqOrLocation.lng);
      city = reqOrLocation.city;
    } else if (reqOrLocation.body && reqOrLocation.body.location && reqOrLocation.body.location.lat && reqOrLocation.body.location.lng) {
      // Objeto req completo
      lat = parseFloat(reqOrLocation.body.location.lat);
      lng = parseFloat(reqOrLocation.body.location.lng);
      city = reqOrLocation.body.location.city;
    }
    
    // Si tenemos coordenadas, procesar
    if (lat && lng) {
      // Si no viene la ciudad, calcularla basada en las coordenadas
      if (!city || city === 'Ciudad no especificada') {
        const nearestCity = getNearestCity(lat, lng);
        if (nearestCity && nearestCity.name) {
          city = nearestCity.name;
        } else {
          // Si no se puede determinar la ciudad específica, usar una ciudad por defecto de Colombia
          city = 'Colombia';
        }
      }
      
      return {
        success: true,
        city: city,
        lat: lat,
        lng: lng,
        source: 'gps'
      };
    }
    
    // 2. Si no tenemos coordenadas, intentar con IP del usuario (solo si es un objeto req)
    if (reqOrLocation.ip || reqOrLocation.connection) {
      let userIP = reqOrLocation.ip || 
                   reqOrLocation.connection.remoteAddress || 
                   reqOrLocation.socket.remoteAddress ||
                   (reqOrLocation.connection.socket ? reqOrLocation.connection.socket.remoteAddress : null);
      
      // Limpiar la IP si viene con prefijo IPv6
      if (userIP && userIP.includes('::ffff:')) {
        userIP = userIP.replace('::ffff:', '');
      }
      
      // Si es localhost, usar una IP pública para pruebas
      if (!userIP || userIP === '127.0.0.1' || userIP === '::1') {
        userIP = '8.8.8.8'; // Google DNS para pruebas
      }
      
      const ipResult = await getLocationByIP(userIP);
      if (ipResult.success) {
        return {
          ...ipResult,
          source: 'ip'
        };
      }
    }
    
    // 3. Fallback a ubicación por defecto (Colombia)
    return {
      success: true,
      city: 'Bogotá',
      region: 'Cundinamarca',
      country: 'Colombia',
      countryCode: 'CO',
      lat: 4.7110,
      lng: -74.0721,
      source: 'fallback'
    };
    
  } catch (error) {
    console.error('Error detectando ubicación del usuario:', error);
    return {
      success: false,
      error: 'No se pudo detectar la ubicación'
    };
  }
}

/**
 * Valida si una ubicación está en Colombia
 * @param {Object} location - Objeto de ubicación
 * @returns {boolean} - True si está en Colombia
 */
export function isLocationInColombia(location) {
  if (!location) return false;
  
  // Verificar por código de país
  if (location.countryCode === 'CO') return true;
  
  // Verificar por nombre de país
  if (location.country && location.country.toLowerCase().includes('colombia')) return true;
  
  // Verificar por coordenadas (aproximadas de Colombia)
  if (location.lat && location.lng) {
    const isInColombiaCoords = 
      location.lat >= -4.2 && location.lat <= 12.5 &&
      location.lng >= -79 && location.lng <= -66.8;
    return isInColombiaCoords;
  }
  
  return false;
}

/**
 * Obtiene ciudades principales de Colombia
 * @returns {Array} - Lista de ciudades principales
 */
export function getColombianCities() {
  return [
    { name: 'Bogotá', lat: 4.7110, lng: -74.0721 },
    { name: 'Medellín', lat: 6.2442, lng: -75.5812 },
    { name: 'Cartagena', lat: 10.3910, lng: -75.4794 },
    { name: 'Cali', lat: 3.4516, lng: -76.5320 },
    { name: 'Barranquilla', lat: 10.9685, lng: -74.7813 },
    { name: 'Santa Marta', lat: 11.2408, lng: -74.1990 },
    { name: 'Bucaramanga', lat: 7.1254, lng: -73.1198 },
    { name: 'Pereira', lat: 4.8133, lng: -75.6961 },
    { name: 'Manizales', lat: 5.0703, lng: -75.5138 },
    { name: 'Ibagué', lat: 4.4389, lng: -75.2322 }
  ];
}

export default {
  calculateDistance,
  isValidCoordinate,
  formatDistance,
  sortPlacesByProximity,
  getPlacesWithinRadius,
  getNearestCity,
  validateAndNormalizeUserLocation,
  getIntelligentSearchRadius,
  createGeoCacheKey,
  getLocationByIP,
  detectUserLocation,
  isLocationInColombia,
  getColombianCities
};

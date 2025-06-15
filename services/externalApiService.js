// services/externalApiService.js (ES Modules)
import axios from 'axios';
import config from '../config/index.js';
import { ApiError } from '../middleware/errorHandler.js';

// Se reemplazará con el servicio de caché mejorado
import cacheService from './cacheService.js';

/**
 * Gets weather data for a specified city
 * @param {string} city - City name
 * @returns {Promise<Object|null>} Weather data object or null on error
 */
export async function getWeatherData(city) {
  const cacheKey = `weather:${city.toLowerCase()}`;
  
  return cacheService.getCachedData(
    cacheKey,
    async () => {
      try {
        const API_KEY = config.externalApis.weatherApiKey;
        if (!API_KEY) {
          throw new ApiError('Weather API key not configured', 500);
        }
        
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
        const response = await axios.get(url);
        
        return {
          temperature: Math.round(response.data.main.temp),
          description: response.data.weather[0].description,
          humidity: response.data.main.humidity,
          wind: response.data.wind.speed,
          icon: response.data.weather[0].icon,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error("Error fetching weather data:", error);
        if (error instanceof ApiError) throw error;
        
        if (error.response && error.response.status === 404) {
          throw new ApiError(`City '${city}' not found`, 404);
        }
        
        throw new ApiError('Failed to fetch weather data', 500);
      }
    },
    config.cache.weatherTtl,
    'weather'
  );
}

/**
 * Gets places from Google Maps Places API with enhanced geolocation support
 * @param {string} city - City to search in
 * @param {string} placeType - Type of place to search for
 * @param {string} language - Response language
 * @param {Object} userLocation - User's location coordinates
 * @param {string} sortBy - Sorting criteria ('proximity' or 'rating')
 * @param {number} radius - Search radius in meters (default: 5000)
 * @returns {Promise<Array|null>} - List of places or null on error
 */
export async function getPlacesFromGoogleMaps(city, placeType = 'tourist_attraction', language = 'en', userLocation = null, sortBy = 'rating', radius = 5000) {
  // Mapeo más exhaustivo de tipos de lugares a tipos específicos de Google Places
  const placeTypeMap = {
    // Hoteles y alojamiento
    'hotel': 'lodging',
    'hoteles': 'lodging',
    'alojamiento': 'lodging',
    'hospedaje': 'lodging',
    'hostales': 'lodging',
    'hostal': 'lodging',
    'resort': 'lodging',
    'posada': 'lodging',
    'chalé': 'lodging',
    'chalet': 'lodging',
    'cabaña': 'lodging',
    'cabañas': 'lodging',
    'apartamento': 'lodging',
    'apartamentos': 'lodging',
    'accommodation': 'lodging',
    
    // Restaurantes y comida
    'restaurant': 'restaurant',
    'restaurante': 'restaurant',
    'restaurantes': 'restaurant',
    'comida': 'restaurant',
    'comer': 'restaurant',
    'cafetería': 'cafe',
    'cafeteria': 'cafe',
    'café': 'cafe',
    'cafe': 'cafe',
    'food': 'restaurant',
    'dining': 'restaurant',
    
    // Bares y vida nocturna
    'bar': 'bar',
    'bares': 'bar',
    'pub': 'bar',
    'cantina': 'bar',
    'discoteca': 'night_club',
    'disco': 'night_club',
    'nightclub': 'night_club',
    'night_club': 'night_club',
    'club': 'night_club',
    'vida nocturna': 'night_club',
    
    // Museos y cultura
    'museum': 'museum',
    'museo': 'museum',
    'museums': 'museum',
    'museos': 'museum',
    'galería': 'art_gallery',
    'gallery': 'art_gallery',
    'arte': 'art_gallery',
    'art': 'art_gallery',
    
    // Atracciones y lugares turísticos
    'attraction': 'tourist_attraction',
    'atracciones': 'tourist_attraction',
    'turístico': 'tourist_attraction',
    'turistica': 'tourist_attraction',
    'tourist': 'tourist_attraction',
    'sightseeing': 'tourist_attraction',
    'monumentos': 'tourist_attraction',
    'monuments': 'tourist_attraction',
    'landmark': 'tourist_attraction',
    
    // Playas y naturaleza
    'beach': 'natural_feature',
    'playa': 'natural_feature',
    'playas': 'natural_feature',
    'costa': 'natural_feature',
    'mar': 'natural_feature',
    'ocean': 'natural_feature',
    
    // Parques
    'park': 'park',
    'parque': 'park',
    'parques': 'park',
    'jardín': 'park',
    'jardin': 'park',
    
    // Términos genéricos
    'lugares': 'tourist_attraction',
    'sitios': 'tourist_attraction',
    'places': 'tourist_attraction',
    'destinos': 'tourist_attraction',
    'destinations': 'tourist_attraction'
  };

  // Normalizar tipo de lugar y ciudad para la búsqueda
  const normalizedPlaceType = placeType.toLowerCase().trim();
  const normalizedCity = city.toLowerCase().trim();
  
  // Usar mapeo de tipos o valor por defecto según la categoría
  const mappedPlaceType = placeTypeMap[normalizedPlaceType] || 'tourist_attraction';
  
  // Validar datos de ubicación del usuario
  const hasValidLocation = userLocation && 
                          typeof userLocation.lat !== 'undefined' && 
                          typeof userLocation.lng !== 'undefined' &&
                          !isNaN(userLocation.lat) && 
                          !isNaN(userLocation.lng);
  
  // Determinar radio de búsqueda según tipo de ordenamiento
  let searchRadius = radius;
  if (sortBy === 'proximity' && hasValidLocation) {
    // Para búsquedas por proximidad, usar un radio más pequeño
    searchRadius = Math.min(radius, 5000); // Máximo 5km para búsquedas por proximidad
  } else {
    // Para búsquedas por calificación, usar un radio más amplio
    searchRadius = Math.max(radius, 10000); // Mínimo 10km para búsquedas por calificación
  }
  
  // Crear clave de caché apropiada
  let cacheKey;
  if (hasValidLocation && sortBy === 'proximity') {
    // Para búsquedas por proximidad, la ubicación es parte clave del caché
    const lat = Math.round(userLocation.lat * 1000) / 1000; // Aproximar a 3 decimales (~110m)
    const lng = Math.round(userLocation.lng * 1000) / 1000;
    cacheKey = `places:proximity:${lat},${lng}:${mappedPlaceType}:${language}:${searchRadius}`;
  } else {
    // Para búsquedas por calificación, la ciudad es clave
    cacheKey = `places:rating:${normalizedCity}:${mappedPlaceType}:${language}`;
  }
  
  console.log(`Cache key: ${cacheKey}`);
  
  // TTL depende del tipo de lugar - hoteles se cachean por más tiempo
  const ttl = (mappedPlaceType === 'lodging') 
    ? config.cache.placesHotelsTtl 
    : config.cache.placesTourismTtl;
  
  // Para búsquedas basadas en ubicación, usar TTL más corto
  const effectiveTtl = (hasValidLocation && sortBy === 'proximity') ? Math.min(ttl, 1800) : ttl;
  
  return cacheService.getCachedData(
    cacheKey,
    async () => {
      try {
        const API_KEY = config.externalApis.googleMapsApiKey;
        if (!API_KEY) {
          throw new ApiError('Google Maps API key not configured', 500);
        }
        
        let url;
        let searchType;
        let query;
        
        if (hasValidLocation && sortBy === 'proximity') {
          // Usar nearbysearch para búsquedas por proximidad
          searchType = 'nearby';
          url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${userLocation.lat},${userLocation.lng}&radius=${searchRadius}&type=${mappedPlaceType}&language=${language}&key=${API_KEY}`;
          console.log(`Búsqueda por proximidad desde ${userLocation.lat},${userLocation.lng} con radio ${searchRadius}m`);
        } else {
          // Usar textsearch para búsquedas por ciudad y calificación
          searchType = 'text';
          
          // Construir una consulta más precisa
          const typeLabel = getTypeLabel(mappedPlaceType, language);
          query = `${typeLabel} in ${city}`;
          
          url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=${mappedPlaceType}&language=${language}&key=${API_KEY}`;
          console.log(`Búsqueda por texto: "${query}", con tipo explícito: ${mappedPlaceType}`);
        }
        
        // Hacer la solicitud a la API
        console.log(`Solicitud a Google Places API (${searchType}Search)...`);
        const response = await axios.get(url);
        
        // Validar respuesta
        if (response.data.status !== 'OK') {
          console.error(`Error de Google Places API: ${response.data.status}`);
          throw new ApiError(`Error de Google Places API: ${response.data.status}`, 500);
        }
        
        const placesCount = response.data.results.length;
        console.log(`Recibidos ${placesCount} lugares de Google API`);
        
        if (placesCount === 0) {
          return [];
        }
        
        // Filtrar resultados por ciudad si es una búsqueda de proximidad
        let results = response.data.results;
        
        if (hasValidLocation && sortBy === 'proximity' && normalizedCity) {
          // Para búsquedas por proximidad, filtrar para asegurar que estén en la ciudad solicitada
          console.log(`Filtrando resultados para asegurar que están en ${normalizedCity}`);
          
          const filteredResults = results.filter(place => {
            const placeAddress = (place.formatted_address || place.vicinity || '').toLowerCase();
            return placeAddress.includes(normalizedCity);
          });
          
          // Si después de filtrar quedan muy pocos resultados, verificar si vale la pena
          if (filteredResults.length < 3 && results.length > 5) {
            console.log(`Muy pocos resultados después de filtrar (${filteredResults.length}). Manteniendo los originales.`);
          } else {
            results = filteredResults;
            console.log(`Resultados filtrados por ciudad: ${results.length}`);
          }
        }
        
        // Verificar tipos para asegurar la coincidencia de categoría
        const compatibleTypes = getCompatibleTypes(mappedPlaceType);
        results = results.filter(place => {
          if (!place.types || place.types.length === 0) return true;
          
          return place.types.some(type => compatibleTypes.includes(type));
        });
        
        console.log(`Resultados filtrados por tipo: ${results.length} del tipo ${mappedPlaceType}`);
        
        // Procesar los resultados con prioridad, distancias, etc.
        const processedResults = processPlacesResults(results, userLocation, normalizedCity, sortBy);
        return processedResults;
      } catch (error) {
        console.error("Error obteniendo lugares de Google Maps:", error);
        if (error instanceof ApiError) throw error;
        throw new ApiError('Error al obtener datos de lugares', 500);
      }
    },
    effectiveTtl,
    'places'
  );
}

/**
 * Procesa y mejora los datos de lugares de la API de Google
 * @param {Array} places - Datos crudos de lugares de la API de Google
 * @param {Object} userLocation - Coordenadas de ubicación del usuario
 * @param {string} city - Ciudad para filtrado
 * @param {string} sortBy - Criterio de ordenación ('proximity' o 'rating')
 * @returns {Array} - Datos de lugares mejorados
 */
function processPlacesResults(places, userLocation, city, sortBy = 'rating') {
  // Omitir procesamiento si no hay lugares
  if (!places || places.length === 0) {
    return [];
  }
  
  // Normalizar la ciudad para comparación
  const normalizedCity = city ? city.toLowerCase().trim() : null;
  
  // Validar ubicación del usuario para cálculos de distancia
  const hasValidLocation = userLocation && 
                         typeof userLocation.lat !== 'undefined' && 
                         typeof userLocation.lng !== 'undefined' &&
                         !isNaN(userLocation.lat) && 
                         !isNaN(userLocation.lng);
  
  // Filtrar por ciudad si se especificó
  let results = places;
  
  if (normalizedCity) {
    // Filtrar lugares por ciudad
    results = results.filter(place => {
      // Verificar si la dirección contiene el nombre de la ciudad
      const address = (place.formatted_address || place.vicinity || '').toLowerCase();
      return address.includes(normalizedCity);
    });
    
    console.log(`Filtrados a ${results.length} lugares en ${city}`);
  }
  
  // Agregar banderas de prioridad y calcular distancias
  results = results.map(place => {
    // Copiar el objeto place para evitar modificar el original
    const enhancedPlace = { ...place };
    
    // Preparar un objeto de ubicación normalizado
    enhancedPlace.location = {
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng
    };
    
    // Agregar bandera de prioridad (1=Premium, 3=Normal)
    enhancedPlace.priority = isPremiumPartner(place.place_id) ? 
      config.prioritySystem.levels.premium : 
      config.prioritySystem.levels.normal;
    
    // Calcular distancia si tenemos ubicación del usuario válida y coordenadas del lugar
    if (hasValidLocation && 
        place.geometry && 
        place.geometry.location) {
      
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        place.geometry.location.lat,
        place.geometry.location.lng
      );
      
      enhancedPlace.distance = distance;
      enhancedPlace.distance_text = formatDistance(distance);
    }
    
    // Extraer datos relevantes para el frontend
    enhancedPlace.place_id = place.place_id;
    enhancedPlace.name = place.name || 'Sin nombre';
    enhancedPlace.formatted_address = place.formatted_address || place.vicinity || '';
    enhancedPlace.rating = place.rating || 0;
    enhancedPlace.photos = place.photos || [];
    
    // Determinar si el lugar es verificado (premium)
    enhancedPlace.isVerified = enhancedPlace.priority === config.prioritySystem.levels.premium;
    
    return enhancedPlace;
  });
  
  // Agrupar por nivel de prioridad
  const premiumPlaces = results.filter(place => place.priority === config.prioritySystem.levels.premium);
  const normalPlaces = results.filter(place => place.priority !== config.prioritySystem.levels.premium);
  
  // Ordenar según criterio especificado
  if (sortBy === 'proximity' && hasValidLocation) {
    // Ordenar cada grupo por distancia
    premiumPlaces.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    normalPlaces.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    
    console.log(`Lugares ordenados por proximidad dentro de cada nivel de prioridad`);
  } else {
    // Ordenar por calificación (mayor primero)
    premiumPlaces.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    normalPlaces.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    
    console.log(`Lugares ordenados por calificación dentro de cada nivel de prioridad`);
  }
  
  // Combinar los grupos
  return [...premiumPlaces, ...normalPlaces];
}

/**
 * Verifica si un ID de lugar está en nuestra lista de socios premium
 * @param {string} placeId - ID de lugar de Google
 * @returns {boolean} - Verdadero si es socio premium
 */
function isPremiumPartner(placeId) {
  // En una implementación real, esto verificaría contra una base de datos
  // Por ahora, simularemos con una lista hardcoded
  const premiumPartnerIds = [
    'ChIJN1t_tDeuEmsRUsoyG83frY4', // ID de ejemplo, reemplazar con IDs reales en producción
    'ChIJP3Sa8ziYEmsRUKgyFmh9AQM'  // ID de ejemplo, reemplazar con IDs reales en producción
  ];
  
  return premiumPartnerIds.includes(placeId);
}

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine
 * @param {number} lat1 - Latitud del punto 1
 * @param {number} lon1 - Longitud del punto 1
 * @param {number} lat2 - Latitud del punto 2
 * @param {number} lon2 - Longitud del punto 2
 * @returns {number} - Distancia en kilómetros
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distancia en km
  
  return distance;
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
 * Formatea la distancia para mostrar
 * @param {number} distance - Distancia en kilómetros
 * @returns {string} - Cadena de distancia formateada
 */
function formatDistance(distance) {
  if (distance === undefined || distance === null) {
    return null;
  }
  
  if (distance < 1) {
    // Convertir a metros para distancias menores a 1km
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 10) {
    // Hasta 10km, mostrar un decimal
    return `${distance.toFixed(1)}km`;
  } else {
    // Para distancias mayores, redondear a entero
    return `${Math.round(distance)}km`;
  }
}

/**
 * Obtiene una etiqueta legible según el tipo y el idioma
 * @param {string} placeType - Tipo de lugar
 * @param {string} language - Código de idioma
 * @returns {string} - Etiqueta legible
 */
function getTypeLabel(placeType, language) {
  if (language === 'es') {
    const spanishLabels = {
      'lodging': 'hoteles',
      'restaurant': 'restaurantes',
      'bar': 'bares',
      'museum': 'museos',
      'natural_feature': 'playas',
      'tourist_attraction': 'atracciones turísticas',
      'park': 'parques',
      'night_club': 'discotecas'
    };
    return spanishLabels[placeType] || 'lugares';
  } else {
    const englishLabels = {
      'lodging': 'hotels',
      'restaurant': 'restaurants',
      'bar': 'bars',
      'museum': 'museums',
      'natural_feature': 'beaches',
      'tourist_attraction': 'tourist attractions',
      'park': 'parks',
      'night_club': 'night clubs'
    };
    return englishLabels[placeType] || 'places';
  }
}

/**
 * Obtiene tipos compatibles para verificación
 * @param {string} placeType - Tipo de lugar principal
 * @returns {Array<string>} - Lista de tipos compatibles
 */
function getCompatibleTypes(placeType) {
  // Mapeo de tipos de lugares a tipos compatibles en la API de Google
  const typeCompatibilityMap = {
    'lodging': ['lodging', 'hotel', 'resort', 'hostel'],
    'restaurant': ['restaurant', 'food', 'meal_takeaway', 'meal_delivery', 'cafe'],
    'bar': ['bar', 'night_club'],
    'museum': ['museum', 'art_gallery'],
    'natural_feature': ['natural_feature', 'beach', 'point_of_interest'],
    'tourist_attraction': ['tourist_attraction', 'point_of_interest', 'landmark'],
    'park': ['park', 'amusement_park', 'campground', 'natural_feature', 'point_of_interest'],
    'night_club': ['night_club', 'bar']
  };
  
  return typeCompatibilityMap[placeType] || [placeType, 'point_of_interest'];
}

/**
 * Crea una reserva (conectaría con un sistema real de reservas en producción)
 * @param {string} placeId - ID del lugar a reservar
 * @param {string} userName - Nombre del usuario que hace la reserva
 * @param {string} checkIn - Fecha de entrada (YYYY-MM-DD)
 * @param {string} checkOut - Fecha de salida (YYYY-MM-DD)
 * @returns {Object} - Resultado de la reserva
 */
export function createReservation(placeId, userName, checkIn, checkOut) {
  // Esto conectaría con un sistema real de reservas en producción
  // Por ahora, es solo un placeholder que simula una reserva exitosa
  return {
    success: true,
    reservationId: `RES-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    message: `Reserva creada para ${userName} en el lugar ID ${placeId}, del ${checkIn} al ${checkOut}.`,
    details: {
      placeId,
      userName,
      checkIn,
      checkOut,
      status: 'CONFIRMADO',
      timestamp: new Date().toISOString(),
      discount: '10%' // Descuento aplicado
    }
  };
}
// services/externalApiService.js (ES Modules)
import axios from 'axios';
import config from '../config/index.js';
import { ApiError } from '../middleware/errorHandler.js';
import cacheService from './cacheService.js';
import geolocationService from './geolocationService.js';

/**
 * Gets weather data for a specified city
 * @param {string} city - City name
 * @returns {Promise<Object|null>} Weather data object or null on error
 */
export async function getWeatherData(city) {
  // Ensure city is a string
  if (!city || typeof city !== 'string') {
    throw new ApiError('City name must be a valid string', 400);
  }
  
  const cityStr = city.trim();
  if (!cityStr) {
    throw new ApiError('City name cannot be empty', 400);
  }
  
  const cacheKey = `weather:${cityStr.toLowerCase()}`;
  
  return cacheService.getCachedData(
    cacheKey,
    async () => {
      try {
        const API_KEY = config.externalApis.weatherApiKey;
        if (!API_KEY) {
          throw new ApiError('Weather API key not configured', 500);
        }
        
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${cityStr}&appid=${API_KEY}&units=metric`;
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
          throw new ApiError(`City '${cityStr}' not found`, 404);
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
 * @param {number} radius - Search radius in meters (default: intelligent radius)
 * @returns {Promise<Array|null>} - List of places or null on error
 */
export async function getPlacesFromGoogleMaps(city, placeType = 'tourist_attraction', language = 'en', userLocation = null, sortBy = 'rating', radius = null) {
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
  
  // Usar mapeo de tipos o mantener el tipo original si ya es un tipo válido de Google Places
  const validGoogleTypes = ['lodging', 'restaurant', 'tourist_attraction', 'bank', 'pharmacy', 'gas_station', 'store', 'bar', 'night_club', 'museum', 'art_gallery', 'park', 'natural_feature', 'cafe'];
  const mappedPlaceType = placeTypeMap[normalizedPlaceType] || (validGoogleTypes.includes(normalizedPlaceType) ? normalizedPlaceType : 'tourist_attraction');
  
  // Validar y normalizar ubicación del usuario
  const validatedLocation = geolocationService.validateAndNormalizeUserLocation(userLocation);
  const hasValidLocation = validatedLocation !== null;
  
  // Determinar radio de búsqueda inteligente
  const searchRadius = radius || geolocationService.getIntelligentSearchRadius(
    mappedPlaceType, 
    normalizedCity, 
    sortBy === 'proximity' ? 'proximity' : 'general'
  );
  
  console.log(`🔍 Búsqueda configurada: tipo=${mappedPlaceType}, ciudad=${normalizedCity}, radio=${searchRadius}m, ordenar por=${sortBy}`);
  if (hasValidLocation) {
    console.log(`📍 Ubicación usuario: ${validatedLocation.lat}, ${validatedLocation.lng}`);
  }
  
  // Crear clave de caché optimizada
  const cacheKey = geolocationService.createGeoCacheKey(
    validatedLocation,
    mappedPlaceType,
    normalizedCity,
    searchRadius,
    sortBy
  );
  
  console.log(`💾 Cache key: ${cacheKey}`);
  
  // TTL depende del tipo de lugar y la búsqueda
  const baseTtl = (mappedPlaceType === 'lodging') 
    ? config.cache.placesHotelsTtl 
    : config.cache.placesTourismTtl;
  
  // Para búsquedas basadas en ubicación, usar TTL más corto para datos más frescos
  const effectiveTtl = (hasValidLocation && sortBy === 'proximity') ? Math.min(baseTtl, 1800) : baseTtl;
  
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
          url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${validatedLocation.lat},${validatedLocation.lng}&radius=${searchRadius}&type=${mappedPlaceType}&language=${language}&key=${API_KEY}`;
          console.log(`🎯 Búsqueda por proximidad desde ${validatedLocation.lat},${validatedLocation.lng} con radio ${searchRadius}m`);
        } else {
          // Usar textsearch para búsquedas por ciudad y calificación
          searchType = 'text';
          
          // Construir una consulta más precisa
          const typeLabel = getTypeLabel(mappedPlaceType, language);
          query = `${typeLabel} in ${city}`;
          
          url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=${mappedPlaceType}&language=${language}&key=${API_KEY}`;
          console.log(`🔍 Búsqueda por texto: "${query}", con tipo explícito: ${mappedPlaceType}`);
        }
        
        // Hacer la solicitud a la API
        console.log(`📡 Solicitud a Google Places API (${searchType}Search)...`);
        const response = await axios.get(url);
        
        // Validar respuesta
        if (response.data.status !== 'OK') {
          console.error(`❌ Error de Google Places API: ${response.data.status}`);
          throw new ApiError(`Error de Google Places API: ${response.data.status}`, 500);
        }
        
        const placesCount = response.data.results.length;
        console.log(`✅ Recibidos ${placesCount} lugares de Google API`);
        
        if (placesCount === 0) {
          return [];
        }
        
        // Filtrar resultados por ciudad si es una búsqueda de proximidad
        let results = response.data.results;
        
        if (hasValidLocation && sortBy === 'proximity' && normalizedCity) {
          // Para búsquedas por proximidad, filtrar para asegurar que estén en la ciudad solicitada
          console.log(`🔍 Filtrando resultados para asegurar que están en ${normalizedCity}`);
          
          const filteredResults = results.filter(place => {
            const placeAddress = (place.formatted_address || place.vicinity || '').toLowerCase();
            return placeAddress.includes(normalizedCity);
          });
          
          // Si después de filtrar quedan muy pocos resultados, verificar si vale la pena
          if (filteredResults.length < 3 && results.length > 5) {
            console.log(`⚠️ Muy pocos resultados después de filtrar (${filteredResults.length}). Manteniendo los originales.`);
          } else {
            results = filteredResults;
            console.log(`✅ Resultados filtrados por ciudad: ${results.length}`);
          }
        }
        
        // Verificar tipos para asegurar la coincidencia de categoría
        const compatibleTypes = getCompatibleTypes(mappedPlaceType);
        results = results.filter(place => {
          if (!place.types || place.types.length === 0) return true;
          
          return place.types.some(type => compatibleTypes.includes(type));
        });
        
        console.log(`🎯 Resultados filtrados por tipo: ${results.length} del tipo ${mappedPlaceType}`);
        
        // Procesar los resultados con prioridad, distancias, etc.
        const processedResults = processPlacesResults(results, validatedLocation, normalizedCity, sortBy);
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
 * Búsqueda georreferenciada inteligente que combina datos de Google Places y negocios premium
 * @param {Object} userLocation - Coordenadas del usuario {lat, lng}
 * @param {string} placeType - Tipo de lugar a buscar
 * @param {string} language - Idioma de respuesta
 * @param {number} radius - Radio de búsqueda en metros
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>} - Lista combinada de lugares cercanos
 */
export async function getPlacesNearUser(userLocation, placeType = 'restaurant', language = 'es', radius = 3000, limit = 15) {
  // Validar ubicación del usuario
  const validatedLocation = geolocationService.validateAndNormalizeUserLocation(userLocation);
  
  if (!validatedLocation) {
    throw new ApiError('Ubicación del usuario no válida', 400);
  }
  
  console.log(`🎯 Búsqueda georreferenciada: tipo=${placeType}, radio=${radius}m, límite=${limit}`);
  
  // Determinar la ciudad más cercana
  const nearestCityData = geolocationService.getNearestCity(validatedLocation.lat, validatedLocation.lng);
  
  if (!nearestCityData) {
    console.log('❌ No se pudo determinar la ciudad más cercana');
    throw new ApiError('No se pudo determinar la ubicación dentro de Colombia', 400);
  }
  
  const nearestCity = nearestCityData.name;
  console.log(`📍 Ciudad determinada: ${nearestCity} (${nearestCityData.department})`);
  
  // Buscar en Google Places con radio inteligente
  const googlePlaces = await getPlacesFromGoogleMaps(
    nearestCity,
    placeType,
    language,
    validatedLocation,
    'proximity',
    radius
  );
  
  // Buscar negocios premium cercanos (importar función desde premiumBusinessService)
  const { findNearbyPremiumBusinesses } = await import('./premiumBusinessService.js');
  const premiumPlaces = findNearbyPremiumBusinesses(
    validatedLocation,
    placeType,
    radius / 1000, // Convertir a km
    Math.ceil(limit / 3) // Reservar 1/3 para premium
  );
  
  // Combinar resultados
  let combinedResults = [];
  
  // Agregar lugares premium primero
  premiumPlaces.forEach(place => {
    combinedResults.push({
      ...place,
      source: 'premium',
      isPremium: true,
      isVerified: true
    });
  });
  
  // Agregar lugares de Google, evitando duplicados por nombre
  const existingNames = new Set(combinedResults.map(p => p.name.toLowerCase()));
  
  googlePlaces.forEach(place => {
    const placeName = place.name.toLowerCase();
    if (!existingNames.has(placeName)) {
      combinedResults.push({
        ...place,
        source: 'google',
        isPremium: false,
        isVerified: place.isVerified || false
      });
      existingNames.add(placeName);
    }
  });
  
  // Ordenar por prioridad y distancia con límite estricto de 5km
  combinedResults = geolocationService.sortPlacesByProximity(combinedResults, validatedLocation, 5); // Máximo 5km
  
  // Aplicar límite final estricto
  const finalResults = combinedResults.slice(0, limit);
  
  console.log(`✅ Búsqueda completada: ${finalResults.length} lugares encontrados (${premiumPlaces.length} premium, ${finalResults.length - premiumPlaces.length} Google)`);
  console.log(`📏 Todos los resultados están dentro de 5km y ordenados por proximidad`);

  // Agregar metadatos de distancia formateada a cada lugar
  finalResults.forEach(place => {
    if (!place.distance_formatted && place.distance) {
      place.distance_formatted = geolocationService.formatDistance(place.distance, language);
    }
  });
  
  return finalResults;
}

/**
 * Procesa y mejora los datos de lugares de la API de Google con geolocalización optimizada
 * @param {Array} places - Datos crudos de lugares de la API de Google
 * @param {Object} userLocation - Coordenadas validadas de ubicación del usuario
 * @param {string} city - Ciudad para filtrado
 * @param {string} sortBy - Criterio de ordenación ('proximity' o 'rating')
 * @returns {Array} - Datos de lugares mejorados
 */
function processPlacesResults(places, userLocation, city, sortBy = 'rating') {
  // Omitir procesamiento si no hay lugares
  if (!places || places.length === 0) {
    return [];
  }
  
  console.log(`🔧 Procesando ${places.length} lugares...`);
  
  // Normalizar la ciudad para comparación
  const normalizedCity = city ? city.toLowerCase().trim() : null;
  
  // Procesar lugares y agregar metadatos
  let results = places.map(place => {
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
  
  // Filtrar por ciudad si se especificó y no es una búsqueda por proximidad
  if (normalizedCity && sortBy !== 'proximity') {
    const initialCount = results.length;
    results = results.filter(place => {
      // Verificar si la dirección contiene el nombre de la ciudad
      const address = (place.formatted_address || place.vicinity || '').toLowerCase();
      return address.includes(normalizedCity);
    });
    
    console.log(`🏙️ Filtrados por ciudad de ${initialCount} a ${results.length} lugares`);
  }
  
  // Procesar con geolocalización si tenemos ubicación del usuario
  if (userLocation) {
    console.log(`📏 Calculando distancias desde: ${userLocation.lat}, ${userLocation.lng}`);
    
    results = results.map(place => {
      if (!place.location || !place.location.lat || !place.location.lng) {
        return {
          ...place,
          distance: Infinity,
          distance_text: 'Sin ubicación'
        };
      }
      
      const distance = geolocationService.calculateDistance(
        userLocation.lat,
        userLocation.lng,
        place.location.lat,
        place.location.lng
      );
      
      return {
        ...place,
        distance: distance || Infinity,
        distance_text: geolocationService.formatDistance(distance, 'es')
      };
    });
  }
  
  // Ordenar según criterio especificado usando el servicio de geolocalización
  if (sortBy === 'proximity' && userLocation) {
    // Usar el servicio de geolocalización para ordenar por proximidad
    results = geolocationService.sortPlacesByProximity(results, userLocation);
    console.log(`🎯 Lugares ordenados por proximidad`);
  } else {
    // Agrupar por nivel de prioridad y ordenar cada grupo
    const premiumPlaces = results.filter(place => place.priority === config.prioritySystem.levels.premium);
    const normalPlaces = results.filter(place => place.priority !== config.prioritySystem.levels.premium);
    
    // Ordenar por calificación (mayor primero)
    premiumPlaces.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    normalPlaces.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    
    // Combinar los grupos
    results = [...premiumPlaces, ...normalPlaces];
    console.log(`⭐ Lugares ordenados por calificación dentro de cada nivel de prioridad`);
  }
  
  console.log(`✅ Procesamiento completado: ${results.length} lugares`);
  return results;
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

/**
 * Obtiene detalles completos de un lugar específico de Google Places
 * @param {string} placeId - ID del lugar de Google Places
 * @returns {Promise<Object|null>} - Detalles del lugar o null si hay error
 */
export async function getPlaceDetails(placeId) {
  if (!placeId) return null;
  
  const cacheKey = `place_details:${placeId}`;
  
  return cacheService.getCachedData(
    cacheKey,
    async () => {
      try {
        const API_KEY = config.externalApis.googleMapsApiKey;
        if (!API_KEY) {
          console.warn('Google Maps API key not configured');
          return null;
        }
        
        const fields = [
          'formatted_phone_number',
          'international_phone_number', 
          'website',
          'opening_hours',
          'url',
          'price_level',
          'user_ratings_total'
        ].join(',');
        
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${API_KEY}`;
        
        console.log(`📞 Obteniendo detalles para lugar ID: ${placeId}`);
        
        const response = await axios.get(url);
        
        if (response.data.status === 'OK') {
          const details = response.data.result;
          return {
            phone: details.formatted_phone_number || details.international_phone_number || null,
            website: details.website || null,
            opening_hours: details.opening_hours?.weekday_text || null,
            google_url: details.url || null,
            price_level: details.price_level || null,
            user_ratings_total: details.user_ratings_total || null
          };
        } else {
          console.warn(`Error obteniendo detalles: ${response.data.status}`);
          return null;
        }
        
      } catch (error) {
        console.error(`Error obteniendo detalles del lugar ${placeId}:`, error.message);
        return null;
      }
    },
    86400, // Cache por 24 horas
    'place_details'
  );
}

/**
 * Obtiene detalles completos para múltiples lugares de forma optimizada
 * @param {Array} places - Array de lugares con place_id
 * @param {number} maxPlaces - Máximo número de lugares a procesar (para optimizar costos)
 * @returns {Promise<Array>} - Array de lugares con detalles completos
 */
export async function getPlacesWithDetails(places, maxPlaces = 6) {
  if (!places || places.length === 0) return [];
  
  console.log(`📞 Obteniendo detalles para ${Math.min(places.length, maxPlaces)} lugares...`);
  
  // Limitar y priorizar por rating
  const limitedPlaces = places
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, maxPlaces);
  
  const placesWithDetails = await Promise.allSettled(
    limitedPlaces.map(async (place) => {
      if (!place.place_id) {
        console.warn(`Lugar sin place_id: ${place.name}`);
        return place;
      }
      
      try {
        const details = await getPlaceDetails(place.place_id);
        
        if (details) {
          return {
            ...place,
            phone: details.phone,
            website: details.website,
            opening_hours: details.opening_hours,
            google_url: details.google_url,
            price_level: details.price_level,
            user_ratings_total: details.user_ratings_total
          };
        } else {
          return place;
        }
        
      } catch (error) {
        console.error(`Error procesando detalles para ${place.name}:`, error.message);
        return place;
      }
    })
  );
  
  // Extraer solo los valores resueltos exitosamente
  const successfulResults = placesWithDetails
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);
  
  console.log(`✅ Detalles obtenidos para ${successfulResults.length} lugares`);
  
  return successfulResults;
}
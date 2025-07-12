// controllers/geolocationController.js
import { getPlacesNearUser, getPlacesFromGoogleMaps } from '../services/externalApiService.js';
import { findNearbyPremiumBusinesses } from '../services/premiumBusinessService.js';
import geolocationService from '../services/geolocationService.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * Controlador principal para búsquedas georreferenciadas optimizadas
 */

/**
 * Procesa consultas con intención de proximidad ("cerca de mí", "hoteles cercanos", etc.)
 * @param {string} userMessage - Mensaje del usuario
 * @param {Object} userLocation - Coordenadas del usuario {lat, lng}
 * @param {Object} queryAnalysis - Análisis de la consulta
 * @returns {Promise<Object>} - Resultado de la búsqueda georreferenciada
 */
export async function handleProximityQuery(userMessage, userLocation, queryAnalysis) {
  console.log('🎯 Procesando consulta de proximidad...');
  
  // Validar ubicación del usuario
  const validatedLocation = geolocationService.validateAndNormalizeUserLocation(userLocation);
  
  if (!validatedLocation) {
    return {
      error: 'Location required for proximity searches',
      requiresLocation: true
    };
  }
  
  // Determinar parámetros de búsqueda - RADIO FIJO 5KM
  const placeType = queryAnalysis.businessCategory || 'restaurant';
  const radius = 5000; // Radio fijo de 5km para búsquedas basadas en ubicación del navegador
  
  console.log(`📍 Búsqueda: tipo=${placeType}, radio=${radius}m (5km) desde ${validatedLocation.lat}, ${validatedLocation.lng}`);
  
  try {
    // Realizar búsqueda georreferenciada combinada
    const places = await getPlacesNearUser(
      validatedLocation,
      placeType,
      'es', // Usar idioma por defecto - OpenAI manejará la respuesta en el idioma correcto
      radius,
      15 // Límite de resultados
    );
    
    // Generar respuesta contextual básica
    const responseText = generateProximityResponse(places, placeType, radius);
    
    return {
      success: true,
      response: responseText,
      places: places,
      searchRadius: radius,
      totalFound: places.length,
      searchParams: {
        location: validatedLocation,
        placeType: placeType,
        radius: radius,
        resultsCount: places.length
      }
    };
    
  } catch (error) {
    console.error('❌ Error en búsqueda de proximidad:', error);
    
    return {
      error: 'Could not find nearby places at the moment. Please try again.',
      places: []
    };
  }
}

/**
 * Genera texto de respuesta contextual para búsquedas de proximidad
 * @param {Array} places - Lugares encontrados
 * @param {string} placeType - Tipo de lugar buscado
 * @param {number} radius - Radio de búsqueda
 * @returns {string} - Texto de respuesta
 */
function generateProximityResponse(places, placeType, radius) {
  if (places.length === 0) {
    return `No places found near your current location for "${placeType}".`;
  }
  
  const premiumCount = places.filter(p => p.isPremium).length;
  const radiusKm = Math.round(radius / 1000 * 10) / 10;
  
  let response = `Found ${places.length} ${placeType} within ${radiusKm}km of your location`;
  
  if (premiumCount > 0) {
    response += `, including ${premiumCount} verified place${premiumCount > 1 ? 's' : ''}`;
  }
  
  response += '. Here are the closest ones:\n\n';
  
  // Agregar los 3 más cercanos con detalles
  places.slice(0, 3).forEach((place, index) => {
    response += `${index + 1}. **${place.name}**`;
    if (place.isPremium) response += ' ✅';
    if (place.distance_text) response += ` (${place.distance_text})`;
    if (place.rating) response += ` - ⭐ ${place.rating}`;
    response += '\n';
    if (place.formatted_address) response += `   📍 ${place.formatted_address}\n`;
  });
  
  return response;
}

/**
 * Determina el radio de búsqueda basado en el contexto de la consulta
 * @param {string} userMessage - Mensaje del usuario
 * @param {string} placeType - Tipo de lugar
 * @returns {number} - Radio en metros
 */
export function getContextualSearchRadius(userMessage, placeType) {
  const lowerMessage = userMessage.toLowerCase();
  
  // Palabras clave que indican búsqueda muy local
  const veryLocalKeywords = ['caminando', 'walking', 'a pie', 'muy cerca', 'very close'];
  
  // Palabras clave que indican búsqueda más amplia
  const broaderKeywords = ['en la ciudad', 'in the city', 'cualquier lugar', 'anywhere'];
  
  if (veryLocalKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 1000; // 1km para búsquedas muy locales
  }
  
  if (broaderKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 10000; // 10km para búsquedas amplias
  }
  
  // Usar radio inteligente basado en tipo de lugar
  return geolocationService.getIntelligentSearchRadius(placeType, null, 'proximity');
}

/**
 * Mejora los datos de lugares con información adicional de contexto
 * @param {Array} places - Lugares a mejorar
 * @param {Object} userLocation - Ubicación del usuario
 * @returns {Array} - Lugares mejorados
 */
export function enhancePlacesWithContext(places, userLocation) {
  return places.map(place => {
    const enhanced = { ...place };
    
    // Agregar información de accesibilidad
    if (place.distance !== undefined && place.distance < 0.5) {
      enhanced.walkingTime = '5 min walk';
    } else if (place.distance !== undefined && place.distance < 1) {
      enhanced.walkingTime = '10-15 min walk';
    }
    
    // Agregar contexto de popularidad
    if (place.rating >= 4.5) {
      enhanced.popularityLevel = 'Very popular';
    } else if (place.rating >= 4.0) {
      enhanced.popularityLevel = 'Popular';
    }
    
    return enhanced;
  });
}

/**
 * Analiza si una consulta tiene intención de proximidad
 * @param {string} userMessage - Mensaje del usuario
 * @returns {boolean} - True si es una consulta de proximidad
 */
export function isProximityQuery(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  
  const proximityKeywords = [
    'cerca de mí', 'cerca de mi', 'cercano', 'cercana', 'cercanos', 'cercanas',
    'próximo', 'proxima', 'próximos', 'proximos', 'cerca', 'aquí cerca',
    'aqui cerca', 'a poca distancia', 'en los alrededores', 'alrededor',
    'en la zona', 'por aquí', 'por aqui', 'nearby', 'close to me',
    'near me', 'near my location', 'closest', 'nearby', 'close to me',
    'around here', 'in the area', 'walking distance', 'proximity',
    'nearest', 'close by', 'around me'
  ];
  
  return proximityKeywords.some(keyword => lowerMessage.includes(keyword));
}

export default {
  handleProximityQuery,
  isProximityQuery,
  getContextualSearchRadius,
  enhancePlacesWithContext
};

// services/realTimeProximityService.js

/**
 * Servicio especializado para búsquedas en tiempo real y por cercanía
 * Detecta frases como "cerca de mí", "ahora", "abierto" y optimiza búsquedas
 */

import geolocationService from './geolocationService.js';
import { getPlacesNearUser } from './externalApiService.js';

/**
 * Palabras clave que indican búsquedas en tiempo real y proximidad
 */
const PROXIMITY_KEYWORDS = {
  spanish: [
    'cerca de mí', 'cerca de mi', 'cerca de aquí', 'cerca de aca', 'cerca',
    'al lado', 'próximo', 'proximo', 'cercano', 'por aquí', 'por aca',
    'en mi ubicación', 'en mi zona', 'donde estoy', 'aquí cerca', 'aca cerca'
  ],
  english: [
    'near me', 'close to me', 'nearby', 'around here', 'close by',
    'in my area', 'where i am', 'around my location', 'next to me'
  ]
};

const TIME_KEYWORDS = {
  spanish: [
    'ahora', 'ahorita', 'en este momento', 'ahora mismo', 'ya', 'inmediatamente',
    'hoy', 'esta noche', 'esta tarde', 'esta mañana', 'este momento',
    'disponible ahora', 'abierto ahora', 'abierto', 'disponible',
    'que esté abierto', 'que este abierto', 'funcionando ahora'
  ],
  english: [
    'now', 'right now', 'at this moment', 'currently', 'today', 'tonight',
    'this afternoon', 'this morning', 'open now', 'available now',
    'that is open', 'currently open', 'open today'
  ]
};

const PLACE_CATEGORIES = {
  hotels: {
    keywords: ['hotel', 'hotels', 'hostal', 'hostales', 'hospedaje', 'alojamiento', 'donde hospedarme', 'donde quedarme'],
    googleTypes: ['lodging', 'hotel'],
    defaultRadius: 5000 // 5km para hoteles (fijo en 5km como requerido)
  },
  restaurants: {
    keywords: ['restaurante', 'restaurantes', 'comida', 'comer', 'almorzar', 'cenar', 'restaurant', 'food', 'eat', 'lunch', 'dinner'],
    googleTypes: ['restaurant', 'meal_takeaway', 'food'],
    defaultRadius: 5000 // 5km para restaurantes (fijo en 5km como requerido)
  },
  bars: {
    keywords: ['bar', 'bares', 'tomar', 'copa', 'cerveza', 'trago', 'bebida', 'vida nocturna', 'nightlife', 'drink', 'cocktail'],
    googleTypes: ['bar', 'night_club', 'liquor_store'],
    defaultRadius: 5000 // 5km para bares (fijo en 5km como requerido)
  },
  museums: {
    keywords: ['museo', 'museos', 'cultura', 'cultural', 'exposición', 'exposicion', 'arte', 'museum', 'exhibition', 'art', 'gallery'],
    googleTypes: ['museum', 'art_gallery', 'cultural_center'],
    defaultRadius: 5000 // 5km para museos (fijo en 5km como requerido)
  },
  tourist_attractions: {
    keywords: ['turistico', 'turístico', 'atracción', 'atraccion', 'sitio', 'lugar', 'visitar', 'pasear', 'tourist', 'attraction', 'sightseeing'],
    googleTypes: ['tourist_attraction', 'amusement_park', 'zoo', 'aquarium'],
    defaultRadius: 5000 // 5km para atracciones (fijo en 5km como requerido)
  },
  shopping: {
    keywords: ['tienda', 'tiendas', 'comprar', 'shopping', 'centro comercial', 'mall', 'shop', 'store', 'buy'],
    googleTypes: ['shopping_mall', 'store', 'clothing_store', 'department_store'],
    defaultRadius: 5000 // 5km para compras (fijo en 5km como requerido)
  },
  cafes: {
    keywords: ['café', 'cafe', 'cafetería', 'cafeteria', 'coffee', 'desayuno', 'breakfast'],
    googleTypes: ['cafe', 'bakery'],
    defaultRadius: 5000 // 5km para cafés (fijo en 5km como requerido)
  }
};

/**
 * Detecta si una consulta es de tiempo real y proximidad
 * @param {string} message - Mensaje del usuario
 * @returns {Object} - Análisis de la consulta
 */
export function analyzeRealTimeProximityQuery(message) {
  const lowerMessage = message.toLowerCase();
  
  // Detectar indicadores de proximidad
  const hasProximityIndicator = [
    ...PROXIMITY_KEYWORDS.spanish,
    ...PROXIMITY_KEYWORDS.english
  ].some(keyword => lowerMessage.includes(keyword));
  
  // Detectar indicadores de tiempo real
  const hasTimeIndicator = [
    ...TIME_KEYWORDS.spanish,
    ...TIME_KEYWORDS.english
  ].some(keyword => lowerMessage.includes(keyword));
  
  // Detectar categoría de lugar
  let detectedCategory = null;
  let categoryInfo = null;
  
  for (const [category, info] of Object.entries(PLACE_CATEGORIES)) {
    if (info.keywords.some(keyword => lowerMessage.includes(keyword))) {
      detectedCategory = category;
      categoryInfo = info;
      break;
    }
  }
  
  // Detectar idioma
  const isSpanish = /[ñáéíóúü]/.test(message) || 
    ['qué', 'dónde', 'cómo', 'cuándo', 'donde'].some(word => 
      lowerMessage.includes(word)
    );
  
  return {
    isRealTimeQuery: hasTimeIndicator,
    isProximityQuery: hasProximityIndicator,
    isRealTimeProximityQuery: hasTimeIndicator && hasProximityIndicator,
    category: detectedCategory,
    categoryInfo,
    language: isSpanish ? 'es' : 'en',
    urgency: calculateUrgency(lowerMessage),
    confidence: calculateConfidence(hasProximityIndicator, hasTimeIndicator, detectedCategory)
  };
}

/**
 * Calcula el nivel de urgencia de la consulta
 * @param {string} lowerMessage - Mensaje en minúsculas
 * @returns {string} - Nivel de urgencia
 */
function calculateUrgency(lowerMessage) {
  const highUrgencyKeywords = ['ahora mismo', 'urgente', 'inmediatamente', 'ya', 'right now', 'immediately', 'urgent'];
  const mediumUrgencyKeywords = ['ahora', 'hoy', 'esta noche', 'now', 'today', 'tonight'];
  
  if (highUrgencyKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'high';
  } else if (mediumUrgencyKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'medium';
  }
  return 'low';
}

/**
 * Calcula la confianza de la detección
 * @param {boolean} hasProximity - Tiene indicadores de proximidad
 * @param {boolean} hasTime - Tiene indicadores de tiempo
 * @param {string} category - Categoría detectada
 * @returns {number} - Confianza entre 0 y 1
 */
function calculateConfidence(hasProximity, hasTime, category) {
  let confidence = 0;
  
  if (hasProximity) confidence += 0.4;
  if (hasTime) confidence += 0.3;
  if (category) confidence += 0.3;
  
  return Math.min(confidence, 1);
}

/**
 * Ejecuta búsqueda optimizada para consultas en tiempo real
 * @param {Object} analysis - Análisis de la consulta
 * @param {Object} userLocation - Ubicación del usuario
 * @param {string} originalMessage - Mensaje original
 * @returns {Promise<Object>} - Resultados optimizados
 */
export async function executeRealTimeProximitySearch(analysis, userLocation, originalMessage) {
  if (!userLocation || !userLocation.lat || !userLocation.lng) {
    throw new Error('Se requiere ubicación para búsquedas en tiempo real');
  }
  
  const { category, categoryInfo, urgency, language } = analysis;
  
  // Determinar parámetros de búsqueda optimizados
  const searchParams = {
    location: userLocation,
    radius: 5000, // FIJO en 5km como requerido
    types: categoryInfo ? categoryInfo.googleTypes : ['establishment'],
    maxResults: 15, // FIJO en 15 resultados como requerido
    openNow: analysis.isRealTimeQuery, // Solo lugares abiertos si es consulta en tiempo real
    sortBy: 'distance' // SIEMPRE ordenar por distancia (proximidad)
  };
  
  console.log(`🚀 Ejecutando búsqueda en tiempo real:`, {
    category,
    urgency,
    radius: `${searchParams.radius}m`,
    openNow: searchParams.openNow,
    language
  });
  
  try {
    // Ejecutar búsqueda con parámetros optimizados
    const places = await getPlacesNearUser(
      userLocation, // Pasar el objeto completo de ubicación
      searchParams.types.join('|'), // Tipo de lugar
      language, // Idioma
      searchParams.radius, // Radio fijo en 5km
      searchParams.maxResults // Límite fijo en 15 resultados
    );
    
    // SIEMPRE filtrar y ordenar por proximidad dentro de 5km
    let filteredPlaces = places
      .filter(place => {
        // Asegurar que esté dentro de 5km
        const placeLocation = place.location || place.geometry?.location;
        if (!placeLocation) return false;
        
        const distance = geolocationService.calculateDistance(
          userLocation.lat, userLocation.lng,
          placeLocation.lat || placeLocation.latitude,
          placeLocation.lng || placeLocation.longitude
        );
        
        return distance !== null && distance <= 5; // 5km máximo
      })
      .sort((a, b) => {
        // Ordenar SIEMPRE por distancia (menor a mayor)
        const placeLocationA = a.location || a.geometry?.location;
        const placeLocationB = b.location || b.geometry?.location;
        
        if (!placeLocationA || !placeLocationB) return 0;
        
        const distA = geolocationService.calculateDistance(
          userLocation.lat, userLocation.lng,
          placeLocationA.lat || placeLocationA.latitude,
          placeLocationA.lng || placeLocationA.longitude
        );
        const distB = geolocationService.calculateDistance(
          userLocation.lat, userLocation.lng,
          placeLocationB.lat || placeLocationB.latitude,
          placeLocationB.lng || placeLocationB.longitude
        );
        return (distA || Infinity) - (distB || Infinity);
      })
      .slice(0, 15); // Limitar a exactamente 15 resultados
    
    // Aplicar priorización de lugares abiertos si es consulta en tiempo real
    if (analysis.isRealTimeQuery) {
      // Para consultas de tiempo real, priorizar lugares que probablemente estén abiertos
      // pero mantener el orden por proximidad como criterio principal
      filteredPlaces = prioritizeOpenPlacesButKeepProximity(filteredPlaces, userLocation);
    }
    
    return {
      success: true,
      places: filteredPlaces,
      searchMetadata: {
        searchType: 'real_time_proximity',
        category,
        urgency,
        radius: 5000, // Siempre 5km
        openNow: searchParams.openNow,
        totalFound: filteredPlaces.length,
        language,
        is_real_time_search: analysis.isRealTimeQuery || analysis.isProximityQuery,
        optimization_applied: true,
        geo_search: true,
        search_radius: 5000 // Confirmación de radio en 5km
      },
      optimizedFor: {
        realTime: analysis.isRealTimeQuery,
        proximity: analysis.isProximityQuery,
        urgency
      }
    };
    
  } catch (error) {
    console.error('Error en búsqueda en tiempo real:', error);
    throw new Error(`Error en búsqueda: ${error.message}`);
  }
}

/**
 * Prioriza lugares que probablemente estén abiertos manteniendo el orden por proximidad
 * @param {Array} places - Lista de lugares ya ordenados por proximidad
 * @param {Object} userLocation - Ubicación del usuario
 * @returns {Array} - Lugares priorizados pero manteniendo proximidad
 */
function prioritizeOpenPlacesButKeepProximity(places, userLocation) {
  const currentHour = new Date().getHours();
  
  return places.map(place => {
    const openProbability = calculateOpenProbability(place, currentHour);
    return {
      ...place,
      openProbability,
      isLikelyOpen: openProbability > 0.6 // Marcar como probablemente abierto
    };
  }).sort((a, b) => {
    // Primero ordenar por probabilidad de estar abierto (solo si es significativa la diferencia)
    const probDiff = b.openProbability - a.openProbability;
    if (Math.abs(probDiff) > 0.3) { // Solo si hay diferencia significativa
      return probDiff;
    }
    
    // Si las probabilidades son similares, mantener orden por proximidad
    const placeLocationA = a.location || a.geometry?.location;
    const placeLocationB = b.location || b.geometry?.location;
    
    if (!placeLocationA || !placeLocationB) return 0;
    
    const distA = geolocationService.calculateDistance(
      userLocation.lat, userLocation.lng,
      placeLocationA.lat || placeLocationA.latitude,
      placeLocationA.lng || placeLocationA.longitude
    );
    const distB = geolocationService.calculateDistance(
      userLocation.lat, userLocation.lng,
      placeLocationB.lat || placeLocationB.latitude,
      placeLocationB.lng || placeLocationB.longitude
    );
    
    return (distA || Infinity) - (distB || Infinity);
  });
}

/**
 * Obtiene radio por defecto según urgencia (FIJO EN 5KM)
 * @param {string} urgency - Nivel de urgencia
 * @returns {number} - Radio en metros (siempre 5000)
 */
function getDefaultRadiusByUrgency(urgency) {
  // SIEMPRE devolver 5km independientemente de la urgencia
  return 5000;
}

/**
 * Prioriza lugares que probablemente estén abiertos
 * @param {Array} places - Lista de lugares
 * @returns {Array} - Lugares priorizados
 */
function prioritizeOpenPlaces(places) {
  const currentHour = new Date().getHours();
  
  return places.sort((a, b) => {
    // Priorizar lugares que típicamente están abiertos a esta hora
    const aScore = calculateOpenProbability(a, currentHour);
    const bScore = calculateOpenProbability(b, currentHour);
    
    return bScore - aScore; // Ordenar de mayor a menor probabilidad
  });
}

/**
 * Calcula la probabilidad de que un lugar esté abierto
 * @param {Object} place - Información del lugar
 * @param {number} currentHour - Hora actual (0-23)
 * @returns {number} - Probabilidad entre 0 y 1
 */
function calculateOpenProbability(place, currentHour) {
  const types = place.types || [];
  let baseScore = 0.5; // Score base
  
  // Ajustar según tipo de establecimiento y hora
  if (types.includes('restaurant')) {
    if (currentHour >= 12 && currentHour <= 14) baseScore += 0.3; // Hora de almuerzo
    if (currentHour >= 19 && currentHour <= 22) baseScore += 0.4; // Hora de cena
  }
  
  if (types.includes('bar') || types.includes('night_club')) {
    if (currentHour >= 18 && currentHour <= 2) baseScore += 0.5; // Hora nocturna
    if (currentHour >= 6 && currentHour <= 12) baseScore -= 0.3; // Probablemente cerrado en la mañana
  }
  
  if (types.includes('cafe')) {
    if (currentHour >= 6 && currentHour <= 11) baseScore += 0.4; // Hora de desayuno
    if (currentHour >= 14 && currentHour <= 17) baseScore += 0.2; // Hora de café
  }
  
  if (types.includes('museum') || types.includes('tourist_attraction')) {
    if (currentHour >= 9 && currentHour <= 17) baseScore += 0.3; // Horario típico de museos
    if (currentHour < 8 || currentHour > 18) baseScore -= 0.4; // Probablemente cerrado
  }
  
  // Bonus por rating alto
  if (place.rating && place.rating >= 4.0) {
    baseScore += 0.1;
  }
  
  return Math.max(0, Math.min(1, baseScore));
}

/**
 * Genera mensaje contextual para respuesta
 * @param {Object} analysis - Análisis de la consulta
 * @param {Array} places - Lugares encontrados
 * @param {string} language - Idioma
 * @returns {string} - Mensaje contextual
 */
export function generateContextualMessage(analysis, places, language = 'es') {
  const { category, urgency, isRealTimeQuery } = analysis;
  const count = places.length;
  
  if (language === 'en') {
    let message = '';
    
    if (urgency === 'high') {
      message += '⚡ **URGENT SEARCH RESULTS** - ';
    } else if (isRealTimeQuery) {
      message += '🕒 **REAL-TIME RESULTS** - ';
    }
    
    if (count === 0) {
      message += `I couldn't find any ${category || 'places'} open near you right now.`;
    } else if (count === 1) {
      message += `I found 1 ${category || 'place'} available near you right now.`;
    } else {
      message += `I found ${count} ${category || 'places'} available near you right now.`;
    }
    
    if (isRealTimeQuery) {
      message += ' These results are optimized for current availability.';
    }
    
    return message;
  }
  
  // Español
  let message = '';
  
  if (urgency === 'high') {
    message += '⚡ **RESULTADOS URGENTES** - ';
  } else if (isRealTimeQuery) {
    message += '🕒 **RESULTADOS EN TIEMPO REAL** - ';
  }
  
  if (count === 0) {
    message += `No pude encontrar ${category || 'lugares'} abiertos cerca de ti ahora mismo.`;
  } else if (count === 1) {
    message += `Encontré 1 ${category || 'lugar'} disponible cerca de ti ahora mismo.`;
  } else {
    message += `Encontré ${count} ${category || 'lugares'} disponibles cerca de ti ahora mismo.`;
  }
  
  if (isRealTimeQuery) {
    message += ' Estos resultados están optimizados para disponibilidad actual.';
  }
  
  return message;
}

export default {
  analyzeRealTimeProximityQuery,
  executeRealTimeProximitySearch,
  generateContextualMessage
};

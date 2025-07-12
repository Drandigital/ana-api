// controllers/chatController.js

/**
 * Controlador principal de chat inteligente y contextual para Ana IA
 * Arquitectura conversacional avanzada con gestión de contexto y coherencia
 */

import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import geolocationService from '../services/geolocationService.js';
import config from '../config/index.js';
import mapIntegrationService from '../services/mapIntegrationService.js';
import realTimeProximityService from '../services/realTimeProximityService.js';
import { 
  analyzeSafetyQuery, 
  generateEmergencyResponse, 
  generateSafetyResponse 
} from './safetyController.js';
import {
  startReportFlow,
  processReportStep
} from './reportController.js';
import conversationManager, { USER_INTENTIONS, CONVERSATION_STATES } from '../services/conversationService.js';
import dataCoordinator from '../services/dataCoordinator.js';

// Legacy stores - mantenemos para compatibilidad con reportes existentes
export const conversationHistory = {};
export const activeReportFlows = {};

/**
 * Controlador principal de chat inteligente y contextual
 */
export const handleChatRequest = asyncHandler(async (req, res) => {
  console.log('\n🧠 === NUEVA CONVERSACIÓN INICIADA ===');
  
  // Extraer datos de la petición
  const userMessage = req.body.message || '';
  const sessionId = req.body.sessionId || `session_${Date.now()}`;
  let userLocation = req.body.location || null;
  
  console.log(`📝 Mensaje: "${userMessage}"`);
  console.log(`👤 Sesión: ${sessionId}`);
  
  // 1. PROCESAR Y VALIDAR UBICACIÓN
  if (userLocation) {
    userLocation = geolocationService.validateAndNormalizeUserLocation(userLocation);
    if (userLocation) {
      console.log(`📍 Ubicación válida: ${userLocation.lat}, ${userLocation.lng}`);
      
      // Detectar ciudad si no está especificada
      if (!userLocation.city || userLocation.city === 'Ciudad no especificada') {
        const detectedLocation = await geolocationService.detectUserLocation({ 
          lat: userLocation.lat, 
          lng: userLocation.lng 
        });
        if (detectedLocation?.city && detectedLocation.city !== 'Ciudad no especificada') {
          userLocation.city = detectedLocation.city;
          console.log(`🏙️ Ciudad detectada: ${userLocation.city}`);
        }
      }
    }
  }

  // 2. OBTENER O CREAR SESIÓN DE CONVERSACIÓN
  const session = conversationManager.getOrCreateSession(sessionId, userLocation);
  console.log(`💭 Estado conversacional: ${session.state}`);
  console.log(`📚 Historial: ${session.history.length} mensajes`);

  // 3. 🚨 PRIORIDAD MÁXIMA: EMERGENCIAS Y SEGURIDAD
  const safetyAnalysis = analyzeSafetyQuery(userMessage);
  
  if (safetyAnalysis.isEmergency) {
    console.log("🚨 EMERGENCIA DETECTADA");
    
    const emergencyResponse = generateEmergencyResponse(userMessage, safetyAnalysis.language);
    
    // Actualizar contexto conversacional
    conversationManager.updateConversationState(sessionId, CONVERSATION_STATES.EMERGENCY, 'emergencia');
    conversationManager.addToHistory(sessionId, 'user', userMessage, { isEmergency: true });
    conversationManager.addToHistory(sessionId, 'assistant', emergencyResponse, { isEmergency: true });
    
    return res.status(200).json({ 
      response: emergencyResponse,
      isEmergency: true,
      conversationState: 'emergency',
      emergencyNumbers: {
        police: '112',
        health: '125',
        redCross: '6627202',
        coastGuard: '6550316',
        fireDepartment: '119'
      }
    });
  }
  
  if (safetyAnalysis.isSafetyQuery) {
    console.log("🛡️ CONSULTA DE SEGURIDAD");
    
    const safetyResponse = generateSafetyResponse(userMessage, safetyAnalysis.language);
    
    conversationManager.updateConversationState(sessionId, CONVERSATION_STATES.GENERAL_CHAT, 'seguridad');
    conversationManager.addToHistory(sessionId, 'user', userMessage, { isSafety: true });
    conversationManager.addToHistory(sessionId, 'assistant', safetyResponse, { isSafety: true });
    
    return res.status(200).json({ 
      response: safetyResponse,
      isSafetyQuery: true,
      conversationState: 'general_chat',
      emergencyNumbers: {
        police: '112',
        health: '125',
        fireDepartment: '119'
      }
    });
  }

  // 4. MANEJAR FLUJOS DE REPORTE ACTIVOS (Legacy compatibility)
  if (activeReportFlows[sessionId]) {
    console.log("📋 Continuando flujo de reporte activo");
    
    const nextStep = processReportStep(activeReportFlows[sessionId], userMessage);
    
    if (nextStep.completed) {
      delete activeReportFlows[sessionId];
      conversationManager.updateConversationState(sessionId, CONVERSATION_STATES.GENERAL_CHAT, null);
      conversationManager.addToHistory(sessionId, 'user', userMessage);
      conversationManager.addToHistory(sessionId, 'assistant', nextStep.message);
      
      return res.status(200).json({
        response: nextStep.message,
        reportCompleted: true,
        conversationState: 'general_chat'
      });
    } else {
      conversationManager.addToHistory(sessionId, 'user', userMessage);
      conversationManager.addToHistory(sessionId, 'assistant', nextStep.message);
      
      return res.status(200).json({
        response: nextStep.message,
        reportInProgress: true,
        conversationState: 'problem_reporting',
        currentStep: nextStep.step
      });
    }
  }

  // 5. ANÁLISIS INTELIGENTE DE INTENCIÓN
  console.log("🔍 Analizando intención del usuario...");
  const intention = await conversationManager.analyzeUserIntention(userMessage, session);
  console.log(`🎯 Intención detectada: ${intention.intention} (confianza: ${intention.confidence})`);
  console.log(`😊 Emoción: ${intention.emotion}`);

  // 6. DETERMINAR NECESIDADES DE DATOS
  const dataNeeds = await conversationManager.determineDataNeeds(userMessage, intention, session.context);
  console.log(`📊 Datos necesarios:`, dataNeeds);

  // 7. RECOPILAR DATOS CONTEXTUALES
  let availableData = {};
  if (Object.values(dataNeeds).some(need => need)) {
    console.log("🔄 Recopilando datos contextuales...");
    availableData = await dataCoordinator.gatherContextualData(
      dataNeeds, 
      userLocation, 
      session.context.currentTopic, 
      userMessage
    );
    console.log(`✅ Datos recopilados:`, Object.keys(availableData));
  }

  // 7.5. VERIFICAR SI ES CONSULTA GEOGRÁFICA PARA EL MAPA
  let mapPlaces = [];
  if (mapIntegrationService.hasGeoIntent(userMessage) && userLocation) {
    console.log("🗺️ Detectada consulta geográfica - obteniendo lugares para el mapa");
    mapPlaces = await mapIntegrationService.getPlacesForQuery(userMessage, userLocation);
    console.log(`📍 Lugares para mapa: ${mapPlaces.length}`);
  }

  // 8. MANEJAR INTENCIONES ESPECÍFICAS
  let newState = session.state;
  let newTopic = intention.topic;

  switch (intention.intention) {
    case USER_INTENTIONS.COMPLAINT:
      console.log("😞 Manejando queja/problema");
      newState = CONVERSATION_STATES.COMPLAINT_HANDLING;
      break;
      
    case USER_INTENTIONS.FOLLOWUP:
      console.log("🔄 Manejando seguimiento");
      newState = CONVERSATION_STATES.FOLLOWUP;
      break;
      
    case USER_INTENTIONS.LOCATION_QUERY:
      console.log("📍 Consulta de ubicación");
      newState = CONVERSATION_STATES.INFORMATION_SEEKING;
      newTopic = 'ubicacion';
      break;
      
    case USER_INTENTIONS.GREETING:
      // Solo cambiar a greeting si es realmente una nueva conversación
      if (session.history.length === 0) {
        console.log("👋 Saludo inicial");
        newState = CONVERSATION_STATES.GREETING;
        newTopic = 'saludo_inicial';
      } else {
        console.log("👋 Saludo en conversación existente - manteniendo contexto");
        newState = session.state; // Mantener estado actual
        newTopic = session.context.currentTopic; // Mantener tema actual
      }
      break;
      
    default:
      newState = CONVERSATION_STATES.GENERAL_CHAT;
  }

  // 9. GENERAR RESPUESTA CONTEXTUAL
  console.log("💬 Generando respuesta contextual...");
  const response = await conversationManager.generateContextualResponse(
    session, 
    userMessage, 
    intention, 
    availableData
  );

  // 10. ACTUALIZAR ESTADO CONVERSACIONAL
  conversationManager.updateConversationState(sessionId, newState, newTopic);
  conversationManager.addToHistory(sessionId, 'user', userMessage, { 
    intention: intention.intention, 
    emotion: intention.emotion 
  });
  conversationManager.addToHistory(sessionId, 'assistant', response, { 
    dataUsed: Object.keys(availableData) 
  });

  console.log(`✨ Respuesta generada (${response.length} chars)`);
  console.log(`🏁 Estado final: ${newState}, Tema: ${newTopic}`);
  console.log('=== FIN DE CONVERSACIÓN ===\n');

  // 11. ENVIAR RESPUESTA
  const responseData = {
    response,
    conversationState: newState,
    currentTopic: newTopic,
    intention: intention.intention,
    emotion: intention.emotion,
    dataUsed: Object.keys(availableData),
    userLocation: userLocation ? {
      city: userLocation.city,
      coordinates: { lat: userLocation.lat, lng: userLocation.lng }
    } : null
  };

  // 🗺️ INCLUIR DATOS DE LUGARES PARA EL MAPA (PRIORIDAD ALTA)
  if (mapPlaces && mapPlaces.length > 0) {
    responseData.places = mapPlaces;
    responseData.searchMetadata = {
      geo_search: true,
      total_found: mapPlaces.length,
      search_radius: 10 // Radio en km
    };
    console.log(`🗺️ ENVIANDO ${mapPlaces.length} LUGARES AL FRONTEND PARA EL MAPA`);
  } else if (availableData.searchMetadata && availableData.searchMetadata.searchType === 'real_time_proximity') {
    // 🚀 DATOS DE BÚSQUEDA EN TIEMPO REAL OPTIMIZADA
    responseData.places = availableData.places.map((place, index) => {
      const placeLocation = {
        lat: place.location?.lat || place.geometry?.location?.lat,
        lng: place.location?.lng || place.geometry?.location?.lng
      };
      
      const distance = userLocation ? 
        geolocationService.calculateDistance(
          userLocation.lat, userLocation.lng,
          placeLocation.lat, placeLocation.lng
        ) : null;
      
      const distanceFormatted = distance ? 
        (distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`) : null;

      return {
        place_id: place.place_id || place.id || `place_${index}_${Date.now()}`,
        name: place.name || 'Lugar sin nombre',
        location: placeLocation,
        address: place.vicinity || place.formatted_address || place.address || null,
        rating: place.rating || null,
        phone: place.international_phone_number || place.formatted_phone_number || null,
        photos: place.photos ? place.photos.slice(0, 3).map(photo => {
          if (typeof photo === 'string') return photo;
          if (photo.photo_reference) {
            return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${config.externalApis.googleMapsApiKey}`;
          }
          return null;
        }).filter(Boolean) : [],
        category: getCategoryFromTypes(place.types),
        business_type: place.types?.[0] || getCategoryFromTypes(place.types) || 'unknown',
        distance_formatted: distanceFormatted,
        isVerified: place.isVerified || false,
        isPremium: place.isPremium || false,
        // 🚀 METADATOS ESPECÍFICOS DE TIEMPO REAL
        openNow: place.opening_hours?.open_now,
        isRealTimeOptimized: true,
        urgencyLevel: availableData.searchMetadata.urgency
      };
    });

    responseData.searchMetadata = {
      ...availableData.searchMetadata,
      geo_search: true,
      is_real_time_search: true,
      optimization_applied: true
    };

    // Agregar mensaje contextual de tiempo real
    if (availableData.optimizedFor) {
      const contextMessage = realTimeProximityService.generateContextualMessage(
        availableData.searchMetadata,
        availableData.places,
        intention.language || 'es'
      );
      
      responseData.realTimeContext = {
        message: contextMessage,
        optimizations: availableData.optimizedFor,
        urgency: availableData.searchMetadata.urgency
      };
    }

    console.log(`🚀 ENVIANDO ${responseData.places.length} LUGARES OPTIMIZADOS EN TIEMPO REAL`);
  } else if (availableData.places && availableData.places.length > 0) {
    // Fallback: usar datos contextuales si no hay datos específicos del mapa
    responseData.places = availableData.places.map((place, index) => {
      const placeLocation = {
        lat: place.location?.lat || place.geometry?.location?.lat,
        lng: place.location?.lng || place.geometry?.location?.lng
      };
      
      const distance = userLocation ? 
        geolocationService.calculateDistance(
          userLocation.lat, userLocation.lng,
          placeLocation.lat, placeLocation.lng
        ) : null;
      
      const distanceFormatted = distance ? 
        (distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`) : null;

      return {
        place_id: place.place_id || place.id || `place_${index}_${Date.now()}`,
        name: place.name || 'Lugar sin nombre',
        location: placeLocation,
        address: place.vicinity || place.formatted_address || place.address || null,
        rating: place.rating || null,
        phone: place.international_phone_number || place.formatted_phone_number || null,
        photos: place.photos ? place.photos.slice(0, 3).map(photo => {
          if (typeof photo === 'string') return photo;
          if (photo.photo_reference) {
            return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${config.externalApis.googleMapsApiKey}`;
          }
          return null;
        }).filter(Boolean) : [],
        category: getCategoryFromTypes(place.types),
        business_type: place.types?.[0] || getCategoryFromTypes(place.types) || 'unknown',
        distance_formatted: distanceFormatted,
        isVerified: place.isVerified || false,
        isPremium: place.isPremium || false
      };
    });

    responseData.searchMetadata = {
      geo_search: true,
      total_found: availableData.places.length,
      search_radius: 5
    };

    console.log(`📍 Incluyendo ${responseData.places.length} lugares contextuales para el mapa`);
  }

  // 🛩️ INCLUIR DATOS DE VUELOS SI ESTÁN DISPONIBLES
  if (availableData.flights && availableData.flights.length > 0) {
    responseData.flights = availableData.flights;
    responseData.flightMetadata = {
      total_found: availableData.flights.length,
      search_type: 'flight_search'
    };
    console.log(`🛩️ ENVIANDO ${availableData.flights.length} VUELOS AL FRONTEND`);
  }

  // 🌤️ INCLUIR DATOS DEL CLIMA SI ESTÁN DISPONIBLES
  if (availableData.weather) {
    if (availableData.weather.error) {
      responseData.weatherError = availableData.weather.error;
      console.log(`❌ Error del clima: ${availableData.weather.error}`);
    } else {
      responseData.weather = {
        temperature: availableData.weather.temperature,
        description: availableData.weather.description,
        humidity: availableData.weather.humidity,
        wind: availableData.weather.wind,
        icon: availableData.weather.icon,
        timestamp: availableData.weather.timestamp,
        city: userLocation?.city || 'Cartagena'
      };
      console.log(`🌤️ ENVIANDO DATOS DEL CLIMA AL FRONTEND: ${availableData.weather.temperature}°C, ${availableData.weather.description}`);
    }
  }

  return res.status(200).json(responseData);
});

/**
 * Función auxiliar para determinar la categoría basada en los tipos de Google Places
 */
function getCategoryFromTypes(types) {
  if (!types || !Array.isArray(types)) return 'general';
  
  const categoryMap = {
    'lodging': 'hotel',
    'restaurant': 'restaurant', 
    'cafe': 'cafe',
    'bar': 'bar',
    'night_club': 'nightlife',
    'museum': 'museum',
    'art_gallery': 'museum',
    'tourist_attraction': 'attraction',
    'amusement_park': 'attraction',
    'zoo': 'attraction',
    'shopping_mall': 'shopping',
    'store': 'shopping',
    'clothing_store': 'shopping',
    'bank': 'service',
    'atm': 'service',
    'pharmacy': 'service',
    'hospital': 'service',
    'gas_station': 'service',
    'park': 'nature',
    'natural_feature': 'nature',
    'beach': 'nature',
    'bus_station': 'transport',
    'subway_station': 'transport',
    'airport': 'transport',
    'taxi_stand': 'transport'
  };

  // Buscar el primer tipo que tenga mapeo
  for (const type of types) {
    if (categoryMap[type]) {
      return categoryMap[type];
    }
  }
  
  // Si no encuentra nada específico, intentar categorías más generales
  if (types.includes('establishment') || types.includes('point_of_interest')) {
    return 'attraction';
  }
  
  return 'general';
}

/**
 * Endpoint para obtener el estado de una conversación
 */
export const getConversationState = asyncHandler(async (req, res) => {
  const sessionId = req.params.sessionId;
  const session = conversationManager.conversations.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Sesión no encontrada' });
  }
  
  return res.status(200).json({
    sessionId,
    state: session.state,
    currentTopic: session.context.currentTopic,
    historyLength: session.history.length,
    lastActivity: session.lastActivity,
    userLocation: session.context.userLocation
  });
});

/**
 * Endpoint para reiniciar una conversación
 */
export const resetConversation = asyncHandler(async (req, res) => {
  const sessionId = req.params.sessionId;
  
  if (conversationManager.conversations.has(sessionId)) {
    conversationManager.conversations.delete(sessionId);
  }
  
  if (activeReportFlows[sessionId]) {
    delete activeReportFlows[sessionId];
  }
  
  return res.status(200).json({ 
    message: 'Conversación reiniciada',
    sessionId 
  });
});

/**
 * Endpoint para obtener estadísticas de conversaciones
 */
export const getConversationStats = asyncHandler(async (req, res) => {
  const stats = {
    activeSessions: conversationManager.conversations.size,
    activeReports: Object.keys(activeReportFlows).length,
    totalMessages: 0,
    stateDistribution: {}
  };
  
  for (const session of conversationManager.conversations.values()) {
    stats.totalMessages += session.history.length;
    stats.stateDistribution[session.state] = (stats.stateDistribution[session.state] || 0) + 1;
  }
  
  return res.status(200).json(stats);
});

// Mantener funciones legacy para compatibilidad (pueden ser removidas gradualmente)
export const isLocationQuery = (message) => {
  const locationKeywords = [
    'dónde estoy', 'donde estoy', 'mi ubicación', 'ubicación actual',
    'qué ciudad', 'que ciudad', 'en qué lugar', 'en que lugar',
    'where am i', 'my location', 'current location', 'what city'
  ];
  
  return locationKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );
};

export const generateLocationResponse = (userLocation, language = 'es') => {
  if (!userLocation || !userLocation.city) {
    return language === 'es' 
      ? 'Lo siento, no puedo determinar tu ubicación exacta en este momento. ¿Podrías decirme en qué ciudad te encuentras?'
      : 'Sorry, I cannot determine your exact location right now. Could you tell me what city you are in?';
  }
  
  return language === 'es'
    ? `Te encuentras en ${userLocation.city}. ¿Hay algo específico que te gustaría saber sobre esta ciudad?`
    : `You are in ${userLocation.city}. Is there something specific you would like to know about this city?`;
};

// services/conversationService.js

/**
 * Servicio principal de gestión conversacional para Ana IA
 * Mantiene el contexto, la coherencia y la continuidad de las conversaciones
 */

import { getChatCompletion } from './openaiService.js';
import cacheService from './cacheService.js';
import realTimeProximityService from './realTimeProximityService.js';

// Estados conversacionales posibles
export const CONVERSATION_STATES = {
  GREETING: 'greeting',
  PROBLEM_REPORTING: 'problem_reporting',
  INFORMATION_SEEKING: 'information_seeking',
  BOOKING_ASSISTANCE: 'booking_assistance',
  COMPLAINT_HANDLING: 'complaint_handling',
  GENERAL_CHAT: 'general_chat',
  FOLLOWUP: 'followup'
};

// Intenciones del usuario detectadas
export const USER_INTENTIONS = {
  GREETING: 'greeting',
  COMPLAINT: 'complaint',
  QUESTION: 'question',
  REQUEST_INFO: 'request_info',
  BOOKING: 'booking',
  EMERGENCY: 'emergency',
  LOCATION_QUERY: 'location_query',
  WEATHER_QUERY: 'weather_query',
  FLIGHT_QUERY: 'flight_query',
  FOLLOWUP: 'followup',
  CLARIFICATION: 'clarification'
};

/**
 * Clase principal para manejar conversaciones
 */
class ConversationManager {
  constructor() {
    this.conversations = new Map(); // En memoria, en producción usar Redis
    this.maxHistoryLength = 20; // Máximo de mensajes a recordar
  }

  /**
   * Obtiene o crea una sesión de conversación
   */
  getOrCreateSession(sessionId, userLocation = null) {
    if (!this.conversations.has(sessionId)) {
      this.conversations.set(sessionId, {
        id: sessionId,
        startTime: new Date(),
        lastActivity: new Date(),
        state: CONVERSATION_STATES.GREETING,
        context: {
          userLocation,
          currentTopic: null,
          pendingActions: [],
          userData: {},
          activeFlows: {}
        },
        history: [],
        intentions: [],
        emotions: []
      });
    }
    
    return this.conversations.get(sessionId);
  }

  /**
   * Analiza la intención del usuario usando GPT-4o
   */
  async analyzeUserIntention(message, conversationContext) {
    const prompt = `
Analiza este mensaje del usuario y determina su intención principal.

Contexto de la conversación:
- Estado actual: ${conversationContext.state}
- Tema actual: ${conversationContext.context.currentTopic || 'Ninguno'}
- Últimas 3 interacciones: ${conversationContext.history.slice(-3).map(h => `${h.role}: ${h.content}`).join('\n')}

Mensaje del usuario: "${message}"

Devuelve un JSON con:
{
  "intention": "una de: greeting, complaint, question, request_info, booking, emergency, location_query, weather_query, flight_query, followup, clarification",
  "confidence": número entre 0 y 1,
  "topic": "tema específico del mensaje",
  "emotion": "emoción detectada: neutral, happy, frustrated, angry, confused, excited",
  "needsFollowup": boolean,
  "contextualRelevance": "cómo se relaciona con la conversación anterior"
}
`;

    try {
      const response = await getChatCompletion([
        { role: 'system', content: prompt },
        { role: 'user', content: message }
      ], 0.3);

      return JSON.parse(response);
    } catch (error) {
      console.error('Error analizando intención:', error);
      return {
        intention: USER_INTENTIONS.GENERAL_CHAT,
        confidence: 0.5,
        topic: 'general',
        emotion: 'neutral',
        needsFollowup: false,
        contextualRelevance: 'low'
      };
    }
  }

  /**
   * Genera una respuesta contextual usando GPT-4o
   */
  async generateContextualResponse(session, userMessage, intention, availableData = {}) {
    const systemPrompt = this.buildSystemPrompt(session, intention, availableData);
    
    const conversationHistory = [
      { role: 'system', content: systemPrompt },
      ...session.history.slice(-10), // Últimos 10 mensajes para contexto
      { role: 'user', content: userMessage }
    ];

    const response = await getChatCompletion(conversationHistory, 0.7);
    return response;
  }

  /**
   * Construye el prompt del sistema basado en el contexto
   */
  buildSystemPrompt(session, intention, availableData) {
    const basePrompt = `
Eres Ana, una asistente turística IA para Colombia. Eres empática, inteligente y mantienes conversaciones naturales.

CONTEXTO ACTUAL:
- Estado de conversación: ${session.state}
- Tema actual: ${session.context.currentTopic || 'Ninguno'}
- Intención detectada: ${intention.intention}
- Emoción del usuario: ${intention.emotion}
- Ubicación del usuario: ${session.context.userLocation?.city || 'No especificada'}

REGLAS IMPORTANTES:
1. MANTÉN EL CONTEXTO: No saludes de nuevo si ya iniciaron la conversación
2. SÉ COHERENTE: Continúa el hilo de la conversación anterior
3. SÉ EMPÁTICA: Responde apropiadamente a la emoción del usuario
4. NO REPITAS: Evita dar la misma información dos veces
5. PROFUNDIZA: Si hay un problema, ayuda a resolverlo completamente

`;

    // Agregar información específica según la intención
    switch (intention.intention) {
      case USER_INTENTIONS.COMPLAINT:
        return basePrompt + `
SITUACIÓN: El usuario tiene una queja o problema.
- Muestra empatía genuina
- Profundiza en el problema
- Ofrece soluciones concretas
- Pregunta por evidencia si es relevante
- No cambies de tema hasta resolver o ayudar completamente
`;

      case USER_INTENTIONS.FOLLOWUP:
        return basePrompt + `
SITUACIÓN: El usuario está siguiendo una conversación anterior.
- Mantén la continuidad del tema
- Recuerda lo que se discutió antes
- Profundiza o avanza según sea necesario
- No reinicies la conversación
`;

      case USER_INTENTIONS.REQUEST_INFO:
        return basePrompt + `
SITUACIÓN: El usuario busca información específica.
- Proporciona información precisa y útil
- Usa los datos disponibles: ${JSON.stringify(availableData, null, 2)}
- Ofrece seguimiento relacionado
- Mantén la conversación interactiva
`;

      default:
        return basePrompt + `
DATOS DISPONIBLES: ${JSON.stringify(availableData, null, 2)}
Responde de manera natural y útil según el contexto.
`;
    }
  }

  /**
   * Actualiza el estado de la conversación
   */
  updateConversationState(sessionId, newState, topic = null, pendingActions = []) {
    const session = this.getOrCreateSession(sessionId);
    session.state = newState;
    session.context.currentTopic = topic;
    session.context.pendingActions = pendingActions;
    session.lastActivity = new Date();
  }

  /**
   * Añade un mensaje al historial
   */
  addToHistory(sessionId, role, content, metadata = {}) {
    const session = this.getOrCreateSession(sessionId);
    
    session.history.push({
      role,
      content,
      timestamp: new Date(),
      metadata
    });

    // Mantener solo los últimos N mensajes
    if (session.history.length > this.maxHistoryLength) {
      session.history = session.history.slice(-this.maxHistoryLength);
    }
  }

  /**
   * Determina si necesita datos externos basándose en el mensaje del usuario
   */
  async determineDataNeeds(userMessage, intention = null, conversationContext = null) {
    // Validar que userMessage sea una string
    if (!userMessage || typeof userMessage !== 'string') {
      console.log('⚠️ userMessage no es una string válida:', typeof userMessage, userMessage);
      return {
        location: false,
        weather: false,
        places: false,
        flights: false,
        business: false
      };
    }

    const dataNeeds = {
      location: false,
      weather: false,
      places: false,
      flights: false,
      business: false
    };

    const lowerMessage = userMessage.toLowerCase();
    console.log(`🔍 Analizando mensaje para necesidades de datos: "${userMessage}"`);

    // Si no se proporciona intención, intentar detectarla automáticamente
    if (!intention && conversationContext) {
      try {
        const detectedIntention = await this.analyzeUserIntention(userMessage, conversationContext);
        intention = detectedIntention;
        console.log(`🎯 Intención detectada automáticamente:`, intention);
      } catch (error) {
        console.log('⚠️ No se pudo detectar intención automáticamente:', error.message);
      }
    }

    // 🌤️ DETECCIÓN AUTOMÁTICA DE CONSULTAS DE CLIMA
    const weatherKeywords = [
      'clima', 'tiempo', 'temperatura', 'lluvia', 'sol', 'nublado',
      'weather', 'temperature', 'rain', 'sunny', 'cloudy',
      'calor', 'frío', 'frio', 'humedad', 'viento', 'pronóstico', 'pronostico',
      'hot', 'cold', 'humidity', 'wind', 'forecast',
      'grados', 'celsius', 'fahrenheit', 'despejado', 'tormentoso'
    ];

    const weatherPhrases = [
      'cómo está el clima', 'como está el clima', 'como esta el clima',
      'qué tiempo hace', 'que tiempo hace', 'cómo estará el tiempo',
      'como estará el tiempo', 'como estara el tiempo',
      'va a llover', 'está lloviendo', 'esta lloviendo',
      'clima de hoy', 'tiempo de hoy', 'temperatura de hoy',
      'clima mañana', 'tiempo mañana', 'temperatura mañana',
      'pronóstico del tiempo', 'pronostico del tiempo',
      'hace calor', 'hace frío', 'hace frio', 'está soleado',
      'está nublado', 'esta nublado', 'hay viento'
    ];

    const hasWeatherKeywords = weatherKeywords.some(keyword => lowerMessage.includes(keyword));
    const hasWeatherPhrases = weatherPhrases.some(phrase => lowerMessage.includes(phrase));

    if (hasWeatherKeywords || hasWeatherPhrases) {
      dataNeeds.weather = true;
      dataNeeds.location = true;
      console.log('🌤️ Consulta de clima detectada automáticamente');
    }

    // 🚀 DETECCIÓN DE CONSULTAS EN TIEMPO REAL Y PROXIMIDAD
    const realTimeAnalysis = realTimeProximityService.analyzeRealTimeProximityQuery(userMessage);
    
    if (realTimeAnalysis.isRealTimeProximityQuery || realTimeAnalysis.isProximityQuery) {
      dataNeeds.places = true;
      dataNeeds.location = true;
      dataNeeds.realTimeProximity = realTimeAnalysis; // Agregar análisis específico
      console.log('🚀 Consulta en tiempo real/proximidad detectada:', {
        isRealTime: realTimeAnalysis.isRealTimeQuery,
        isProximity: realTimeAnalysis.isProximityQuery,
        category: realTimeAnalysis.category,
        urgency: realTimeAnalysis.urgency,
        confidence: realTimeAnalysis.confidence
      });
    }

    // 🛩️ DETECCIÓN AUTOMÁTICA DE CONSULTAS DE VUELOS
    const flightKeywords = [
      'vuelo', 'vuelos', 'volar', 'avión', 'aerolínea', 'aerolinea',
      'flight', 'flights', 'fly', 'airplane', 'airline',
      'boleto', 'pasaje', 'ticket', 'tiquete',
      'aeropuerto', 'airport', 'aterrizar', 'despegar',
      'bogotá', 'medellín', 'cali', 'barranquilla', 'bucaramanga', // ciudades frecuentes
      'ctg', 'bog', 'mde', 'clo', 'baq', 'bue' // códigos de aeropuerto
    ];

    const flightPhrases = [
      'busco vuelo', 'necesito vuelo', 'quiero volar', 'buscar vuelo',
      'precio de vuelo', 'costo de vuelo', 'vuelo barato',
      'ir a bogotá', 'viajar a', 'ir en avión',
      'de cartagena a', 'desde cartagena'
    ];

    const hasFlightKeywords = flightKeywords.some(keyword => lowerMessage.includes(keyword));
    const hasFlightPhrases = flightPhrases.some(phrase => lowerMessage.includes(phrase));

    if (hasFlightKeywords || hasFlightPhrases) {
      dataNeeds.flights = true;
      console.log('🛩️ Consulta de vuelos detectada automáticamente');
    }

    // Procesar intención si está disponible
    const intentionType = intention?.intention || intention;
    
    switch (intentionType) {
      case USER_INTENTIONS.LOCATION_QUERY:
        dataNeeds.location = true;
        break;
      case USER_INTENTIONS.WEATHER_QUERY:
        dataNeeds.weather = true;
        dataNeeds.location = true;
        break;
      case USER_INTENTIONS.FLIGHT_QUERY:
        dataNeeds.flights = true;
        break;
      case USER_INTENTIONS.REQUEST_INFO:
        // Detectar consultas geográficas para todos los tipos de lugares turísticos
        const geoKeywords = {
          // Alojamiento
          hotels: ['hotel', 'hoteles', 'alojamiento', 'hospedaje', 'dormir', 'hostal', 'hostales', 'posada', 'resort'],
          // Gastronomía
          restaurants: ['restaurante', 'restaurantes', 'comida', 'comer', 'almorzar', 'cenar', 'donde comer', 'gastronom'],
          // Cafés y bebidas
          cafes: ['café', 'cafes', 'cafetería', 'cafeteria', 'coffee', 'desayunar'],
          // Bares y vida nocturna
          bars: ['bar', 'bares', 'trago', 'cerveza', 'cocktail', 'coctel', 'cantina', 'pub'],
          nightlife: ['discoteca', 'discotecas', 'rumba', 'fiesta', 'bailar', 'vida nocturna', 'club nocturno'],
          // Entretenimiento y cultura
          museums: ['museo', 'museos', 'arte', 'cultura', 'exposición', 'galería'],
          attractions: ['turística', 'turístico', 'atracción', 'atracciones', 'visitar', 'conocer', 'ver', 'sitio', 'lugar'],
          // Compras
          shopping: ['tienda', 'tiendas', 'compra', 'comprar', 'shopping', 'centro comercial', 'mall'],
          // Servicios
          banks: ['banco', 'bancos', 'atm', 'cajero', 'dinero'],
          pharmacies: ['farmacia', 'farmacias', 'medicina', 'medicamento'],
          gas_stations: ['gasolina', 'combustible', 'gasolinera', 'estación de servicio'],
          // Naturaleza y aire libre
          parks: ['parque', 'parques', 'naturaleza', 'verde', 'jardín', 'plaza'],
          beaches: ['playa', 'playas', 'mar', 'costa', 'arena'],
          // Transporte
          transport: ['transporte', 'bus', 'taxi', 'terminal', 'aeropuerto']
        };

        // Verificar si el mensaje contiene palabras clave geográficas
        const containsGeoKeywords = Object.values(geoKeywords).some(keywords =>
          keywords.some(keyword => lowerMessage.includes(keyword))
        );

        // También detectar frases que indican búsqueda geográfica
        const geoPhases = [
          'cerca de', 'cerca', 'aquí', 'en esta zona', 'en esta área', 
          'en este lugar', 'por aquí', 'alrededor', 'en cartagena', 
          'en bogotá', 'en medellín', 'en cali', 'en esta ciudad',
          'qué hay', 'que hay', 'dónde', 'donde', 'recomienda',
          'recomendaciones', 'sugerencias'
        ];

        const containsGeoPhases = geoPhases.some(phrase => lowerMessage.includes(phrase));

        if (containsGeoKeywords || containsGeoPhases) {
          dataNeeds.places = true;
          dataNeeds.business = true;
        }
        
        // También verificar el contexto conversacional
        const currentTopic = conversationContext?.currentTopic;
        if (currentTopic && Object.values(geoKeywords).some(keywords =>
          keywords.some(keyword => currentTopic.toLowerCase().includes(keyword))
        )) {
          dataNeeds.places = true;
          dataNeeds.business = true;
        }
        break;
    }

    console.log('📊 Necesidades de datos determinadas:', dataNeeds);
    return dataNeeds;
  }

  /**
   * Limpia sesiones antiguas
   */
  cleanupOldSessions(maxAge = 24 * 60 * 60 * 1000) { // 24 horas
    const now = new Date();
    for (const [sessionId, session] of this.conversations) {
      if (now - session.lastActivity > maxAge) {
        this.conversations.delete(sessionId);
      }
    }
  }
}

// Instancia global del gestor de conversaciones
export const conversationManager = new ConversationManager();

export default conversationManager;

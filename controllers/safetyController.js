// controllers/safetyController.js

/**
 * Controlador de seguridad y emergencias para Ana IA
 * Maneja detección de emergencias y consultas de seguridad
 */

/**
 * Analiza si un mensaje contiene una emergencia o consulta de seguridad
 * @param {string} message - Mensaje del usuario
 * @returns {Object} - Análisis de seguridad
 */
export function analyzeSafetyQuery(message) {
  const emergencyKeywords = [
    // Español
    'emergencia', 'ayuda', 'peligro', 'socorro', 'auxilio', 'me robaron', 'robo', 
    'asalto', 'me atacaron', 'perdido', 'perdida', 'no encuentro', 'estoy en problemas',
    'me siento mal', 'accidente', 'herido', 'herida', 'sangre', 'dolor', 'hospital',
    // Inglés
    'emergency', 'help', 'danger', 'robbery', 'robbed', 'attacked', 'lost', 'trouble',
    'accident', 'hurt', 'injured', 'pain', 'hospital', 'police', 'ambulance'
  ];

  const safetyKeywords = [
    // Español
    'seguro', 'segura', 'seguridad', 'safe', 'caminar de noche', 'zona peligrosa',
    'es seguro', 'es peligroso', 'cuidado', 'precaución', 'delincuencia',
    // Inglés  
    'safe', 'safety', 'dangerous', 'crime', 'walk at night', 'secure area'
  ];

  const lowerMessage = message.toLowerCase();
  
  const isEmergency = emergencyKeywords.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase())
  );
  
  const isSafetyQuery = safetyKeywords.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase())
  );

  // Detectar idioma básico
  const isSpanish = /[ñáéíóúü]/.test(message) || 
    ['qué', 'dónde', 'cómo', 'cuándo', 'por qué'].some(word => 
      lowerMessage.includes(word)
    );

  return {
    isEmergency,
    isSafetyQuery,
    language: isSpanish ? 'es' : 'en'
  };
}

/**
 * Genera respuesta de emergencia
 * @param {string} message - Mensaje del usuario
 * @param {string} language - Idioma detectado
 * @returns {string} - Respuesta de emergencia
 */
export function generateEmergencyResponse(message, language = 'es') {
  if (language === 'en') {
    return `🚨 **EMERGENCY DETECTED** 🚨

I understand you may be in a dangerous situation. Please contact emergency services immediately:

**🚨 EMERGENCY NUMBERS COLOMBIA:**
• **Police**: 112 or 123
• **Medical Emergency**: 125  
• **Fire Department**: 119
• **Red Cross Cartagena**: 6627202
• **Coast Guard**: 6550316

**📍 IMPORTANT:**
1. Call the emergency numbers above immediately
2. Share your exact location with authorities
3. Stay in a safe place if possible
4. Contact your embassy if you're a foreigner

If you need tourist police assistance in Cartagena, you can also contact the tourist police directly.

Stay safe! 🙏`;
  }

  return `🚨 **EMERGENCIA DETECTADA** 🚨

Entiendo que puedes estar en una situación peligrosa. Por favor contacta a los servicios de emergencia inmediatamente:

**🚨 NÚMEROS DE EMERGENCIA COLOMBIA:**
• **Policía**: 112 o 123
• **Emergencias Médicas**: 125
• **Bomberos**: 119  
• **Cruz Roja Cartagena**: 6627202
• **Guardacostas**: 6550316

**📍 IMPORTANTE:**
1. Llama a los números de emergencia arriba inmediatamente
2. Comparte tu ubicación exacta con las autoridades
3. Mantente en un lugar seguro si es posible
4. Contacta tu embajada si eres extranjero

Si necesitas asistencia de policía de turismo en Cartagena, también puedes contactar directamente a la policía turística.

¡Mantente seguro! 🙏`;
}

/**
 * Genera respuesta de consulta de seguridad
 * @param {string} message - Mensaje del usuario
 * @param {string} language - Idioma detectado
 * @returns {string} - Respuesta de seguridad
 */
export function generateSafetyResponse(message, language = 'es') {
  if (language === 'en') {
    return `🛡️ **SAFETY INFORMATION FOR COLOMBIA** 🛡️

**General Safety Tips:**
• Stay in well-lit, populated areas, especially at night
• Keep valuables secure and avoid displaying expensive items
• Use official transportation services (registered taxis or Uber)
• Stay aware of your surroundings
• Keep copies of important documents

**In Cartagena specifically:**
• The Historic Center (Old City) is generally safe during the day
• Be cautious in outer neighborhoods at night
• Beach areas are safer during daylight hours
• Tourist police patrol main tourist areas

**Emergency Numbers:**
• **Police**: 112 or 123
• **Tourist Police**: Available in main tourist areas
• **Medical**: 125

**📱 Recommended Apps:**
• SOS Colombia (emergency app)
• Official tourism apps

Stay alert and enjoy your visit safely! If you have a specific safety concern, please let me know your location and I can provide more targeted advice.`;
  }

  return `🛡️ **INFORMACIÓN DE SEGURIDAD PARA COLOMBIA** 🛡️

**Consejos Generales de Seguridad:**
• Mantente en áreas bien iluminadas y pobladas, especialmente de noche
• Mantén tus objetos de valor seguros y evita mostrar artículos costosos
• Usa servicios de transporte oficiales (taxis registrados o Uber)
• Mantente alerta de tu entorno
• Guarda copias de documentos importantes

**En Cartagena específicamente:**
• El Centro Histórico (Ciudad Amurallada) es generalmente seguro durante el día
• Ten precaución en barrios periféricos de noche
• Las áreas de playa son más seguras durante las horas de luz
• La policía turística patrulla las principales áreas turísticas

**Números de Emergencia:**
• **Policía**: 112 o 123
• **Policía de Turismo**: Disponible en principales áreas turísticas
• **Médico**: 125

**📱 Apps Recomendadas:**
• SOS Colombia (app de emergencias)
• Apps oficiales de turismo

¡Mantente alerta y disfruta tu visita de manera segura! Si tienes una preocupación específica de seguridad, por favor dime tu ubicación y puedo darte consejos más específicos.`;
}

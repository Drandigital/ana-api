// controllers/reportController.js

/**
 * Controlador para manejar reportes de malas experiencias turísticas
 */

import fs from 'fs/promises';
import path from 'path';

// Base de datos en memoria para reportes (en producción usar una BD real)
let reportsDatabase = [];

// Ruta del archivo de persistencia
const REPORTS_FILE = './data/reports.json';

// Inicializar la carpeta de datos
async function initializeDataFolder() {
  try {
    await fs.mkdir('./data', { recursive: true });
    
    // Cargar reportes existentes
    try {
      const data = await fs.readFile(REPORTS_FILE, 'utf8');
      reportsDatabase = JSON.parse(data);
    } catch (error) {
      // Si no existe el archivo, crear uno vacío
      reportsDatabase = [];
      await saveReportsToFile();
    }
  } catch (error) {
    console.error('Error inicializando carpeta de datos:', error);
  }
}

// Guardar reportes en archivo
async function saveReportsToFile() {
  try {
    await fs.writeFile(REPORTS_FILE, JSON.stringify(reportsDatabase, null, 2));
  } catch (error) {
    console.error('Error guardando reportes:', error);
  }
}

/**
 * Detecta el idioma del mensaje del usuario
 * @param {string} message - Mensaje del usuario
 * @returns {string} - Código de idioma detectado
 */
function detectLanguage(message) {
  const lowerMessage = message.toLowerCase();
  
  // Palabras clave en español
  const spanishKeywords = ['hola', 'buenos', 'buenas', 'saludos', 'qué tal', 'cómo estás', 'me trataron', 'mal trato', 'cobro', 'abuso'];
  
  // Palabras clave en inglés
  const englishKeywords = ['hello', 'hi', 'good morning', 'good afternoon', 'how are you', 'mistreated', 'overcharged', 'abuse'];
  
  // Palabras clave en francés
  const frenchKeywords = ['bonjour', 'salut', 'comment allez-vous', 'maltraité', 'surfacturé'];
  
  // Palabras clave en portugués
  const portugueseKeywords = ['olá', 'oi', 'bom dia', 'boa tarde', 'como está', 'maltratado', 'cobrança abusiva'];
  
  if (spanishKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'es';
  } else if (englishKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'en';
  } else if (frenchKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'fr';
  } else if (portugueseKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'pt';
  }
  
  return 'es'; // Default español
}

/**
 * Detecta saludos y genera respuesta contextual
 * @param {string} message - Mensaje del usuario
 * @param {Object} userLocation - Ubicación del usuario {lat, lng, city}
 * @returns {Object} - Resultado del análisis
 */
export function analyzeGreeting(message, userLocation = null) {
  const lowerMessage = message.toLowerCase();
  
  // Patrones de saludo en múltiples idiomas
  const greetingPatterns = [
    // Español
    'hola', 'buenos días', 'buenas tardes', 'buenas noches', 'saludos', 'qué tal', 'cómo estás',
    // Inglés
    'hello', 'hi', 'good morning', 'good afternoon', 'good evening', 'hey', 'how are you',
    // Francés
    'bonjour', 'bonsoir', 'salut', 'comment allez-vous',
    // Portugués
    'olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'como está'
  ];
  
  const isGreeting = greetingPatterns.some(pattern => lowerMessage.includes(pattern));
  const language = detectLanguage(message);
  
  return {
    isGreeting,
    language,
    suggestedResponse: isGreeting ? generateGreetingResponse(language, userLocation) : null
  };
}

/**
 * Genera respuesta de saludo contextual
 * @param {string} language - Idioma detectado
 * @param {Object} userLocation - Ubicación del usuario
 * @returns {string} - Respuesta de saludo
 */
function generateGreetingResponse(language, userLocation) {
  const cityName = userLocation?.city || 'Colombia';
  
  const greetings = {
    es: {
      greeting: '¡Hola! ¿Cómo estás?',
      cityRecognition: `Veo que te encuentras en ${cityName} 🌴`,
      question: '¿Cómo te ha tratado esta ciudad? ¿En qué te puedo ayudar hoy?'
    },
    en: {
      greeting: 'Hi! How are you?',
      cityRecognition: `I see you're currently in ${cityName} 🏙️`,
      question: 'How has the city treated you? How can I assist you today?'
    },
    fr: {
      greeting: 'Bonjour! Comment allez-vous?',
      cityRecognition: `Je vois que vous êtes actuellement à ${cityName} 🌟`,
      question: 'Comment cette ville vous a-t-elle traité? Comment puis-je vous aider aujourd\'hui?'
    },
    pt: {
      greeting: 'Olá! Como você está?',
      cityRecognition: `Vejo que você está atualmente em ${cityName} 🌺`,
      question: 'Como esta cidade tem te tratado? Como posso ajudá-lo hoje?'
    }
  };
  
  const text = greetings[language] || greetings.es;
  
  return `${text.greeting} ${text.cityRecognition}. ${text.question}`;
}

/**
 * Detecta si el usuario menciona una mala experiencia
 * @param {string} message - Mensaje del usuario
 * @returns {Object} - Resultado del análisis
 */
export function analyzeBadExperience(message) {
  const lowerMessage = message.toLowerCase();
  const language = detectLanguage(message);
  
  // Palabras clave que indican mala experiencia
  const badExperienceKeywords = [
    // Español
    'mal trato', 'me trataron mal', 'abuso', 'cobro abusivo', 'estafa', 'discriminación',
    'grosero', 'mala atención', 'cobraron de más', 'problema', 'queja', 'reclamo',
    
    // Inglés
    'mistreated', 'bad treatment', 'overcharged', 'scam', 'discrimination', 'rude',
    'poor service', 'charged extra', 'problem', 'complaint', 'issue',
    
    // Francés
    'maltraité', 'mauvais traitement', 'surfacturé', 'arnaque', 'discrimination',
    'grossier', 'mauvais service', 'problème', 'plainte',
    
    // Portugués
    'maltratado', 'mau tratamento', 'cobrança abusiva', 'golpe', 'discriminação',
    'grosseiro', 'mau atendimento', 'problema', 'reclamação'
  ];
  
  const hasBadExperience = badExperienceKeywords.some(keyword => lowerMessage.includes(keyword));
  
  return {
    hasBadExperience,
    language,
    suggestedResponse: hasBadExperience ? generateEmpathyResponse(language) : null
  };
}

/**
 * Genera respuesta empática y ofrece ayuda para reportar
 * @param {string} language - Idioma
 * @returns {string} - Respuesta empática
 */
function generateEmpathyResponse(language) {
  const responses = {
    es: `Lamento mucho escuchar que tuviste una mala experiencia 😔. Nadie merece ser tratado de esa manera, especialmente cuando estás visitando nuestro hermoso país.

🤝 **¿Te gustaría que te ayude a realizar un reporte formal de lo que pasó?**

Esto puede ayudar a:
• Prevenir que otros turistas pasen por lo mismo
• Alertar a las autoridades competentes
• Mejorar la experiencia turística en Colombia

¿Quisieras proceder con el reporte? Solo te haré algunas preguntas sencillas.`,

    en: `I'm so sorry to hear that you had a bad experience 😔. No one deserves to be treated that way, especially when you're visiting our beautiful country.

🤝 **Would you like me to help you file a formal report about what happened?**

This can help to:
• Prevent other tourists from going through the same thing
• Alert the competent authorities
• Improve the tourist experience in Colombia

Would you like to proceed with the report? I'll just ask you some simple questions.`,

    fr: `Je suis vraiment désolé d'apprendre que vous avez eu une mauvaise expérience 😔. Personne ne mérite d'être traité de cette façon, surtout quand vous visitez notre beau pays.

🤝 **Aimeriez-vous que je vous aide à déposer un rapport formel sur ce qui s'est passé?**

Cela peut aider à:
• Empêcher d'autres touristes de vivre la même chose
• Alerter les autorités compétentes
• Améliorer l'expérience touristique en Colombie

Souhaitez-vous procéder au rapport? Je ne vous poserai que quelques questions simples.`,

    pt: `Lamento muito saber que você teve uma experiência ruim 😔. Ninguém merece ser tratado dessa forma, especialmente quando está visitando nosso lindo país.

🤝 **Gostaria que eu te ajudasse a fazer um relatório formal sobre o que aconteceu?**

Isso pode ajudar a:
• Prevenir que outros turistas passem pela mesma situação
• Alertar as autoridades competentes
• Melhorar a experiência turística na Colômbia

Gostaria de prosseguir com o relatório? Farei apenas algumas perguntas simples.`
  };
  
  return responses[language] || responses.es;
}

/**
 * Inicia el flujo de reporte paso a paso
 * @param {string} language - Idioma
 * @param {Object} userLocation - Ubicación del usuario
 * @returns {Object} - Próximo paso del reporte
 */
export function startReportFlow(language, userLocation) {
  const questions = {
    es: {
      cityConfirmation: `Perfecto, vamos a crear tu reporte paso a paso.

📍 **Primero, confirmemos la ciudad donde ocurrió el incidente:**
${userLocation?.city ? `Detecté que estás en ${userLocation.city}. ¿Es aquí donde pasó el problema?` : '¿En qué ciudad de Colombia ocurrió el incidente?'}

Responde simplemente "sí" o dime el nombre de la ciudad.`
    },
    en: {
      cityConfirmation: `Perfect, let's create your report step by step.

📍 **First, let's confirm the city where the incident occurred:**
${userLocation?.city ? `I detected that you're in ${userLocation.city}. Is this where the problem happened?` : 'In which city of Colombia did the incident occur?'}

Simply answer "yes" or tell me the name of the city.`
    },
    fr: {
      cityConfirmation: `Parfait, créons votre rapport étape par étape.

📍 **D'abord, confirmons la ville où l'incident s'est produit:**
${userLocation?.city ? `J'ai détecté que vous êtes à ${userLocation.city}. Est-ce ici que le problème s'est produit?` : 'Dans quelle ville de Colombie l\'incident s\'est-il produit?'}

Répondez simplement "oui" ou dites-moi le nom de la ville.`
    },
    pt: {
      cityConfirmation: `Perfeito, vamos criar seu relatório passo a passo.

📍 **Primeiro, vamos confirmar a cidade onde o incidente ocorreu:**
${userLocation?.city ? `Detectei que você está em ${userLocation.city}. Foi aqui que o problema aconteceu?` : 'Em qual cidade da Colômbia ocorreu o incidente?'}

Responda simplesmente "sim" ou me diga o nome da cidade.`
    }
  };
  
  return {
    step: 'city_confirmation',
    question: questions[language]?.cityConfirmation || questions.es.cityConfirmation,
    language
  };
}

/**
 * Procesa las respuestas del flujo de reporte
 * @param {string} step - Paso actual del reporte
 * @param {string} userResponse - Respuesta del usuario
 * @param {string} language - Idioma
 * @param {Object} reportData - Datos del reporte en construcción
 * @returns {Object} - Siguiente paso o completar reporte
 */
export function processReportStep(step, userResponse, language, reportData = {}) {
  const questions = {
    es: {
      businessName: `✅ Perfecto, ciudad confirmada: **${reportData.ciudad}**

🏢 **Ahora, ¿cuál es el nombre del negocio o establecimiento donde ocurrió el problema?**

Por ejemplo: "Hotel Playa Azul", "Restaurante El Pescador", "Taxi Amarillo", etc.`,

      personName: `🏢 Negocio registrado: **${reportData.nombre_negocio}**

👤 **¿Conoces el nombre de la persona que te atendió?** (Opcional)

Si no lo sabes, simplemente responde "no sé" o "no recuerdo".`,

      incidentDescription: `${reportData.persona_que_atendio ? `👤 Persona: **${reportData.persona_que_atendio}**` : ''}

📝 **Por favor, describe detalladamente lo que pasó:**

Incluye todos los detalles que consideres importantes: qué dijeron, qué hicieron, cómo te trataron, etc.`,

      dateTime: `📝 Descripción registrada.

🕐 **¿Cuándo ocurrió esto aproximadamente?**

Puedes responder de varias formas:
• "Hace 2 horas"
• "Ayer por la tarde"
• "El 5 de julio a las 3 PM"
• "Esta mañana"`,

      evidence: `⏰ Fecha y hora registradas.

📷 **¿Tienes alguna evidencia del incidente?** (Opcional)

Si tienes fotos, videos o capturas de pantalla que puedan ayudar, puedes subirlas. Si no tienes evidencia, simplemente responde "no tengo evidencia".`,

      consent: `📋 **Tu reporte está casi listo. Para finalizar necesito tu consentimiento:**

¿Autorizas que este reporte sea enviado a las autoridades competentes de turismo y protección al consumidor para que puedan tomar las medidas correspondientes?

Responde "sí, autorizo" o "no autorizo".`
    },
    en: {
      businessName: `✅ Perfect, city confirmed: **${reportData.ciudad}**

🏢 **Now, what is the name of the business or establishment where the problem occurred?**

For example: "Hotel Playa Azul", "El Pescador Restaurant", "Yellow Taxi", etc.`,

      personName: `🏢 Business registered: **${reportData.nombre_negocio}**

👤 **Do you know the name of the person who served you?** (Optional)

If you don't know, simply answer "I don't know" or "I don't remember".`,

      incidentDescription: `${reportData.persona_que_atendio ? `👤 Person: **${reportData.persona_que_atendio}**` : ''}

📝 **Please describe in detail what happened:**

Include all the details you consider important: what they said, what they did, how they treated you, etc.`,

      dateTime: `📝 Description recorded.

🕐 **When did this happen approximately?**

You can answer in various ways:
• "2 hours ago"
• "Yesterday afternoon"
• "July 5th at 3 PM"
• "This morning"`,

      evidence: `⏰ Date and time recorded.

📷 **Do you have any evidence of the incident?** (Optional)

If you have photos, videos or screenshots that might help, you can upload them. If you don't have evidence, simply answer "I have no evidence".`,

      consent: `📋 **Your report is almost ready. To finish I need your consent:**

Do you authorize this report to be sent to the competent tourism and consumer protection authorities so they can take appropriate measures?

Answer "yes, I authorize" or "I do not authorize".`
    }
  };
  
  const lang = questions[language] || questions.es;
  
  switch (step) {
    case 'city_confirmation':
      if (userResponse.toLowerCase().includes('sí') || userResponse.toLowerCase().includes('yes')) {
        reportData.ciudad = reportData.detectedCity || 'No especificada';
      } else {
        reportData.ciudad = userResponse;
      }
      
      // Generar pregunta personalizada con la ciudad confirmada
      const businessQuestionEs = `✅ Perfecto, ciudad confirmada: **${reportData.ciudad}**

🏢 **Ahora, ¿cuál es el nombre del negocio o establecimiento donde ocurrió el problema?**

Por ejemplo: "Hotel Playa Azul", "Restaurante El Pescador", "Taxi Amarillo", etc.`;

      const businessQuestionEn = `✅ Perfect, city confirmed: **${reportData.ciudad}**

🏢 **Now, what is the name of the business or establishment where the problem occurred?**

For example: "Hotel Playa Azul", "El Pescador Restaurant", "Yellow Taxi", etc.`;
      
      return {
        step: 'business_name',
        question: language === 'en' ? businessQuestionEn : businessQuestionEs,
        reportData
      };
      
    case 'business_name':
      reportData.nombre_negocio = userResponse;
      
      // Generar pregunta personalizada con el negocio confirmado
      const personQuestionEs = `🏢 Negocio registrado: **${reportData.nombre_negocio}**

👤 **¿Conoces el nombre de la persona que te atendió?** (Opcional)

Si no lo sabes, simplemente responde "no sé" o "no recuerdo".`;

      const personQuestionEn = `🏢 Business registered: **${reportData.nombre_negocio}**

👤 **Do you know the name of the person who served you?** (Optional)

If you don't know, simply answer "I don't know" or "I don't remember".`;
      
      return {
        step: 'person_name',
        question: language === 'en' ? personQuestionEn : personQuestionEs,
        reportData
      };
      
    case 'person_name':
      if (!userResponse.toLowerCase().includes('no sé') && !userResponse.toLowerCase().includes('no recuerdo') && 
          !userResponse.toLowerCase().includes('don\'t know') && !userResponse.toLowerCase().includes('don\'t remember')) {
        reportData.persona_que_atendio = userResponse;
      }
      
      // Generar pregunta personalizada
      const descriptionQuestionEs = `${reportData.persona_que_atendio ? `👤 Persona: **${reportData.persona_que_atendio}**` : ''}

📝 **Por favor, describe detalladamente lo que pasó:**

Incluye todos los detalles que consideres importantes: qué dijeron, qué hicieron, cómo te trataron, etc.`;

      const descriptionQuestionEn = `${reportData.persona_que_atendio ? `👤 Person: **${reportData.persona_que_atendio}**` : ''}

📝 **Please describe in detail what happened:**

Include all the details you consider important: what they said, what they did, how they treated you, etc.`;
      
      return {
        step: 'incident_description',
        question: language === 'en' ? descriptionQuestionEn : descriptionQuestionEs,
        reportData
      };
      
    case 'incident_description':
      reportData.descripcion = userResponse;
      
      const dateQuestionEs = `📝 Descripción registrada.

🕐 **¿Cuándo ocurrió esto aproximadamente?**

Puedes responder de varias formas:
• "Hace 2 horas"
• "Ayer por la tarde"
• "El 5 de julio a las 3 PM"
• "Esta mañana"`;

      const dateQuestionEn = `📝 Description recorded.

🕐 **When did this happen approximately?**

You can answer in various ways:
• "2 hours ago"
• "Yesterday afternoon"
• "July 5th at 3 PM"
• "This morning"`;
      
      return {
        step: 'date_time',
        question: language === 'en' ? dateQuestionEn : dateQuestionEs,
        reportData
      };
      
    case 'date_time':
      reportData.fecha_hora = userResponse;
      
      const evidenceQuestionEs = `⏰ Fecha y hora registradas.

📷 **¿Tienes alguna evidencia del incidente?** (Opcional)

Si tienes fotos, videos o capturas de pantalla que puedan ayudar, puedes subirlas. Si no tienes evidencia, simplemente responde "no tengo evidencia".`;

      const evidenceQuestionEn = `⏰ Date and time recorded.

📷 **Do you have any evidence of the incident?** (Optional)

If you have photos, videos or screenshots that might help, you can upload them. If you don't have evidence, simply answer "I have no evidence".`;
      
      return {
        step: 'evidence',
        question: language === 'en' ? evidenceQuestionEn : evidenceQuestionEs,
        reportData
      };
      
    case 'evidence':
      if (!userResponse.toLowerCase().includes('no tengo') && !userResponse.toLowerCase().includes('no evidence')) {
        reportData.evidencia_descripcion = userResponse;
      }
      
      const consentQuestionEs = `📋 **Tu reporte está casi listo. Para finalizar necesito tu consentimiento:**

¿Autorizas que este reporte sea enviado a las autoridades competentes de turismo y protección al consumidor para que puedan tomar las medidas correspondientes?

Responde "sí, autorizo" o "no autorizo".`;

      const consentQuestionEn = `📋 **Your report is almost ready. To finish I need your consent:**

Do you authorize this report to be sent to the competent tourism and consumer protection authorities so they can take appropriate measures?

Answer "yes, I authorize" or "I do not authorize".`;
      
      return {
        step: 'consent',
        question: language === 'en' ? consentQuestionEn : consentQuestionEs,
        reportData
      };
      
    case 'consent':
      const hasConsent = userResponse.toLowerCase().includes('sí') || 
                        userResponse.toLowerCase().includes('autorizo') ||
                        userResponse.toLowerCase().includes('yes') ||
                        userResponse.toLowerCase().includes('authorize');
      
      reportData.consentimiento_envio_autoridades = hasConsent;
      
      // Completar y guardar el reporte
      return completeReport(reportData, language);
      
    default:
      return { error: 'Paso no reconocido' };
  }
}

/**
 * Completa y guarda el reporte
 * @param {Object} reportData - Datos del reporte
 * @param {string} language - Idioma
 * @returns {Object} - Confirmación del reporte
 */
async function completeReport(reportData, language) {
  const finalReport = {
    ...reportData,
    idioma: language,
    timestamp_reporte: new Date().toISOString(),
    id_reporte: `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  
  // Guardar en la base de datos
  reportsDatabase.push(finalReport);
  await saveReportsToFile();
  
  const confirmations = {
    es: `✅ **¡Reporte completado exitosamente!**

📋 **ID del reporte:** ${finalReport.id_reporte}

Tu reporte ha sido ${finalReport.consentimiento_envio_autoridades ? 'enviado a las autoridades competentes' : 'guardado en nuestro sistema'}.

🤝 **Gracias por ayudarnos a mejorar la experiencia turística en Colombia.**

¿Hay algo más en lo que pueda ayudarte?`,

    en: `✅ **Report completed successfully!**

📋 **Report ID:** ${finalReport.id_reporte}

Your report has been ${finalReport.consentimiento_envio_autoridades ? 'sent to the competent authorities' : 'saved in our system'}.

🤝 **Thank you for helping us improve the tourist experience in Colombia.**

Is there anything else I can help you with?`,

    fr: `✅ **Rapport complété avec succès!**

📋 **ID du rapport:** ${finalReport.id_reporte}

Votre rapport a été ${finalReport.consentimiento_envio_autoridades ? 'envoyé aux autorités compétentes' : 'sauvegardé dans notre système'}.

🤝 **Merci de nous aider à améliorer l'expérience touristique en Colombie.**

Y a-t-il autre chose pour laquelle je peux vous aider?`,

    pt: `✅ **Relatório concluído com sucesso!**

📋 **ID do relatório:** ${finalReport.id_reporte}

Seu relatório foi ${finalReport.consentimiento_envio_autoridades ? 'enviado às autoridades competentes' : 'salvo em nosso sistema'}.

🤝 **Obrigado por nos ajudar a melhorar a experiência turística na Colômbia.**

Há mais alguma coisa em que posso ajudá-lo?`
  };
  
  return {
    completed: true,
    reportId: finalReport.id_reporte,
    message: confirmations[language] || confirmations.es,
    report: finalReport
  };
}

/**
 * Obtiene estadísticas de reportes
 * @returns {Object} - Estadísticas
 */
export function getReportsStats() {
  const total = reportsDatabase.length;
  const withConsent = reportsDatabase.filter(r => r.consentimiento_envio_autoridades).length;
  const cities = [...new Set(reportsDatabase.map(r => r.ciudad))];
  const languages = [...new Set(reportsDatabase.map(r => r.idioma))];
  
  return {
    total,
    withConsent,
    cities: cities.length,
    languages: languages.length,
    recentReports: reportsDatabase.slice(-5)
  };
}

// Inicializar al cargar el módulo
initializeDataFolder();

export default {
  analyzeGreeting,
  analyzeBadExperience,
  startReportFlow,
  processReportStep,
  getReportsStats
};

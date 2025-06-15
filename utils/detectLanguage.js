// utils/detectLanguage.js (ES Modules)

/**
 * Detects the language of a given text
 * @param {string} text - The text to analyze
 * @returns {string} - Language code ('en' or 'es')
 */
export function detectLanguage(text) {
  if (!text || text.trim().length === 0) {
    return 'es'; // Default to Spanish if no text
  }

  try {
    const lowerText = text.toLowerCase();
    
    // Check for English keywords
    const englishKeywords = [
      'the', 'what', 'where', 'when', 'how', 'why', 'who', 'which',
      'can', 'could', 'would', 'will', 'should', 'might', 'must',
      'and', 'but', 'or', 'because', 'if', 'although',
      'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
      'please', 'thank', 'thanks', 'welcome', 'sorry',
      'tourism', 'travel', 'trip', 'visit', 'tour', 'hotel', 'restaurant',
      'beach', 'flight', 'ticket', 'booking', 'reservation'
    ];

    // Count English keywords
    let englishCount = 0;
    for (const keyword of englishKeywords) {
      if (lowerText.includes(` ${keyword} `) || 
          lowerText.startsWith(`${keyword} `) || 
          lowerText === keyword || 
          lowerText.endsWith(` ${keyword}`)) {
        englishCount++;
      }
    }

    // Check for Spanish keywords
    const spanishKeywords = [
      'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
      'qué', 'dónde', 'cuándo', 'cómo', 'por qué', 'quién', 'cuál',
      'puede', 'podría', 'debería', 'será', 'es', 'son', 'está', 'están',
      'y', 'pero', 'o', 'porque', 'si', 'aunque',
      'hola', 'buenos días', 'buenas tardes', 'buenas noches',
      'por favor', 'gracias', 'bienvenido', 'lo siento', 'perdón',
      'turismo', 'viaje', 'visita', 'tour', 'hotel', 'restaurante',
      'playa', 'vuelo', 'boleto', 'reserva', 'reservación'
    ];

    // Count Spanish keywords
    let spanishCount = 0;
    for (const keyword of spanishKeywords) {
      if (lowerText.includes(` ${keyword} `) || 
          lowerText.startsWith(`${keyword} `) || 
          lowerText === keyword || 
          lowerText.endsWith(` ${keyword}`)) {
        spanishCount++;
      }
    }

    // Additional Spanish character detection
    const spanishCharacters = ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ', '¿', '¡'];
    for (const char of spanishCharacters) {
      if (lowerText.includes(char)) {
        spanishCount += 2; // Give extra weight to Spanish-specific characters
      }
    }

    // Compare counts and determine language
    return englishCount > spanishCount ? 'en' : 'es';
  } catch (error) {
    console.error('Error detecting language:', error);
    return 'es'; // Default to Spanish on error
  }
}
// utils/detectLanguage.js (ES Modules)

/**
 * Detects the language of a given text
 * @param {string} text - The text to analyze
 * @returns {string} - Language code ('en', 'es', 'pt', 'fr', 'it', etc.)
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
      'beach', 'flight', 'ticket', 'booking', 'reservation', 'best', 'near', 'show'
    ];

    // Check for Spanish keywords
    const spanishKeywords = [
      'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
      'qué', 'dónde', 'cuándo', 'cómo', 'por qué', 'quién', 'cuál',
      'puede', 'podría', 'debería', 'será', 'es', 'son', 'está', 'están',
      'y', 'pero', 'o', 'porque', 'si', 'aunque',
      'hola', 'buenos días', 'buenas tardes', 'buenas noches',
      'por favor', 'gracias', 'bienvenido', 'lo siento', 'perdón',
      'turismo', 'viaje', 'visita', 'tour', 'hotel', 'restaurante',
      'playa', 'vuelo', 'boleto', 'reserva', 'reservación', 'mejores', 'cerca', 'muestra'
    ];

    // Check for Portuguese keywords
    const portugueseKeywords = [
      'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
      'que', 'onde', 'quando', 'como', 'por que', 'quem', 'qual',
      'pode', 'poderia', 'deveria', 'será', 'é', 'são', 'está', 'estão',
      'e', 'mas', 'ou', 'porque', 'se', 'embora',
      'olá', 'oi', 'bom dia', 'boa tarde', 'boa noite',
      'por favor', 'obrigado', 'bem-vindo', 'desculpe',
      'turismo', 'viagem', 'visita', 'tour', 'hotel', 'restaurante',
      'praia', 'voo', 'bilhete', 'reserva', 'melhores', 'perto', 'localização'
    ];

    // Check for French keywords
    const frenchKeywords = [
      'le', 'la', 'les', 'un', 'une', 'des',
      'que', 'où', 'quand', 'comment', 'pourquoi', 'qui', 'quel',
      'peut', 'pourrait', 'devrait', 'sera', 'est', 'sont',
      'et', 'mais', 'ou', 'parce que', 'si', 'bien que',
      'bonjour', 'salut', 'bonsoir', 'bonne nuit',
      's\'il vous plaît', 'merci', 'bienvenue', 'désolé',
      'tourisme', 'voyage', 'visite', 'tour', 'hôtel', 'restaurant',
      'plage', 'vol', 'billet', 'réservation', 'meilleurs', 'près', 'position'
    ];

    // Check for Italian keywords
    const italianKeywords = [
      'il', 'la', 'i', 'le', 'un', 'una', 'degli', 'delle',
      'che', 'dove', 'quando', 'come', 'perché', 'chi', 'quale',
      'può', 'potrebbe', 'dovrebbe', 'sarà', 'è', 'sono',
      'e', 'ma', 'o', 'perché', 'se', 'anche se',
      'ciao', 'buongiorno', 'buonasera', 'buonanotte',
      'per favore', 'grazie', 'benvenuto', 'scusa',
      'turismo', 'viaggio', 'visita', 'tour', 'hotel', 'ristorante',
      'spiaggia', 'volo', 'biglietto', 'prenotazione', 'migliori', 'vicino'
    ];

    // Count keywords for each language
    let englishCount = 0;
    let spanishCount = 0;
    let portugueseCount = 0;
    let frenchCount = 0;
    let italianCount = 0;

    // Function to count keywords
    const countKeywords = (keywords) => {
      let count = 0;
      for (const keyword of keywords) {
        if (lowerText.includes(` ${keyword} `) || 
            lowerText.startsWith(`${keyword} `) || 
            lowerText === keyword || 
            lowerText.endsWith(` ${keyword}`)) {
          count++;
        }
      }
      return count;
    };

    englishCount = countKeywords(englishKeywords);
    spanishCount = countKeywords(spanishKeywords);
    portugueseCount = countKeywords(portugueseKeywords);
    frenchCount = countKeywords(frenchKeywords);
    italianCount = countKeywords(italianKeywords);

    // Additional character detection for Spanish
    const spanishCharacters = ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ', '¿', '¡'];
    for (const char of spanishCharacters) {
      if (lowerText.includes(char)) {
        spanishCount += 2; // Give extra weight to Spanish-specific characters
      }
    }

    // Additional character detection for Portuguese
    const portugueseCharacters = ['ã', 'õ', 'ç', 'â', 'ê', 'ô'];
    for (const char of portugueseCharacters) {
      if (lowerText.includes(char)) {
        portugueseCount += 2;
      }
    }

    // Additional character detection for French
    const frenchCharacters = ['à', 'è', 'ù', 'â', 'ê', 'î', 'ô', 'û', 'ë', 'ï', 'ü', 'ÿ', 'ç'];
    for (const char of frenchCharacters) {
      if (lowerText.includes(char)) {
        frenchCount += 2;
      }
    }

    // Check for German keywords and characters
    const germanKeywords = ['der', 'die', 'das', 'und', 'ist', 'sind', 'was', 'wo', 'wie', 'beste', 'hotel', 'nähe', 'von', 'mit'];
    const germanCharacters = ['ä', 'ö', 'ü', 'ß'];
    
    let germanCount = 0;
    germanCount = countKeywords(germanKeywords);
    for (const char of germanCharacters) {
      if (lowerText.includes(char)) {
        germanCount += 2;
      }
    }

    // Check for Russian using Cyrillic script
    let russianCount = 0;
    if (/[а-яё]/i.test(text)) {
      russianCount = 10; // High weight for Cyrillic characters
    }

    // Check for Chinese - specifically traditional/simplified Chinese characters
    let chineseCount = 0;
    if (/[一-龯]/.test(text) && !/[ひらがなカタカナ]/.test(text)) {
      chineseCount = 10; // High weight for Chinese characters without Japanese hiragana/katakana
    }

    // Check for Japanese - hiragana, katakana, or kanji with hiragana/katakana
    let japaneseCount = 0;
    if (/[ひらがなカタカナ]/.test(text) || (/[一-龯]/.test(text) && /[ひらがなカタカナ]/.test(text))) {
      japaneseCount = 10; // High weight for Japanese scripts
    }

    // Find the language with the highest score
    const scores = {
      'en': englishCount,
      'es': spanishCount,
      'pt': portugueseCount,
      'fr': frenchCount,
      'it': italianCount,
      'de': germanCount,
      'ru': russianCount,
      'zh': chineseCount,
      'ja': japaneseCount
    };

    let maxScore = 0;
    let detectedLanguage = 'es'; // Default to Spanish

    for (const [lang, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedLanguage = lang;
      }
    }

    console.log(`🔍 Language detection scores:`, scores);
    console.log(`🎯 Detected language: ${detectedLanguage}`);

    return detectedLanguage;
  } catch (error) {
    console.error('Error detecting language:', error);
    return 'es'; // Default to Spanish on error
  }
}
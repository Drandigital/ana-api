// controllers/queryAnalysisController.js

/**
 * Analyzes the user query to extract intents, categories, and locations
 * @param {string} originalMessage - Original user message
 * @param {string} lowerMessage - Lowercase user message
 * @returns {Object} - Analysis results with city, category, and intents
 */
export function analyzeQuery(originalMessage, lowerMessage) {
    const result = {
      city: null,
      businessCategory: null,
      intents: [],
      searchType: null, // 'proximity', 'city_specific', 'location_query', 'weather'
      confidence: 0
    };
    
    // Detect intents
    if (lowerMessage.includes('clima') || lowerMessage.includes('weather') || 
        lowerMessage.includes('temperatura') || lowerMessage.includes('temperature')) {
      result.intents.push('weather');
    }
    
    if (lowerMessage.includes('vuelo') || lowerMessage.includes('flight') || 
        lowerMessage.includes('boleto') || lowerMessage.includes('ticket')) {
      result.intents.push('flight');
    }
    
    // Detect simple city names (let OpenAI handle the rest)
    const colombianCities = [
      'cartagena', 'bogota', 'bogotá', 'medellin', 'medellín', 'cali',
      'barranquilla', 'santa marta', 'bucaramanga', 'pereira', 'manizales',
      'cucuta', 'cúcuta', 'armenia', 'ibague', 'villavicencio'
    ];
    
    for (const city of colombianCities) {
      if (lowerMessage.includes(city)) {
        result.city = city.charAt(0).toUpperCase() + city.slice(1);
        result.confidence += 0.3;
        break;
      }
    }
    
    // Detect business categories
    const categoryMappings = {
      'hotel': ['hotel', 'hotels', 'hospedaje', 'alojamiento', 'hostal', 'posada'],
      'restaurant': ['restaurante', 'restaurant', 'comida', 'comer', 'almorzar', 'cenar'],
      'bar': ['bar', 'bars', 'discoteca', 'club', 'rumba', 'fiesta'],
      'tourist_attraction': ['atraccion', 'atracción', 'turismo', 'visitar', 'conocer', 'lugar'],
      'airport': ['aeropuerto', 'airport', 'vuelo', 'flight']
    };
    
    for (const [category, keywords] of Object.entries(categoryMappings)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        result.businessCategory = category;
        result.confidence += 0.4;
        break;
      }
    }
    
    // Determine search type
    if (lowerMessage.includes('cerca') || lowerMessage.includes('near') || 
        lowerMessage.includes('around') || lowerMessage.includes('nearby')) {
      result.searchType = 'proximity';
      result.intents.push('location');
    } else if (result.city) {
      result.searchType = 'city_specific';
    } else if (lowerMessage.includes('ubicación') || lowerMessage.includes('location') ||
               lowerMessage.includes('donde estoy') || lowerMessage.includes('where am i')) {
      result.searchType = 'location_query';
      result.intents.push('location');
    } else if (result.intents.includes('weather')) {
      result.searchType = 'weather';
    }
    
    return result;
}
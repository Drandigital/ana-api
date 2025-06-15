// controllers/queryAnalysisController.js

/**
 * Analyzes the user query to extract intents, categories, and locations
 * @param {string} originalMessage - Original user message
 * @param {string} lowerMessage - Lowercase user message
 * @param {string} language - Detected language
 * @returns {Object} - Analysis results with city, category, and intents
 */
export function analyzeQuery(originalMessage, lowerMessage, language) {
    const result = {
      city: null,
      businessCategory: null,
      intents: []
    };
    
    // Detect cities in the message
    const colombianCities = [
      'cartagena', 'bogota', 'bogotá', 'medellin', 'medellín', 'cali', 
      'barranquilla', 'santa marta', 'bucaramanga', 'pereira', 'manizales', 
      'cúcuta', 'cucuta', 'ibague', 'ibagué', 'villavicencio', 'armenia', 
      'popayán', 'popayan', 'barrancabermeja', 'soacha'
    ];
    
    for (const city of colombianCities) {
      if (lowerMessage.includes(city)) {
        result.city = city.charAt(0).toUpperCase() + city.slice(1);
        break;
      }
    }
    
    // Detect business categories
    const categoryKeywords = {
      hotel: ['hotel', 'hostal', 'alojamiento', 'hospedaje', 'accommodation', 'lodging', 'dormir', 'sleep', 'hostel', 'hostales'],
      restaurant: ['restaurante', 'comida', 'comer', 'restaurant', 'food', 'dining', 'almorzar', 'cenar', 'restaurantes', 'restaurants'],
      bar: ['bar', 'bares', 'bebidas', 'drinks', 'nightlife', 'vida nocturna', 'pub', 'pubs', 'discoteca', 'discotecas'],
      museum: ['museo', 'museum', 'exposición', 'exhibition', 'galería', 'gallery', 'arte', 'art', 'museos', 'museums'],
      beach: ['playa', 'beach', 'costa', 'coast', 'mar', 'sea', 'playas', 'beaches', 'oceano', 'ocean'],
      attraction: ['atracción', 'atracciones', 'atraccion', 'atracciones', 'attraction', 'attractions', 'lugar', 'lugares', 'place', 'places']
    };
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword)) {
          result.businessCategory = category;
          break;
        }
      }
      if (result.businessCategory) break;
    }
    
    // Detect location-specific requests (near me, closest, etc.)
    const locationKeywords = {
      en: ['near me', 'closest', 'nearby', 'walking distance', 'proximity', 'near my location', 'nearest'],
      es: ['cerca', 'cercano', 'cercana', 'próximo', 'proxima', 'cerca de mí', 'cercanos', 'cercanas', 'a poca distancia']
    };
    
    const relevantKeywords = language === 'en' ? 
      [...locationKeywords.en] : 
      [...locationKeywords.es];
      
    for (const keyword of relevantKeywords) {
      if (lowerMessage.includes(keyword)) {
        result.intents.push('location');
        break;
      }
    }
    
    // Detect user intents
    if (lowerMessage.includes('clima') || lowerMessage.includes('weather') || 
        lowerMessage.includes('temperatura') || lowerMessage.includes('temperature')) {
      result.intents.push('weather');
    }
    
    if (lowerMessage.includes('vuelo') || lowerMessage.includes('flight') || 
        lowerMessage.includes('viaje') || lowerMessage.includes('travel') ||
        lowerMessage.includes('avión') || lowerMessage.includes('avion') ||
        lowerMessage.includes('plane')) {
      result.intents.push('flight');
    }
    
    if (lowerMessage.includes('reserva') || lowerMessage.includes('booking') || 
        lowerMessage.includes('reservar') || lowerMessage.includes('book') ||
        lowerMessage.includes('reservation')) {
      result.intents.push('booking');
    }
    
    return result;
  }
// config/airportCodes.js (ES Modules)

/**
 * Map of city names to their IATA airport codes
 * This helps us recognize cities in user messages and map them to the proper codes
 * for flight search
 */
export const authorizedCities = {
  // Colombian cities
  'bogotá': 'BOG',
  'bogota': 'BOG',
  'medellín': 'MDE',
  'medellin': 'MDE',
  'cali': 'CLO',
  'cartagena': 'CTG', 
  'barranquilla': 'BAQ',
  'santa marta': 'SMR',
  'pereira': 'PEI',
  'bucaramanga': 'BGA',
  'cúcuta': 'CUC',
  'cucuta': 'CUC',
  'san andrés': 'ADZ',
  'san andres': 'ADZ',
  'armenia': 'AXM',
  'ibagué': 'IBE',
  'ibague': 'IBE',
  'manizales': 'MZL',
  'montería': 'MTR',
  'monteria': 'MTR',
  'popayán': 'PPN',
  'popayan': 'PPN',
  'valledupar': 'VUP',
  'villavicencio': 'VVC',
  'neiva': 'NVA',
  'pasto': 'PSO',
  'leticia': 'LET',
  'quibdó': 'UIB',
  'quibdo': 'UIB',
  'riohacha': 'RCH',
  
  // International cities - North America
  'miami': 'MIA',
  'new york': 'JFK',
  'nueva york': 'JFK',
  'los angeles': 'LAX',
  'chicago': 'ORD',
  'toronto': 'YYZ',
  'mexico city': 'MEX',
  'ciudad de méxico': 'MEX',
  'ciudad de mexico': 'MEX',
  'panama city': 'PTY',
  'panama': 'PTY',
  'panamá': 'PTY',
  
  // International cities - South America
  'buenos aires': 'EZE',
  'santiago': 'SCL',
  'lima': 'LIM',
  'quito': 'UIO',
  'são paulo': 'GRU',
  'sao paulo': 'GRU',
  'rio de janeiro': 'GIG',
  'caracas': 'CCS',
  
  // International cities - Europe
  'madrid': 'MAD',
  'barcelona': 'BCN',
  'paris': 'CDG',
  'london': 'LHR',
  'londres': 'LHR',
  'rome': 'FCO',
  'roma': 'FCO',
  'amsterdam': 'AMS',
  'berlin': 'BER',
  'munich': 'MUC',
  'frankfurt': 'FRA',
  'lisbon': 'LIS',
  'lisboa': 'LIS',
  'brussels': 'BRU',
  'bruselas': 'BRU',
  'vienna': 'VIE',
  'viena': 'VIE',
  'zurich': 'ZRH',
  
  // International cities - Other regions
  'dubai': 'DXB',
  'tokyo': 'NRT',
  'tokio': 'NRT',
  'singapore': 'SIN',
  'singapur': 'SIN',
  'beijing': 'PEK',
  'pekin': 'PEK',
  'sydney': 'SYD',
  'sydney': 'SYD'
};

/**
 * Get IATA code for a city name
 * @param {string} cityName - Name of the city
 * @returns {string|null} - IATA code or null if not found
 */
export function getIataCode(cityName) {
  if (!cityName) return null;
  
  const normalizedCity = cityName.toLowerCase().trim();
  return authorizedCities[normalizedCity] || null;
}

/**
 * Find city name that matches a given IATA code
 * @param {string} iataCode - IATA airport code
 * @returns {string|null} - City name or null if not found
 */
export function getCityNameFromIata(iataCode) {
  if (!iataCode) return null;
  
  const upperCode = iataCode.toUpperCase();
  for (const [city, code] of Object.entries(authorizedCities)) {
    if (code === upperCode) {
      // Capitalize first letter
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }
  
  return null;
}
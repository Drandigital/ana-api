// services/dataCoordinator.js

/**
 * Coordinador principal de datos externos para Ana IA
 * Gestiona y coordina todas las llamadas a APIs externas de forma inteligente
 */

import geolocationService from './geolocationService.js';
import { getWeatherData } from './externalApiService.js';
import { getPlacesNearUser } from './externalApiService.js';
import { searchFlights } from './amadeusFlightService.js';
import { findPremiumBusinesses } from './premiumBusinessService.js';

/**
 * Coordinador principal de datos
 */
class DataCoordinator {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 10 * 60 * 1000; // 10 minutos
  }

  /**
   * Obtiene todos los datos necesarios según las necesidades detectadas
   */
  async gatherContextualData(dataNeeds, userLocation, currentTopic, userMessage) {
    const data = {};
    const promises = [];

    // Obtener ubicación si es necesaria
    if (dataNeeds.location && userLocation) {
      promises.push(this.getLocationData(userLocation).then(result => {
        data.location = result;
      }));
    }

    // Obtener clima si es necesario
    if (dataNeeds.weather) {
      // Primero intentar extraer ciudad del mensaje del usuario
      const cityFromMessage = this.extractCityFromMessage(userMessage);
      
      if (cityFromMessage) {
        // Usuario especificó una ciudad en el mensaje
        console.log(`🌤️ Usando ciudad del mensaje: ${cityFromMessage}`);
        promises.push(this.getWeatherDataByCity(cityFromMessage).then(result => {
          data.weather = result;
        }));
      } else if (userLocation && userLocation.lat && userLocation.lng) {
        // No hay ciudad en el mensaje, usar ubicación GPS del usuario
        const nearestCityObj = geolocationService.getNearestCity(userLocation.lat, userLocation.lng);
        const nearestCity = nearestCityObj?.name || 'cartagena';
        console.log(`🌤️ Usando ciudad por GPS: ${nearestCity} (${userLocation.lat}, ${userLocation.lng})`);
        
        promises.push(this.getWeatherDataByCity(nearestCity).then(result => {
          data.weather = result;
        }));
      } else {
        // Sin ciudad específica ni ubicación GPS, usar ciudad por defecto
        console.log('🌤️ Sin ubicación específica, usando Cartagena como ciudad por defecto');
        promises.push(this.getWeatherDataByCity('cartagena').then(result => {
          data.weather = result;
        }));
      }
    }

    // Obtener lugares si es necesario
    if (dataNeeds.places && userLocation) {
      promises.push(this.getPlacesData(userLocation, currentTopic, userMessage).then(result => {
        data.places = result;
      }));
    }

    // Obtener vuelos si es necesario
    if (dataNeeds.flights) {
      promises.push(this.getFlightData(userMessage, userLocation).then(result => {
        data.flights = result;
      }));
    }

    // Obtener negocios premium si es necesario
    if (dataNeeds.business && userLocation) {
      promises.push(this.getBusinessData(userLocation, currentTopic).then(result => {
        data.business = result;
      }));
    }

    await Promise.allSettled(promises);
    return data;
  }

  /**
   * Obtiene datos de ubicación detallados
   */
  async getLocationData(userLocation) {
    try {
      const nearestCity = geolocationService.getNearestCity(userLocation.lat, userLocation.lng);
      return {
        coordinates: userLocation,
        nearestCity: nearestCity ? nearestCity.name : 'Unknown',
        department: nearestCity ? nearestCity.department : 'Unknown',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting location data:', error);
      return null;
    }
  }

  /**
   * Obtiene datos de lugares cercanos
   */
  async getPlacesData(userLocation, topic, userMessage) {
    const cacheKey = `places_${userLocation.lat}_${userLocation.lng}_${topic}`;
    
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const placesData = await getPlacesNearUser(userLocation.lat, userLocation.lng, topic);
      this.setCache(cacheKey, placesData);
      return placesData;
    } catch (error) {
      console.error('Error getting places data:', error);
      return null;
    }
  }

  /**
   * Obtiene datos de vuelos
   */
  async getFlightData(userMessage, userLocation) {
    try {
      console.log('🛩️ Iniciando búsqueda de vuelos...');
      const flightInfo = this.extractFlightInfo(userMessage, userLocation);
      console.log('🔍 Información extraída:', flightInfo);
      
      if (flightInfo.origin && flightInfo.destination) {
        console.log(`✈️ Buscando vuelos ${flightInfo.origin} → ${flightInfo.destination} (${flightInfo.departureDate})`);
        const flights = await searchFlights(flightInfo);
        console.log('✅ Búsqueda completada:', flights?.length || 0, 'vuelos encontrados');
        
        if (!flights || flights.length === 0) {
          console.log('⚠️ No se encontraron vuelos para estos criterios');
          return {
            flights: [],
            searchCriteria: flightInfo,
            message: 'No se encontraron vuelos para los criterios especificados'
          };
        }
        
        return {
          flights: flights,
          searchCriteria: flightInfo,
          totalResults: flights.length
        };
      } else {
        console.log('⚠️ No se pudo extraer información completa de vuelos del mensaje');
        return {
          flights: [],
          error: 'No se pudo determinar el origen y destino del vuelo',
          message: 'Por favor especifica las ciudades de origen y destino'
        };
      }
    } catch (error) {
      console.error('❌ Error obteniendo datos de vuelos:', error);
      return {
        flights: [],
        error: error.message,
        message: 'Error al buscar vuelos'
      };
    }
  }

  /**
   * Obtiene datos de negocios premium
   */
  async getBusinessData(userLocation, topic) {
    const cacheKey = `business_${userLocation.lat}_${userLocation.lng}_${topic}`;
    
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const businessData = await findPremiumBusinesses(userLocation, topic);
      this.setCache(cacheKey, businessData);
      return businessData;
    } catch (error) {
      console.error('Error getting business data:', error);
      return null;
    }
  }

  /**
   * Extrae información de vuelos del mensaje del usuario
   */
  extractFlightInfo(message, userLocation) {
    console.log('📝 Mensaje:', message);
    
    const lowerMessage = message.toLowerCase();
    
    // Mapeo de ciudades a códigos IATA
    const cityToIATA = {
      'bogotá': 'BOG', 'bogota': 'BOG',
      'medellín': 'MDE', 'medellin': 'MDE',
      'cali': 'CLO',
      'cartagena': 'CTG',
      'barranquilla': 'BAQ',
      'bucaramanga': 'BGA',
      'santa marta': 'SMR',
      'pereira': 'PEI',
      'armenia': 'AXM',
      'manizales': 'UIO', // Temporal, verificar código correcto
      'valledupar': 'VUP',
      'montería': 'MTR', 'monteria': 'MTR',
      'neiva': 'NVA',
      'pasto': 'PSO',
      'popayán': 'PPN', 'popayan': 'PPN',
      'villavicencio': 'VVC',
      'ibagué': 'IBE', 'ibague': 'IBE',
      'cúcuta': 'CUC', 'cucuta': 'CUC',
      'riohacha': 'RCH',
      'leticia': 'LET',
      'san andrés': 'ADZ', 'san andres': 'ADZ',
      'providencia': 'PVA',
      
      // Ciudades internacionales comunes
      'miami': 'MIA',
      'nueva york': 'JFK', 'new york': 'JFK',
      'madrid': 'MAD',
      'barcelona': 'BCN',
      'paris': 'CDG',
      'londres': 'LHR', 'london': 'LHR',
      'lima': 'LIM',
      'quito': 'UIO',
      'panamá': 'PTY', 'panama': 'PTY',
      'méxico': 'MEX', 'mexico': 'MEX',
      'cancún': 'CUN', 'cancun': 'CUN'
    };

    // Patrones para extraer información de vuelos
    const flightPatterns = [
      // "vuelos de [origen] a [destino]"
      /vuelos?\s+de\s+([a-záéíóúñü\s]+?)\s+a\s+([a-záéíóúñü\s]+?)(?:\s|$|,|\.|;|\?|!)/i,
      // "viajar de [origen] a [destino]"
      /viajar\s+de\s+([a-záéíóúñü\s]+?)\s+a\s+([a-záéíóúñü\s]+?)(?:\s|$|,|\.|;|\?|!)/i,
      // "boletos de [origen] a [destino]"
      /boletos?\s+de\s+([a-záéíóúñü\s]+?)\s+a\s+([a-záéíóúñü\s]+?)(?:\s|$|,|\.|;|\?|!)/i,
      // "[origen] a [destino]" (más general)
      /([a-záéíóúñü\s]+?)\s+a\s+([a-záéíóúñü\s]+?)(?:\s|$|,|\.|;|\?|!)/i
    ];

    let origin = null;
    let destination = null;

    // Buscar ciudades con patrones
    for (const pattern of flightPatterns) {
      const match = lowerMessage.match(pattern);
      if (match && match[1] && match[2]) {
        const originCity = match[1].trim();
        const destCity = match[2].trim();
        
        // Verificar que ambas son ciudades válidas
        const originCode = this.findCityCode(originCity, cityToIATA);
        const destCode = this.findCityCode(destCity, cityToIATA);
        
        if (originCode && destCode) {
          origin = originCode;
          destination = destCode;
          break;
        }
      }
    }

    // Si no encontró ciudades específicas, usar ubicación del usuario como origen
    if (!origin && userLocation) {
      const nearestCity = geolocationService.getNearestCity(userLocation.lat, userLocation.lng);
      if (nearestCity) {
        const nearestCode = this.findCityCode(nearestCity.name, cityToIATA);
        if (nearestCode) {
          origin = nearestCode;
        }
      }
    }

    // Si aún no hay origen, usar un código por defecto basado en ubicación
    if (!origin) {
      origin = 'CTG'; // Cartagena por defecto
    }

    // Si no hay destino específico, intentar detectar ciudades mencionadas
    if (!destination) {
      for (const [city, code] of Object.entries(cityToIATA)) {
        if (lowerMessage.includes(city) && code !== origin) {
          destination = code;
          break;
        }
      }
    }

    // Si aún no hay destino, usar Bogotá como destino por defecto
    if (!destination) {
      destination = 'BOG';
    }

    // Extraer fecha de salida
    const departureDate = this.extractDepartureDate(message);

    return {
      origin,
      destination,
      departureDate,
      returnDate: null, // Por ahora solo vuelos de ida
      adults: 1
    };
  }

  /**
   * Extrae la ciudad mencionada en el mensaje del usuario
   */
  extractCityFromMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    // Lista completa de ciudades y municipios colombianos importantes
    const cities = [
      // Capitales de departamento y ciudades principales
      'bogotá', 'bogota', 'medellín', 'medellin', 'cali', 'barranquilla', 
      'cartagena', 'bucaramanga', 'santa marta', 'pereira', 'manizales',
      'neiva', 'montería', 'monteria', 'valledupar', 'armenia', 'pasto',
      'popayán', 'popayan', 'villavicencio', 'leticia', 'san andrés', 'san andres',
      'providencia', 'cucuta', 'cúcuta', 'riohacha', 'yopal', 'ibagué', 'ibague',
      'tunja', 'sincelejo', 'florencia', 'quibdó', 'quibdo', 'arauca',
      'inírida', 'inirida', 'mitú', 'mitu', 'puerto carreño', 'puerto carreno',
      
      // Ciudades importantes adicionales
      'soacha', 'bello', 'soledad', 'malambo', 'palmira', 'girón', 'giron',
      'envigado', 'itagüí', 'itagui', 'mosquera', 'chía', 'chia', 'floridablanca',
      'piedecuesta', 'zipaquirá', 'zipaquira', 'fusagasugá', 'fusagasuga',
      'facatativá', 'facatativa', 'madrid', 'funza', 'cajicá', 'cajica',
      'sabaneta', 'copacabana', 'apartadó', 'apartado', 'turbo', 'rionegro',
      'marinilla', 'la estrella', 'caldas', 'barbosa', 'girardota',
      
      // Ciudades de la costa caribe
      'magangué', 'magangue', 'lorica', 'cereté', 'cerete', 'sahagún', 'sahagun',
      'corozal', 'tolú', 'tolu', 'san onofre', 'arjona', 'turbaco',
      'ciénaga', 'cienaga', 'fundación', 'fundacion', 'aracataca',
      'el banco', 'plato', 'pivijay', 'sabanas de san ángel', 'sabanas de san angel',
      
      // Ciudades del valle del cauca
      'buenaventura', 'cartago', 'tuluá', 'tulua', 'buga', 'guadalajara de buga',
      'jamundí', 'jamundi', 'yumbo', 'candelaria', 'pradera', 'florida',
      'palmira', 'dagua', 'la cumbre', 'vijes', 'restrepo',
      
      // Ciudades de santander
      'barrancabermeja', 'socorro', 'san gil', 'málaga', 'malaga', 'vélez', 'velez',
      'barbosa', 'sabana de torres', 'puerto wilches', 'cimitarra',
      'california', 'rionegro', 'lebrija', 'girón', 'giron',
      
      // Ciudades del eje cafetero
      'dosquebradas', 'la virginia', 'chinchiná', 'chinchina', 'neira',
      'villamaría', 'villamaria', 'palestina', 'supía', 'supia',
      'riosucio', 'anserma', 'santa rosa de cabal', 'marsella',
      'belén de umbría', 'belen de umbria', 'mistrató', 'mistrato',
      
      // Ciudades de tolima y huila
      'espinal', 'melgar', 'girardot', 'honda', 'líbano', 'libano',
      'chaparral', 'purificación', 'purificacion', 'mariquita',
      'garzón', 'garzon', 'pitalito', 'la plata', 'san agustín', 'san agustin',
      'isnos', 'palestina', 'campoalegre', 'rivera', 'aipe',
      
      // Ciudades de nariño
      'ipiales', 'túquerres', 'tuquerres', 'tumaco', 'la unión', 'la union',
      'samaniego', 'sandona', 'sandoná', 'barbacoas', 'ricaurte',
      'el charco', 'magüí', 'magui', 'francisco pizarro',
      
      // Otras ciudades importantes
      'duitama', 'sogamoso', 'chiquinquirá', 'chiquinquira', 'villa de leyva',
      'paipa', 'nobsa', 'tibasosa', 'santa rosa de viterbo',
      'puerto boyacá', 'puerto boyaca', 'aguazul', 'tauramena',
      'paz de ariporo', 'trinidad', 'orocué', 'orocue'
    ];

    // Buscar ciudades mencionadas en el mensaje con coincidencia exacta o parcial
    const foundCities = [];
    for (const city of cities) {
      if (lowerMessage.includes(city)) {
        foundCities.push(city);
      }
    }
    
    // Si encuentra múltiples ciudades, preferir la más específica (más larga)
    if (foundCities.length > 0) {
      const longestCity = foundCities.sort((a, b) => b.length - a.length)[0];
      console.log(`🏙️ Ciudad encontrada en mensaje: "${longestCity}"`);
      return longestCity;
    }

    // Patrones específicos para extraer ciudades con expresiones regulares más robustas
    const cityPatterns = [
      // "clima en [ciudad]", "tiempo en [ciudad]", etc.
      /(?:clima|tiempo|temperatura|pronóstico|pronostico)\s+(?:en|de|para)\s+([a-záéíóúñü][a-záéíóúñü\s]+?)(?:\s|$|,|\.|;|\?|!)/i,
      // "en [ciudad] clima", "de [ciudad] tiempo", etc.
      /(?:en|de)\s+([a-záéíóúñü][a-záéíóúñü\s]+?)\s+(?:clima|tiempo|temperatura|llueve|lluvia|calor|frío|frio|sol|nublado)/i,
      // "cómo está el clima en [ciudad]"
      /(?:cómo|como)\s+(?:está|esta|estará|estara)\s+(?:el\s+)?(?:clima|tiempo)\s+(?:en|de)\s+([a-záéíóúñü][a-záéíóúñü\s]+?)(?:\s|$|,|\.|;|\?|!)/i,
      // "[ciudad] clima", "[ciudad] tiempo"
      /^([a-záéíóúñü][a-záéíóúñü\s]+?)\s+(?:clima|tiempo|temperatura)(?:\s|$)/i,
      // Patrones para preguntas de predicción: "mañana en [ciudad]", "puede llover en [ciudad]"
      /(?:mañana|puede\s+llover|va\s+a\s+llover|estará|estara)\s+(?:en|de)\s+([a-záéíóúñü][a-záéíóúñü\s]+?)(?:\s|$|,|\.|;|\?|!)/i
    ];

    for (const pattern of cityPatterns) {
      const match = lowerMessage.match(pattern);
      if (match && match[1]) {
        const extractedCity = match[1].trim().toLowerCase();
        console.log(`🎯 Patrón detectado: "${extractedCity}"`);
        
        // Verificar si la ciudad extraída está en nuestra lista
        const matchingCity = cities.find(city => 
          city === extractedCity || 
          city.includes(extractedCity) || 
          extractedCity.includes(city)
        );
        
        if (matchingCity) {
          console.log(`✅ Ciudad validada: "${matchingCity}"`);
          return matchingCity;
        } else {
          console.log(`❓ Ciudad no reconocida, pero se intentará: "${extractedCity}"`);
          // Intentar con la ciudad extraída aunque no esté en la lista
          return extractedCity;
        }
      }
    }

    console.log(`📍 No se encontró ciudad específica, usando ubicación GPS`);
    return null; // No se encontró ciudad en el mensaje
  }

  /**
   * Encuentra el código IATA de una ciudad considerando coincidencias parciales
   */
  findCityCode(cityName, cityToIATA) {
    const cleanCity = cityName.toLowerCase().trim();
    
    // Coincidencia exacta
    if (cityToIATA[cleanCity]) {
      return cityToIATA[cleanCity];
    }
    
    // Coincidencia parcial
    for (const [city, code] of Object.entries(cityToIATA)) {
      if (city.includes(cleanCity) || cleanCity.includes(city)) {
        return code;
      }
    }
    
    return null;
  }

  /**
   * Extrae la fecha de salida del mensaje
   */
  extractDepartureDate(message) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const lowerMessage = message.toLowerCase();

    // Patrones de fecha específicos
    if (lowerMessage.includes('hoy')) {
      return today.toISOString().split('T')[0];
    }
    
    if (lowerMessage.includes('mañana')) {
      return tomorrow.toISOString().split('T')[0];
    }

    if (lowerMessage.includes('próxima semana') || lowerMessage.includes('proxima semana')) {
      return nextWeek.toISOString().split('T')[0];
    }

    // Buscar fechas en formato DD/MM/YYYY o DD-MM-YYYY
    const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
    const dateMatch = message.match(datePattern);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      const year = dateMatch[3];
      return `${year}-${month}-${day}`;
    }

    // Por defecto, usar una fecha en el futuro (una semana adelante)
    return nextWeek.toISOString().split('T')[0];
  }

  /**
   * Obtiene datos del clima por nombre de ciudad
   */
  async getWeatherDataByCity(cityName) {
    const normalizedCity = cityName.toLowerCase().trim();
    const cacheKey = `weather_city_${normalizedCity}`;
    
    if (this.isValidCache(cacheKey)) {
      console.log(`🌤️ Datos de clima para ${cityName} obtenidos del caché`);
      return this.cache.get(cacheKey).data;
    }

    try {
      console.log(`🌤️ Obteniendo datos del clima para: ${cityName}`);
      const weatherData = await getWeatherData(cityName);
      
      // Agregar el nombre de la ciudad a la respuesta
      const weatherWithCity = {
        ...weatherData,
        city: cityName
      };
      
      this.setCache(cacheKey, weatherWithCity);
      console.log(`🌤️ Datos del clima obtenidos exitosamente para ${cityName}:`, weatherWithCity);
      return weatherWithCity;
    } catch (error) {
      console.error(`❌ Error obteniendo datos del clima para ${cityName}:`, error);
      return { 
        error: `No se pudo obtener información del clima para ${cityName}`,
        city: cityName,
        message: error.message 
      };
    }
  }

  /**
   * Verifica si el caché es válido
   */
  isValidCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < this.cacheTTL;
  }

  /**
   * Establece datos en caché
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Limpia el caché expirado
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if ((now - value.timestamp) >= this.cacheTTL) {
        this.cache.delete(key);
      }
    }
  }
}

const dataCoordinator = new DataCoordinator();

// Limpiar caché expirado cada 5 minutos
setInterval(() => {
  dataCoordinator.clearExpiredCache();
}, 5 * 60 * 1000);

export default dataCoordinator;

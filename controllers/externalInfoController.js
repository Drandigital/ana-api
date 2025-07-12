// controllers/externalInfoController.js
import { getWeatherData, getPlacesFromGoogleMaps } from '../services/externalApiService.js';
import { searchFlights } from '../services/amadeusFlightService.js';
import { parseUserDate } from '../utils/dateParser.js';
import { authorizedCities } from '../config/airportCodes.js';
import { conversationHistory } from './chatController.js';

/**
 * Gathers information from external APIs based on user message
 * @param {string} originalMessage - Original user message
 * @param {string} lowerMessage - Lowercase user message for keyword detection
 * @param {string} sessionId - Session ID for storing map places
 * @param {Object} userLocation - User's location coordinates
 * @param {Array} premiumBusinesses - Premium businesses already found
 * @param {Object} queryAnalysis - Analysis of the user's query
 * @returns {Promise<string>} - Formatted external information
 */
export async function gatherExternalInfo(
  originalMessage, 
  lowerMessage, 
  sessionId, 
  userLocation,
  premiumBusinesses,
  queryAnalysis
) {
  let externalInfo = '';

  // Weather information - expand keywords to catch more weather queries
  if (queryAnalysis.intents.includes('weather')) {
    const weatherInfo = await getWeatherInformation(originalMessage, lowerMessage, queryAnalysis.city);
    if (weatherInfo) {
      externalInfo += weatherInfo + '\n\n';
    }
  }

  // Flight information
  if (queryAnalysis.intents.includes('flight')) {
    const flightInfo = await getFlightInformation(lowerMessage);
    if (flightInfo) {
      externalInfo += flightInfo + '\n\n';
    }
  }

  // Places information (only if not already provided by premium businesses)
  if (queryAnalysis.businessCategory && 
      (!premiumBusinesses || premiumBusinesses.length < 3 || 
       queryAnalysis.intents.includes('location'))) {
    const placesInfo = await getPlacesInformation(
      lowerMessage, 
      'es', // Usar idioma por defecto - OpenAI manejará la respuesta en el idioma correcto
      sessionId, 
      userLocation, 
      queryAnalysis.city,
      queryAnalysis.businessCategory
    );
    if (placesInfo) {
      externalInfo += placesInfo + '\n\n';
    }
  }

  return externalInfo.trim();
}

/**
 * Gets weather information for the detected city
 * @param {string} originalMessage - Original user message
 * @param {string} lowerMessage - Lowercase user message
 * @param {string} detectedCity - City detected from query analysis
 * @returns {Promise<string>} - Formatted weather information
 */
async function getWeatherInformation(originalMessage, lowerMessage, detectedCity) {
  // List of Colombian cities to detect
  const cities = [
    'cartagena', 'bogota', 'bogotá', 'medellin', 'medellín', 'cali', 
    'barranquilla', 'santa marta', 'bucaramanga', 'pereira', 'manizales', 
    'cúcuta', 'cucuta', 'ibague', 'ibagué', 'villavicencio', 'armenia', 
    'popayán', 'popayan', 'barrancabermeja', 'soacha', 'montería', 'monteria',
    'sincelejo', 'pasto', 'neiva', 'riohacha', 'tunja', 'valledupar',
    'quibdó', 'quibdo', 'yopal', 'san andrés', 'san andres', 'leticia'
  ];
  
  // Use detected city from analysis if available
  let cityDetected = detectedCity;

  // If no city detected from analysis, try to find it in the message
  if (!cityDetected) {
    for (const city of cities) {
      if (lowerMessage.includes(city)) {
        // Get the proper case from the original message if possible
        const regex = new RegExp(city, 'i');
        const match = originalMessage.match(regex);
        if (match) {
          cityDetected = match[0]; // Use the case as it appears in the original message
        } else {
          cityDetected = city.charAt(0).toUpperCase() + city.slice(1);
        }
        break;
      }
    }
  }
  
  // If still no city was detected, use Cartagena as default only in specific cases
  if (!cityDetected) {
    // If the user specifically asked about temperature without mentioning a city,
    // default to Cartagena
    if (lowerMessage.includes('temperatura') || lowerMessage.includes('temperature') ||
        lowerMessage.includes('clima') || lowerMessage.includes('weather')) {
      cityDetected = 'Cartagena';
      console.log("No city detected, defaulting to Cartagena");
    } else {
      // For other weather-related queries, let OpenAI handle the response naturally
      return "No specific city was mentioned in your query. Please specify a Colombian city to get weather information. / No se mencionó ninguna ciudad específica en tu consulta. Por favor, especifica una ciudad colombiana para obtener información del clima.";
    }
  }

  try {
    console.log(`Getting weather data for: ${cityDetected}`);
    const weather = await getWeatherData(cityDetected);
    
    if (!weather) {
      console.log(`No weather data returned for ${cityDetected}`);
      return `I couldn't retrieve current weather information for ${cityDetected}. / No pude obtener la información del clima actual para ${cityDetected}.`;
    }
    
    console.log("Weather data received:", weather);
    
    // Format the weather information in a universal way - OpenAI will translate
    return `Current weather in ${cityDetected}: Temperature is ${weather.temperature}°C with ${weather.description}. Wind speed: ${weather.wind} m/s. Humidity: ${weather.humidity}%. / El clima actual en ${cityDetected}: Temperatura de ${weather.temperature}°C con ${weather.description}. Velocidad del viento: ${weather.wind} m/s. Humedad: ${weather.humidity}%.`;
  } catch (error) {
    console.error('Error getting weather data:', error);
    return `I encountered an error while trying to get the current weather information for ${cityDetected}. / Encontré un error al intentar obtener la información del clima actual para ${cityDetected}.`;
  }
}

/**
 * Gets flight information based on the user message  
 * @param {string} lowerMessage - Lowercase user message
 * @returns {Promise<string>} - Formatted flight information
 */
async function getFlightInformation(lowerMessage) {
  // Detect cities mentioned in the message
  let citiesFound = [];
  for (const city in authorizedCities) {
    if (lowerMessage.includes(city)) {
      citiesFound.push({ city, code: authorizedCities[city] });
    }
  }

  // Need at least two cities (origin and destination)
  if (citiesFound.length < 2) {
    return 'Please specify both origin and destination cities for flight information. / Por favor indique tanto la ciudad de origen como la de destino para información de vuelos.';
  }

  // Assume first two cities are origin and destination
  const originCity = citiesFound[0].city;
  const originCode = citiesFound[0].code;
  const destinationCity = citiesFound[1].city;
  const destinationCode = citiesFound[1].code;

  // Parse departure date from message
  const departureDate = parseUserDate(lowerMessage);
  if (!departureDate) {
    return `I couldn't detect a valid departure date. Please provide a date in format like "2025-01-10" or "January 10, 2025". / No detecté una fecha de salida válida. Por favor proporciona una fecha como "10/01/2025" o "10 de enero de 2025".`;
  }

  // Airline name mapping
  const airlineNames = {
    'LA': 'LATAM Airlines',
    'AV': 'Avianca',
    'AC': 'Air Canada',
    'AA': 'American Airlines',
    'DL': 'Delta Air Lines',
    'CO': 'Copa Airlines',
    'IB': 'Iberia',
    'NK': 'Spirit Airlines',
    'UA': 'United Airlines',
    'AM': 'Aeroméxico'
  };

  try {
    const flightData = await searchFlights(originCode, destinationCode, departureDate);
    
    if (flightData && flightData.length > 0) {
      // Format flight details
      let flightDetails = '';
      
      // Only show up to 5 flights to keep response concise
      const flightsToShow = flightData.slice(0, 5);
      
      flightsToShow.forEach((offer, index) => {
        const itinerary = offer.itineraries[0];
        const price = offer.price.total;
        const currency = offer.price.currency;
        const segments = itinerary.segments;

        const airlineCode = segments[0]?.carrierCode;
        const airlineFullName = airlineNames[airlineCode] || airlineCode;
        const departureTime = formatFlightDateTime(segments[0]?.departure.at);
        const arrivalTime = formatFlightDateTime(segments[segments.length - 1]?.arrival.at);
        const duration = formatFlightDuration(itinerary.duration);

        flightDetails += `\n${index + 1}. ${airlineFullName}: ${price} ${currency}, Departure/Salida: ${departureTime}, Arrival/Llegada: ${arrivalTime}, Duration/Duración: ${duration}`;
      });

      return `Flights from ${originCity} to ${destinationCity} / Vuelos desde ${originCity} hacia ${destinationCity} on ${formatDisplayDate(departureDate)}:${flightDetails}`;
    } else {
      return `No flights found from ${originCity} to ${destinationCity} / No se encontraron vuelos desde ${originCity} hacia ${destinationCity} on ${formatDisplayDate(departureDate)}.`;
    }
  } catch (error) {
    console.error('Error searching flights:', error);
    return 'Sorry, I encountered an issue while searching for flights. Please try again later. / Lo siento, encontré un problema al buscar vuelos. Por favor intenta de nuevo más tarde.';
  }
}

/**
 * Gets places information from Google Places API with enhanced geolocation support
 * @param {string} lowerMessage - Lowercase user message for keyword detection
 * @param {string} language - Language code (kept for API compatibility)
 * @param {string} sessionId - Session ID for storing map places
 * @param {Object} userLocation - User's location coordinates
 * @param {string} city - Detected city
 * @param {string} placeType - Type of place to search for
 * @returns {Promise<string>} - Formatted places information
 */
async function getPlacesInformation(
  lowerMessage, 
  language = 'en', 
  sessionId, 
  userLocation,
  city,
  placeType = 'tourist_attraction'
) {
  // Validate user location data
  const hasValidLocation = userLocation && 
                         typeof userLocation.lat !== 'undefined' && 
                         typeof userLocation.lng !== 'undefined' &&
                         !isNaN(userLocation.lat) && 
                         !isNaN(userLocation.lng);
  
  // Log geolocation status
  if (hasValidLocation) {
    console.log(`Using valid user location: ${userLocation.lat}, ${userLocation.lng} for places search`);
  } else {
    console.log(`No valid user location available for places search`);
  }

  // If no city was provided, try to detect it from the message
  let cityForPlaces = city;
  if (!cityForPlaces) {
    const cities = [
      'cartagena', 'bogota', 'bogotá', 'medellin', 'medellín', 'cali', 
      'barranquilla', 'santa marta', 'bucaramanga', 'pereira', 'manizales', 
      'cúcuta', 'cucuta', 'ibague', 'ibagué', 'villavicencio', 'armenia', 
      'popayán', 'popayan'
    ];
    
    for (const cityName of cities) {
      if (lowerMessage.includes(cityName)) {
        cityForPlaces = cityName.charAt(0).toUpperCase() + cityName.slice(1);
        break;
      }
    }
    
    // Default to Cartagena if no city detected
    if (!cityForPlaces) {
      cityForPlaces = 'Cartagena';
    }
  }

  try {
    console.log(`Searching for ${placeType} in ${cityForPlaces}${hasValidLocation ? ' with user location' : ''}`);
    
    // Get places from Google Maps API - pass user location if available
    const places = await getPlacesFromGoogleMaps(cityForPlaces, placeType, 'es', userLocation);

    let topPlacesText = '';
    let mapPlaces = [];

    if (places && places.length > 0) {
      console.log(`Found ${places.length} places matching search criteria`);
      
      // Format top 4 places with distance information if available
      topPlacesText = places.slice(0, 4)
        .map((place, idx) => {
          const name = place.name || 'No name';
          const address = place.formatted_address || 'Address not available';
          const rating = place.rating ? `${place.rating}/5` : 'No rating';
          
          // Include distance if available
          const distanceText = place.distance_text ? `, ${place.distance_text} away` : '';
          
          return `${idx + 1}. ${name} - ${rating}${distanceText} (${address})`;
        })
        .join('\n');

      // Prepare map places for frontend with enhanced location data
      mapPlaces = places.slice(0, 4).map(place => ({
        name: place.name || 'No name',
        address: place.formatted_address || 'Address not available',
        rating: place.rating || 0,
        location: {
          lat: place.geometry?.location?.lat,
          lng: place.geometry?.location?.lng
        },
        place_id: place.place_id,
        photos: place.photos || [],
        // Include distance information
        distance: place.distance,
        distance_text: place.distance_text,
        // Include priority flag
        isPremium: place.priority === 1
      }));

      // Store map places in conversation history for frontend
      if (conversationHistory[sessionId]) {
        conversationHistory[sessionId].mapPlaces = mapPlaces;
      }

      // Prepare the intro text based on search type (location-based or city-based)
      const introText = hasValidLocation ?
        `Nearby ${placeType}s in ${cityForPlaces} (sorted by proximity to user's location):` : 
        `Popular ${placeType}s in ${cityForPlaces}:`;

      return `${introText}\n${topPlacesText}`;
    } else {
      return `No ${placeType}s found ${hasValidLocation ? 'near your location' : ''} in ${cityForPlaces}.`;
    }
  } catch (error) {
    console.error('Error fetching places:', error);
    return `I couldn't retrieve ${placeType} information ${hasValidLocation ? 'near your location' : ''} for ${cityForPlaces} at this time.`;
  }
}

/**
 * Helper function to format flight datetime
 * @param {string} dateTime - ISO format datetime
 * @returns {string} - Formatted datetime
 */
function formatFlightDateTime(dateTime) {
  if (!dateTime) return 'N/A';
  
  const date = new Date(dateTime);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

/**
 * Helper function to format flight duration
 * @param {string} duration - ISO duration format (PT2H30M)
 * @returns {string} - Human readable duration
 */
function formatFlightDuration(duration) {
  if (!duration) return 'N/A';
  
  // Simple parsing of ISO8601 duration format
  const hourMatch = duration.match(/(\d+)H/);
  const minuteMatch = duration.match(/(\d+)M/);
  
  const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
  const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  }
  
  return 'N/A';
}

/**
 * Helper function to format display date
 * @param {string} dateString - ISO format date
 * @param {string} language - Language code (kept for compatibility)
 * @returns {string} - Formatted date string
 */
function formatDisplayDate(dateString, language = 'en') {
  const date = new Date(dateString);
  
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
// controllers/chatController.js
import validateTourismQuery from '../utils/validateTourismQuery.js';
import { getChatCompletion } from '../services/openaiService.js';
import { getWeatherData, getPlacesFromGoogleMaps, createReservation } from '../services/externalApiService.js';
import { searchFlights } from '../services/amadeusFlightService.js'; 
import { parseUserDate } from '../utils/dateParser.js';
import { authorizedCities } from '../config/airportCodes.js';
import { detectLanguage } from '../utils/detectLanguage.js';

// Historial en memoria (puedes exportarlo si lo necesitas en otro lugar)
const conversationHistory = {};

export async function handleChatRequest(req, res) {
  try {
    const userMessage = req.body.message || '';
    const lowerMessage = userMessage.toLowerCase();
    const language = detectLanguage(userMessage); // 'en' | 'es' | 'unknown'
    const sessionId = req.body.sessionId || 'default-session';
    if (!conversationHistory[sessionId]) {
      conversationHistory[sessionId] = [];
    }

    // Validar si la consulta está relacionada con turismo
    const isTourism = validateTourismQuery(userMessage);
    if (!isTourism) {
      conversationHistory[sessionId].push({ role: 'user', content: userMessage });

      let refusal;
      if (language === 'en') {
        refusal = "I'm sorry, I can only answer questions about tourism in Colombia.";
      } else {
        refusal = "Lo siento, solo respondo preguntas sobre turismo en Colombia.";
      }

      conversationHistory[sessionId].push({ role: 'assistant', content: refusal });
      return res.status(200).json({ response: refusal });
    }

    conversationHistory[sessionId].push({ role: 'user', content: userMessage });

    

    // ----------------------------------------------------------------------------
    // Lógica de "Información Externa": clima, vuelos, hoteles, reservas, etc.
    // ----------------------------------------------------------------------------
    let externalInfo = '';

    // Clima
if (lowerMessage.includes('clima') || lowerMessage.includes('tiempo') || lowerMessage.includes('weather')) {
  // Lista de ciudades colombianas que queremos reconocer
  const ciudades = ['cartagena', 'bogota', 'bogotá', 'medellin', 'medellín', 'cali', 'barranquilla', 'santa marta', 'bucaramanga', 'pereira', 'manizales', 'cúcuta', 'ibague', 'villavicencio', 'armenia', 'popayán', 'barrancabermeja', 'soacha'];
  
  // Por defecto, usar Cartagena si no se detecta otra ciudad
  let ciudadSeleccionada = 'Cartagena'; 

  // Buscar en el mensaje alguna de las ciudades de la lista
  for (const ciudad of ciudades) {
    if (lowerMessage.includes(ciudad)) {
      // Asignar la ciudad encontrada, capitalizar la primera letra si es necesario
      ciudadSeleccionada = ciudad.charAt(0).toUpperCase() + ciudad.slice(1);
      break;
    }
  }

  // Obtener datos del clima para la ciudad detectada
  const weather = await getWeatherData(ciudadSeleccionada);
  if (weather) {
    externalInfo += (language === 'en')
      ? `Current weather in ${ciudadSeleccionada} is ${weather.temperature}°C with ${weather.description}. `
      : `El clima actual en ${ciudadSeleccionada} es de ${weather.temperature}°C con ${weather.description}. `;
  }
}

// Lógica de vuelos

if (
  lowerMessage.includes('vuelo') || lowerMessage.includes('flight') ||
  lowerMessage.includes('pasaje') || lowerMessage.includes('ticket')
) {
  // a) Detectar ciudades mencionadas en el mensaje
  let citiesFound = [];
  for (const city in authorizedCities) {
    if (lowerMessage.includes(city)) {
      citiesFound.push({ city, code: authorizedCities[city] });
    }
  }

  // Validar que se detectaron al menos dos ciudades (origen y destino)
  if (citiesFound.length < 2) {
    externalInfo += (language === 'en')
      ? 'Please specify both origin and destination cities.'
      : 'Por favor indique tanto la ciudad de origen como la de destino.';
  } else {
    // Asumir que las dos primeras ciudades son origen y destino
    const originCity = citiesFound[0].city;
    const originCode = citiesFound[0].code;
    const destinationCity = citiesFound[1].city;
    const destinationCode = citiesFound[1].code;

    // b) Parsear la fecha de salida
    const departureDate = parseUserDate(userMessage);

    if (!departureDate) {
      externalInfo += (language === 'en')
        ? 'I did not detect a valid departure date. Please provide a date like "2025-01-10".'
        : 'No detecté una fecha de salida válida. Por favor proporciona una fecha como "10/01/2025".';
    } else {
      // Mapeo de códigos de aerolíneas a nombres completos
      const airlineNames = {
        'LA': 'LATAM Airlines',
        'AV': 'Avianca',
        'AC': 'Air Canada',
        'AA': 'American Airlines',
        'DL': 'Delta Air Lines',
        // Agrega más mapeos según sea necesario
      };

      try {
        // Llamar a la función genérica de búsqueda de vuelos
        const flightData = await searchFlights(originCode, destinationCode, departureDate);
        if (flightData && flightData.length > 0) {
          let flightDetails = '';
          flightData.forEach((offer, index) => {
            const itinerary = offer.itineraries[0];
            const price = offer.price.total;
            const currency = offer.price.currency;
            const segments = itinerary.segments;

            const airlineCode = segments[0]?.carrierCode;
            const airlineFullName = airlineNames[airlineCode] || airlineCode;
            const departureTime = segments[0]?.departure.at;
            const arrivalTime = segments[segments.length - 1]?.arrival.at;

            flightDetails += `\n${index + 1}. Airline: ${airlineFullName}, Price: ${price} ${currency}, Departure: ${departureTime}, Arrival: ${arrivalTime}`;
          });
          externalInfo += (language === 'en')
            ? `\nFlights found from ${originCity} to ${destinationCity}:\n${flightDetails}\n`
            : `\nVuelos encontrados desde ${originCity} hacia ${destinationCity}:\n${flightDetails}\n`;
        } else {
          externalInfo += (language === 'en')
            ? '\nNo flights found with the provided data.\n'
            : '\nNo se encontraron vuelos con los datos proporcionados.\n';
        }
      } catch (error) {
        console.error('Error fetching flights:', error);
        externalInfo += (language === 'en')
          ? '\nAn error occurred while searching for flights.\n'
          : '\nOcurrió un error al buscar vuelos.\n';
      }
    }
  }
}

// Hoteles, restaurantes, bares...
if (
  lowerMessage.includes('hotel') ||
  lowerMessage.includes('hotels') ||
  lowerMessage.includes('restaurante') ||
  lowerMessage.includes('restaurant') ||
  lowerMessage.includes('discoteca') ||
  lowerMessage.includes('nightclub') ||
  lowerMessage.includes('bar') ||
  lowerMessage.includes('bares') ||
  lowerMessage.includes('club')
) {
  let placeType = 'hotel';
  if (lowerMessage.includes('restaurante') || lowerMessage.includes('restaurant')) placeType = 'restaurant';
  if (lowerMessage.includes('discoteca') || lowerMessage.includes('nightclub')) placeType = 'night_club';
  if (lowerMessage.includes('bar') || lowerMessage.includes('bares')) placeType = 'bar';

  // Detectar ciudad para la búsqueda de lugares
  const cities = Object.keys(authorizedCities);
  let cityForPlaces = 'Cartagena'; // Valor por defecto
  for (const city of cities) {
    if (lowerMessage.includes(city)) {
      cityForPlaces = city.charAt(0).toUpperCase() + city.slice(1);
      break;
    }
  }

  // Definir ejemplos de negocios premium para varias ciudades y tipos
  const premiumPartners = {
    hotel: {
      Cartagena: [
        { name: "Hotel Premium One", address: "123 Premium St, Cartagena", rating: 4.8 },
        { name: "Hotel Premium Two", address: "456 Luxury Ave, Cartagena", rating: 4.7 }
      ],
      Bogota: [
        { name: "Hotel Bogota Luxury", address: "Avenida 123, Bogota", rating: 4.9 },
        { name: "Hotel Capital Elite", address: "Calle 456, Bogota", rating: 4.8 }
      ],
      Medellin: [
        { name: "Medellin Premium Inn", address: "Carrera 789, Medellin", rating: 4.6 },
        { name: "Medellin Luxury Suites", address: "Calle 321, Medellin", rating: 4.7 }
      ]
      // Agrega más ciudades y hoteles según sea necesario
    },
    restaurant: {
      Cartagena: [
        { name: "Restaurant Premium A", address: "789 Gourmet Rd, Cartagena", rating: 4.9 },
        { name: "Restaurant Premium B", address: "321 Fine Dine Ln, Cartagena", rating: 4.6 }
      ],
      Bogota: [
        { name: "Bogota Fine Dine", address: "123 Gastronomy St, Bogota", rating: 4.8 },
        { name: "Capital Eats Premium", address: "456 Chef Ave, Bogota", rating: 4.7 }
      ],
      Medellin: [
        { name: "Medellin Gourmet Hub", address: "789 Food Plaza, Medellin", rating: 4.5 },
        { name: "Savory Medellin", address: "321 Culinary Rd, Medellin", rating: 4.6 }
      ]
      // Agrega más ciudades y restaurantes según sea necesario
    }
    // Agrega otros tipos como 'bar', 'night_club', etc., si es necesario
  };

  // Obtener lista de negocios premium para la ciudad y tipo detectados
  let partnerList = [];
  if (premiumPartners[placeType] && premiumPartners[placeType][cityForPlaces]) {
    partnerList = premiumPartners[placeType][cityForPlaces];
  }

  // Mostrar negocios premium primero
  if (partnerList.length > 0) {
    const partnerText = partnerList.map((place, idx) => {
      return `${idx + 1}. ${place.name} (${place.address}), rating: ${place.rating}`;
    }).join('\n');

    externalInfo += language === 'en'
      ? `\n Premium options in ${cityForPlaces}:\n${partnerText}\n`
      : `\n Opciones premium en ${cityForPlaces}:\n${partnerText}\n`;
  }

  // Obtener lugares regulares en la ciudad detectada
  const places = await getPlacesFromGoogleMaps(cityForPlaces, placeType);

  let topPlacesText = '';
  let mapPlaces = [];

  if (places && places.length > 0) {
    topPlacesText = places.slice(0, 4)
      .map((place, idx) => {
        const name = place.name || (language === 'en' ? 'No name' : 'Sin nombre');
        const address = place.formatted_address || (language === 'en' ? 'Address not available' : 'Dirección no disponible');
        const rating = place.rating || (language === 'en' ? 'No rating' : 'Sin calificación');
        return `${idx + 1}. ${name} (${address}), rating: ${rating}`;
      })
      .join('\n');

    mapPlaces = places.slice(0, 4).map(place => ({
      name: place.name || (language === 'en' ? 'No name' : 'Sin nombre'),
      address: place.formatted_address || (language === 'en' ? 'Address not available' : 'Dirección no disponible'),
      rating: place.rating || (language === 'en' ? 'No rating' : 'Sin calificación'),
      location: place.geometry && place.geometry.location
    }));

    externalInfo += language === 'en'
      ? `\nSome other options in ${cityForPlaces}:\n${topPlacesText}\n`
      : `\nAlgunas otras opciones en ${cityForPlaces}:\n${topPlacesText}\n`;
  } else {
    externalInfo += language === 'en'
      ? '\nNo relevant places found.\n'
      : '\nNo encontré lugares relevantes.\n';
  }

  conversationHistory[sessionId].mapPlaces = mapPlaces;
}


    

    // Reserva
    if (lowerMessage.includes('reservar') || lowerMessage.includes('reserve')) {
      const reservationResult = createReservation('fakePlaceId123', 'Usuario Demo', '2025-01-10', '2025-01-15');
      externalInfo += `\n${reservationResult.message}\n`;
    }

    // ----------------------------------------------------------------------------
    // Construimos los mensajes para OpenAI
    // ----------------------------------------------------------------------------
    const systemBaseEn = `
      You are Ana, a chatbot specializing in tourism in Colombia. 
      Always introduce yourself as "Ana".

      Your goal is to assist users with relevant information about tourist destinations,
      culture, gastronomy, history, lodging, activities, and any other topic related
      specifically to tourism in Colombia.
      If the query is about topics not related to tourism in Colombia, politely refuse and Always conclude the response with a maximum of 200 words, only when necessary.
      `;

      const systemBaseEs = `
      Tú eres Ana, un chatbot experto en turismo en Colombia.
      Siempre te presentarás como “Ana”.

      Tu objetivo es asistir a los usuarios con información relevante sobre destinos turísticos, 
      cultura, gastronomía, historia, hospedajes, actividades y cualquier otro tema relacionado 
      específicamente con el turismo en Colombia.
      Si la consulta es de temas ajenos al turismo en Colombia, recházala educadamente y Siempre concluir la respuesta con un máximo 200 palabras, solo cuando sea necesario.
      `;


    const systemBase = (language === 'en') ? systemBaseEn : systemBaseEs;
    const externalInfoText = (language === 'en')
      ? `Additional info you can use:\n${externalInfo}`
      : `Información adicional que puedes usar:\n${externalInfo}`;

    const systemMessage = {
      role: 'system',
      content: `${systemBase}\n\n${externalInfoText}`
    };

    const fullHistory = conversationHistory[sessionId];
    // (Si quieres limitar: const fullHistory = conversationHistory[sessionId].slice(-6);)

    const messagesForOpenAI = [
      systemMessage,
      ...fullHistory
    ];

    const aiResponse = await getChatCompletion(messagesForOpenAI);
    conversationHistory[sessionId].push({ role: 'assistant', content: aiResponse });

    return res.status(200).json({ response: aiResponse });
  } catch (error) {
    console.error("Error en la solicitud de chat:", error);
    return res.status(500).json({
      error: "Ocurrió un error al procesar la solicitud."
    });
  }
}






// controllers/chatController.js

const validateTourismQuery = require('../utils/validateTourismQuery');
const { getChatCompletion } = require('../services/openaiService');
const { getWeatherData, getHotelsData } = require('../services/externalApiService');

// Para vuelos
const { searchFlightsToCartagena } = require('../services/amadeusFlightService');
const { parseUserDate } = require('../utils/dateParser');
const authorizedCities = require('../config/airportCodes');

async function handleChatRequest(req, res) {
  try {
    // 1. Obtenemos el mensaje
    const userMessage = req.body.message || '';
    // 2. Convertimos a minúsculas para facilitar búsquedas
    const lowerMessage = userMessage.toLowerCase();

    console.log("Mensaje recibido:", userMessage);
    console.log("Mensaje en minúsculas:", lowerMessage);

    // Validar si la consulta está relacionada con Cartagena
    const isTourism = validateTourismQuery(userMessage);
    if (!isTourism) {
      return res.status(200).json({
        response: "Lo siento, solo respondo preguntas sobre turismo en Cartagena, Colombia."
      });
    }

    // ---------------------------------------
    // (A) Recolectamos info externa si hace falta
    // ---------------------------------------
    let externalInfo = '';

    // (A.1) Clima
    if (lowerMessage.includes('clima') || lowerMessage.includes('tiempo')) {
      const weather = await getWeatherData('Cartagena');
      if (weather) {
        externalInfo = `El clima actual en Cartagena es de ${weather.temperature}°C con ${weather.description}.`;
      }
    }

    // (A.2) Vuelos
    if (
      lowerMessage.includes('vuelo') ||
      lowerMessage.includes('pasaje') ||
      lowerMessage.includes('boleto')
    ) {
      // 1. Detectar ciudad autorizada
      let originCode = null;
      for (const city in authorizedCities) {
        if (lowerMessage.includes(city)) {
          originCode = authorizedCities[city];
          break;
        }
      }

      // 2. Parsear fecha
      const departureDate = parseUserDate(userMessage);

      // 3. Validar y llamar a la API de Amadeus
      if (!originCode) {
        externalInfo += `\nNo detecté una ciudad de origen válida. Por favor indica una de estas: ${Object.keys(authorizedCities).join(', ')}.\n`;
      } else if (!departureDate) {
        externalInfo += `\nNo detecté una fecha válida. Por favor escribe algo como "10/01/2025" o "10-01-2025".\n`;
      } else {
        const flightData = await searchFlightsToCartagena(originCode, departureDate);
        if (flightData && flightData.length > 0) {
          let flightDetails = '';
          flightData.forEach((offer, index) => {
            const itinerary = offer.itineraries[0];
            const price = offer.price.total;
            const currency = offer.price.currency;
            const segments = itinerary.segments;
            const airline = segments[0]?.carrierCode;
            const departureTime = segments[0]?.departure.at;
            const arrivalTime = segments[segments.length - 1]?.arrival.at;

            flightDetails += `\n${index + 1}. Aerolínea: ${airline}, Precio: ${price} ${currency}, Salida: ${departureTime}, Llegada: ${arrivalTime}`;
          });
          externalInfo += `\nVuelos encontrados desde tu ciudad hacia Cartagena:\n${flightDetails}\n`;
        } else {
          externalInfo += '\nNo encontré vuelos disponibles con los datos proporcionados.\n';
        }
      }
    }

    // (Opcional) Hoteles
    /*
    if (lowerMessage.includes('hotel')) {
      const hotels = await getHotelsData('Cartagena');
      if (hotels && hotels.length > 0) {
        // Tomar solo los primeros 2 hoteles como ejemplo
        const topHotels = hotels.slice(0, 2)
          .map(h => `- ${h.name}, valoración: ${h.rating}, precio promedio: ${h.price}`)
          .join('\n');
        externalInfo += `\nAlgunos hoteles en Cartagena:\n${topHotels}`;
      }
    }
    */

    // ---------------------------------------
    // (B) Construimos el prompt para GPT
    // ---------------------------------------
    const messages = [
      {
        role: 'system',
        content: `
Eres un chatbot experto en turismo en Cartagena, Colombia. 
Tu objetivo es asistir a los usuarios con información relevante sobre destinos turísticos, cultura, gastronomía, 
historia, hospedajes, actividades y cualquier otro tema relacionado específicamente con el turismo en Cartagena.

Alcance:
- Responde únicamente preguntas relacionadas con la ciudad de Cartagena y sus alrededores.
- Si el usuario hace preguntas fuera de este ámbito, responde de manera educada explicando que tu función está limitada a la temática turística de Cartagena.

Estilo de respuesta:
- Usa un tono amistoso, claro y conciso.
- Ofrece recomendaciones basadas en las preferencias que indique el usuario, cuando corresponda.
- Aporta detalles culturales y prácticos (como horarios, precios estimados, mejores épocas para viajar, etc.) siempre que sea posible, 
  asegurándote de que la información sea coherente y precisa.

Información externa que puedes usar:
${externalInfo}
        `
      },
      {
        role: 'user',
        content: userMessage
      }
    ];

    // (C) Obtenemos la respuesta de GPT
    const aiResponse = await getChatCompletion(messages);

    return res.status(200).json({ response: aiResponse });
  } catch (error) {
    console.error("Error en la solicitud de chat:", error);
    return res.status(500).json({
      error: "Ocurrió un error al procesar la solicitud."
    });
  }
}





module.exports = { handleChatRequest };

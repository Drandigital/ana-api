// services/amadeusFlightService.js (ES Modules)

import dotenv from 'dotenv';
dotenv.config();

import Amadeus from 'amadeus';

// Inicializa el cliente de Amadeus en modo test
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY,
  clientSecret: process.env.AMADEUS_API_SECRET,
  hostname: 'test' // para producción usar hostname: 'production'
});

/**
 * Busca vuelos desde una ciudad de origen hacia una ciudad de destino.
 *
 * @param {string} origin - Código IATA del aeropuerto de origen (por ejemplo, 'BOG').
 * @param {string} destination - Código IATA del aeropuerto de destino (por ejemplo, 'CTG').
 * @param {string} departureDate - Fecha de salida en formato YYYY-MM-DD.
 * @returns {Promise<Array>} - Retorna el array de vuelos (flight offers) de la API de Amadeus.
 */
export async function searchFlights(origin, destination, departureDate) {
  try {
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      adults: 1,
      currencyCode: 'USD',
      max: 10
      // sort: 'price'
    });
    return response.data;
  } catch (error) {
    console.error('Error al buscar vuelos en Amadeus:', error);
    throw error;
  }
}

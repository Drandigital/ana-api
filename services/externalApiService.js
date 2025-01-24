// services/externalApiService.js (ES Modules)

import axios from 'axios';

/**
 * Obtiene lugares (hoteles, restaurantes, discotecas, etc.) de la Google Maps Places API
 * según la ciudad y el tipo de negocio que se desee buscar.
 * @param {string} city - Ciudad a buscar (ej. 'Cartagena')
 * @param {string} placeType - Tipo de lugar (hotel, restaurant, night_club, bar, etc.)
 * @returns {Promise<Array|null>} Lista de lugares
 */
export async function getPlacesFromGoogleMaps(city, placeType, language = 'en') {
  try {
    const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!API_KEY) {
      console.error("API_KEY no está definida");
      return null;
    }
    
    const query = `${placeType} in ${city}`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=${language}&key=${API_KEY}`;
    const response = await axios.get(url);
    return response.data.results; 

  } catch (error) {
    console.error("Error al obtener lugares de Google Maps:", error);
    
    return null;
  }
}



/**
 * Ejemplo de función para crear una reserva (placeholder).
 * En un caso real, podrías integrar aquí tu lógica de base de datos, etc.
 * @param {string} placeId - ID del lugar (hotel, etc.) según Google Places
 * @param {string} userName - Nombre del usuario que reserva
 * @param {string} checkIn - Fecha de entrada
 * @param {string} checkOut - Fecha de salida
 * @returns {object} Objeto con resultado de la reserva
 */
export function createReservation(placeId, userName, checkIn, checkOut) {
  return {
    success: true,
    message: `Reserva creada para ${userName} en el lugar con ID ${placeId}, del ${checkIn} al ${checkOut}.`
  };
}

/**
 * (OPCIONAL) Sigue disponible la función de clima si la usas en otras partes.
 */
export async function getWeatherData(city) {
  try {
    const API_KEY = process.env.WEATHER_API_KEY; 
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
    const response = await axios.get(url);
    return {
      temperature: Math.round(response.data.main.temp),
      description: response.data.weather[0].description
    };
  } catch (error) {
    console.error("Error al obtener clima:", error);
    return null;
  }
}

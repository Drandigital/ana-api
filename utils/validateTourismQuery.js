// utils/validateTourismQuery.js (ES Modules)

export default function validateTourismQuery(userMessage) {
  const msgLower = userMessage.toLowerCase();

  // Lista de palabras clave relacionadas con turismo (en español e inglés)
  const keywords = [
    // Español (palabras clave de turismo, ciudades, saludos, etc.)
    'colombia', 'turismo', 'viaje', 'viajes', 'tour', 'tours', 
    'vacaciones', 'destino', 'destinos', 'experiencias', 'cultura', 'historia',
    'lugares turísticos', 'feriado', 'feriados', 'visitar', 'visita',
    'cartagena', 'bogotá', 'medellín', 'barranquilla', 'cali', 'ciudad amurallada',
    'murallas', 'maria la baja','bogota',
    'playa', 'playas', 'clima', 'pronóstico', 'paisaje',
    'hotel', 'hoteles', 'hostal', 'reserva', 'reservar', 'alojamiento',
    'restaurante', 'restaurantes', 'comida típica', 'gastronomía', 'bares', 'bar', 
    'clubes', 'discoteca', 'vida nocturna',
    'vuelo', 'vuelos', 'tiquetes', 'aerolínea', 'aeropuerto', 'aeropuertos',
    'pase de abordar', 
    'actividades', 'recomendar', 'recomendación', 'consejo',
    'hola', 'buenos días', 'buen día', 'nombres', 'barrios', 'fiestas',
    'festivales', 'carnaval', 'mar', 'islas', 'guías', 'guía turístico',
    'seguro de viaje', 'transporte', 'pasaje', 'paquetes turísticos', 'nombre', 'barrios', 'premium', 'festivales', 'llamas', 'pareja', 
  
    // Inglés (equivalentes y adicionales)
    'colombia', 'tourism', 'travel', 'trip', 'trips', 'tour', 'tours',
    'vacation', 'vacations', 'destination', 'destinations', 'experiences',
    'culture', 'history', 'tourist places', 'holiday', 'holidays', 'visit',
    'cartagena', 'bogota', 'medellin', 'barranquilla', 'cali', 'walled city',
    'walls', 'maria la baja',
    'beach', 'beaches', 'weather', 'forecast', 'landscape',
    'hotel', 'hotels', 'hostel', 'reservation', 'book', 'booking', 'accommodation',
    'restaurant', 'restaurants', 'typical food', 'gastronomy', 'bars', 'bar',
    'clubs', 'nightclub', 'night life', 'nightlife',
    'flight', 'flights', 'tickets', 'airline', 'airport', 'airports',
    'boarding pass',
    'activities', 'recommend', 'recommendation', 'advice', 'hello', 'hi',
    'good morning', 'names', 'neighborhoods', 'parties', 'festivals',
    'carnival', 'sea', 'islands', 'guides', 'tour guide', 'travel insurance',
    'transportation', 'passage', 'tour packages', 'good day', 'hello', 'good morning', 'Hello', 'neighborhoods', 'parties', 'festivals',
  ];
  

  return keywords.some((keyword) => msgLower.includes(keyword));
}

import { franc } from 'franc';

export function detectLanguage(text) {
  const langCode = franc(text);

  if (langCode === 'eng') return 'en';
  if (langCode === 'spa') return 'es';

  // Fallback manual con una lista ampliada de pistas en inglés
  const lower = text.toLowerCase();
  const englishHints = [
    'tourism', 'travel', 'trip', 'trips', 'tour', 'tours',
    'vacation', 'vacations', 'destination', 'destinations', 'experiences',
    'culture', 'history', 'tourist places', 'holiday', 'holidays', 'visit',
    'cartagena', 'bogota', 'medellin', 'barranquilla', 'cali', 'walled city',
    'walls',
    'beach', 'beaches', 'weather', 'forecast', 'landscape',
    'hotel', 'hotels', 'hostel', 'reservation', 'book', 'booking', 'accommodation',
    'restaurant', 'restaurants', 'typical food', 'gastronomy', 'bars', 'bar',
    'clubs', 'nightclub', 'night life', 'nightlife',
    'flight', 'flights', 'tickets', 'airline', 'airport', 'airports',
    'boarding pass',
    'activities', 'recommend', 'recommendation', 'advice', 'hello', 'hi',
    'good morning', 'names', 'neighborhoods', 'parties', 'festivals',
    'carnival', 'sea', 'islands', 'guides', 'tour guide', 'travel insurance',
    'transportation', 'passage', 'tour packages', 'good day',
    'please', 'thank you', 'goodbye', 'welcome', 'excuse me', 'sorry',
    'can you', 'could you', 'would you', 'where is', 'how much', 'cheap',
    'expensive', 'best', 'suggest', 'find', 'looking for',
  
    // Palabras y frases adicionales usadas comúnmente por turistas:
    'show me', 'I need', 'guide me to', 'directions to', 'how can I get to',
    'attraction', 'attractions', 'museum', 'museums', 'hours', 'open', 'close',
    'schedule', 'prices', 'cost', 'pricing', 'ticket price', 'map', 'location',
    'nearby', 'closest', 'near me', 'recommended', 'top', 'popular', 'famous'
  ];
  for (const word of englishHints) {
    if (lower.includes(word)) {
      console.log(`Detectado posible inglés por palabra clave: ${word}`);
      return 'en';
    }
  }

  console.log('Idioma predeterminado: español');
  return 'es'; // Fallback final: español
}

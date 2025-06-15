// services/premiumBusinessService.js

import config from '../config/index.js';

/**
 * Servicio para gestionar negocios premium y aliados
 * En producción, esto se conectaría a una base de datos PostgreSQL con PostGIS
 * Por ahora, usamos datos en memoria para demostración
 */

// Simulación de base de datos en memoria para negocios premium
const premiumBusinessesDB = {
  hotel: {
    cartagena: [
      {
        id: 'premium-hotel-1',
        name: 'Hotel Sofitel Legend Santa Clara',
        address: 'Calle 31 #39-29, Centro Histórico, Cartagena',
        description: 'Hotel de lujo en edificio histórico con spa y piscina',
        location: { lat: 10.4225, lng: -75.5516 },
        rating: 4.8,
        price: '$$$$',
        phone: '+57 5 6504700',
        website: 'https://sofitel.com',
        images: ['https://example.com/hotel1.jpg'],
        priority: 1 // Premium
      },
      {
        id: 'premium-hotel-2',
        name: 'Hotel Charleston Santa Teresa',
        address: 'Carrera 3 #31-23, Centro Histórico, Cartagena',
        description: 'Hotel 5 estrellas con terraza panorámica y restaurante gourmet',
        location: { lat: 10.4230, lng: -75.5505 },
        rating: 4.7,
        price: '$$$$',
        phone: '+57 5 6549520',
        website: 'https://hotelcharlestonsantateresa.com',
        images: ['https://example.com/hotel2.jpg'],
        priority: 1 // Premium
      },
      {
        id: 'allied-hotel-1',
        name: 'Hotel Caribe by Faranda',
        address: 'Bocagrande, Carrera 1 #2-87, Cartagena',
        description: 'Hotel histórico con amplios jardines y piscina',
        location: { lat: 10.4076, lng: -75.5552 },
        rating: 4.3,
        price: '$$$',
        phone: '+57 5 6501160',
        website: 'https://hotelcaribe.com',
        images: ['https://example.com/hotel3.jpg'],
        priority: 2 // Aliado
      }
    ],
    bogota: [
      {
        id: 'premium-hotel-3',
        name: 'Grand Hyatt Bogotá',
        address: 'Calle 24A #57-60, Bogotá',
        description: 'Hotel de lujo con spa, piscina cubierta y vistas a la ciudad',
        location: { lat: 4.6560, lng: -74.1076 },
        rating: 4.7,
        price: '$$$$',
        phone: '+57 1 6541234',
        website: 'https://hyatt.com',
        images: ['https://example.com/hotel4.jpg'],
        priority: 1 // Premium
      }
    ],
    medellin: [
      {
        id: 'premium-hotel-4',
        name: 'Hotel Du Parc Royal',
        address: 'Calle 9 #37-40, El Poblado, Medellín',
        description: 'Hotel boutique de lujo en El Poblado',
        location: { lat: 6.2087, lng: -75.5719 },
        rating: 4.6,
        price: '$$$',
        phone: '+57 4 4440968',
        website: 'https://hotelduparcroyal.com',
        images: ['https://example.com/hotel5.jpg'],
        priority: 1 // Premium
      }
    ]
  },
  restaurant: {
    cartagena: [
      {
        id: 'premium-restaurant-1',
        name: 'Carmen Cartagena',
        address: 'Calle 38 #8-19, Centro Histórico, Cartagena',
        description: 'Restaurante de alta cocina con ingredientes locales',
        location: { lat: 10.4233, lng: -75.5520 },
        rating: 4.9,
        price: '$$$$',
        phone: '+57 5 6647785',
        website: 'https://carmenrestaurante.com',
        images: ['https://example.com/restaurant1.jpg'],
        priority: 1 // Premium
      },
      {
        id: 'premium-restaurant-2',
        name: 'La Vitrola',
        address: 'Calle Baloco #2-01, Centro Histórico, Cartagena',
        description: 'Restaurante con música en vivo y cocina caribeña',
        location: { lat: 10.4244, lng: -75.5488 },
        rating: 4.7,
        price: '$$$$',
        phone: '+57 5 6648243',
        website: 'https://lavitrola.com',
        images: ['https://example.com/restaurant2.jpg'],
        priority: 1 // Premium
      }
    ],
    bogota: [
      {
        id: 'premium-restaurant-3',
        name: 'Leo Cocina y Cava',
        address: 'Calle 27B #6-75, Bogotá',
        description: 'Alta cocina colombiana con ingredientes autóctonos',
        location: { lat: 4.6122, lng: -74.0677 },
        rating: 4.8,
        price: '$$$$',
        phone: '+57 1 2867091',
        website: 'https://restauranteleo.com',
        images: ['https://example.com/restaurant3.jpg'],
        priority: 1 // Premium
      }
    ]
  },
  bar: {
    cartagena: [
      {
        id: 'premium-bar-1',
        name: 'Alquímico',
        address: 'Calle del Colegio #34-24, Centro Histórico, Cartagena',
        description: 'Bar con cócteles artesanales en edificio colonial',
        location: { lat: 10.4241, lng: -75.5504 },
        rating: 4.7,
        price: '$$$',
        phone: '+57 5 6601611',
        website: 'https://alquimico.com',
        images: ['https://example.com/bar1.jpg'],
        priority: 1 // Premium
      }
    ],
    medellin: [
      {
        id: 'premium-bar-2',
        name: 'Envy Rooftop',
        address: 'Carrera 42 #1Sur-74, El Poblado, Medellín',
        description: 'Bar en la terraza con vistas panorámicas',
        location: { lat: 6.2023, lng: -75.5722 },
        rating: 4.6,
        price: '$$$',
        phone: '+57 4 4444444',
        website: 'https://envyrooftop.com',
        images: ['https://example.com/bar2.jpg'],
        priority: 1 // Premium
      }
    ]
  },
  museum: {
    cartagena: [
      {
        id: 'premium-museum-1',
        name: 'Museo del Oro Zenú',
        address: 'Plaza de Bolívar #33-01, Centro Histórico, Cartagena',
        description: 'Museo con colección de orfebrería precolombina',
        location: { lat: 10.4241, lng: -75.5517 },
        rating: 4.6,
        price: '$',
        phone: '+57 5 6601600',
        website: 'https://banrepcultural.org/cartagena',
        images: ['https://example.com/museum1.jpg'],
        priority: 1 // Premium
      }
    ]
  },
  beach: {
    cartagena: [
      {
        id: 'premium-beach-1',
        name: 'Playa Blanca',
        address: 'Isla Barú, Cartagena',
        description: 'Playa de arena blanca y aguas cristalinas',
        location: { lat: 10.2346, lng: -75.5847 },
        rating: 4.5,
        price: '$',
        phone: null,
        website: null,
        images: ['https://example.com/beach1.jpg'],
        priority: 1 // Premium
      }
    ]
  },
  // Añadir otras categorías según sea necesario para ciudades específicas
  attraction: {
    cartagena: [
      {
        id: 'premium-attraction-1',
        name: 'Castillo de San Felipe de Barajas',
        address: 'Carrera 17, Cartagena',
        description: 'Fortaleza histórica con vistas panorámicas de la ciudad',
        location: { lat: 10.4232, lng: -75.5403 },
        rating: 4.7,
        price: '$$',
        phone: '+57 5 6564820',
        website: 'https://fortificacionesdecartagena.com',
        images: ['https://example.com/attraction1.jpg'],
        priority: 1 // Premium
      }
    ]
  },
  park: {
    medellin: [
      {
        id: 'premium-park-1',
        name: 'Parque Arví',
        address: 'Corregimiento de Santa Elena, Medellín',
        description: 'Parque ecológico con senderos naturales y actividades al aire libre',
        location: { lat: 6.2778, lng: -75.5031 },
        rating: 4.6,
        price: '$',
        phone: '+57 4 4442979',
        website: 'https://parquearvi.org',
        images: ['https://example.com/park1.jpg'],
        priority: 1 // Premium
      }
    ]
  }
};

/**
 * Encuentra negocios premium y aliados por categoría y ubicación con soporte mejorado para geolocalización
 * @param {string} category - Categoría de negocio (hotel, restaurant, etc.)
 * @param {string} city - Ciudad donde buscar
 * @param {Object} userLocation - Coordenadas del usuario {lat, lng}
 * @param {number} limit - Límite de resultados
 * @returns {Array} - Lista de negocios ordenados por prioridad y distancia
 */
export function findPremiumBusinesses(category, city, userLocation, limit = 10) {
  // Normalizar categoría y ciudad para búsqueda
  const normalizedCategory = normalizeCategory(category);
  const normalizedCity = city ? city.toLowerCase() : null;
  
  console.log(`Buscando negocios premium en categoría: ${normalizedCategory}, ciudad: ${normalizedCity}`);
  
  // Si no tenemos la categoría o la ciudad es inválida, devolver array vacío
  if (!normalizedCategory) {
    return [];
  }
  
  // Verificar si la categoría existe en nuestra base de datos
  if (!premiumBusinessesDB[normalizedCategory]) {
    console.log(`Categoría ${normalizedCategory} no encontrada en base de datos`);
    return [];
  }
  
  // Recolectar negocios en la categoría y ciudad específicas
  let businesses = [];
  
  // Si se especificó una ciudad, buscar solo en esa ciudad
  if (normalizedCity && premiumBusinessesDB[normalizedCategory][normalizedCity]) {
    businesses = [...premiumBusinessesDB[normalizedCategory][normalizedCity]];
    console.log(`Encontrados ${businesses.length} negocios en ${normalizedCity} para categoría ${normalizedCategory}`);
  } 
  // Si se especificó una ciudad pero no hay negocios para esa categoría en esa ciudad
  else if (normalizedCity) {
    console.log(`No se encontraron negocios premium para ${normalizedCategory} en ${normalizedCity}`);
    return []; // Retornar array vacío en lugar de buscar en todas las ciudades
  }
  // Si no se especificó ciudad, buscar en todas las ciudades
  else {
    Object.values(premiumBusinessesDB[normalizedCategory]).forEach(cityBusinesses => {
      businesses = [...businesses, ...cityBusinesses];
    });
    console.log(`Encontrados ${businesses.length} negocios en todas las ciudades para categoría ${normalizedCategory}`);
  }
  
  // Si no hay negocios, retornar array vacío
  if (businesses.length === 0) {
    return [];
  }
  
  // Verificar si tenemos una ubicación de usuario válida para calcular distancias
  const hasValidLocation = userLocation && 
                           typeof userLocation.lat !== 'undefined' && 
                           typeof userLocation.lng !== 'undefined' &&
                           !isNaN(userLocation.lat) && 
                           !isNaN(userLocation.lng);
  
  // Si hay ubicación del usuario, calcular distancias
  if (hasValidLocation) {
    console.log(`Calculando distancias desde: ${userLocation.lat}, ${userLocation.lng}`);
    businesses = businesses.map(business => {
      const distance = calculateDistance(
        userLocation.lat, 
        userLocation.lng,
        business.location.lat,
        business.location.lng
      );
      
      return {
        ...business,
        distance: distance,
        distance_text: formatDistance(distance)
      };
    });
  }
  
  // Ordenar basado en la ubicación del usuario si está disponible
  if (hasValidLocation) {
    // Si tenemos la ubicación del usuario, primero separar por categoría de prioridad
    // y luego ordenar cada grupo por distancia
    const premiumBusinesses = businesses.filter(b => b.priority === 1);
    const alliedBusinesses = businesses.filter(b => b.priority === 2);
    const normalBusinesses = businesses.filter(b => b.priority > 2);
    
    // Ordenar cada grupo por distancia
    premiumBusinesses.sort((a, b) => a.distance - b.distance);
    alliedBusinesses.sort((a, b) => a.distance - b.distance);
    normalBusinesses.sort((a, b) => a.distance - b.distance);
    
    // Combinar los grupos nuevamente
    businesses = [...premiumBusinesses, ...alliedBusinesses, ...normalBusinesses];
    
    console.log(`Negocios ordenados por distancia dentro de cada categoría de prioridad`);
  } else {
    // Ordenación original: primero por prioridad, luego por calificación
    businesses.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      
      return b.rating - a.rating; // Si no hay distancia, ordenar por calificación
    });
  }
  
  // Aplicar límite si es necesario
  return businesses.slice(0, limit);
}

/**
 * Verifica si hay negocios premium disponibles para una ciudad y categoría específicas
 * @param {string} category - Categoría a verificar
 * @param {string} city - Ciudad a verificar
 * @returns {boolean} - True si existen negocios en esa categoría y ciudad
 */
export function hasPremiumBusinesses(category, city) {
  const normalizedCategory = normalizeCategory(category);
  const normalizedCity = city ? city.toLowerCase() : null;
  
  if (!normalizedCategory || !normalizedCity) {
    return false;
  }
  
  return !!(
    premiumBusinessesDB[normalizedCategory] && 
    premiumBusinessesDB[normalizedCategory][normalizedCity] &&
    premiumBusinessesDB[normalizedCategory][normalizedCity].length > 0
  );
}

/**
 * Obtiene todas las categorías disponibles para una ciudad específica
 * @param {string} city - Ciudad a consultar
 * @returns {Array} - Lista de categorías disponibles
 */
export function getAvailableCategoriesForCity(city) {
  if (!city) return [];
  
  const normalizedCity = city.toLowerCase();
  const categories = [];
  
  // Recorrer todas las categorías
  Object.keys(premiumBusinessesDB).forEach(category => {
    // Verificar si la ciudad tiene negocios en esta categoría
    if (
      premiumBusinessesDB[category][normalizedCity] && 
      premiumBusinessesDB[category][normalizedCity].length > 0
    ) {
      categories.push(category);
    }
  });
  
  return categories;
}

/**
 * Registra una impresión de recomendación de negocio premium
 * @param {string} businessId - ID del negocio
 * @param {string} sessionId - ID de sesión del usuario
 * @returns {boolean} - True si se registró correctamente
 */
export function trackBusinessImpression(businessId, sessionId) {
  // En producción, esto registraría en la base de datos
  console.log(`Impresión registrada: Negocio ${businessId}, Sesión ${sessionId}`);
  return true;
}

/**
 * Registra un clic en un negocio premium
 * @param {string} businessId - ID del negocio
 * @param {string} sessionId - ID de sesión del usuario
 * @returns {boolean} - True si se registró correctamente
 */
export function trackBusinessClick(businessId, sessionId) {
  // En producción, esto registraría en la base de datos
  console.log(`Clic registrado: Negocio ${businessId}, Sesión ${sessionId}`);
  return true;
}

/**
 * Normaliza la categoría de negocio para búsqueda
 * @param {string} category - Categoría de entrada
 * @returns {string} - Categoría normalizada
 */
function normalizeCategory(category) {
  if (!category) return null;
  
  const cat = category.toLowerCase().trim();
  
  // Mapeo de términos comunes a categorías estándar
  const categoryMappings = {
    // Hoteles
    'hotel': 'hotel',
    'hotels': 'hotel',
    'hoteles': 'hotel',
    'alojamiento': 'hotel',
    'hospedaje': 'hotel',
    'accommodation': 'hotel',
    'lodging': 'hotel',
    'hostal': 'hotel',
    'hostel': 'hotel',
    
    // Restaurantes
    'restaurant': 'restaurant',
    'restaurants': 'restaurant',
    'restaurante': 'restaurant',
    'restaurantes': 'restaurant',
    'comida': 'restaurant',
    'dining': 'restaurant',
    'food': 'restaurant',
    
    // Bares
    'bar': 'bar',
    'bars': 'bar',
    'bares': 'bar',
    'pub': 'bar',
    'pubs': 'bar',
    
    // Museos
    'museum': 'museum',
    'museums': 'museum',
    'museo': 'museum',
    'museos': 'museum',
    
    // Playas
    'beach': 'beach',
    'beaches': 'beach',
    'playa': 'beach',
    'playas': 'beach',
    
    // Atracciones
    'attraction': 'attraction',
    'attractions': 'attraction',
    'atraccion': 'attraction',
    'atracciones': 'attraction',
    'sitio': 'attraction',
    'sitios': 'attraction',
    'lugar': 'attraction',
    'lugares': 'attraction',
    'site': 'attraction',
    'sites': 'attraction',
    
    // Parques
    'park': 'park',
    'parks': 'park',
    'parque': 'park',
    'parques': 'park'
  };
  
  return categoryMappings[cat] || null;
}

/**
 * Calcula la distancia entre dos puntos de coordenadas usando la fórmula de Haversine
 * @param {number} lat1 - Latitud del punto 1
 * @param {number} lon1 - Longitud del punto 1
 * @param {number} lat2 - Latitud del punto 2
 * @param {number} lon2 - Longitud del punto 2
 * @returns {number} - Distancia en kilómetros
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distancia en km
  
  return distance;
}

/**
 * Convierte grados a radianes
 * @param {number} degrees - Ángulo en grados
 * @returns {number} - Ángulo en radianes
 */
function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Formatea una distancia para mostrar
 * @param {number} distance - Distancia en kilómetros
 * @returns {string} - Texto formateado de la distancia
 */
function formatDistance(distance) {
  if (distance === undefined || distance === null) {
    return null;
  }
  
  if (distance < 1) {
    // Convertir a metros para distancias menores a 1km
    return `${Math.round(distance * 1000)}m`;
  } else {
    // Formatear km con un decimal
    return `${distance.toFixed(1)}km`;
  }
}
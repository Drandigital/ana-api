// services/mapIntegrationService.js
// Servicio dedicado para integración con el mapa del frontend

import { getPlacesNearUser, getPlacesWithDetails } from './externalApiService.js';
import geolocationService from './geolocationService.js';
import config from '../config/index.js';

/**
 * Detecta si un mensaje tiene intención geográfica
 */
export function hasGeoIntent(message) {
  if (!message) return false;
  
  const geoKeywords = [
    'hoteles cerca', 'restaurantes cerca', 'cerca de mí', 'cerca de mi',
    'en esta zona', 'aquí cerca', 'aca cerca', 'donde comer',
    'que hacer', 'qué hacer', 'lugares para', 'sitios para',
    'museos que', 'bares para', 'tiendas para', 'cafés cerca',
    'lugares turísticos', 'sitios turísticos', 'atracciones cerca',
    'en cartagena', 'en bogotá', 'en medellín', 'en esta ciudad'
  ];
  
  const lowerMessage = message.toLowerCase();
  return geoKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Detecta la categoría de lugar basada en el mensaje
 */
export function detectCategory(message) {
  const lowerMessage = message.toLowerCase();
  
  // Mapeo de palabras clave a categorías
  const categoryMap = {
    'hotel': ['hotel', 'hoteles', 'alojamiento', 'hospedaje', 'dormir', 'hostal'],
    'restaurant': ['restaurante', 'restaurantes', 'comida', 'comer', 'almorzar', 'cenar'],
    'cafe': ['café', 'cafes', 'cafetería', 'coffee', 'desayunar'],
    'bar': ['bar', 'bares', 'trago', 'cerveza', 'cantina'],
    'nightlife': ['discoteca', 'rumba', 'fiesta', 'bailar'],
    'museum': ['museo', 'museos', 'arte', 'cultura', 'exposición'],
    'attraction': ['turística', 'turístico', 'atracción', 'visitar', 'conocer', 'lugares', 'sitios'],
    'shopping': ['tienda', 'tiendas', 'compra', 'shopping', 'centro comercial']
  };
  
  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return category;
    }
  }
  
  return 'attraction'; // Default
}

/**
 * Convierte categoría a tipo de Google Places
 */
export function categoryToGoogleType(category) {
  const typeMap = {
    'hotel': 'lodging',
    'restaurant': 'restaurant',
    'cafe': 'cafe',
    'bar': 'bar',
    'nightlife': 'night_club',
    'museum': 'museum',
    'attraction': 'tourist_attraction',
    'shopping': 'store'
  };
  
  return typeMap[category] || 'tourist_attraction';
}

/**
 * Calcula distancia formateada
 */
export function calculateDistanceFormatted(userLocation, placeLocation) {
  if (!userLocation || !placeLocation) return null;
  
  const distance = geolocationService.calculateDistance(
    userLocation.lat, userLocation.lng,
    placeLocation.lat, placeLocation.lng
  );
  
  if (!distance) return null;
  
  return distance < 1 
    ? `${Math.round(distance * 1000)}m` 
    : `${distance.toFixed(1)}km`;
}

/**
 * Función principal para obtener lugares para una consulta geográfica
 */
export async function getPlacesForQuery(message, location) {
  try {
    console.log('🗺️ Obteniendo lugares para consulta geográfica:', message);
    
    // 1. Detectar categoría
    const category = detectCategory(message);
    const googleType = categoryToGoogleType(category);
    
    console.log(`🎯 Categoría detectada: ${category} -> Google type: ${googleType}`);
    
    // 2. Buscar lugares usando el servicio existente
    const places = await getPlacesNearUser(location, googleType, 'es', 10000, 10);
    
    if (!places || places.length === 0) {
      console.log('❌ No se encontraron lugares');
      return [];
    }
    
    console.log(`📍 Encontrados ${places.length} lugares, obteniendo detalles completos...`);
    
    // 3. Obtener detalles completos (incluyendo teléfonos) para los mejores lugares
    const placesWithDetails = await getPlacesWithDetails(places, 6);
    
    // 4. Formatear para el frontend según especificaciones exactas
    const formattedPlaces = placesWithDetails.map(place => {
      const placeLocation = {
        lat: place.location?.lat || place.geometry?.location?.lat,
        lng: place.location?.lng || place.geometry?.location?.lng
      };
      
      return {
        place_id: place.place_id || `place_${Math.random().toString(36).substr(2, 9)}`,
        name: place.name || 'Lugar sin nombre',
        location: placeLocation,
        address: place.vicinity || place.formatted_address || place.address || null,
        rating: place.rating || null,
        phone: place.phone || null, // ← AHORA CON DATOS REALES
        photos: place.photos ? place.photos.slice(0, 3).map(photo => {
          if (typeof photo === 'string') return photo;
          if (photo.photo_reference) {
            return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${config.externalApis.googleMapsApiKey}`;
          }
          return null;
        }).filter(Boolean) : [],
        category: category,
        business_type: category,
        distance_formatted: calculateDistanceFormatted(location, placeLocation),
        isVerified: place.isVerified || false,
        isPremium: place.isPremium || false,
        website: place.website || null, // ← BONUS
        opening_hours: place.opening_hours || null, // ← BONUS
        google_url: place.google_url || null, // ← BONUS
        user_ratings_total: place.user_ratings_total || null // ← BONUS
      };
    });
    
    console.log(`✅ Formateados ${formattedPlaces.length} lugares para el mapa con detalles completos`);
    
    // Log de teléfonos encontrados para debug
    const phonesFound = formattedPlaces.filter(p => p.phone).length;
    console.log(`📞 Teléfonos encontrados: ${phonesFound}/${formattedPlaces.length}`);
    
    return formattedPlaces;
    
  } catch (error) {
    console.error('❌ Error obteniendo lugares para el mapa:', error);
    return [];
  }
}

/**
 * Detecta la ciudad basada en la ubicación
 */
export function detectCity(location) {
  if (!location) return 'Ciudad no especificada';
  
  if (location.city) return location.city;
  
  // Usar el servicio de geolocalización para detectar la ciudad
  const nearestCity = geolocationService.getNearestCity(location.lat, location.lng);
  return nearestCity?.name || 'Ciudad no especificada';
}

export default {
  hasGeoIntent,
  detectCategory,
  categoryToGoogleType,
  calculateDistanceFormatted,
  getPlacesForQuery,
  detectCity
};

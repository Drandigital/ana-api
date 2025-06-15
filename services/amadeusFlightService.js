// services/amadeusFlightService.js (ES Modules)
import Amadeus from 'amadeus';
import config from '../config/index.js';
import { ApiError } from '../middleware/errorHandler.js';

// Initialize Amadeus client with configuration
const amadeus = new Amadeus({
  clientId: config.amadeus.apiKey,
  clientSecret: config.amadeus.apiSecret,
  hostname: config.amadeus.environment // 'test' or 'production'
});

// Cache object for flight search results
const flightCache = new Map();

/**
 * Searches for flights between origin and destination
 * @param {string} origin - IATA code of origin airport
 * @param {string} destination - IATA code of destination airport
 * @param {string} departureDate - Departure date in YYYY-MM-DD format
 * @param {number} adults - Number of adult passengers (default: 1)
 * @param {string} currency - Currency code (default: USD)
 * @param {number} maxResults - Maximum number of results to return (default: 10)
 * @returns {Promise<Array>} - Array of flight offers
 */
export async function searchFlights(
  origin, 
  destination, 
  departureDate, 
  adults = 1, 
  currency = 'USD', 
  maxResults = 10
) {
  // Generate cache key
  const cacheKey = `flight:${origin}:${destination}:${departureDate}:${adults}:${currency}`;
  
  // Check cache first
  if (flightCache.has(cacheKey)) {
    const cachedItem = flightCache.get(cacheKey);
    if (Date.now() < cachedItem.expiry) {
      console.log(`Flight cache hit for ${cacheKey}`);
      return cachedItem.data;
    } else {
      console.log(`Flight cache expired for ${cacheKey}`);
      flightCache.delete(cacheKey);
    }
  }

  try {
    console.log(`Searching flights from ${origin} to ${destination} on ${departureDate}`);
    
    // Call Amadeus API
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      adults,
      currencyCode: currency,
      max: maxResults
    });

    // Cache the results
    const flightOffers = response.data;
    flightCache.set(cacheKey, {
      data: flightOffers,
      expiry: Date.now() + (config.cache.flightsTtl * 1000)
    });

    return flightOffers;
  } catch (error) {
    console.error('Error searching flights with Amadeus:', error);
    
    // Handle specific Amadeus errors
    if (error.code === 'INVALID_AIRPORT') {
      throw new ApiError(`Invalid airport code: ${error.description}`, 400);
    }
    
    if (error.code === 'INVALID_DATE') {
      throw new ApiError(`Invalid date format: ${error.description}`, 400);
    }

    // Handle network errors
    if (error.message && error.message.includes('Network Error')) {
      throw new ApiError('Network error connecting to flight service', 503);
    }

    // Generic error
    throw new ApiError('Error fetching flight information', 500);
  }
}

/**
 * Gets information about a specific airport by IATA code
 * @param {string} airportCode - IATA airport code (e.g., 'CTG', 'BOG')
 * @returns {Promise<Object>} - Airport information
 */
export async function getAirportInfo(airportCode) {
  try {
    const response = await amadeus.referenceData.locations.get({
      keyword: airportCode,
      subType: 'AIRPORT'
    });
    
    return response.data[0] || null;
  } catch (error) {
    console.error('Error fetching airport information:', error);
    throw new ApiError('Unable to fetch airport information', 500);
  }
}

/**
 * Gets flight price metrics for a given route
 * @param {string} origin - IATA code of origin airport
 * @param {string} destination - IATA code of destination airport
 * @returns {Promise<Object>} - Price metrics
 */
export async function getFlightPriceMetrics(origin, destination) {
  try {
    const response = await amadeus.analytics.itineraryPriceMetrics.get({
      originIataCode: origin,
      destinationIataCode: destination,
      departureDate: getNextThreeMonths()
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching flight price metrics:', error);
    throw new ApiError('Unable to fetch flight price metrics', 500);
  }
}

/**
 * Helper function to generate next three months period
 * @returns {Array<string>} - Array of dates in YYYY-MM format
 */
function getNextThreeMonths() {
  const months = [];
  const today = new Date();
  
  for (let i = 0; i < 3; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    months.push(`${year}-${month}`);
  }
  
  return months;
}
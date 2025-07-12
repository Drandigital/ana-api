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
  returnDate = null,
  adults = 1, 
  currency = 'USD', 
  maxResults = 10
) {
  // Validate and normalize parameters
  const normalizedAdults = parseInt(adults) || 1;
  const normalizedCurrency = currency === 'USD' || currency === 'EUR' || currency === 'COP' ? currency : 'USD';
  const normalizedMaxResults = parseInt(maxResults) || 10;
  
  // Generate cache key
  const cacheKey = `flight:${origin}:${destination}:${departureDate}:${returnDate}:${normalizedAdults}:${normalizedCurrency}`;
  
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
    console.log(`Searching flights from ${origin} to ${destination} on ${departureDate} (adults: ${normalizedAdults}, currency: ${normalizedCurrency})`);
    
    // Prepare API parameters
    const searchParams = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      adults: normalizedAdults,
      currencyCode: normalizedCurrency,
      max: normalizedMaxResults
    };
    
    // Add return date if provided (round trip)
    if (returnDate) {
      searchParams.returnDate = returnDate;
    }
    
    // Call Amadeus API
    const response = await amadeus.shopping.flightOffersSearch.get(searchParams);

    // Process and format the results
    const processedFlights = processFlightOffers(response.data);
    
    // Cache the processed results
    flightCache.set(cacheKey, {
      data: processedFlights,
      expiry: Date.now() + (config.cache.flightsTtl * 1000)
    });

    console.log(`✅ Found ${processedFlights.length} flights and cached results`);
    return processedFlights;
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

/**
 * Processes and formats flight offers for frontend consumption
 * @param {Array} flightOffers - Raw flight offers from Amadeus API
 * @returns {Array} - Formatted flight data
 */
export function processFlightOffers(flightOffers) {
  if (!flightOffers || flightOffers.length === 0) {
    return [];
  }
  
  return flightOffers.map(offer => {
    try {
      const firstItinerary = offer.itineraries?.[0];
      const firstSegment = firstItinerary?.segments?.[0];
      const lastSegment = firstItinerary?.segments?.[firstItinerary.segments.length - 1];
      
      return {
        id: offer.id,
        price: offer.price?.total || 'N/A',
        currency: offer.price?.currency || 'USD',
        airline: firstSegment?.carrierCode || 'Unknown',
        flightNumber: firstSegment?.number || 'N/A',
        duration: firstItinerary?.duration || 'N/A',
        departure: {
          airport: firstSegment?.departure?.iataCode || 'N/A',
          time: firstSegment?.departure?.at || 'N/A',
          terminal: firstSegment?.departure?.terminal || null
        },
        arrival: {
          airport: lastSegment?.arrival?.iataCode || 'N/A',
          time: lastSegment?.arrival?.at || 'N/A',
          terminal: lastSegment?.arrival?.terminal || null
        },
        stops: firstItinerary?.segments?.length > 1 ? firstItinerary.segments.length - 1 : 0,
        bookingClass: firstSegment?.cabin || 'ECONOMY',
        baggageAllowance: firstSegment?.pricingDetailPerAdult?.travelClass || null,
        isRefundable: offer.pricingOptions?.refundableFare || false,
        lastTicketingDate: offer.lastTicketingDate || null,
        source: 'amadeus'
      };
    } catch (error) {
      console.error('Error processing flight offer:', error);
      return {
        id: offer.id || 'unknown',
        price: 'N/A',
        currency: 'USD',
        airline: 'Unknown',
        error: 'Error processing flight data'
      };
    }
  });
}
// config/index.js
import dotenv from 'dotenv';
dotenv.config();

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development',
    allowedOrigins: [
      'http://localhost:5173', 
      'https://frontend-ana.vercel.app', 
      'https://frontend-ana-map-mkc3.vercel.app', 
      'https://www.gooway.co',
      'http://localhost:5174'
      
    ]
  },

  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    maxTokens: 1070,
    temperature: 0.5,
    // Add fallback models
    fallbackModels: {
      primary: 'gpt-3.5-turbo',
      secondary: 'gpt-3.5-turbo-16k', // Could be replaced with Deekseep when available
      tertiary: 'gpt-3.5-turbo'       // Could be replaced with Gemini when available
    },
    // Configure timeout for circuit breaker
    timeout: 5000
  },

  // Amadeus Flight API configuration
  amadeus: {
    apiKey: process.env.AMADEUS_API_KEY,
    apiSecret: process.env.AMADEUS_API_SECRET,
    environment: process.env.AMADEUS_ENVIRONMENT || 'test', // 'test' or 'production'
  },

  // External APIs
  externalApis: {
    weatherApiKey: process.env.WEATHER_API_KEY,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  },

  // Cache configuration
  cache: {
    weatherTtl: 3600, // 1 hour
    placesTourismTtl: 86400, // 24 hours
    placesHotelsTtl: 86400 * 7, // 7 days
    flightsTtl: 3600, // 1 hour
    openaiTtl: 3600 * 6, // 6 hours
  },

  // Priority system for premium partners
  prioritySystem: {
    enabled: true,
    levels: {
      premium: 1,
      standard: 2,
      normal: 3
    }
  }
};

export default config;

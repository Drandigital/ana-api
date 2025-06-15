// controllers/chatController.js
import validateTourismQuery from '../utils/validateTourismQuery.js';
import { getChatCompletion } from '../services/openaiService.js';
import { detectLanguage } from '../utils/detectLanguage.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import { 
  findPremiumBusinesses, 
  trackBusinessImpression,
  trackBusinessClick 
} from '../services/premiumBusinessService.js';
import { analyzeQuery } from './queryAnalysisController.js';
import { createSystemPrompt } from './promptController.js';
import { gatherExternalInfo } from './externalInfoController.js';
import { processTextForSpeech } from '../utils/speechProcessor.js';

// In-memory conversation history store
// In production, this should be replaced with a proper database
export const conversationHistory = {};

/**
 * Main chat request handler with async/await error handling
 */
export const handleChatRequest = asyncHandler(async (req, res) => {
  // Extract request data
  const userMessage = req.body.message || '';
  const lowerMessage = userMessage.toLowerCase();
  const language = req.body.language || detectLanguage(userMessage);
  const sessionId = req.body.sessionId || 'default-session';
  
  // Process and validate user location
  let userLocation = req.body.location || null;
  
  if (userLocation) {
    // Ensure location has proper format
    if (typeof userLocation === 'string') {
      try {
        // Sometimes location might be sent as JSON string
        userLocation = JSON.parse(userLocation);
      } catch (e) {
        console.error(`Could not parse location string: ${userLocation}`);
        userLocation = null;
      }
    }
    
    // Validate location object
    if (userLocation && typeof userLocation === 'object') {
      if (typeof userLocation.lat !== 'undefined' && typeof userLocation.lng !== 'undefined') {
        // Convert to numbers if string
        if (typeof userLocation.lat === 'string') userLocation.lat = parseFloat(userLocation.lat);
        if (typeof userLocation.lng === 'string') userLocation.lng = parseFloat(userLocation.lng);
        
        // Final validation
        if (isNaN(userLocation.lat) || isNaN(userLocation.lng) || 
            userLocation.lat < -90 || userLocation.lat > 90 || 
            userLocation.lng < -180 || userLocation.lng > 180) {
          console.error(`Invalid coordinates: ${JSON.stringify(userLocation)}`);
          userLocation = null;
        } else {
          console.log(`Valid user location received: ${userLocation.lat}, ${userLocation.lng}`);
        }
      } else {
        console.error(`Missing lat/lng in location object: ${JSON.stringify(userLocation)}`);
        userLocation = null;
      }
    }
  }
  
  console.log(`Received message: "${userMessage}" in ${language}`);
  console.log(`User location:`, userLocation);
  
  // Initialize conversation history for this session if it doesn't exist
  if (!conversationHistory[sessionId]) {
    conversationHistory[sessionId] = [];
  }
  
  // Add user message to history
  conversationHistory[sessionId].push({ role: 'user', content: userMessage });

  // Validate if query is tourism-related
  const isTourism = validateTourismQuery(userMessage);
  if (!isTourism) {
    const refusal = language === 'en'
      ? "I'm sorry, I can only answer questions about tourism in Colombia."
      : "Lo siento, solo respondo preguntas sobre turismo en Colombia.";
    
    conversationHistory[sessionId].push({ role: 'assistant', content: refusal });
    return res.status(200).json({ response: refusal });
  }

  try {
    // Analyze query for detected category, city, and intent
    const queryAnalysis = analyzeQuery(userMessage, lowerMessage, language);
    console.log("Query analysis:", queryAnalysis);
    
    // Get premium recommendations if applicable
    let premiumRecommendations = null;
    if (queryAnalysis.businessCategory) {
      premiumRecommendations = findPremiumBusinesses(
        queryAnalysis.businessCategory,
        queryAnalysis.city,
        userLocation
      );
      
      // Track impressions for analytics
      if (premiumRecommendations.length > 0) {
        premiumRecommendations.forEach(business => {
          trackBusinessImpression(business.id, sessionId);
        });
      }
      
      console.log(`Found ${premiumRecommendations.length} premium businesses`);
    }
    
    // Process external information (weather, flights, places, etc.)
    const externalInfo = await gatherExternalInfo(
      userMessage, 
      lowerMessage, 
      language, 
      sessionId,
      userLocation,
      premiumRecommendations,
      queryAnalysis
    );
    
    console.log("External info gathered for prompt");

    // Prepare the messages for OpenAI
    const systemPrompt = createSystemPrompt(language, externalInfo, premiumRecommendations);
    
    const messagesForOpenAI = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory[sessionId].slice(-10) // Only use last 10 messages to avoid token limits
    ];

    // Get response from AI
    const aiResponse = await getChatCompletion(messagesForOpenAI);
    
    // Add AI response to conversation history
    conversationHistory[sessionId].push({ role: 'assistant', content: aiResponse });

    // Get places data to return to frontend
    const placesToReturn = [];
    
    // Add premium recommendations to places data
    if (premiumRecommendations && premiumRecommendations.length > 0) {
      premiumRecommendations.forEach(business => {
        placesToReturn.push({
          id: business.id,
          name: business.name,
          address: business.address,
          description: business.description,
          location: business.location,
          rating: business.rating,
          isPremium: business.priority === 1,
          isVerified: true,
          distance: business.distance,
          distance_text: business.distance_text,
          category: queryAnalysis.businessCategory,
          phone: business.phone,
          website: business.website,
          images: business.images
        });
      });
    }
    
    // Add Google Places data if available
    if (conversationHistory[sessionId].mapPlaces) {
      // Mark which places are from Google to differentiate from premium
      conversationHistory[sessionId].mapPlaces.forEach(place => {
        // Only add if not already in the list (avoid duplicates)
        if (!placesToReturn.some(p => p.name === place.name)) {
          placesToReturn.push({
            ...place,
            isPremium: false,
            isVerified: false,
            category: queryAnalysis.businessCategory
          });
        }
      });
    }

    // Prepare and send response
    return res.status(200).json({ 
      response: aiResponse,
      places: placesToReturn,
      sessionId,
      businessCategory: queryAnalysis.businessCategory,
      city: queryAnalysis.city
    });
  } catch (error) {
    console.error("Error processing chat request:", error);
    const errorMessage = language === 'en'
      ? "I'm sorry, I encountered an error while processing your request. Please try again."
      : "Lo siento, encontré un error al procesar tu solicitud. Por favor, inténtalo de nuevo.";
    
    return res.status(500).json({ 
      response: errorMessage,
      error: error.message
    });
  }
});

/**
 * Handle click events on premium businesses for analytics tracking
 */
export const handleBusinessClick = asyncHandler(async (req, res) => {
  const { businessId, sessionId } = req.body;
  
  if (!businessId || !sessionId) {
    return res.status(400).json({
      success: false,
      message: 'BusinessId and sessionId are required'
    });
  }
  
  // Track the click in analytics
  const success = trackBusinessClick(businessId, sessionId);
  
  return res.status(200).json({
    success: true,
    message: 'Business click tracked successfully'
  });
});

/**
 * Convert text to speech using browser's SpeechSynthesis API
 * Note: This is handled on the frontend, this endpoint just returns the text
 * to be spoken with appropriate parameters
 */
export const getTextToSpeech = asyncHandler(async (req, res) => {
  const { text, language = 'es-CO' } = req.body;
  
  if (!text) {
    return res.status(400).json({
      success: false,
      message: 'Text is required'
    });
  }
  
  // Process the text to make it more suitable for speech
  const processedText = processTextForSpeech(text);
  
  return res.status(200).json({
    success: true,
    text: processedText,
    language: language
  });
});
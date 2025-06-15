// services/openaiService.js (ES Modules)
import { Configuration, OpenAIApi } from 'openai';
import config from '../config/index.js';
import { ApiError } from '../middleware/errorHandler.js';

// Initialize OpenAI configuration
const configuration = new Configuration({
  apiKey: config.openai.apiKey
});

const openai = new OpenAIApi(configuration);

/**
 * Circuit breaker implementation for OpenAI API
 */
class CircuitBreaker {
  constructor() {
    this.states = {
      CLOSED: 'CLOSED',
      OPEN: 'OPEN',
      HALF_OPEN: 'HALF_OPEN'
    };
    this.state = this.states.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.failureThreshold = 3;
    this.resetTimeout = 30000; // 30 seconds
  }

  async exec(fn, fallbackFn) {
    if (this.state === this.states.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = this.states.HALF_OPEN;
      } else {
        return await fallbackFn();
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timed out')), 
          config.openai.timeout)
        )
      ]);
      
      if (this.state === this.states.HALF_OPEN) {
        this.successCount++;
        if (this.successCount >= 2) { // After 2 successful calls, close the circuit
          this.state = this.states.CLOSED;
          this.failureCount = 0;
          this.successCount = 0;
        }
      }
      
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      if (this.failureCount >= this.failureThreshold || this.state === this.states.HALF_OPEN) {
        this.state = this.states.OPEN;
        this.successCount = 0;
      }
      
      return await fallbackFn();
    }
  }
}

const circuitBreaker = new CircuitBreaker();

/**
 * Memory-based caching mechanism
 */
const cache = new Map();

/**
 * Generates a cache key from the messages array
 */
const generateCacheKey = (messages) => {
  // Only use the user and assistant messages for the cache key
  const keyMessages = messages
    .filter(msg => ['user', 'assistant'].includes(msg.role))
    .map(msg => `${msg.role}:${msg.content}`)
    .join('|');
  
  return `openai:${keyMessages}`;
};

/**
 * Primary OpenAI chat completion function
 */
export async function getChatCompletion(messages, modelOverride = null) {
  const model = modelOverride || config.openai.model;
  
  // Check cache first
  const cacheKey = generateCacheKey(messages);
  if (cache.has(cacheKey)) {
    const cachedItem = cache.get(cacheKey);
    if (Date.now() < cachedItem.expiry) {
      console.log('OpenAI cache hit');
      return cachedItem.data;
    } else {
      cache.delete(cacheKey);
    }
  }

  // Primary function
  const primaryCall = async () => {
    try {
      const response = await openai.createChatCompletion({
        model,
        messages,
        max_tokens: config.openai.maxTokens,
        temperature: config.openai.temperature
      });
      
      const content = response.data.choices[0].message.content;
      
      // Cache the result
      cache.set(cacheKey, {
        data: content,
        expiry: Date.now() + (config.cache.openaiTtl * 1000)
      });
      
      return content;
    } catch (error) {
      console.error("Error with primary OpenAI model:", error.message);
      throw error;
    }
  };

  // Fallback function
  const fallbackCall = async () => {
    console.log("Using fallback OpenAI model");
    try {
      const fallbackModel = config.openai.fallbackModels.secondary;
      
      const response = await openai.createChatCompletion({
        model: fallbackModel,
        messages,
        max_tokens: config.openai.maxTokens,
        temperature: config.openai.temperature
      });
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("Error with fallback OpenAI model:", error.message);
      
      // Last resort fallback - use a very simple response
      return "I'm currently experiencing issues connecting to my language service. Please try again in a moment.";
    }
  };

  return circuitBreaker.exec(primaryCall, fallbackCall);
}
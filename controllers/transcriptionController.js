// controllers/transcriptionController.js
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Configuration, OpenAIApi } from 'openai';
import config from '../config/index.js';

// Initialize OpenAI configuration
const configuration = new Configuration({
  apiKey: config.openai.apiKey
});

const openai = new OpenAIApi(configuration);

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Create a temporary directory if it doesn't exist
    const tempDir = path.join(os.tmpdir(), 'ana-audio-uploads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: function(req, file, cb) {
    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure allowed file types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'audio/wav',
    'audio/mpeg',
    'audio/mp3',
    'audio/mp4',
    'audio/webm',
    'audio/ogg',
    'audio/mpeg3',
    'audio/x-mpeg-3',
    'video/webm'  // For some browsers that record WebM audio
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(`Unsupported file type: ${file.mimetype}. Supported types: wav, mp3, mp4, webm, ogg`, 400), false);
  }
};

// Create multer upload instance
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  }
});

/**
 * Function to detect language from text
 * @param {string} text - Text to analyze
 * @returns {string} - Language code ('en' or 'es')
 */
function detectLanguage(text) {
  if (!text || text.trim().length === 0) {
    return 'es'; // Default to Spanish if no text
  }

  const lowerText = text.toLowerCase();
  
  // Spanish indicators - common Spanish words and characters
  const spanishIndicators = [
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'qué', 'dónde', 'cuándo', 'cómo', 'por qué', 'quién', 'cuál',
    'y', 'pero', 'o', 'porque', 'si', 'aunque',
    'hola', 'buenos días', 'buenas tardes', 'buenas noches',
    'gracias', 'por favor', 'de nada', 'perdón', 'lo siento'
  ];
  
  // English indicators - common English words
  const englishIndicators = [
    'the', 'a', 'an', 'this', 'that', 'these', 'those',
    'what', 'where', 'when', 'how', 'why', 'who', 'which',
    'and', 'but', 'or', 'because', 'if', 'although',
    'hello', 'hi', 'good morning', 'good afternoon', 'good evening',
    'thank you', 'please', 'you\'re welcome', 'sorry'
  ];
  
  // Count matches for each language
  let spanishScore = 0;
  let englishScore = 0;
  
  // Check for Spanish words
  spanishIndicators.forEach(word => {
    if (lowerText.includes(` ${word} `) || 
        lowerText.startsWith(`${word} `) || 
        lowerText === word || 
        lowerText.endsWith(` ${word}`)) {
      spanishScore++;
    }
  });
  
  // Check for English words
  englishIndicators.forEach(word => {
    if (lowerText.includes(` ${word} `) || 
        lowerText.startsWith(`${word} `) || 
        lowerText === word || 
        lowerText.endsWith(` ${word}`)) {
      englishScore++;
    }
  });
  
  // Check for Spanish-specific characters
  ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ', '¿', '¡'].forEach(char => {
    if (lowerText.includes(char)) {
      spanishScore += 2; // Give extra weight to Spanish-specific characters
    }
  });
  
  // If scores are equal, default to Spanish
  return englishScore > spanishScore ? 'en' : 'es';
}

/**
 * Transcribes audio to text using OpenAI Whisper API
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const transcribeAudio = asyncHandler(async (req, res) => {
  // Check if file exists
  if (!req.file) {
    throw new ApiError('No audio file uploaded', 400);
  }

  try {
    console.log(`Transcribing audio file: ${req.file.path}`);
    
    // First attempt: Use OpenAI's automatic language detection
    // This is more reliable because Whisper can detect language from audio patterns
    const transcript = await openai.createTranscription(
      fs.createReadStream(req.file.path),
      'whisper-1',  // Model to use
      undefined,    // Prompt
      'text',       // Response format
      1.0,          // Temperature
      undefined     // Auto-detect language
    );
    
    // Extract the transcribed text
    const transcribedText = transcript.data;
    
    // Detect language from transcribed text
    const detectedLanguage = detectLanguage(transcribedText);
    
    console.log(`Transcription complete. Text: "${transcribedText.substring(0, 50)}..." Detected language: ${detectedLanguage}`);
    
    // Return transcribed text and detected language
    return res.status(200).json({
      success: true,
      text: transcribedText,
      language: detectedLanguage
    });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    
    // Try fallback approach if first attempt fails
    try {
      console.log('Trying fallback transcription with language hint...');
      
      // Try with explicit language hint (Spanish as default)
      const fallbackTranscript = await openai.createTranscription(
        fs.createReadStream(req.file.path),
        'whisper-1',
        undefined,
        'text',
        1.0,
        'es'  // Force Spanish as hint
      );
      
      const fallbackText = fallbackTranscript.data;
      // Detect language from transcribed text
      const fallbackLanguage = detectLanguage(fallbackText);
      
      console.log(`Fallback transcription complete. Text: "${fallbackText.substring(0, 50)}..."`);
      
      return res.status(200).json({
        success: true,
        text: fallbackText,
        language: fallbackLanguage
      });
    } catch (fallbackError) {
      console.error('Fallback transcription also failed:', fallbackError);
      throw new ApiError(`Error transcribing audio: ${error.message}`, 500);
    }
  } finally {
    // Clean up - remove uploaded file after processing
    try {
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
        console.log(`Temporary file ${req.file.path} deleted`);
      }
    } catch (err) {
      console.error('Error deleting temporary file:', err);
    }
  }
});

/**
 * Fallback handler for cases where transcription service might be unavailable
 * Returns a simple acknowledgment with empty text
 */
export const fallbackTranscription = asyncHandler(async (req, res) => {
  console.log('Using simple fallback transcription handler');
  
  // Check if there's any audio data at all
  if (!req.file && !req.body.audio) {
    return res.status(200).json({
      success: false,
      text: "",
      language: "es",
      message: "No audio data received"
    });
  }
  
  return res.status(200).json({
    success: true,
    text: "",
    language: "es", // Default to Spanish as fallback
    message: "Transcription service currently unavailable"
  });
});
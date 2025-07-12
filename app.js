// app.js (ES Modules)
import express from 'express';
import cors from 'cors';
import { 
  handleChatRequest, 
  getConversationState, 
  resetConversation, 
  getConversationStats 
} from './controllers/chatController.js';
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/errorHandler.js';
import { requestLogger, errorLogger } from './middleware/logger.js';
import config from './config/index.js';
import { transcribeAudio, upload, fallbackTranscription } from './controllers/transcriptionController.js';
// Importar el controlador de geolocalización
import { handleProximityQuery } from './controllers/geolocationController.js';
// Importar el controlador de reportes
import { getReportsStats } from './controllers/reportController.js';

const app = express();

// Configure CORS with the allowed origins from config
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || config.server.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware for parsing JSON bodies with size limit
app.use(express.json({ limit: '1mb' }));

// Request logging middleware
app.use(requestLogger);

// 🚨 Middleware CORS para producción
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://frontend-ana-map-puce.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Ruta raíz GET para información básica de la API
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Ana-IA Tourism API',
    description: 'Chatbot API de turismo para Colombia',
    version: '1.1.0',
    documentation: '/api-docs'
  });
});

// Ruta raíz POST - redirige al endpoint de chat
app.post('/', (req, res) => {
  handleChatRequest(req, res);
});

// Endpoint /api para compatibilidad con el frontend existente
app.post('/api', (req, res) => {
  handleChatRequest(req, res);
});

// Endpoint /api/chat para compatibilidad con algunos frontends
app.post('/api/chat', (req, res) => {
  handleChatRequest(req, res);
});

// Endpoint /chat también para compatibilidad
app.post('/chat', (req, res) => {
  handleChatRequest(req, res);
});

// New transcription endpoint
app.post('/api/transcribe', upload.single('audio'), transcribeAudio);

// Fallback transcription endpoint (simpler with fewer dependencies)
app.post('/api/transcribe-fallback', fallbackTranscription);

// Nuevo endpoint específico para búsquedas georreferenciadas
app.post('/api/nearby', asyncHandler(async (req, res) => {
  const { location, placeType = 'restaurant', language = 'es', radius } = req.body;
  
  if (!location) {
    return res.status(400).json({
      success: false,
      error: language === 'es' 
        ? 'Se requiere la ubicación para búsquedas cercanas'
        : 'Location is required for nearby searches'
    });
  }
  
  console.log('🎯 Endpoint de búsqueda cercana:', { location, placeType, language, radius });
  
  // Simular análisis de consulta para el controlador
  const mockQueryAnalysis = {
    businessCategory: placeType,
    city: null,
    intents: ['location']
  };
  
  const result = await handleProximityQuery(
    `${placeType} cerca de mí`, // Mensaje simulado
    location,
    language,
    mockQueryAnalysis
  );
  
  if (result.success) {
    return res.status(200).json({
      success: true,
      places: result.places,
      searchParams: result.searchParams,
      message: result.responseText
    });
  } else {
    return res.status(400).json({
      success: false,
      error: result.error,
      requiresLocation: result.requiresLocation || false
    });
  }
}));

// API health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.server.environment,
    version: '1.1.0'
  });
});

// Endpoint para estadísticas de reportes
app.get('/api/reports/stats', asyncHandler(async (req, res) => {
  const stats = getReportsStats();
  
  res.status(200).json({
    success: true,
    stats: stats,
    message: 'Estadísticas de reportes obtenidas exitosamente'
  });
}));

// Nuevos endpoints para la arquitectura conversacional
app.get('/api/conversation/:sessionId/state', getConversationState);
app.delete('/api/conversation/:sessionId', resetConversation);
app.get('/api/conversation/stats', getConversationStats);

// API documentation route
app.get('/api-docs', (req, res) => {
  res.status(200).json({
    name: 'Ana-IA Tourism API',
    description: 'Tourism chatbot API for Colombia with enhanced geolocation features',
    version: '1.2.0',
    endpoints: [
      {
        path: '/chat',
        method: 'POST',
        description: 'Send a message to the chatbot with enhanced location support',
        parameters: {
          message: 'User message (required)',
          sessionId: 'Unique session identifier (optional)',
          language: 'Preferred language: en/es (optional)',
          location: 'User coordinates {lat, lng} for location-based searches (optional)'
        }
      },
      {
        path: '/',
        method: 'POST',
        description: 'Alias to /chat endpoint',
        parameters: {
          message: 'User message (required)',
          sessionId: 'Unique session identifier (optional)',
          language: 'Preferred language: en/es (optional)'
        }
      },
      {
        path: '/api',
        method: 'POST',
        description: 'Alias to /chat endpoint',
        parameters: {
          message: 'User message (required)',
          sessionId: 'Unique session identifier (optional)',
          language: 'Preferred language: en/es (optional)'
        }
      },
      {
        path: '/api/transcribe',
        method: 'POST',
        description: 'Transcribe audio to text',
        parameters: {
          audio: 'Audio file (required)',
          language: 'Preferred language: en/es (optional)'
        }
      },
      {
        path: '/api/nearby',
        method: 'POST',
        description: 'Find places near user location (optimized for proximity searches)',
        parameters: {
          location: 'User coordinates {lat, lng} (required)',
          placeType: 'Type of place: hotel, restaurant, bar, museum, attraction, etc. (optional, default: restaurant)',
          language: 'Response language: en/es (optional, default: es)',
          radius: 'Search radius in meters (optional, uses intelligent radius based on place type)'
        }
      },
      {
        path: '/health',
        method: 'GET',
        description: 'Check API health status'
      },
      {
        path: '/api/reports/stats',
        method: 'GET',
        description: 'Get tourism incident reports statistics',
        response: {
          total: 'Total number of reports',
          withConsent: 'Reports with consent to send to authorities',
          cities: 'Number of different cities with reports',
          languages: 'Number of different languages used',
          recentReports: 'Last 5 reports (anonymized)'
        }
      },
      {
        path: '/api/conversation/:sessionId/state',
        method: 'GET',
        description: 'Get the current state of the conversation for a session',
        parameters: {
          sessionId: 'Unique session identifier (required)'
        }
      },
      {
        path: '/api/conversation/:sessionId',
        method: 'DELETE',
        description: 'Reset the conversation for a session',
        parameters: {
          sessionId: 'Unique session identifier (required)'
        }
      },
      {
        path: '/api/conversation/stats',
        method: 'GET',
        description: 'Get statistics about conversations',
        response: {
          totalConversations: 'Total number of conversations',
          activeConversations: 'Number of active conversations',
          completedConversations: 'Number of completed conversations',
          abandonedConversations: 'Number of abandoned conversations'
        }
      }
    ]
  });
});

// Chat endpoint - la ruta original
app.post('/chat', handleChatRequest);

// Handle 404 Not Found
app.use(notFoundHandler);

// Error logging middleware
app.use(errorLogger);

// Global error handler
app.use(errorHandler);

// Start the server
const PORT = config.server.port;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${config.server.environment}`);
  console.log(`API documentation available at http://localhost:${PORT}/api-docs`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process here, let it continue running
});
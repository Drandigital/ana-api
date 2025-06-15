// app.js (ES Modules)
import express from 'express';
import cors from 'cors';
import { handleChatRequest } from './controllers/chatController.js';
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/errorHandler.js';
import { requestLogger, errorLogger } from './middleware/logger.js';
import config from './config/index.js';
import { transcribeAudio, upload, fallbackTranscription } from './controllers/transcriptionController.js';

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

// New transcription endpoint
app.post('/api/transcribe', upload.single('audio'), transcribeAudio);

// Fallback transcription endpoint (simpler with fewer dependencies)
app.post('/api/transcribe-fallback', fallbackTranscription);

// API health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.server.environment,
    version: '1.1.0'
  });
});

// API documentation route
app.get('/api-docs', (req, res) => {
  res.status(200).json({
    name: 'Ana-IA Tourism API',
    description: 'Tourism chatbot API for Colombia',
    version: '1.1.0',
    endpoints: [
      {
        path: '/chat',
        method: 'POST',
        description: 'Send a message to the chatbot',
        parameters: {
          message: 'User message (required)',
          sessionId: 'Unique session identifier (optional)',
          language: 'Preferred language: en/es (optional)'
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
        path: '/health',
        method: 'GET',
        description: 'Check API health status'
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
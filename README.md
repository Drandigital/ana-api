# Ana-IA: Colombia Tourism Chatbot API

Ana-IA is an intelligent chatbot API specifically designed to provide information about tourism in Colombia. Leveraging OpenAI's language models with **enhanced geolocation capabilities**, this API offers accurate and helpful responses to user queries about destinations, attractions, accommodations, flights, and more.

## 🚀 New Features v1.2.0

- **🎯 Intelligent Geolocation**: Advanced proximity-based searches with smart radius detection
- **📍 Location-Aware Responses**: Automatic detection of "near me" queries with contextual recommendations
- **🏆 Premium Business Integration**: Prioritized recommendations for verified partners
- **⚡ Optimized Performance**: Enhanced caching and response times for location queries
- **🌐 Smart City Detection**: Automatic city determination from coordinates

## Features

- **Tourism Information**: Comprehensive knowledge about Colombian tourism destinations, attractions, culture, and history
- **🎯 Enhanced Geolocation**: Precise proximity searches with intelligent radius calculation
- **Multi-language Support**: Automatic language detection and responses in both English and Spanish
- **Weather Data**: Real-time weather information for Colombian cities
- **Flight Search**: Integration with Amadeus API for flight search capabilities
- **Places Discovery**: Discover hotels, restaurants, attractions, and more with detailed information
- **Priority System**: Premium content prioritization for sponsored locations and services
- **Robust Error Handling**: Comprehensive error management with informative messages
- **Caching System**: Performance optimization through intelligent caching of API responses

## 🎯 Geolocation Features

### Proximity Search
Ana-IA now supports intelligent proximity-based searches that understand natural language queries like:
- "Hoteles cerca de mí" / "Hotels near me"
- "Restaurantes cercanos" / "Nearby restaurants"
- "¿Qué hay para hacer aquí cerca?" / "What's there to do around here?"

### Smart Radius Detection
The API automatically determines optimal search radii based on:
- **Place Type**: Hotels get wider search radius than cafés
- **Urban Density**: Different radii for Bogotá vs. smaller cities
- **Query Intent**: "Walking distance" vs. "in the city"

### Location-Aware Features
- **City Detection**: Automatically determines nearest Colombian city from coordinates
- **Distance Calculation**: Precise Haversine distance calculations
- **Premium Prioritization**: Premium businesses shown first, then sorted by distance
- **Multi-source Results**: Combines Google Places data with premium partner listings

### API Endpoints

#### Enhanced Chat Endpoint
```http
POST /chat
Content-Type: application/json

{
  "message": "Hoteles cerca de mi ubicación",
  "location": {
    "lat": 10.4236,
    "lng": -75.5518
  },
  "language": "es",
  "sessionId": "user-session-123"
}
```

#### Dedicated Proximity Search
```http
POST /api/nearby
Content-Type: application/json

{
  "location": {
    "lat": 10.4236,
    "lng": -75.5518
  },
  "placeType": "restaurant",
  "language": "es",
  "radius": 2000
}
```

### Response Format
```json
{
  "success": true,
  "places": [
    {
      "name": "Hotel Boutique",
      "location": {"lat": 10.423, "lng": -75.551},
      "distance": 0.3,
      "distance_text": "300m",
      "rating": 4.7,
      "isPremium": true,
      "isVerified": true,
      "formatted_address": "Calle 123 #45-67, Cartagena",
      "source": "premium"
    }
  ],
  "searchParams": {
    "radius": 2000,
    "resultsCount": 5
  }
}
```

## Architecture

The API is structured around a modern, modular architecture:

1. **Presentation Layer**: Express.js RESTful API endpoints
2. **Orchestration Layer**: Controllers that coordinate request processing
3. **Data Layer**: In-memory data structures (could be extended to databases)
4. **Intelligence Layer**: OpenAI integration with fallback mechanisms
5. **External Services Layer**: Weather, flights, and places integrations

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- API keys for:
  - OpenAI
  - Amadeus (for flight search)
  - OpenWeatherMap (for weather data)
  - Google Maps (for places data)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ana-ia.git
cd ana-ia
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
NODE_ENV=development

# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-3.5-turbo

# Amadeus
AMADEUS_API_KEY=your_amadeus_api_key
AMADEUS_API_SECRET=your_amadeus_api_secret
AMADEUS_ENVIRONMENT=test  # Use 'production' for production

# External APIs
WEATHER_API_KEY=your_openweather_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

4. Start the development server:
```bash
npm run dev
```

### API Endpoints

#### Chat Endpoint
```
POST /chat
```

Request body:
```json
{
  "message": "What are the best beaches in Cartagena?",
  "sessionId": "unique-session-id",
  "language": "en"  // Optional, will auto-detect if not provided
}
```

Response:
```json
{
  "response": "Cartagena has several beautiful beaches...",
  "places": [
    {
      "name": "Playa Blanca",
      "address": "Isla Barú, Cartagena",
      "rating": 4.5,
      "location": {
        "lat": 10.2346,
        "lng": -75.5847
      }
    },
    // More places...
  ],
  "sessionId": "unique-session-id"
}
```

#### Health Check
```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-03-01T12:34:56.789Z",
  "environment": "development"
}
```

## Development

### Project Structure

```
ana-ia/
├── app.js                  # Entry point
├── config/                 # Configuration files
│   ├── index.js            # Main configuration
│   ├── airportCodes.js     # IATA airport codes
│   └── openaiConfig.js     # OpenAI configuration
├── controllers/            # Request handlers
│   └── chatController.js   # Chat endpoint controller
├── middleware/             # Express middleware
│   └── errorHandler.js     # Error handling middleware
├── services/               # External service integrations
│   ├── amadeusFlightService.js  # Flight search
│   ├── externalApiService.js    # Weather and places
│   └── openaiService.js         # OpenAI integration
├── utils/                  # Utility functions
│   ├── dateParser.js       # Date parsing utilities
│   ├── detectLanguage.js   # Language detection
│   └── validateTourismQuery.js  # Query validation
└── README.md               # Documentation
```

### Available Scripts

- `npm start`: Start the production server
- `npm run dev`: Start the development server with hot reload

## Deployment

The API is ready for deployment on Vercel using the included `vercel.json` configuration.

## Roadmap

Future enhancements planned for Ana-IA include:

### Short-term goals
1. **Database Integration**: Replace in-memory storage with MongoDB or PostgreSQL for conversation history and user preferences
2. **Advanced Caching**: Implement Redis for distributed caching of API responses
3. **User Authentication**: Add user accounts and personalized recommendations
4. **Analytics Dashboard**: Create an admin interface to monitor usage and popular queries

### Medium-term goals
1. **Voice Recognition**: Integrate speech-to-text capabilities for voice input
2. **Geospatial Features**: Implement PostGIS for precise location-based recommendations
3. **Recommendation Engine**: Add personalized suggestions based on user preferences
4. **Expanded External APIs**: Integrate with more tourism services (hotels, car rentals, etc.)
5. **Multi-channel Deployment**: WhatsApp, Telegram, and Facebook Messenger integrations

### Long-term goals
1. **AI Model Fine-tuning**: Train a specialized model for Colombian tourism data
2. **Multilingual Support**: Expand to additional languages beyond Spanish and English
3. **AR/VR Integration**: Connect with augmented reality experiences for virtual tours
4. **IoT Connectivity**: Enable integration with smart hotel systems and tourism kiosks

## Circuit Breaker Pattern

Ana-IA implements the circuit breaker pattern for resilient integrations with external services, especially the OpenAI API:

```
    [Client] ---> [Circuit Breaker] ---> [External Service]
       ^                 |
       |                 v
       +--- [Fallback Service] 
```

This pattern:
- Prevents cascading failures when external services are down
- Enables graceful degradation with fallback responses
- Automatically recovers when services return to normal

## Contribution Guidelines

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please ensure your code follows the project's coding style and includes appropriate tests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with inspiration from the Colombia Tourism Board
- Uses OpenAI's GPT models for natural language understanding
- Integrates with Amadeus for real-time flight data
- Weather data provided by OpenWeatherMap
- Places information powered by Google Maps Platform

## 🧪 Testing Geolocation Features

### Quick Test Script
Run the included test script to verify geolocation functionality:

```bash
# Install dependencies if not already installed
npm install

# Run the geolocation test suite
node test-geolocation.js
```

### Manual Testing Examples

#### Test proximity search in Cartagena:
```bash
curl -X POST http://localhost:3000/api/nearby \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"lat": 10.4236, "lng": -75.5518},
    "placeType": "restaurant",
    "language": "es",
    "radius": 1500
  }'
```

#### Test chat with location:
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Necesito un hotel cerca de aquí",
    "location": {"lat": 10.4236, "lng": -75.5518},
    "language": "es"
  }'
```

### Supported Place Types
- `hotel`, `lodging` - Hotels and accommodations
- `restaurant`, `food` - Restaurants and dining
- `bar`, `pub` - Bars and nightlife
- `museum` - Museums and galleries
- `attraction`, `tourist_attraction` - Tourist attractions
- `beach`, `playa` - Beaches and coastal areas
- `park`, `parque` - Parks and recreational areas

### Location Validation
- Coordinates must be within Colombia (approximately)
- Latitude: 12°N to -4°S
- Longitude: -66°W to -82°W
- Invalid coordinates return helpful error messages
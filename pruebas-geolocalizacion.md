# Pruebas de Geolocalización - Ana-IA API

Este archivo contiene ejemplos de pruebas para verificar las funcionalidades de geolocalización optimizadas.

## ⚡ CONFIGURACIÓN ACTUAL: RADIO FIJO 5KM

**IMPORTANTE**: Todas las búsquedas basadas en ubicación del navegador del usuario utilizan un **radio fijo de 5 kilómetros**. Esto asegura:
- Resultados consistentes y predecibles
- Búsquedas rápidas y eficientes
- Cobertura adecuada para contextos urbanos
- Experiencia de usuario uniforme

## Configuración de Pruebas

### Variables de entorno necesarias:
- OPENAI_API_KEY
- GOOGLE_MAPS_API_KEY
- AMADEUS_API_KEY
- AMADEUS_API_SECRET

## Pruebas de Endpoints

### 1. Búsqueda de Lugares Cercanos

#### Prueba 1: Restaurantes cerca del Centro Histórico de Cartagena
```http
POST http://localhost:3000/api/nearby
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

#### Prueba 2: Hoteles cerca de Zona Rosa, Bogotá (Radio 5km automático)
```http
POST http://localhost:3000/api/nearby
Content-Type: application/json

{
  "location": {
    "lat": 4.6560,
    "lng": -74.1076
  },
  "placeType": "hotel",
  "language": "es"
}
```
**Nota**: No se especifica radius ya que el sistema usa automáticamente 5km cuando detecta consultas basadas en ubicación del navegador.

#### Prueba 3: Bares cerca de El Poblado, Medellín
```http
POST http://localhost:3000/api/nearby
Content-Type: application/json

{
  "location": {
    "lat": 6.2087,
    "lng": -75.5719
  },
  "placeType": "bar",
  "language": "es",
  "radius": 1500
}
```

### 2. Chat con Geolocalización

#### Prueba 4: "Hoteles cerca de mí" (Cartagena)
```http
POST http://localhost:3000/chat
Content-Type: application/json

{
  "message": "Necesito un hotel cerca de mi ubicación",
  "location": {
    "lat": 10.4236,
    "lng": -75.5518
  },
  "language": "es",
  "sessionId": "test-geo-001"
}
```

#### Prueba 5: "Restaurantes cercanos" (Bogotá)
```http
POST http://localhost:3000/chat
Content-Type: application/json

{
  "message": "¿Qué restaurantes hay cerca de aquí?",
  "location": {
    "lat": 4.6560,
    "lng": -74.1076
  },
  "language": "es",
  "sessionId": "test-geo-002"
}
```

#### Prueba 6: "Museums near me" (English)
```http
POST http://localhost:3000/chat
Content-Type: application/json

{
  "message": "Show me museums near my location",
  "location": {
    "lat": 10.4236,
    "lng": -75.5518
  },
  "language": "en",
  "sessionId": "test-geo-003"
}
```

### 3. Pruebas de Validación de Ubicación

#### Prueba 7: Ubicación inválida (fuera de Colombia)
```http
POST http://localhost:3000/api/nearby
Content-Type: application/json

{
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "placeType": "restaurant",
  "language": "es"
}
```

#### Prueba 8: Coordenadas malformadas
```http
POST http://localhost:3000/api/nearby
Content-Type: application/json

{
  "location": {
    "lat": "invalid",
    "lng": -75.5518
  },
  "placeType": "restaurant",
  "language": "es"
}
```

### 5. Pruebas de Ubicación Actual

#### Prueba 11: Consulta directa de ubicación actual
```http
POST http://localhost:3000/chat
Content-Type: application/json

{
  "message": "¿Cuál es mi ubicación actual?",
  "location": {
    "lat": 10.4236,
    "lng": -75.5518
  },
  "language": "es",
  "sessionId": "test-current-location"
}
```
**Resultado esperado**: Respuesta directa indicando que el usuario está en Cartagena con coordenadas específicas.

#### Prueba 12: Consulta de ubicación en inglés
```http
POST http://localhost:3000/chat
Content-Type: application/json

{
  "message": "Where am I?",
  "location": {
    "lat": 4.6560,
    "lng": -74.1076
  },
  "language": "en",
  "sessionId": "test-location-en"
}
```

### 6. Pruebas de Consultas de Clima

#### Prueba 13: Clima basado en ubicación actual
```http
POST http://localhost:3000/chat
Content-Type: application/json

{
  "message": "¿Qué clima hace?",
  "location": {
    "lat": 10.4236,
    "lng": -75.5518
  },
  "language": "es",
  "sessionId": "test-weather-current"
}
```
**Resultado esperado**: Información del clima en Cartagena basada en la ubicación del usuario.

#### Prueba 14: Clima de ciudad específica
```http
POST http://localhost:3000/chat
Content-Type: application/json

{
  "message": "¿Cómo está el tiempo en Bogotá?",
  "location": {
    "lat": 10.4236,
    "lng": -75.5518
  },
  "language": "es",
  "sessionId": "test-weather-city"
}
```

### 7. Pruebas de Búsqueda Cross-Ciudad

#### Prueba 15: Usuario en Cartagena buscando en Bogotá
```http
POST http://localhost:3000/chat
Content-Type: application/json

{
  "message": "¿Qué hoteles hay en Bogotá?",
  "location": {
    "lat": 10.4236,
    "lng": -75.5518
  },
  "language": "es",
  "sessionId": "test-cross-city-search"
}
```
**Resultado esperado**: Hoteles en Bogotá, con negocios premium/verificados primero.

#### Prueba 16: Usuario en Bogotá buscando en Cartagena
```http
POST http://localhost:3000/chat
Content-Type: application/json

{
  "message": "Restaurantes en Cartagena",
  "location": {
    "lat": 4.6560,
    "lng": -74.1076
  },
  "language": "es",
  "sessionId": "test-bogota-to-cartagena"
}
```

### 8. Pruebas de Priorización Premium

#### Prueba 17: Verificar orden de resultados premium
```http
POST http://localhost:3000/chat
Content-Type: application/json

{
  "message": "Hoteles cerca de mí",
  "location": {
    "lat": 10.4236,
    "lng": -75.5518
  },
  "language": "es",
  "sessionId": "test-premium-priority"
}
```
**Resultado esperado**: 
- Los primeros lugares deben tener `isPremium: true` o `isVerified: true`
- `priority: 1` para premium, `priority: 2` para aliados, `priority: 3` para Google
- Lugares ordenados por prioridad y luego por distancia

## Resultados Esperados

### Para búsquedas exitosas (Radio fijo 5km):
- `success: true`
- Array de `places` con datos de ubicación
- **NEGOCIOS PREMIUM PRIMERO**: Los primeros resultados siempre deben ser `isPremium: true` o `isVerified: true`
- `priority: 1` para premium, `priority: 2` para aliados, `priority: 3` para Google Places
- Cada lugar debe tener `distance` y `distance_text`
- `searchRadius: 5000` (5km en metros) para búsquedas de proximidad
- Lugares ordenados por prioridad, luego por distancia
- Respuesta debe mencionar "dentro de 5km de tu ubicación" para proximidad

### Para consultas de ubicación actual:
- `searchType: "location_info"`
- `response` con ciudad detectada y coordenadas
- `currentCity` con nombre de la ciudad
- `userLocation` con coordenadas exactas

### Para consultas de clima:
- Información meteorológica de la ciudad actual o especificada
- Temperatura, humedad, viento, condiciones
- Basado en ubicación del usuario si no se especifica ciudad

### Para búsquedas cross-ciudad:
- `searchType: "city_specific"` 
- Resultados de la ciudad mencionada, no de la ubicación del usuario
- Negocios premium de la ciudad objetivo aparecen primero
- Respuesta contextual mencionando la ciudad objetivo

### Para errores de ubicación:
- `success: false`
- `error` descriptivo
- `requiresLocation: true` si es aplicable

## Comportamiento de Priorización

### Orden de resultados SIEMPRE:
1. **Negocios Premium** (`isPremium: true`, `priority: 1`) - Socios principales
2. **Negocios Aliados** (`isVerified: true`, `priority: 2`) - Socios verificados
3. **Google Places** (`isPremium: false`, `priority: 3`) - Resultados públicos

### Dentro de cada categoría:
- Ordenar por distancia (más cercano primero)
- Mantener relevancia por tipo de negocio
- Incluir información completa (rating, dirección, teléfono, etc.)

## Métricas de Rendimiento

### Objetivos con radio fijo 5km:
- Respuesta < 2 segundos para búsquedas cercanas
- Respuesta < 3 segundos para chat con geolocalización
- Cache hit rate > 60% para búsquedas similares
- Resultados consistentes independiente del tipo de lugar

### Logging esperado:
- `🎯 Detectada consulta de proximidad - Búsqueda en radio de 5km`
- `📍 Búsqueda: tipo=X, radio=5000m (5km) desde lat, lng`
- `✅ Encontrados X lugares`
- `🔧 Procesando X lugares`

## Casos de Prueba Especiales

### Casos límite:
1. Usuario en frontera de ciudad
2. Múltiples ciudades cerca
3. Área con pocos negocios
4. Búsqueda en zona rural

### Tipos de lugares soportados:
- hotel, lodging
- restaurant, food
- bar, pub
- museum
- attraction, tourist_attraction
- beach, playa
- park, parque

## Validación de Datos

### Estructura de respuesta de lugar:
```json
{
  "name": "Nombre del lugar",
  "location": {"lat": 10.123, "lng": -75.456},
  "distance": 1.2,
  "distance_text": "1.2km",
  "rating": 4.5,
  "isPremium": true,
  "isVerified": true,
  "formatted_address": "Dirección completa",
  "source": "premium" | "google"
}
```

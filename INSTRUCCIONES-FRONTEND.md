# 📱 INSTRUCCIONES PARA FRONTEND - FUNCIONALIDADES EN TIEMPO REAL

## 🚀 Resumen de Nuevas Funcionalidades

Se han implementado **funcionalidades de búsqueda en tiempo real y proximidad** en Ana API. El frontend debe actualizarse para aprovechar completamente estas nuevas capacidades.

## 🎯 Cambios en la Respuesta de la API

### **Nuevos Campos en la Respuesta:**

```json
{
  "response": "Respuesta del chatbot...",
  "places": [...], // Array de lugares (existente)
  
  // 🆕 NUEVOS CAMPOS PARA TIEMPO REAL
  "realTimeContext": {
    "message": "🕒 RESULTADOS EN TIEMPO REAL - Encontré 6 restaurantes disponibles cerca de ti ahora mismo.",
    "urgency": "medium", // "low", "medium", "high"
    "optimizations": {
      "realTime": true,
      "proximity": true
    }
  },
  
  // 🆕 METADATOS EXTENDIDOS
  "searchMetadata": {
    "searchType": "real_time_proximity", // Nuevo tipo
    "category": "restaurants", // hotels, bars, museums, tourist_attractions, etc.
    "urgency": "medium",
    "openNow": true, // Si se aplicó filtro de "abierto ahora"
    "is_real_time_search": true, // Flag principal
    "optimization_applied": true,
    "geo_search": true,
    "total_found": 6,
    "search_radius": 2000 // Radio usado en metros
  },
  
  // 🆕 METADATOS EN LUGARES
  "places": [
    {
      "place_id": "...",
      "name": "...",
      // ... campos existentes ...
      
      // 🆕 NUEVOS CAMPOS PARA TIEMPO REAL
      "openNow": true, // Si está abierto actualmente
      "isRealTimeOptimized": true, // Si fue optimizado para tiempo real
      "urgencyLevel": "medium", // Nivel de urgencia de la búsqueda
      "distance_formatted": "300m" // Distancia formateada
    }
  ]
}
```

## 🎨 Recomendaciones de UI/UX

### **1. 🕒 Indicador de Tiempo Real**

Cuando `realTimeContext` esté presente, mostrar un indicador especial:

```jsx
// Ejemplo React
{data.realTimeContext && (
  <div className="real-time-banner">
    <span className="real-time-icon">🕒</span>
    <span className="real-time-text">RESULTADOS EN TIEMPO REAL</span>
    {data.realTimeContext.urgency === 'high' && (
      <span className="urgency-high">⚡ URGENTE</span>
    )}
  </div>
)}
```

### **2. ⚡ Badges de Urgencia**

```jsx
const getUrgencyBadge = (urgency) => {
  switch(urgency) {
    case 'high': return <Badge color="red">⚡ URGENTE</Badge>;
    case 'medium': return <Badge color="orange">🕒 AHORA</Badge>;
    case 'low': return <Badge color="blue">📍 CERCA</Badge>;
    default: return null;
  }
};
```

### **3. 🔴 Indicador "Abierto Ahora"**

Para lugares con `openNow: true`:

```jsx
{place.openNow && (
  <span className="open-now-indicator">
    🟢 Abierto ahora
  </span>
)}
```

### **4. 📊 Metadatos de Búsqueda**

Mostrar información contextual de la búsqueda:

```jsx
{data.searchMetadata?.is_real_time_search && (
  <div className="search-info">
    <span>📍 Radio: {data.searchMetadata.search_radius/1000}km</span>
    <span>📊 Categoría: {data.searchMetadata.category}</span>
    {data.searchMetadata.openNow && (
      <span>🕒 Solo lugares abiertos</span>
    )}
  </div>
)}
```

## 🎭 Sugerencias de Frases para UI

### **Textos Contextuales por Urgencia:**

```javascript
const getContextualMessage = (realTimeContext) => {
  if (!realTimeContext) return '';
  
  const messages = {
    high: {
      es: "⚡ Resultados urgentes encontrados",
      en: "⚡ Urgent results found"
    },
    medium: {
      es: "🕒 Resultados en tiempo real",
      en: "🕒 Real-time results"
    },
    low: {
      es: "📍 Lugares cerca de ti",
      en: "📍 Places near you"
    }
  };
  
  return messages[realTimeContext.urgency]?.es || '';
};
```

### **Placeholders para Input de Búsqueda:**

```javascript
const realTimePlaceholders = [
  "¿Qué restaurantes están abiertos cerca de mí?",
  "¿Dónde puedo almorzar ahora?",
  "¿Qué bares están abiertos esta noche?",
  "¿Qué museos puedo visitar hoy?",
  "¿Dónde puedo tomar café cerca de aquí?"
];
```

## 🔄 Flujo de Integración

### **1. Detectar Respuestas de Tiempo Real**

```javascript
const isRealTimeResponse = (response) => {
  return response.realTimeContext || 
         response.searchMetadata?.is_real_time_search;
};
```

### **2. Renderizado Condicional**

```jsx
const ChatResponse = ({ data }) => {
  const isRealTime = isRealTimeResponse(data);
  
  return (
    <div className={`chat-response ${isRealTime ? 'real-time' : ''}`}>
      {/* Banner de tiempo real */}
      {isRealTime && <RealTimeBanner context={data.realTimeContext} />}
      
      {/* Respuesta del chatbot */}
      <div className="bot-message">{data.response}</div>
      
      {/* Lista de lugares con indicadores especiales */}
      {data.places && (
        <PlacesList 
          places={data.places} 
          isRealTime={isRealTime}
          metadata={data.searchMetadata}
        />
      )}
    </div>
  );
};
```

### **3. Componente de Lugar Optimizado**

```jsx
const PlaceCard = ({ place, isRealTime }) => {
  return (
    <div className="place-card">
      {/* Badges especiales para tiempo real */}
      <div className="place-badges">
        {place.openNow && <Badge>🟢 Abierto</Badge>}
        {place.isRealTimeOptimized && <Badge>⚡ Optimizado</Badge>}
        {place.isPremium && <Badge>⭐ Premium</Badge>}
      </div>
      
      <h3>{place.name}</h3>
      <p>{place.address}</p>
      
      {/* Distancia destacada para tiempo real */}
      {isRealTime && place.distance_formatted && (
        <div className="distance-highlight">
          📍 {place.distance_formatted}
        </div>
      )}
      
      {/* Rating y teléfono */}
      <div className="place-info">
        {place.rating && <span>⭐ {place.rating}</span>}
        {place.phone && <span>📞 {place.phone}</span>}
      </div>
    </div>
  );
};
```

## 🎨 Estilos CSS Sugeridos

```css
/* Banner de tiempo real */
.real-time-banner {
  background: linear-gradient(90deg, #ff6b6b, #ffa726);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  animation: pulse 2s infinite;
}

/* Indicador de urgencia */
.urgency-high {
  background: #ff4757;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: bold;
}

/* Indicador "abierto ahora" */
.open-now-indicator {
  background: #2ed573;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8em;
}

/* Distancia destacada */
.distance-highlight {
  background: #3742fa;
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 0.9em;
}

/* Animación para tiempo real */
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.8; }
  100% { opacity: 1; }
}
```

## 📱 Mejoras de UX Recomendadas

### **1. 🔄 Auto-refresh para Tiempo Real**

```javascript
// Auto-refresh cada 5 minutos para búsquedas en tiempo real
const useRealTimeRefresh = (isRealTime, searchFunction) => {
  useEffect(() => {
    if (!isRealTime) return;
    
    const interval = setInterval(() => {
      searchFunction(); // Re-ejecutar búsqueda
    }, 5 * 60 * 1000); // 5 minutos
    
    return () => clearInterval(interval);
  }, [isRealTime, searchFunction]);
};
```

### **2. 📍 Sugerencias Contextuales**

```javascript
const getContextualSuggestions = (category, urgency) => {
  const suggestions = {
    restaurants: {
      high: ["¿Hay delivery disponible?", "¿Cuál está más cerca?"],
      medium: ["¿Tienen mesa disponible?", "¿Cuál tiene mejor rating?"]
    },
    bars: {
      high: ["¿Cuál tiene mejor ambiente?", "¿Hay música en vivo?"],
      medium: ["¿Tienen terraza?", "¿Hasta qué hora abren?"]
    }
  };
  
  return suggestions[category]?.[urgency] || [];
};
```

### **3. 🗺️ Integración con Mapa**

```javascript
// Destacar lugares de tiempo real en el mapa
const MapMarker = ({ place, isRealTime }) => {
  const markerColor = isRealTime ? '#ff6b6b' : '#3742fa';
  const markerIcon = place.openNow ? '🟢' : '📍';
  
  return (
    <Marker 
      position={[place.location.lat, place.location.lng]}
      icon={createCustomIcon(markerColor, markerIcon)}
    >
      <Popup>
        <div>
          <h4>{place.name}</h4>
          {place.openNow && <span>🟢 Abierto ahora</span>}
          {isRealTime && <span>⚡ Tiempo real</span>}
        </div>
      </Popup>
    </Marker>
  );
};
```

## 🧪 Testing Frontend

### **Consultas de Prueba:**

```javascript
const testQueries = [
  "¿Qué restaurantes están abiertos cerca de mí ahora?", // Debe mostrar banner tiempo real
  "¿Dónde puedo almorzar ahora?", // Urgencia media
  "¿Qué bares están abiertos esta noche?", // Tiempo real + noche
  "Hoteles cerca de mí", // Búsqueda normal (sin tiempo real)
  "¿Qué está abierto cerca de mí ahora mismo?" // Urgencia alta
];
```

### **Verificaciones:**

1. ✅ Banner de tiempo real aparece cuando corresponde
2. ✅ Badges de urgencia se muestran correctamente
3. ✅ Indicadores "abierto ahora" funcionan
4. ✅ Metadatos de búsqueda se muestran
5. ✅ Distancias están destacadas en tiempo real
6. ✅ Auto-refresh funciona (si implementado)

## 🚨 Importante - Backward Compatibility

⚠️ **Las nuevas funcionalidades son opcionales**: Si los nuevos campos no están presentes, el frontend debe funcionar exactamente igual que antes.

```javascript
// Siempre verificar existencia antes de usar
const hasRealTimeFeatures = response.realTimeContext || response.searchMetadata?.is_real_time_search;

if (hasRealTimeFeatures) {
  // Mostrar funcionalidades nuevas
} else {
  // Comportamiento normal (existente)
}
```

## 📞 Contacto y Soporte

Si tienes dudas sobre la implementación:

1. 📋 Revisa los ejemplos de respuesta en `REAL-TIME-FEATURES-IMPLEMENTED.md`
2. 🧪 Usa los scripts de testing: `test-real-time-queries.js`
3. 🔍 Revisa los logs del backend para debugging
4. 💬 Contacta al equipo de backend para aclaraciones

---

**¡Con estas implementaciones, el frontend aprovechará completamente las nuevas funcionalidades en tiempo real de Ana API!** 🚀

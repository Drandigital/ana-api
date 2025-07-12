# 🛠️ EJEMPLOS DE INTEGRACIÓN POR FRAMEWORK

## ⚛️ React/Next.js

### **Hook Personalizado para Tiempo Real**

```jsx
// hooks/useRealTimeChat.js
import { useState, useCallback } from 'react';

export const useRealTimeChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);

  const sendMessage = useCallback(async (message, location) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          location,
          sessionId: `session_${Date.now()}`
        })
      });
      
      const data = await response.json();
      setLastResponse(data);
      
      return data;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sendMessage,
    isLoading,
    lastResponse,
    isRealTimeResponse: lastResponse?.realTimeContext !== undefined
  };
};
```

### **Componente Principal de Chat**

```jsx
// components/ChatInterface.jsx
import { useRealTimeChat } from '../hooks/useRealTimeChat';
import { RealTimeBanner } from './RealTimeBanner';
import { PlacesList } from './PlacesList';

export const ChatInterface = () => {
  const { sendMessage, isLoading, lastResponse, isRealTimeResponse } = useRealTimeChat();
  const [message, setMessage] = useState('');
  const [userLocation, setUserLocation] = useState(null);

  // Obtener ubicación del usuario
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.warn('Geolocation error:', error)
      );
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await sendMessage(message, userLocation);
      setMessage('');
    } catch (error) {
      // Manejar error
    }
  };

  return (
    <div className="chat-interface">
      {/* Formulario de mensaje */}
      <form onSubmit={handleSubmit} className="message-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="¿Qué restaurantes están abiertos cerca de mí?"
          className="message-input"
          disabled={isLoading}
        />
        <button 
          type="submit" 
          disabled={isLoading || !message.trim()}
          className="send-button"
        >
          {isLoading ? '⏳' : '🚀'}
        </button>
      </form>

      {/* Respuesta del chat */}
      {lastResponse && (
        <div className="chat-response">
          {/* Banner de tiempo real */}
          {isRealTimeResponse && (
            <RealTimeBanner context={lastResponse.realTimeContext} />
          )}

          {/* Mensaje del bot */}
          <div className="bot-message">
            {lastResponse.response}
          </div>

          {/* Lista de lugares */}
          {lastResponse.places && lastResponse.places.length > 0 && (
            <PlacesList 
              places={lastResponse.places}
              searchMetadata={lastResponse.searchMetadata}
              isRealTime={isRealTimeResponse}
            />
          )}

          {/* Información del clima */}
          {lastResponse.weather && (
            <WeatherCard weather={lastResponse.weather} />
          )}
        </div>
      )}
    </div>
  );
};
```

### **Componente Banner de Tiempo Real**

```jsx
// components/RealTimeBanner.jsx
export const RealTimeBanner = ({ context }) => {
  if (!context) return null;

  const getUrgencyConfig = (urgency) => {
    switch (urgency) {
      case 'high':
        return {
          icon: '⚡',
          text: 'RESULTADOS URGENTES',
          className: 'urgency-high',
          color: '#ff4757'
        };
      case 'medium':
        return {
          icon: '🕒',
          text: 'TIEMPO REAL',
          className: 'urgency-medium',
          color: '#ffa726'
        };
      default:
        return {
          icon: '📍',
          text: 'CERCA DE TI',
          className: 'urgency-low',
          color: '#3742fa'
        };
    }
  };

  const config = getUrgencyConfig(context.urgency);

  return (
    <div 
      className={`real-time-banner ${config.className}`}
      style={{ backgroundColor: config.color }}
    >
      <span className="banner-icon">{config.icon}</span>
      <span className="banner-text">{config.text}</span>
      
      {context.optimizations?.realTime && (
        <span className="optimization-badge">
          ⚡ Optimizado
        </span>
      )}
    </div>
  );
};
```

## 🅰️ Angular

### **Servicio de Chat en Tiempo Real**

```typescript
// services/real-time-chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ChatResponse {
  response: string;
  places?: any[];
  realTimeContext?: {
    urgency: 'low' | 'medium' | 'high';
    optimizations: {
      realTime: boolean;
      proximity: boolean;
    };
  };
  searchMetadata?: {
    is_real_time_search: boolean;
    category: string;
    urgency: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class RealTimeChatService {
  private apiUrl = 'https://your-api-url.com';
  private lastResponseSubject = new BehaviorSubject<ChatResponse | null>(null);
  
  public lastResponse$ = this.lastResponseSubject.asObservable();

  constructor(private http: HttpClient) {}

  sendMessage(message: string, location?: {lat: number, lng: number}): Observable<ChatResponse> {
    const payload = {
      message,
      location,
      sessionId: `session_${Date.now()}`
    };

    return this.http.post<ChatResponse>(`${this.apiUrl}/chat`, payload)
      .pipe(
        tap(response => this.lastResponseSubject.next(response))
      );
  }

  isRealTimeResponse(response: ChatResponse): boolean {
    return !!(response.realTimeContext || response.searchMetadata?.is_real_time_search);
  }
}
```

### **Componente de Chat**

```typescript
// components/chat.component.ts
import { Component, OnInit } from '@angular/core';
import { RealTimeChatService, ChatResponse } from '../services/real-time-chat.service';

@Component({
  selector: 'app-chat',
  template: `
    <div class="chat-container">
      <!-- Formulario -->
      <form (ngSubmit)="onSubmit()" class="message-form">
        <input 
          [(ngModel)]="message" 
          placeholder="¿Qué restaurantes están abiertos cerca de mí?"
          [disabled]="isLoading"
          class="message-input"
        />
        <button 
          type="submit" 
          [disabled]="isLoading || !message.trim()"
          class="send-button"
        >
          {{ isLoading ? '⏳' : '🚀' }}
        </button>
      </form>

      <!-- Respuesta -->
      <div *ngIf="lastResponse" class="chat-response">
        <!-- Banner tiempo real -->
        <app-real-time-banner 
          *ngIf="isRealTimeResponse(lastResponse)"
          [context]="lastResponse.realTimeContext">
        </app-real-time-banner>

        <!-- Mensaje del bot -->
        <div class="bot-message">{{ lastResponse.response }}</div>

        <!-- Lista de lugares -->
        <app-places-list 
          *ngIf="lastResponse.places?.length"
          [places]="lastResponse.places"
          [isRealTime]="isRealTimeResponse(lastResponse)"
          [metadata]="lastResponse.searchMetadata">
        </app-places-list>
      </div>
    </div>
  `
})
export class ChatComponent implements OnInit {
  message = '';
  isLoading = false;
  lastResponse: ChatResponse | null = null;
  userLocation: {lat: number, lng: number} | null = null;

  constructor(private chatService: RealTimeChatService) {}

  ngOnInit() {
    // Obtener ubicación
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        }
      );
    }

    // Suscribirse a respuestas
    this.chatService.lastResponse$.subscribe(
      response => this.lastResponse = response
    );
  }

  async onSubmit() {
    if (!this.message.trim()) return;

    this.isLoading = true;
    try {
      await this.chatService.sendMessage(this.message, this.userLocation).toPromise();
      this.message = '';
    } catch (error) {
      console.error('Error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  isRealTimeResponse(response: ChatResponse): boolean {
    return this.chatService.isRealTimeResponse(response);
  }
}
```

## 🟢 Vue.js

### **Composable para Tiempo Real**

```javascript
// composables/useRealTimeChat.js
import { ref, computed } from 'vue';

export function useRealTimeChat() {
  const isLoading = ref(false);
  const lastResponse = ref(null);
  const userLocation = ref(null);

  // Obtener ubicación del usuario
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLocation.value = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        },
        (error) => console.warn('Geolocation error:', error)
      );
    }
  };

  // Enviar mensaje
  const sendMessage = async (message) => {
    isLoading.value = true;
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          location: userLocation.value,
          sessionId: `session_${Date.now()}`
        })
      });
      
      const data = await response.json();
      lastResponse.value = data;
      
      return data;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // Computed para verificar si es respuesta en tiempo real
  const isRealTimeResponse = computed(() => {
    return lastResponse.value?.realTimeContext !== undefined ||
           lastResponse.value?.searchMetadata?.is_real_time_search === true;
  });

  return {
    isLoading,
    lastResponse,
    userLocation,
    isRealTimeResponse,
    sendMessage,
    getUserLocation
  };
}
```

### **Componente Principal**

```vue
<!-- components/ChatInterface.vue -->
<template>
  <div class="chat-interface">
    <!-- Formulario -->
    <form @submit.prevent="handleSubmit" class="message-form">
      <input
        v-model="message"
        :disabled="isLoading"
        placeholder="¿Qué restaurantes están abiertos cerca de mí?"
        class="message-input"
      />
      <button 
        type="submit" 
        :disabled="isLoading || !message.trim()"
        class="send-button"
      >
        {{ isLoading ? '⏳' : '🚀' }}
      </button>
    </form>

    <!-- Respuesta -->
    <div v-if="lastResponse" class="chat-response">
      <!-- Banner tiempo real -->
      <RealTimeBanner 
        v-if="isRealTimeResponse"
        :context="lastResponse.realTimeContext"
      />

      <!-- Mensaje del bot -->
      <div class="bot-message">
        {{ lastResponse.response }}
      </div>

      <!-- Lista de lugares -->
      <PlacesList 
        v-if="lastResponse.places?.length"
        :places="lastResponse.places"
        :is-real-time="isRealTimeResponse"
        :metadata="lastResponse.searchMetadata"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRealTimeChat } from '../composables/useRealTimeChat';
import RealTimeBanner from './RealTimeBanner.vue';
import PlacesList from './PlacesList.vue';

const message = ref('');
const { 
  isLoading, 
  lastResponse, 
  isRealTimeResponse, 
  sendMessage, 
  getUserLocation 
} = useRealTimeChat();

onMounted(() => {
  getUserLocation();
});

const handleSubmit = async () => {
  if (!message.value.trim()) return;
  
  try {
    await sendMessage(message.value);
    message.value = '';
  } catch (error) {
    // Manejar error
  }
};
</script>
```

## 🍦 Vanilla JavaScript

### **Clase para Manejar Chat en Tiempo Real**

```javascript
// js/RealTimeChat.js
class RealTimeChat {
  constructor(apiUrl, containerId) {
    this.apiUrl = apiUrl;
    this.container = document.getElementById(containerId);
    this.userLocation = null;
    this.lastResponse = null;
    
    this.init();
  }

  async init() {
    this.createInterface();
    await this.getUserLocation();
  }

  createInterface() {
    this.container.innerHTML = `
      <div class="chat-interface">
        <form id="messageForm" class="message-form">
          <input 
            id="messageInput" 
            type="text" 
            placeholder="¿Qué restaurantes están abiertos cerca de mí?"
            class="message-input"
          />
          <button type="submit" class="send-button">🚀</button>
        </form>
        <div id="chatResponse" class="chat-response"></div>
      </div>
    `;

    // Event listeners
    const form = document.getElementById('messageForm');
    form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  async getUserLocation() {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            resolve(this.userLocation);
          },
          (error) => {
            console.warn('Geolocation error:', error);
            resolve(null);
          }
        );
      } else {
        resolve(null);
      }
    });
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;

    const button = e.target.querySelector('button');
    button.textContent = '⏳';
    button.disabled = true;

    try {
      const response = await this.sendMessage(message);
      this.displayResponse(response);
      input.value = '';
    } catch (error) {
      this.displayError(error);
    } finally {
      button.textContent = '🚀';
      button.disabled = false;
    }
  }

  async sendMessage(message) {
    const response = await fetch(`${this.apiUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        location: this.userLocation,
        sessionId: `session_${Date.now()}`
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    this.lastResponse = data;
    return data;
  }

  displayResponse(data) {
    const responseContainer = document.getElementById('chatResponse');
    const isRealTime = this.isRealTimeResponse(data);

    let html = '';

    // Banner de tiempo real
    if (isRealTime) {
      html += this.createRealTimeBanner(data.realTimeContext);
    }

    // Mensaje del bot
    html += `<div class="bot-message">${data.response}</div>`;

    // Lista de lugares
    if (data.places && data.places.length > 0) {
      html += this.createPlacesList(data.places, isRealTime);
    }

    responseContainer.innerHTML = html;
  }

  createRealTimeBanner(context) {
    if (!context) return '';

    const urgencyConfig = {
      high: { icon: '⚡', text: 'RESULTADOS URGENTES', class: 'urgency-high' },
      medium: { icon: '🕒', text: 'TIEMPO REAL', class: 'urgency-medium' },
      low: { icon: '📍', text: 'CERCA DE TI', class: 'urgency-low' }
    };

    const config = urgencyConfig[context.urgency] || urgencyConfig.low;

    return `
      <div class="real-time-banner ${config.class}">
        <span class="banner-icon">${config.icon}</span>
        <span class="banner-text">${config.text}</span>
        ${context.optimizations?.realTime ? '<span class="optimization-badge">⚡ Optimizado</span>' : ''}
      </div>
    `;
  }

  createPlacesList(places, isRealTime) {
    let html = '<div class="places-list">';
    
    places.forEach(place => {
      html += `
        <div class="place-card ${isRealTime ? 'real-time' : ''}">
          <div class="place-badges">
            ${place.openNow ? '<span class="badge open-now">🟢 Abierto</span>' : ''}
            ${place.isRealTimeOptimized ? '<span class="badge optimized">⚡ Optimizado</span>' : ''}
            ${place.isPremium ? '<span class="badge premium">⭐ Premium</span>' : ''}
          </div>
          
          <h3 class="place-name">${place.name}</h3>
          <p class="place-address">${place.address || 'Sin dirección'}</p>
          
          ${isRealTime && place.distance_formatted ? 
            `<div class="distance-highlight">📍 ${place.distance_formatted}</div>` : ''}
          
          <div class="place-info">
            ${place.rating ? `<span class="rating">⭐ ${place.rating}</span>` : ''}
            ${place.phone ? `<span class="phone">📞 ${place.phone}</span>` : ''}
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  isRealTimeResponse(response) {
    return response.realTimeContext !== undefined ||
           response.searchMetadata?.is_real_time_search === true;
  }

  displayError(error) {
    const responseContainer = document.getElementById('chatResponse');
    responseContainer.innerHTML = `
      <div class="error-message">
        ❌ Error: ${error.message}
      </div>
    `;
  }
}

// Uso
document.addEventListener('DOMContentLoaded', () => {
  const chat = new RealTimeChat('https://your-api-url.com', 'chatContainer');
});
```

## 📱 React Native

### **Hook para Chat en Tiempo Real**

```javascript
// hooks/useRealTimeChat.js
import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

export const useRealTimeChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const getUserLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission to access location was denied');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      };
      
      setUserLocation(coords);
      return coords;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }, []);

  const sendMessage = useCallback(async (message) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('https://your-api-url.com/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          location: userLocation,
          sessionId: `session_${Date.now()}`
        })
      });
      
      const data = await response.json();
      setLastResponse(data);
      
      return data;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userLocation]);

  const isRealTimeResponse = useCallback(() => {
    return lastResponse?.realTimeContext !== undefined ||
           lastResponse?.searchMetadata?.is_real_time_search === true;
  }, [lastResponse]);

  return {
    isLoading,
    lastResponse,
    userLocation,
    sendMessage,
    getUserLocation,
    isRealTimeResponse
  };
};
```

### **Componente de Chat**

```jsx
// components/ChatScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRealTimeChat } from '../hooks/useRealTimeChat';

export const ChatScreen = () => {
  const [message, setMessage] = useState('');
  const { 
    isLoading, 
    lastResponse, 
    sendMessage, 
    getUserLocation, 
    isRealTimeResponse 
  } = useRealTimeChat();

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    
    try {
      await sendMessage(message);
      setMessage('');
    } catch (error) {
      // Manejar error
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.chatContainer}>
        {lastResponse && (
          <View style={styles.response}>
            {/* Banner de tiempo real */}
            {isRealTimeResponse() && (
              <View style={[
                styles.realTimeBanner,
                { backgroundColor: getUrgencyColor(lastResponse.realTimeContext?.urgency) }
              ]}>
                <Text style={styles.bannerText}>
                  {getUrgencyIcon(lastResponse.realTimeContext?.urgency)} TIEMPO REAL
                </Text>
              </View>
            )}

            {/* Mensaje del bot */}
            <Text style={styles.botMessage}>{lastResponse.response}</Text>

            {/* Lista de lugares */}
            {lastResponse.places?.map((place, index) => (
              <View key={index} style={styles.placeCard}>
                <View style={styles.placeBadges}>
                  {place.openNow && (
                    <Text style={styles.openBadge}>🟢 Abierto</Text>
                  )}
                  {place.isRealTimeOptimized && (
                    <Text style={styles.optimizedBadge}>⚡ Optimizado</Text>
                  )}
                </View>
                
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.placeAddress}>{place.address}</Text>
                
                {isRealTimeResponse() && place.distance_formatted && (
                  <Text style={styles.distance}>📍 {place.distance_formatted}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Input de mensaje */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={message}
          onChangeText={setMessage}
          placeholder="¿Qué restaurantes están abiertos cerca de mí?"
          editable={!isLoading}
        />
        <TouchableOpacity 
          style={[styles.sendButton, { opacity: isLoading ? 0.5 : 1 }]}
          onPress={handleSubmit}
          disabled={isLoading || !message.trim()}
        >
          <Text style={styles.sendButtonText}>
            {isLoading ? '⏳' : '🚀'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getUrgencyColor = (urgency) => {
  switch (urgency) {
    case 'high': return '#ff4757';
    case 'medium': return '#ffa726';
    default: return '#3742fa';
  }
};

const getUrgencyIcon = (urgency) => {
  switch (urgency) {
    case 'high': return '⚡';
    case 'medium': return '🕒';
    default: return '📍';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  chatContainer: {
    flex: 1,
    padding: 16,
  },
  response: {
    marginBottom: 16,
  },
  realTimeBanner: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  bannerText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  botMessage: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  placeCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  placeBadges: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  openBadge: {
    backgroundColor: '#2ed573',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
    marginRight: 4,
  },
  optimizedBadge: {
    backgroundColor: '#ff6b6b',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
  },
  placeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  placeAddress: {
    color: '#666',
    marginBottom: 4,
  },
  distance: {
    backgroundColor: '#3742fa',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#3742fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 18,
  },
});
```

---

**Estos ejemplos cubren los principales frameworks y proporcionan una base sólida para integrar las funcionalidades de tiempo real en cualquier frontend.** 🚀

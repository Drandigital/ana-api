// debug-google-places.js
// Script para debuggear la integración completa con el mapa del frontend

import { handleChatRequest } from './controllers/chatController.js';
import config from './config/index.js';

async function debugMapIntegration() {
    console.log('�️ Iniciando debug de integración con el mapa...');
    
    // Verificar configuración
    console.log('\n📋 Verificando configuración:');
    console.log('Google Maps API Key:', config.externalApis.googleMapsApiKey ? '✅ Configurada' : '❌ No configurada');
    
    // Ubicación de prueba en Cartagena
    const testLocation = {
        lat: 10.4236,
        lng: -75.5378,
        city: 'Cartagena'
    };
    
    console.log('\n📍 Ubicación de prueba:', testLocation);
    
    // Lista de consultas para probar diferentes tipos de lugares
    const testQueries = [
        'hoteles cerca de mi ubicación',
        'restaurantes cerca de aquí',
        'museos que puedo visitar',
        'bares para ir esta noche',
        'lugares turísticos en Cartagena',
        'cafeterías cerca de mí',
        'tiendas para comprar'
    ];
    
    for (const query of testQueries) {
        console.log(`\n🔍 === PROBANDO: "${query}" ===`);
        
        try {
            const result = await testConversationalFlow(query, testLocation);
            
            if (result.places && result.places.length > 0) {
                console.log(`✅ ${result.places.length} lugares encontrados para el mapa:`);
                result.places.slice(0, 3).forEach((place, index) => {
                    console.log(`   ${index + 1}. ${place.name} (${place.category})`);
                    console.log(`      📍 ${place.location.lat}, ${place.location.lng}`);
                    console.log(`      📍 ${place.address || 'Sin dirección'}`);
                    console.log(`      ⭐ Rating: ${place.rating || 'N/A'}`);
                    console.log(`      📏 Distancia: ${place.distance_formatted || 'N/A'}`);
                });
                
                console.log(`\n📊 Metadatos de búsqueda:`, result.searchMetadata);
            } else {
                console.log('❌ No se encontraron lugares para el mapa');
            }
            
        } catch (error) {
            console.error(`❌ Error con "${query}":`, error.message);
        }
    }
}

async function testConversationalFlow(message, location) {
    return new Promise((resolve, reject) => {
        const req = {
            body: {
                message,
                sessionId: `test-${Date.now()}`,
                location
            }
        };
        
        const res = {
            status: (code) => ({
                json: (data) => {
                    if (code === 200) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${code}: ${JSON.stringify(data)}`));
                    }
                    return data;
                }
            })
        };
        
        const next = (error) => {
            reject(error);
        };
        
        handleChatRequest(req, res, next).catch(reject);
    });
}

// Ejecutar debug
debugMapIntegration()
    .then(() => {
        console.log('\n✅ Debug de integración con mapa completado');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Error fatal en debug:', error);
        process.exit(1);
    });

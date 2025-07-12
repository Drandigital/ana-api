// test-quick.js
// Test rápido para verificar funcionalidad

import { handleChatRequest } from './controllers/chatController.js';

async function quickTest() {
    console.log('🧪 Test rápido de funcionalidad...');
    
    const testLocation = {
        lat: 10.4236,
        lng: -75.5378,
        city: 'Cartagena'
    };
    
    // Probar una consulta de tiempo real
    const req = {
        body: {
            message: '¿Qué restaurantes están abiertos cerca de mí ahora?',
            sessionId: 'test-quick',
            location: testLocation
        }
    };
    
    let responseReceived = false;
    
    const res = {
        status: (code) => ({
            json: (data) => {
                responseReceived = true;
                console.log(`✅ Respuesta HTTP ${code}`);
                console.log(`📍 Lugares encontrados: ${data.places?.length || 0}`);
                
                // Verificar si se detectó tiempo real
                if (data.realTimeContext) {
                    console.log(`🚀 ¡TIEMPO REAL DETECTADO!`);
                    console.log(`   Urgencia: ${data.realTimeContext.urgency}`);
                    console.log(`   Mensaje: ${data.realTimeContext.message}`);
                } else if (data.searchMetadata?.is_real_time_search) {
                    console.log(`🚀 ¡BÚSQUEDA EN TIEMPO REAL!`);
                } else {
                    console.log(`⚠️  Búsqueda normal`);
                }
                
                return data;
            }
        })
    };
    
    try {
        await handleChatRequest(req, res);
        
        if (responseReceived) {
            console.log('✅ Test completado exitosamente');
        } else {
            console.log('⚠️  No se recibió respuesta');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

quickTest();

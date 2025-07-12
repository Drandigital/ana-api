// test-simple.js
// Test simple para encontrar el error

import { handleChatRequest } from './controllers/chatController.js';

async function testSimple() {
    console.log('🧪 Iniciando test simple...');
    
    const req = {
        body: {
            message: 'hoteles cerca de mi ubicación',
            sessionId: 'test-simple',
            location: {
                lat: 10.4236,
                lng: -75.5378,
                city: 'Cartagena'
            }
        }
    };
    
    const res = {
        status: (code) => ({
            json: (data) => {
                console.log(`✅ Respuesta HTTP ${code}:`, JSON.stringify(data, null, 2));
                return data;
            }
        })
    };
    
    try {
        await handleChatRequest(req, res);
        console.log('✅ Test completado exitosamente');
    } catch (error) {
        console.error('❌ Error en test:', error.message);
        console.error('Stack:', error.stack);
    }
}

testSimple();

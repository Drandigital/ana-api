// test-real-time-queries.js
// Test completo para todas las consultas en tiempo real solicitadas

import { handleChatRequest } from './controllers/chatController.js';

// Todas las consultas de tiempo real solicitadas por el usuario
const testQueries = [
  // 🏨 Hoteles (en tiempo real)
  '¿Qué hoteles hay cerca de mí ahora?',
  '¿Cuál es el hotel más cercano con disponibilidad hoy?',
  '¿Qué hoteles económicos hay abiertos ahora?',
  '¿Dónde puedo hospedarme esta noche cerca de aquí?',
  '¿Qué hotel tiene buenas reseñas y está cerca?',
  
  // 🍽️ Restaurantes (en tiempo real)
  '¿Qué restaurantes están abiertos cerca de mí?',
  '¿Dónde puedo almorzar ahora?',
  '¿Dónde puedo cenar ahora?',
  '¿Hay comida típica cerca de aquí?',
  '¿Qué restaurantes tienen buena calificación y están cerca?',
  '¿Dónde puedo comer rápido cerca de mi ubicación?',
  
  // 🍸 Bares y Vida Nocturna (en tiempo real)
  '¿Qué bares están abiertos cerca de mí ahora?',
  '¿Dónde puedo tomar algo cerca?',
  '¿Dónde hay música en vivo esta noche?',
  '¿Qué lugar tiene ambiente para salir ahora mismo?',
  '¿Hay algún bar con terraza abierto cerca?',
  
  // 🖼️ Museos y Cultura (en tiempo real)
  '¿Qué museos están abiertos hoy?',
  '¿Dónde hay museos cerca de mí?',
  '¿Qué exposición puedo visitar ahora?',
  '¿Qué lugares culturales hay cerca?',
  '¿Qué actividades culturales hay hoy?',
  
  // 🌄 Lugares turísticos y naturales (en tiempo real)
  '¿Qué sitios turísticos hay cerca de mí?',
  '¿Dónde puedo ir a pasear ahora?',
  '¿Qué lugares son buenos para visitar esta tarde?',
  '¿Dónde puedo ver el atardecer cerca?',
  '¿Qué tour está saliendo en este momento o pronto?',
  
  // 🔁 Otras preguntas útiles al instante
  '¿Qué está abierto cerca de mí?',
  '¿Dónde puedo ir ahora sin reserva?',
  '¿Qué eventos hay hoy cerca?',
  '¿Hay algún sitio seguro para caminar cerca de aquí?',
  '¿Dónde puedo encontrar un lugar tranquilo cerca de mí?'
];

async function testRealTimeQuery(message, index) {
    const testLocation = {
        lat: 10.4236,
        lng: -75.5378,
        city: 'Cartagena'
    };
    
    console.log(`\n🔍 [${index + 1}/${testQueries.length}] PROBANDO: "${message}"`);
    
    return new Promise((resolve, reject) => {
        const req = {
            body: {
                message,
                sessionId: `test-realtime-${index}`,
                location: testLocation
            }
        };
        
        const res = {
            status: (code) => ({
                json: (data) => {
                    if (code === 200) {
                        // Analizar la respuesta para ver si detectó tiempo real
                        const isRealTimeDetected = data.realTimeContext || 
                            (data.searchMetadata && data.searchMetadata.is_real_time_search) ||
                            (data.searchMetadata && data.searchMetadata.searchType === 'real_time_proximity');
                        
                        console.log(`✅ Respuesta exitosa - Lugares encontrados: ${data.places?.length || 0}`);
                        
                        if (isRealTimeDetected) {
                            console.log(`🚀 ¡TIEMPO REAL DETECTADO! Urgencia: ${data.realTimeContext?.urgency || 'N/A'}`);
                        } else {
                            console.log(`⚠️  Búsqueda normal (no se detectó tiempo real)`);
                        }
                        
                        resolve({
                            success: true,
                            placesFound: data.places?.length || 0,
                            realTimeDetected: isRealTimeDetected,
                            urgency: data.realTimeContext?.urgency,
                            searchType: data.searchMetadata?.searchType
                        });
                    } else {
                        reject(new Error(`HTTP ${code}: ${JSON.stringify(data)}`));
                    }
                    return data;
                }
            })
        };
        
        handleChatRequest(req, res).catch(reject);
    });
}

async function runAllTests() {
    console.log('🚀 === INICIANDO TESTS DE CONSULTAS EN TIEMPO REAL ===');
    console.log(`Total de consultas a probar: ${testQueries.length}\n`);
    
    const results = [];
    let realTimeDetected = 0;
    let totalPlaces = 0;
    
    for (let i = 0; i < testQueries.length; i++) {
        try {
            const result = await testRealTimeQuery(testQueries[i], i);
            results.push(result);
            
            if (result.realTimeDetected) {
                realTimeDetected++;
            }
            totalPlaces += result.placesFound;
            
            // Pequeña pausa entre consultas para no sobrecargar las APIs
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            results.push({
                success: false,
                error: error.message
            });
        }
    }
    
    // Resumen final
    console.log('\n📊 === RESUMEN DE RESULTADOS ===');
    console.log(`Total consultas: ${testQueries.length}`);
    console.log(`Consultas exitosas: ${results.filter(r => r.success).length}`);
    console.log(`Tiempo real detectado: ${realTimeDetected} consultas`);
    console.log(`Total lugares encontrados: ${totalPlaces}`);
    console.log(`Promedio lugares por consulta: ${(totalPlaces / results.filter(r => r.success).length).toFixed(1)}`);
    
    // Análisis de detección por categoría
    const categoryStats = {
        'hoteles': 0,
        'restaurantes': 0,
        'bares': 0,
        'museos': 0,
        'turísticos': 0,
        'otros': 0
    };
    
    testQueries.forEach((query, index) => {
        if (!results[index]?.realTimeDetected) return;
        
        if (query.includes('hotel')) categoryStats.hoteles++;
        else if (query.includes('restaurante') || query.includes('comer') || query.includes('almorzar') || query.includes('cenar')) categoryStats.restaurantes++;
        else if (query.includes('bar') || query.includes('tomar') || query.includes('música')) categoryStats.bares++;
        else if (query.includes('museo') || query.includes('cultural') || query.includes('exposición')) categoryStats.museos++;
        else if (query.includes('turístico') || query.includes('pasear') || query.includes('tour')) categoryStats.turísticos++;
        else categoryStats.otros++;
    });
    
    console.log('\n📈 Detección por categoría:');
    Object.entries(categoryStats).forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count} consultas`);
    });
    
    console.log('\n✅ Test completado');
}

runAllTests()
    .then(() => {
        console.log('\n🎉 Todos los tests finalizados exitosamente');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Error fatal en tests:', error);
        process.exit(1);
    });

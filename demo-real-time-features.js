// demo-real-time-features.js
// Demostración de las nuevas funcionalidades en tiempo real

import { handleChatRequest } from './controllers/chatController.js';

// Ejemplos selectos de cada categoría
const demoQueries = [
  // Hoteles - tiempo real
  {
    category: '🏨 Hoteles',
    query: '¿Qué hoteles hay cerca de mí ahora?',
    expectedFeatures: ['tiempo real', 'proximidad', 'hoteles']
  },
  
  // Restaurantes - tiempo real + urgencia
  {
    category: '🍽️ Restaurantes',
    query: '¿Dónde puedo almorzar ahora?',
    expectedFeatures: ['tiempo real', 'urgencia media', 'restaurantes']
  },
  
  // Bares - tiempo real nocturno
  {
    category: '🍸 Bares',
    query: '¿Qué bares están abiertos cerca de mí ahora?',
    expectedFeatures: ['tiempo real', 'proximidad', 'bares', 'abierto']
  },
  
  // Museos - tiempo real cultural
  {
    category: '🖼️ Museos',
    query: '¿Qué museos están abiertos hoy?',
    expectedFeatures: ['tiempo real', 'hoy', 'museos']
  },
  
  // Turísticos - tiempo real + urgencia alta
  {
    category: '🌄 Turísticos',
    query: '¿Qué lugares son buenos para visitar esta tarde?',
    expectedFeatures: ['tiempo real', 'esta tarde', 'turísticos']
  }
];

async function runDemo() {
    console.log('🎯 === DEMOSTRACIÓN DE FUNCIONALIDADES EN TIEMPO REAL ===\n');
    
    const testLocation = {
        lat: 10.4236,
        lng: -75.5378,
        city: 'Cartagena'
    };
    
    for (let i = 0; i < demoQueries.length; i++) {
        const { category, query, expectedFeatures } = demoQueries[i];
        
        console.log(`${category}: "${query}"`);
        console.log(`   Características esperadas: ${expectedFeatures.join(', ')}`);
        
        try {
            const result = await testQuery(query, `demo-${i}`, testLocation);
            
            console.log(`   ✅ Resultado:`);
            console.log(`      🎯 Tiempo real detectado: ${result.isRealTime ? 'SÍ' : 'NO'}`);
            console.log(`      📍 Proximidad detectada: ${result.isProximity ? 'SÍ' : 'NO'}`);
            console.log(`      📊 Categoría: ${result.category || 'N/A'}`);
            console.log(`      ⚡ Urgencia: ${result.urgency || 'N/A'}`);
            console.log(`      📍 Lugares encontrados: ${result.placesFound}`);
            console.log(`      🔧 Optimizado para abiertos: ${result.openNow ? 'SÍ' : 'NO'}`);
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
        
        console.log(''); // Línea en blanco
        
        // Pausa breve entre consultas
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('🎉 === DEMOSTRACIÓN COMPLETADA ===');
    console.log('\n📈 FUNCIONALIDADES IMPLEMENTADAS:');
    console.log('   ✅ Detección automática de consultas en tiempo real');
    console.log('   ✅ Análisis de urgencia (baja, media, alta)');
    console.log('   ✅ Filtrado por lugares abiertos ahora');
    console.log('   ✅ Búsqueda optimizada por proximidad');
    console.log('   ✅ Categorización automática (hoteles, restaurantes, bares, etc.)');
    console.log('   ✅ Integración con Google Places API');
    console.log('   ✅ Respuestas contextuales multiidioma');
    console.log('   ✅ Metadatos de búsqueda optimizada');
}

function testQuery(message, sessionId, location) {
    return new Promise((resolve, reject) => {
        const req = {
            body: { message, sessionId, location }
        };
        
        const res = {
            status: (code) => ({
                json: (data) => {
                    if (code === 200) {
                        resolve({
                            isRealTime: data.realTimeContext?.optimizations?.realTime || 
                                       (data.searchMetadata?.is_real_time_search === true),
                            isProximity: data.realTimeContext?.optimizations?.proximity || 
                                        (data.searchMetadata?.geo_search === true),
                            category: data.searchMetadata?.category || 'N/A',
                            urgency: data.realTimeContext?.urgency || data.searchMetadata?.urgency || 'N/A',
                            placesFound: data.places?.length || 0,
                            openNow: data.searchMetadata?.openNow || false
                        });
                    } else {
                        reject(new Error(`HTTP ${code}`));
                    }
                    return data;
                }
            })
        };
        
        handleChatRequest(req, res).catch(reject);
    });
}

runDemo()
    .then(() => {
        console.log('\n✅ Demo finalizada exitosamente');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Error en demo:', error);
        process.exit(1);
    });

// test-proximity-15-places.js

/**
 * Script de prueba para verificar:
 * 1. Búsqueda de exactamente 15 lugares
 * 2. Radio máximo de 5km
 * 3. Ordenamiento por proximidad (menor a mayor distancia)
 * 4. Funcionalidad de tiempo real activada
 */

import { handleChatRequest } from './controllers/chatController.js';

// Coordenadas de prueba (Centro de Bogotá)
const testLocation = {
  lat: 4.6097,
  lng: -74.0817
};

// Consultas de prueba para verificar diferentes tipos
const testQueries = [
  {
    message: 'hoteles cerca de mi',
    description: 'Búsqueda normal de hoteles (proximidad)',
    expectedRealTime: false
  },
  {
    message: '¿qué hoteles están cerca de mí ahora?',
    description: 'Búsqueda tiempo real de hoteles',
    expectedRealTime: true
  },
  {
    message: 'restaurantes cerca de mí',
    description: 'Búsqueda normal de restaurantes',
    expectedRealTime: false
  },
  {
    message: '¿dónde puedo comer cerca de aquí ahora?',
    description: 'Búsqueda tiempo real de restaurantes',
    expectedRealTime: true
  },
  {
    message: 'bares cerca de mi ubicación',
    description: 'Búsqueda normal de bares',
    expectedRealTime: false
  }
];

// Función para ejecutar una prueba
async function runTest(queryObj, testIndex) {
  console.log(`\n🧪 ========== PRUEBA ${testIndex + 1}: ${queryObj.description} ==========`);
  console.log(`📝 Consulta: "${queryObj.message}"`);
  console.log(`⏰ Tiempo real esperado: ${queryObj.expectedRealTime ? 'SÍ' : 'NO'}`);
  
  return new Promise((resolve) => {
    const testReq = {
      body: {
        message: queryObj.message,
        sessionId: `test_proximity_${Date.now()}_${testIndex}`,
        location: testLocation
      }
    };

    const mockRes = {
      json: (data) => {
        try {
          console.log('\n📊 ANÁLISIS DE RESULTADOS:');
          console.log('=====================================');
          
          // 1. Verificar cantidad de lugares
          const placesCount = data.places?.length || 0;
          console.log(`🏢 Lugares encontrados: ${placesCount}/15`);
          
          if (placesCount === 0) {
            console.log('⚠️  No se encontraron lugares');
            resolve();
            return;
          }
          
          // 2. Verificar funcionalidades de tiempo real
          const hasRealTimeContext = !!data.realTimeContext;
          const hasRealTimeMetadata = data.searchMetadata?.is_real_time_search || false;
          const isRealTimeDetected = hasRealTimeContext || hasRealTimeMetadata;
          
          console.log(`🕒 Tiempo real detectado: ${isRealTimeDetected ? 'SÍ' : 'NO'} (esperado: ${queryObj.expectedRealTime ? 'SÍ' : 'NO'})`);
          
          if (data.realTimeContext) {
            console.log(`🎯 Urgencia: ${data.realTimeContext.urgency}`);
            console.log(`💬 Mensaje contextual: ${data.realTimeContext.message}`);
          }
          
          // 3. Verificar metadatos de búsqueda
          if (data.searchMetadata) {
            console.log(`📍 Radio de búsqueda: ${data.searchMetadata.search_radius || data.searchMetadata.radius}m`);
            console.log(`📊 Tipo de búsqueda: ${data.searchMetadata.searchType || 'standard'}`);
            console.log(`🗂️ Categoría: ${data.searchMetadata.category || 'no detectada'}`);
          }
          
          // 4. Verificar proximidad y distancias
          console.log('\n📏 ANÁLISIS DE PROXIMIDAD:');
          console.log('===========================');
          
          let maxDistance = 0;
          let minDistance = Infinity;
          let placesWithinRadius = 0;
          
          data.places.forEach((place, index) => {
            const distance = place.distance || 0;
            const distanceFormatted = place.distance_formatted || 'N/A';
            
            console.log(`${index + 1}. ${place.name}`);
            console.log(`   📍 ${place.address || 'Sin dirección'}`);
            console.log(`   📏 Distancia: ${distanceFormatted} (${distance.toFixed(2)}km)`);
            
            if (place.rating) console.log(`   ⭐ Rating: ${place.rating}`);
            if (place.isPremium) console.log(`   🏆 Premium: SÍ`);
            if (place.openNow) console.log(`   🟢 Abierto ahora: SÍ`);
            if (place.isRealTimeOptimized) console.log(`   ⚡ Optimizado tiempo real: SÍ`);
            
            // Estadísticas de distancia
            if (distance > 0) {
              maxDistance = Math.max(maxDistance, distance);
              minDistance = Math.min(minDistance, distance);
              if (distance <= 5) placesWithinRadius++;
            }
            
            console.log('');
          });
          
          // 5. Estadísticas finales
          console.log('📈 ESTADÍSTICAS FINALES:');
          console.log('========================');
          console.log(`📏 Distancia mínima: ${minDistance === Infinity ? 'N/A' : minDistance.toFixed(2)}km`);
          console.log(`📏 Distancia máxima: ${maxDistance === 0 ? 'N/A' : maxDistance.toFixed(2)}km`);
          console.log(`✅ Lugares dentro de 5km: ${placesWithinRadius}/${placesCount}`);
          
          // 6. Verificaciones de calidad
          console.log('\n🔍 VERIFICACIONES:');
          console.log('==================');
          console.log(`✅ Cantidad correcta (≤15): ${placesCount <= 15 ? 'PASS' : 'FAIL'}`);
          console.log(`✅ Dentro de 5km: ${maxDistance <= 5 || maxDistance === 0 ? 'PASS' : 'FAIL'}`);
          console.log(`✅ Ordenado por proximidad: ${isProperlyOrdered(data.places) ? 'PASS' : 'FAIL'}`);
          console.log(`✅ Detección tiempo real: ${isRealTimeDetected === queryObj.expectedRealTime ? 'PASS' : 'FAIL'}`);
          
          resolve();
          
        } catch (error) {
          console.error('❌ Error analizando resultados:', error);
          resolve();
        }
      },
      status: (code) => ({ 
        json: (data) => {
          console.log(`❌ Error ${code}:`, data);
          resolve();
        }
      })
    };

    // Ejecutar la consulta
    handleChatRequest(testReq, mockRes).catch(error => {
      console.error('❌ Error ejecutando consulta:', error.message);
      resolve();
    });
  });
}

// Función para verificar si los lugares están ordenados correctamente por proximidad
function isProperlyOrdered(places) {
  if (!places || places.length <= 1) return true;
  
  for (let i = 1; i < places.length; i++) {
    const prevDistance = places[i-1].distance || 0;
    const currDistance = places[i].distance || 0;
    
    if (prevDistance > currDistance && prevDistance !== 0 && currDistance !== 0) {
      console.log(`⚠️  Orden incorrecto: ${places[i-1].name} (${prevDistance.toFixed(2)}km) > ${places[i].name} (${currDistance.toFixed(2)}km)`);
      return false;
    }
  }
  return true;
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('🚀 INICIANDO PRUEBAS DE PROXIMIDAD Y TIEMPO REAL');
  console.log('=================================================');
  console.log(`📍 Ubicación de prueba: ${testLocation.lat}, ${testLocation.lng} (Bogotá)`);
  console.log(`🎯 Objetivo: Máximo 15 lugares, dentro de 5km, ordenados por proximidad\n`);
  
  for (let i = 0; i < testQueries.length; i++) {
    await runTest(testQueries[i], i);
    
    // Pausa entre pruebas para evitar rate limiting
    if (i < testQueries.length - 1) {
      console.log('\n⏳ Esperando 2 segundos antes de la siguiente prueba...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n🏁 PRUEBAS COMPLETADAS');
  console.log('======================');
  console.log('Revisa los resultados arriba para verificar que:');
  console.log('✅ Cada búsqueda devuelve máximo 15 lugares');
  console.log('✅ Todos los lugares están dentro de 5km');
  console.log('✅ Los lugares están ordenados por proximidad');
  console.log('✅ Las consultas de tiempo real se detectan correctamente');
  
  process.exit(0);
}

// Ejecutar las pruebas
runAllTests().catch(error => {
  console.error('❌ Error en pruebas:', error);
  process.exit(1);
});

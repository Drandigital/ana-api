// debug-geolocation.js
import { 
  calculateDistance, 
  getNearestCity,
  detectUserLocation 
} from './services/geolocationService.js';

console.log('🔍 Debugging Geolocation Service\n');

// Test 1: calculateDistance function
console.log('1. Testing calculateDistance function:');
const cartagenaLat = 10.4236;
const cartagenaLng = -75.5378;
const testLat = 10.4236;
const testLng = -75.5378;

const distance = calculateDistance(cartagenaLat, cartagenaLng, testLat, testLng);
console.log(`Distance between (${cartagenaLat}, ${cartagenaLng}) and (${testLat}, ${testLng}): ${distance} km`);

// Test 2: getNearestCity function  
console.log('\n2. Testing getNearestCity function:');
const nearestCity = getNearestCity(testLat, testLng);
console.log(`Nearest city for (${testLat}, ${testLng}):`, nearestCity);

// Test 3: Test other coordinates
console.log('\n3. Testing Bogotá coordinates:');
const bogotaNearestCity = getNearestCity(4.7110, -74.0721);
console.log(`Nearest city for Bogotá:`, bogotaNearestCity);

// Test 4: Test Medellín coordinates
console.log('\n4. Testing Medellín coordinates:');
const medellinNearestCity = getNearestCity(6.2442, -75.5812);
console.log(`Nearest city for Medellín:`, medellinNearestCity);

// Test 5: detectUserLocation function
console.log('\n5. Testing detectUserLocation function:');
try {
  const detectedLocation = await detectUserLocation({
    lat: testLat,
    lng: testLng
  });
  console.log('Detected location:', detectedLocation);
} catch (error) {
  console.error('Error in detectUserLocation:', error);
}

// Test 6: Check coordinates stored in cities array manually
console.log('\n6. Manual distance calculations:');
const cartagenaStored = { lat: 10.4236, lng: -75.5378 };
const distanceToStoredCartagena = calculateDistance(
  testLat, testLng, 
  cartagenaStored.lat, cartagenaStored.lng
);
console.log(`Distance to stored Cartagena: ${distanceToStoredCartagena} km`);

const bogotaStored = { lat: 4.7110, lng: -74.0721 };
const distanceToBogota = calculateDistance(
  testLat, testLng,
  bogotaStored.lat, bogotaStored.lng
);
console.log(`Distance to Bogotá: ${distanceToBogota} km`);

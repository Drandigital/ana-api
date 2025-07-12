// config/colombianPlacesMapping.js
// Mapeo de lugares turísticos colombianos en múltiples idiomas

export const colombianPlacesMapping = {
  // Ciudades principales
  cities: {
    'cartagena': ['cartagena', 'cartagena de indias', 'cartagena das índias', 'carthagène', 'cartagena di india'],
    'bogota': ['bogota', 'bogotá', 'santa fe de bogota', 'santa fé de bogotá', 'santafé de bogotá'],
    'medellin': ['medellin', 'medellín', 'ciudad de la eterna primavera', 'cidade da eterna primavera'],
    'cali': ['cali', 'santiago de cali', 'capital de la salsa', 'capital da salsa'],
    'barranquilla': ['barranquilla', 'la arenosa', 'puerta de oro', 'porta de ouro'],
    'santa_marta': ['santa marta', 'la perla de américa', 'a pérola da américa', 'perle de l\'amérique'],
    'bucaramanga': ['bucaramanga', 'ciudad bonita', 'cidade bonita', 'belle ville'],
    'pereira': ['pereira', 'la perla del otún', 'a pérola do otún'],
    'manizales': ['manizales', 'ciudad de las puertas abiertas'],
    'armenia': ['armenia', 'ciudad milagro', 'cidade milagre'],
    'cucuta': ['cucuta', 'cúcuta', 'ciudad frontera'],
    'villavicencio': ['villavicencio', 'villavo', 'puerta del llano']
  },

  // Lugares turísticos específicos
  touristPlaces: {
    'islas_del_rosario': [
      // Español
      'islas del rosario', 'isla del rosario', 'archipiélago del rosario', 'islas rosario',
      // Italiano
      'isole del rosario', 'isola del rosario', 'arcipelago del rosario', 'isole rosario',
      // Inglés
      'rosario islands', 'rosary islands', 'rosario island', 'rosary island',
      // Portugués
      'ilhas do rosário', 'ilha do rosário', 'arquipélago do rosário', 'ilhas rosário',
      // Francés
      'îles du rosaire', 'île du rosaire', 'archipel du rosaire', 'îles rosaire'
    ],
    'ciudad_perdida': [
      // Español
      'ciudad perdida', 'teyuna', 'ciudad arqueológica teyuna',
      // Italiano
      'città perduta', 'città perduta di teyuna',
      // Inglés
      'lost city', 'ciudad perdida trek', 'teyuna archaeological site',
      // Portugués
      'cidade perdida', 'cidade perdida de teyuna',
      // Francés
      'cité perdue', 'ville perdue', 'teyuna cité perdue'
    ],
    'cocora_valley': [
      // Español
      'valle de cocora', 'valle del cocora', 'palmas de cera',
      // Italiano
      'valle di cocora', 'valle del cocora', 'palme di cera',
      // Inglés
      'cocora valley', 'wax palm valley', 'cocora palms',
      // Portugués
      'vale de cocora', 'vale do cocora', 'palmeiras de cera',
      // Francés
      'vallée de cocora', 'vallée du cocora', 'palmiers à cire'
    ],
    'caño_cristales': [
      // Español
      'caño cristales', 'río de los cinco colores', 'río más hermoso del mundo',
      // Italiano
      'caño cristales', 'fiume dei cinque colori', 'fiume più bello del mondo',
      // Inglés
      'caño cristales', 'river of five colors', 'liquid rainbow',
      // Portugués
      'caño cristales', 'rio das cinco cores', 'rio mais bonito do mundo',
      // Francés
      'caño cristales', 'rivière aux cinq couleurs', 'plus belle rivière du monde'
    ],
    'tayrona_park': [
      // Español
      'parque tayrona', 'parque nacional natural tayrona', 'cabo san juan',
      // Italiano
      'parco tayrona', 'parco nazionale tayrona', 'capo san juan',
      // Inglés
      'tayrona park', 'tayrona national park', 'cabo san juan beach',
      // Portugués
      'parque tayrona', 'parque nacional tayrona', 'cabo san juan',
      // Francés
      'parc tayrona', 'parc national tayrona', 'cap san juan'
    ],
    'guatape': [
      // Español
      'guatapé', 'piedra del peñol', 'peñón de guatapé', 'pueblo de colores',
      // Italiano
      'guatapé', 'roccia del peñol', 'pietra del peñol', 'paese colorato',
      // Inglés
      'guatape', 'el peñol rock', 'guatape stone', 'colorful town',
      // Portugués
      'guatapé', 'pedra do peñol', 'penedo de guatapé', 'cidade colorida',
      // Francés
      'guatapé', 'rocher du peñol', 'pierre du peñol', 'ville colorée'
    ],
    'salt_cathedral': [
      // Español
      'catedral de sal', 'zipaquirá', 'catedral de sal de zipaquirá',
      // Italiano
      'cattedrale di sale', 'cattedrale del sale di zipaquirá',
      // Inglés
      'salt cathedral', 'zipaquira salt cathedral', 'underground cathedral',
      // Portugués
      'catedral de sal', 'catedral do sal de zipaquirá',
      // Francés
      'cathédrale de sel', 'cathédrale de sel de zipaquirá'
    ],
    'coffee_triangle': [
      // Español
      'triángulo del café', 'eje cafetero', 'región cafetera', 'zona cafetera',
      // Italiano
      'triangolo del caffè', 'regione del caffè', 'zona del caffè',
      // Inglés
      'coffee triangle', 'coffee region', 'coffee cultural landscape',
      // Portugués
      'triângulo do café', 'região cafeeira', 'zona cafeeira',
      // Francés
      'triangle du café', 'région du café', 'zone caféière'
    ],
    'amazonas': [
      // Español
      'amazonas', 'amazonia colombiana', 'selva amazónica', 'leticia',
      // Italiano
      'amazzonia', 'amazzonia colombiana', 'foresta amazzonica',
      // Inglés
      'amazon', 'colombian amazon', 'amazon rainforest', 'leticia',
      // Portugués
      'amazonas', 'amazônia colombiana', 'floresta amazônica',
      // Francés
      'amazonie', 'amazonie colombienne', 'forêt amazonienne'
    ],
    'aeropuerto_cartagena': [
      // Español
      'aeropuerto cartagena', 'aeropuerto de cartagena', 'aeropuerto rafael núñez', 'rafael núñez cartagena',
      // Italiano
      'aeroporto cartagena', 'aeroporto di cartagena', 'aeroporto rafael núñez',
      // Inglés
      'cartagena airport', 'rafael nunez airport', 'cartagena international airport',
      // Portugués
      'aeroporto cartagena', 'aeroporto de cartagena', 'aeroporto rafael núñez',
      // Francés
      'aéroport cartagena', 'aéroport de carthagène', 'aéroport rafael núñez'
    ],
    'aeropuerto_bogota': [
      // Español
      'aeropuerto bogotá', 'aeropuerto de bogotá', 'aeropuerto el dorado', 'el dorado bogotá',
      // Italiano
      'aeroporto bogotá', 'aeroporto di bogotá', 'aeroporto el dorado',
      // Inglés
      'bogota airport', 'el dorado airport', 'bogota international airport',
      // Portugués
      'aeroporto bogotá', 'aeroporto de bogotá', 'aeroporto el dorado',
      // Francés
      'aéroport bogotá', 'aéroport de bogotá', 'aéroport el dorado'
    ],
    'aeropuerto_medellin': [
      // Español
      'aeropuerto medellín', 'aeropuerto de medellín', 'aeropuerto josé maría córdova', 'rionegro aeropuerto',
      // Italiano
      'aeroporto medellín', 'aeroporto di medellín', 'aeroporto josé maría córdova',
      // Inglés
      'medellin airport', 'jose maria cordova airport', 'rionegro airport',
      // Portugués
      'aeroporto medellín', 'aeroporto de medellín', 'aeroporto josé maría córdova',
      // Francés
      'aéroport medellín', 'aéroport de medellín', 'aéroport josé maría córdova'
    ]
  },

  // Funciones de búsqueda
  findPlace: function(query) {
    const lowerQuery = query.toLowerCase();
    
    // Buscar en ciudades
    for (const [key, variants] of Object.entries(this.cities)) {
      if (variants.some(variant => lowerQuery.includes(variant.toLowerCase()))) {
        return {
          type: 'city',
          key: key,
          found: variants.find(variant => lowerQuery.includes(variant.toLowerCase())),
          isInColombia: true
        };
      }
    }
    
    // Buscar en lugares turísticos
    for (const [key, variants] of Object.entries(this.touristPlaces)) {
      if (variants.some(variant => lowerQuery.includes(variant.toLowerCase()))) {
        return {
          type: 'tourist_place',
          key: key,
          found: variants.find(variant => lowerQuery.includes(variant.toLowerCase())),
          isInColombia: true
        };
      }
    }
    
    return null;
  },

  // Función para obtener información contextual
  getContextualInfo: function(place) {
    const contextInfo = {
      'islas_del_rosario': {
        es: 'Las Islas del Rosario son un archipiélago en el Caribe colombiano, cerca de Cartagena.',
        en: 'The Rosario Islands are an archipelago in the Colombian Caribbean, near Cartagena.',
        it: 'Le Isole del Rosario sono un arcipelago nel Mar dei Caraibi colombiano, vicino a Cartagena.',
        pt: 'As Ilhas do Rosário são um arquipélago no Caribe colombiano, perto de Cartagena.',
        fr: 'Les Îles du Rosaire sont un archipel dans les Caraïbes colombiennes, près de Carthagène.'
      },
      'ciudad_perdida': {
        es: 'Ciudad Perdida (Teyuna) es un sitio arqueológico precolombino en la Sierra Nevada de Santa Marta, Colombia.',
        en: 'Lost City (Teyuna) is a pre-Columbian archaeological site in the Sierra Nevada de Santa Marta, Colombia.',
        it: 'Città Perduta (Teyuna) è un sito archeologico precolombiano nella Sierra Nevada de Santa Marta, Colombia.',
        pt: 'Cidade Perdida (Teyuna) é um sítio arqueológico pré-colombiano na Sierra Nevada de Santa Marta, Colômbia.',
        fr: 'Cité Perdue (Teyuna) est un site archéologique précolombien dans la Sierra Nevada de Santa Marta, Colombie.'
      },
      'tayrona_park': {
        es: 'El Parque Nacional Natural Tayrona está ubicado en la costa caribeña de Colombia, cerca de Santa Marta.',
        en: 'Tayrona National Natural Park is located on the Caribbean coast of Colombia, near Santa Marta.',
        it: 'Il Parco Nazionale Naturale Tayrona si trova sulla costa caraibica della Colombia, vicino a Santa Marta.',
        pt: 'O Parque Nacional Natural Tayrona está localizado na costa caribenha da Colômbia, perto de Santa Marta.',
        fr: 'Le Parc National Naturel Tayrona est situé sur la côte caraïbe de la Colombie, près de Santa Marta.'
      },
      'aeropuerto_cartagena': {
        es: 'El Aeropuerto Internacional Rafael Núñez está ubicado en Cartagena de Indias, Colombia. Es el principal aeropuerto de la región Caribe.',
        en: 'Rafael Núñez International Airport is located in Cartagena de Indias, Colombia. It is the main airport in the Caribbean region.',
        it: 'L\'Aeroporto Internazionale Rafael Núñez si trova a Cartagena de Indias, Colombia. È il principale aeroporto della regione caraibica.',
        pt: 'O Aeroporto Internacional Rafael Núñez está localizado em Cartagena de Indias, Colômbia. É o principal aeroporto da região caribenha.',
        fr: 'L\'Aéroport International Rafael Núñez est situé à Carthagène des Indes, Colombie. C\'est le principal aéroport de la région des Caraïbes.'
      },
      'aeropuerto_bogota': {
        es: 'El Aeropuerto Internacional El Dorado está ubicado en Bogotá, Colombia. Es el aeropuerto más importante del país.',
        en: 'El Dorado International Airport is located in Bogotá, Colombia. It is the most important airport in the country.',
        it: 'L\'Aeroporto Internazionale El Dorado si trova a Bogotá, Colombia. È l\'aeroporto più importante del paese.',
        pt: 'O Aeroporto Internacional El Dorado está localizado em Bogotá, Colômbia. É o aeroporto mais importante do país.',
        fr: 'L\'Aéroport International El Dorado est situé à Bogotá, Colombie. C\'est l\'aéroport le plus important du pays.'
      },
      'aeropuerto_medellin': {
        es: 'El Aeropuerto Internacional José María Córdova está ubicado en Rionegro, cerca de Medellín, Colombia.',
        en: 'José María Córdova International Airport is located in Rionegro, near Medellín, Colombia.',
        it: 'L\'Aeroporto Internazionale José María Córdova si trova a Rionegro, vicino a Medellín, Colombia.',
        pt: 'O Aeroporto Internacional José María Córdova está localizado em Rionegro, perto de Medellín, Colômbia.',
        fr: 'L\'Aéroport International José María Córdova est situé à Rionegro, près de Medellín, Colombie.'
      }
      // Agregar más lugares según sea necesario
    };

    return contextInfo[place.key] || null;
  }
};

export default colombianPlacesMapping;

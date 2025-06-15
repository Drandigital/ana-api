// utils/speechProcessor.js

/**
 * Process text to make it more suitable for speech synthesis
 * This makes the text more natural when spoken by TTS systems
 * 
 * @param {string} text - Original text to process
 * @returns {string} - Processed text optimized for speech
 */
export function processTextForSpeech(text) {
  if (!text) return '';
  
  let processedText = text;
  
  // Replace abbreviations with their spoken form
  const abbreviations = {
    'Dr.': 'Doctor',
    'St.': 'Street',
    'Mr.': 'Mister',
    'Mrs.': 'Misses',
    'Ms.': 'Miss',
    'Prof.': 'Professor',
    'No.': 'Number',
    'vs.': 'versus',
    'etc.': 'etcetera',
    'i.e.': 'that is',
    'e.g.': 'for example',
    'USD': 'U S dollars',
    'NASA': 'N A S A',
    'FBI': 'F B I',
    'CIA': 'C I A',
    'km': 'kilometers',
    'm': 'meters',
    'km/h': 'kilometers per hour',
    'COP': 'Colombian pesos',
    'USD': 'U S dollars',
    'EUR': 'euros',
  };
  
  // Apply common abbreviation replacements
  Object.keys(abbreviations).forEach(abbr => {
    const regex = new RegExp(`\\b${abbr}\\b`, 'g');
    processedText = processedText.replace(regex, abbreviations[abbr]);
  });
  
  // Handle numbers and special formatting
  processedText = processedText
    // Format prices with currency
    .replace(/\$(\d+)\.(\d+)/g, '$1 dollars and $2 cents')
    .replace(/\$(\d+)/g, '$1 dollars')
    // Add pauses after sentences for better rhythm
    .replace(/\.\s+/g, '. <break time="500ms"/> ')
    .replace(/\?\s+/g, '? <break time="500ms"/> ')
    .replace(/\!\s+/g, '! <break time="500ms"/> ')
    // Add emphasis to important tourism keywords
    .replace(/\b(must-see|amazing|beautiful|spectacular)\b/gi, '<emphasis>$1</emphasis>')
    // Convert dashes in phone numbers to pauses
    .replace(/(\d)-(\d)/g, '$1 $2')
    // Add slight pause after commas
    .replace(/,\s+/g, ', <break time="200ms"/> ');
  
  return processedText;
}

/**
 * Detects if text contains content that would benefit from being read aloud
 * @param {string} text - Text to analyze
 * @returns {boolean} - True if the content would benefit from speech
 */
export function isSpeechSuitable(text) {
  if (!text) return false;
  
  // Check for minimum length (at least 50 characters)
  if (text.length < 50) return false;
  
  // Check for descriptive content about places
  const tourismKeywords = [
    'visit', 'visitar',
    'attractions', 'atracciones',
    'beautiful', 'hermoso', 'hermosa',
    'experience', 'experiencia',
    'discover', 'descubrir',
    'enjoy', 'disfrutar',
    'explore', 'explorar',
    'adventure', 'aventura',
    'historic', 'histórico', 'historico',
    'recommend', 'recomendar',
    'famous', 'famoso', 'famosa',
    'popular',
    'traditional', 'tradicional',
    'authentic', 'auténtico', 'autentico'
  ];
  
  // Check if text contains tourism keywords
  for (const keyword of tourismKeywords) {
    if (text.toLowerCase().includes(keyword)) {
      return true;
    }
  }
  
  // Check for paragraphs (indication of detailed content)
  if (text.split('\n').length > 1) {
    return true;
  }
  
  return false;
}
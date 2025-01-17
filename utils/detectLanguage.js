import { franc } from 'franc';
import iso6393To1 from 'iso-639-3-to-1';

export function detectLanguage(text) {
  const langCode3 = franc(text);
  
  if (langCode3 === 'und') {
    return 'UNKNOWN'; // Cuando no se puede detectar el idioma
  }
  
  // Obtener el código ISO639-1 correspondiente al código de tres letras
  const langCode1 = iso6393To1[langCode3];
  
  // Si se encuentra un código de dos letras, retornar en mayúsculas
  if (langCode1) {
    return langCode1.toUpperCase();
  }
  
  // Fallback: retornar el código de tres letras en mayúsculas si no se encuentra
  return langCode3.toUpperCase();
}

// utils/dateParser.js (ES Modules)

/**
 * Intenta parsear una fecha desde un mensaje de usuario.
 * Permite:
 *  - dd-mm-yyyy
 *  - dd/mm/yyyy
 *  - Formato de texto en español, por ejemplo: "20 de enero de 2025".
 * 
 * Retorna la fecha en formato YYYY-MM-DD, o null si no logra parsear.
 */
export function parseUserDate(userMessage) {
  // 1. Primero buscamos formatos numéricos (dd-mm-yyyy o dd/mm/yyyy)
  const numericRegex = /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/;
  const numericMatch = userMessage.match(numericRegex);
  if (numericMatch) {
    const day = numericMatch[1].padStart(2, '0');
    const month = numericMatch[2].padStart(2, '0');
    const year = numericMatch[3];
    return `${year}-${month}-${day}`;
  }

  // 2. Formato "20 de enero de 2025"
  const textRegex = /(\d{1,2})\s+de\s+([a-zA-Záéíóúñ]+)\s+(?:del\s+|de\s+)?(\d{4})/i;
  const textMatch = userMessage.match(textRegex);

  if (textMatch) {
    const day = textMatch[1].padStart(2, '0');
    const spanishMonth = textMatch[2].toLowerCase();
    const year = textMatch[3];

    const monthsMap = {
      'enero': '01',
      'febrero': '02',
      'marzo': '03',
      'abril': '04',
      'mayo': '05',
      'junio': '06',
      'julio': '07',
      'agosto': '08',
      'septiembre': '09',
      'setiembre': '09',
      'octubre': '10',
      'noviembre': '11',
      'diciembre': '12'
    };

    const monthNumber = monthsMap[spanishMonth];
    if (!monthNumber) {
      return null;
    }
    return `${year}-${monthNumber}-${day}`;
  }

  // 3. Si no coincidió ninguno de los patrones, regresamos null
  return null;
}

// utils/dateParser.js (ES Modules)

/**
 * Parses dates from a user message in various formats
 * @param {string} userMessage - Message that may contain date references
 * @returns {string|null} - Date in YYYY-MM-DD format, or null if not found
 */
export function parseUserDate(userMessage) {
  if (!userMessage) return null;

  // 1. Try numerical formats (dd-mm-yyyy or dd/mm/yyyy)
  const numericalFormats = [
    // DD/MM/YYYY
    /(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{4})/,
    // MM/DD/YYYY (US format)
    /(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{4})/,
    // YYYY/MM/DD
    /(\d{4})[/\-\.](\d{1,2})[/\-\.](\d{1,2})/,
    // YYYY-MM-DD (ISO format)
    /(\d{4})-(\d{1,2})-(\d{1,2})/
  ];

  for (const regex of numericalFormats) {
    const match = userMessage.match(regex);
    if (match) {
      // Check which format matched based on the first group
      if (match[1].length === 4) {
        // YYYY-MM-DD format
        const year = match[1];
        const month = match[2].padStart(2, '0');
        const day = match[3].padStart(2, '0');
        return `${year}-${month}-${day}`;
      } else {
        // Assume DD/MM/YYYY format (international standard)
        // If MM > 12, this is definitely DD/MM, otherwise we make an educated guess
        const firstNumber = parseInt(match[1], 10);
        const secondNumber = parseInt(match[2], 10);
        
        // If first number > 12, it's definitely a day (DD/MM)
        // If second number > 12, it's definitely MM/DD
        // Otherwise we default to DD/MM format (international)
        let day, month;
        
        if (firstNumber > 12) {
          // Definitely DD/MM
          day = match[1];
          month = match[2];
        } else if (secondNumber > 12) {
          // Definitely MM/DD
          month = match[1];
          day = match[2];
        } else {
          // Default to DD/MM
          day = match[1];
          month = match[2];
        }
        
        const year = match[3];
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
  }

  // 2. Try Spanish text format "20 de enero de 2025"
  const spanishDateRegex = /(\d{1,2})\s+de\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)\s+(?:del?\s+)?(\d{4})/i;
  const spanishMatch = userMessage.match(spanishDateRegex);

  if (spanishMatch) {
    const day = spanishMatch[1].padStart(2, '0');
    const spanishMonth = spanishMatch[2].toLowerCase();
    const year = spanishMatch[3];

    const spanishMonthsMap = {
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

    const monthNumber = spanishMonthsMap[spanishMonth];
    if (monthNumber) {
      return `${year}-${monthNumber}-${day}`;
    }
  }

  // 3. Try English text format "January 20, 2025" or "20 January 2025"
  const englishDateRegex1 = /([a-zA-Z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i;
  const englishDateRegex2 = /(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+),?\s+(\d{4})/i;
  
  const englishMatch1 = userMessage.match(englishDateRegex1);
  const englishMatch2 = userMessage.match(englishDateRegex2);
  
  if (englishMatch1 || englishMatch2) {
    let month, day, year;
    
    if (englishMatch1) {
      month = englishMatch1[1];
      day = englishMatch1[2];
      year = englishMatch1[3];
    } else {
      day = englishMatch2[1];
      month = englishMatch2[2];
      year = englishMatch2[3];
    }
    
    const englishMonthsMap = {
      'january': '01',
      'february': '02',
      'march': '03',
      'april': '04',
      'may': '05',
      'june': '06',
      'july': '07',
      'august': '08',
      'september': '09',
      'october': '10',
      'november': '11',
      'december': '12',
      'jan': '01',
      'feb': '02',
      'mar': '03',
      'apr': '04',
      'jun': '06',
      'jul': '07',
      'aug': '08',
      'sep': '09',
      'oct': '10',
      'nov': '11',
      'dec': '12'
    };
    
    const monthNumber = englishMonthsMap[month.toLowerCase()];
    if (monthNumber) {
      return `${year}-${monthNumber}-${day.padStart(2, '0')}`;
    }
  }

  // 4. Try to find future dates like "tomorrow", "next week", "in 3 days"
  const relativeDateTerms = [
    { regex: /\b(hoy|today)\b/i, days: 0 },
    { regex: /\b(mañana|tomorrow)\b/i, days: 1 },
    { regex: /\b(pasado mañana|day after tomorrow)\b/i, days: 2 },
    { regex: /\ben\s+(\d+)\s+(días|days)\b/i, calculateDays: (match) => parseInt(match[1], 10) },
    { regex: /\b(próxima semana|next week)\b/i, days: 7 },
    { regex: /\ben\s+(\d+)\s+(semanas|weeks)\b/i, calculateDays: (match) => parseInt(match[1], 10) * 7 },
    { regex: /\b(próximo mes|next month)\b/i, days: 30 }
  ];

  for (const term of relativeDateTerms) {
    const match = userMessage.match(term.regex);
    if (match) {
      const days = term.days !== undefined ? term.days : term.calculateDays(match);
      const date = new Date();
      date.setDate(date.getDate() + days);
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    }
  }

  // 5. No valid date format found
  return null;
}

/**
 * Validates if a date string is in a valid format and represents a valid date
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidDate(dateString) {
  if (!dateString) return false;
  
  // Check format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  
  // Parse the date
  const parts = dateString.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  // Check the ranges
  if (year < 2000 || year > 2100 || month === 0 || month > 12) return false;
  
  const monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  // Adjust for leap years
  if (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)) {
    monthLength[1] = 29;
  }
  
  // Check the day
  return day > 0 && day <= monthLength[month - 1];
}

/**
 * Gets the date for tomorrow
 * @returns {string} - Tomorrow's date in YYYY-MM-DD format
 */
export function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}
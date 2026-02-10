/**
 * Helper functions for handling month and year in releases
 */

export type Language = "ES" | "EN" | "PT";

const monthNames: Record<Language, string[]> = {
  ES: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
  EN: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  PT: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
};

/**
 * Build month_date string in format YYYY-MM-01
 * @param year - Year number (e.g., 2026)
 * @param monthNumber - Month number 1-12
 * @returns Date string in format YYYY-MM-01
 */
export function buildMonthDate(year: number, monthNumber: number): string {
  if (monthNumber < 1 || monthNumber > 12) {
    throw new Error("Month must be between 1 and 12");
  }
  const paddedMonth = String(monthNumber).padStart(2, "0");
  return `${year}-${paddedMonth}-01`;
}

/**
 * Format month label for display
 * @param lang - Language code (ES, EN, PT)
 * @param year - Year number (e.g., 2026)
 * @param monthNumber - Month number 1-12
 * @returns Formatted month label (e.g., "Nov 2025", "Feb 2026")
 */
export function formatMonthLabel(lang: Language, year: number, monthNumber: number): string {
  if (monthNumber < 1 || monthNumber > 12) {
    throw new Error("Month must be between 1 and 12");
  }
  const monthName = monthNames[lang][monthNumber - 1];
  return `${monthName} ${year}`;
}

/**
 * Parse month_date string to get year and month number
 * @param monthDate - Date string in format YYYY-MM-DD
 * @returns Object with year and monthNumber
 */
export function parseMonthDate(monthDate: string): { year: number; monthNumber: number } {
  try {
    const [yearStr, monthStr] = monthDate.split("-");
    const year = parseInt(yearStr, 10);
    const monthNumber = parseInt(monthStr, 10);
    
    if (isNaN(year) || isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      throw new Error("Invalid date format");
    }
    
    return { year, monthNumber };
  } catch (err) {
    throw new Error("Invalid month_date format. Expected YYYY-MM-DD");
  }
}

/**
 * Try to parse month_label to extract year and month number
 * This is a fallback if month_date is not available
 * @param monthLabel - Text like "Nov 2025", "Feb 2026"
 * @returns Object with year and monthNumber, or null if parsing fails
 */
export function tryParseMonthLabel(monthLabel: string): { year: number; monthNumber: number } | null {
  if (!monthLabel.trim()) {
    return null;
  }

  const parts = monthLabel.trim().split(/\s+/);
  if (parts.length !== 2) {
    return null;
  }

  const [monthStr, yearStr] = parts;
  const year = parseInt(yearStr, 10);

  if (isNaN(year) || year < 1900 || year > 2100) {
    return null;
  }

  // Try to find month number from all languages
  for (const lang of ["ES", "EN", "PT"] as const) {
    const monthIndex = monthNames[lang].findIndex(
      (m) => m.toLowerCase() === monthStr.toLowerCase()
    );
    if (monthIndex !== -1) {
      return { year, monthNumber: monthIndex + 1 };
    }
  }

  return null;
}

/**
 * Get list of available years for month selector (current year ± 3)
 */
export function getAvailableYears(): number[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const years: number[] = [];

  for (let i = currentYear - 3; i <= currentYear + 3; i++) {
    years.push(i);
  }

  return years.sort((a, b) => b - a); // Descending order
}

/**
 * Get month names for a specific language
 */
export function getMonthNames(lang: Language): string[] {
  return monthNames[lang];
}

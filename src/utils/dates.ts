export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

// Add this to your utils/dates.ts file

/**
 * Format a date object to a display string (e.g., "DD MMM YYYY" or as per locale)
 */
export function formatDateForDisplay(date: Date): string {
  // Option 1: Simple YYYY-MM-DD format
  return date.toISOString().split('T')[0];
  
  // Option 2: More readable format (DD/MM/YYYY)
  // return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  
  // Option 3: Using Intl for locale-aware formatting
  // return new Intl.DateTimeFormat('en-IN', {
  //   day: '2-digit',
  //   month: '2-digit',
  //   year: 'numeric'
  // }).format(date);
}
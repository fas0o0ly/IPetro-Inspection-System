// src/utils/dateUtils.js

/**
 * Format date from database to input field (YYYY-MM-DD)
 * Handles timezone issues by using local date
 */
export const formatDateForInput = (dateValue) => {
  if (!dateValue) return '';
  
  // If already in YYYY-MM-DD format, return as-is
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  
  // Handle Date object or ISO string
  const date = new Date(dateValue);
  
  // Check if valid date
  if (isNaN(date.getTime())) return '';
  
  // Get year, month, day in LOCAL timezone (not UTC)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 */
export const getTodayForInput = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Format date from database for display
 */
export const formatDateForDisplay = (dateValue, format = 'MMM dd, yyyy') => {
  if (!dateValue) return '-';
  
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return '-';
  
  // Use date-fns if available, or simple formatting
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  
  return `${month} ${day}, ${year}`;
};
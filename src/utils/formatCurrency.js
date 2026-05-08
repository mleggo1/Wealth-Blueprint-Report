// Format number with commas for display
export const formatNumberWithCommas = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('en-AU');
};

// Parse comma-formatted string back to number
export const parseFormattedNumber = (value) => {
  if (!value) return 0;
  const cleaned = value.toString().replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};


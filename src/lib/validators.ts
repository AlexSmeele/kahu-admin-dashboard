/**
 * Validates SQL identifiers (table names, column names, etc.)
 */
export const validateSQLIdentifier = (value: string): { valid: boolean; error?: string } => {
  if (!value) return { valid: false, error: "Field name is required" };
  if (value.length > 63) return { valid: false, error: "Must be 63 characters or less" };
  if (/^[0-9]/.test(value)) return { valid: false, error: "Cannot start with a number" };
  if (!/^[a-z][a-z0-9_]*$/.test(value)) {
    return { valid: false, error: "Only lowercase letters, numbers, and underscores allowed" };
  }
  
  // Check reserved keywords
  const reserved = ['select', 'from', 'where', 'table', 'user', 'order', 'group', 'primary', 'key', 'references', 'constraint', 'default', 'index', 'create', 'drop', 'alter'];
  if (reserved.includes(value.toLowerCase())) {
    return { valid: false, error: "Cannot use SQL reserved keyword" };
  }
  
  return { valid: true };
};

/**
 * Sanitizes a string to be a valid SQL identifier
 */
export const sanitizeSQLIdentifier = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/\s+/g, '_')  // Replace spaces with underscores
    .replace(/[^a-z0-9_]/g, '')  // Remove invalid characters
    .replace(/^[0-9]+/, '')  // Remove leading numbers
    .substring(0, 63);  // Limit length
};

// metadata-studio/naming/case-helpers.ts

/**
 * Case Conversion Helpers
 * 
 * Pure functions for converting between naming conventions.
 * SSOT: All conversions assume input is valid snake_case.
 */

/**
 * Convert snake_case to camelCase
 * 
 * @example
 * snakeToCamel("receipt_outstanding_amount") // "receiptOutstandingAmount"
 * snakeToCamel("user_id") // "userId"
 */
export function snakeToCamel(snake: string): string {
  return snake.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

/**
 * Convert snake_case to PascalCase
 * 
 * @example
 * snakeToPascal("receipt_outstanding_amount") // "ReceiptOutstandingAmount"
 * snakeToPascal("user_id") // "UserId"
 */
export function snakeToPascal(snake: string): string {
  const camel = snakeToCamel(snake);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Convert snake_case to UPPER_SNAKE
 * 
 * @example
 * snakeToUpperSnake("receipt_outstanding_amount") // "RECEIPT_OUTSTANDING_AMOUNT"
 * snakeToUpperSnake("user_id") // "USER_ID"
 */
export function snakeToUpperSnake(snake: string): string {
  return snake.toUpperCase();
}

/**
 * Convert snake_case to kebab-case
 * 
 * @example
 * snakeToKebab("receipt_outstanding_amount") // "receipt-outstanding-amount"
 * snakeToKebab("user_id") // "user-id"
 */
export function snakeToKebab(snake: string): string {
  return snake.replace(/_/g, '-');
}

/**
 * Validate that a string is valid snake_case
 * 
 * @example
 * isValidSnakeCase("receipt_outstanding_amount") // true
 * isValidSnakeCase("receiptOutstandingAmount") // false
 * isValidSnakeCase("Receipt_Outstanding_Amount") // false
 */
export function isValidSnakeCase(value: string): boolean {
  return /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/.test(value);
}

/**
 * Convert any casing to snake_case (best-effort)
 * 
 * @example
 * toSnakeCase("receiptOutstandingAmount") // "receipt_outstanding_amount"
 * toSnakeCase("ReceiptOutstandingAmount") // "receipt_outstanding_amount"
 * toSnakeCase("RECEIPT_OUTSTANDING_AMOUNT") // "receipt_outstanding_amount"
 * toSnakeCase("receipt-outstanding-amount") // "receipt_outstanding_amount"
 */
export function toSnakeCase(value: string): string {
  return value
    // Handle camelCase/PascalCase: insert _ before capitals
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    // Replace kebab with underscore
    .replace(/-/g, '_')
    // Lowercase everything
    .toLowerCase()
    // Remove duplicate underscores
    .replace(/__+/g, '_')
    // Trim leading/trailing underscores
    .replace(/^_+|_+$/g, '');
}

/**
 * Convert camelCase to snake_case
 * 
 * @example
 * camelToSnake("receiptOutstandingAmount") // "receipt_outstanding_amount"
 * camelToSnake("userId") // "user_id"
 */
export function camelToSnake(camel: string): string {
  return camel
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase();
}

/**
 * Convert PascalCase to snake_case
 * 
 * @example
 * pascalToSnake("ReceiptOutstandingAmount") // "receipt_outstanding_amount"
 * pascalToSnake("UserId") // "user_id"
 */
export function pascalToSnake(pascal: string): string {
  return pascal
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase();
}

/**
 * Convert kebab-case to snake_case
 * 
 * @example
 * kebabToSnake("receipt-outstanding-amount") // "receipt_outstanding_amount"
 * kebabToSnake("user-id") // "user_id"
 */
export function kebabToSnake(kebab: string): string {
  return kebab.replace(/-/g, '_');
}


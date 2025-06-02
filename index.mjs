/* eslint-disable functional/immutable-data -- Parameter reassignments are for validation only, not mutations */
/**
 * Grocy - A JavaScript wrapper for the Grocy REST API
 *
 * Authentication is done via API keys (header *GROCY-API-KEY* or same named query parameter)
 *
 * Note: The eslint-disable above allows parameter reassignment in validation functions only.
 * This is a safe pattern as we're not mutating objects, just reassigning the parameter
 * to its validated value for cleaner code. All data structures remain immutable.
 */

import validator from 'validator';

// Validation helper functions following immutable patterns

/**
 * Security Note: Input Sanitization Strategy
 *
 * This library is a REST API client that sends JSON payloads to the Grocy server.
 * Security considerations:
 *
 * 1. SQL Injection: Not a concern here as this library doesn't construct SQL queries.
 *    The Grocy server is responsible for parameterized queries.
 *
 * 2. XSS Prevention: We sanitize fields that are likely to be displayed in HTML:
 *    - User-facing text fields (names, descriptions, notes) are escaped
 *    - Configuration values (URLs, API keys, file paths) are NOT sanitized
 *    - IDs and technical fields are NOT sanitized
 *
 * 3. The sanitize option in validateString() controls this behavior:
 *    - sanitize: true (default) - Escapes HTML entities for XSS prevention
 *    - sanitize: false - Returns raw input for technical fields
 *
 * This balanced approach prevents XSS while preserving functionality.
 */

/**
 * Validates that a value is a positive integer
 * @param {*} value - The value to validate
 * @param {string} fieldName - The name of the field for error messages
 * @returns {number} - The validated number
 * @throws {Error} - If the value is not a positive integer
 */
function validateId(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw Object.freeze(new Error(`${fieldName} must be a positive integer`));
  }
  return value;
}

/**
 * Validates that a value is a non-negative number
 * @param {*} value - The value to validate
 * @param {string} fieldName - The name of the field for error messages
 * @param {Object} options - Validation options
 * @param {number} options.min - Minimum allowed value (default: 0)
 * @param {number} options.max - Maximum allowed value (optional)
 * @returns {number} - The validated number
 * @throws {Error} - If the value is not a valid number
 */
function validateNumber(value, fieldName, options = {}) {
  const { min = 0, max } = Object.freeze(options);

  if (typeof value !== 'number' || isNaN(value)) {
    throw Object.freeze(new Error(`${fieldName} must be a valid number`));
  }

  if (value < min) {
    throw Object.freeze(new Error(`${fieldName} must be at least ${min}`));
  }

  if (max !== undefined && value > max) {
    throw Object.freeze(new Error(`${fieldName} must be at most ${max}`));
  }

  return value;
}

/**
 * Validates that a value is a string
 * @param {*} value - The value to validate
 * @param {string} fieldName - The name of the field for error messages
 * @param {Object} options - Validation options
 * @param {boolean} options.required - Whether the string is required (default: true)
 * @param {number} options.maxLength - Maximum string length (default: 255)
 * @param {number} options.minLength - Minimum string length (optional)
 * @param {boolean} options.sanitize - Whether to sanitize for XSS (default: true)
 * @returns {string} - The validated and optionally sanitized string
 * @throws {Error} - If the value is not a valid string
 */
function validateString(value, fieldName, options = {}) {
  const { required = true, maxLength = 255, minLength, sanitize = true } = Object.freeze(options);

  // Check type first
  if (value !== null && value !== undefined && typeof value !== 'string') {
    throw Object.freeze(new Error(`${fieldName} must be a string`));
  }

  if (required && (!value || !value.trim())) {
    throw Object.freeze(new Error(`${fieldName} is required and must be non-empty`));
  }

  if (!required && !value) {
    return value || '';
  }

  const trimmedLength = value.trim().length;

  if (minLength !== undefined && trimmedLength < minLength) {
    throw Object.freeze(new Error(`${fieldName} must be at least ${minLength} characters`));
  }

  if (trimmedLength > maxLength) {
    throw Object.freeze(new Error(`${fieldName} must not exceed ${maxLength} characters`));
  }

  // Apply XSS prevention by escaping HTML entities
  // This prevents script injection while preserving the string for database storage
  // The sanitize option can be disabled for fields that need raw input (e.g., passwords)
  return sanitize ? validator.escape(value) : value;
}

/**
 * Validates that a value is a valid date
 * @param {*} value - The value to validate (Date object or ISO string)
 * @param {string} fieldName - The name of the field for error messages
 * @returns {string} - The validated date string
 * @throws {Error} - If the value is not a valid date
 */
function validateDate(value, fieldName) {
  if (!value) {
    throw Object.freeze(new Error(`${fieldName} is required`));
  }

  if (value instanceof Date) {
    return value.toISOString();
  } else if (typeof value === 'string') {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw Object.freeze(new Error(`${fieldName} is not a valid date`));
    }
    // Return original string if it's valid
    return value;
  } else {
    throw Object.freeze(new Error(`${fieldName} must be a Date object or date string`));
  }
}

/**
 * Validates an optional ID value
 * @param {*} value - The value to validate
 * @param {string} fieldName - The name of the field for error messages
 * @returns {number|null} - The validated number or null
 * @throws {Error} - If the value is provided but not a positive integer
 */
function validateOptionalId(value, fieldName) {
  if (value === null || value === undefined) {
    return null;
  }
  return validateId(value, fieldName);
}

/**
 * Validates an optional number value
 * @param {*} value - The value to validate
 * @param {string} fieldName - The name of the field for error messages
 * @param {Object} options - Validation options
 * @returns {number|null} - The validated number or null
 * @throws {Error} - If the value is provided but not a valid number
 */
function validateOptionalNumber(value, fieldName, options = {}) {
  if (value === null || value === undefined) {
    return null;
  }
  return validateNumber(value, fieldName, options);
}

/**
 * Validates an optional date value
 * @param {*} value - The value to validate
 * @param {string} fieldName - The name of the field for error messages
 * @returns {string|null} - The validated date string or null
 * @throws {Error} - If the value is provided but not a valid date
 */
function validateOptionalDate(value, fieldName) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return validateDate(value, fieldName);
}

/**
 * Validates an optional string value
 * @param {*} value - The value to validate
 * @param {string} fieldName - The name of the field for error messages
 * @param {Object} options - Validation options (including sanitize)
 * @returns {string|null} - The validated and optionally sanitized string or null
 * @throws {Error} - If the value is provided but not a valid string
 */
function validateOptionalString(value, fieldName, options = {}) {
  if (value === null || value === undefined) {
    return null;
  }
  return validateString(value, fieldName, { ...options, required: false });
}

/**
 * Validates a boolean value
 * @param {*} value - The value to validate
 * @param {string} fieldName - The name of the field for error messages
 * @returns {boolean} - The validated boolean
 * @throws {Error} - If the value is not a boolean
 */
function validateBoolean(value, fieldName) {
  if (typeof value !== 'boolean') {
    throw Object.freeze(new Error(`${fieldName} must be a boolean`));
  }
  return value;
}

/**
 * Validates an array value
 * @param {*} value - The value to validate
 * @param {string} fieldName - The name of the field for error messages
 * @param {Object} options - Validation options
 * @param {boolean} options.required - Whether the array is required (default: true)
 * @param {Function} options.itemValidator - Optional validator for array items
 * @returns {Array} - The validated array (frozen)
 * @throws {Error} - If the value is not a valid array
 */
function validateArray(value, fieldName, options = {}) {
  const { required = true, itemValidator } = Object.freeze(options);

  if (required && !Array.isArray(value)) {
    throw Object.freeze(new Error(`${fieldName} must be an array`));
  }

  if (!required && !value) {
    return Object.freeze([]);
  }

  if (!Array.isArray(value)) {
    throw Object.freeze(new Error(`${fieldName} must be an array`));
  }

  if (itemValidator) {
    const validatedItems = value.map((item, index) =>
      itemValidator(item, `${fieldName}[${index}]`)
    );
    return Object.freeze(validatedItems);
  }

  return Object.freeze([...value]);
}

/**
 * Grocy API client for Node.js
 * @class Grocy
 */
export default class Grocy {
  /**
   * @param {string} baseUrl - The base URL of your Grocy instance
   * @param {string} apiKey - Your Grocy API key
   */
  constructor(baseUrl, apiKey = null) {
    // Validate inputs using immutable validation functions
    // Base URLs should not be sanitized as they are configuration values, not user input
    const validatedBaseUrl = validateString(baseUrl, 'Base URL', { minLength: 1, sanitize: false });
    // API keys should not be sanitized as they need exact values
    const validatedApiKey = validateOptionalString(apiKey, 'API key', {
      minLength: 1,
      sanitize: false,
    });

    // Immutable assignment
    this.baseUrl = Object.freeze(
      validatedBaseUrl.endsWith('/api') ? validatedBaseUrl : `${validatedBaseUrl}/api`
    );
    this.apiKey = validatedApiKey ? Object.freeze(validatedApiKey) : null;
  }

  /**
   * Set or update the API key
   * @param {string} apiKey - Your Grocy API key
   */
  setApiKey(apiKey) {
    // Validate input using immutable validation function
    // API keys should not be sanitized as they need exact values
    const validatedApiKey = validateOptionalString(apiKey, 'API key', {
      minLength: 1,
      sanitize: false,
    });

    // Immutable assignment
    this.apiKey = validatedApiKey ? Object.freeze(validatedApiKey) : null;
  }

  /**
   * Make a request to the Grocy API
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} data - Request data for POST/PUT requests
   * @param {Object} queryParams - URL query parameters
   * @returns {Promise<Object>} - Response data
   */
  async request(endpoint, method = 'GET', data = null, queryParams = {}) {
    if (!this.apiKey) {
      throw new Error('API key is required. Use setApiKey() to set it.');
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);

    // Add query parameters if provided
    if (queryParams && Object.keys(queryParams).length > 0) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // eslint-disable-next-line functional/immutable-data
          value.forEach((v) => url.searchParams.append(`${key}[]`, v));
        } else if (value !== undefined && value !== null) {
          // eslint-disable-next-line functional/immutable-data
          url.searchParams.append(key, value.toString());
        }
      });
    }

    const options = Object.freeze({
      method,
      headers: Object.freeze({
        'GROCY-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      }),
      ...(data && (method === 'POST' || method === 'PUT') && { body: JSON.stringify(data) }),
    });

    try {
      const response = await fetch(url, options);

      // Handle 204 No Content responses consistently
      if (response.status === 204) {
        return Object.freeze({ success: true });
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const jsonData = await response.json();

        if (!response.ok) {
          throw new Error(jsonData.error_message || `HTTP error! status: ${response.status}`);
        }

        return Object.freeze(jsonData);
      } else if (contentType && contentType.includes('text/calendar')) {
        const textData = await response.text();
        return Object.freeze({ calendar: textData });
      } else if (response.ok) {
        // Handle binary responses or other non-JSON responses consistently
        return Object.freeze({ success: true, response });
      }

      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      throw new Error(`Grocy API request failed: ${error.message}`);
    }
  }

  // System endpoints

  /**
   * Get information about the installed Grocy version
   * @returns {Promise<Object>} - System information
   */
  async getSystemInfo() {
    return this.request('/system/info');
  }

  /**
   * Get the time when the database was last changed
   * @returns {Promise<Object>} - Database last changed time
   */
  async getDbChangedTime() {
    return this.request('/system/db-changed-time');
  }

  /**
   * Get all config settings
   * @returns {Promise<Object>} - Config settings
   */
  async getConfig() {
    return this.request('/system/config');
  }

  /**
   * Get the current server time
   * @param {number} offset - Offset of timestamp in seconds
   * @returns {Promise<Object>} - Server time information
   */
  async getTime(offset = null) {
    const params = offset !== null ? { offset } : {};
    return this.request('/system/time', 'GET', null, params);
  }

  // Stock endpoints

  /**
   * Get all products currently in stock
   * @returns {Promise<Array>} - Products in stock
   */
  async getStock() {
    return this.request('/stock');
  }

  /**
   * Get details of a stock entry
   * @param {number} entryId - Stock entry ID
   * @returns {Promise<Object>} - Stock entry details
   */
  async getStockEntry(entryId) {
    // Validate input
    // eslint-disable-next-line functional/immutable-data
    entryId = validateId(entryId, 'Entry ID');

    return this.request(`/stock/entry/${entryId}`);
  }

  /**
   * Edit a stock entry
   * @param {number} entryId - Stock entry ID
   * @param {Object} data - Stock entry data
   * @returns {Promise<Array>} - Stock log entries
   */
  async editStockEntry(entryId, data) {
    // Validate inputs
    // eslint-disable-next-line functional/immutable-data
    entryId = validateId(entryId, 'Entry ID');

    if (!data || typeof data !== 'object') {
      throw Object.freeze(new Error('Stock entry data must be a non-null object'));
    }

    // Create immutable validated data - allow all fields to be updated
    // Using Set for O(1) lookup performance as suggested in code review
    const knownFields = Object.freeze(
      new Set([
        'amount',
        'best_before_date',
        'price',
        'open',
        'opened_date',
        'location_id',
        'shopping_location_id',
      ])
    );

    const validatedData = Object.freeze({
      amount:
        data.amount !== undefined ? validateNumber(data.amount, 'Amount', { min: 0 }) : undefined,
      best_before_date:
        data.best_before_date !== undefined
          ? validateOptionalDate(data.best_before_date, 'Best before date')
          : undefined,
      price:
        data.price !== undefined
          ? validateOptionalNumber(data.price, 'Price', { min: 0 })
          : undefined,
      open: data.open !== undefined ? validateBoolean(data.open, 'Open') : undefined,
      opened_date:
        data.opened_date !== undefined
          ? validateOptionalDate(data.opened_date, 'Opened date')
          : undefined,
      location_id:
        data.location_id !== undefined
          ? validateOptionalId(data.location_id, 'Location ID')
          : undefined,
      shopping_location_id:
        data.shopping_location_id !== undefined
          ? validateOptionalId(data.shopping_location_id, 'Shopping location ID')
          : undefined,
      ...Object.entries(data).reduce((acc, [key, value]) => {
        if (!knownFields.has(key)) {
          acc[key] = value;
        }
        return acc;
      }, {}),
    });

    return this.request(`/stock/entry/${entryId}`, 'PUT', validatedData);
  }

  /**
   * Get volatile stock (due soon, overdue, expired, missing)
   * @param {number} dueSoonDays - Days for due soon products
   * @returns {Promise<Object>} - Volatile stock information
   */
  async getVolatileStock(dueSoonDays = 5) {
    // Validate input
    // eslint-disable-next-line functional/immutable-data
    dueSoonDays = validateNumber(dueSoonDays, 'Due soon days', { min: 0, max: 365 });

    return this.request('/stock/volatile', 'GET', null, { due_soon_days: dueSoonDays });
  }

  /**
   * Get product details
   * @param {number} productId - Product ID
   * @returns {Promise<Object>} - Product details
   */
  async getProductDetails(productId) {
    // Validate input
    // eslint-disable-next-line functional/immutable-data
    productId = validateId(productId, 'Product ID');

    return this.request(`/stock/products/${productId}`);
  }

  /**
   * Get product by barcode
   * @param {string} barcode - Product barcode
   * @returns {Promise<Object>} - Product details
   */
  async getProductByBarcode(barcode) {
    // Validate input
    // eslint-disable-next-line functional/immutable-data
    // Barcodes are technical identifiers that must be exact
    barcode = validateString(barcode, 'Barcode', { minLength: 1, maxLength: 200, sanitize: false });

    return this.request(`/stock/products/by-barcode/${barcode}`);
  }

  /**
   * Add product to stock
   * @param {number} productId - Product ID
   * @param {Object} data - Stock data
   * @returns {Promise<Array>} - Stock log entries
   */
  async addProductToStock(productId, data) {
    // Validate inputs
    productId = validateId(productId, 'Product ID');

    if (!data || typeof data !== 'object') {
      throw Object.freeze(new Error('Stock data must be a non-null object'));
    }

    // Create immutable validated data
    const validatedData = Object.freeze({
      amount: validateNumber(data.amount, 'Amount', { min: 0.001 }),
      price: validateOptionalNumber(data.price, 'Price', { min: 0 }),
      best_before_date: validateOptionalDate(data.best_before_date, 'Best before date'),
      location_id: validateOptionalId(data.location_id, 'Location ID'),
      shopping_location_id: validateOptionalId(data.shopping_location_id, 'Shopping location ID'),
      transaction_type: validateOptionalString(data.transaction_type, 'Transaction type', {
        maxLength: 50,
      }),
      ...Object.entries(data).reduce((acc, [key, value]) => {
        if (
          ![
            'amount',
            'price',
            'best_before_date',
            'location_id',
            'shopping_location_id',
            'transaction_type',
          ].includes(key)
        ) {
          acc[key] = value;
        }
        return acc;
      }, {}),
    });

    return this.request(`/stock/products/${productId}/add`, 'POST', validatedData);
  }

  /**
   * Add product to stock by barcode
   * @param {string} barcode - Product barcode
   * @param {Object} data - Stock data
   * @returns {Promise<Array>} - Stock log entries
   */
  async addProductToStockByBarcode(barcode, data) {
    // Validate inputs
    // Barcodes are technical identifiers that must be exact
    barcode = validateString(barcode, 'Barcode', { minLength: 1, maxLength: 200, sanitize: false });

    if (!data || typeof data !== 'object') {
      throw Object.freeze(new Error('Stock data must be a non-null object'));
    }

    // Create immutable validated data
    const validatedData = Object.freeze({
      amount: validateNumber(data.amount, 'Amount', { min: 0.001 }),
      price: validateOptionalNumber(data.price, 'Price', { min: 0 }),
      best_before_date: validateOptionalDate(data.best_before_date, 'Best before date'),
      location_id: validateOptionalId(data.location_id, 'Location ID'),
      shopping_location_id: validateOptionalId(data.shopping_location_id, 'Shopping location ID'),
      transaction_type: validateOptionalString(data.transaction_type, 'Transaction type', {
        maxLength: 50,
      }),
      ...Object.entries(data).reduce((acc, [key, value]) => {
        if (
          ![
            'amount',
            'price',
            'best_before_date',
            'location_id',
            'shopping_location_id',
            'transaction_type',
          ].includes(key)
        ) {
          acc[key] = value;
        }
        return acc;
      }, {}),
    });

    return this.request(`/stock/products/by-barcode/${barcode}/add`, 'POST', validatedData);
  }

  /**
   * Consume product from stock
   * @param {number} productId - Product ID
   * @param {Object} data - Consumption data
   * @returns {Promise<Array>} - Stock log entries
   */
  async consumeProduct(productId, data) {
    // Validate inputs
    productId = validateId(productId, 'Product ID');

    if (!data || typeof data !== 'object') {
      throw Object.freeze(new Error('Consumption data must be a non-null object'));
    }

    // Create immutable validated data
    const validatedData = Object.freeze({
      amount: validateNumber(data.amount, 'Amount', { min: 0.001 }),
      transaction_type: validateOptionalString(data.transaction_type, 'Transaction type', {
        maxLength: 50,
      }),
      spoiled: data.spoiled !== undefined ? validateBoolean(data.spoiled, 'Spoiled') : undefined,
      location_id: validateOptionalId(data.location_id, 'Location ID'),
      recipe_id: validateOptionalId(data.recipe_id, 'Recipe ID'),
      exact_amount:
        data.exact_amount !== undefined
          ? validateBoolean(data.exact_amount, 'Exact amount')
          : undefined,
      ...Object.entries(data).reduce((acc, [key, value]) => {
        if (
          ![
            'amount',
            'transaction_type',
            'spoiled',
            'location_id',
            'recipe_id',
            'exact_amount',
          ].includes(key)
        ) {
          acc[key] = value;
        }
        return acc;
      }, {}),
    });

    return this.request(`/stock/products/${productId}/consume`, 'POST', validatedData);
  }

  /**
   * Consume product from stock by barcode
   * @param {string} barcode - Product barcode
   * @param {Object} data - Consumption data
   * @returns {Promise<Array>} - Stock log entries
   */
  async consumeProductByBarcode(barcode, data) {
    // Validate inputs
    // Barcodes are technical identifiers that must be exact
    barcode = validateString(barcode, 'Barcode', { minLength: 1, maxLength: 200, sanitize: false });

    if (!data || typeof data !== 'object') {
      throw Object.freeze(new Error('Consumption data must be a non-null object'));
    }

    // Create immutable validated data
    const validatedData = Object.freeze({
      amount: validateNumber(data.amount, 'Amount', { min: 0.001 }),
      transaction_type: validateOptionalString(data.transaction_type, 'Transaction type', {
        maxLength: 50,
      }),
      spoiled: data.spoiled !== undefined ? validateBoolean(data.spoiled, 'Spoiled') : undefined,
      location_id: validateOptionalId(data.location_id, 'Location ID'),
      recipe_id: validateOptionalId(data.recipe_id, 'Recipe ID'),
      exact_amount:
        data.exact_amount !== undefined
          ? validateBoolean(data.exact_amount, 'Exact amount')
          : undefined,
      ...Object.entries(data).reduce((acc, [key, value]) => {
        if (
          ![
            'amount',
            'transaction_type',
            'spoiled',
            'location_id',
            'recipe_id',
            'exact_amount',
          ].includes(key)
        ) {
          acc[key] = value;
        }
        return acc;
      }, {}),
    });

    return this.request(`/stock/products/by-barcode/${barcode}/consume`, 'POST', validatedData);
  }

  /**
   * Transfer product between locations
   * @param {number} productId - Product ID
   * @param {Object} data - Transfer data
   * @returns {Promise<Array>} - Stock log entries
   */
  async transferProduct(productId, data) {
    // Validate inputs
    productId = validateId(productId, 'Product ID');

    if (!data || typeof data !== 'object') {
      throw Object.freeze(new Error('Transfer data must be a non-null object'));
    }

    // Create immutable validated data
    const validatedData = Object.freeze({
      amount: validateNumber(data.amount, 'Amount', { min: 0.001 }),
      location_id_from: validateId(data.location_id_from, 'Source location ID'),
      location_id_to: validateId(data.location_id_to, 'Destination location ID'),
      transaction_type: validateOptionalString(data.transaction_type, 'Transaction type', {
        maxLength: 50,
      }),
      ...Object.entries(data).reduce((acc, [key, value]) => {
        if (!['amount', 'location_id_from', 'location_id_to', 'transaction_type'].includes(key)) {
          acc[key] = value;
        }
        return acc;
      }, {}),
    });

    return this.request(`/stock/products/${productId}/transfer`, 'POST', validatedData);
  }

  /**
   * Inventory product (set new amount)
   * @param {number} productId - Product ID
   * @param {Object} data - Inventory data
   * @returns {Promise<Array>} - Stock log entries
   */
  async inventoryProduct(productId, data) {
    // Validate inputs
    productId = validateId(productId, 'Product ID');

    if (!data || typeof data !== 'object') {
      throw Object.freeze(new Error('Inventory data must be a non-null object'));
    }

    // Create immutable validated data
    const validatedData = Object.freeze({
      new_amount: validateNumber(data.new_amount, 'New amount', { min: 0 }),
      best_before_date: validateOptionalDate(data.best_before_date, 'Best before date'),
      location_id: validateOptionalId(data.location_id, 'Location ID'),
      price: validateOptionalNumber(data.price, 'Price', { min: 0 }),
      shopping_location_id: validateOptionalId(data.shopping_location_id, 'Shopping location ID'),
      ...Object.entries(data).reduce((acc, [key, value]) => {
        if (
          ![
            'new_amount',
            'best_before_date',
            'location_id',
            'price',
            'shopping_location_id',
          ].includes(key)
        ) {
          acc[key] = value;
        }
        return acc;
      }, {}),
    });

    return this.request(`/stock/products/${productId}/inventory`, 'POST', validatedData);
  }

  /**
   * Mark product as opened
   * @param {number} productId - Product ID
   * @param {Object} data - Open data
   * @returns {Promise<Array>} - Stock log entries
   */
  async openProduct(productId, data) {
    // Validate inputs
    productId = validateId(productId, 'Product ID');

    if (!data || typeof data !== 'object') {
      throw Object.freeze(new Error('Open data must be a non-null object'));
    }

    // Create immutable validated data
    const validatedData = Object.freeze({
      amount: validateOptionalNumber(data.amount, 'Amount', { min: 0.001 }),
      location_id: validateOptionalId(data.location_id, 'Location ID'),
      allow_subproduct_substitution:
        data.allow_subproduct_substitution !== undefined
          ? validateBoolean(data.allow_subproduct_substitution, 'Allow subproduct substitution')
          : undefined,
      ...Object.entries(data).reduce((acc, [key, value]) => {
        if (!['amount', 'location_id', 'allow_subproduct_substitution'].includes(key)) {
          acc[key] = value;
        }
        return acc;
      }, {}),
    });

    return this.request(`/stock/products/${productId}/open`, 'POST', validatedData);
  }

  // Shopping list endpoints

  /**
   * Add missing products to shopping list
   * @param {Object} data - Shopping list data
   * @returns {Promise<Object>} - Success status
   */
  async addMissingProductsToShoppingList(data = {}) {
    return this.request('/stock/shoppinglist/add-missing-products', 'POST', data);
  }

  /**
   * Add overdue products to shopping list
   * @param {Object} data - Shopping list data
   * @returns {Promise<Object>} - Success status
   */
  async addOverdueProductsToShoppingList(data = {}) {
    return this.request('/stock/shoppinglist/add-overdue-products', 'POST', data);
  }

  /**
   * Add expired products to shopping list
   * @param {Object} data - Shopping list data
   * @returns {Promise<Object>} - Success status
   */
  async addExpiredProductsToShoppingList(data = {}) {
    return this.request('/stock/shoppinglist/add-expired-products', 'POST', data);
  }

  /**
   * Clear shopping list
   * @param {Object} data - Shopping list data
   * @returns {Promise<Object>} - Success status
   */
  async clearShoppingList(data = {}) {
    return this.request('/stock/shoppinglist/clear', 'POST', data);
  }

  /**
   * Add product to shopping list
   * @param {Object} data - Shopping list item data
   * @returns {Promise<Object>} - Success status
   */
  async addProductToShoppingList(data) {
    // Validate input
    if (!data || typeof data !== 'object') {
      throw Object.freeze(new Error('Shopping list item data must be a non-null object'));
    }

    // Create immutable validated data
    const validatedData = Object.freeze({
      product_id: validateId(data.product_id, 'Product ID'),
      list_id: validateOptionalId(data.list_id, 'List ID'),
      product_amount: validateOptionalNumber(data.product_amount, 'Product amount', { min: 0.001 }),
      note: validateOptionalString(data.note, 'Note', { maxLength: 500 }),
      ...Object.entries(data).reduce((acc, [key, value]) => {
        if (!['product_id', 'list_id', 'product_amount', 'note'].includes(key)) {
          acc[key] = value;
        }
        return acc;
      }, {}),
    });

    return this.request('/stock/shoppinglist/add-product', 'POST', validatedData);
  }

  /**
   * Remove product from shopping list
   * @param {Object} data - Shopping list item data
   * @returns {Promise<Object>} - Success status
   */
  async removeProductFromShoppingList(data) {
    // Validate input
    if (!data || typeof data !== 'object') {
      throw Object.freeze(new Error('Shopping list item data must be a non-null object'));
    }

    // Create immutable validated data
    const validatedData = Object.freeze({
      product_id: validateId(data.product_id, 'Product ID'),
      list_id: validateOptionalId(data.list_id, 'List ID'),
      product_amount: validateOptionalNumber(data.product_amount, 'Product amount', { min: 0.001 }),
      ...Object.entries(data).reduce((acc, [key, value]) => {
        if (!['product_id', 'list_id', 'product_amount'].includes(key)) {
          acc[key] = value;
        }
        return acc;
      }, {}),
    });

    return this.request('/stock/shoppinglist/remove-product', 'POST', validatedData);
  }

  // Generic entity interactions

  /**
   * Get all objects of a given entity
   * @param {string} entity - Entity name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Entity objects
   */
  async getObjects(entity, options = {}) {
    // Validate entity name
    // Entity names are technical identifiers that should not be sanitized
    entity = validateString(entity, 'Entity name', {
      minLength: 1,
      maxLength: 50,
      sanitize: false,
    });

    const { query, order, limit, offset } = options;
    const params = Object.freeze({
      ...(query && { query }),
      ...(order && { order }),
      ...(limit !== undefined && { limit }),
      ...(offset !== undefined && { offset }),
    });

    return this.request(`/objects/${entity}`, 'GET', null, params);
  }

  /**
   * Add an object of a given entity
   * @param {string} entity - Entity name
   * @param {Object} data - Entity data
   * @returns {Promise<Object>} - Created object info
   */
  async addObject(entity, data) {
    // Validate inputs
    // Entity names are technical identifiers that should not be sanitized
    entity = validateString(entity, 'Entity name', {
      minLength: 1,
      maxLength: 50,
      sanitize: false,
    });

    if (!data || typeof data !== 'object') {
      throw Object.freeze(new Error('Entity data must be a non-null object'));
    }

    // Freeze the data to ensure immutability
    const validatedData = Object.freeze({ ...data });

    return this.request(`/objects/${entity}`, 'POST', validatedData);
  }

  /**
   * Get a single object of a given entity
   * @param {string} entity - Entity name
   * @param {number} objectId - Object ID
   * @returns {Promise<Object>} - Entity object
   */
  async getObject(entity, objectId) {
    // Validate inputs
    // Entity names are technical identifiers that should not be sanitized
    entity = validateString(entity, 'Entity name', {
      minLength: 1,
      maxLength: 50,
      sanitize: false,
    });
    objectId = validateId(objectId, 'Object ID');

    return this.request(`/objects/${entity}/${objectId}`);
  }

  /**
   * Edit an object of a given entity
   * @param {string} entity - Entity name
   * @param {number} objectId - Object ID
   * @param {Object} data - Entity data
   * @returns {Promise<Object>} - Success status
   */
  async editObject(entity, objectId, data) {
    // Validate inputs
    // Entity names are technical identifiers that should not be sanitized
    entity = validateString(entity, 'Entity name', {
      minLength: 1,
      maxLength: 50,
      sanitize: false,
    });
    objectId = validateId(objectId, 'Object ID');

    if (!data || typeof data !== 'object') {
      throw Object.freeze(new Error('Entity data must be a non-null object'));
    }

    // Freeze the data to ensure immutability
    const validatedData = Object.freeze({ ...data });

    return this.request(`/objects/${entity}/${objectId}`, 'PUT', validatedData);
  }

  /**
   * Delete an object of a given entity
   * @param {string} entity - Entity name
   * @param {number} objectId - Object ID
   * @returns {Promise<Object>} - Success status
   */
  async deleteObject(entity, objectId) {
    // Validate inputs
    // Entity names are technical identifiers that should not be sanitized
    entity = validateString(entity, 'Entity name', {
      minLength: 1,
      maxLength: 50,
      sanitize: false,
    });
    objectId = validateId(objectId, 'Object ID');

    return this.request(`/objects/${entity}/${objectId}`, 'DELETE');
  }

  // Userfields

  /**
   * Get userfields for an object
   * @param {string} entity - Entity name
   * @param {number|string} objectId - Object ID
   * @returns {Promise<Object>} - Userfields
   */
  async getUserfields(entity, objectId) {
    // Validate inputs
    // Entity names are technical identifiers that should not be sanitized
    entity = validateString(entity, 'Entity name', {
      minLength: 1,
      maxLength: 50,
      sanitize: false,
    });
    // Object ID can be string or number for userfields
    if (typeof objectId === 'number') {
      objectId = validateId(objectId, 'Object ID');
    } else {
      objectId = validateString(objectId, 'Object ID', { minLength: 1, maxLength: 100 });
    }

    return this.request(`/userfields/${entity}/${objectId}`);
  }

  /**
   * Set userfields for an object
   * @param {string} entity - Entity name
   * @param {number|string} objectId - Object ID
   * @param {Object} data - Userfields data
   * @returns {Promise<Object>} - Success status
   */
  async setUserfields(entity, objectId, data) {
    // Validate inputs
    // Entity names are technical identifiers that should not be sanitized
    entity = validateString(entity, 'Entity name', {
      minLength: 1,
      maxLength: 50,
      sanitize: false,
    });
    // Object ID can be string or number for userfields
    if (typeof objectId === 'number') {
      objectId = validateId(objectId, 'Object ID');
    } else {
      objectId = validateString(objectId, 'Object ID', { minLength: 1, maxLength: 100 });
    }

    if (!data || typeof data !== 'object') {
      throw Object.freeze(new Error('Userfields data must be a non-null object'));
    }

    // Freeze the data to ensure immutability
    const validatedData = Object.freeze({ ...data });

    return this.request(`/userfields/${entity}/${objectId}`, 'PUT', validatedData);
  }

  // File endpoints

  /**
   * Get a file
   * @param {string} group - File group
   * @param {string} fileName - File name (BASE64 encoded)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - File data
   */
  async getFile(group, fileName, options = {}) {
    // Validate inputs - file paths should not be sanitized
    group = validateString(group, 'File group', { minLength: 1, maxLength: 100, sanitize: false });
    fileName = validateString(fileName, 'File name', {
      minLength: 1,
      maxLength: 255,
      sanitize: false,
    });

    // Validate options if provided
    const validatedOptions = Object.freeze({
      force_serve_as: validateOptionalString(options.force_serve_as, 'Force serve as', {
        maxLength: 100,
      }),
      ...Object.entries(options).reduce((acc, [key, value]) => {
        if (key !== 'force_serve_as') {
          acc[key] = value;
        }
        return acc;
      }, {}),
    });

    return this.request(`/files/${group}/${fileName}`, 'GET', null, validatedOptions);
  }

  /**
   * Upload a file
   * @param {string} group - File group
   * @param {string} fileName - File name (BASE64 encoded)
   * @param {Blob|File} fileData - File data
   * @returns {Promise<Object>} - Success status
   */
  async uploadFile(group, fileName, fileData) {
    // Validate inputs first before checking API key
    group = validateString(group, 'File group', { minLength: 1, maxLength: 100 });
    fileName = validateString(fileName, 'File name', { minLength: 1, maxLength: 255 });

    if (!fileData) {
      throw Object.freeze(new Error('File data is required'));
    }

    if (!this.apiKey) {
      throw Object.freeze(new Error('API key is required. Use setApiKey() to set it.'));
    }

    const url = new URL(`${this.baseUrl}/files/${group}/${fileName}`);

    const options = {
      method: 'PUT',
      headers: {
        'GROCY-API-KEY': this.apiKey,
      },
      body: fileData,
    };

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_message || `HTTP error! status: ${response.status}`);
      }

      return Object.freeze({ success: true });
    } catch (error) {
      throw new Error(`Grocy API request failed: ${error.message}`);
    }
  }

  /**
   * Delete a file
   * @param {string} group - File group
   * @param {string} fileName - File name (BASE64 encoded)
   * @returns {Promise<Object>} - Success status
   */
  async deleteFile(group, fileName) {
    // Validate inputs - file paths should not be sanitized
    group = validateString(group, 'File group', { minLength: 1, maxLength: 100, sanitize: false });
    fileName = validateString(fileName, 'File name', {
      minLength: 1,
      maxLength: 255,
      sanitize: false,
    });

    return this.request(`/files/${group}/${fileName}`, 'DELETE');
  }

  // User management endpoints

  /**
   * Get all users
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Users
   */
  async getUsers(options = {}) {
    const { query, order, limit, offset } = options;
    const params = Object.freeze({
      ...(query && { query }),
      ...(order && { order }),
      ...(limit !== undefined && { limit }),
      ...(offset !== undefined && { offset }),
    });

    return this.request('/users', 'GET', null, params);
  }

  /**
   * Create a new user
   * @param {Object} data - User data
   * @returns {Promise<Object>} - Success status
   */
  async createUser(data) {
    // Validate input
    if (!data || typeof data !== 'object') {
      throw Object.freeze(new Error('User data must be a non-null object'));
    }

    // Create immutable validated data
    const validatedData = Object.freeze({
      username: validateString(data.username, 'Username', { minLength: 1, maxLength: 50 }),
      // Passwords should not be sanitized as they need exact values
      password: validateString(data.password, 'Password', {
        minLength: 1,
        maxLength: 200,
        sanitize: false,
      }),
      first_name: validateOptionalString(data.first_name, 'First name', { maxLength: 100 }),
      last_name: validateOptionalString(data.last_name, 'Last name', { maxLength: 100 }),
      ...Object.entries(data).reduce((acc, [key, value]) => {
        if (!['username', 'password', 'first_name', 'last_name'].includes(key)) {
          acc[key] = value;
        }
        return acc;
      }, {}),
    });

    return this.request('/users', 'POST', validatedData);
  }

  /**
   * Edit a user
   * @param {number} userId - User ID
   * @param {Object} data - User data
   * @returns {Promise<Object>} - Success status
   */
  async editUser(userId, data) {
    // Validate inputs
    userId = validateId(userId, 'User ID');

    if (!data || typeof data !== 'object') {
      throw Object.freeze(new Error('User data must be a non-null object'));
    }

    // Create immutable validated data - password is optional for edit
    const validatedData = Object.freeze({
      username:
        data.username !== undefined
          ? validateString(data.username, 'Username', { minLength: 1, maxLength: 50 })
          : undefined,
      password:
        data.password !== undefined
          ? validateString(data.password, 'Password', {
              minLength: 1,
              maxLength: 200,
              sanitize: false,
            })
          : undefined,
      first_name:
        data.first_name !== undefined
          ? validateOptionalString(data.first_name, 'First name', { maxLength: 100 })
          : undefined,
      last_name:
        data.last_name !== undefined
          ? validateOptionalString(data.last_name, 'Last name', { maxLength: 100 })
          : undefined,
      ...Object.entries(data).reduce((acc, [key, value]) => {
        if (!['username', 'password', 'first_name', 'last_name'].includes(key)) {
          acc[key] = value;
        }
        return acc;
      }, {}),
    });

    return this.request(`/users/${userId}`, 'PUT', validatedData);
  }

  /**
   * Delete a user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Success status
   */
  async deleteUser(userId) {
    // Validate input
    userId = validateId(userId, 'User ID');

    return this.request(`/users/${userId}`, 'DELETE');
  }

  // Current user endpoints

  /**
   * Get current user
   * @returns {Promise<Object>} - Current user info
   */
  async getCurrentUser() {
    return this.request('/user');
  }

  /**
   * Get current user settings
   * @returns {Promise<Object>} - User settings
   */
  async getUserSettings() {
    return this.request('/user/settings');
  }

  /**
   * Get a specific user setting
   * @param {string} settingKey - Setting key
   * @returns {Promise<Object>} - Setting value
   */
  async getUserSetting(settingKey) {
    // Validate input
    // Setting keys are technical identifiers that should not be sanitized
    settingKey = validateString(settingKey, 'Setting key', {
      minLength: 1,
      maxLength: 100,
      sanitize: false,
    });

    return this.request(`/user/settings/${settingKey}`);
  }

  /**
   * Set a user setting
   * @param {string} settingKey - Setting key
   * @param {Object} data - Setting data
   * @returns {Promise<Object>} - Success status
   */
  async setUserSetting(settingKey, data) {
    // Validate inputs
    // Setting keys are technical identifiers that should not be sanitized
    settingKey = validateString(settingKey, 'Setting key', {
      minLength: 1,
      maxLength: 100,
      sanitize: false,
    });

    if (!data || typeof data !== 'object') {
      throw Object.freeze(new Error('Setting data must be a non-null object'));
    }

    // Freeze the data to ensure immutability
    const validatedData = Object.freeze({ ...data });

    return this.request(`/user/settings/${settingKey}`, 'PUT', validatedData);
  }

  // Recipe endpoints

  /**
   * Add missing recipe products to shopping list
   * @param {number} recipeId - Recipe ID
   * @param {Object} data - Additional options
   * @returns {Promise<Object>} - Success status
   */
  async addRecipeProductsToShoppingList(recipeId, data = {}) {
    // Validate inputs
    recipeId = validateId(recipeId, 'Recipe ID');

    // Create immutable validated data
    const validatedData = Object.freeze({
      excluded_product_ids: data.excluded_product_ids
        ? validateArray(data.excluded_product_ids, 'Excluded product IDs', {
            itemValidator: (id) => validateId(id, 'Product ID'),
          })
        : undefined,
      ...Object.entries(data).reduce((acc, [key, value]) => {
        if (key !== 'excluded_product_ids') {
          acc[key] = value;
        }
        return acc;
      }, {}),
    });

    return this.request(
      `/recipes/${recipeId}/add-not-fulfilled-products-to-shoppinglist`,
      'POST',
      validatedData
    );
  }

  /**
   * Get recipe fulfillment information
   * @param {number} recipeId - Recipe ID
   * @returns {Promise<Object>} - Recipe fulfillment info
   */
  async getRecipeFulfillment(recipeId) {
    // Validate input
    recipeId = validateId(recipeId, 'Recipe ID');

    return this.request(`/recipes/${recipeId}/fulfillment`);
  }

  /**
   * Consume all recipe ingredients
   * @param {number} recipeId - Recipe ID
   * @returns {Promise<Object>} - Success status
   */
  async consumeRecipe(recipeId) {
    // Validate input
    recipeId = validateId(recipeId, 'Recipe ID');

    return this.request(`/recipes/${recipeId}/consume`, 'POST');
  }

  /**
   * Get all recipes fulfillment
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Recipes fulfillment
   */
  async getAllRecipesFulfillment(options = {}) {
    const { query, order, limit, offset } = options;
    const params = Object.freeze({
      ...(query && { query }),
      ...(order && { order }),
      ...(limit !== undefined && { limit }),
      ...(offset !== undefined && { offset }),
    });

    return this.request('/recipes/fulfillment', 'GET', null, params);
  }

  // Chores endpoints

  /**
   * Get all chores
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Chores
   */
  async getChores(options = {}) {
    const { query, order, limit, offset } = options;
    const params = Object.freeze({
      ...(query && { query }),
      ...(order && { order }),
      ...(limit !== undefined && { limit }),
      ...(offset !== undefined && { offset }),
    });

    return this.request('/chores', 'GET', null, params);
  }

  /**
   * Get chore details
   * @param {number} choreId - Chore ID
   * @returns {Promise<Object>} - Chore details
   */
  async getChoreDetails(choreId) {
    // Validate input
    choreId = validateId(choreId, 'Chore ID');

    return this.request(`/chores/${choreId}`);
  }

  /**
   * Execute a chore
   * @param {number} choreId - Chore ID
   * @param {Object} data - Execution data
   * @returns {Promise<Object>} - Chore log entry
   */
  async executeChore(choreId, data = {}) {
    // Validate inputs
    choreId = validateId(choreId, 'Chore ID');

    // Create immutable validated data
    const validatedData = Object.freeze({
      tracked_time: validateOptionalDate(data.tracked_time, 'Tracked time'),
      done_by: validateOptionalId(data.done_by, 'Done by user ID'),
      ...Object.entries(data).reduce((acc, [key, value]) => {
        if (!['tracked_time', 'done_by'].includes(key)) {
          acc[key] = value;
        }
        return acc;
      }, {}),
    });

    return this.request(`/chores/${choreId}/execute`, 'POST', validatedData);
  }

  // Batteries endpoints

  /**
   * Get all batteries
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Batteries
   */
  async getBatteries(options = {}) {
    const { query, order, limit, offset } = options;
    const params = Object.freeze({
      ...(query && { query }),
      ...(order && { order }),
      ...(limit !== undefined && { limit }),
      ...(offset !== undefined && { offset }),
    });

    return this.request('/batteries', 'GET', null, params);
  }

  /**
   * Get battery details
   * @param {number} batteryId - Battery ID
   * @returns {Promise<Object>} - Battery details
   */
  async getBatteryDetails(batteryId) {
    // Validate input
    batteryId = validateId(batteryId, 'Battery ID');

    return this.request(`/batteries/${batteryId}`);
  }

  /**
   * Charge a battery
   * @param {number} batteryId - Battery ID
   * @param {Object} data - Charge data
   * @returns {Promise<Object>} - Battery charge cycle entry
   */
  async chargeBattery(batteryId, data = {}) {
    // Validate inputs
    batteryId = validateId(batteryId, 'Battery ID');

    // Create immutable validated data
    const validatedData = Object.freeze({
      tracked_time: validateOptionalDate(data.tracked_time, 'Tracked time'),
      ...Object.entries(data).reduce((acc, [key, value]) => {
        if (key !== 'tracked_time') {
          acc[key] = value;
        }
        return acc;
      }, {}),
    });

    return this.request(`/batteries/${batteryId}/charge`, 'POST', validatedData);
  }

  // Tasks endpoints

  /**
   * Get all tasks
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Tasks
   */
  async getTasks(options = {}) {
    const { query, order, limit, offset } = options;
    const params = Object.freeze({
      ...(query && { query }),
      ...(order && { order }),
      ...(limit !== undefined && { limit }),
      ...(offset !== undefined && { offset }),
    });

    return this.request('/tasks', 'GET', null, params);
  }

  /**
   * Complete a task
   * @param {number} taskId - Task ID
   * @param {Object} data - Completion data
   * @returns {Promise<Object>} - Success status
   */
  async completeTask(taskId, data = {}) {
    // Validate inputs
    taskId = validateId(taskId, 'Task ID');

    // Create immutable validated data
    const validatedData = Object.freeze({
      done_time: validateOptionalDate(data.done_time, 'Done time'),
      ...Object.entries(data).reduce((acc, [key, value]) => {
        if (key !== 'done_time') {
          acc[key] = value;
        }
        return acc;
      }, {}),
    });

    return this.request(`/tasks/${taskId}/complete`, 'POST', validatedData);
  }

  /**
   * Undo a task completion
   * @param {number} taskId - Task ID
   * @returns {Promise<Object>} - Success status
   */
  async undoTask(taskId) {
    // Validate input
    taskId = validateId(taskId, 'Task ID');

    return this.request(`/tasks/${taskId}/undo`, 'POST');
  }

  // Calendar endpoints

  /**
   * Get iCal calendar
   * @returns {Promise<Object>} - Calendar data
   */
  async getCalendar() {
    return this.request('/calendar/ical');
  }

  /**
   * Get calendar sharing link
   * @returns {Promise<Object>} - Sharing link
   */
  async getCalendarSharingLink() {
    return this.request('/calendar/ical/sharing-link');
  }
}

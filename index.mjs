/**
 * Grocy - A JavaScript wrapper for the Grocy REST API
 *
 * Authentication is done via API keys (header *GROCY-API-KEY* or same named query parameter)
 */
export default class Grocy {
  /**
   * @param {string} baseUrl - The base URL of your Grocy instance
   * @param {string} apiKey - Your Grocy API key
   */
  constructor(baseUrl, apiKey = null) {
    if (typeof baseUrl !== 'string' || baseUrl.trim().length === 0) {
      throw new Error('Base URL must be a non-empty string');
    }
    if (apiKey !== null && (typeof apiKey !== 'string' || apiKey.trim().length === 0)) {
      throw new Error('API key must be a non-empty string or null');
    }
    
    this.baseUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    this.apiKey = apiKey;
  }

  /**
   * Set or update the API key
   * @param {string} apiKey - Your Grocy API key
   */
  setApiKey(apiKey) {
    if (apiKey !== null && (typeof apiKey !== 'string' || apiKey.trim().length === 0)) {
      throw new Error('API key must be a non-empty string or null');
    }
    this.apiKey = apiKey;
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
          value.forEach((v) => url.searchParams.append(`${key}[]`, v));
        } else if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    const options = {
      method,
      headers: {
        'GROCY-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

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
    if (!Number.isInteger(entryId) || entryId <= 0) {
      throw new Error('Entry ID must be a positive integer');
    }
    
    return this.request(`/stock/entry/${entryId}`);
  }

  /**
   * Edit a stock entry
   * @param {number} entryId - Stock entry ID
   * @param {Object} data - Stock entry data
   * @returns {Promise<Array>} - Stock log entries
   */
  async editStockEntry(entryId, data) {
    return this.request(`/stock/entry/${entryId}`, 'PUT', data);
  }

  /**
   * Get volatile stock (due soon, overdue, expired, missing)
   * @param {number} dueSoonDays - Days for due soon products
   * @returns {Promise<Object>} - Volatile stock information
   */
  async getVolatileStock(dueSoonDays = 5) {
    return this.request('/stock/volatile', 'GET', null, { due_soon_days: dueSoonDays });
  }

  /**
   * Get product details
   * @param {number} productId - Product ID
   * @returns {Promise<Object>} - Product details
   */
  async getProductDetails(productId) {
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new Error('Product ID must be a positive integer');
    }
    
    return this.request(`/stock/products/${productId}`);
  }

  /**
   * Get product by barcode
   * @param {string} barcode - Product barcode
   * @returns {Promise<Object>} - Product details
   */
  async getProductByBarcode(barcode) {
    if (typeof barcode !== 'string' || barcode.trim().length === 0) {
      throw new Error('Barcode must be a non-empty string');
    }
    
    return this.request(`/stock/products/by-barcode/${barcode}`);
  }

  /**
   * Add product to stock
   * @param {number} productId - Product ID
   * @param {Object} data - Stock data
   * @returns {Promise<Array>} - Stock log entries
   */
  async addProductToStock(productId, data) {
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new Error('Product ID must be a positive integer');
    }
    if (!data || typeof data !== 'object') {
      throw new Error('Stock data must be a non-null object');
    }
    if (data.amount !== undefined && (typeof data.amount !== 'number' || data.amount <= 0)) {
      throw new Error('Amount must be a positive number');
    }
    
    return this.request(`/stock/products/${productId}/add`, 'POST', data);
  }

  /**
   * Add product to stock by barcode
   * @param {string} barcode - Product barcode
   * @param {Object} data - Stock data
   * @returns {Promise<Array>} - Stock log entries
   */
  async addProductToStockByBarcode(barcode, data) {
    return this.request(`/stock/products/by-barcode/${barcode}/add`, 'POST', data);
  }

  /**
   * Consume product from stock
   * @param {number} productId - Product ID
   * @param {Object} data - Consumption data
   * @returns {Promise<Array>} - Stock log entries
   */
  async consumeProduct(productId, data) {
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new Error('Product ID must be a positive integer');
    }
    if (!data || typeof data !== 'object') {
      throw new Error('Consumption data must be a non-null object');
    }
    if (data.amount !== undefined && (typeof data.amount !== 'number' || data.amount <= 0)) {
      throw new Error('Amount must be a positive number');
    }
    
    return this.request(`/stock/products/${productId}/consume`, 'POST', data);
  }

  /**
   * Consume product from stock by barcode
   * @param {string} barcode - Product barcode
   * @param {Object} data - Consumption data
   * @returns {Promise<Array>} - Stock log entries
   */
  async consumeProductByBarcode(barcode, data) {
    return this.request(`/stock/products/by-barcode/${barcode}/consume`, 'POST', data);
  }

  /**
   * Transfer product between locations
   * @param {number} productId - Product ID
   * @param {Object} data - Transfer data
   * @returns {Promise<Array>} - Stock log entries
   */
  async transferProduct(productId, data) {
    return this.request(`/stock/products/${productId}/transfer`, 'POST', data);
  }

  /**
   * Inventory product (set new amount)
   * @param {number} productId - Product ID
   * @param {Object} data - Inventory data
   * @returns {Promise<Array>} - Stock log entries
   */
  async inventoryProduct(productId, data) {
    return this.request(`/stock/products/${productId}/inventory`, 'POST', data);
  }

  /**
   * Mark product as opened
   * @param {number} productId - Product ID
   * @param {Object} data - Open data
   * @returns {Promise<Array>} - Stock log entries
   */
  async openProduct(productId, data) {
    return this.request(`/stock/products/${productId}/open`, 'POST', data);
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
    return this.request('/stock/shoppinglist/add-product', 'POST', data);
  }

  /**
   * Remove product from shopping list
   * @param {Object} data - Shopping list item data
   * @returns {Promise<Object>} - Success status
   */
  async removeProductFromShoppingList(data) {
    return this.request('/stock/shoppinglist/remove-product', 'POST', data);
  }

  // Generic entity interactions

  /**
   * Get all objects of a given entity
   * @param {string} entity - Entity name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Entity objects
   */
  async getObjects(entity, options = {}) {
    const { query, order, limit, offset } = options;
    const params = {};

    if (query) params.query = query;
    if (order) params.order = order;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;

    return this.request(`/objects/${entity}`, 'GET', null, params);
  }

  /**
   * Add an object of a given entity
   * @param {string} entity - Entity name
   * @param {Object} data - Entity data
   * @returns {Promise<Object>} - Created object info
   */
  async addObject(entity, data) {
    return this.request(`/objects/${entity}`, 'POST', data);
  }

  /**
   * Get a single object of a given entity
   * @param {string} entity - Entity name
   * @param {number} objectId - Object ID
   * @returns {Promise<Object>} - Entity object
   */
  async getObject(entity, objectId) {
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
    return this.request(`/objects/${entity}/${objectId}`, 'PUT', data);
  }

  /**
   * Delete an object of a given entity
   * @param {string} entity - Entity name
   * @param {number} objectId - Object ID
   * @returns {Promise<Object>} - Success status
   */
  async deleteObject(entity, objectId) {
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
    return this.request(`/userfields/${entity}/${objectId}`, 'PUT', data);
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
    return this.request(`/files/${group}/${fileName}`, 'GET', null, options);
  }

  /**
   * Upload a file
   * @param {string} group - File group
   * @param {string} fileName - File name (BASE64 encoded)
   * @param {Blob|File} fileData - File data
   * @returns {Promise<Object>} - Success status
   */
  async uploadFile(group, fileName, fileData) {
    if (!this.apiKey) {
      throw new Error('API key is required. Use setApiKey() to set it.');
    }
    if (typeof group !== 'string' || group.trim().length === 0) {
      throw new Error('File group must be a non-empty string');
    }
    if (typeof fileName !== 'string' || fileName.trim().length === 0) {
      throw new Error('File name must be a non-empty string');
    }
    if (!fileData) {
      throw new Error('File data is required');
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
    const params = {};

    if (query) params.query = query;
    if (order) params.order = order;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;

    return this.request('/users', 'GET', null, params);
  }

  /**
   * Create a new user
   * @param {Object} data - User data
   * @returns {Promise<Object>} - Success status
   */
  async createUser(data) {
    return this.request('/users', 'POST', data);
  }

  /**
   * Edit a user
   * @param {number} userId - User ID
   * @param {Object} data - User data
   * @returns {Promise<Object>} - Success status
   */
  async editUser(userId, data) {
    return this.request(`/users/${userId}`, 'PUT', data);
  }

  /**
   * Delete a user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Success status
   */
  async deleteUser(userId) {
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
    return this.request(`/user/settings/${settingKey}`);
  }

  /**
   * Set a user setting
   * @param {string} settingKey - Setting key
   * @param {Object} data - Setting data
   * @returns {Promise<Object>} - Success status
   */
  async setUserSetting(settingKey, data) {
    return this.request(`/user/settings/${settingKey}`, 'PUT', data);
  }

  // Recipe endpoints

  /**
   * Add missing recipe products to shopping list
   * @param {number} recipeId - Recipe ID
   * @param {Object} data - Additional options
   * @returns {Promise<Object>} - Success status
   */
  async addRecipeProductsToShoppingList(recipeId, data = {}) {
    return this.request(`/recipes/${recipeId}/add-not-fulfilled-products-to-shoppinglist`, 'POST', data);
  }

  /**
   * Get recipe fulfillment information
   * @param {number} recipeId - Recipe ID
   * @returns {Promise<Object>} - Recipe fulfillment info
   */
  async getRecipeFulfillment(recipeId) {
    return this.request(`/recipes/${recipeId}/fulfillment`);
  }

  /**
   * Consume all recipe ingredients
   * @param {number} recipeId - Recipe ID
   * @returns {Promise<Object>} - Success status
   */
  async consumeRecipe(recipeId) {
    return this.request(`/recipes/${recipeId}/consume`, 'POST');
  }

  /**
   * Get all recipes fulfillment
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Recipes fulfillment
   */
  async getAllRecipesFulfillment(options = {}) {
    const { query, order, limit, offset } = options;
    const params = {};

    if (query) params.query = query;
    if (order) params.order = order;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;

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
    const params = {};

    if (query) params.query = query;
    if (order) params.order = order;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;

    return this.request('/chores', 'GET', null, params);
  }

  /**
   * Get chore details
   * @param {number} choreId - Chore ID
   * @returns {Promise<Object>} - Chore details
   */
  async getChoreDetails(choreId) {
    return this.request(`/chores/${choreId}`);
  }

  /**
   * Execute a chore
   * @param {number} choreId - Chore ID
   * @param {Object} data - Execution data
   * @returns {Promise<Object>} - Chore log entry
   */
  async executeChore(choreId, data = {}) {
    return this.request(`/chores/${choreId}/execute`, 'POST', data);
  }

  // Batteries endpoints

  /**
   * Get all batteries
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Batteries
   */
  async getBatteries(options = {}) {
    const { query, order, limit, offset } = options;
    const params = {};

    if (query) params.query = query;
    if (order) params.order = order;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;

    return this.request('/batteries', 'GET', null, params);
  }

  /**
   * Get battery details
   * @param {number} batteryId - Battery ID
   * @returns {Promise<Object>} - Battery details
   */
  async getBatteryDetails(batteryId) {
    return this.request(`/batteries/${batteryId}`);
  }

  /**
   * Charge a battery
   * @param {number} batteryId - Battery ID
   * @param {Object} data - Charge data
   * @returns {Promise<Object>} - Battery charge cycle entry
   */
  async chargeBattery(batteryId, data = {}) {
    return this.request(`/batteries/${batteryId}/charge`, 'POST', data);
  }

  // Tasks endpoints

  /**
   * Get all tasks
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Tasks
   */
  async getTasks(options = {}) {
    const { query, order, limit, offset } = options;
    const params = {};

    if (query) params.query = query;
    if (order) params.order = order;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;

    return this.request('/tasks', 'GET', null, params);
  }

  /**
   * Complete a task
   * @param {number} taskId - Task ID
   * @param {Object} data - Completion data
   * @returns {Promise<Object>} - Success status
   */
  async completeTask(taskId, data = {}) {
    return this.request(`/tasks/${taskId}/complete`, 'POST', data);
  }

  /**
   * Undo a task completion
   * @param {number} taskId - Task ID
   * @returns {Promise<Object>} - Success status
   */
  async undoTask(taskId) {
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

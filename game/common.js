/**
 * common.js
 * Shared helper functions for all mini-games in /game.
 *
 * Usage example (in your game main.js):
 *
 *   apiCreateItem({
 *     name: "Apple",
 *     quantity: 10,
 *     price: 3.50,
 *     category: "Fruit"
 *   }).then(res => {
 *     if (res.success) {
 *       // Show success animation
 *     } else {
 *       // Show error message
 *     }
 *   });
 */

(function () {
  // Base URL of the API folder, relative to /game/common.js
  // Base URL of the API folder, from the web root
  const API_BASE = '/InventorySystem-main/api/';

  /**
   * Internal helper: make a fetch request and parse JSON safely.
   * Returns a Promise that resolves to { success: boolean, ... }.
   */
  async function apiRequest(path, options = {}) {
    const url = API_BASE + path;

    try {
      const response = await fetch(url, options);

      // Handle non-2xx HTTP status
      if (!response.ok) {
        console.error('API HTTP error:', response.status, response.statusText);
        return {
          success: false,
          message: 'HTTP Error ' + response.status + ' when calling ' + path
        };
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('API network error:', err);
      return {
        success: false,
        message: 'Network error when calling ' + path
      };
    }
  }

  /**
   * List items from the inventory.
   *
   * @param {Object} [opts]
   * @param {string} [opts.search] Optional search keyword.
   * @returns {Promise<Object>} { success, items: [...] }
   */
  async function apiListItems(opts = {}) {
    const params = new URLSearchParams();

    if (opts.search) {
      params.append('search', opts.search);
    }

    const path =
      'items_list.php' + (params.toString() ? '?' + params.toString() : '');

    return apiRequest(path, {
      method: 'GET'
    });
  }

  /**
   * Create a new inventory item.
   *
   * @param {Object} item
   * @param {string} item.name       Item name (required).
   * @param {number|string} item.quantity  Quantity (required).
   * @param {number|string} item.price     Price (required).
   * @param {string} [item.category]       Category (optional).
   * @returns {Promise<Object>} { success, id, message }
   */
  async function apiCreateItem(item) {
    const formData = new FormData();
    formData.append('item_name', item.name ?? '');
    formData.append('quantity', item.quantity ?? '');
    formData.append('price', item.price ?? '');
    formData.append('category', item.category ?? '');

    return apiRequest('items_create.php', {
      method: 'POST',
      body: formData
    });
  }

  /**
   * Update an existing inventory item.
   *
   * @param {Object} item
   * @param {number|string} item.id        Item ID (required).
   * @param {string} [item.name]
   * @param {number|string} [item.quantity]
   * @param {number|string} [item.price]
   * @param {string} [item.category]
   * @returns {Promise<Object>} { success, message }
   */
  async function apiUpdateItem(item) {
    const formData = new FormData();

    formData.append('id', item.id ?? '');

    if (item.name !== undefined) {
      formData.append('item_name', item.name);
    }
    if (item.quantity !== undefined) {
      formData.append('quantity', item.quantity);
    }
    if (item.price !== undefined) {
      formData.append('price', item.price);
    }
    if (item.category !== undefined) {
      formData.append('category', item.category);
    }

    return apiRequest('items_update.php', {
      method: 'POST',
      body: formData
    });
  }

  /**
   * Delete an inventory item.
   *
   * @param {number|string} id Item ID to delete.
   * @returns {Promise<Object>} { success, message }
   */
  async function apiDeleteItem(id) {
    const formData = new FormData();
    formData.append('id', id);

    return apiRequest('items_delete.php', {
      method: 'POST',
      body: formData
    });
  }

  /**
   * Validate item data without mutating the database.
   * Useful for the validate_item game to pre-flight user input.
   *
   * @param {Object} payload
   * @param {number|string} [payload.id] Existing item id if validating an update.
   * @param {string} [payload.name]
   * @param {number|string} [payload.quantity]
   * @param {number|string} [payload.price]
   * @param {string} [payload.category]
   * @returns {Promise<Object>} { success, message, errors?, operation?, data? }
   */
  async function apiValidateItem(payload = {}) {
    const formData = new FormData();

    if (payload.id !== undefined) {
      formData.append('id', payload.id);
    }
    if (payload.name !== undefined) {
      formData.append('item_name', payload.name);
    }
    if (payload.quantity !== undefined) {
      formData.append('quantity', payload.quantity);
    }
    if (payload.price !== undefined) {
      formData.append('price', payload.price);
    }
    if (payload.category !== undefined) {
      formData.append('category', payload.category);
    }

    return apiRequest('items_validate.php', {
      method: 'POST',
      body: formData
    });
  }

  // Expose helpers to global scope so Phaser scenes can call them.
  window.apiListItems = apiListItems;
  window.apiCreateItem = apiCreateItem;
  window.apiUpdateItem = apiUpdateItem;
  window.apiDeleteItem = apiDeleteItem;
  window.apiValidateItem = apiValidateItem;
})();

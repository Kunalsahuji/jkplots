import api from '@/utils/api';

export const propertyService = {
  /**
   * Fetch all properties with optional query filters
   * @param {Object} filters - Query parameters (search, city, purpose, type, bedrooms, price range, isFeatured, page, limit)
   * @returns {Promise<Object>} API Response data
   */
  getProperties: async (filters = {}) => {
    const { data } = await api.get('/properties', { params: filters });
    return data;
  },

  /**
   * Fetch a single property details by ID
   * @param {string} id - Property ID
   * @returns {Promise<Object>} API Response data
   */
  getProperty: async (id) => {
    const { data } = await api.get(`/properties/${id}`);
    return data;
  },

  /**
   * Create a new property listing
   * @param {Object} propertyData - Property payload
   * @returns {Promise<Object>} API Response data
   */
  createProperty: async (propertyData) => {
    const { data } = await api.post('/properties', propertyData);
    return data;
  },

  /**
   * Update an existing property listing
   * @param {string} id - Property ID
   * @param {Object} propertyData - Property payload updates
   * @returns {Promise<Object>} API Response data
   */
  updateProperty: async (id, propertyData) => {
    const { data } = await api.put(`/properties/${id}`, propertyData);
    return data;
  },

  /**
   * Delete a property listing
   * @param {string} id - Property ID
   * @returns {Promise<Object>} API Response data
   */
  deleteProperty: async (id) => {
    const { data } = await api.delete(`/properties/${id}`);
    return data;
  },

  /**
   * Toggle saved status of a property (heart bookmark)
   * @param {string} id - Property ID
   * @returns {Promise<Object>} API Response data
   */
  toggleSaveProperty: async (id) => {
    const { data } = await api.post(`/properties/${id}/save`);
    return data;
  }
};

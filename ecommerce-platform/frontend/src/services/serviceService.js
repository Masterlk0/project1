import axios from 'axios';

const API_URL = '/api/services'; // Proxy handles redirection
const BOOSTING_API_URL = '/api/boosting'; // For trending services

// Fetch all services (supports query parameters)
const getServices = async (params = {}) => {
  try {
    const response = await axios.get(API_URL, { params });
    // Backend sends { status: 'success', results: services.length, data: { services } }
    return response.data.data.services;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch services';
    console.error('Get services service error:', error.response?.data || error.message);
    throw new Error(message);
  }
};

// Fetch a single service by its ID
const getServiceById = async (serviceId) => {
  try {
    const response = await axios.get(`${API_URL}/${serviceId}`);
    // Backend sends { status: 'success', data: { service } }
    return response.data.data.service;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch service details';
    console.error('Get service by ID service error:', error.response?.data || error.message);
    throw new Error(message);
  }
};

// Fetch trending services
const getTrendingServices = async (limit = 10) => {
  try {
    const response = await axios.get(`${BOOSTING_API_URL}/trending-services`, { params: { limit } });
    // Backend sends { status: 'success', results: services.length, data: { services } }
    return response.data.data.services;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch trending services';
    console.error('Get trending services error:', error.response?.data || error.message);
    throw new Error(message);
  }
};

// Functions for sellers to manage services (to be used in Seller Dashboard)
// Create a new service
const createService = async (serviceData, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.post(API_URL, serviceData, config);
    return response.data.data.service;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to create service';
    throw new Error(message);
  }
};

// Update an existing service
const updateService = async (serviceId, serviceData, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.patch(`${API_URL}/${serviceId}`, serviceData, config);
    return response.data.data.service;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to update service';
    throw new Error(message);
  }
};

// Delete a service
const deleteService = async (serviceId, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    await axios.delete(`${API_URL}/${serviceId}`, config);
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to delete service';
    throw new Error(message);
  }
};

const serviceService = {
  getServices,
  getServiceById,
  getTrendingServices,
  createService,
  updateService,
  deleteService,
  // Add a review to a service
  addServiceReview: async (serviceId, reviewData, token) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.post(`${API_URL}/${serviceId}/reviews`, reviewData, config);
      return response.data.data.review; // Or the whole service with updated reviews
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to add service review';
      throw new Error(message);
    }
  },
  // Fetch services listed by the currently authenticated seller
  getMyServices: async (token) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      // Assuming backend route is /api/seller/dashboard/my-services
      const response = await axios.get('/api/seller/dashboard/my-services', config);
      return response.data.data.services;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch your services';
      throw new Error(message);
    }
  },
};

export default serviceService;

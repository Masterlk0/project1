import axios from 'axios';

const API_URL = '/api/products'; // Proxy handles redirection
const BOOSTING_API_URL = '/api/boosting'; // For trending products

// Fetch all products (supports query parameters for filtering, pagination, sorting)
// Example: getProducts({ category: 'Electronics', limit: 10, page: 1, sort: '-createdAt' })
const getProducts = async (params = {}) => {
  try {
    const response = await axios.get(API_URL, { params });
    // Backend sends { status: 'success', results: products.length, data: { products } }
    return response.data.data.products;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch products';
    console.error('Get products service error:', error.response?.data || error.message);
    throw new Error(message);
  }
};

// Fetch a single product by its ID
const getProductById = async (productId) => {
  try {
    const response = await axios.get(`${API_URL}/${productId}`);
    // Backend sends { status: 'success', data: { product } }
    return response.data.data.product;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch product details';
    console.error('Get product by ID service error:', error.response?.data || error.message);
    throw new Error(message);
  }
};

// Fetch trending products
const getTrendingProducts = async (limit = 10) => {
  try {
    const response = await axios.get(`${BOOSTING_API_URL}/trending-products`, { params: { limit } });
    // Backend sends { status: 'success', results: products.length, data: { products } }
    return response.data.data.products;
  } catch (error)
 {
    const message = error.response?.data?.message || error.message || 'Failed to fetch trending products';
    console.error('Get trending products service error:', error.response?.data || error.message);
    throw new Error(message);
  }
};

// Functions for sellers to manage products (to be used in Seller Dashboard)
// Create a new product
const createProduct = async (productData, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        // 'Content-Type': 'application/json' // Axios sets this by default for objects
      },
    };
    const response = await axios.post(API_URL, productData, config);
    return response.data.data.product;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to create product';
    throw new Error(message);
  }
};

// Update an existing product
const updateProduct = async (productId, productData, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.patch(`${API_URL}/${productId}`, productData, config);
    return response.data.data.product;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to update product';
    throw new Error(message);
  }
};

// Delete a product
const deleteProduct = async (productId, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    await axios.delete(`${API_URL}/${productId}`, config);
    // No content returned on successful delete (204)
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to delete product';
    throw new Error(message);
  }
};


const productService = {
  getProducts,
  getProductById,
  getTrendingProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  // Add a review to a product
  addProductReview: async (productId, reviewData, token) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.post(`${API_URL}/${productId}/reviews`, reviewData, config);
      return response.data.data.review; // Or the whole product with updated reviews
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to add product review';
      throw new Error(message);
    }
  },
  // Fetch products listed by the currently authenticated seller
  getMyProducts: async (token) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      // Assuming backend route is /api/seller/dashboard/my-products
      const response = await axios.get('/api/seller/dashboard/my-products', config);
      return response.data.data.products;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch your products';
      throw new Error(message);
    }
  },
};

export default productService;

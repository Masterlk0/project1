import axios from 'axios';

const API_URL = '/api/orders'; // Proxy handles redirection
const SELLER_API_URL = '/api/seller/dashboard'; // For seller-specific order fetching

// Fetch orders for the current seller
const getMySalesOrders = async (token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.get(`${SELLER_API_URL}/my-orders`, config);
    // Backend sends { status: 'success', results: orders.length, data: { orders } }
    return response.data.data.orders;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch sales orders';
    console.error('Get sales orders service error:', error.response?.data || error.message);
    throw new Error(message);
  }
};

// Fetch a single order by ID (can be used by seller if they are part of the order)
const getOrderById = async (orderId, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.get(`${API_URL}/${orderId}`, config);
    return response.data.data.order;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch order details';
    throw new Error(message);
  }
};

// Update order status (by seller or admin)
const updateOrderStatus = async (orderId, statusData, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.patch(`${API_URL}/${orderId}/status`, statusData, config);
    return response.data.data.order;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to update order status';
    throw new Error(message);
  }
};

// Buyer function - Create a new order
const createOrder = async (orderData, token) => {
    try {
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
        const response = await axios.post(API_URL, orderData, config);
        return response.data.data.order;
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Failed to create order';
        throw new Error(message);
    }
};

// Buyer function - Get orders placed by the current buyer
const getMyOrdersAsBuyer = async (token) => {
    try {
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
        const response = await axios.get(`${API_URL}/my-orders`, config);
        return response.data.data.orders;
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Failed to fetch your orders';
        throw new Error(message);
    }
};


const orderService = {
  getMySalesOrders,
  getOrderById,       // Generic, can be used by seller/buyer/admin based on backend auth
  updateOrderStatus,
  createOrder,        // Buyer specific
  getMyOrdersAsBuyer, // Buyer specific
};

export default orderService;

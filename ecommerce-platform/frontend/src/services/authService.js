import axios from 'axios';

const API_URL = '/api/auth'; // Proxy will handle redirection to http://localhost:5000/api/auth

const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    // Backend is expected to send back { status: 'success', token, data: { user } }
    if (response.data && response.data.token && response.data.data.user) {
      return {
        user: response.data.data.user,
        token: response.data.token,
      };
    } else {
      // Should not happen if backend is consistent
      throw new Error('Registration response did not contain expected data.');
    }
  } catch (error) {
    // Axios wraps the error response in error.response
    const message = error.response?.data?.message || error.message || 'Registration failed';
    console.error('Registration service error:', error.response?.data || error.message);
    throw new Error(message);
  }
};

const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    // Backend is expected to send back { status: 'success', token, data: { user } }
    if (response.data && response.data.token && response.data.data.user) {
      return {
        user: response.data.data.user,
        token: response.data.token,
      };
    } else {
      // Should not happen if backend is consistent
      throw new Error('Login response did not contain expected data.');
    }
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Login failed';
    console.error('Login service error:', error.response?.data || error.message);
    throw new Error(message);
  }
};

// Logout might not need an API call if JWTs are stateless and expire on their own.
// However, if backend maintains a session or has token blocklisting, an API call would be here.
// const logout = async () => {
//   // Example: await axios.post(`${API_URL}/logout`);
//   // For now, logout is handled client-side by clearing token and user state.
// };

const authService = {
  register,
  login,
  // logout,
};

export default authService;

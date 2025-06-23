import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios'; // For potential direct calls or setting defaults

// Helper to get token/user from localStorage (can be moved to authService)
const getInitialUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      return { user: JSON.parse(storedUser), token: storedToken, isAuthenticated: true };
    }
  } catch (error) {
    console.error("Error parsing user from localStorage", error);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
  return { user: null, token: null, isAuthenticated: false };
};


const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(getInitialUser());

  useEffect(() => {
    // Persist user and token to localStorage whenever authState changes
    if (authState.isAuthenticated && authState.user && authState.token) {
      localStorage.setItem('user', JSON.stringify(authState.user));
      localStorage.setItem('token', authState.token);
      // Set axios default header for subsequent requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${authState.token}`;
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [authState]);

  const login = (userData) => {
    // userData expected to have user object and token
    setAuthState({
      user: userData.user,
      token: userData.token,
      isAuthenticated: true,
    });
  };

  const register = (userData) => {
    // Similar to login, backend might return user and token upon registration
     setAuthState({
      user: userData.user,
      token: userData.token,
      isAuthenticated: true,
    });
  };

  const logout = () => {
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
    // Optionally, could also make an API call to backend to invalidate session/token if implemented
    // navigate('/login'); // Handled by components consuming context or route protection
  };

  const value = {
    ...authState,
    login,
    register, // Added register here for consistency, though it might just call login after API success
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

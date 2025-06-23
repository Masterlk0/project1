import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';

import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import ProductListPage from './pages/ProductListPage';
import ServiceListPage from './pages/ServiceListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import CreateProductPage from './pages/CreateProductPage';
import EditProductPage from './pages/EditProductPage';
import CreateServicePage from './pages/CreateServicePage';
import EditServicePage from './pages/EditServicePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ChatPage from './pages/ChatPage'; // Import ChatPage


function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="container">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/services" element={<ServiceListPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/service/:id" element={<ServiceDetailPage />} />
            <Route path="/cart" element={<CartPage />} />

            {/* Private Routes */}
            <Route
              path="/account"
              element={
                <PrivateRoute>
                  <AccountPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <PrivateRoute>
                  <CheckoutPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/orders/history"
              element={
                <PrivateRoute>
                  <OrderHistoryPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/order/:id"
              element={
                <PrivateRoute>
                  <OrderDetailPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/chat" // Main chat page
              element={
                <PrivateRoute>
                  <ChatPage />
                </PrivateRoute>
              }
            />
            {/* Specific chat initiation can also be handled by /chat with query params */}
            {/* <Route
              path="/chat/:chatId" // If we want direct links to specific chats
              element={
                <PrivateRoute>
                  <ChatPage />
                </PrivateRoute>
              }
            /> */}
            <Route
              path="/seller/dashboard"
              element={
                <PrivateRoute roles={['seller', 'admin']}>
                  <SellerDashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/seller/products/create"
              element={
                <PrivateRoute roles={['seller', 'admin']}>
                  <CreateProductPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/seller/product/edit/:id"
              element={
                <PrivateRoute roles={['seller', 'admin']}>
                  <EditProductPage />
                </PrivateRoute>
              }
            />
             <Route
              path="/seller/services/create"
              element={
                <PrivateRoute roles={['seller', 'admin']}>
                  <CreateServicePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/seller/service/edit/:id"
              element={
                <PrivateRoute roles={['seller', 'admin']}>
                  <EditServicePage />
                </PrivateRoute>
              }
            />

            {/* Add more routes as needed */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

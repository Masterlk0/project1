import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import productService from '../services/productService';
import serviceService from '../services/serviceService';
import orderService from '../services/orderService'; // Import orderService
import ProductCard from '../components/ProductCard';
import ServiceCard from '../components/ServiceCard';

const sectionStyle = {
  marginBottom: '30px',
  padding: '15px',
  border: '1px solid #eee',
  borderRadius: '5px',
};

const listStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px',
  justifyContent: 'flex-start',
};

const itemManagementStyle = {
  marginTop: '5px',
  display: 'flex',
  gap: '10px',
  justifyContent: 'center',
};

const orderTableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px'
};

const thTdStyle = {
    border: '1px solid #ddd',
    padding: '8px',
    textAlign: 'left'
};


const SellerDashboardPage = () => {
  const { token, user } = useAuth();
  const [myProducts, setMyProducts] = useState([]);
  const [myServices, setMyServices] = useState([]);
  const [mySalesOrders, setMySalesOrders] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [productError, setProductError] = useState('');
  const [serviceError, setServiceError] = useState('');
  const [orderError, setOrderError] = useState('');

  // Available order statuses from backend Order model
  const availableOrderStatuses = [
      'pending_payment', 'pending_confirmation', 'confirmed', 'processing',
      'shipped', 'delivered', 'booked', 'service_in_progress', 'completed',
      'cancelled_by_buyer', 'cancelled_by_seller', 'disputed'
  ];

  const fetchSellerProducts = () => {
    if (token) {
      setLoadingProducts(true);
      productService.getMyProducts(token)
        .then(data => setMyProducts(data))
        .catch(err => setProductError(err.message || 'Failed to load your products.'))
        .finally(() => setLoadingProducts(false));
    }
  };

  const fetchSellerServices = () => {
     if (token) {
      setLoadingServices(true);
      serviceService.getMyServices(token)
        .then(data => setMyServices(data))
        .catch(err => setServiceError(err.message || 'Failed to load your services.'))
        .finally(() => setLoadingServices(false));
    }
  };

  const fetchSalesOrders = () => {
    if (token) {
      setLoadingOrders(true);
      orderService.getMySalesOrders(token)
        .then(data => setMySalesOrders(data))
        .catch(err => setOrderError(err.message || 'Failed to load your sales orders.'))
        .finally(() => setLoadingOrders(false));
    }
  };

  useEffect(() => {
    fetchSellerProducts();
    fetchSellerServices();
    fetchSalesOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(productId, token);
        fetchSellerProducts();
      } catch (err) {
        setProductError(err.message || 'Failed to delete product.');
      }
    }
  };

  const handleDeleteService = async (serviceId) => {
     if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await serviceService.deleteService(serviceId, token);
        fetchSellerServices();
      } catch (err) {
        setServiceError(err.message || 'Failed to delete service.');
      }
    }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    setOrderError('');
    try {
        await orderService.updateOrderStatus(orderId, { status: newStatus }, token);
        fetchSalesOrders(); // Refresh orders list
    } catch (err) {
        setOrderError(err.message || `Failed to update status for order ${orderId}.`);
    }
  };


  if (!user) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <div>
      <h2>Seller Dashboard</h2>
      <p>Welcome, {user.username}! Manage your products, services, and orders here.</p>

      <section style={sectionStyle}>
        <h3>My Products</h3>
        {loadingProducts && <p>Loading your products...</p>}
        {productError && <p style={{ color: 'red' }}>{productError}</p>}
        {!loadingProducts && !productError && myProducts.length === 0 && <p>You have not listed any products yet.</p>}
        {!loadingProducts && !productError && myProducts.length > 0 && (
          <div style={listStyle}>
            {myProducts.map(product => (
              <div key={product._id} style={{border: '1px solid #f0f0f0', padding: '5px', borderRadius: '5px'}}>
                 <ProductCard product={product} /> {/* sellerId should be populated now */}
                 <div style={itemManagementStyle}>
                    <Link to={`/seller/product/edit/${product._id}`}>Edit</Link>
                    <button onClick={() => handleDeleteProduct(product._id)} style={{color: 'red', background: 'none', border: 'none', cursor: 'pointer'}}>Delete</button>
                 </div>
              </div>
            ))}
          </div>
        )}
         <Link to="/seller/products/create" style={{display: 'block', marginTop: '10px', fontWeight: 'bold'}}>+ Add New Product</Link>
      </section>

      <section style={sectionStyle}>
        <h3>My Services</h3>
        {loadingServices && <p>Loading your services...</p>}
        {serviceError && <p style={{ color: 'red' }}>{serviceError}</p>}
        {!loadingServices && !serviceError && myServices.length === 0 && <p>You have not listed any services yet.</p>}
        {!loadingServices && !serviceError && myServices.length > 0 && (
          <div style={listStyle}>
            {myServices.map(service => (
               <div key={service._id} style={{border: '1px solid #f0f0f0', padding: '5px', borderRadius: '5px'}}>
                <ServiceCard service={service} /> {/* sellerId should be populated now */}
                 <div style={itemManagementStyle}>
                    <Link to={`/seller/service/edit/${service._id}`}>Edit</Link>
                     <button onClick={() => handleDeleteService(service._id)} style={{color: 'red', background: 'none', border: 'none', cursor: 'pointer'}}>Delete</button>
                 </div>
              </div>
            ))}
          </div>
        )}
        <Link to="/seller/services/create" style={{display: 'block', marginTop: '10px', fontWeight: 'bold'}}>+ Add New Service</Link>
      </section>

      <section style={sectionStyle}>
        <h3>My Sales Orders</h3>
        {loadingOrders && <p>Loading your sales orders...</p>}
        {orderError && <p style={{ color: 'red' }}>{orderError}</p>}
        {!loadingOrders && !orderError && mySalesOrders.length === 0 && <p>You have no sales orders yet.</p>}
        {!loadingOrders && !orderError && mySalesOrders.length > 0 && (
          <table style={orderTableStyle}>
            <thead>
              <tr>
                <th style={thTdStyle}>Order ID</th>
                <th style={thTdStyle}>Date</th>
                <th style={thTdStyle}>Buyer</th>
                <th style={thTdStyle}>Total</th>
                <th style={thTdStyle}>Status</th>
                <th style={thTdStyle}>Items</th>
                <th style={thTdStyle}>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {mySalesOrders.map(order => (
                <tr key={order._id}>
                  <td style={thTdStyle}><Link to={`/order/${order._id}`}>{order._id.slice(-6)}</Link></td> {/* Link to full order detail page eventually */}
                  <td style={thTdStyle}>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td style={thTdStyle}>{order.buyerId?.username || 'N/A'}</td>
                  <td style={thTdStyle}>${order.totalAmount.toFixed(2)}</td>
                  <td style={thTdStyle}>{order.status}</td>
                  <td style={thTdStyle}>
                    <ul>
                      {order.items.filter(item => item.sellerId === user._id).map(item => ( // Show only items by this seller
                        <li key={item.itemId._id || item.itemId}>{item.name} (Qty: {item.quantity})</li>
                      ))}
                    </ul>
                  </td>
                  <td style={thTdStyle}>
                    <select
                        value={order.status}
                        onChange={(e) => handleOrderStatusUpdate(order._id, e.target.value)}
                        disabled={['delivered', 'completed', 'cancelled_by_buyer', 'cancelled_by_seller'].includes(order.status)} // Disable for terminal states
                    >
                        {availableOrderStatuses.map(statusVal => (
                            <option key={statusVal} value={statusVal}>{statusVal.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default SellerDashboardPage;

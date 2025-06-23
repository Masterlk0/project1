import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import orderService from '../services/orderService';

const detailPageStyle = {
  padding: '20px',
  maxWidth: '800px',
  margin: 'auto',
};

const sectionStyle = {
  marginBottom: '20px',
  padding: '15px',
  border: '1px solid #ddd',
  borderRadius: '5px',
  background: '#f9f9f9'
};

const itemStyle = {
  display: 'flex',
  marginBottom: '10px',
  paddingBottom: '10px',
  borderBottom: '1px solid #eee'
};

const itemImageStyle = {
  width: '60px',
  height: '60px',
  objectFit: 'cover',
  marginRight: '15px',
  borderRadius: '4px'
};

const OrderDetailPage = () => {
  const { id: orderId } = useParams();
  const { token, isAuthenticated, user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && token && orderId) {
      setLoading(true);
      orderService.getOrderById(orderId, token)
        .then(fetchedOrder => {
          // Basic authorization check: is this user the buyer or a seller involved?
          // Backend already does this, but an extra client check can be good UX.
          const isBuyer = fetchedOrder.buyerId._id === user._id;
          const isSellerInOrder = fetchedOrder.items.some(item => item.sellerId._id === user._id);

          if (isBuyer || isSellerInOrder || user.role === 'admin') {
            setOrder(fetchedOrder);
          } else {
            setError('You are not authorized to view this order.');
          }
          setError('');
        })
        .catch(err => {
          setError(err.message || 'Failed to fetch order details.');
          setOrder(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (!isAuthenticated) {
        setError('Please login to view order details.');
        setLoading(false);
    }
  }, [isAuthenticated, token, orderId, user]);

  if (loading) return <p>Loading order details...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!order) return <p>Order not found or you are not authorized to view it.</p>;

  return (
    <div style={detailPageStyle}>
      <h2>Order Details</h2>
      <Link to="/orders/history">Back to Order History</Link>

      <div style={sectionStyle}>
        <h3>Order Information</h3>
        <p><strong>Order ID:</strong> {order._id}</p>
        <p><strong>Date Placed:</strong> {new Date(order.createdAt).toLocaleString()}</p>
        <p><strong>Status:</strong> <span style={{fontWeight: 'bold', color: order.status.includes('cancelled') ? 'red' : 'green'}}>{order.status.replace(/_/g, ' ')}</span></p>
        <p><strong>Total Amount:</strong> ${order.totalAmount.toFixed(2)}</p>
        {order.notesToSeller && <p><strong>Notes to Seller:</strong> {order.notesToSeller}</p>}
      </div>

      {order.shippingAddress && (
        <div style={sectionStyle}>
          <h3>Shipping Address</h3>
          <p>{order.shippingAddress.street}</p>
          <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
          <p>{order.shippingAddress.country}</p>
          {order.shippingAddress.phoneNumber && <p>Phone: {order.shippingAddress.phoneNumber}</p>}
        </div>
      )}

      {/* Add similar section for Service Address / Date if applicable */}

      <div style={sectionStyle}>
        <h3>Items in this Order</h3>
        {order.items.map(item => (
          <div key={`${item.itemId._id || item.itemId}-${item.itemType}`} style={itemStyle}>
            {item.image && <img src={item.image} alt={item.name} style={itemImageStyle} />}
            {!item.image && <div style={{...itemImageStyle, backgroundColor: '#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center'}}>{item.itemType}</div>}
            <div>
              <Link to={item.itemType === 'Product' ? `/product/${item.itemId._id || item.itemId}` : `/service/${item.itemId._id || item.itemId}`}>
                <strong>{item.name}</strong>
              </Link>
              <p>Type: {item.itemType}</p>
              <p>Quantity: {item.quantity}</p>
              <p>Price per item: ${item.priceAtPurchase.toFixed(2)}</p>
              <p>Seller: {item.sellerId?.username || 'N/A'}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={sectionStyle}>
        <h3>Payment Information</h3>
        <p><strong>Payment Method:</strong> {order.paymentDetails.method.replace(/_/g, ' ')}</p>
        <p><strong>Payment Status:</strong> {order.paymentDetails.status}</p>
        {order.paymentDetails.paidAt && <p><strong>Paid At:</strong> {new Date(order.paymentDetails.paidAt).toLocaleString()}</p>}
        {order.paymentDetails.transactionId && <p><strong>Transaction ID:</strong> {order.paymentDetails.transactionId}</p>}
      </div>
    </div>
  );
};

export default OrderDetailPage;

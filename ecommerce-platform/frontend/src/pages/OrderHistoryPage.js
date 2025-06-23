import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import orderService from '../services/orderService'; // Assuming this service exists

const orderHistoryPageStyle = {
  padding: '20px',
};

const orderTableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: '20px',
};

const thTdStyle = {
  border: '1px solid #ddd',
  padding: '10px',
  textAlign: 'left',
};

const OrderHistoryPage = () => {
  const { user, token, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && token) {
      setLoading(true);
      orderService.getMyOrdersAsBuyer(token)
        .then(fetchedOrders => {
          setOrders(fetchedOrders);
          setError('');
        })
        .catch(err => {
          setError(err.message || 'Failed to fetch order history.');
          setOrders([]); // Clear previous orders on error
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
      // setError('You must be logged in to view your order history.'); // Or redirect
    }
  }, [isAuthenticated, token]);

  if (!isAuthenticated) {
    return (
      <div style={orderHistoryPageStyle}>
        <h2>Order History</h2>
        <p>Please <Link to="/login">login</Link> to view your order history.</p>
      </div>
    );
  }

  if (loading) return <p>Loading your order history...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div style={orderHistoryPageStyle}>
      <h2>My Order History</h2>
      {orders.length === 0 ? (
        <p>You have not placed any orders yet.</p>
      ) : (
        <table style={orderTableStyle}>
          <thead>
            <tr>
              <th style={thTdStyle}>Order ID</th>
              <th style={thTdStyle}>Date Placed</th>
              <th style={thTdStyle}>Total Amount</th>
              <th style={thTdStyle}>Status</th>
              <th style={thTdStyle}>Items</th>
              <th style={thTdStyle}>Details</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                <td style={thTdStyle}>{order._id.slice(-8)}...</td> {/* Shortened ID */}
                <td style={thTdStyle}>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td style={thTdStyle}>${order.totalAmount ? order.totalAmount.toFixed(2) : 'N/A'}</td>
                <td style={thTdStyle}>{order.status.replace(/_/g, ' ')}</td>
                <td style={thTdStyle}>
                  {order.items.length} item(s)
                  {/* Could list first item name: order.items[0]?.name */}
                </td>
                <td style={thTdStyle}>
                  <Link to={`/order/${order._id}`}>View Details</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OrderHistoryPage;

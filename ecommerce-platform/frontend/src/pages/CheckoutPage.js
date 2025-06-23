import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import orderService from '../services/orderService';

const checkoutPageStyle = {
  padding: '20px',
  maxWidth: '700px',
  margin: 'auto',
};

const formSectionStyle = {
  marginBottom: '20px',
  padding: '15px',
  border: '1px solid #ddd',
  borderRadius: '5px',
};

const inputStyle = {
  width: 'calc(100% - 22px)', // Account for padding and border
  padding: '10px',
  marginBottom: '10px',
  borderRadius: '4px',
  border: '1px solid #ccc',
};


const CheckoutPage = () => {
  const { cartState, cartTotal, clearCart } = useCart();
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '', // Consider state/province
    zipCode: user?.address?.zipCode || '',
    country: user?.address?.country || '',
    phoneNumber: user?.phoneNumber || ''
  });
  // Add serviceAddress and serviceDate if needed for services
  const [notesToSeller, setNotesToSeller] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('stripe_placeholder'); // Default
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
    }
    if (cartState.items.length === 0 && isAuthenticated) { // Don't redirect if not authenticated yet
      alert("Your cart is empty. Add items before proceeding to checkout.");
      navigate('/');
    }
  }, [cartState.items, isAuthenticated, navigate]);

  const handleShippingChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const orderData = {
      items: cartState.items.map(item => ({ // Ensure items are in the format backend expects
        itemId: item._id,
        itemType: item.itemType,
        name: item.name, // Denormalized
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase, // Denormalized
        sellerId: item.sellerId
      })),
      // totalAmount will be recalculated by backend, but good to send for verification
      // shippingAddress, // Will be added if any product in cart
      // serviceDate, serviceAddress for services
      notesToSeller,
      paymentMethod,
    };

    const hasProduct = cartState.items.some(item => item.itemType === 'Product');
    if (hasProduct) {
        if(!shippingAddress.street || !shippingAddress.city || !shippingAddress.zipCode || !shippingAddress.country) {
            setError('Full shipping address is required for products.');
            setLoading(false);
            return;
        }
        orderData.shippingAddress = shippingAddress;
    }
    // Add similar logic for service-specific details if needed


    try {
      await orderService.createOrder(orderData, token);
      clearCart();
      alert('Order placed successfully!'); // Replace with better notification
      navigate('/orders/history'); // Redirect to order history page
    } catch (err) {
      setError(err.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return <p>Redirecting to login...</p>; // Or a loading spinner
  if (cartState.items.length === 0) return <p>Your cart is empty.</p>;


  return (
    <div style={checkoutPageStyle}>
      <h2>Checkout</h2>
      <form onSubmit={handleSubmitOrder}>
        {cartState.items.some(item => item.itemType === 'Product') && (
          <div style={formSectionStyle}>
            <h3>Shipping Address</h3>
            <label htmlFor="street">Street:</label>
            <input type="text" name="street" value={shippingAddress.street} onChange={handleShippingChange} required style={inputStyle} />
            <label htmlFor="city">City:</label>
            <input type="text" name="city" value={shippingAddress.city} onChange={handleShippingChange} required style={inputStyle} />
            <label htmlFor="state">State/Province:</label>
            <input type="text" name="state" value={shippingAddress.state} onChange={handleShippingChange} style={inputStyle} />
            <label htmlFor="zipCode">Zip/Postal Code:</label>
            <input type="text" name="zipCode" value={shippingAddress.zipCode} onChange={handleShippingChange} required style={inputStyle} />
            <label htmlFor="country">Country:</label>
            <input type="text" name="country" value={shippingAddress.country} onChange={handleShippingChange} required style={inputStyle} />
            <label htmlFor="phoneNumber">Phone Number (for delivery):</label>
            <input type="tel" name="phoneNumber" value={shippingAddress.phoneNumber} onChange={handleShippingChange} style={inputStyle} />
          </div>
        )}

        {/* Add similar sections for Service Date/Address if needed */}

        <div style={formSectionStyle}>
            <h3>Order Summary</h3>
            {cartState.items.map(item => (
                <p key={`${item._id}-${item.itemType}`}>{item.name} (x{item.quantity}) - ${ (item.priceAtPurchase * item.quantity).toFixed(2) }</p>
            ))}
            <h4>Total: ${cartTotal.toFixed(2)}</h4>
        </div>

        <div style={formSectionStyle}>
          <h3>Additional Information</h3>
          <label htmlFor="notesToSeller">Notes for Seller(s) (Optional):</label>
          <textarea
            name="notesToSeller"
            value={notesToSeller}
            onChange={(e) => setNotesToSeller(e.target.value)}
            rows="3"
            style={{...inputStyle, width: 'calc(100% - 22px)'}}
          />
        </div>

        <div style={formSectionStyle}>
          <h3>Payment Method</h3>
          {/* This is a placeholder. Real payment integration is complex. */}
          <select name="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={inputStyle}>
            <option value="stripe_placeholder">Credit/Debit Card (Stripe - Placeholder)</option>
            {/* <option value="paypal_placeholder">PayPal (Placeholder)</option> */}
          </select>
          <p><small>Actual payment processing is not implemented in this demo.</small></p>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading || cartState.items.length === 0} style={{ padding: '12px 25px', background: 'darkgreen', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1.1em' }}>
          {loading ? 'Placing Order...' : `Place Order (${cartTotal.toFixed(2)})`}
        </button>
      </form>
    </div>
  );
};

export default CheckoutPage;

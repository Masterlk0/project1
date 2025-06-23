import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext'; // To check if user is logged in for checkout

const cartPageStyle = {
  padding: '20px',
};

const cartItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #eee',
  padding: '10px 0',
  marginBottom: '10px',
};

const itemDetailsStyle = {
  flexGrow: 1,
};

const itemImageStyle = {
  width: '80px',
  height: '80px',
  objectFit: 'cover',
  marginRight: '15px',
  borderRadius: '4px'
};

const CartPage = () => {
  const { cartState, removeItem, updateQuantity, clearCart, cartTotal, itemCount } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleQuantityChange = (itemId, itemType, newQuantity) => {
    const quantityNum = parseInt(newQuantity, 10);
    if (quantityNum >= 1) {
      updateQuantity(itemId, itemType, quantityNum);
    }
  };

  const handleRemoveItem = (itemId, itemType) => {
    removeItem(itemId, itemType);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } }); // Redirect to login, then to checkout
    } else {
      navigate('/checkout'); // Proceed to checkout page (to be created)
    }
  };

  if (cartState.items.length === 0) {
    return (
      <div style={cartPageStyle}>
        <h2>Your Shopping Cart</h2>
        <p>Your cart is empty.</p>
        <Link to="/">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div style={cartPageStyle}>
      <h2>Your Shopping Cart ({itemCount} items)</h2>
      {cartState.items.map((item) => (
        <div key={`${item._id}-${item.itemType}`} style={cartItemStyle}>
          {item.image && <img src={item.image} alt={item.name} style={itemImageStyle} />}
          {!item.image && <div style={{...itemImageStyle, backgroundColor: '#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center'}}>{item.itemType}</div>}
          <div style={itemDetailsStyle}>
            <Link to={item.itemType === 'Product' ? `/product/${item._id}` : `/service/${item._id}`}>
              <strong>{item.name}</strong>
            </Link>
            <p>Type: {item.itemType}</p>
            <p>Price: ${item.priceAtPurchase ? item.priceAtPurchase.toFixed(2) : 'N/A'}</p>
          </div>
          <div>
            <label htmlFor={`quantity-${item._id}`}>Qty: </label>
            <input
              type="number"
              id={`quantity-${item._id}-${item.itemType}`}
              value={item.quantity}
              onChange={(e) => handleQuantityChange(item._id, item.itemType, e.target.value)}
              min="1"
              style={{ width: '60px', marginRight: '10px', padding: '5px' }}
            />
            <button onClick={() => handleRemoveItem(item._id, item.itemType)} style={{color: 'red'}}>Remove</button>
          </div>
        </div>
      ))}
      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <h3>Total: ${cartTotal ? cartTotal.toFixed(2) : '0.00'}</h3>
        <button onClick={clearCart} style={{ marginRight: '10px' }}>Clear Cart</button>
        <button onClick={handleCheckout} style={{ padding: '10px 20px', background: 'green', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default CartPage;

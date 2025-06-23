import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext'; // Import useCart
// import './Navbar.css'; // Optional: if Navbar needs specific styling

const Navbar = () => {
  const { isAuthenticated, user, logout: logoutContext } = useAuth();
  const { itemCount } = useCart(); // Get itemCount from CartContext
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutContext();
    navigate('/login'); // Redirect to login page after logout
  };

  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/products">Products</Link> {/* Assuming a future products page */}
        </li>
        <li>
          <Link to="/services">Services</Link> {/* Assuming a future services page */}
        </li>
        {isAuthenticated && user ? ( // Check for user object as well
          <>
            {user.role === 'seller' && (
              <li>
                <Link to="/seller/dashboard">Dashboard</Link>
              </li>
            )}
            <li>
              <Link to="/account">My Account ({user.username})</Link> {/* Display username */}
            </li>
            <li>
              <Link to="/chat">Messages</Link> {/* Add Messages/Chat link */}
            </li>
            <li>
              <button onClick={handleLogout} style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, margin: 0, fontSize: 'inherit'}}>Logout</button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
          </>
        )}
        <li>
           <Link to="/cart">Cart {itemCount > 0 && `(${itemCount})`}</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;

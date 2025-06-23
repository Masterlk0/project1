import React from 'react';
import { Link } from 'react-router-dom';

// Basic styling for the card - can be moved to a CSS file
const cardStyle = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '15px',
  margin: '10px',
  width: '200px', // Fixed width, adjust as needed
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
};

const imageStyle = {
  width: '100%',
  maxHeight: '150px',
  objectFit: 'cover', // Or 'contain' based on preference
  marginBottom: '10px',
  borderRadius: '4px'
};

const ProductCard = ({ product }) => {
  if (!product) {
    return null;
  }

  // Use a placeholder image if no image is available
  const imageUrl = product.images && product.images.length > 0
                   ? product.images[0]
                   : 'https://via.placeholder.com/200x150?text=No+Image';

  return (
    <div style={cardStyle}>
      <img src={imageUrl} alt={product.name} style={imageStyle} />
      <h3>
        <Link to={`/product/${product._id}`}>{product.name}</Link>
      </h3>
      <p>${product.price ? product.price.toFixed(2) : 'N/A'}</p>
      {product.category && <p><small>Category: {product.category}</small></p>}
      {product.sellerId && product.sellerId.username && (
        <p><small>Seller: {product.sellerId.username}</small></p>
      )}
      <Link to={`/product/${product._id}`} style={{ marginTop: 'auto' }}>View Details</Link>
    </div>
  );
};

export default ProductCard;

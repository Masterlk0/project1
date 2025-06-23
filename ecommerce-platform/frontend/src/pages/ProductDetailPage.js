import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import productService from '../services/productService';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import ReviewList from '../components/ReviewList'; // Import ReviewList
import ReviewForm from '../components/ReviewForm'; // Import ReviewForm

const detailPageStyle = {
  padding: '20px',
  maxWidth: '800px',
  margin: 'auto',
};

const imageGalleryStyle = {
  display: 'flex',
  gap: '10px',
  marginBottom: '20px',
  // Basic gallery styling, can be improved with a carousel library
};

const mainImageStyle = {
  maxWidth: '100%',
  maxHeight: '400px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  objectFit: 'contain',
};

const thumbnailStyle = {
  width: '80px',
  height: '80px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  objectFit: 'cover',
  cursor: 'pointer',
};

const ProductDetailPage = () => {
  const { id } = useParams(); // Get product ID from URL
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState('');

  const { isAuthenticated, user, token } = useAuth();
  const { addItem } = useCart();

  const fetchProductDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedProduct = await productService.getProductById(id);
      setProduct(fetchedProduct);
      if (fetchedProduct.images && fetchedProduct.images.length > 0) {
        setSelectedImage(fetchedProduct.images[0]);
      } else {
        setSelectedImage('https://via.placeholder.com/400x300?text=No+Image');
      }
    } catch (err) {
      setError(err.message || `Failed to load product with ID ${id}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProductDetails();
    }
  }, [id]);


  const handleReviewSubmitted = async (reviewData, authToken) => {
    // This function will be passed to ReviewForm
    // It should call the productService to add the review
    // and then refresh the product data to show the new review
    if (!product) return;
    try {
      await productService.addProductReview(product._id, reviewData, authToken);
      fetchProductDetails(); // Re-fetch product to get updated reviews
      alert('Review submitted successfully!');
    } catch (error) {
      throw error; // Let ReviewForm handle displaying the error
    }
  };

  if (loading) return <p>Loading product details...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!product) return <p>Product not found.</p>;

  const handleThumbnailClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleAddToCart = () => {
    if (product) {
      const itemToAdd = {
        _id: product._id,
        name: product.name,
        priceAtPurchase: product.price, // Use priceAtPurchase for consistency in cart
        itemType: 'Product',
        sellerId: product.sellerId?._id || product.sellerId, // Handle populated or direct ID
        image: product.images && product.images.length > 0 ? product.images[0] : undefined,
        // quantity will be handled by cartReducer, default 1 on first add
      };
      addItem(itemToAdd);
      // Optionally, show a notification "Item added to cart"
      alert(`${product.name} added to cart!`);
    }
  };

  const canChatWithSeller = isAuthenticated && user && product.sellerId && user._id !== product.sellerId._id;


  return (
    <div style={detailPageStyle}>
      <h2>{product.name}</h2>

      <div style={imageGalleryStyle}>
        {/* Main Image */}
        <img
            src={selectedImage || (product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/400x300?text=No+Image')}
            alt={product.name}
            style={mainImageStyle}
        />
        {/* Thumbnails (if more than one image) */}
        {product.images && product.images.length > 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {product.images.map((imgUrl, index) => (
              <img
                key={index}
                src={imgUrl}
                alt={`${product.name} thumbnail ${index + 1}`}
                style={thumbnailStyle}
                onClick={() => handleThumbnailClick(imgUrl)}
              />
            ))}
          </div>
        )}
      </div>

      <p><strong>Price:</strong> ${product.price ? product.price.toFixed(2) : 'N/A'}</p>
      <p><strong>Category:</strong> {product.category}</p>
      <p><strong>Stock:</strong> {product.stock > 0 ? `${product.stock} available` : 'Out of Stock'}</p>
      <p><strong>Description:</strong> {product.description || 'No description available.'}</p>

      {product.sellerId && (
        <p>
          <strong>Seller:</strong>{' '}
          {product.sellerId.username || 'Unknown Seller'}
        </p>
      )}

      {/* Add to Cart Button */}
      {product.stock > 0 ? (
        <button onClick={handleAddToCart} style={{ marginRight: '10px' }}>Add to Cart</button>
      ) : (
        <p style={{ color: 'red' }}>Out of Stock</p>
      )}

      {/* Chat with Seller Button */}
      {canChatWithSeller && (
        <Link to={`/chat?receiverId=${product.sellerId._id}&itemId=${product._id}&itemType=Product`}>
          <button style={{ marginLeft: '10px' }}>Chat with Seller</button>
        </Link>
      )}
       {!isAuthenticated && product.sellerId && (
         <p><Link to="/login">Login</Link> to chat with the seller.</p>
       )}


      <div style={{ marginTop: '20px' }}>
        <Link to="/products">Back to Products</Link>
      </div>

      {/* Reviews Section */}
      <div style={{marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px'}}>
        <h3>Ratings & Reviews</h3>
        {product.averageRating > 0 && (
            <p>Average Rating: {product.averageRating.toFixed(1)}/5 ({product.numReviews} reviews)</p>
        )}
        <ReviewList reviews={product.reviews} />
        {isAuthenticated && (
          <ReviewForm
            itemId={product._id}
            itemType="Product"
            onSubmitReview={handleReviewSubmitted}
          />
        )}
        {!isAuthenticated && <p style={{marginTop: '10px'}}><Link to="/login" state={{ from: location }}>Login</Link> to write a review.</p>}
      </div>
    </div>
  );
};

export default ProductDetailPage;

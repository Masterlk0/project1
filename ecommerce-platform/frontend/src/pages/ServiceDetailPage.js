import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import serviceService from '../services/serviceService';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import ReviewList from '../components/ReviewList'; // Import ReviewList
import ReviewForm from '../components/ReviewForm'; // Import ReviewForm

const detailPageStyle = {
  padding: '20px',
  maxWidth: '800px',
  margin: 'auto',
};

// Placeholder for service image/icon if applicable
const serviceIconStyle = {
  width: '150px',
  height: '150px',
  backgroundColor: '#f0f0f0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
  marginBottom: '20px',
  fontSize: '1.5em',
  color: '#555'
};

const ServiceDetailPage = () => {
  const { id } = useParams(); // Get service ID from URL
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { isAuthenticated, user, token } = useAuth();
  const { addItem } = useCart();
  const location = useLocation(); // For login redirect state

  const fetchServiceDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedService = await serviceService.getServiceById(id);
      setService(fetchedService);
    } catch (err) {
      setError(err.message || `Failed to load service with ID ${id}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchServiceDetails();
    }
  }, [id]);

  const handleReviewSubmitted = async (reviewData, authToken) => {
    if (!service) return;
    try {
      await serviceService.addServiceReview(service._id, reviewData, authToken);
      fetchServiceDetails(); // Re-fetch service to get updated reviews
      alert('Review submitted successfully!');
    } catch (error) {
      throw error; // Let ReviewForm handle displaying the error
    }
  };

  if (loading) return <p>Loading service details...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!service) return <p>Service not found.</p>;

  const handleAddToCart = () => {
    if (service) {
      const itemToAdd = {
        _id: service._id,
        name: service.name,
        priceAtPurchase: service.price,
        itemType: 'Service',
        sellerId: service.sellerId?._id || service.sellerId,
        // Services might not have a primary image like products
      };
      addItem(itemToAdd);
      alert(`${service.name} added to cart/booked (basic)!`);
    }
  };

  const canChatWithSeller = isAuthenticated && user && service.sellerId && user._id !== service.sellerId._id;

  return (
    <div style={detailPageStyle}>
      <h2>{service.name}</h2>

      {/* Placeholder for service visual - could be an icon or image */}
      <div style={serviceIconStyle}>
        {service.type || 'Service'}
      </div>

      <p><strong>Price:</strong> ${service.price ? service.price.toFixed(2) : 'N/A'} {service.pricingModel && `(${service.pricingModel})`}</p>
      <p><strong>Type/Category:</strong> {service.type}</p>
      <p><strong>Location/Service Area:</strong> {service.location}</p>
      <p><strong>Availability:</strong> {service.availability || 'Contact seller for availability'}</p>
      <p><strong>Description:</strong> {service.description || 'No detailed description available.'}</p>

      {service.sellerId && (
        <p>
          <strong>Service Provider:</strong>{' '}
          {service.sellerId.username || 'Unknown Provider'}
        </p>
      )}

      {/* Book Service / Add to Cart */}
      <button onClick={handleAddToCart} style={{ marginRight: '10px' }}>
        Add to Cart / Book
      </button>

      {/* Chat with Provider Button */}
      {canChatWithSeller && (
         <Link to={`/chat?receiverId=${service.sellerId._id}&itemId=${service._id}&itemType=Service`}>
          <button style={{ marginLeft: '10px' }}>Chat with Provider</button>
        </Link>
      )}
      {!isAuthenticated && service.sellerId && (
         <p><Link to="/login">Login</Link> to chat with the provider.</p>
       )}

      <div style={{ marginTop: '20px' }}>
        <Link to="/services">Back to Services</Link>
      </div>

      {/* Reviews Section */}
      <div style={{marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px'}}>
        <h3>Ratings & Reviews</h3>
         {service.averageRating > 0 && (
            <p>Average Rating: {service.averageRating.toFixed(1)}/5 ({service.numReviews} reviews)</p>
        )}
        <ReviewList reviews={service.reviews} />
        {isAuthenticated && (
          <ReviewForm
            itemId={service._id}
            itemType="Service"
            onSubmitReview={handleReviewSubmitted}
          />
        )}
        {!isAuthenticated && <p style={{marginTop: '10px'}}><Link to="/login" state={{ from: location }}>Login</Link> to write a review.</p>}
      </div>
    </div>
  );
};

export default ServiceDetailPage;

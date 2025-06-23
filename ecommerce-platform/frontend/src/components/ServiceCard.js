import React from 'react';
import { Link } from 'react-router-dom';

// Basic styling for the card - can be moved to a CSS file
// Using similar style to ProductCard for consistency
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

const placeholderImageStyle = { // In case services don't have images
  width: '100%',
  height: '150px',
  backgroundColor: '#eee',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#aaa',
  marginBottom: '10px',
  borderRadius: '4px',
  fontSize: '14px'
};


const ServiceCard = ({ service }) => {
  if (!service) {
    return null;
  }

  // Placeholder for service image, if services were to have them
  // const imageUrl = service.images && service.images.length > 0
  //                  ? service.images[0]
  //                  : 'https://via.placeholder.com/200x150?text=Service';

  return (
    <div style={cardStyle}>
      {/* If services have images, add an img tag here like in ProductCard */}
      {/* For now, a placeholder or just text content */}
      <div style={placeholderImageStyle}>
        <span>{service.type || 'Service'}</span>
      </div>
      <h3>
        <Link to={`/service/${service._id}`}>{service.name}</Link>
      </h3>
      <p>${service.price ? service.price.toFixed(2) : 'N/A'} {service.pricingModel && `(${service.pricingModel})`}</p>
      {service.type && <p><small>Type: {service.type}</small></p>}
      {service.location && <p><small>Location: {service.location}</small></p>}
      {service.sellerId && service.sellerId.username && (
        <p><small>Provider: {service.sellerId.username}</small></p>
      )}
      <Link to={`/service/${service._id}`} style={{ marginTop: 'auto' }}>View Details</Link>
    </div>
  );
};

export default ServiceCard;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import serviceService from '../services/serviceService'; // Corrected import
import { useAuth } from '../contexts/AuthContext';

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
  maxWidth: '500px',
  margin: '20px auto',
  padding: '20px',
  border: '1px solid #ccc',
  borderRadius: '8px',
};

const inputStyle = {
  padding: '10px',
  borderRadius: '4px',
  border: '1px solid #ddd',
};

const CreateServicePage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [serviceData, setServiceData] = useState({
    name: '',
    description: '',
    type: 'Other', // Default service type
    price: '',
    pricingModel: 'fixed', // Default pricing model
    availability: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setServiceData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!serviceData.name || !serviceData.type || !serviceData.price || !serviceData.location) {
      setError('Name, type, price, and location are required for the service.');
      setLoading(false);
      return;
    }
     if (isNaN(parseFloat(serviceData.price)) || parseFloat(serviceData.price) < 0) {
        setError('Price must be a non-negative number.');
        setLoading(false);
        return;
    }

    try {
      const dataToSubmit = {
        ...serviceData,
        price: parseFloat(serviceData.price),
      };
      await serviceService.createService(dataToSubmit, token);
      navigate('/seller/dashboard'); // Redirect to dashboard
    } catch (err) {
      setError(err.message || 'Failed to create service.');
    } finally {
      setLoading(false);
    }
  };

  // Service types - should ideally match backend enum or be fetched
  const serviceTypes = ['Beauty', 'Home Repair', 'Transport', 'Tutoring', 'Consulting', 'Wellness', 'Events', 'Other'];
  const pricingModels = ['hourly', 'fixed', 'per_session', 'package', 'custom'];


  return (
    <div>
      <h2>Offer New Service</h2>
      <form onSubmit={handleSubmit} style={formStyle}>
        <label htmlFor="name">Service Name:</label>
        <input type="text" name="name" value={serviceData.name} onChange={handleChange} required style={inputStyle} />

        <label htmlFor="description">Description:</label>
        <textarea name="description" value={serviceData.description} onChange={handleChange} style={inputStyle} />

        <label htmlFor="type">Service Type/Category:</label>
         <select name="type" value={serviceData.type} onChange={handleChange} required style={inputStyle}>
            {serviceTypes.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>

        <label htmlFor="price">Price ($):</label>
        <input type="number" name="price" value={serviceData.price} onChange={handleChange} required step="0.01" min="0" style={inputStyle} />

        <label htmlFor="pricingModel">Pricing Model:</label>
        <select name="pricingModel" value={serviceData.pricingModel} onChange={handleChange} style={inputStyle}>
            {pricingModels.map(model => <option key={model} value={model}>{model.charAt(0).toUpperCase() + model.slice(1)}</option>)}
        </select>

        <label htmlFor="location">Service Location/Area:</label>
        <input type="text" name="location" value={serviceData.location} onChange={handleChange} required style={inputStyle} />

        <label htmlFor="availability">Availability (e.g., Mon-Fri 9am-5pm):</label>
        <input type="text" name="availability" value={serviceData.availability} onChange={handleChange} style={inputStyle} />

        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ ...inputStyle, background: '#333', color: 'white', cursor: 'pointer' }}>
          {loading ? 'Creating...' : 'Create Service'}
        </button>
      </form>
    </div>
  );
};

export default CreateServicePage;

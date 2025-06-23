import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const EditServicePage = () => {
  const { id: serviceId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [serviceData, setServiceData] = useState({
    name: '',
    description: '',
    type: '',
    price: '',
    pricingModel: 'fixed',
    availability: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!serviceId) {
        setError('Service ID is missing.');
        setPageLoading(false);
        return;
      }
      setPageLoading(true);
      try {
        const fetchedService = await serviceService.getServiceById(serviceId);
        if (user && fetchedService.sellerId && fetchedService.sellerId._id !== user._id) {
            setError('You are not authorized to edit this service.');
            // navigate('/seller/dashboard');
            return;
        }
        setServiceData({
          name: fetchedService.name || '',
          description: fetchedService.description || '',
          type: fetchedService.type || 'Other',
          price: fetchedService.price !== undefined ? String(fetchedService.price) : '',
          pricingModel: fetchedService.pricingModel || 'fixed',
          availability: fetchedService.availability || '',
          location: fetchedService.location || '',
        });
      } catch (err) {
        setError(err.message || 'Failed to fetch service details.');
      } finally {
        setPageLoading(false);
      }
    };
    if (token && user) {
        fetchServiceDetails();
    } else if (!token || !user) {
        setError("Authentication required to edit services.");
        setPageLoading(false);
        // navigate('/login');
    }
  }, [serviceId, token, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setServiceData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!serviceData.name || !serviceData.type || !serviceData.price || !serviceData.location) {
      setError('Name, type, price, and location are required.');
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
        name: serviceData.name,
        description: serviceData.description,
        type: serviceData.type,
        price: parseFloat(serviceData.price),
        pricingModel: serviceData.pricingModel,
        availability: serviceData.availability,
        location: serviceData.location,
      };
      await serviceService.updateService(serviceId, dataToSubmit, token);
      navigate('/seller/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to update service.');
    } finally {
      setLoading(false);
    }
  };

  const serviceTypes = ['Beauty', 'Home Repair', 'Transport', 'Tutoring', 'Consulting', 'Wellness', 'Events', 'Other'];
  const pricingModels = ['hourly', 'fixed', 'per_session', 'package', 'custom'];

  if (pageLoading) return <p>Loading service for editing...</p>;
  if (error && !serviceData.name) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div>
      <h2>Edit Service</h2>
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

        <label htmlFor="availability">Availability:</label>
        <input type="text" name="availability" value={serviceData.availability} onChange={handleChange} style={inputStyle} />

        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ ...inputStyle, background: '#333', color: 'white', cursor: 'pointer' }}>
          {loading ? 'Updating...' : 'Update Service'}
        </button>
      </form>
    </div>
  );
};

export default EditServicePage;

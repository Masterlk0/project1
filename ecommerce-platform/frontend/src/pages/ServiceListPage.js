import React, { useState, useEffect } from 'react';
import serviceService from '../services/serviceService';
import ServiceCard from '../components/ServiceCard';
// import { useSearchParams } from 'react-router-dom';

const listContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '15px',
  justifyContent: 'center', // Or 'flex-start'
  padding: '20px 0'
};

const filterSectionStyle = {
  marginBottom: '20px',
  padding: '10px',
  border: '1px solid #eee',
  borderRadius: '5px'
};

const ServiceListPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // const [searchParams, setSearchParams] = useSearchParams();

  // Filter states
  const [typeFilter, setTypeFilter] = useState(''); // For service category/type
  // const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setError('');
      try {
        const apiParams = {};
        // const typeFromUrl = searchParams.get('type');
        // if (typeFromUrl) setTypeFilter(typeFromUrl);

        if (typeFilter) apiParams.type = typeFilter;
        // if (locationFilter) apiParams.location = locationFilter;

        const fetchedServices = await serviceService.getServices(apiParams);
        setServices(fetchedServices);
      } catch (err) {
        setError(err.message || 'Failed to load services.');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [typeFilter]); // Refetch when typeFilter changes

  const handleTypeChange = (e) => {
    setTypeFilter(e.target.value);
    // setSearchParams({ type: e.target.value });
  };

  if (loading) return <p>Loading services...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div>
      <h2>All Services</h2>

      <div style={filterSectionStyle}>
        <h4>Filters</h4>
        <label htmlFor="type">Service Type: </label>
        <select id="type" value={typeFilter} onChange={handleTypeChange}>
          <option value="">All</option>
          {/* These should ideally come from backend or a config */}
          <option value="Beauty">Beauty</option>
          <option value="Home Repair">Home Repair</option>
          <option value="Transport">Transport</option>
          <option value="Tutoring">Tutoring</option>
          <option value="Consulting">Consulting</option>
          {/* Add other service types */}
        </select>
        {/* Add more filters here: location, price range, etc. */}
      </div>

      {services.length === 0 ? (
        <p>No services found matching your criteria.</p>
      ) : (
        <div style={listContainerStyle}>
          {services.map(service => (
            <ServiceCard key={service._id} service={service} />
          ))}
        </div>
      )}
      {/* Pagination controls can be added here */}
    </div>
  );
};

export default ServiceListPage;

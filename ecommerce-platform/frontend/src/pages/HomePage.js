import React, { useState, useEffect } from 'react';
import productService from '../services/productService';
import serviceService from '../services/serviceService';
import ProductCard from '../components/ProductCard';
import ServiceCard from '../components/ServiceCard';
import { Link } from 'react-router-dom';

const sectionStyle = {
  margin: '20px 0',
};

const listStyle = {
  display: 'flex',
  flexWrap: 'wrap', // Allow items to wrap to next line
  gap: '10px',      // Space between items
  justifyContent: 'flex-start', // Align items to the start
  padding: '10px 0',
  overflowX: 'auto' // Add horizontal scroll if items exceed width, though flexWrap should handle it.
};


const HomePage = () => {
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [trendingServices, setTrendingServices] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [productError, setProductError] = useState('');
  const [serviceError, setServiceError] = useState('');

  useEffect(() => {
    const fetchTrendingData = async () => {
      try {
        setLoadingProducts(true);
        const products = await productService.getTrendingProducts(5); // Fetch top 5
        setTrendingProducts(products);
      } catch (err) {
        setProductError(err.message || 'Failed to load trending products.');
      } finally {
        setLoadingProducts(false);
      }

      try {
        setLoadingServices(true);
        const services = await serviceService.getTrendingServices(5); // Fetch top 5
        setTrendingServices(services);
      } catch (err) {
        setServiceError(err.message || 'Failed to load trending services.');
      } finally {
        setLoadingServices(false);
      }
    };

    fetchTrendingData();
  }, []);

  return (
    <div>
      <h1>Welcome to Our E-commerce Platform!</h1>
      <p>Discover amazing products and services curated for you.</p>

      <section style={sectionStyle}>
        <h2>Trending Products</h2>
        {loadingProducts && <p>Loading trending products...</p>}
        {productError && <p style={{ color: 'red' }}>{productError}</p>}
        {!loadingProducts && !productError && trendingProducts.length === 0 && <p>No trending products available right now.</p>}
        {!loadingProducts && !productError && trendingProducts.length > 0 && (
          <div style={listStyle}>
            {trendingProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
        <Link to="/products">View All Products</Link>
      </section>

      <section style={sectionStyle}>
        <h2>Featured Services</h2>
        {loadingServices && <p>Loading featured services...</p>}
        {serviceError && <p style={{ color: 'red' }}>{serviceError}</p>}
        {!loadingServices && !serviceError && trendingServices.length === 0 && <p>No featured services available right now.</p>}
        {!loadingServices && !serviceError && trendingServices.length > 0 && (
          <div style={listStyle}>
            {trendingServices.map(service => (
              <ServiceCard key={service._id} service={service} />
            ))}
          </div>
        )}
        <Link to="/services">View All Services</Link>
      </section>

      <section style={sectionStyle}>
        <h2>Shop by Category</h2>
        {/* This can be dynamic later */}
        <ul>
          <li><Link to="/products?category=Electronics">Electronics</Link></li>
          <li><Link to="/products?category=Fashion">Fashion</Link></li>
          <li><Link to="/products?category=Home">Home Goods</Link></li>
          <li><Link to="/services?type=Home Repair">Home Repair</Link></li>
          <li><Link to="/services?type=Consulting">Consulting</Link></li>
        </ul>
      </section>
    </div>
  );
};

export default HomePage;

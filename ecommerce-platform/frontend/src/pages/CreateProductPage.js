import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import productService from '../services/productService';
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

const CreateProductPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    category: 'Other', // Default category
    price: '',
    stock: '',
    images: '', // Simple comma-separated string for now
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!productData.name || !productData.category || !productData.price || !productData.stock) {
      setError('Name, category, price, and stock are required.');
      setLoading(false);
      return;
    }
    if (isNaN(parseFloat(productData.price)) || parseFloat(productData.price) < 0) {
        setError('Price must be a non-negative number.');
        setLoading(false);
        return;
    }
    if (isNaN(parseInt(productData.stock)) || parseInt(productData.stock) < 0) {
        setError('Stock must be a non-negative integer.');
        setLoading(false);
        return;
    }


    try {
      const dataToSubmit = {
        ...productData,
        price: parseFloat(productData.price),
        stock: parseInt(productData.stock),
        // Convert comma-separated image string to array
        images: productData.images.split(',').map(img => img.trim()).filter(img => img),
      };
      await productService.createProduct(dataToSubmit, token);
      navigate('/seller/dashboard'); // Redirect to dashboard after creation
    } catch (err) {
      setError(err.message || 'Failed to create product.');
    } finally {
      setLoading(false);
    }
  };

  // Product categories - should ideally match backend enum or be fetched
  const categories = ['Electronics', 'Fashion', 'Home', 'Sports', 'Books', 'Toys', 'Beauty', 'Groceries', 'Other'];


  return (
    <div>
      <h2>Create New Product</h2>
      <form onSubmit={handleSubmit} style={formStyle}>
        <label htmlFor="name">Product Name:</label>
        <input type="text" name="name" value={productData.name} onChange={handleChange} required style={inputStyle} />

        <label htmlFor="description">Description:</label>
        <textarea name="description" value={productData.description} onChange={handleChange} style={inputStyle} />

        <label htmlFor="category">Category:</label>
        <select name="category" value={productData.category} onChange={handleChange} required style={inputStyle}>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>

        <label htmlFor="price">Price ($):</label>
        <input type="number" name="price" value={productData.price} onChange={handleChange} required step="0.01" min="0" style={inputStyle} />

        <label htmlFor="stock">Stock Quantity:</label>
        <input type="number" name="stock" value={productData.stock} onChange={handleChange} required step="1" min="0" style={inputStyle} />

        <label htmlFor="location">Location (Optional):</label>
        <input type="text" name="location" value={productData.location} onChange={handleChange} style={inputStyle} />

        <label htmlFor="images">Image URLs (comma-separated, Optional):</label>
        <input type="text" name="images" value={productData.images} onChange={handleChange} placeholder="e.g., url1.jpg, url2.png" style={inputStyle} />
        <small>For multiple images, separate URLs with a comma. Actual image upload will be a future enhancement.</small>


        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ ...inputStyle, background: '#333', color: 'white', cursor: 'pointer' }}>
          {loading ? 'Creating...' : 'Create Product'}
        </button>
      </form>
    </div>
  );
};

export default CreateProductPage;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const EditProductPage = () => {
  const { id: productId } = useParams(); // Get product ID from URL
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [productData, setProductData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stock: '',
    images: '', // Comma-separated string
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true); // For initial data fetch
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!productId) {
        setError('Product ID is missing.');
        setPageLoading(false);
        return;
      }
      setPageLoading(true);
      try {
        const fetchedProduct = await productService.getProductById(productId);
        // Ensure the current user is the seller of this product
        if (user && fetchedProduct.sellerId && fetchedProduct.sellerId._id !== user._id) {
            setError('You are not authorized to edit this product.');
            // navigate('/seller/dashboard'); // or to an unauthorized page
            return;
        }
        setProductData({
          name: fetchedProduct.name || '',
          description: fetchedProduct.description || '',
          category: fetchedProduct.category || 'Other',
          price: fetchedProduct.price !== undefined ? String(fetchedProduct.price) : '',
          stock: fetchedProduct.stock !== undefined ? String(fetchedProduct.stock) : '',
          images: fetchedProduct.images ? fetchedProduct.images.join(', ') : '',
          location: fetchedProduct.location || '',
        });
      } catch (err) {
        setError(err.message || 'Failed to fetch product details.');
      } finally {
        setPageLoading(false);
      }
    };
    if (token && user) { // Ensure user and token are available before fetching
        fetchProductDetails();
    } else if (!token || !user) {
        setError("Authentication required to edit products.");
        setPageLoading(false);
        // navigate('/login');
    }
  }, [productId, token, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
        name: productData.name,
        description: productData.description,
        category: productData.category,
        price: parseFloat(productData.price),
        stock: parseInt(productData.stock),
        images: productData.images.split(',').map(img => img.trim()).filter(img => img),
        location: productData.location,
      };
      await productService.updateProduct(productId, dataToSubmit, token);
      navigate('/seller/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to update product.');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Electronics', 'Fashion', 'Home', 'Sports', 'Books', 'Toys', 'Beauty', 'Groceries', 'Other'];

  if (pageLoading) return <p>Loading product for editing...</p>;
  if (error && !productData.name) return <p style={{ color: 'red' }}>Error: {error}</p>; // Show error if initial load failed

  return (
    <div>
      <h2>Edit Product</h2>
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
         <small>For multiple images, separate URLs with a comma.</small>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ ...inputStyle, background: '#333', color: 'white', cursor: 'pointer' }}>
          {loading ? 'Updating...' : 'Update Product'}
        </button>
      </form>
    </div>
  );
};

export default EditProductPage;

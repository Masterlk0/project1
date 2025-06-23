import React, { useState, useEffect } from 'react';
import productService from '../services/productService';
import ProductCard from '../components/ProductCard';
// import { useSearchParams } from 'react-router-dom'; // For reading query params

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

const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // const [searchParams, setSearchParams] = useSearchParams();

  // Filter states - can be expanded
  const [categoryFilter, setCategoryFilter] = useState('');
  // const [priceRangeFilter, setPriceRangeFilter] = useState({ min: '', max: '' });
  // const [sortBy, setSortBy] = useState('-createdAt'); // Default sort

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        // Construct params for API call based on filters
        const apiParams = {};
        // const categoryFromUrl = searchParams.get('category');
        // if (categoryFromUrl) setCategoryFilter(categoryFromUrl); // Sync from URL

        if (categoryFilter) apiParams.category = categoryFilter;
        // if (priceRangeFilter.min) apiParams['price[gte]'] = priceRangeFilter.min;
        // if (priceRangeFilter.max) apiParams['price[lte]'] = priceRangeFilter.max;
        // if (sortBy) apiParams.sort = sortBy;

        const fetchedProducts = await productService.getProducts(apiParams);
        setProducts(fetchedProducts);
      } catch (err) {
        setError(err.message || 'Failed to load products.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryFilter]); // Refetch when categoryFilter changes (or other filters)

  // Handle filter changes
  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
    // setSearchParams({ category: e.target.value }); // Update URL
  };

  if (loading) return <p>Loading products...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div>
      <h2>All Products</h2>

      <div style={filterSectionStyle}>
        <h4>Filters</h4>
        <label htmlFor="category">Category: </label>
        <select id="category" value={categoryFilter} onChange={handleCategoryChange}>
          <option value="">All</option>
          {/* These should ideally come from backend or a config */}
          <option value="Electronics">Electronics</option>
          <option value="Fashion">Fashion</option>
          <option value="Home">Home</option>
          <option value="Sports">Sports</option>
          <option value="Books">Books</option>
          {/* Add other product categories */}
        </select>
        {/* Add more filters here: price range, sort by, etc. */}
      </div>

      {products.length === 0 ? (
        <p>No products found matching your criteria.</p>
      ) : (
        <div style={listContainerStyle}>
          {products.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
      {/* Pagination controls can be added here */}
    </div>
  );
};

export default ProductListPage;

const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars based on NODE_ENV
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: './.env.test' });
} else {
  dotenv.config({ path: './.env' }); // Default to .env
}

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const chatRoutes = require('./routes/chatRoutes');
const boostingRoutes = require('./routes/boostingRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/seller', sellerRoutes); // Mount seller dashboard routes
app.use('/api/chats', chatRoutes);    // Mount chat routes
app.use('/api/boosting', boostingRoutes); // Mount boosting and lead routes
app.use('/api/orders', orderRoutes);      // Mount order routes

// Placeholder for a root route or API status
app.get('/', (req, res) => {
  res.send('E-commerce API is running...');
});

const PORT = process.env.PORT || 5000;

let serverInstance; // To hold the server instance

if (process.env.NODE_ENV !== 'test') {
  serverInstance = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
} else {
  // For testing, we might not want the app to listen immediately,
  // Supertest handles this. However, some tests might need a reference.
  // If Supertest needs the raw app, this is fine.
  // If tests need to close the server, we export serverInstance.
}


// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  if (serverInstance) {
    // serverInstance.close(() => process.exit(1)); // Optional: exit process on critical errors
  } else {
    // process.exit(1);
  }
});

module.exports = app; // Export the app for supertest
// If you need to close the server in tests, you might export serverInstance too,
// but Supertest usually works with the app instance.
// module.exports = { app, serverInstance };

const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');

// Load environment configuration
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend web application requests
app.use(cors({
  origin: '*', // In production, replace with specific frontend domains
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Global JSON middleware
app.use(express.json());

// Bootstrapping the database connection
async function startServer() {
  try {
    await initDB();
    
    // Wire up REST API routing modules
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/products', require('./routes/products'));
    app.use('/api/suppliers', require('./routes/suppliers'));
    app.use('/api/transactions', require('./routes/transactions'));

    // Base API index check
    app.get('/', (req, res) => {
      res.json({
        name: 'Small Business Inventory Manager API',
        version: '1.0.0',
        status: 'online',
        database: require('./db').isMySQL() ? 'MySQL' : 'Local JSON File DB'
      });
    });

    // Handle undefined routes
    app.use((req, res) => {
      res.status(404).json({ error: 'Endpoint route not found' });
    });

    // Start Express API Server
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Inventory API Server running on port ${PORT}`);
      console.log(`📦 Base URL: http://localhost:${PORT}`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Fatal: Server failed to start:', error);
    process.exit(1);
  }
}

startServer();

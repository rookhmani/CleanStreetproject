const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();
const { corsOptions, validateRequiredEnv } = require('./utils/config');
validateRequiredEnv();

// Initialize app
const app = express();

// Body parser middleware
app.use(express.json({ strict: false }));
app.use(express.urlencoded({ extended: true }));

// Better error handling for malformed JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('❌ Bad JSON received:', err.body);
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format. Please check your request body.',
      error: 'Malformed JSON'
    });
  }
  next();
});

// CORS middleware
app.use(cors(corsOptions));

// Serve static files from uploads directory with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static('uploads'));

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cleanstreet';

mongoose.connect(MONGODB_URI)
.then(() => console.log('✅ MongoDB Connected Successfully (Admin Server)'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Import routes
const adminAuthRoutes = require('./routes/adminAuth');
const adminVolunteersRoutes = require('./routes/adminVolunteers');
const adminComplaintsRoutes = require('./routes/adminComplaints');
const adminUsersRoutes = require('./routes/adminUsers');
const volunteerComplaintsRoutes = require('./routes/volunteerComplaints');

// Mount routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/volunteers', adminVolunteersRoutes);
app.use('/api/admin/complaints', adminComplaintsRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/volunteer/complaints', volunteerComplaintsRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin server is running',
    port: PORT
  });
});

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'CleanStreet Admin API Server',
    version: '1.0.0',
    endpoints: {
      admin: {
        auth: '/api/admin/auth',
        volunteers: '/api/admin/volunteers',
        complaints: '/api/admin/complaints',
        users: '/api/admin/users'
      },
      volunteer: {
        complaints: '/api/volunteer/complaints'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.ADMIN_PORT || 5001;

app.listen(PORT, () => {
  console.log('🚀 Admin Server running on port', PORT);
  console.log('📍 Admin API listening on port ' + PORT);
  console.log('='.repeat(50));
});

module.exports = app;

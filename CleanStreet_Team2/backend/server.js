const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');


const seedAdmin = require("./utils/seedAdmin");
const connectDatabase = require("./utils/database");

// Load environment variables
dotenv.config();
const { corsOptions, validateRequiredEnv } = require('./utils/config');
validateRequiredEnv();

const app = express();
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'complaints');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Middleware
app.use(cors(corsOptions));
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

// Serve static files from uploads directory with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
connectDatabase()
  .then(async () => {
    console.log("✅ MongoDB Connected Successfully");

    // Register Models
    require("./models/User");
    require("./models/Admin");
    require("./models/Volunteer");
    require("./models/Complaint");
    require("./models/Comment");
    require("./models/Vote");

    // Create default admin if not exists
    await seedAdmin();
  })
  .catch((err) =>
    console.error("❌ MongoDB Connection Error:", err)
  );

// Import Routes
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const userRoutes = require('./routes/users');
const voteRoutes = require('./routes/votes');
const commentRoutes = require('./routes/comments');
const adminAuthRoutes = require('./routes/adminAuth');
const adminVolunteersRoutes = require('./routes/adminVolunteers');
const adminComplaintsRoutes = require('./routes/adminComplaints');
const adminUsersRoutes = require('./routes/adminUsers');
const volunteerComplaintsRoutes = require('./routes/volunteerComplaints');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/users', userRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/volunteers', adminVolunteersRoutes);
app.use('/api/admin/complaints', adminComplaintsRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/volunteer/complaints', volunteerComplaintsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API listening on port ${PORT}`);
});

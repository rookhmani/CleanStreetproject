const express = require('express');
const router = express.Router();
const path = require('path');
const { protect, authorize } = require('../middleware/auth');
const { upload, updateS3Metadata, deleteFromS3 } = require('../utils/s3Upload');
const Complaint = require('../models/Complaint');
const AdminLog = require('../models/AdminLog');

// @route   GET /api/complaints/uploads/:filename
// @desc    Serve uploaded images (for local storage)
// @access  Public
router.get('/uploads/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../uploads/complaints', req.params.filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(404).json({ success: false, message: 'File not found' });
    }
  });
});

// @route   GET /api/complaints
// @desc    Get all complaints
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, priority } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const complaints = await Complaint.find(query)
      .populate('user_id', 'name email')
      .populate('assigned_to', 'name')
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/complaints/user
// @desc    Get logged in user's complaints
// @access  Private
router.get('/user', protect, async (req, res) => {
  try {
    const complaints = await Complaint.find({ user_id: req.user.id })
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    console.error('Get user complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/complaints/:id
// @desc    Get single complaint by ID
// @access  Private
router.get('/:id([0-9a-fA-F]{24})', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('user_id', 'name email');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    res.status(200).json({
      success: true,
      complaint
    });
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/complaints
// @desc    Create a new complaint
// @access  Private
router.post('/', protect, upload.array('photos', 5), async (req, res) => {
  try {
    console.log('📝 Received complaint submission');
    console.log('👤 User ID:', req.user.id);
    console.log('📋 Request body:', req.body);
    console.log('📸 Files:', req.files?.length || 0);

    const { title, description, address, priority, location_coords } = req.body;

    // Validation
    if (!title || !description || !address) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and address'
      });
    }

    // Parse location coordinates
    let parsedCoords = { type: 'Point', coordinates: [0, 0] };
    if (location_coords) {
      try {
        parsedCoords = JSON.parse(location_coords);
        console.log('📍 Parsed coordinates:', parsedCoords);
      } catch (e) {
        console.log('⚠️ Failed to parse coordinates:', e.message);
      }
    }

    const complaintData = {
      user_id: req.user.id,
      title: title.trim(),
      description: description.trim(),
      address: address.trim(),
      priority: priority || 'medium',
      location_coords: parsedCoords,
      upvotes: 0,
      downvotes: 0,
      photo: []
    };

    // Add photo URLs if files were uploaded
    if (req.files && req.files.length > 0) {
      console.log('📸 Processing', req.files.length, 'uploaded files');
      // Check if using S3 or local storage
      if (req.files[0].location) {
        // S3 upload
        complaintData.photo = req.files.map(file => file.location);
        console.log('☁️ S3 URLs:', complaintData.photo);
      } else {
        // Local storage
        complaintData.photo = req.files.map(file => `/api/complaints/uploads/${file.filename}`);
        console.log('💾 Local paths:', complaintData.photo);
      }
    }

    console.log('💾 Creating complaint in database...');
    const complaint = await Complaint.create(complaintData);
    console.log('✅ Complaint created successfully:', complaint._id);

    // Update S3 metadata with complaint ID (only if using S3)
    if (req.files && req.files.length > 0 && req.files[0].location) {
      console.log('🔄 Updating S3 metadata...');
      for (const file of req.files) {
        try {
          await updateS3Metadata(file.location, {
            complaintId: complaint._id.toString(),
            userId: req.user.id,
            title: title,
            uploadTime: new Date().toISOString()
          });
        } catch (metaError) {
          console.log('⚠️ Failed to update S3 metadata:', metaError.message);
        }
      }
    }

    res.status(201).json({
      success: true,
      complaint,
      message: 'Complaint created successfully'
    });
  } catch (error) {
    console.error('❌ Create complaint error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   PUT /api/complaints/:id
// @desc    Update complaint
// @access  Private (Admin/Volunteer)
router.put('/:id', protect, authorize('admin', 'volunteer'), async (req, res) => {
  try {
    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    // Log admin action
    await AdminLog.create({
      user_id: req.user.id,
      action: 'Updated complaint',
      details: { complaint_id: complaint._id, changes: req.body }
    });

    res.status(200).json({
      success: true,
      complaint
    });
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/complaints/:id
// @desc    Delete complaint
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    await complaint.deleteOne();

    // Log admin action
    await AdminLog.create({
      user_id: req.user.id,
      action: 'Deleted complaint',
      details: { complaint_id: req.params.id }
    });

    res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully'
    });
  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/complaints/stats
// @desc    Get complaint statistics for current user
// @access  Private
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Complaint.aggregate([
      { $match: { user_id: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalIssues = await Complaint.countDocuments({ user_id: userId });
    
    // Pending includes: received, assigned statuses
    const pending = (stats.find(s => s._id === 'received')?.count || 0) + 
                    (stats.find(s => s._id === 'assigned')?.count || 0);
    
    // In Progress includes: in_review status
    const inProgress = stats.find(s => s._id === 'in_review')?.count || 0;
    
    // Resolved
    const resolved = stats.find(s => s._id === 'resolved')?.count || 0;

    res.status(200).json({
      success: true,
      stats: {
        totalIssues,
        pending,
        inProgress,
        resolved
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/complaints/stats/all
// @desc    Get all complaints statistics (from all users)
// @access  Private
router.get('/stats/all', protect, async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalIssues = await Complaint.countDocuments();
    
    // Pending includes: received, assigned statuses
    const pending = (stats.find(s => s._id === 'received')?.count || 0) + 
                    (stats.find(s => s._id === 'assigned')?.count || 0);
    
    // In Progress includes: in_review status
    const inProgress = stats.find(s => s._id === 'in_review')?.count || 0;
    
    // Resolved
    const resolved = stats.find(s => s._id === 'resolved')?.count || 0;

    res.status(200).json({
      success: true,
      stats: {
        totalIssues,
        pending,
        inProgress,
        resolved
      }
    });
  } catch (error) {
    console.error('Get all stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/complaints/uploads/:filename
// @desc    Serve uploaded images
// @access  Public
router.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, '..', 'uploads', 'complaints', filename);
  res.sendFile(filepath, (err) => {
    if (err) {
      console.error('Error serving file:', err);
      res.status(404).json({ success: false, message: 'File not found' });
    }
  });
});

module.exports = router;

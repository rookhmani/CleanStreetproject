const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Volunteer = require('../models/Volunteer');
const { protectAdmin } = require('../middleware/adminAuth');
const { protectVolunteer, getSignedJwtToken } = require('../middleware/adminAuth');
const { sendVolunteerApprovalEmail, sendVolunteerPasswordResetEmail, generateResetToken } = require('../utils/adminEmailService');
const { getAdminClientUrl } = require('../utils/config');

// @route   POST /api/admin/volunteers/register
// @desc    Register new volunteer
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Check if volunteer already exists
    const existingVolunteer = await Volunteer.findOne({ email });

    if (existingVolunteer) {
      return res.status(400).json({
        success: false,
        message: 'Volunteer with this email already exists'
      });
    }

    // Create volunteer as approved to avoid login blockers after registration
    const volunteer = await Volunteer.create({
      name,
      email,
      password,
      phone,
      address,
      status: 'approved',
      approved_at: Date.now()
    });

    res.status(201).json({
      success: true,
      message: 'Volunteer registration successful.',
      volunteer: {
        id: volunteer._id,
        name: volunteer.name,
        email: volunteer.email,
        status: volunteer.status
      }
    });
  } catch (error) {
    console.error('Volunteer registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/admin/volunteers
// @desc    Create and approve a volunteer from the admin dashboard
// @access  Private/Admin
router.post('/', protectAdmin, async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    const existingVolunteer = await Volunteer.findOne({ email });

    if (existingVolunteer) {
      return res.status(400).json({
        success: false,
        message: 'Volunteer with this email already exists'
      });
    }

    const volunteer = await Volunteer.create({
      name,
      email,
      password,
      phone,
      address,
      status: 'approved',
      approved_by: req.admin._id,
      approved_at: Date.now()
    });

    res.status(201).json({
      success: true,
      message: 'Volunteer created and approved successfully',
      volunteer: {
        id: volunteer._id,
        name: volunteer.name,
        email: volunteer.email,
        status: volunteer.status
      }
    });
  } catch (error) {
    console.error('Create volunteer error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/admin/volunteers/login
// @desc    Login volunteer
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for volunteer
    const volunteer = await Volunteer.findOne({ email }).select('+password');

    if (!volunteer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Backward compatibility: auto-approve older pending accounts at login time
    if (volunteer.status === 'pending') {
      volunteer.status = 'approved';
      volunteer.approved_at = Date.now();
      await volunteer.save({ validateBeforeSave: false });
    }

    if (volunteer.status === 'blocked') {
      return res.status(401).json({
        success: false,
        message: 'Your account has been blocked'
      });
    }

    // Check if password matches
    const isMatch = await volunteer.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create token
    const token = getSignedJwtToken(volunteer._id);

    res.status(200).json({
      success: true,
      token,
      volunteer: {
        id: volunteer._id,
        name: volunteer.name,
        email: volunteer.email,
        status: volunteer.status
      }
    });
  } catch (error) {
    console.error('Volunteer login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/volunteers
// @desc    Get all volunteers
// @access  Private/Admin
router.get('/', protectAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }

    const volunteers = await Volunteer.find(query)
      .select('-password')
      .populate('approved_by', 'name email')
      .populate('assigned_complaints', 'title status priority')
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      count: volunteers.length,
      volunteers
    });
  } catch (error) {
    console.error('Get volunteers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/volunteers/me
// @desc    Get current logged in volunteer
// @access  Private/Volunteer
router.get('/me', protectVolunteer, async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.volunteer._id)
      .select('-password')
      .populate('assigned_complaints');

    res.status(200).json({
      success: true,
      volunteer
    });
  } catch (error) {
    console.error('Get volunteer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/volunteers/:id/approve
// @desc    Approve volunteer
// @access  Private/Admin
router.put('/:id/approve', protectAdmin, async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found'
      });
    }

    if (volunteer.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Volunteer already approved'
      });
    }

    volunteer.status = 'approved';
    volunteer.approved_by = req.admin._id;
    volunteer.approved_at = Date.now();
    await volunteer.save();

    // Send approval email
    await sendVolunteerApprovalEmail(volunteer);

    res.status(200).json({
      success: true,
      message: 'Volunteer approved successfully',
      volunteer: {
        id: volunteer._id,
        name: volunteer.name,
        email: volunteer.email,
        status: volunteer.status
      }
    });
  } catch (error) {
    console.error('Approve volunteer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/volunteers/:id/block
// @desc    Block/Unblock volunteer
// @access  Private/Admin
router.put('/:id/block', protectAdmin, async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found'
      });
    }

    volunteer.status = volunteer.status === 'blocked' ? 'approved' : 'blocked';
    await volunteer.save();

    res.status(200).json({
      success: true,
      message: `Volunteer ${volunteer.status === 'blocked' ? 'blocked' : 'unblocked'} successfully`,
      volunteer: {
        id: volunteer._id,
        name: volunteer.name,
        email: volunteer.email,
        status: volunteer.status
      }
    });
  } catch (error) {
    console.error('Block volunteer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/admin/volunteers/:id
// @desc    Delete volunteer
// @access  Private/Admin
router.delete('/:id', protectAdmin, async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found'
      });
    }

    await volunteer.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Volunteer deleted successfully'
    });
  } catch (error) {
    console.error('Delete volunteer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/volunteers/forgot-password
// @desc    Forgot password - send reset email
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    const volunteer = await Volunteer.findOne({ email });

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'No volunteer found with that email'
      });
    }

    // Generate reset token
    const { resetToken, hashedToken, expireTime } = generateResetToken();

    // Save to database
    volunteer.resetPasswordToken = hashedToken;
    volunteer.resetPasswordExpire = expireTime;
    await volunteer.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${getAdminClientUrl()}/volunteer/reset-password/${resetToken}`;

    // Send email
    const emailSent = await sendVolunteerPasswordResetEmail(volunteer, resetUrl);

    if (!emailSent) {
      volunteer.resetPasswordToken = undefined;
      volunteer.resetPasswordExpire = undefined;
      await volunteer.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/volunteers/reset-password/:resettoken
// @desc    Reset password
// @access  Public
router.put('/reset-password/:resettoken', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide new password'
      });
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const volunteer = await Volunteer.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!volunteer) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Set new password
    volunteer.password = password;
    volunteer.resetPasswordToken = undefined;
    volunteer.resetPasswordExpire = undefined;
    await volunteer.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, protect } = require('../middleware/auth');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/emailService');
const jwt = require("jsonwebtoken");

const bcrypt = require("bcryptjs");
const Volunteer = require("../models/Volunteer");

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, email, password, state, city } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ success: false, message: 'Username is already taken' });
      }
    }

    user = await User.create({
      username: username || email,
      email,
      password,
      state: state || '',
      city: city || ''
    });

const token = generateToken(user._id);

const { password: _, ...safeUser } = user._doc;

res.status(201).json({
  success: true,
  token,
  user: safeUser
});

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // Check if user is blocked
    if (user.isBlocked) {
      console.log('User is blocked:', email);
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact administrator.'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = generateToken(user._id);

    const { password: _, ...safeUser } = user._doc;

res.status(200).json({
  success: true,
  token,
  user: safeUser
});

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    res.status(200).json({
      success: true,
      user
    });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 3600000;
    await user.save();

    await sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({ success: true, message: 'Password reset email sent' });
  } catch {
    res.status(500).json({ success: false, message: 'Error processing request' });
  }
});

// @route   POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful' });

  } catch {
    res.status(500).json({ success: false, message: 'Error resetting password' });
  }
});

/* ✅✅✅ GOOGLE LOGIN / SIGNUP ROUTE ADDED HERE ✅✅✅ */
router.post("/google-login", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        username: email,
        email,
        password: null,
        state: "",
        city: ""
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    const { password: _, ...safeUser } = user._doc;

return res.json({
  success: true,
  message: "Google login success",
  token,
  user: safeUser
});
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ✅ EXPORT ✅ */

// ================= VOLUNTEER REGISTER =================
router.post("/volunteer/register", async (req, res) => {
  try {

    const { email, password, phoneNumber, address } = req.body;

    // generate name automatically if frontend doesn't send it
    const name = email.split("@")[0];

    const existingVolunteer = await Volunteer.findOne({ email });

    if (existingVolunteer) {
      return res.status(400).json({
        success: false,
        message: "Volunteer already exists"
      });
    }

    const volunteer = await Volunteer.create({
      name,
      email,
      password,
      phone: phoneNumber,
      address
    });

    const token = jwt.sign(
      { id: volunteer._id, role: "volunteer" },
      process.env.JWT_SECRET
    );

    res.status(201).json({
      success: true,
      token,
      volunteer
    });

  } catch (error) {

    console.error("Volunteer register error:", error);

    res.status(500).json({
      success: false,
      message: "Volunteer registration failed"
    });
  }
});

// ================= VOLUNTEER LOGIN =================
router.post("/volunteer/login", async (req, res) => {
  try {

    const { email, password } = req.body;

    const volunteer = await Volunteer.findOne({ email }).select("+password");

    if (!volunteer) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const isMatch = await volunteer.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // if (volunteer.status !== "approved") {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Account pending admin approval"
    //   });
    // }

    const token = jwt.sign(
      { id: volunteer._id, role: "volunteer" },
      process.env.JWT_SECRET
    );

    res.json({
      success: true,
      token,
      volunteer
    });

  } catch (error) {

    console.error("Volunteer login error:", error);

    res.status(500).json({
      success: false,
      message: "Volunteer login failed"
    });

  }
});
module.exports = router;

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const VolunteerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },

  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },

  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },

  phone: {
    type: String,
    trim: true
  },

  address: {
    type: String,
    trim: true
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'blocked'],
    default: 'approved'
  },

  isActive: {
    type: Boolean,
    default: true
  },

  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },

  approved_at: {
    type: Date,
    default: null
  },

  assigned_complaints: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint'
    }
  ],

  created_at: {
    type: Date,
    default: Date.now
  },

  resetPasswordToken: String,
  resetPasswordExpire: Date
});


// Hash password before saving
VolunteerSchema.pre('save', async function (next) {
  try {

    if (!this.isModified('password')) {
      return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    next();

  } catch (error) {
    next(error);
  }
});


// Compare password
VolunteerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


module.exports = mongoose.model('Volunteer', VolunteerSchema);
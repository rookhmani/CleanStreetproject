const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const Volunteer = require('../models/Volunteer');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { protectAdmin } = require('../middleware/adminAuth');
const { sendVolunteerAssignmentEmail } = require('../utils/adminEmailService');

// @route   GET /api/admin/complaints
// @desc    Get all complaints with filters
// @access  Private/Admin
router.get('/', protectAdmin, async (req, res) => {
  try {
    const { status, priority, assigned } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assigned === 'true') query.assigned_to = { $ne: null };
    if (assigned === 'false') query.assigned_to = null;

    const complaints = await Complaint.find(query)
      .populate('user_id', 'name email')
      .populate('assigned_to', 'name email status')
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

// @route   GET /api/admin/complaints/:id
// @desc    Get single complaint by ID
// @access  Private/Admin
router.get('/:id([0-9a-fA-F]{24})', protectAdmin, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('user_id', 'name email phone')
      .populate('assigned_to', 'name email phone status');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Get comments for this complaint
    const comments = await Comment.find({ complaint_id: req.params.id })
      .populate('user_id', 'name email')
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      complaint,
      comments
    });
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/complaints/:id/status
// @desc    Update complaint status
// @access  Private/Admin
router.put('/:id/status', protectAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status'
      });
    }

    const validStatuses = ['received', 'in_review', 'assigned', 'resolved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    complaint.status = status;
    complaint.updated_at = Date.now();
    await complaint.save();

    res.status(200).json({
      success: true,
      message: 'Complaint status updated successfully',
      complaint
    });
  } catch (error) {
    console.error('Update complaint status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/complaints/:id/assign
// @desc    Assign complaint to volunteer
// @access  Private/Admin
router.put('/:id/assign', protectAdmin, async (req, res) => {
  try {
    const { volunteerId } = req.body;

    if (!volunteerId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide volunteer ID'
      });
    }

    const complaint = await Complaint.findById(req.params.id)
      .populate('user_id', 'name email');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    const volunteer = await Volunteer.findById(volunteerId);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found'
      });
    }

    if (volunteer.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Volunteer is not approved'
      });
    }

    // Update complaint
    complaint.assigned_to = volunteerId;
    complaint.status = 'assigned';
    complaint.updated_at = Date.now();
    await complaint.save();

    // Update volunteer's assigned complaints
    if (!volunteer.assigned_complaints.includes(complaint._id)) {
      volunteer.assigned_complaints.push(complaint._id);
      await volunteer.save();
    }

    // Send email notification to volunteer
    await sendVolunteerAssignmentEmail(volunteer, complaint);

    res.status(200).json({
      success: true,
      message: 'Complaint assigned to volunteer successfully',
      complaint: await Complaint.findById(req.params.id)
        .populate('user_id', 'name email')
        .populate('assigned_to', 'name email')
    });
  } catch (error) {
    console.error('Assign complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/complaints/:id/unassign
// @desc    Unassign complaint from volunteer
// @access  Private/Admin
router.put('/:id/unassign', protectAdmin, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    if (!complaint.assigned_to) {
      return res.status(400).json({
        success: false,
        message: 'Complaint is not assigned to any volunteer'
      });
    }

    // Remove from volunteer's assigned complaints
    const volunteer = await Volunteer.findById(complaint.assigned_to);
    if (volunteer) {
      volunteer.assigned_complaints = volunteer.assigned_complaints.filter(
        id => id.toString() !== complaint._id.toString()
      );
      await volunteer.save();
    }

    // Update complaint
    complaint.assigned_to = null;
    complaint.status = 'in_review';
    complaint.updated_at = Date.now();
    await complaint.save();

    res.status(200).json({
      success: true,
      message: 'Complaint unassigned successfully',
      complaint
    });
  } catch (error) {
    console.error('Unassign complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/admin/complaints/:id
// @desc    Delete complaint
// @access  Private/Admin
router.delete('/:id', protectAdmin, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Delete all comments associated with this complaint
    await Comment.deleteMany({ complaint_id: req.params.id });

    // Remove from volunteer's assigned complaints if assigned
    if (complaint.assigned_to) {
      const volunteer = await Volunteer.findById(complaint.assigned_to);
      if (volunteer) {
        volunteer.assigned_complaints = volunteer.assigned_complaints.filter(
          id => id.toString() !== complaint._id.toString()
        );
        await volunteer.save();
      }
    }

    await complaint.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Complaint and associated comments deleted successfully'
    });
  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/admin/complaints/:complaintId/comments/:commentId
// @desc    Delete comment
// @access  Private/Admin
router.delete('/:complaintId/comments/:commentId', protectAdmin, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/complaints/stats/dashboard
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/stats/dashboard', protectAdmin, async (req, res) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const pendingComplaints = await Complaint.countDocuments({ status: 'received' });
    const inReviewComplaints = await Complaint.countDocuments({ status: 'in_review' });
    const assignedComplaints = await Complaint.countDocuments({ status: 'assigned' });
    const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });
    const rejectedComplaints = await Complaint.countDocuments({ status: 'rejected' });
    
    const totalUsers = await User.countDocuments();
    const totalVolunteers = await Volunteer.countDocuments();
    const pendingVolunteers = await Volunteer.countDocuments({ status: 'pending' });
    const approvedVolunteers = await Volunteer.countDocuments({ status: 'approved' });
    const blockedVolunteers = await Volunteer.countDocuments({ status: 'blocked' });

    // Priority breakdown
    const urgentComplaints = await Complaint.countDocuments({ priority: 'urgent' });
    const highComplaints = await Complaint.countDocuments({ priority: 'high' });
    const mediumComplaints = await Complaint.countDocuments({ priority: 'medium' });
    const lowComplaints = await Complaint.countDocuments({ priority: 'low' });

    res.status(200).json({
      success: true,
      stats: {
        complaints: {
          total: totalComplaints,
          pending: pendingComplaints,
          inReview: inReviewComplaints,
          assigned: assignedComplaints,
          resolved: resolvedComplaints,
          rejected: rejectedComplaints
        },
        priority: {
          urgent: urgentComplaints,
          high: highComplaints,
          medium: mediumComplaints,
          low: lowComplaints
        },
        users: {
          total: totalUsers
        },
        volunteers: {
          total: totalVolunteers,
          pending: pendingVolunteers,
          approved: approvedVolunteers,
          blocked: blockedVolunteers
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

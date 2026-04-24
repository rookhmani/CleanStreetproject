import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminComplaintsAPI, adminVolunteersAPI } from '../../services/adminApi';
import { generateCSVReport, generateExcelReport, generatePDFReport } from '../../utils/reportGenerator';
import AdminNavbar from './AdminNavbar';
import './AdminComplaints.css';

const AdminComplaints = ({ user, setIsAuthenticated, setUser }) => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showReportOptions && !event.target.closest('.report-dropdown')) {
        setShowReportOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showReportOptions]);

  const fetchComplaints = useCallback(async () => {
    try {
      const data = await adminComplaintsAPI.getAll();
      setComplaints(data.complaints || []);
      setLoading(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch complaints');
      if (error.response?.status === 401) {
        navigate('/admin/login');
      }
      setLoading(false);
    }
  }, [navigate]);

  const fetchVolunteers = useCallback(async () => {
    try {
      const data = await adminVolunteersAPI.getAll();
      setVolunteers((data.volunteers || []).filter(v => v.status === 'approved'));
    } catch (error) {
      console.error('Failed to fetch volunteers:', error);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
    fetchVolunteers();
  }, [fetchComplaints, fetchVolunteers]);

  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      await adminComplaintsAPI.updateStatus(complaintId, newStatus);
      toast.success('Status updated successfully');
      fetchComplaints();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAssignVolunteer = async () => {
    if (!selectedVolunteer) {
      toast.error('Please select a volunteer');
      return;
    }

    try {
      await adminComplaintsAPI.assignToVolunteer(selectedComplaint._id, selectedVolunteer);
      toast.success('Complaint assigned successfully! Volunteer will receive an email.');
      setShowAssignModal(false);
      setSelectedComplaint(null);
      setSelectedVolunteer('');
      fetchComplaints();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign complaint');
    }
  };

  const handleUnassign = async (complaintId) => {
    try {
      await adminComplaintsAPI.unassign(complaintId);
      toast.success('Complaint unassigned successfully');
      fetchComplaints();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to unassign complaint');
    }
  };

  const handleDeleteComplaint = async () => {
    try {
      await adminComplaintsAPI.deleteComplaint(selectedComplaint._id);
      toast.success('Complaint deleted successfully');
      setShowDeleteModal(false);
      setSelectedComplaint(null);
      fetchComplaints();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete complaint');
    }
  };

  const handleDeleteComment = async (complaintId, commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await adminComplaintsAPI.deleteComment(complaintId, commentId);
        toast.success('Comment deleted successfully');
        fetchComplaints();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete comment');
      }
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesStatus = !filters.status || complaint.status === filters.status;
    const matchesPriority = !filters.priority || complaint.priority === filters.priority;
    const matchesSearch = !filters.search || 
      complaint.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      complaint.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
      complaint.location?.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const handleGenerateReport = async (format) => {
    try {
      console.log('Generating report:', format, 'Complaints count:', filteredComplaints.length);
      
      if (format === 'csv') {
        generateCSVReport(filteredComplaints);
        toast.success('CSV report generated successfully!');
      } else if (format === 'excel') {
        generateExcelReport(filteredComplaints);
        toast.success('Excel report generated successfully!');
      } else if (format === 'pdf') {
        generatePDFReport(filteredComplaints);
        toast.success('PDF report generated successfully!');
      }
      setShowReportOptions(false);
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error('Failed to generate report: ' + (error.message || 'Unknown error'));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      received: '#3b82f6',
      in_review: '#f59e0b',
      assigned: '#8b5cf6',
      resolved: '#10b981',
      rejected: '#ef4444'
    };
    return colors[status] || '#64748b';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444'
    };
    return colors[priority] || '#64748b';
  };

  if (loading) {
    return (
      <div className="admin-complaints">
        <div className="loading">Loading complaints...</div>
      </div>
    );
  }

  return (
    <div className="admin-complaints">
      <AdminNavbar user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
      <div className="complaints-header">
        <div>
          <h1>Complaint Management</h1>
          <p>Manage all reported issues</p>
        </div>
        <div className="header-actions">
          <div className="report-dropdown">
            <button 
              className="btn-report"
              onClick={() => setShowReportOptions(!showReportOptions)}
            >
              📊 Generate Report {showReportOptions ? '▲' : '▼'}
            </button>
            {showReportOptions && (
              <div className="report-options">
                <button onClick={() => handleGenerateReport('csv')} className="report-option">
                  📄 CSV Format
                </button>
                <button onClick={() => handleGenerateReport('excel')} className="report-option">
                  📊 Excel Format
                </button>
                <button onClick={() => handleGenerateReport('pdf')} className="report-option">
                  📑 PDF Format
                </button>
              </div>
            )}
          </div>
          <button onClick={() => navigate('/admin/dashboard')} className="btn-secondary">
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-card">
        <div className="filter-group">
          <label>Search</label>
          <input
            type="text"
            placeholder="Search by title, description, location..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="received">Received</option>
            <option value="in_review">In Review</option>
            <option value="assigned">Assigned</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Priority</label>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({...filters, priority: e.target.value})}
            className="filter-select"
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <button 
          onClick={() => setFilters({status: '', priority: '', search: ''})}
          className="btn-clear"
        >
          Clear Filters
        </button>
      </div>

      {/* Stats */}
      <div className="complaints-stats">
        <div className="stat-item">
          <span className="stat-label">Total</span>
          <span className="stat-value">{filteredComplaints.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Assigned</span>
          <span className="stat-value">{filteredComplaints.filter(c => c.status === 'assigned').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Resolved</span>
          <span className="stat-value">{filteredComplaints.filter(c => c.status === 'resolved').length}</span>
        </div>
      </div>

      {/* Complaints List */}
      <div className="complaints-list">
        {filteredComplaints.length === 0 ? (
          <div className="no-complaints">
            <p>No complaints found</p>
          </div>
        ) : (
          filteredComplaints.map(complaint => (
            <div key={complaint._id} className="complaint-card">
              <div className="complaint-header">
                <div className="complaint-title-section">
                  <h3>{complaint.title}</h3>
                  <div className="complaint-badges">
                    <span 
                      className="badge status-badge"
                      style={{backgroundColor: getStatusColor(complaint.status)}}
                    >
                      {complaint.status?.replace('_', ' ')}
                    </span>
                    <span 
                      className="badge priority-badge"
                      style={{backgroundColor: getPriorityColor(complaint.priority)}}
                    >
                      {complaint.priority}
                    </span>
                  </div>
                </div>
                <div className="complaint-actions">
                  <select
                    value={complaint.status}
                    onChange={(e) => handleStatusChange(complaint._id, e.target.value)}
                    className="status-select"
                  >
                    <option value="received">Received</option>
                    <option value="in_review">In Review</option>
                    <option value="assigned">Assigned</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  {complaint.assigned_to ? (
                    <button
                      onClick={() => handleUnassign(complaint._id)}
                      className="btn-action btn-warning"
                      title="Unassign volunteer"
                    >
                      🔓 Unassign
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedComplaint(complaint);
                        setShowAssignModal(true);
                      }}
                      className="btn-action btn-primary"
                      title="Assign to volunteer"
                    >
                      👤 Assign
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/admin/complaint/${complaint._id}`)}
                    className="btn-action btn-info"
                    title="View full details"
                  >
                    👁️ Details
                  </button>
                  <button
                    onClick={() => {
                      setSelectedComplaint(complaint);
                      setShowDeleteModal(true);
                    }}
                    className="btn-action btn-danger"
                    title="Delete complaint"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="complaint-body">
                <p className="complaint-description">{complaint.description}</p>
                
                <div className="complaint-info">
                  <div className="info-item">
                    <span className="info-label">📍 Location:</span>
                    <span>{complaint.location}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">📅 Reported:</span>
                    <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">👤 Reported By:</span>
                    <span>{complaint.user?.name || 'Anonymous'}</span>
                  </div>
                  {complaint.assigned_to && (
                    <div className="info-item">
                      <span className="info-label">🎯 Assigned To:</span>
                      <span className="volunteer-name">{complaint.assigned_to.name}</span>
                    </div>
                  )}
                </div>

                {complaint.images && complaint.images.length > 0 && (
                  <div className="complaint-images">
                    {complaint.images.map((image, index) => (
                      <img key={index} src={image} alt={`Complaint ${index + 1}`} />
                    ))}
                  </div>
                )}

                {complaint.comments && complaint.comments.length > 0 && (
                  <div className="complaint-comments">
                    <h4>Comments ({complaint.comments.length})</h4>
                    {complaint.comments.map(comment => (
                      <div key={comment._id} className="comment-item">
                        <div className="comment-header">
                          <span className="comment-author">{comment.user?.name || 'User'}</span>
                          <span className="comment-date">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => handleDeleteComment(complaint._id, comment._id)}
                            className="btn-delete-comment"
                            title="Delete comment"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="comment-text">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Assign Complaint to Volunteer</h2>
            <p className="modal-subtitle">
              Complaint: <strong>{selectedComplaint?.title}</strong>
            </p>
            
            <div className="form-group">
              <label>Select Volunteer</label>
              <select
                value={selectedVolunteer}
                onChange={(e) => setSelectedVolunteer(e.target.value)}
                className="form-control"
              >
                <option value="">Choose a volunteer...</option>
                {volunteers.map(volunteer => (
                  <option key={volunteer._id} value={volunteer._id}>
                    {volunteer.name} - {volunteer.email}
                  </option>
                ))}
              </select>
              {volunteers.length === 0 && (
                <p className="help-text">No approved volunteers available</p>
              )}
            </div>

            <div className="modal-actions">
              <button onClick={handleAssignVolunteer} className="btn-primary">
                Assign & Send Email
              </button>
              <button onClick={() => {
                setShowAssignModal(false);
                setSelectedVolunteer('');
              }} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Complaint</h2>
            <p className="modal-subtitle">
              Are you sure you want to delete this complaint?
            </p>
            <p className="modal-warning">
              <strong>{selectedComplaint?.title}</strong>
            </p>
            <p className="modal-info">
              This action cannot be undone. All comments and votes will also be deleted.
            </p>

            <div className="modal-actions">
              <button onClick={handleDeleteComplaint} className="btn-danger">
                Yes, Delete
              </button>
              <button onClick={() => {
                setShowDeleteModal(false);
                setSelectedComplaint(null);
              }} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComplaints;

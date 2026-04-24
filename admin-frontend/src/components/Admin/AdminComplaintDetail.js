import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminComplaintsAPI } from '../../services/adminApi';
import { generateDetailedComplaintPDF } from '../../utils/reportGenerator';
import AdminNavbar from './AdminNavbar';
import './AdminComplaintDetail.css';

const AdminComplaintDetail = ({ user, setIsAuthenticated, setUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);

  const fetchComplaintDetails = useCallback(async () => {
    try {
      const data = await adminComplaintsAPI.getById(id);
      setComplaint(data.complaint || data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch complaint details');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchComplaintDetails();
  }, [fetchComplaintDetails]);

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await adminComplaintsAPI.deleteComment(id, commentId);
      toast.success('Comment deleted successfully');
      fetchComplaintDetails();
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await adminComplaintsAPI.updateStatus(id, newStatus);
      toast.success('Status updated successfully');
      fetchComplaintDetails();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleGeneratePDFReport = async () => {
    try {
      setGeneratingReport(true);
      await generateDetailedComplaintPDF(complaint, complaint.comments || []);
      toast.success('PDF report generated successfully!');
    } catch (error) {
      toast.error('Failed to generate PDF report');
      console.error('PDF generation error:', error);
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-complaint-detail">
        <div className="loading">Loading complaint details...</div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="admin-complaint-detail">
        <div className="error">Complaint not found</div>
      </div>
    );
  }

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

  return (
    <div className="admin-complaint-detail">
      <AdminNavbar user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
      <div className="detail-header">
        <div>
          <button onClick={() => navigate('/admin/complaints')} className="btn-back">
            ← Back to Complaints
          </button>
          <h1>Complaint Details</h1>
        </div>
        <button 
          onClick={handleGeneratePDFReport} 
          className="btn-generate-pdf"
          disabled={generatingReport}
        >
          {generatingReport ? '⏳ Generating...' : '📄 Generate PDF Report'}
        </button>
      </div>

      <div className="detail-container">
        {/* Main Info Card */}
        <div className="detail-card">
          <div className="card-header">
            <h2>{complaint.title}</h2>
            <div className="badges">
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

          <div className="card-body">
            <div className="form-group">
              <label>Change Status:</label>
              <select
                value={complaint.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="form-control"
              >
                <option value="received">Received</option>
                <option value="in_review">In Review</option>
                <option value="assigned">Assigned</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="info-section">
              <h3>Description</h3>
              <p className="description">{complaint.description}</p>
            </div>

            <div className="info-grid">
              <div className="info-item">
                <span className="label">📍 Location:</span>
                <span className="value">{complaint.location || 'Not specified'}</span>
              </div>
              <div className="info-item">
                <span className="label">📅 Reported:</span>
                <span className="value">{new Date(complaint.createdAt).toLocaleString()}</span>
              </div>
              <div className="info-item">
                <span className="label">👤 Reported By:</span>
                <span className="value">{complaint.user_id?.name || 'Anonymous'}</span>
              </div>
              <div className="info-item">
                <span className="label">📧 Email:</span>
                <span className="value">{complaint.user_id?.email || 'N/A'}</span>
              </div>
              {complaint.assigned_to && (
                <div className="info-item">
                  <span className="label">🎯 Assigned To:</span>
                  <span className="value">{complaint.assigned_to.name}</span>
                </div>
              )}
            </div>

            {/* Images Section */}
            {complaint.photo && complaint.photo.length > 0 && (
              <div className="images-section">
                <h3>Images ({complaint.photo.length})</h3>
                <div className="images-grid">
                  {complaint.photo.map((image, index) => (
                    <div key={index} className="image-item">
                      <img 
                        src={image} 
                        alt={`Complaint ${index + 1}`}
                        onClick={() => window.open(image, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="comments-section">
              <h3>Comments ({complaint.comments?.length || 0})</h3>
              {complaint.comments && complaint.comments.length > 0 ? (
                <div className="comments-list">
                  {complaint.comments.map(comment => (
                    <div key={comment._id} className="comment-card">
                      <div className="comment-header">
                        <div className="comment-author">
                          <span className="author-name">{comment.user_id?.name || 'User'}</span>
                          <span className="comment-date">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="btn-delete-comment"
                          title="Delete comment"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                      <p className="comment-text">{comment.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-comments">No comments yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminComplaintDetail;

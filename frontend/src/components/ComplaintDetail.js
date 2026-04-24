import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { complaintsAPI, votesAPI, commentsAPI } from '../services/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './ComplaintDetail.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [userVote, setUserVote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentsError, setCommentsError] = useState('');
  const [userLikes, setUserLikes] = useState({});

  const fetchComplaintDetails = useCallback(async () => {
    try {
      const response = await complaintsAPI.getById(id);
      if (response.data.success) {
        setComplaint(response.data.complaint);
        // Debug: Log location coordinates
        if (response.data.complaint.location_coords) {
          console.log('🗺️ Location Coordinates:', response.data.complaint.location_coords);
          console.log('📍 Format: [longitude, latitude] =', response.data.complaint.location_coords.coordinates);
          console.log('📌 For map display [lat, lng] =', [
            response.data.complaint.location_coords.coordinates[1],
            response.data.complaint.location_coords.coordinates[0]
          ]);
        }
      }
    } catch (err) {
      console.error('Error fetching complaint:', err);
      setError('Failed to load complaint details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchUserVote = useCallback(async () => {
    try {
      const response = await votesAPI.getUserVote(id);
      if (response.data.success && response.data.vote) {
        setUserVote(response.data.vote.vote_type);
      }
    } catch (err) {
      // User hasn't voted yet
      setUserVote(null);
    }
  }, [id]);

  const handleVote = async (voteType) => {
    try {
      const response = await votesAPI.vote(id, voteType);
      if (response.data.success) {
        // Refresh complaint data to get updated vote counts
        fetchComplaintDetails();
        fetchUserVote();
      }
    } catch (err) {
      console.error('Error voting:', err);
      setError('Failed to register vote');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'received':
        return 'status-badge received';
      case 'in_review':
        return 'status-badge in-review';
      case 'resolved':
        return 'status-badge resolved';
      default:
        return 'status-badge';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'priority-badge urgent';
      case 'high':
        return 'priority-badge high';
      case 'medium':
        return 'priority-badge medium';
      case 'low':
        return 'priority-badge low';
      default:
        return 'priority-badge';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCommentDate = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInMs = now - commentDate;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return commentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const fetchComments = useCallback(async () => {
    try {
      const response = await commentsAPI.getByComplaint(id);
      if (response.data.success) {
        setComments(response.data.comments);
        
        // Track which comments the user has liked
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const likes = {};
        response.data.comments.forEach(comment => {
          likes[comment._id] = comment.likedBy && comment.likedBy.includes(currentUser._id);
        });
        setUserLikes(likes);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  }, [id]);

  useEffect(() => {
    fetchComplaintDetails();
    fetchUserVote();
    fetchComments();
  }, [fetchComplaintDetails, fetchUserVote, fetchComments]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      setCommentsError('Please enter a comment');
      return;
    }

    setCommentLoading(true);
    setCommentsError('');

    try {
      const response = await commentsAPI.create({
        complaint_id: id,
        content: newComment.trim()
      });

      if (response.data.success) {
        setNewComment('');
        fetchComments(); // Refresh comments
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      setCommentsError('Failed to post comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleCommentLike = async (commentId) => {
    try {
      const response = await commentsAPI.like(commentId);
      if (response.data.success) {
        // Update local state
        setComments(prevComments =>
          prevComments.map(comment =>
            comment._id === commentId
              ? { ...comment, likes: response.data.likes }
              : comment
          )
        );
        
        // Update user likes
        setUserLikes(prev => ({
          ...prev,
          [commentId]: response.data.isLiked
        }));
      }
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const response = await commentsAPI.delete(commentId);
      if (response.data.success) {
        fetchComments(); // Refresh comments
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="complaint-detail-container">
        <div className="loading">Loading complaint details...</div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="complaint-detail-container">
        <div className="error-message">{error || 'Complaint not found'}</div>
        <button onClick={() => navigate('/view-complaints')} className="back-button">
          ← Back to Complaints
        </button>
      </div>
    );
  }

  return (
    <div className="complaint-detail-container">
      <div className="complaint-detail-header">
        <button onClick={() => navigate('/view-complaints')} className="back-button">
          ← Back to Complaints
        </button>
        <h1>Complaint Details</h1>
      </div>

      <div className="complaint-detail-content">
        {/* Main Info Section */}
        <div className="detail-section">
          <div className="detail-header-row">
            <h2 className="complaint-title">{complaint.title}</h2>
            <div className="badges-group">
              <span className={getStatusBadgeClass(complaint.status)}>
                {complaint.status?.replace('_', ' ').toUpperCase()}
              </span>
              <span className={getPriorityBadgeClass(complaint.priority)}>
                {complaint.priority?.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="detail-meta">
            <div className="meta-item">
              <span className="meta-label">📅 Submitted:</span>
              <span className="meta-value">{formatDate(complaint.created_at)}</span>
            </div>
            {complaint.user_id && (
              <div className="meta-item">
                <span className="meta-label">👤 Reported by:</span>
                <span className="meta-value">{complaint.user_id.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description Section */}
        <div className="detail-section">
          <h3>Description</h3>
          <p className="complaint-description">{complaint.description}</p>
        </div>

        {/* Location Section */}
        <div className="detail-section">
          <h3>📍 Location</h3>
          <p className="complaint-address">{complaint.address}</p>
          {complaint.location_coords && complaint.location_coords.coordinates && (
            <p className="complaint-coords">
              Coordinates: {complaint.location_coords.coordinates[1]}, {complaint.location_coords.coordinates[0]}
            </p>
          )}
        </div>

        {/* Images Section */}
        {complaint.photo && complaint.photo.length > 0 && (
          <div className="detail-section">
            <h3>📸 Images ({complaint.photo.length})</h3>
            <div className="images-grid">
              {complaint.photo.map((photoUrl, index) => (
                <div 
                  key={index} 
                  className="image-thumbnail"
                  onClick={() => setSelectedImage(photoUrl)}
                >
                  <img 
                    src={photoUrl} 
                    alt={`Complaint ${index + 1}`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
                    }}
                  />
                  <div className="image-overlay">
                    <span>Click to view</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Voting Section */}
        <div className="detail-section voting-section">
          <h3>Community Votes</h3>
          <div className="voting-container">
            <button
              className={`vote-button upvote ${userVote === 'upvote' ? 'active' : ''}`}
              onClick={() => handleVote('upvote')}
              title="Upvote this complaint"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4l-8 8h5v8h6v-8h5z"/>
              </svg>
              <span className="vote-count">{complaint.upvotes || 0}</span>
            </button>

            <button
              className={`vote-button downvote ${userVote === 'downvote' ? 'active' : ''}`}
              onClick={() => handleVote('downvote')}
              title="Downvote this complaint"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 20l8-8h-5V4H9v8H4z"/>
              </svg>
              <span className="vote-count">{complaint.downvotes || 0}</span>
            </button>
          </div>
          <p className="voting-info">
            {userVote ? `You ${userVote}d this complaint` : 'Cast your vote to support or oppose this complaint'}
          </p>
        </div>

        {/* Map Section */}
        <div className="detail-section map-section">
          <h3>📍 Location on Map</h3>
          {complaint.location_coords && 
           complaint.location_coords.coordinates && 
           complaint.location_coords.coordinates.length === 2 &&
           complaint.location_coords.coordinates[0] !== 0 && 
           complaint.location_coords.coordinates[1] !== 0 ? (
            <>
              <div className="map-container">
                <MapContainer
                  center={[complaint.location_coords.coordinates[1], complaint.location_coords.coordinates[0]]}
                  zoom={15}
                  style={{ height: '400px', width: '100%', borderRadius: '8px' }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[complaint.location_coords.coordinates[1], complaint.location_coords.coordinates[0]]}>
                    <Popup>
                      <strong>{complaint.title}</strong>
                      <br />
                      {complaint.address}
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
              <p className="map-info" style={{ fontSize: '13px', color: '#5f6368', marginTop: '10px', fontStyle: 'italic' }}>
                📌 Lat: {complaint.location_coords.coordinates[1].toFixed(6)}, Lng: {complaint.location_coords.coordinates[0].toFixed(6)}
              </p>
            </>
          ) : (
            <div className="map-not-available">
              <div className="map-placeholder">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <circle cx="12" cy="9" r="2.5"/>
                  <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2"/>
                </svg>
                <p className="no-location-text">Location not set</p>
                <p className="no-location-hint">
                  This complaint was submitted without selecting a location on the map.
                  <br />
                  Address: {complaint.address}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="detail-section comments-section">
          <h3>💬 Comments ({comments.length})</h3>
          
          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts about this complaint..."
              rows="4"
              disabled={commentLoading}
              className="comment-input"
            />
            {commentsError && <div className="error-message">{commentsError}</div>}
            <button 
              type="submit" 
              disabled={commentLoading || !newComment.trim()}
              className="submit-comment-btn"
            >
              {commentLoading ? 'Posting...' : 'Post Comment'}
            </button>
          </form>

          {/* Comments List */}
          <div className="comments-list">
            {comments.length === 0 ? (
              <p className="no-comments">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => {
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                const isOwner = currentUser._id === comment.user_id?._id;
                
                return (
                  <div key={comment._id} className="comment-item">
                    <div className="comment-header">
                      <div className="comment-user-info">
                        <div className="comment-avatar">
                          {comment.user_id?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="comment-meta">
                          <span className="comment-author">{comment.user_id?.name || 'Anonymous'}</span>
                          <span className="comment-date">{formatCommentDate(comment.created_at)}</span>
                        </div>
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => handleCommentDelete(comment._id)}
                          className="delete-comment-btn"
                          title="Delete comment"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                    <p className="comment-content">{comment.content}</p>
                    <div className="comment-actions">
                      <button
                        onClick={() => handleCommentLike(comment._id)}
                        className={`like-btn ${userLikes[comment._id] ? 'liked' : ''}`}
                      >
                        {userLikes[comment._id] ? '❤️' : '🤍'} {comment.likes || 0}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedImage(null)}>
              ×
            </button>
            <img 
              src={selectedImage} 
              alt="Complaint full size"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ComplaintDetail;

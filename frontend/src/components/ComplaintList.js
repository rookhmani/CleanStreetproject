import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintsAPI, votesAPI } from '../services/api';
import './ComplaintList.css';

function ComplaintList() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ status: 'all', type: 'all' });
  const [userVotes, setUserVotes] = useState({});

  const fetchUserVotes = useCallback(async (complaints) => {
    const votes = {};
    for (const complaint of complaints) {
      try {
        const response = await votesAPI.getUserVote(complaint._id);
        if (response.data.vote) {
          votes[complaint._id] = response.data.vote.vote_type;
        }
      } catch (err) {
        console.error('Error fetching vote for complaint:', complaint._id);
      }
    }
    setUserVotes(votes);
  }, []);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const response = await complaintsAPI.getAll();
      if (response.data.success) {
        setComplaints(response.data.complaints);
        // Fetch user votes for each complaint
        fetchUserVotes(response.data.complaints);
      }
    } catch (err) {
      setError('Failed to load complaints');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchUserVotes]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleVote = async (complaintId, voteType) => {
    try {
      const response = await votesAPI.vote(complaintId, voteType);
      if (response.data.success) {
        // Update the complaint in the list with new vote counts
        setComplaints(complaints.map(c => 
          c._id === complaintId 
            ? { ...c, upvotes: response.data.upvotes, downvotes: response.data.downvotes }
            : c
        ));
        
        // Update user's vote
        if (response.data.vote) {
          setUserVotes({ ...userVotes, [complaintId]: response.data.vote.vote_type });
        } else {
          // Vote was removed
          const newVotes = { ...userVotes };
          delete newVotes[complaintId];
          setUserVotes(newVotes);
        }
      }
    } catch (err) {
      console.error('Vote error:', err);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'received':
        return 'status-received';
      case 'in_review':
        return 'status-in-review';
      case 'resolved':
        return 'status-resolved';
      default:
        return '';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'received':
        return 'Received';
      case 'in_review':
        return 'In Review';
      case 'resolved':
        return 'Resolved';
      default:
        return status;
    }
  };

  const getTypeIcon = (title) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('pothole')) return '🕳️';
    if (titleLower.includes('streetlight') || titleLower.includes('light')) return '💡';
    if (titleLower.includes('garbage') || titleLower.includes('trash')) return '🗑️';
    if (titleLower.includes('water') || titleLower.includes('leak')) return '💧';
    return '⚠️';
  };

  const filteredComplaints = complaints.filter(complaint => {
    if (filter.status !== 'all' && complaint.status !== filter.status) return false;
    if (filter.type !== 'all') {
      const titleLower = complaint.title.toLowerCase();
      if (filter.type === 'pothole' && !titleLower.includes('pothole')) return false;
      if (filter.type === 'streetlight' && !titleLower.includes('light')) return false;
      if (filter.type === 'garbage' && !titleLower.includes('garbage') && !titleLower.includes('trash')) return false;
      if (filter.type === 'water' && !titleLower.includes('water')) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="complaint-list-page">
        <div className="loading-spinner">Loading complaints...</div>
      </div>
    );
  }

  return (
    <div className="complaint-list-page">
      <div className="complaint-list-header">
        <h1>Community Reports</h1>
        <div className="filters">
          <div className="filter-group">
            <label>Status:</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              <option value="all">All Status</option>
              <option value="received">Received</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Type:</label>
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            >
              <option value="all">All Types</option>
              <option value="pothole">Pothole</option>
              <option value="streetlight">Streetlight</option>
              <option value="garbage">Garbage</option>
              <option value="water">Water Issues</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="complaints-grid">
        {filteredComplaints.map(complaint => (
          <div key={complaint._id} className="complaint-card" onClick={() => navigate(`/complaint/${complaint._id}`)}>
            <div className="card-header">
              <div className="card-type">
                <span className="type-icon">{getTypeIcon(complaint.title)}</span>
                <h3 className="card-title">{complaint.title}</h3>
              </div>
              <span className={`status-badge ${getStatusBadgeClass(complaint.status)}`}>
                {getStatusLabel(complaint.status)}
              </span>
            </div>

            <div className="card-content">
              <p className="card-description">{complaint.description}</p>
              
              {complaint.photo && complaint.photo.length > 0 && (
                <div className="card-images">
                  {complaint.photo.slice(0, 3).map((img, idx) => (
                    <img key={idx} src={img} alt={`Complaint ${idx + 1}`} />
                  ))}
                  {complaint.photo.length > 3 && (
                    <div className="more-images">+{complaint.photo.length - 3} more</div>
                  )}
                </div>
              )}

              <div className="card-location">
                <span className="location-icon">📍</span>
                <span className="location-text">{complaint.address}</span>
              </div>

              <div className="card-meta">
                <span className="meta-item">
                  👤 {complaint.user_id?.name || 'Anonymous'}
                </span>
                <span className="meta-item">
                  🕒 {new Date(complaint.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="card-footer">
              <div className="voting-section">
                <button
                  className={`vote-btn upvote ${userVotes[complaint._id] === 'upvote' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVote(complaint._id, 'upvote');
                  }}
                  title="Upvote"
                >
                  👍 {complaint.upvotes || 0}
                </button>
                <button
                  className={`vote-btn downvote ${userVotes[complaint._id] === 'downvote' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVote(complaint._id, 'downvote');
                  }}
                  title="Downvote"
                >
                  👎 {complaint.downvotes || 0}
                </button>
              </div>
              <button 
                className="view-details-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/complaint/${complaint._id}`);
                }}
              >
                View Details →
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredComplaints.length === 0 && (
        <div className="no-complaints">
          <p>No complaints found matching your filters.</p>
        </div>
      )}
    </div>
  );
}

export default ComplaintList;

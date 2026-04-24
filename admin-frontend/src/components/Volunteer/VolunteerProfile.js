import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import VolunteerNavbar from './VolunteerNavbar';
import './VolunteerProfile.css';

const VolunteerProfile = ({ setIsAuthenticated, setUser }) => {
  const navigate = useNavigate();
  const [volunteer, setVolunteer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const fetchProfile = useCallback(async () => {
    try {
      const volunteerData = JSON.parse(localStorage.getItem('volunteer'));
      if (!volunteerData) {
        navigate('/volunteer/login');
        return;
      }
      
      setVolunteer(volunteerData);
      setFormData({
        name: volunteerData.name || '',
        email: volunteerData.email || '',
        phone: volunteerData.phone || '',
        address: volunteerData.address || ''
      });
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load profile');
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Note: You'll need to add an update profile endpoint in the backend
      toast.success('Profile updated successfully');
      setIsEditing(false);
      
      // Update localStorage
      const updatedVolunteer = { ...volunteer, ...formData };
      localStorage.setItem('volunteer', JSON.stringify(updatedVolunteer));
      setVolunteer(updatedVolunteer);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="volunteer-profile">
        <VolunteerNavbar volunteer={volunteer} setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="volunteer-profile">
      <VolunteerNavbar volunteer={volunteer} setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
      
      <div className="profile-content">
        <div className="profile-header">
          <h1>My Profile</h1>
          <p>Manage your volunteer account information</p>
        </div>

        <div className="profile-card">
          <div className="profile-avatar">
            <div className="avatar-circle">
              {volunteer?.name?.charAt(0).toUpperCase() || 'V'}
            </div>
            <div className="avatar-info">
              <h2>{volunteer?.name}</h2>
              <span className="status-badge approved">
                {volunteer?.status === 'approved' ? '✓ Approved' : volunteer?.status}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={true}
                  className="form-control"
                  title="Email cannot be changed"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="form-control"
                  placeholder="Enter phone number"
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <input
                  type="text"
                  value={volunteer?.status || 'N/A'}
                  disabled
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isEditing}
                className="form-control"
                rows="3"
                placeholder="Enter your address"
              />
            </div>

            <div className="profile-info-grid">
              <div className="info-item">
                <span className="info-label">📅 Joined:</span>
                <span className="info-value">
                  {volunteer?.createdAt ? new Date(volunteer.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              {volunteer?.approved_at && (
                <div className="info-item">
                  <span className="info-label">✅ Approved:</span>
                  <span className="info-value">
                    {new Date(volunteer.approved_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="form-actions">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="btn-primary"
                >
                  ✏️ Edit Profile
                </button>
              ) : (
                <>
                  <button type="submit" className="btn-success">
                    💾 Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      fetchProfile();
                    }}
                    className="btn-secondary"
                  >
                    ✕ Cancel
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VolunteerProfile;

import React, { useState, useEffect } from 'react';
import LocationPicker from './LocationPicker';
import './Profile.css';

function Profile({ user }) {
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    name: user?.name || '',
    phoneNumber: user?.phoneNumber || '',
    location: user?.location || '',
    bio: 'Active citizen helping to improve our community through CleanStreet reporting.',
    memberSince: user?.createdAt || new Date().toISOString()
  });
  const [isEditing, setIsEditing] = useState(false);

  // Update profile data when user prop changes
  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
        location: user.location || '',
        bio: 'Active citizen helping to improve our community through CleanStreet reporting.',
        memberSince: user.createdAt || new Date().toISOString()
      });
    }
  }, [user]);

  const getInitials = () => {
    if (profileData.name) {
      const names = profileData.name.split(' ');
      return names.length > 1 
        ? `${names[0][0]}${names[names.length - 1][0]}`
        : names[0][0];
    }
    return 'DU';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="profile-page">
      {/* Profile Content */}
      <div className="profile-content">
        <h1 className="profile-heading">Profile</h1>
        <p className="profile-subtitle">Manage your account information and preferences</p>

        <div className="profile-grid">
          {/* Left Column - Profile Card */}
          <div className="profile-card-section">
            <div className="profile-avatar-card">
              <div className="profile-avatar-large">
                <span className="avatar-initials">{getInitials()}</span>
                <button className="avatar-upload-btn" title="Change profile picture">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </button>
              </div>

              <h2 className="profile-name">{profileData.name || 'Demo User'}</h2>
              <p className="profile-username">@{profileData.username}</p>
              
              <div className="profile-badge">
                <span className="badge-label">Citizen</span>
              </div>

              <p className="profile-bio-text">
                {profileData.bio}
              </p>

              <div className="profile-member-since">
                <span>Member since {formatDate(profileData.memberSince)}</span>
              </div>
            </div>
          </div>

          {/* Right Column - Account Information */}
          <div className="profile-info-section">
            <div className="profile-info-card">
              <div className="profile-info-header">
                <div className="info-header-left">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>Account Information</span>
                </div>
                <button className="edit-profile-btn" onClick={() => setIsEditing(!isEditing)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  <span>Edit</span>
                </button>
              </div>

              <div className="profile-info-grid">
                <div className="info-field">
                  <div className="info-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>Username</span>
                  </div>
                  <div className="info-value">{profileData.username}</div>
                </div>

                <div className="info-field">
                  <div className="info-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <span>Email</span>
                  </div>
                  <div className="info-value">{profileData.email}</div>
                </div>

                <div className="info-field">
                  <div className="info-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>Full Name</span>
                  </div>
                  <div className="info-value">{profileData.name}</div>
                </div>

                <div className="info-field">
                  <div className="info-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <span>Phone Number</span>
                  </div>
                  <div className="info-value">{profileData.phoneNumber || 'Not provided'}</div>
                </div>

                <div className="info-field full-width">
                  <div className="info-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>Location</span>
                  </div>
                  <div className="info-value">{profileData.location}</div>
                  {profileData.location && (
                    <div className="location-map" style={{ marginTop: '10px', height: '200px' }}>
                      <LocationPicker
                        location={profileData.location}
                        setLocation={() => {}}
                        readonly={true}
                      />
                    </div>
                  )}
                </div>

                <div className="info-field full-width">
                  <div className="info-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                    <span>Bio</span>
                  </div>
                  <div className="info-value bio-value">{profileData.bio}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;


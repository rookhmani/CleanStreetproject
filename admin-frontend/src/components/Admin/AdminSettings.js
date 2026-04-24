import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminAuthAPI } from '../../services/adminApi';
import AdminNavbar from './AdminNavbar';
import './AdminSettings.css';

const AdminSettings = ({ user, setIsAuthenticated, setUser }) => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: ''
  });

useEffect(() => {
  const admin = JSON.parse(localStorage.getItem("adminUser") || "null");
  setCurrentAdmin(admin);
  fetchAdmins();
}, []);

  const fetchAdmins = async () => {
    try {
      const response = await adminAuthAPI.getAdmins();
      setAdmins(response.admins || []);
    } catch (error) {
      toast.error('Failed to fetch admins');
      console.error('Fetch admins error:', error);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newAdmin.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await adminAuthAPI.createAdmin(newAdmin);
      toast.success('Admin created successfully! They can now login.');
      setShowCreateModal(false);
      setNewAdmin({ name: '', email: '', password: '' });
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create admin');
    }
  };

  return (
    <div className="admin-settings">
      <AdminNavbar user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
      <div className="settings-header">
        <div>
          <h1>Admin Settings</h1>
          <p>Manage admin accounts and system settings</p>
        </div>
        <button onClick={() => navigate('/admin/dashboard')} className="btn-secondary">
          ← Back
        </button>
      </div>

      {/* Current Admin Info */}
      <div className="current-admin-card">
        <h2>Your Account</h2>
        <div className="admin-info">
          <div className="info-row">
            <span className="label">Name:</span>
            <span className="value">{currentAdmin?.name}</span>
          </div>
          <div className="info-row">
            <span className="label">Email:</span>
            <span className="value">{currentAdmin?.email}</span>
          </div>
        </div>
      </div>

      {/* Create Admins Section */}
      <div className="create-admin-section">
        <div className="section-header">
          <h2>Admin Management</h2>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            ➕ Create New Admin
          </button>
        </div>
        <p className="section-description">
          Any admin can create other admin accounts with equal permissions
        </p>
      </div>

      <div className="admins-list">
        <h3>All Admins ({admins.length})</h3>
        <div className="admins-grid">
          {admins.map(admin => (
            <div key={admin._id} className="admin-card">
              <div className="admin-card-header">
                <h4>{admin.name}</h4>
              </div>
              <div className="admin-card-body">
                <p className="admin-email">{admin.email}</p>
                <p className="admin-date">
                  Created: {new Date(admin.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Admin</h2>
            <p className="modal-subtitle">
              Create a new admin account. They will be able to login immediately with these credentials.
            </p>
            
            <form onSubmit={handleCreateAdmin}>
              <div className="form-group">
                <label>Admin Name *</label>
                <input
                  type="text"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                  className="form-control"
                  placeholder="Enter admin name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Admin Email *</label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  className="form-control"
                  placeholder="admin@cleanstreet.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  className="form-control"
                  placeholder="Minimum 6 characters"
                  required
                  minLength="6"
                />
                <p className="help-text">
                  Share this password securely with the new admin
                </p>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  Create Admin Account
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewAdmin({ name: '', email: '', password: '' });
                  }} 
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;

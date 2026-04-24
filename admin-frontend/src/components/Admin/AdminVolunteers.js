import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminVolunteersAPI } from '../../services/adminApi';
import AdminNavbar from './AdminNavbar';
import './AdminVolunteers.css';

const AdminVolunteers = ({ user, setIsAuthenticated, setUser }) => {
  const navigate = useNavigate();
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [newVolunteer, setNewVolunteer] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });

  const fetchVolunteers = useCallback(async () => {
    try {
      const data = await adminVolunteersAPI.getAll();
      setVolunteers(data.volunteers || []);
      setLoading(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch volunteers');
      if (error.response?.status === 401) {
        navigate('/admin/login');
      }
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchVolunteers();
  }, [fetchVolunteers]);

  const handleApprove = async (volunteerId) => {
    try {
      await adminVolunteersAPI.approve(volunteerId);
      toast.success('Volunteer approved successfully! Email sent.');
      fetchVolunteers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve volunteer');
    }
  };

  const handleBlock = async (volunteerId) => {
    if (window.confirm('Are you sure you want to block this volunteer?')) {
      try {
        await adminVolunteersAPI.block(volunteerId);
        toast.success('Volunteer blocked successfully');
        fetchVolunteers();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to block volunteer');
      }
    }
  };

  const handleDelete = async (volunteerId) => {
    if (window.confirm('Are you sure you want to delete this volunteer? This action cannot be undone.')) {
      try {
        await adminVolunteersAPI.delete(volunteerId);
        toast.success('Volunteer deleted successfully');
        fetchVolunteers();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete volunteer');
      }
    }
  };

  const handleAddVolunteer = async (e) => {
    e.preventDefault();
    
    if (!newVolunteer.name || !newVolunteer.email || !newVolunteer.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await adminVolunteersAPI.createVolunteer(newVolunteer);
      toast.success('Volunteer created and approved successfully!');
      setShowAddModal(false);
      setNewVolunteer({ name: '', email: '', password: '', phone: '', address: '' });
      fetchVolunteers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create volunteer');
    }
  };

  const filteredVolunteers = volunteers.filter(volunteer => {
    if (!filterStatus) return true;
    return volunteer.status === filterStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      approved: '#10b981',
      blocked: '#ef4444'
    };
    return colors[status] || '#64748b';
  };

  const stats = {
    total: volunteers.length,
    pending: volunteers.filter(v => v.status === 'pending').length,
    approved: volunteers.filter(v => v.status === 'approved').length,
    blocked: volunteers.filter(v => v.status === 'blocked').length
  };

  if (loading) {
    return (
      <div className="admin-volunteers">
        <div className="loading">Loading volunteers...</div>
      </div>
    );
  }

  return (
    <div className="admin-volunteers">
      <AdminNavbar user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
      <div className="volunteers-header">
        <div>
          <h1>Volunteer Management</h1>
          <p>Manage volunteer registrations and assignments</p>
        </div>
        <div className="header-actions">
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            ➕ Add Volunteer
          </button>
          <button onClick={() => navigate('/admin/dashboard')} className="btn-secondary">
            ← Back
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="volunteers-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Volunteers</p>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>{stats.pending}</h3>
            <p>Pending Approval</p>
          </div>
        </div>
        <div className="stat-card approved">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{stats.approved}</h3>
            <p>Approved</p>
          </div>
        </div>
        <div className="stat-card blocked">
          <div className="stat-icon">🚫</div>
          <div className="stat-info">
            <h3>{stats.blocked}</h3>
            <p>Blocked</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="filter-section">
        <label>Filter by Status:</label>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">All Volunteers</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* Volunteers Table */}
      <div className="volunteers-table-container">
        {filteredVolunteers.length === 0 ? (
          <div className="no-volunteers">
            <p>No volunteers found</p>
          </div>
        ) : (
          <table className="volunteers-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Assigned Issues</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVolunteers.map(volunteer => (
                <tr key={volunteer._id}>
                  <td>
                    <div className="volunteer-name">
                      <span className="name-text">{volunteer.name}</span>
                    </div>
                  </td>
                  <td>{volunteer.email}</td>
                  <td>{volunteer.phone || 'N/A'}</td>
                  <td>{volunteer.address || 'N/A'}</td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{backgroundColor: getStatusColor(volunteer.status)}}
                    >
                      {volunteer.status}
                    </span>
                  </td>
                  <td>{new Date(volunteer.createdAt).toLocaleDateString()}</td>
                  <td className="text-center">
                    {volunteer.assigned_complaints?.length || 0}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {volunteer.status === 'pending' && (
                        <button
                          onClick={() => handleApprove(volunteer._id)}
                          className="btn-approve"
                          title="Approve volunteer"
                        >
                          ✓ Approve
                        </button>
                      )}
                      {volunteer.status === 'approved' && (
                        <button
                          onClick={() => handleBlock(volunteer._id)}
                          className="btn-block"
                          title="Block volunteer"
                        >
                          🚫 Block
                        </button>
                      )}
                      {volunteer.status === 'blocked' && (
                        <button
                          onClick={() => handleApprove(volunteer._id)}
                          className="btn-approve"
                          title="Unblock volunteer"
                        >
                          ✓ Unblock
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(volunteer._id)}
                        className="btn-delete"
                        title="Delete volunteer"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Volunteer Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Volunteer</h2>
            <p className="modal-subtitle">Manually create and approve a volunteer</p>
            
            <form onSubmit={handleAddVolunteer}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={newVolunteer.name}
                  onChange={(e) => setNewVolunteer({...newVolunteer, name: e.target.value})}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={newVolunteer.email}
                  onChange={(e) => setNewVolunteer({...newVolunteer, email: e.target.value})}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={newVolunteer.password}
                  onChange={(e) => setNewVolunteer({...newVolunteer, password: e.target.value})}
                  className="form-control"
                  required
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={newVolunteer.phone}
                  onChange={(e) => setNewVolunteer({...newVolunteer, phone: e.target.value})}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={newVolunteer.address}
                  onChange={(e) => setNewVolunteer({...newVolunteer, address: e.target.value})}
                  className="form-control"
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  Create & Approve
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewVolunteer({ name: '', email: '', password: '', phone: '', address: '' });
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

export default AdminVolunteers;

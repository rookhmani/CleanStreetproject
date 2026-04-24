import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminUsersAPI } from '../../services/adminApi';
import AdminNavbar from './AdminNavbar';
import './AdminUsers.css';

const AdminUsers = ({ user, setIsAuthenticated, setUser }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await adminUsersAPI.getAll();
      setUsers(data.users || []);
      setLoading(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch users');
      if (error.response?.status === 401) {
        navigate('/admin/login');
      }
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleBlockToggle = async (userId, currentStatus) => {
    const action = currentStatus ? 'unblock' : 'block';
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      try {
        await adminUsersAPI.block(userId);
        toast.success(`User ${action}ed successfully`);
        fetchUsers();
      } catch (error) {
        toast.error(error.response?.data?.message || `Failed to ${action} user`);
      }
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? All their complaints will also be deleted.')) {
      try {
        await adminUsersAPI.delete(userId);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleViewDetails = async (userId) => {
    try {
      const data = await adminUsersAPI.getById(userId);
      setSelectedUser(data.user || data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Failed to fetch user details');
    }
  };

  if (loading) {
    return <div className="admin-users"><div className="loading">Loading users...</div></div>;
  }

  return (
    <div className="admin-users">
      <AdminNavbar user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
      <div className="users-header">
        <div>
          <h1>User Management</h1>
          <p>Manage all registered users</p>
        </div>
        <button onClick={() => navigate('/admin/dashboard')} className="btn-secondary">
          ← Back
        </button>
      </div>

      <div className="users-stats">
        <div className="stat-item">
          <span className="stat-icon">👥</span>
          <div>
            <h3>{users.length}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-icon">✅</span>
          <div>
            <h3>{users.filter(u => !u.isBlocked).length}</h3>
            <p>Active Users</p>
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🚫</span>
          <div>
            <h3>{users.filter(u => u.isBlocked).length}</h3>
            <p>Blocked Users</p>
          </div>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Joined</th>
              <th>Complaints</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} className={user.isBlocked ? 'blocked-row' : ''}>
                <td><strong>{user.name}</strong></td>
                <td>{user.email}</td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="text-center">{user.complaintsCount || 0}</td>
                <td>
                  <span className={`status-badge ${user.isBlocked ? 'blocked' : 'active'}`}>
                    {user.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button onClick={() => handleViewDetails(user._id)} className="btn-view">
                      👁️ View
                    </button>
                    <button 
                      onClick={() => handleBlockToggle(user._id, user.isBlocked)}
                      className={user.isBlocked ? 'btn-unblock' : 'btn-block'}
                    >
                      {user.isBlocked ? '✓ Unblock' : '🚫 Block'}
                    </button>
                    <button onClick={() => handleDelete(user._id)} className="btn-delete">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDetailsModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>User Details</h2>
            <div className="user-details">
              <div className="detail-row">
                <span className="label">Name:</span>
                <span className="value">{selectedUser.name}</span>
              </div>
              <div className="detail-row">
                <span className="label">Email:</span>
                <span className="value">{selectedUser.email}</span>
              </div>
              <div className="detail-row">
                <span className="label">Joined:</span>
                <span className="value">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <span className="label">Status:</span>
                <span className={`status-badge ${selectedUser.isBlocked ? 'blocked' : 'active'}`}>
                  {selectedUser.isBlocked ? 'Blocked' : 'Active'}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Total Complaints:</span>
                <span className="value">{selectedUser.complaints?.length || 0}</span>
              </div>
            </div>

            {selectedUser.complaints && selectedUser.complaints.length > 0 && (
              <div className="user-complaints">
                <h3>User's Complaints</h3>
                {selectedUser.complaints.map(complaint => (
                  <div key={complaint._id} className="complaint-item">
                    <h4>{complaint.title}</h4>
                    <p>{complaint.description}</p>
                    <div className="complaint-meta">
                      <span className="status">{complaint.status}</span>
                      <span className="date">{new Date(complaint.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setShowDetailsModal(false)} className="btn-primary">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

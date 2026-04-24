import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintsAPI, usersAPI } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    totalIssues: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    activeUsers: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('📊 Fetching dashboard data...');
        const [statsResponse, complaintsResponse, usersResponse, allStatsResponse] = await Promise.all([
          complaintsAPI.getStats(),
          complaintsAPI.getUserComplaints(),
          usersAPI.getStats(),
          complaintsAPI.getAllStats() // Use the new endpoint
        ]);

        console.log('📈 Stats response:', statsResponse.data);
        console.log('📋 Complaints response:', complaintsResponse.data);
        console.log('👥 Users response:', usersResponse.data);
        console.log('🌍 All stats response:', allStatsResponse.data);

        // Get stats from all users for community-wide dashboard
        let communityStats = {
          totalIssues: 0,
          pending: 0,
          inProgress: 0,
          resolved: 0
        };

        if (allStatsResponse.data.success) {
          communityStats = allStatsResponse.data.stats;
        }

        // Get active users
        const activeUsers = usersResponse.data?.stats?.activeUsers || 0;

        const newStats = {
          totalIssues: communityStats.totalIssues,
          pending: communityStats.pending,
          inProgress: communityStats.inProgress,
          resolved: communityStats.resolved,
          activeUsers
        };
        
        console.log('✅ Setting stats to:', newStats);
        setStats(newStats);

        if (complaintsResponse.data.success) {
          // Get the 3 most recent complaints for activity
          const recent = complaintsResponse.data.complaints.slice(0, 3).map(complaint => ({
            title: complaint.title,
            status: complaint.status,
            time: getTimeAgo(complaint.created_at)
          }));
          setRecentActivity(recent);
        }
      } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        console.error('❌ Error details:', error.response?.data);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Auto-refresh stats every 30 seconds
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard stats...');
      fetchDashboardData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return 'Just now';
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      {/* Dashboard Content */}
      <div className="dashboard-content">
        <h1 className="dashboard-heading">Dashboard</h1>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card-dash">
            <div className="stat-icon-circle warning">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3 className="stat-number">{stats.totalIssues}</h3>
              <p className="stat-label">Total Issues</p>
            </div>
          </div>

          <div className="stat-card-dash">
            <div className="stat-icon-circle pending">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3 className="stat-number">{stats.pending}</h3>
              <p className="stat-label">Pending</p>
            </div>
          </div>

          <div className="stat-card-dash">
            <div className="stat-icon-circle progress">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3 className="stat-number">{stats.inProgress}</h3>
              <p className="stat-label">In Progress</p>
            </div>
          </div>

          <div className="stat-card-dash">
            <div className="stat-icon-circle resolved">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3 className="stat-number">{stats.resolved}</h3>
              <p className="stat-label">Resolved</p>
            </div>
          </div>

          <div className="stat-card-dash">
            <div className="stat-icon-circle info">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3 className="stat-number">{stats.activeUsers || 0}</h3>
              <p className="stat-label">Active Users</p>
            </div>
          </div>
        </div>

        {/* Main Grid - Activity and Actions */}
        <div className="dashboard-main-grid">
          {/* Recent Activity */}
          <div className="dashboard-section">
            <h2 className="section-title">Recent Activity</h2>
            <div className="activity-list">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon-circle">
                      {index === 1 ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                        </svg>
                      ) : (
                        <span className="activity-dot"></span>
                      )}
                    </div>
                    <div className="activity-details">
                      <p className="activity-text">{activity.title}</p>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-activity">No recent activity</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dashboard-section">
            <h2 className="section-title">Quick Actions</h2>
            <div className="actions-list">
              <Link to="/report-issue" className="action-button primary">
                <span className="action-icon-plus">+</span>
                <span>Report New Issue</span>
              </Link>
              <Link to="/view-complaints" className="action-button secondary">
                <span className="action-icon-list">≡</span>
                <span>View All Complaints</span>
              </Link>
              <Link to="/issues-map" className="action-button tertiary">
                <span className="action-icon-map">🗺</span>
                <span>Issues Map</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Navigation from './components/Navigation';
import ComplaintForm from './components/ComplaintForm';
import ComplaintList from './components/ComplaintList';
import ComplaintDetail from './components/ComplaintDetail';
import AdminDashboard from './components/AdminDashboard';
import IssuesMap from './components/IssuesMap';
import About from './components/About';
import ErrorBoundary from './components/ErrorBoundary';
import { authAPI, setAuthToken } from './services/api';
import './App.css';

// Component to conditionally render Navigation
function ConditionalNavigation({ isAuthenticated, setIsAuthenticated, setUser }) {
  const location = useLocation();
  const hideNavbarRoutes = ['/reset-password'];
  
  const shouldHideNavbar = hideNavbarRoutes.some(route => 
    location.pathname.startsWith(route)
  );
  
  if (shouldHideNavbar) return null;
  
  return (
    <Navigation 
      isAuthenticated={isAuthenticated} 
      setIsAuthenticated={setIsAuthenticated}
      setUser={setUser}
    />
  );
}

// Private route wrapper
const PrivateRoute = ({ children, isAuthenticated }) => {
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        setAuthToken(token);
        try {
          const response = await authAPI.getMe();
          if (response.data.success) {
            setIsAuthenticated(true);
            setUser(response.data.user);
          }
        } catch {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f5f7fa',
        color: '#1e293b',
        fontSize: '1.5rem'
      }}>
        Loading...
      </div>
    );
  }

  return (
    // ✅ Google Provider ADDED HERE
      <Router>
        <AppContent 
          isAuthenticated={isAuthenticated}
          setIsAuthenticated={setIsAuthenticated}
          user={user}
          setUser={setUser}
        />
      </Router>
  );
}

function AppContent({ isAuthenticated, setIsAuthenticated, user, setUser }) {
  return (
    <div className="App">
      <ConditionalNavigation 
        isAuthenticated={isAuthenticated} 
        setIsAuthenticated={setIsAuthenticated}
        setUser={setUser}
      />

      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login setIsAuthenticated={setIsAuthenticated} setUser={setUser} />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register setIsAuthenticated={setIsAuthenticated} setUser={setUser} />} 
        />
        <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/dashboard" /> : <ForgotPassword />} />
        <Route path="/reset-password/:token" element={isAuthenticated ? <Navigate to="/dashboard" /> : <ResetPassword />} />

        <Route 
          path="/dashboard" 
          element={<PrivateRoute isAuthenticated={isAuthenticated}><Dashboard user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} /></PrivateRoute>} 
        />
        <Route 
          path="/report-issue" 
          element={<PrivateRoute isAuthenticated={isAuthenticated}><ErrorBoundary><ComplaintForm user={user} /></ErrorBoundary></PrivateRoute>} 
        />
        <Route 
          path="/view-complaints" 
          element={<PrivateRoute isAuthenticated={isAuthenticated}><ComplaintList user={user} /></PrivateRoute>} 
        />
        <Route 
          path="/complaint/:id" 
          element={<PrivateRoute isAuthenticated={isAuthenticated}><ComplaintDetail user={user} /></PrivateRoute>} 
        />
        <Route 
          path="/admin" 
          element={<PrivateRoute isAuthenticated={isAuthenticated}><AdminDashboard user={user} /></PrivateRoute>} 
        />
        <Route 
          path="/issues-map" 
          element={<PrivateRoute isAuthenticated={isAuthenticated}><IssuesMap user={user} /></PrivateRoute>} 
        />
        <Route 
          path="/profile" 
          element={<PrivateRoute isAuthenticated={isAuthenticated}><Profile user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} /></PrivateRoute>} 
        />
        <Route 
          path="/about" 
          element={<PrivateRoute isAuthenticated={isAuthenticated}><About /></PrivateRoute>} 
        />

        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </div>
  );
}

export default App;

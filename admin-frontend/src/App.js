import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Admin Components
import AdminLogin from './components/Admin/AdminLogin';
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminComplaints from './components/Admin/AdminComplaints';
import AdminComplaintDetail from './components/Admin/AdminComplaintDetail';
import AdminVolunteers from './components/Admin/AdminVolunteers';
import AdminUsers from './components/Admin/AdminUsers';
import AdminSettings from './components/Admin/AdminSettings';
import AdminForgotPassword from './components/Admin/AdminForgotPassword';
import AdminResetPassword from './components/Admin/AdminResetPassword';

// Volunteer Components
import VolunteerRegister from './components/Volunteer/VolunteerRegister';
import VolunteerLogin from './components/Volunteer/VolunteerLogin';
import VolunteerDashboard from './components/Volunteer/VolunteerDashboard';
import VolunteerComplaints from './components/Volunteer/VolunteerComplaints';
import VolunteerProfile from './components/Volunteer/VolunteerProfile';
import VolunteerForgotPassword from './components/Volunteer/VolunteerForgotPassword';
import VolunteerResetPassword from './components/Volunteer/VolunteerResetPassword';

import { getAdminToken, getVolunteerToken } from './services/adminApi';
import './App.css';

function App() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isVolunteerAuthenticated, setIsVolunteerAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [volunteerUser, setVolunteerUser] = useState(null);

 useEffect(() => {
  try {
    // Check admin login
    const adminToken = getAdminToken();
    if (adminToken) {
      setIsAdminAuthenticated(true);

      const storedAdmin = localStorage.getItem("adminUser");
      if (storedAdmin && storedAdmin !== "undefined") {
        setAdminUser(JSON.parse(storedAdmin));
      }
    }

    // Check volunteer login
    const volunteerToken = getVolunteerToken();
    if (volunteerToken) {
      setIsVolunteerAuthenticated(true);

      const storedVolunteer = localStorage.getItem("volunteer");
      if (storedVolunteer && storedVolunteer !== "undefined") {
        setVolunteerUser(JSON.parse(storedVolunteer));
      }
    }

  } catch (error) {
    console.error("LocalStorage parsing error:", error);

    localStorage.removeItem("adminUser");
    localStorage.removeItem("volunteer");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("volunteer_token");
  }
}, []);

  return (
    <Router>
      <div className="App">
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />

        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<Navigate to="/admin/login" />} />

          {/* Admin Routes */}
          <Route 
            path="/admin/login" 
            element={
              isAdminAuthenticated ? 
              <Navigate to="/admin/dashboard" /> : 
              <AdminLogin setIsAuthenticated={setIsAdminAuthenticated} setUser={setAdminUser} />
            } 
          />
          <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
          <Route path="/admin/reset-password/:token" element={<AdminResetPassword />} />

          <Route 
            path="/admin/dashboard" 
            element={
              isAdminAuthenticated ? 
              <AdminDashboard user={adminUser} setIsAuthenticated={setIsAdminAuthenticated} setUser={setAdminUser} /> : 
              <Navigate to="/admin/login" />
            } 
          />
          <Route 
            path="/admin/complaints" 
            element={
              isAdminAuthenticated ? 
              <AdminComplaints user={adminUser} setIsAuthenticated={setIsAdminAuthenticated} setUser={setAdminUser} /> : 
              <Navigate to="/admin/login" />
            } 
          />
          <Route 
            path="/admin/complaint/:id" 
            element={
              isAdminAuthenticated ? 
              <AdminComplaintDetail user={adminUser} setIsAuthenticated={setIsAdminAuthenticated} setUser={setAdminUser} /> : 
              <Navigate to="/admin/login" />
            } 
          />
          <Route 
            path="/admin/volunteers" 
            element={
              isAdminAuthenticated ? 
              <AdminVolunteers user={adminUser} setIsAuthenticated={setIsAdminAuthenticated} setUser={setAdminUser} /> : 
              <Navigate to="/admin/login" />
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              isAdminAuthenticated ? 
              <AdminUsers user={adminUser} setIsAuthenticated={setIsAdminAuthenticated} setUser={setAdminUser} /> : 
              <Navigate to="/admin/login" />
            } 
          />
          <Route 
            path="/admin/settings" 
            element={
              isAdminAuthenticated ? 
              <AdminSettings user={adminUser} setIsAuthenticated={setIsAdminAuthenticated} setUser={setAdminUser} /> : 
              <Navigate to="/admin/login" />
            } 
          />

          {/* Volunteer Routes */}
          <Route path="/volunteer/register" element={<VolunteerRegister />} />
          <Route 
            path="/volunteer/login" 
            element={
              isVolunteerAuthenticated ? 
              <Navigate to="/volunteer/dashboard" /> : 
              <VolunteerLogin setIsAuthenticated={setIsVolunteerAuthenticated} setUser={setVolunteerUser} />
            } 
          />
          <Route path="/volunteer/forgot-password" element={<VolunteerForgotPassword />} />
          <Route path="/volunteer/reset-password/:token" element={<VolunteerResetPassword />} />

          <Route 
            path="/volunteer/dashboard" 
            element={
              isVolunteerAuthenticated ? 
              <VolunteerDashboard user={volunteerUser} setIsAuthenticated={setIsVolunteerAuthenticated} setUser={setVolunteerUser} /> : 
              <Navigate to="/volunteer/login" />
            } 
          />
          <Route 
            path="/volunteer/complaints" 
            element={
              isVolunteerAuthenticated ? 
              <VolunteerComplaints user={volunteerUser} setIsAuthenticated={setIsVolunteerAuthenticated} setUser={setVolunteerUser} /> : 
              <Navigate to="/volunteer/login" />
            } 
          />
          <Route 
            path="/volunteer/profile" 
            element={
              isVolunteerAuthenticated ? 
              <VolunteerProfile user={volunteerUser} setIsAuthenticated={setIsVolunteerAuthenticated} setUser={setVolunteerUser} /> : 
              <Navigate to="/volunteer/login" />
            } 
          />

          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/admin/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

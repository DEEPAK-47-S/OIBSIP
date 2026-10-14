import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login.jsx';
import AdminLogin from './AdminLogin.jsx';
import UserDashboard from './UserDashboard.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import './index.css';

function App() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  return (
    <Router>
      <Routes>
        <Route path="/" element={token ? (role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />) : <Login />} />
        <Route path="/admin-login" element={token ? <Navigate to="/admin" /> : <AdminLogin />} />
        <Route path="/dashboard" element={token && role === 'user' ? <UserDashboard /> : <Navigate to="/" />} />
        <Route path="/admin" element={token && role === 'admin' ? <AdminDashboard /> : <Navigate to="/admin-login" />} />
      </Routes>
    </Router>
  );
}
export default App;

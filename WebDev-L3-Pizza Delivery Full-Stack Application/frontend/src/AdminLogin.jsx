import React, { useState } from 'react';
import axios from 'axios';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      if (res.data.role !== 'admin') {
        setMessage('Access denied. You are not an admin.');
        return;
      }
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      window.location.href = '/admin';
    } catch (err) {
      setMessage(err.response?.data?.msg || 'An error occurred. Is your MongoDB running?');
    }
  };

  return (
    <div className="auth-container" style={{ borderTop: '5px solid #10b981'}}>
      <h2>Admin Login</h2>
      {message && <p className="msg" style={{color:'red'}}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Admin Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit" style={{background: '#10b981'}}>Secure Admin Login</button>
      </form>
      <button className="link-btn" onClick={() => window.location.href='/'}>Back to User Login</button>
    </div>
  );
}

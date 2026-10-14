import React, { useState } from 'react';
import axios from 'axios';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isForgot, setIsForgot] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isForgot) {
        const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
        setMessage(res.data.msg);
        setIsForgot(false);
        return;
      }

      if (isLogin) {
        const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.role);
        window.location.href = res.data.role === 'admin' ? '/admin' : '/dashboard';
      } else {
        const res = await axios.post('http://localhost:5000/api/auth/register', { email, password });
        setMessage(res.data.msg);
        setIsLogin(true);
      }
    } catch (err) {
      setMessage(err.response?.data?.msg || 'An error occurred. Is your MongoDB running locally?');
    }
  };

  return (
    <div className="auth-container">
      <h2>{isForgot ? 'Forgot Password' : (isLogin ? 'User Login' : 'Register')}</h2>
      {message && <p className="msg" style={{color:'red'}}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        {!isForgot && <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />}
        <button type="submit">{isForgot ? 'Send Reset Link' : (isLogin ? 'Login' : 'Register')}</button>
      </form>
      
      {!isForgot && (
        <>
          <button className="link-btn" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
          <button className="link-btn" onClick={() => setIsForgot(true)}>Forgot Password?</button>
        </>
      )}
      {isForgot && <button className="link-btn" onClick={() => setIsForgot(false)}>Back to Login</button>}
      
      <p style={{marginTop: '20px', fontSize: '0.8rem', borderTop: '1px solid #ddd', paddingTop: '10px'}}>
        <a href="/admin-login" style={{color: '#6b7280'}}>Admin Login Portal</a>
      </p>
    </div>
  );
}

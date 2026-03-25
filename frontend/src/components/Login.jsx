import React, { useState } from 'react';
import axios from 'axios';
import { Zap } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post((import.meta.env.VITE_API_URL || "http://localhost:3000") + '/api/auth/login', { email, password });
      onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login gagal. Cek email & password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box glass-card animate-in">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Zap size={20} color="white" fill="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '18px' }}>EMS WorkSpace</span>
        </div>

        <h1 className="auth-title">Welcome Back! 👋</h1>
        <p className="auth-subtitle">Masuk ke akun kamu dan mulai hari ini</p>

        {error && (
          <div style={{
            background: 'rgba(255,107,107,0.1)',
            border: '1px solid rgba(255,107,107,0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#ff6b6b',
            fontSize: '13px',
            marginBottom: '20px',
            fontWeight: 500
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="kamu@ems.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '24px' }}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Masuk...' : '🚀 Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          padding: '16px',
          borderRadius: '14px',
          background: 'rgba(124,58,237,0.08)',
          border: '1px solid rgba(124,58,237,0.2)',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Demo Accounts
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-soft)', lineHeight: '1.8' }}>
            Admin: <span style={{ color: '#a78bfa', fontWeight: 600 }}>admin@ems.com</span> / admin123<br />
            Employee: <span style={{ color: '#a78bfa', fontWeight: 600 }}>employee@ems.com</span> / emp123
          </p>
        </div>
      </div>
    </div>
  );
}

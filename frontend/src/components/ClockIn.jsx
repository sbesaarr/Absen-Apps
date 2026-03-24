import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, Home, Calendar, CreditCard, User, MapPin, Coffee, CheckCircle } from 'lucide-react';
import axios from 'axios';
import Leave from './Leave';
import Payroll from './Payroll';
import Profile from './Profile';

export default function ClockIn({ user, onLogout }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [time, setTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('home');
  const [record, setRecord] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [activeLeaves, setActiveLeaves] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/attendance/status/${user.id}`);
      setRecord(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setStatusLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchStatus();
    fetchUserLeaves();
  }, [fetchStatus]);

  const fetchUserLeaves = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/leave/${user.id}`);
      const dismissed = JSON.parse(localStorage.getItem('dismissedLeaves') || '[]');
      setActiveLeaves(res.data.filter(l => !dismissed.includes(l.id)));
    } catch (err) { }
  };

  const dismissLeave = (leaveId) => {
    const dismissed = JSON.parse(localStorage.getItem('dismissedLeaves') || '[]');
    dismissed.push(leaveId);
    localStorage.setItem('dismissedLeaves', JSON.stringify(dismissed));
    setActiveLeaves(prev => prev.filter(l => l.id !== leaveId));
  };

  const handleAction = async (type) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (type === 'clock-in') {
        if (!navigator.geolocation) {
          throw new Error('Geolocation is not supported by your browser');
        }
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const res = await axios.post((import.meta.env.VITE_API_URL || "http://localhost:3000") + '/api/attendance/clock-in', {
                userId: user.id,
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
              setSuccess(res.data.message);
              fetchStatus();
            } catch (err) {
              setError(err.response?.data?.error || 'Failed to clock in');
            } finally {
              setLoading(false);
            }
          },
          (err) => {
            setError('Unable to retrieve your location');
            setLoading(false);
          }
        );
        return; // Early return because async callback
      }

      // Other actions
      let url = '';
      if (type === 'break-start') url = '/api/attendance/break-start';
      if (type === 'break-end') url = '/api/attendance/break-end';
      if (type === 'clock-out') url = '/api/attendance/clock-out';

      const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}${url}`, { recordId: record.id, userId: user.id });
      setSuccess(res.data.message);
      fetchStatus();
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed');
    } finally {
      if (type !== 'clock-in') setLoading(false);
    }
  };

  const renderActionButtons = () => {
    if (statusLoading) return <h2 style={{ color: 'var(--text-muted)' }}>Loading...</h2>;

    if (!record || !record.clockedIn) {
      return (
        <button 
          className="clock-btn" 
          onClick={() => handleAction('clock-in')} 
          disabled={loading || success}
        >
          {loading ? <h2>...</h2> : <><h2>Clock In</h2><p>Start Shift</p></>}
        </button>
      );
    }

    if (record.clock_out) {
      return (
        <div style={{ textAlign: 'center', color: 'var(--success)' }}>
          <CheckCircle size={64} style={{ margin: '0 auto 16px' }} />
          <h2>Shift Completed!</h2>
          <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>Clocked out: {new Date(record.clock_out).toLocaleTimeString()}</p>
        </div>
      );
    }

    if (!record.break_start) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button 
            className="clock-btn" 
            style={{ width: '220px', height: '220px', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }} 
            onClick={() => handleAction('break-start')} 
            disabled={loading}
          >
            {loading ? <h2>...</h2> : <><h2>Start Break</h2><p>Take a break</p></>}
          </button>
        </div>
      );
    }

    if (record.break_start && !record.break_end) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button 
            className="clock-btn" 
            style={{ width: '220px', height: '220px', background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.4)' }} 
            onClick={() => handleAction('break-end')} 
            disabled={loading}
          >
            {loading ? <h2>...</h2> : <><h2>End Break</h2><p>Back to work</p></>}
          </button>
        </div>
      );
    }

    if (record.break_end && !record.clock_out) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <button 
            className="clock-btn" 
            style={{ width: '220px', height: '220px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)' }} 
            onClick={() => handleAction('clock-out')} 
            disabled={loading}
          >
            {loading ? <h2>...</h2> : <><h2>Clock Out</h2><p>End Shift</p></>}
          </button>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Break ended at {new Date(record.break_end).toLocaleTimeString()}</p>
        </div>
      );
    }
  };

  return (
    <div className="mobile-view">
      <div className="mobile-header">
        <div className="user-profile">
          <div className="avatar">
            {user.full_name.charAt(0)}
          </div>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Welcome back,</p>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{user.full_name}</h3>
          </div>
        </div>
        <button onClick={onLogout} style={{ background: 'none', border:'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <LogOut size={20} />
        </button>
      </div>

      {activeTab === 'home' && (
        <>
          {activeLeaves.length > 0 && (
            <div style={{ padding: '24px 24px 0 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeLeaves.map(l => (
                <div key={l.id} className="glass-card" style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${l.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.3)' : l.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.3)' : 'var(--border)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 'bold' }}>Leave Request</h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`badge ${l.status === 'APPROVED' ? 'on-time' : l.status === 'REJECTED' ? 'absent' : 'late'}`} style={{ fontSize: '11px' }}>{l.status}</span>
                  </div>
                  {l.status !== 'PENDING' && (
                    <button onClick={() => dismissLeave(l.id)} style={{ marginTop: '12px', background: 'var(--bg-secondary)', border: 'none', padding: '6px 12px', borderRadius: '6px', color: 'var(--text)', fontSize: '13px', cursor: 'pointer', width: '100%', fontWeight: '500' }}>
                      Close Notification
                    </button>
                  )}
                  {l.status === 'PENDING' && (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center' }}>Awaiting Manager Approval</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="clock-pulse-container">
            <div style={{ position: 'absolute', top: '20px', textAlign: 'center' }}>
              <h1 style={{ fontSize: '48px', fontWeight: '700', letterSpacing: '-1px' }}>
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </h1>
              <p style={{ color: 'var(--text-muted)' }}>
                {time.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '60px' }}>
               {renderActionButtons()}
            </div>

            {error && <p style={{ color: 'var(--danger)', marginTop: '24px', textAlign: 'center' }}>{error}</p>}
            {success && <p style={{ color: 'var(--success)', marginTop: '24px', textAlign: 'center' }}>{success}</p>}
          </div>

          <div className="glass-card" style={{ margin: '24px', padding: '20px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-muted)' }}>Today's History</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Clock In</span>
                <span style={{ fontWeight: '600', fontSize: '14px', color: record?.clock_in ? 'var(--text)' : 'var(--text-muted)' }}>{record?.clock_in ? new Date(record.clock_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border)' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Break Start</span>
                <span style={{ fontWeight: '600', fontSize: '14px', color: record?.break_start ? 'var(--text)' : 'var(--text-muted)' }}>{record?.break_start ? new Date(record.break_start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border)' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Break End</span>
                <span style={{ fontWeight: '600', fontSize: '14px', color: record?.break_end ? 'var(--text)' : 'var(--text-muted)' }}>{record?.break_end ? new Date(record.break_end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border)' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Clock Out</span>
                <span style={{ fontWeight: '600', fontSize: '14px', color: record?.clock_out ? 'var(--text)' : 'var(--text-muted)' }}>{record?.clock_out ? new Date(record.clock_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'leave' && <Leave user={user} />}
      {activeTab === 'payroll' && <Payroll user={user} />}
      {activeTab === 'profile' && <Profile user={user} onLogout={onLogout} />}

      <div className="bottom-nav">
        <div className={`bottom-nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')} style={{ cursor: 'pointer' }}><Home size={24} /><span>Home</span></div>
        <div className={`bottom-nav-item ${activeTab === 'leave' ? 'active' : ''}`} onClick={() => setActiveTab('leave')} style={{ cursor: 'pointer' }}><Calendar size={24} /><span>Leave</span></div>
        <div className={`bottom-nav-item ${activeTab === 'payroll' ? 'active' : ''}`} onClick={() => setActiveTab('payroll')} style={{ cursor: 'pointer' }}><CreditCard size={24} /><span>Payroll</span></div>
        <div className={`bottom-nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')} style={{ cursor: 'pointer' }}><User size={24} /><span>Profile</span></div>
      </div>
    </div>
  );
}

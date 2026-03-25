import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, Home, Calendar, CreditCard, User, CheckCircle, Zap, Coffee, Clock } from 'lucide-react';
import axios from 'axios';
import Leave from './Leave';
import Payroll from './Payroll';
import Profile from './Profile';

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

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
      const res = await axios.get(`${API}/api/attendance/status/${user.id}`);
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
      const res = await axios.get(`${API}/api/leave/${user.id}`);
      const dismissed = JSON.parse(localStorage.getItem('dismissedLeaves') || '[]');
      setActiveLeaves(res.data.filter(l => !dismissed.includes(l.id)));
    } catch (err) {}
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
          throw new Error('Geolocation tidak didukung browser ini');
        }
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const res = await axios.post(`${API}/api/attendance/clock-in`, {
                userId: user.id,
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
              setSuccess(res.data.message);
              fetchStatus();
            } catch (err) {
              setError(err.response?.data?.error || 'Gagal clock in');
            } finally {
              setLoading(false);
            }
          },
          () => {
            setError('Tidak bisa mengambil lokasi kamu');
            setLoading(false);
          }
        );
        return;
      }

      let url = '';
      if (type === 'break-start') url = '/api/attendance/break-start';
      if (type === 'break-end')   url = '/api/attendance/break-end';
      if (type === 'clock-out')   url = '/api/attendance/clock-out';

      const res = await axios.post(`${API}${url}`, { recordId: record?.id, userId: user.id });
      setSuccess(res.data.message);
      fetchStatus();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal melakukan aksi');
    } finally {
      if (type !== 'clock-in') setLoading(false);
    }
  };

  // ── Clock button configs per state
  const getClockConfig = () => {
    if (statusLoading) return null;
    if (!record || !record.clockedIn) {
      return {
        label: 'Clock In',
        sub: 'Mulai Shift ✨',
        gradient: 'var(--grad-primary)',
        shadowColor: 'rgba(255,45,120,0.5)',
        pulse: '0 0 0 0 rgba(255,45,120,0.4)',
        action: 'clock-in',
        ringColors: '#ff2d78, #7c3aed, #06caf4, #ff2d78',
      };
    }
    if (record.clock_out) return null; // show completed UI
    if (!record.break_start) {
      return {
        label: 'Break',
        sub: 'Istirahat dulu ☕',
        gradient: 'var(--grad-warm)',
        shadowColor: 'rgba(251,191,36,0.5)',
        pulse: '0 0 0 0 rgba(251,191,36,0.4)',
        action: 'break-start',
        ringColors: '#fbbf24, #ff6b6b, #fbbf24',
      };
    }
    if (record.break_start && !record.break_end) {
      return {
        label: 'End Break',
        sub: 'Balik kerja 💪',
        gradient: 'var(--grad-green)',
        shadowColor: 'rgba(163,230,53,0.4)',
        pulse: '0 0 0 0 rgba(163,230,53,0.4)',
        action: 'break-end',
        ringColors: '#a3e635, #06caf4, #a3e635',
      };
    }
    if (record.break_end && !record.clock_out) {
      return {
        label: 'Clock Out',
        sub: 'Selesai shift 🎉',
        gradient: 'var(--grad-danger)',
        shadowColor: 'rgba(255,45,120,0.5)',
        pulse: '0 0 0 0 rgba(255,107,107,0.4)',
        action: 'clock-out',
        ringColors: '#ff6b6b, #ff2d78, #ff6b6b',
      };
    }
    return null;
  };

  const config = getClockConfig();

  const fmt = (iso) => iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

  const historyRows = [
    { label: 'Clock In',    icon: <Zap size={14} />,    value: fmt(record?.clock_in) },
    { label: 'Break Start', icon: <Coffee size={14} />,  value: fmt(record?.break_start) },
    { label: 'Break End',   icon: <Coffee size={14} />,  value: fmt(record?.break_end) },
    { label: 'Clock Out',   icon: <Clock size={14} />,   value: fmt(record?.clock_out) },
  ];

  return (
    <div className="mobile-view">
      {/* Header */}
      <div className="mobile-header">
        <div className="user-profile">
          <div className="avatar">{user.full_name.charAt(0)}</div>
          <div className="user-info">
            <p>Welcome back,</p>
            <h3>{user.full_name}</h3>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout} title="Logout">
          <LogOut size={17} />
        </button>
      </div>

      {activeTab === 'home' && (
        <>
          {/* Leave notifications */}
          {activeLeaves.length > 0 && activeLeaves.map(l => (
            <div key={l.id} className="leave-notif animate-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '14px' }}>Leave Request 📋</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {new Date(l.start_date).toLocaleDateString('id-ID')} – {new Date(l.end_date).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <span className={`badge ${l.status === 'APPROVED' ? 'approved' : l.status === 'REJECTED' ? 'rejected' : 'pending'}`}>
                  {l.status}
                </span>
              </div>
              {l.status !== 'PENDING' && (
                <button onClick={() => dismissLeave(l.id)} className="btn-secondary" style={{ width:'100%', marginTop:'10px', fontSize:'12px' }}>
                  Tutup Notifikasi
                </button>
              )}
              {l.status === 'PENDING' && (
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign:'center' }}>
                  ⏳ Menunggu persetujuan manager
                </p>
              )}
            </div>
          ))}

          {/* Time */}
          <div className="time-display">
            <div className="time">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="date">{time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>

          {/* Clock button */}
          <div className="clock-pulse-container">
            {statusLoading ? (
              <div style={{ textAlign:'center', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ width:32, height:32, margin:'0 auto 8px' }} />
                <p style={{ fontSize:'13px' }}>Loading...</p>
              </div>
            ) : record?.clock_out ? (
              <div style={{ textAlign:'center', animation:'fadeIn 0.5s ease' }}>
                <div style={{
                  width:130, height:130, borderRadius:'50%',
                  background:'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(6,202,244,0.15))',
                  border:'2px solid rgba(52,211,153,0.4)',
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  margin:'0 auto 16px', boxShadow:'0 0 40px rgba(52,211,153,0.2)'
                }}>
                  <CheckCircle size={44} color="#34d399" />
                </div>
                <h2 style={{ fontSize:'20px', fontWeight:800, color:'#34d399' }}>Shift Selesai! 🎉</h2>
                <p style={{ marginTop:'6px', color:'var(--text-muted)', fontSize:'13px' }}>
                  Clock out: {fmt(record.clock_out)}
                </p>
              </div>
            ) : config ? (
              <div className="clock-ring" style={{ '--ring-colors': config.ringColors }}>
                <style>{`.clock-ring::before { background: conic-gradient(${config.ringColors}); }`}</style>
                <button
                  className="clock-btn"
                  style={{
                    background: config.gradient,
                    boxShadow: `0 8px 32px ${config.shadowColor}`,
                    animation: `clockPulse 2.5s infinite`,
                  }}
                  onClick={() => handleAction(config.action)}
                  disabled={loading || !!success}
                >
                  {loading
                    ? <span className="spinner" />
                    : <>
                        <h2>{config.label}</h2>
                        <p>{config.sub}</p>
                      </>
                  }
                </button>
              </div>
            ) : null}

            {error   && <p style={{ color:'var(--danger)',  marginTop:'20px', textAlign:'center', fontSize:'13px', fontWeight:600 }}>⚠️ {error}</p>}
            {success && <p style={{ color:'var(--success)', marginTop:'20px', textAlign:'center', fontSize:'13px', fontWeight:600 }}>✅ {success}</p>}
          </div>

          {/* History card */}
          <div className="history-card">
            <h3>Today's Activity</h3>
            {historyRows.map((row, i) => (
              <div key={i} className="history-row">
                <div className="history-label">
                  <div className={`history-dot ${row.value ? 'filled' : ''}`} />
                  {row.icon}
                  {row.label}
                </div>
                <span className={row.value ? 'history-value' : 'history-value empty'}>
                  {row.value || '—'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'leave'   && <Leave   user={user} />}
      {activeTab === 'payroll' && <Payroll user={user} />}
      {activeTab === 'profile' && <Profile user={user} onLogout={onLogout} />}

      {/* Bottom Nav */}
      <div className="bottom-nav">
        {[
          { key:'home',    label:'Home',    icon:<Home    size={22} /> },
          { key:'leave',   label:'Leave',   icon:<Calendar size={22} /> },
          { key:'payroll', label:'Payroll', icon:<CreditCard size={22} /> },
          { key:'profile', label:'Profile', icon:<User   size={22} /> },
        ].map(item => (
          <div
            key={item.key}
            className={`bottom-nav-item ${activeTab === item.key ? 'active' : ''}`}
            onClick={() => setActiveTab(item.key)}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

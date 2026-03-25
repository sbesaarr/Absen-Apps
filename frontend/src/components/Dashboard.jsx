import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Clock, AlertCircle, CheckCircle, LogOut, LayoutDashboard, CalendarDays, Calendar as CalIcon, Menu, X } from 'lucide-react';
import AdminAttendance from './AdminAttendance';
import AdminLeave from './AdminLeave';
import AdminEmployees from './AdminEmployees';
import AdminHolidays from './AdminHolidays';
import AdminCalendar from './AdminCalendar';

export default function Dashboard({ user, onLogout }) {
  const [attendances, setAttendances] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchAttendances();
    }
  }, [activeTab]);

  const fetchAttendances = async () => {
    try {
      const res = await axios.get((import.meta.env.VITE_API_URL || "http://localhost:3000") + '/api/attendance/today');
      setAttendances(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const onTimeCount = attendances.filter(a => a.status === 'ON_TIME').length;
  const lateCount = attendances.filter(a => a.status === 'LATE').length;

  return (
    <div className="app-container">
      {/* Sidebar Overflow Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">⚡</div>
            <span>EMS WorkSpace</span>
          </div>
          <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="sidebar-nav">
          {[
            { key: 'overview',   icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
            { key: 'calendar',   icon: <CalIcon size={18} />,         label: 'Calendar' },
            { key: 'attendance', icon: <Clock size={18} />,           label: 'Attendance' },
            { key: 'leave',      icon: <AlertCircle size={18} />,     label: 'Leave Requests' },
            { key: 'employees',  icon: <Users size={18} />,           label: 'Employees' },
            { key: 'holidays',   icon: <CalendarDays size={18} />,    label: 'Holidays' },
          ].map(item => (
            <a
              key={item.key}
              href="#"
              className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleTabChange(item.key); }}
            >
              {item.icon} {item.label}
            </a>
          ))}
        </div>
        <div className="sidebar-footer">
          <div className="nav-item" onClick={onLogout} style={{ cursor: 'pointer', color: 'var(--danger)' }}>
            <LogOut size={18} /> Logout
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="mobile-header-toggle">
          <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <span className="mobile-header-title">EMS WorkSpace</span>
        </div>
        {activeTab === 'overview' && (
          <>
            <div className="dashboard-header">
              <div>
                <h1 className="dashboard-title">Overview</h1>
                <p style={{ color: 'var(--text-muted)' }}>Welcome back, {user.full_name}</p>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon blue"><Users size={28} /></div>
                <div className="stat-info">
                  <h3>Total Present</h3>
                  <p>{attendances.length}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green"><CheckCircle size={28} /></div>
                <div className="stat-info">
                  <h3>On Time</h3>
                  <p>{onTimeCount}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon orange"><AlertCircle size={28} /></div>
                <div className="stat-info">
                  <h3>Late</h3>
                  <p>{lateCount}</p>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Today's Attendance</h2>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Role</th>
                      <th>Clock In Time</th>
                      <th>Kehadiran</th>
                      <th>Aktivitas Terakhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendances.map(a => (
                      <tr key={a.id}>
                        <td>
                          <div style={{ fontWeight: '500' }}>{a.full_name}</div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{a.role}</td>
                        <td>{new Date(a.clock_in).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                        <td>
                          <span className={`badge ${a.status === 'LATE' ? 'late' : 'on-time'}`}>
                            {a.status === 'LATE' ? 'LATE' : 'ON TIME'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--primary)' }}>
                            {a.clock_out ? `Selesai (${new Date(a.clock_out).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})})` :
                             a.break_end ? `Kembali Kerja (${new Date(a.break_end).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})})` :
                             a.break_start ? `Istirahat (${new Date(a.break_start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})})` :
                             `Bekerja (${new Date(a.clock_in).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})})`}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {attendances.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                          No attendance records yet today.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        
        {activeTab === 'calendar' && <AdminCalendar />}
        {activeTab === 'attendance' && <AdminAttendance />}
        {activeTab === 'leave' && <AdminLeave user={user} />}
        {activeTab === 'employees' && <AdminEmployees />}
        {activeTab === 'holidays' && <AdminHolidays />}
        
      </div>
    </div>
  );
}

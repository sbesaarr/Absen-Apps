import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Check, X } from 'lucide-react';

export default function AdminLeave({ user }) {
  const [leaves, setLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/admin/leaves');
      setLeaves(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await axios.post(`http://localhost:3000/api/admin/leave/${id}/status`, { status });
      fetchLeaves();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Leave Requests</h1>
           <p style={{ color: 'var(--text-muted)' }}>{user?.role === 'MANAGER' ? 'Manage and approve employee leave applications' : 'View employee leave applications (Manager approval required)'}</p>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Type</th>
              <th>Duration</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map(l => (
              <tr key={l.id} onClick={() => setSelectedLeave(l)} style={{ cursor: 'pointer' }} className="hover-row">
                <td style={{ fontWeight: '500' }}>{l.full_name}</td>
                 <td>{l.leave_type}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                  {new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}
                </td>
                <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.reason}</td>
                <td>
                   <span className={`badge ${l.status === 'APPROVED' ? 'on-time' : l.status === 'REJECTED' ? 'absent' : 'late'}`}>{l.status}</span>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  {l.status === 'PENDING' && user?.role === 'MANAGER' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={(e) => { e.stopPropagation(); handleStatus(l.id, 'APPROVED'); }} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}><Check size={16}/></button>
                      <button onClick={(e) => { e.stopPropagation(); handleStatus(l.id, 'REJECTED'); }} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}><X size={16}/></button>
                    </div>
                  )}
                  {l.status === 'PENDING' && user?.role !== 'MANAGER' && (
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Awaiting Manager</span>
                  )}
                </td>
              </tr>
            ))}
            {leaves.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>No leave requests found.</td></tr>}
          </tbody>
        </table>
      </div>

      {selectedLeave && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }} onClick={() => setSelectedLeave(null)}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '24px', position: 'relative', background: 'var(--bg-card)' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedLeave(null)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Leave Request Details</h2>
            <div style={{ height: '1px', background: 'var(--border)', marginBottom: '16px' }}></div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee Name</span>
                <p style={{ fontWeight: '500', fontSize: '16px', marginTop: '4px' }}>{selectedLeave.full_name}</p>
              </div>
              
              <div style={{ display: 'flex', gap: '24px' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Leave Type</span>
                  <p style={{ fontWeight: '500', marginTop: '4px' }}>{selectedLeave.leave_type}</p>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</span>
                  <div style={{ marginTop: '4px' }}>
                    <span className={`badge ${selectedLeave.status === 'APPROVED' ? 'on-time' : selectedLeave.status === 'REJECTED' ? 'absent' : 'late'}`}>
                      {selectedLeave.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Duration</span>
                <p style={{ fontWeight: '500', marginTop: '4px' }}>
                  {new Date(selectedLeave.start_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  {' - '}
                  {new Date(selectedLeave.end_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reason & Urgent Work Details</span>
                <p style={{ marginTop: '8px', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: 'var(--text)' }}>
                  {selectedLeave.reason}
                </p>
              </div>

              {selectedLeave.status === 'PENDING' && user?.role === 'MANAGER' && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button onClick={() => { handleStatus(selectedLeave.id, 'APPROVED'); setSelectedLeave(null); }} className="btn-primary" style={{ flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}>
                    Approve Leave
                  </button>
                  <button onClick={() => { handleStatus(selectedLeave.id, 'REJECTED'); setSelectedLeave(null); }} className="btn-primary" style={{ flex: 1, background: 'linear-gradient(135deg, #ef4444, #b91c1c)', border: 'none' }}>
                    Reject Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

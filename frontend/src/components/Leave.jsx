import React, { useState } from 'react';
import { Calendar, FileText, Send } from 'lucide-react';
import axios from 'axios';

export default function Leave({ user }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [urgentWork, setUrgentWork] = useState('');
  const [status, setStatus] = useState(null);
  const [leaves, setLeaves] = useState([]);

  React.useEffect(() => {
    fetchLeaves();
  }, [user.id]);

  const fetchLeaves = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/leave/${user.id}`);
      setLeaves(res.data);
    } catch(err) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const finalReason = urgentWork.trim() ? `${reason} | Urgent Work: ${urgentWork}` : reason;
      
      await axios.post((import.meta.env.VITE_API_URL || "http://localhost:3000") + '/api/leave', {
        userId: user.id, 
        startDate, 
        endDate, 
        leaveType: 'ANNUAL', 
        reason: finalReason
      });
      setStatus('success');
      setStartDate(''); setEndDate(''); setReason(''); setUrgentWork('');
      fetchLeaves();
      setTimeout(() => setStatus(null), 3000);
    } catch {
      setStatus('error');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Calendar size={20} color="white" />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Leave Request</h2>
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        {status === 'success' && <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>Leave request submitted successfully!</div>}
        {status === 'error' && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>Failed to submit request.</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">Leave Type</label>
            <input type="text" disabled className="input-field" value="Annual Leave" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }} />
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
             <div style={{ flex: 1 }}>
               <label className="form-label">Start Date</label>
               <input type="date" required className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} />
             </div>
             <div style={{ flex: 1 }}>
               <label className="form-label">End Date</label>
               <input type="date" required className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} />
             </div>
          </div>
          
          <div>
            <label className="form-label">Reason for Leave</label>
            <textarea required className="input-field" rows="3" value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain briefly..."></textarea>
          </div>
          
          <div>
            <label className="form-label">Any urgent work pending?</label>
            <input type="text" className="input-field" value={urgentWork} onChange={e => setUrgentWork(e.target.value)} placeholder="e.g., No / Yes, Handed over to John..." />
          </div>
          
          <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
            <Send size={18} /> Submit Request
          </button>
        </form>
      </div>

      <div style={{ marginTop: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-muted)' }}>Recent Requests</h3>
        
        {leaves.length === 0 ? (
           <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>No recent requests found.</p>
        ) : leaves.map(l => (
          <div key={l.id} className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
             <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '12px', borderRadius: '12px' }}>
                <FileText size={20} />
             </div>
             <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '15px' }}>{l.leave_type === 'ANNUAL' ? 'Annual Leave' : l.leave_type}</h4>
                 <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}</p>
             </div>
             <span className={`badge ${l.status === 'APPROVED' ? 'on-time' : l.status === 'REJECTED' ? 'absent' : 'late'}`} style={{ fontSize: '11px' }}>{l.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

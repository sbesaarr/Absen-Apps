import React from 'react';
import { Mail, Briefcase, LogOut } from 'lucide-react';

export default function Profile({ user, onLogout }) {
  return (
    <div style={{ padding: '24px', paddingBottom: '90px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px', marginTop: '16px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '32px', fontWeight: 'bold' }}>
          {user.full_name.charAt(0)}
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>{user.full_name}</h2>
        <p style={{ color: 'var(--text-muted)' }}>{user.role}</p>
      </div>

      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '12px' }}><Mail size={20} color="var(--primary)" /></div>
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Email</p>
            <p style={{ fontWeight: '500' }}>{user.email}</p>
          </div>
        </div>
        <div style={{ height: '1px', background: 'var(--border)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '12px' }}><Briefcase size={20} color="var(--primary)" /></div>
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Position</p>
            <p style={{ fontWeight: '500' }}>{user.role === 'EMPLOYEE' ? 'Staff' : 'Management'}</p>
          </div>
        </div>
      </div>

      <button onClick={onLogout} className="btn-primary" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', boxShadow: 'none' }}>
        <LogOut size={20} /> Logout Account
      </button>
    </div>
  );
}

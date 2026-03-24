import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminAttendance() {
  const [view, setView] = useState('summary'); // 'log' or 'summary'
  const [attendances, setAttendances] = useState([]);
  const [summary, setSummary] = useState([]);
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  });

  useEffect(() => {
    if (view === 'log') {
      fetchAttendances();
    } else {
      fetchSummary();
    }
  }, [view, startDate, endDate]);

  const fetchAttendances = async () => {
    try {
      const res = await axios.get((import.meta.env.VITE_API_URL || "http://localhost:3000") + '/api/admin/attendances');
      setAttendances(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/admin/attendance-summary?start_date=${startDate}&end_date=${endDate}`);
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="dashboard-title">Laporan Absensi</h1>
           <p style={{ color: 'var(--text-muted)' }}>Rekap dan histori kehadiran karyawan</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '12px' }}>
          <button onClick={() => setView('summary')} className={`btn-primary`} style={{ background: view === 'summary' ? 'var(--primary)' : 'transparent', color: view === 'summary' ? 'white' : 'var(--text-muted)', boxShadow: 'none' }}>Rekap Ringkasan</button>
          <button onClick={() => setView('log')} className={`btn-primary`} style={{ background: view === 'log' ? 'var(--primary)' : 'transparent', color: view === 'log' ? 'white' : 'var(--text-muted)', boxShadow: 'none' }}>Log Harian</button>
        </div>
      </div>

      {view === 'summary' && (
        <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color:'var(--text-muted)' }}>Dari Tanggal</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field" style={{ width: '200px', background: 'rgba(255,255,255,0.05)' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color:'var(--text-muted)' }}>Sampai Tanggal</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field" style={{ width: '200px', background: 'rgba(255,255,255,0.05)' }} />
          </div>
        </div>
      )}

      {view === 'log' && (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Kehadiran</th>
                <th>Aktivitas Terakhir</th>
              </tr>
            </thead>
            <tbody>
              {attendances.map(a => (
                <tr key={a.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{a.date}</td>
                  <td style={{ fontWeight: '500' }}>{a.full_name}</td>
                  <td>{a.clock_in ? new Date(a.clock_in).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-'}</td>
                  <td>{a.clock_out ? new Date(a.clock_out).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-'}</td>
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
              {attendances.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>No attendance records found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {view === 'summary' && (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Karyawan</th>
                <th>Role</th>
                <th>Total Hadir</th>
                <th>Total Terlambat</th>
                <th>Tepat Waktu</th>
              </tr>
            </thead>
            <tbody>
              {summary.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: '500' }}>{s.full_name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{s.role}</td>
                  <td><span className="badge on-time" style={{ fontSize: '14px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>{s.total_present} Hari</span></td>
                  <td>{s.total_late > 0 ? <span className="badge late">{s.total_late} Hari</span> : '-'}</td>
                  <td style={{ color: 'var(--success)', fontWeight: '500' }}>{s.total_present - s.total_late} Hari</td>
                </tr>
              ))}
              {summary.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>Belum ada data rekapan untuk tanggal ini.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

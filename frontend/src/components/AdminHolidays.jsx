import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2 } from 'lucide-react';

export default function AdminHolidays() {
  const [holidays, setHolidays] = useState([]);
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      const res = await axios.get((import.meta.env.VITE_API_URL || "http://localhost:3000") + '/api/admin/holidays');
      setHolidays(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post((import.meta.env.VITE_API_URL || "http://localhost:3000") + '/api/admin/holidays', { date, description });
      setDate('');
      setDescription('');
      fetchHolidays();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menyimpan libur');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/admin/holidays/${id}`);
      fetchHolidays();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Kalender Libur</h1>
           <p style={{ color: 'var(--text-muted)' }}>Atur hari libur nasional & perusahaan</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>Tambah Hari Libur</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '16px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color:'var(--text-muted)' }}>Tanggal Libur</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="input-field" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color:'var(--text-muted)' }}>Keterangan</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} required className="input-field" style={{ background: 'rgba(255,255,255,0.05)' }} placeholder="Contoh: Libur Nasional Idul Fitri" />
          </div>
          <button type="submit" className="btn-primary" style={{ height: '48px', padding: '0 24px' }}>
            <Plus size={18} /> Tambah
          </button>
        </form>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Keterangan Libur</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {holidays.map(h => (
              <tr key={h.id}>
                <td style={{ fontWeight: '500' }}>
                  {new Date(h.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </td>
                <td style={{ color: 'var(--text-muted)' }}>{h.description}</td>
                <td style={{ textAlign: 'center' }}>
                  <button onClick={() => handleDelete(h.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {holidays.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Belum ada data hari libur tersimpan.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

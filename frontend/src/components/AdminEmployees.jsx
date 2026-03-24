import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, X } from 'lucide-react';

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'EMPLOYEE',
    base_salary: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      // Re-using the existing /api/users endpoint
      const res = await axios.get('http://localhost:3000/api/users');
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('http://localhost:3000/api/users', {
        ...formData,
        base_salary: parseFloat(formData.base_salary)
      });
      setShowAddForm(false);
      setFormData({email:'', password:'', full_name:'', role:'EMPLOYEE', base_salary:''});
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);
  };

  return (
    <div>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="dashboard-title">Data Karyawan</h1>
           <p style={{ color: 'var(--text-muted)' }}>Kelola data dan akses karyawan</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddForm(true)} style={{ width: 'auto', padding: '10px 20px', borderRadius: '100px', display: 'flex', gap: '8px', alignItems: 'center' }}>
           <Plus size={18} /> Tambah Data
        </button>
      </div>

      {showAddForm && (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', position: 'relative' }}>
          <button onClick={() => setShowAddForm(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border:'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20}/></button>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Tambah Karyawan Baru</h2>
          {error && <p style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '14px' }}>{error}</p>}
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color:'var(--text-muted)' }}>Nama Lengkap</label>
              <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} required className="input-field" placeholder="John Doe" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color:'var(--text-muted)' }}>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="input-field" placeholder="john@ems.com" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color:'var(--text-muted)' }}>Password Akun</label>
              <input type="text" name="password" value={formData.password} onChange={handleInputChange} required className="input-field" placeholder="Buat password" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color:'var(--text-muted)' }}>Gaji Pokok (Rp)</label>
              <input type="number" name="base_salary" value={formData.base_salary} onChange={handleInputChange} required className="input-field" placeholder="5000000" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color:'var(--text-muted)' }}>Role</label>
              <select name="role" value={formData.role} onChange={handleInputChange} className="input-field" style={{ background: 'var(--surface)' }}>
                <option value="EMPLOYEE">Karyawan (Employee)</option>
                <option value="MANAGER">Manager / SPV</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" disabled={loading} className="btn-primary" style={{ height: '48px' }}>{loading ? 'Menyimpan...' : 'Simpan Karyawan'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nama Lengkap</th>
              <th>Email</th>
              <th>Role</th>
              <th>Gaji Pokok</th>
              <th>Tgl Bergabung</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(user => (
              <tr key={user.id}>
                <td style={{ fontWeight: '500' }}>{user.full_name}</td>
                <td>{user.email}</td>
                <td><span className={`badge ${user.role === 'ADMIN' ? 'late' : user.role === 'MANAGER' ? 'absent' : 'on-time'}`}>{user.role}</span></td>
                <td>{formatCurrency(user.base_salary)}</td>
                <td style={{ color: 'var(--text-muted)' }}>{new Date(user.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {employees.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>No employees found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

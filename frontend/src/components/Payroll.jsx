import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Download, TrendingUp, TrendingDown, SunSnow } from 'lucide-react';
import axios from 'axios';

export default function Payroll({ user }) {
  const [payroll, setPayroll] = useState(null);

  useEffect(() => {
    // Fetch user's latest mocked/calculated payroll 
    axios.get(`http://localhost:3000/api/payroll/${user.id}`)
      .then(res => setPayroll(res.data))
      .catch(err => console.error(err));
  }, [user.id]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);
  }

  const getMonthName = (m, y) => {
    const d = new Date(y, m - 1);
    return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }

  if (!payroll) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Payroll Data...</div>;

  return (
    <div style={{ padding: '24px', paddingBottom: '90px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Payslip</h2>
        <span className="badge on-time">{getMonthName(payroll.month, payroll.year)}</span>
      </div>

      <div className="clock-pulse-container" style={{ marginBottom: '24px' }}>
        <div style={{ textAlign: 'center', background: 'var(--primary-gradient)', padding: '32px 20px', borderRadius: '24px', color: 'white', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}><CreditCard size={120} /></div>
          <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Net Take Home Pay</p>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', letterSpacing: '-1px' }}>{formatCurrency(payroll.net_salary)}</h1>
          
          <button style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '8px', margin: '20px auto 0', cursor: 'pointer', fontSize: '13px', backdropFilter: 'blur(10px)' }}>
             <Download size={16} /> Download PDF
          </button>
        </div>
      </div>

      <h3 style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '16px' }}>Income Details</h3>
      
      <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '8px', borderRadius: '8px' }}><TrendingUp size={16} /></div>
               <span style={{ fontSize: '14px' }}>Base Salary</span>
            </div>
            <span style={{ fontWeight: '600' }}>{formatCurrency(payroll.base_salary)}</span>
         </div>
         <div style={{ height: '1px', background: 'var(--border)' }}></div>
         
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '8px', borderRadius: '8px' }}><SunSnow size={16} /></div>
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                 <span style={{ fontSize: '14px' }}>Holiday Overtime</span>
                 {payroll.holidays_worked > 0 && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{payroll.holidays_worked} hari x 2x lipat</span>}
               </div>
            </div>
            <span style={{ fontWeight: '600', color: 'var(--success)' }}>{formatCurrency(payroll.overtime_pay)}</span>
         </div>
         <div style={{ height: '1px', background: 'var(--border)' }}></div>

         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '8px', borderRadius: '8px' }}><TrendingDown size={16} /></div>
               <span style={{ fontSize: '14px' }}>Late Deductions</span>
            </div>
            <span style={{ fontWeight: '600' }}>{formatCurrency(payroll.late_deduction * -1)}</span>
         </div>
         <div style={{ height: '1px', background: 'var(--border)' }}></div>
         
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '8px', borderRadius: '8px' }}><DollarSign size={16} /></div>
               <span style={{ fontSize: '14px' }}>Tax (PPh21)</span>
            </div>
            <span style={{ fontWeight: '600' }}>{formatCurrency(payroll.tax_deduction * -1)}</span>
         </div>
      </div>

    </div>
  );
}

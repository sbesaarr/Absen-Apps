import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export default function AdminCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]); // { date: 'YYYY-MM-DD', title: '', type: 'holiday' | 'leave', durationText?: '' }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch both holidays and leaves
      const [holidaysRes, leavesRes] = await Promise.all([
        axios.get('http://localhost:3000/api/admin/holidays'),
        axios.get('http://localhost:3000/api/admin/leaves')
      ]);

      const newEvents = [];
      
      // Parse Holidays
      if (holidaysRes.data) {
        holidaysRes.data.forEach(h => {
          newEvents.push({
            id: `hol-${h.id}`,
            date: h.date,
            title: h.description,
            type: 'holiday'
          });
        });
      }

      // Parse Leaves (Only Approved)
      if (leavesRes.data) {
        const approvedLeaves = leavesRes.data.filter(l => l.status === 'APPROVED');
        approvedLeaves.forEach(l => {
          // Leaves can span multiple days. We map it to the start date for simplicity,
          // but visually indicate duration
          let startD = new Date(l.start_date);
          let endD = new Date(l.end_date);
          let durationDays = Math.round((endD - startD) / (1000 * 60 * 60 * 24)) + 1;
          
          // Generate an event for each day of the leave
          for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
            newEvents.push({
              id: `lv-${l.id}-${d.toISOString().split('T')[0]}`,
              date: d.toISOString().split('T')[0],
              title: `${l.full_name} (${l.leave_type === 'ANNUAL' ? 'Cuti' : l.leave_type})`,
              type: 'leave'
            });
          }
        });
      }

      setEvents(newEvents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Calendar Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month); // 0=Sun, 1=Mon...

  const daysArray = [];
  // Fill empty slots for previous month
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  // Fill actual days
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const getEventsForDate = (dateString) => events.filter(e => e.date === dateString);

  return (
    <div>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="dashboard-title">Calendar Schedule</h1>
          <p style={{ color: 'var(--text-muted)' }}>Overview of Holidays and Approved Leaves</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-secondary)', padding: '8px 16px', borderRadius: '12px' }}>
          <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)' }}><ChevronLeft size={20} /></button>
          <h2 style={{ fontSize: '16px', fontWeight: '600', minWidth: '130px', textAlign: 'center' }}>{monthNames[month]} {year}</h2>
          <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)' }}><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px', overflowX: 'auto' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading records...</p>
        ) : (
          <div style={{ minWidth: '800px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '8px' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} style={{ textAlign: 'center', fontWeight: '600', fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{day}</div>
              ))}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', autoRows: 'minmax(120px, auto)' }}>
              {daysArray.map((dayNum, idx) => {
                if (!dayNum) return <div key={`empty-${idx}`} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid transparent' }}></div>;
                
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayEvents = getEventsForDate(dateStr);
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                
                return (
                  <div key={dateStr} style={{ 
                    background: 'var(--bg-secondary)', 
                    borderRadius: '12px', 
                    padding: '8px',
                    border: isToday ? '2px solid var(--primary)' : '1px solid var(--border)',
                    boxShadow: isToday ? '0 0 10px rgba(99,102,241,0.2)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                       <span style={{ 
                         fontWeight: '600', 
                         fontSize: '14px', 
                         color: isToday ? 'var(--primary)' : 'var(--text)',
                         background: isToday ? 'rgba(99,102,241,0.1)' : 'transparent',
                         padding: isToday ? '2px 8px' : '0 8px',
                         borderRadius: '12px'
                       }}>{dayNum}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', flex: 1 }}>
                      {dayEvents.map(e => (
                        <div 
                          key={e.id} 
                          title={e.title}
                          style={{ 
                            fontSize: '11px', 
                            padding: '4px 6px', 
                            borderRadius: '4px',
                            background: e.type === 'holiday' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: e.type === 'holiday' ? '#ef4444' : '#10b981',
                            borderLeft: `2px solid ${e.type === 'holiday' ? '#ef4444' : '#10b981'}`,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontWeight: '500',
                            cursor: 'default'
                          }}
                        >
                          {e.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '24px', marginTop: '24px', padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '3px' }}></div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Official Holiday</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '3px' }}></div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Approved Leave</span>
        </div>
      </div>
    </div>
  );
}

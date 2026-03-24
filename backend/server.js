import express from 'express';
import cors from 'cors';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

// Root route for Vercel heartbeat 
app.get('/', (req, res) => {
  res.json({ message: "EMS Web API is running on Vercel!", status: isReady ? "Database Ready" : "Database Not Ready" });
});

// Initialize Google Sheets
let doc;
let isReady = false;

async function initGoogleSheets() {
  try {
    let creds;
    if (process.env.GOOGLE_CREDENTIALS) {
      creds = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    } else {
      const credsStr = fs.readFileSync('./google-credentials.json', 'utf8');
      creds = JSON.parse(credsStr);
    }
    
    // Auth
    const serviceAccountAuth = new JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const SHEET_ID = '1WhYqEfGVJ5fpUYkiiPNS5AuFNg1HTqZNI0YWudgmOWE';
    doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    
    await doc.loadInfo();
    console.log(`Connected to Google Sheet: ${doc.title}`);

    // Ensure all required sheets exist
    const requiredSheets = [
      { title: 'users', headers: ['id', 'email', 'password_hash', 'full_name', 'role', 'base_salary', 'created_at'] },
      { title: 'attendances', headers: ['id', 'user_id', 'date', 'clock_in', 'clock_out', 'break_start', 'break_end', 'clock_in_lat', 'clock_in_lng', 'status'] },
      { title: 'leaves', headers: ['id', 'user_id', 'start_date', 'end_date', 'leave_type', 'reason', 'status'] },
      { title: 'holidays', headers: ['id', 'date', 'description'] }
    ];

    for (const req of requiredSheets) {
      let sheet = doc.sheetsByTitle[req.title];
      if (!sheet) {
        sheet = await doc.addSheet({ title: req.title, headerValues: req.headers });
        console.log(`Created new sheet: ${req.title}`);
      }
    }

    // Provision admin if users sheet is empty
    const usersSheet = doc.sheetsByTitle['users'];
    const usersRows = await usersSheet.getRows();
    if (usersRows.length === 0) {
      await usersSheet.addRow({
        id: '1',
        email: 'admin@ems.com',
        password_hash: 'admin123',
        full_name: 'Administrator',
        role: 'ADMIN',
        base_salary: '10000000',
        created_at: new Date().toISOString()
      });
      await usersSheet.addRow({
        id: '2',
        email: 'manager@ems.com',
        password_hash: 'manager123',
        full_name: 'Febri Aditya',
        role: 'MANAGER',
        base_salary: '8000000',
        created_at: new Date().toISOString()
      });
      await usersSheet.addRow({
        id: '3',
        email: 'employee@ems.com',
        password_hash: 'emp123',
        full_name: 'John Doe',
        role: 'EMPLOYEE',
        base_salary: '6000000',
        created_at: new Date().toISOString()
      });
      console.log('Seeded initial users to Google Sheet');
    }

    isReady = true;
    console.log("Database Engine (Google Sheets) Ready.");
  } catch (err) {
    console.error("Failed to initialize Google Sheets:", err.message);
  }
}

// Call init on startup
initGoogleSheets();

// --- API Helpers ---
const generateId = () => Date.now().toString();

// Middleware to check readiness
app.use((req, res, next) => {
  if (!isReady) return res.status(503).json({ error: "Google Sheets connection not ready yet." });
  next();
});

// 1. Authentication
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const sheet = doc.sheetsByTitle['users'];
    const rows = await sheet.getRows();
    
    const userRow = rows.find(r => r.get('email') === email && r.get('password_hash') === password);
    if (!userRow) return res.status(401).json({ error: "Invalid email or password" });

    res.json({
      message: "Login successful",
      user: {
        id: userRow.get('id'),
        email: userRow.get('email'),
        full_name: userRow.get('full_name'),
        role: userRow.get('role'),
        base_salary: parseFloat(userRow.get('base_salary') || '0')
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Attendance APIs
app.post('/api/attendance/clock-in', async (req, res) => {
  try {
    const { userId, latitude, longitude } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    const sheet = doc.sheetsByTitle['attendances'];
    const rows = await sheet.getRows();
    
    const existing = rows.find(r => r.get('user_id') === String(userId) && r.get('date') === today);
    if (existing) return res.status(400).json({ error: "Sudah absen masuk hari ini" });

    const hour = new Date().getHours();
    const status = hour >= 9 ? 'LATE' : 'ON_TIME';

    const newId = generateId();
    await sheet.addRow({
      id: newId,
      user_id: String(userId),
      date: today,
      clock_in: now,
      clock_in_lat: latitude,
      clock_in_lng: longitude,
      status: status
    });

    res.status(200).json({ message: "Berhasil absen masuk", status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/attendance/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    const sheet = doc.sheetsByTitle['attendances'];
    const rows = await sheet.getRows();
    const record = rows.find(r => r.get('user_id') === String(userId) && r.get('date') === today);
    
    if (!record) return res.json({ clockedIn: false });
    res.json({
      clockedIn: true,
      status: record.get('status'),
      clock_in: record.get('clock_in'),
      break_start: record.get('break_start'),
      break_end: record.get('break_end'),
      clock_out: record.get('clock_out')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attendance/break-start', async (req, res) => {
  try {
    const { userId } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    const sheet = doc.sheetsByTitle['attendances'];
    const rows = await sheet.getRows();
    const record = rows.find(r => r.get('user_id') === String(userId) && r.get('date') === today);
    
    if (!record) return res.status(400).json({ error: "Belum absen masuk hari ini" });
    if (record.get('break_start')) return res.status(400).json({ error: "Sudah mulai istirahat" });

    record.set('break_start', new Date().toISOString());
    await record.save();
    res.status(200).json({ message: "Mulai istirahat" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attendance/break-end', async (req, res) => {
  try {
    const { userId } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    const sheet = doc.sheetsByTitle['attendances'];
    const rows = await sheet.getRows();
    const record = rows.find(r => r.get('user_id') === String(userId) && r.get('date') === today);
    
    if (!record) return res.status(400).json({ error: "Belum absen masuk" });
    
    record.set('break_end', new Date().toISOString());
    await record.save();
    res.status(200).json({ message: "Selesai istirahat" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attendance/clock-out', async (req, res) => {
  try {
    const { userId } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    const sheet = doc.sheetsByTitle['attendances'];
    const rows = await sheet.getRows();
    const record = rows.find(r => r.get('user_id') === String(userId) && r.get('date') === today);
    
    if (!record) return res.status(400).json({ error: "Belum absen masuk" });
    
    record.set('clock_out', new Date().toISOString());
    await record.save();
    res.status(200).json({ message: "Berhasil absen keluar" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/attendance/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const usersSheet = doc.sheetsByTitle['users'];
    const usersRows = await usersSheet.getRows();
    const userMap = {};
    usersRows.forEach(u => userMap[u.get('id')] = u);

    const sheet = doc.sheetsByTitle['attendances'];
    const rows = await sheet.getRows();
    const todayRows = rows.filter(r => r.get('date') === today);
    
    const results = todayRows.map(r => ({
      id: r.get('id'),
      user_id: r.get('user_id'),
      date: r.get('date'),
      clock_in: r.get('clock_in'),
      break_start: r.get('break_start'),
      break_end: r.get('break_end'),
      clock_out: r.get('clock_out'),
      status: r.get('status'),
      full_name: userMap[r.get('user_id')] ? userMap[r.get('user_id')].get('full_name') : 'Unknown',
      role: userMap[r.get('user_id')] ? userMap[r.get('user_id')].get('role') : 'Unknown'
    }));

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Employees APIs
app.get('/api/users', async (req, res) => {
  try {
    const sheet = doc.sheetsByTitle['users'];
    const rows = await sheet.getRows();
    const results = rows.map(r => ({
      id: r.get('id'),
      email: r.get('email'),
      full_name: r.get('full_name'),
      role: r.get('role'),
      base_salary: parseFloat(r.get('base_salary') || '0'),
      created_at: r.get('created_at')
    }));
    res.json(results.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { email, password, full_name, role, base_salary } = req.body;
    if (!email || !password || !full_name) return res.status(400).json({ error: "Lengkapi data wajib" });

    const sheet = doc.sheetsByTitle['users'];
    const rows = await sheet.getRows();
    const existing = rows.find(r => r.get('email') === email);
    if (existing) return res.status(400).json({ error: "Email sudah digunakan" });

    const newId = generateId();
    await sheet.addRow({
      id: newId,
      email: email,
      password_hash: password,
      full_name: full_name,
      role: role || 'EMPLOYEE',
      base_salary: String(base_salary || 0),
      created_at: new Date().toISOString()
    });
    
    res.status(200).json({ message: "Karyawan berhasil ditambahkan", id: newId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Leave APIs
app.post('/api/leave', async (req, res) => {
  try {
    const { userId, startDate, endDate, leaveType, reason } = req.body;
    const sheet = doc.sheetsByTitle['leaves'];
    const newId = generateId();
    await sheet.addRow({
      id: newId,
      user_id: String(userId),
      start_date: startDate,
      end_date: endDate,
      leave_type: leaveType,
      reason: reason,
      status: 'PENDING'
    });
    res.status(200).json({ message: "Pengajuan cuti berhasil", id: newId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/leave/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const sheet = doc.sheetsByTitle['leaves'];
    const rows = await sheet.getRows();
    const results = rows
      .filter(r => r.get('user_id') === String(userId))
      .map(r => ({
        id: r.get('id'),
        user_id: r.get('user_id'),
        start_date: r.get('start_date'),
        end_date: r.get('end_date'),
        leave_type: r.get('leave_type'),
        reason: r.get('reason'),
        status: r.get('status')
      }));
    res.json(results.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/leaves', async (req, res) => {
  try {
    const usersSheet = doc.sheetsByTitle['users'];
    const usersRows = await usersSheet.getRows();
    const userMap = {};
    usersRows.forEach(u => userMap[u.get('id')] = u.get('full_name'));

    const sheet = doc.sheetsByTitle['leaves'];
    const rows = await sheet.getRows();
    const results = rows.map(r => ({
      id: r.get('id'),
      user_id: r.get('user_id'),
      start_date: r.get('start_date'),
      end_date: r.get('end_date'),
      leave_type: r.get('leave_type'),
      reason: r.get('reason'),
      status: r.get('status'),
      full_name: userMap[r.get('user_id')] || 'Unknown'
    }));
    res.json(results.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/leave/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const sheet = doc.sheetsByTitle['leaves'];
    const rows = await sheet.getRows();
    const record = rows.find(r => r.get('id') === req.params.id);
    if (!record) return res.status(404).json({ error: "Not found" });

    record.set('status', status);
    await record.save();
    res.json({ message: "Leave status updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Admin & Reports APIs
app.get('/api/admin/attendances', async (req, res) => {
  try {
    const usersSheet = doc.sheetsByTitle['users'];
    const usersRows = await usersSheet.getRows();
    const userMap = {};
    usersRows.forEach(u => userMap[u.get('id')] = u);

    const sheet = doc.sheetsByTitle['attendances'];
    const rows = await sheet.getRows();
    
    let results = rows.map(r => ({
      id: r.get('id'),
      user_id: r.get('user_id'),
      date: r.get('date'),
      clock_in: r.get('clock_in'),
      break_start: r.get('break_start'),
      break_end: r.get('break_end'),
      clock_out: r.get('clock_out'),
      status: r.get('status'),
      full_name: userMap[r.get('user_id')] ? userMap[r.get('user_id')].get('full_name') : 'Unknown',
      role: userMap[r.get('user_id')] ? userMap[r.get('user_id')].get('role') : 'Unknown'
    }));
    
    results.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      const timeA = a.clock_in || '';
      const timeB = b.clock_in || '';
      return timeB.localeCompare(timeA);
    });
    
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/attendance-summary', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let queryDateStart = start_date;
    let queryDateEnd = end_date;
    if (!start_date || !end_date) {
      const today = new Date();
      queryDateStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      queryDateEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    }

    const usersSheet = doc.sheetsByTitle['users'];
    const usersRows = await usersSheet.getRows();
    
    const attendancesSheet = doc.sheetsByTitle['attendances'];
    const attRows = await attendancesSheet.getRows();
    
    const filteredAtt = attRows.filter(r => {
      const d = r.get('date');
      return d >= queryDateStart && d <= queryDateEnd;
    });

    const results = usersRows.map(u => {
      const id = u.get('id');
      const userAtts = filteredAtt.filter(a => a.get('user_id') === id);
      return {
        id: id,
        full_name: u.get('full_name'),
        role: u.get('role'),
        total_present: userAtts.length,
        total_late: userAtts.filter(a => a.get('status') === 'LATE').length
      };
    });
    
    res.json(results);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/holidays', async (req, res) => {
  try {
    const sheet = doc.sheetsByTitle['holidays'];
    const rows = await sheet.getRows();
    const results = rows.map(r => ({
      id: r.get('id'),
      date: r.get('date'),
      description: r.get('description')
    }));
    results.sort((a, b) => a.date.localeCompare(b.date));
    res.json(results);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/holidays', async (req, res) => {
  try {
    const { date, description } = req.body;
    if (!date || !description) return res.status(400).json({ error: "Isi tanggal dan keterangan" });

    const sheet = doc.sheetsByTitle['holidays'];
    const newId = generateId();
    await sheet.addRow({ id: newId, date: date, description: description });
    
    res.json({ id: newId, date, description });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/holidays/:id', async (req, res) => {
  try {
    const sheet = doc.sheetsByTitle['holidays'];
    const rows = await sheet.getRows();
    const record = rows.find(r => r.get('id') === req.params.id);
    if (record) {
      await record.delete();
    }
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 6. Payroll API
app.get('/api/payroll/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // 1-12
    const monthString = month.toString().padStart(2, '0');
    const startDate = `${year}-${monthString}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const usersSheet = doc.sheetsByTitle['users'];
    const usersRows = await usersSheet.getRows();
    const user = usersRows.find(u => u.get('id') === String(userId));
    if (!user) return res.status(404).json({ error: "User not found" });

    const attendancesSheet = doc.sheetsByTitle['attendances'];
    const attRows = await attendancesSheet.getRows();
    const userAtts = attRows.filter(a => a.get('user_id') === String(userId) && a.get('date') >= startDate && a.get('date') <= endDate);

    const holidaysSheet = doc.sheetsByTitle['holidays'];
    const holRows = await holidaysSheet.getRows();
    const holidaysArray = holRows.filter(h => h.get('date') >= startDate && h.get('date') <= endDate).map(h => h.get('date'));

    let totalLate = 0;
    let holidaysWorked = 0;

    userAtts.forEach(a => {
      if (a.get('status') === 'LATE') totalLate++;
      if (holidaysArray.includes(a.get('date'))) {
        holidaysWorked++;
      }
    });

    const baseSalary = parseFloat(user.get('base_salary') || '0');
    const dailyRate = Math.round(baseSalary / 26);
    const overtimePay = holidaysWorked * (dailyRate * 2);
    const lateDeduction = totalLate * 50000;
    
    const grossSalary = baseSalary + overtimePay - lateDeduction;
    const tax = Math.round(grossSalary * 0.05); // 5% flat
    const netSalary = grossSalary - tax;

    res.json({
      base_salary: baseSalary,
      daily_rate: dailyRate,
      holidays_worked: holidaysWorked,
      overtime_pay: overtimePay,
      total_late: totalLate,
      late_deduction: lateDeduction,
      gross_salary: grossSalary,
      tax_deduction: tax,
      net_salary: netSalary,
      month: month,
      year: year
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT} (Google Sheets Mode)`);
  });
}

export default app;

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.serialize(() => {
      // Create Users Table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password_hash TEXT,
        full_name TEXT,
        role TEXT,
        base_salary REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Create Attendances Table
      db.run(`CREATE TABLE IF NOT EXISTS attendances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        date TEXT,
        clock_in DATETIME,
        clock_out DATETIME,
        break_start DATETIME,
        break_end DATETIME,
        clock_in_lat REAL,
        clock_in_lng REAL,
        status TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`);

      // Create Leaves Table
      db.run(`CREATE TABLE IF NOT EXISTS leaves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        start_date TEXT,
        end_date TEXT,
        leave_type TEXT,
        reason TEXT,
        status TEXT DEFAULT 'PENDING',
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`);

      // Create Payrolls Table
      db.run(`CREATE TABLE IF NOT EXISTS payrolls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        month INTEGER,
        year INTEGER,
        base_salary REAL,
        deductions REAL,
        gross_salary REAL,
        tax_deduction REAL,
        net_salary REAL,
        status TEXT DEFAULT 'DRAFT',
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`);

      // Create Holidays Table
      db.run(`CREATE TABLE IF NOT EXISTS holidays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE,
        description TEXT
      )`);

      // Insert Admin if not exists
      db.get("SELECT id FROM users WHERE email = ?", ['admin@ems.com'], (err, row) => {
        if (!row) {
          db.run(`INSERT INTO users (email, password_hash, full_name, role, base_salary) VALUES (?, ?, ?, ?, ?)`,
            ['admin@ems.com', 'admin123', 'Super Admin', 'ADMIN', 10000000]);
        }
      });
      // Insert Spv
      db.get("SELECT id FROM users WHERE email = ?", ['manager@ems.com'], (err, row) => {
        if (!row) {
          db.run(`INSERT INTO users (email, password_hash, full_name, role, base_salary) VALUES (?, ?, ?, ?, ?)`,
            ['manager@ems.com', 'manager123', 'Manager Budi', 'MANAGER', 8000000]);
        }
      });
      // Insert Employee
      db.get("SELECT id FROM users WHERE email = ?", ['employee@ems.com'], (err, row) => {
        if (!row) {
          db.run(`INSERT INTO users (email, password_hash, full_name, role, base_salary) VALUES (?, ?, ?, ?, ?)`,
            ['employee@ems.com', 'emp123', 'Andi Pekerja', 'EMPLOYEE', 5000000]);
        }
      });
    });
  }
});

module.exports = db;

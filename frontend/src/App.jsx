import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ClockIn from './components/ClockIn';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/" 
          element={
            !user ? <Navigate to="/login" /> : 
            (user.role === 'ADMIN' || user.role === 'MANAGER') ? 
              <Dashboard user={user} onLogout={handleLogout} /> : 
              <ClockIn user={user} onLogout={handleLogout} />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;

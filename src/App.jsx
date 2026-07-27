// ====================================================================
// Main Application Root Component (src/App.jsx)
// Paired with: src/App.css
// Top Right Hamburger Mobile Menu Navigation & Logo Live Clock.
// Removed Bottom Menu navigation on mobile.
// ====================================================================

import React, { useState, useEffect } from 'react';
import PortalEntry from './pages/PortalEntry/PortalEntry';

// DO Window Components
import DOHeader from './components/DOHeader/DOHeader';
import DOSidebar from './components/DOSidebar/DOSidebar';
import TempMonitor from './pages/TempMonitor/TempMonitor';
import InwardMonitor from './pages/InwardMonitor/InwardMonitor';
import OutwardMonitor from './pages/OutwardMonitor/OutwardMonitor';
import DOHistoryView from './pages/DOHistoryView/DOHistoryView';
import DOProfileLookup from './pages/DOProfileLookup/DOProfileLookup';
import DONotificationsView from './pages/DONotificationsView/DONotificationsView';
import AddTempModal from './components/AddTempModal/AddTempModal';
import Login from './pages/Login/Login';
import SuperAdminSecureWindow from './pages/SuperAdminSecureWindow/SuperAdminSecureWindow';
import SubAdminWindow from './pages/SubAdminWindow/SubAdminWindow';

import { API_BASE_URL } from './services/api';
import './App.css'; // Paired CSS file

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch (e) {
      return null;
    }
  });

  const getWindowFromURL = () => {
    if (user && user.role === 'do_operator') return 'do_window';
    const path = window.location.pathname.toLowerCase();
    if (path.includes('do-operator') || path.includes('do')) return 'do_window';
    if (path.includes('admin')) return 'super_admin';
    return 'portal_entry'; // Defaults to Portal Selection Entry!
  };

  const [selectedWindow, setSelectedWindow] = useState(getWindowFromURL());
  const [activeDOMenu, setActiveDOMenu] = useState(() => {
    return localStorage.getItem('activeDOMenu') || 'All';
  });

  const [editInwardData, setEditInwardData] = useState(null);
  const [editOutwardData, setEditOutwardData] = useState(null);
  const [editDailyData, setEditDailyData] = useState(null);

  // Sync role constraints dynamically
  useEffect(() => {
    if (user && user.role === 'do_operator' && selectedWindow !== 'do_window') {
      setSelectedWindow('do_window');
      window.history.pushState({}, '', '/do-operator');
    }
  }, [user, selectedWindow]);

  useEffect(() => {
    localStorage.setItem('activeDOMenu', activeDOMenu);
  }, [activeDOMenu]);

  const navigateToWindow = (win) => {
    if (user && user.role === 'do_operator' && win !== 'do_window') return;
    setSelectedWindow(win);
    let targetPath = '/';
    if (win === 'do_window') targetPath = '/do-operator';
    if (win === 'super_admin') targetPath = '/admin';
    window.history.pushState({}, '', targetPath);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('user');
    setUser(null);
    setSelectedWindow('portal_entry');
    window.history.pushState({}, '', '/');
  };

  useEffect(() => {
    const handlePopState = () => {
      setSelectedWindow(getWindowFromURL());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  // Dynamic Titles for DO Window
  const getDOTitle = () => {
    switch (activeDOMenu) {
      case 'Inward': return 'DO Inward Temp Monitor';
      case 'Outward': return 'DO Outward Temp Monitor';
      case 'History': return 'DO Temp Monitoring History';
      case 'Lookup': return 'DO Profile Lookup Portal';
      case 'Notifications': return 'DO Notifications';
      default: return 'DO Daily Temp Monitor';
    }
  };



  // Authentication Route Guard
  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />;
  }

  // Super Admin Secure Area (Restricted to role: 'super_admin' only)
  if (user.role === 'super_admin') {
    return <SuperAdminSecureWindow user={user} onLogout={handleLogout} />;
  }

  if (selectedWindow === 'portal_entry') {
    if (user.role === 'do_operator') {
      setSelectedWindow('do_window');
      window.history.pushState({}, '', '/do-operator');
    } else {
      return <PortalEntry onSelectWindow={(win) => navigateToWindow(win)} />;
    }
  }

  return (
    <div className="app-container">
      {/* URL: /do-operator -> DEDICATED DATA OPERATOR (DO) WINDOW */}
      {selectedWindow === 'do_window' ? (
        <>
          <DOSidebar 
            user={user}
            activeDOMenu={activeDOMenu}
            setActiveDOMenu={setActiveDOMenu}
            onLogout={handleLogout}
          />

          <DOHeader 
            user={user}
            activeTitle={getDOTitle()}
            activeDOMenu={activeDOMenu}
            setActiveDOMenu={setActiveDOMenu}
            onLogout={handleLogout}
          />

          <main className="app-viewport">
            {activeDOMenu === 'Inward' ? (
              <InwardMonitor editData={editInwardData} setEditData={setEditInwardData} setActiveDOMenu={setActiveDOMenu} />
            ) : activeDOMenu === 'Outward' ? (
              <OutwardMonitor editData={editOutwardData} setEditData={setEditOutwardData} setActiveDOMenu={setActiveDOMenu} />
            ) : activeDOMenu === 'History' ? (
              <DOHistoryView 
                setActiveDOMenu={setActiveDOMenu}
                setEditInwardData={setEditInwardData}
                setEditOutwardData={setEditOutwardData}
                setEditDailyData={setEditDailyData}
              />
            ) : activeDOMenu === 'Lookup' ? (
              <DOProfileLookup 
                setActiveDOMenu={setActiveDOMenu}
                setEditInwardData={setEditInwardData}
                setEditOutwardData={setEditOutwardData}
                setEditDailyData={setEditDailyData}
              />
            ) : activeDOMenu === 'Notifications' ? (
              <DONotificationsView 
                setActiveDOMenu={setActiveDOMenu}
              />
            ) : (
              <TempMonitor 
                forcedMenu={activeDOMenu}
                onMenuChange={setActiveDOMenu}
                editData={editDailyData}
                setEditData={setEditDailyData}
              />
            )}
          </main>
        </>
      ) : (
        /* URL: /admin -> DEDICATED SUB ADMIN WINDOW */
        <SubAdminWindow user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

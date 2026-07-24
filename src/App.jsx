// ====================================================================
// Main Application Root Component (src/App.jsx)
// Paired with: src/App.css
// Top Right Hamburger Mobile Menu Navigation & Logo Live Clock.
// Removed Bottom Menu navigation on mobile.
// ====================================================================

import React, { useState, useEffect } from 'react';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';

// Landing Portal Entry
import PortalEntry from './pages/PortalEntry/PortalEntry';

// DO Window Components
import DOHeader from './components/DOHeader/DOHeader';
import DOSidebar from './components/DOSidebar/DOSidebar';
import TempMonitor from './pages/TempMonitor/TempMonitor';
import InwardMonitor from './pages/InwardMonitor/InwardMonitor';

// Admin Pages
import Dashboard from './pages/Dashboard/Dashboard';
import Leads from './pages/Leads/Leads';
import AddLead from './pages/AddLead/AddLead';
import LeadDetails from './pages/LeadDetails/LeadDetails';
import Settings from './pages/Settings/Settings';

import './App.css'; // Paired CSS file

export default function App() {
  const getWindowFromURL = () => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('do-operator') || path.includes('do')) return 'do_window';
    if (path.includes('admin')) return 'super_admin';
    return 'do_window'; // Defaults to DO Operator Window!
  };

  const [selectedWindow, setSelectedWindow] = useState(getWindowFromURL());
  const [activeDOMenu, setActiveDOMenu] = useState(() => {
    return localStorage.getItem('activeDOMenu') || 'All';
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    localStorage.setItem('activeDOMenu', activeDOMenu);
  }, [activeDOMenu]);

  const navigateToWindow = (win) => {
    setSelectedWindow(win);
    let targetPath = '/';
    if (win === 'do_window') targetPath = '/do-operator';
    if (win === 'super_admin') targetPath = '/admin';
    window.history.pushState({}, '', targetPath);
  };

  useEffect(() => {
    const handlePopState = () => {
      setSelectedWindow(getWindowFromURL());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Dynamic Titles for DO Window
  const getDOTitle = () => {
    switch (activeDOMenu) {
      case 'Inward': return 'DO Inward Temp Monitor';
      case 'Outward': return 'DO Outward Temp Monitor';
      default: return 'DO Daily Temp Monitor';
    }
  };

  const getAdminTitle = () => {
    if (selectedLead) return 'Lead Details';
    switch (activeTab) {
      case 'dashboard': return 'Sales Dashboard';
      case 'leads': return 'Lead Manager';
      case 'add-lead': return 'New Lead';
      case 'temp-monitor': return 'DO Temp Monitoring';
      case 'settings': return 'Settings';
      default: return 'ReeferON CRM';
    }
  };

  if (selectedWindow === 'portal') {
    return <PortalEntry onSelectWindow={(win) => navigateToWindow(win)} />;
  }

  return (
    <div className="app-container">
      {/* URL: /do-operator -> DEDICATED DATA OPERATOR (DO) WINDOW */}
      {selectedWindow === 'do_window' ? (
        <>
          <DOSidebar 
            activeDOMenu={activeDOMenu}
            setActiveDOMenu={setActiveDOMenu}
          />

          <DOHeader 
            activeTitle={getDOTitle()}
            activeDOMenu={activeDOMenu}
            setActiveDOMenu={setActiveDOMenu}
          />

          <main className="app-viewport">
            {activeDOMenu === 'Inward' ? (
              <InwardMonitor />
            ) : (
              <TempMonitor 
                forcedMenu={activeDOMenu}
                onMenuChange={setActiveDOMenu}
              />
            )}
          </main>
        </>
      ) : (
        /* URL: /admin -> DEDICATED SUPER ADMIN WINDOW */
        <>
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={(tab) => {
              setSelectedLead(null);
              setActiveTab(tab);
            }} 
          />

          <Header 
            title={getAdminTitle()} 
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setSelectedLead(null);
              setActiveTab(tab);
            }}
          />

          <main className="app-viewport">
            {selectedLead ? (
              <LeadDetails 
                lead={selectedLead} 
                onBack={() => setSelectedLead(null)} 
                onLeadUpdated={() => setSelectedLead(null)}
              />
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <Dashboard 
                    setActiveTab={setActiveTab} 
                    setSelectedLead={(lead) => setSelectedLead(lead)} 
                  />
                )}

                {activeTab === 'leads' && (
                  <Leads 
                    setSelectedLead={(lead) => setSelectedLead(lead)} 
                  />
                )}

                {activeTab === 'add-lead' && (
                  <AddLead 
                    setActiveTab={setActiveTab} 
                  />
                )}

                {activeTab === 'temp-monitor' && (
                  <TempMonitor />
                )}

                {activeTab === 'settings' && (
                  <Settings />
                )}
              </>
            )}
          </main>
        </>
      )}
    </div>
  );
}

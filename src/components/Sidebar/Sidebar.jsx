// ====================================================================
// Sidebar Component (src/components/Sidebar/Sidebar.jsx)
// Paired with: src/components/Sidebar/Sidebar.css
// Desktop & Tablet Navigation Sidebar with official ReeferON logo.
// ====================================================================

import React from 'react';
import { Home, Users, Plus, Thermometer, ArrowDownLeft, ArrowUpRight, Settings } from 'lucide-react';
import Logo from '../Logo/Logo';
import './Sidebar.css'; // Paired CSS file

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="app-sidebar desktop-only">
      <div className="sidebar-top">
        {/* Official ReeferON Logo */}
        <div className="sidebar-logo-container">
          <Logo />
        </div>

        {/* Navigation List */}
        <ul className="sidebar-nav-list">
          <li>
            <button 
              className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <Home size={19} />
              <span>Sales Dashboard</span>
            </button>
          </li>

          <li>
            <button 
              className={`sidebar-link ${activeTab === 'leads' ? 'active' : ''}`}
              onClick={() => setActiveTab('leads')}
            >
              <Users size={19} />
              <span>Lead Manager</span>
            </button>
          </li>

          <li>
            <button 
              className={`sidebar-link ${activeTab === 'temp-monitor' ? 'active' : ''}`}
              onClick={() => setActiveTab('temp-monitor')}
            >
              <Thermometer size={19} />
              <span>DO Temp Monitor</span>
            </button>
          </li>

          <li>
            <button 
              className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={19} />
              <span>Settings</span>
            </button>
          </li>
        </ul>

        {/* Quick Action Button for DO Window */}
        <button className="sidebar-add-btn" onClick={() => setActiveTab('temp-monitor')}>
          <Plus size={18} />
          <span>Log DO Temp Entry</span>
        </button>
      </div>

      {/* Sidebar Footer User Profile */}
      <div className="sidebar-bottom">
        <div className="user-profile-badge">
          <div className="avatar-circle">DO</div>
          <div className="user-info">
            <strong>Data Operator (DO)</strong>
            <span>Cold Chain Thermal Hub</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ====================================================================
// DO Sidebar Component (src/components/DOSidebar/DOSidebar.jsx)
// Paired with: src/components/DOSidebar/DOSidebar.css
// Dedicated Navigation Sidebar for Data Operator (DO) Window.
// ====================================================================

import React from 'react';
import { Thermometer, ArrowDownLeft, ArrowUpRight, Plus } from 'lucide-react';
import Logo from '../Logo/Logo';
import './DOSidebar.css'; // Paired CSS file

export default function DOSidebar({ activeDOMenu, setActiveDOMenu, onOpenAddModal }) {
  return (
    <aside className="do-sidebar desktop-only">
      <div className="do-sidebar-top">
        {/* Official ReeferON Logo */}
        <Logo />

        {/* DO Dedicated Menu List */}
        <ul className="do-sidebar-nav">
          <li>
            <button 
              className={`do-sidebar-link ${activeDOMenu === 'All' ? 'active' : ''}`}
              onClick={() => setActiveDOMenu('All')}
            >
              <Thermometer size={19} />
              <span>DO Daily Temp Monitor</span>
            </button>
          </li>

          <li>
            <button 
              className={`do-sidebar-link inward ${activeDOMenu === 'Inward' ? 'active' : ''}`}
              onClick={() => setActiveDOMenu('Inward')}
            >
              <ArrowDownLeft size={19} />
              <span>Inward Temp Monitor</span>
            </button>
          </li>

          <li>
            <button 
              className={`do-sidebar-link outward ${activeDOMenu === 'Outward' ? 'active' : ''}`}
              onClick={() => setActiveDOMenu('Outward')}
            >
              <ArrowUpRight size={19} />
              <span>Outward Temp Monitor</span>
            </button>
          </li>
        </ul>

        {/* Quick Action Button for DO Window */}
        <button className="do-add-btn" onClick={onOpenAddModal}>
          <Plus size={18} />
          <span>Log Thermal Entry</span>
        </button>
      </div>

      {/* DO Profile Badge */}
      <div className="do-sidebar-bottom">
        <div className="do-user-badge">
          <div className="do-avatar">DO</div>
          <div className="do-user-info">
            <strong>Rakesh (DO)</strong>
            <span>Data Operator</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

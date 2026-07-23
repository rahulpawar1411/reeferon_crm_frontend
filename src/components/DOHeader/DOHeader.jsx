// ====================================================================
// DO Header Component (src/components/DOHeader/DOHeader.jsx)
// Paired with: src/components/DOHeader/DOHeader.css
// Mobile Right-Side Navigation Drawer with Background Scroll Lock
// Active Menu items match exact desktop sidebar gradient colors.
// ====================================================================

import React, { useState, useEffect } from 'react';
import { Clock, Menu, X, Thermometer, ArrowDownLeft, ArrowUpRight, ChevronRight, User } from 'lucide-react';
import Logo from '../Logo/Logo';
import './DOHeader.css'; // Paired CSS file

export default function DOHeader({ activeTitle, activeDOMenu, setActiveDOMenu }) {
  const [timeState, setTimeState] = useState(new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lock background scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Real-time ticking clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeState(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Formatted Date & Time Strings
  const formattedDate = timeState.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const formattedTime = timeState.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const handleMenuSelect = (menuKey) => {
    if (setActiveDOMenu) setActiveDOMenu(menuKey);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="do-header">
        {/* Left: Official Logo + Compact Live Clock Badge Underneath */}
        <div className="do-header-brand-group">
          <Logo compact={true} />
          
          {/* Live Real-time Clock Badge */}
          <div className="header-logo-clock" title="Current System Time">
            <Clock size={12} color="#00a2e8" style={{ flexShrink: 0 }} />
            <span className="clock-date">{formattedDate}</span>
            <span className="clock-divider">|</span>
            <span className="clock-time">{formattedTime}</span>
          </div>
        </div>

        {/* Desktop Only Title */}
        <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)' }}>{activeTitle || 'DO Daily Temp Monitor'}</h1>
          <span className="do-role-tag">DO Operator Window</span>
        </div>

        {/* Right: Top Right Hamburger Menu Button for Mobile */}
        <div className="do-header-actions">
          <button 
            className={`mobile-hamburger-btn mobile-only ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle Navigation Menu"
            title="Open Menu"
          >
            {isMobileMenuOpen ? <X size={22} color="#00a2e8" /> : <Menu size={22} color="#0f172a" />}
          </button>
        </div>
      </header>

      {/* Backdrop Blur Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-backdrop-overlay mobile-only" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Right-Side Slide-In Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="mobile-right-drawer mobile-only">
          {/* Drawer Header */}
          <div className="right-drawer-header">
            <div className="drawer-user-info">
              <div className="user-avatar-circle">
                <User size={16} color="#00a2e8" />
              </div>
              <div className="user-text">
                <strong>Rakesh (DO)</strong>
                <span>Data Operator</span>
              </div>
            </div>
            <button className="right-drawer-close" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="right-drawer-section">Navigation</div>

          <div className="clean-menu-list">
            <button 
              className={`clean-menu-item ${activeDOMenu === 'All' ? 'active' : ''}`}
              onClick={() => handleMenuSelect('All')}
            >
              <div className="item-left">
                <Thermometer size={18} className="item-icon" />
                <span>DO Daily Temp Monitor</span>
              </div>
              <ChevronRight size={16} className="item-arrow" />
            </button>

            <button 
              className={`clean-menu-item inward ${activeDOMenu === 'Inward' ? 'active' : ''}`}
              onClick={() => handleMenuSelect('Inward')}
            >
              <div className="item-left">
                <ArrowDownLeft size={18} className="item-icon inward-icon" />
                <span>Inward Temp Monitor</span>
              </div>
              <ChevronRight size={16} className="item-arrow" />
            </button>

            <button 
              className={`clean-menu-item outward ${activeDOMenu === 'Outward' ? 'active' : ''}`}
              onClick={() => handleMenuSelect('Outward')}
            >
              <div className="item-left">
                <ArrowUpRight size={18} className="item-icon outward-icon" />
                <span>Outward Temp Monitor</span>
              </div>
              <ChevronRight size={16} className="item-arrow" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

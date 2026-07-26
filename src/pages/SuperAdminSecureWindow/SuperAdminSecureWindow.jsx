// ====================================================================
// Super Admin Secure Window Component (src/pages/SuperAdminSecureWindow/SuperAdminSecureWindow.jsx)
// Paired with: src/pages/SuperAdminSecureWindow/SuperAdminSecureWindow.css
// Strictly accessible by role: 'super_admin' only.
// ====================================================================

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Cpu, Database, Server, Clock, LogOut, 
  ArrowRight, Lock, Thermometer, Trash2, Edit, UserPlus, ShieldAlert,
  Menu, X, ChevronRight, User, Eye, EyeOff, Activity
} from 'lucide-react';
import Logo from '../../components/Logo/Logo';
import { 
  fetchOperators, createOperator, updateOperator, deleteOperator, fetchOperatorActivities
} from '../../services/api';
import './SuperAdminSecureWindow.css';

export default function SuperAdminSecureWindow({ user, onLogout }) {
  const [time, setTime] = useState(new Date());
  const [activeMenu, setActiveMenu] = useState('data_operators');
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

  // Operator CRUD States
  const [operators, setOperators] = useState([]);
  const [loadingOps, setLoadingOps] = useState(false);
  const [opEmail, setOpEmail] = useState('');
  const [opPassword, setOpPassword] = useState('');
  const [opFullName, setOpFullName] = useState('');
  const [opPhoneNo, setOpPhoneNo] = useState('');
  const [opWarehouseName, setOpWarehouseName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [editingOp, setEditingOp] = useState(null);
  const [opError, setOpError] = useState('');
  const [opSuccess, setOpSuccess] = useState('');
  const [operatorSearch, setOperatorSearch] = useState('');

  // Activity Logs States
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Real-time ticking clock for header
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadOperatorsData = async () => {
    setLoadingOps(true);
    setOpError('');
    try {
      const data = await fetchOperators();
      setOperators(data);
    } catch (err) {
      setOpError(err.message || 'Failed to fetch operators.');
    } finally {
      setLoadingOps(false);
    }
  };

  const loadActivities = async () => {
    setLoadingActivities(true);
    try {
      const data = await fetchOperatorActivities();
      setActivities(data);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    if (activeMenu === 'data_operators') {
      loadOperatorsData();
    } else if (activeMenu === 'activity_logs') {
      loadActivities();
    }
  }, [activeMenu]);

  const handleSaveOperator = async (e) => {
    e.preventDefault();
    setOpError('');
    setOpSuccess('');

    if (!opEmail || !opFullName || !opPhoneNo || !opWarehouseName) {
      setOpError('All fields (Full Name, Phone No., Email ID, Warehouse Name) are required.');
      return;
    }

    if (!editingOp && !opPassword) {
      setOpError('Password is required for registration.');
      return;
    }

    try {
      const payload = {
        email: opEmail,
        password: opPassword,
        full_name: opFullName,
        phone_no: opPhoneNo,
        warehouse_name: opWarehouseName
      };

      if (editingOp) {
        // Update operator details
        await updateOperator(editingOp.id, payload);
        setOpSuccess('Operator profile updated successfully.');
      } else {
        // Register new operator profile
        await createOperator(payload);
        setOpSuccess('Data operator registered successfully.');
      }

      // Reset form fields
      cancelEditOperator();
      loadOperatorsData();
    } catch (err) {
      setOpError(err.message || 'Action failed.');
    }
  };

  const handleDeleteOperator = async (id) => {
    if (!window.confirm('Are you sure you want to revoke workspace access for this data operator?')) {
      return;
    }
    setOpError('');
    setOpSuccess('');
    try {
      await deleteOperator(id);
      setOpSuccess('Operator credentials deleted successfully.');
      loadOperatorsData();
      if (editingOp && editingOp.id === id) {
        cancelEditOperator();
      }
    } catch (err) {
      setOpError(err.message || 'Failed to delete operator.');
    }
  };

  const startEditOperator = (op) => {
    setEditingOp(op);
    setOpEmail(op.email);
    setOpFullName(op.full_name || '');
    setOpPhoneNo(op.phone_no || '');
    setOpWarehouseName(op.warehouse_name || '');
    setOpPassword(''); // Leave blank unless updating
    setOpError('');
    setOpSuccess('');
  };

  const cancelEditOperator = () => {
    setEditingOp(null);
    setOpEmail('');
    setOpFullName('');
    setOpPhoneNo('');
    setOpWarehouseName('');
    setOpPassword('');
    setShowPassword(false);
    setOpError('');
    setOpSuccess('');
    setOperatorSearch('');
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="app-container">
      {/* 1. Secure Left Sidebar */}
      <aside className="do-sidebar desktop-only" style={{ padding: '20px 16px' }}>
        <div className="secure-sidebar-top">
          {/* Logo container */}
          <div className="secure-logo-container">
            <Logo />
          </div>





          {/* Super Admin Navigation Items */}
          <div className="secure-sidebar-nav" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              className={`clean-menu-item ${activeMenu === 'data_operators' ? 'active' : ''}`}
              onClick={() => setActiveMenu('data_operators')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeMenu === 'data_operators' ? 'var(--primary-light)' : 'transparent',
                color: activeMenu === 'data_operators' ? 'var(--primary)' : 'var(--text-dark)',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <Thermometer size={18} />
              <span>Data Operators</span>
            </button>

            <button 
              className={`clean-menu-item ${activeMenu === 'activity_logs' ? 'active' : ''}`}
              onClick={() => setActiveMenu('activity_logs')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeMenu === 'activity_logs' ? 'var(--primary-light)' : 'transparent',
                color: activeMenu === 'activity_logs' ? 'var(--primary)' : 'var(--text-dark)',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <Activity size={18} />
              <span>Operator Activities</span>
            </button> 
            <button 
              className={`clean-menu-item ${activeMenu === 'diagnostics' ? 'active' : ''}`}
              onClick={() => setActiveMenu('diagnostics')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeMenu === 'diagnostics' ? 'var(--primary-light)' : 'transparent',
                color: activeMenu === 'diagnostics' ? 'var(--primary)' : 'var(--text-dark)',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <Cpu size={18} />
              <span>System Diagnostics</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer with Logout */}
        <div className="secure-sidebar-bottom">
          <div className="secure-profile-badge">
            <div className="secure-avatar">SA</div>
            <div className="secure-user-info">
              <strong>Super Admin</strong>
              <span>{user?.email || 'admin@reeferon.com'}</span>
            </div>
            <button
              type="button"
              className="secure-logout-btn"
              onClick={onLogout}
              title="Log Out Session"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Workspace Layout */}
      {/* Header */}
      <header className="do-header secure-admin-header" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 24px', zIndex: 110 }}>
        {/* Left section: Mobile-only Logo */}
        <div className="secure-header-left" style={{ position: 'absolute', left: '24px', display: 'flex', alignItems: 'center' }}>
          <div className="secure-mobile-logo mobile-only">
            <Logo compact={true} />
          </div>
        </div>

        {/* Center section: Super Administrator & Time (Centered) */}
        <div className="secure-header-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', textAlign: 'center' }}>
          <span className="secure-role-tag" style={{ margin: 0 }}>
            {activeMenu === 'data_operators' ? 'Super Admin - Operator Profiles' : 'Super Administrator'}
          </span>
          <div className="secure-clock-subtext" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700' }}>
            <Clock size={12} />
            <span>{formatDate(time)} - {formatTime(time)}</span>
          </div>
        </div>

        {/* Right section: Mobile Hamburger Button & Spacers */}
        <div className="secure-header-right" style={{ position: 'absolute', right: '24px', display: 'flex', alignItems: 'center' }}>
          <button 
            className="mobile-hamburger-btn mobile-only"
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
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
                <strong>Super Admin</strong>
                <span>{user?.email || 'admin@reeferon.com'}</span>
              </div>
            </div>
            <button className="right-drawer-close" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="right-drawer-section">Navigation</div>

          <div className="clean-menu-list">
            <button 
              className={`clean-menu-item ${activeMenu === 'data_operators' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('data_operators');
                setIsMobileMenuOpen(false);
              }}
            >
              <div className="item-left">
                <Thermometer size={18} className="item-icon" />
                <span>Data Operators</span>
              </div>
              <ChevronRight size={16} className="item-arrow" />
            </button>

            <button 
              className={`clean-menu-item ${activeMenu === 'activity_logs' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('activity_logs');
                setIsMobileMenuOpen(false);
              }}
            >
              <div className="item-left">
                <Activity size={18} className="item-icon" />
                <span>Operator Activities</span>
              </div>
              <ChevronRight size={16} className="item-arrow" />
            </button>

            <button 
              className={`clean-menu-item ${activeMenu === 'diagnostics' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('diagnostics');
                setIsMobileMenuOpen(false);
              }}
            >
              <div className="item-left">
                <Cpu size={18} className="item-icon" />
                <span>System Diagnostics</span>
              </div>
              <ChevronRight size={16} className="item-arrow" />
            </button>

            <button 
              className="clean-menu-item"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onLogout();
              }}
              style={{ color: '#ef4444' }}
            >
              <div className="item-left">
                <LogOut size={18} className="item-icon" style={{ color: '#ef4444' }} />
                <span>Logout Session</span>
              </div>
              <ChevronRight size={16} className="item-arrow" />
            </button>
          </div>
        </div>
      )}

      {/* Body Content Viewport */}
      <main className="app-viewport secure-admin-viewport" style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        {activeMenu === 'diagnostics' && (
          <>
            {/* Welcome Dashboard Template */}
            <div className="secure-welcome-card">
              <div className="welcome-icon-circle">
                <Lock size={32} color="#00a2e8" />
              </div>
              <div className="welcome-text-block">
                <h1>System Integrity Verified</h1>
                <p>Welcome to the secure root template. There are no navigational sidebar menus active. This clean screen is prepared for advanced configuration tools.</p>
              </div>
            </div>

            {/* System Diagnostic Cards */}
            <div className="secure-diagnostics-grid">
              {/* Database status */}
              <div className="diagnostic-card">
                <div className="card-top">
                  <Database size={20} color="#00a2e8" />
                  <h3>Database Engine</h3>
                </div>
                <p className="status-label status-ok">Connected (Active)</p>
                <span className="card-desc">MySQL Database server connection pools are online and verified.</span>
              </div>

              {/* Server status */}
              <div className="diagnostic-card">
                <div className="card-top">
                  <Server size={20} color="#00a2e8" />
                  <h3>Backend API Server</h3>
                </div>
                <p className="status-label status-ok">Online (Healthy)</p>
                <span className="card-desc">Express API layers running smoothly on port 5000 with CORS and Helmet filters active.</span>
              </div>

              {/* Security filters */}
              <div className="diagnostic-card">
                <div className="card-top">
                  <Cpu size={20} color="#00a2e8" />
                  <h3>Session Integrity</h3>
                </div>
                <p className="status-label status-ok">Enforced</p>
                <span className="card-desc">JWT cookie checks, bcrypt hashes, and brute-force rate-limiters are active.</span>
              </div>
            </div>

            {/* Placeholder for future tools */}
            <div className="secure-placeholder-card">
              <h3>Root Template Container</h3>
              <p>This layout operates as a standalone template view containing zero sidebar navigations. Super Administrators can integrate modules such as audit log viewers, backup controls, database tables managers, or credential configuration fields directly inside this view.</p>
              <button className="placeholder-action-btn" disabled>
                <span>Module Registration Pending</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}

        {activeMenu === 'activity_logs' && (
          <div className="diagnostics-card" style={{ padding: '24px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>Operator Activity Audit Logs</h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Real-time database operations audit trail</p>
              </div>
              <button 
                onClick={loadActivities} 
                disabled={loadingActivities}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  backgroundColor: '#ffffff',
                  color: 'var(--text-dark)',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                Refresh Logs
              </button>
            </div>

            {loadingActivities ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <span>Loading activity history logs...</span>
              </div>
            ) : activities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <span>No operator activities recorded in the database yet.</span>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="logs-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 10px', fontWeight: '800', color: 'var(--text-dark)' }}>Operator Email</th>
                      <th style={{ padding: '12px 10px', fontWeight: '800', color: 'var(--text-dark)' }}>Action</th>
                      <th style={{ padding: '12px 10px', fontWeight: '800', color: 'var(--text-dark)' }}>Module/Log</th>
                      <th style={{ padding: '12px 10px', fontWeight: '800', color: 'var(--text-dark)' }}>Activity Description</th>
                      <th style={{ padding: '12px 10px', fontWeight: '800', color: 'var(--text-dark)' }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((act) => {
                      let actionColor = '#3b82f6';
                      let actionBg = '#dbeafe';
                      if (act.action === 'CREATE') {
                        actionColor = '#10b981';
                        actionBg = '#d1fae5';
                      } else if (act.action === 'DELETE') {
                        actionColor = '#ef4444';
                        actionBg = '#fee2e2';
                      }

                      return (
                        <tr key={act.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 10px', fontWeight: '700', color: '#0f172a' }}>{act.operator_email}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '100px',
                              fontSize: '0.7rem',
                              fontWeight: '800',
                              color: actionColor,
                              backgroundColor: actionBg,
                              textTransform: 'uppercase'
                            }}>
                              {act.action}
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px', fontWeight: '700', color: '#475569' }}>{act.log_type}</td>
                          <td style={{ padding: '12px 10px', color: '#334155' }}>{act.description}</td>
                          <td style={{ padding: '12px 10px', color: '#64748b', fontSize: '0.78rem' }}>
                            {new Date(act.created_at).toLocaleString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeMenu === 'data_operators' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Top: Register New Operator Horizontal Form */}
            <div className="diagnostics-card" style={{ padding: '24px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editingOp ? <Edit size={18} color="#00a2e8" /> : <UserPlus size={18} color="#00a2e8" />}
                  <span>{editingOp ? `Modify Operator Profile: ${editingOp.email}` : 'Register New Data Operator'}</span>
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  {editingOp ? 'Update account details, phone number, warehouse allocation or change password.' : 'All horizontal fields are mandatory. Registered credentials grant access to Operator Portals.'}
                </p>
              </div>

              <form onSubmit={handleSaveOperator} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="horizontal-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  {/* Full Name */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dark)' }}>Full Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe"
                      value={opFullName}
                      onChange={(e) => setOpFullName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        fontSize: '0.85rem',
                        outline: 'none',
                        backgroundColor: 'var(--bg-main)'
                      }}
                    />
                  </div>

                  {/* Phone No. */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dark)' }}>Phone No. *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. +91 9876543210"
                      value={opPhoneNo}
                      onChange={(e) => setOpPhoneNo(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        fontSize: '0.85rem',
                        outline: 'none',
                        backgroundColor: 'var(--bg-main)'
                      }}
                    />
                  </div>

                  {/* Email ID */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dark)' }}>Email ID *</label>
                    <input 
                      type="email" 
                      placeholder="e.g. operator@reeferon.com"
                      value={opEmail}
                      onChange={(e) => setOpEmail(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        fontSize: '0.85rem',
                        outline: 'none',
                        backgroundColor: 'var(--bg-main)'
                      }}
                    />
                  </div>

                  {/* Password */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dark)' }}>
                      {editingOp ? 'Password (leave blank to keep)' : 'Password *'}
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        placeholder={editingOp ? '••••••••' : 'Enter login password'}
                        value={opPassword}
                        onChange={(e) => setOpPassword(e.target.value)}
                        required={!editingOp}
                        style={{
                          width: '100%',
                          padding: '10px 40px 10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)',
                          fontSize: '0.85rem',
                          outline: 'none',
                          backgroundColor: 'var(--bg-main)',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0',
                          color: 'var(--text-muted)'
                        }}
                        title={showPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Warehouse Name */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dark)' }}>Warehouse Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Delhi Warehouse"
                      value={opWarehouseName}
                      onChange={(e) => setOpWarehouseName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        fontSize: '0.85rem',
                        outline: 'none',
                        backgroundColor: 'var(--bg-main)'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  {editingOp && (
                    <button 
                      type="button" 
                      onClick={cancelEditOperator}
                      style={{
                        padding: '10px 20px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        backgroundColor: '#ffffff',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        color: 'var(--text-dark)'
                      }}
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button 
                    type="submit"
                    disabled={loadingOps}
                    style={{
                      padding: '10px 24px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      backgroundColor: '#00a2e8',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0, 162, 232, 0.25)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {loadingOps ? 'Processing...' : (editingOp ? 'Update Operator Profile' : 'Register Operator Profile')}
                  </button>
                </div>
              </form>
            </div>

            {/* Bottom: Operators Directory List */}
            {(() => {
              const filteredOperators = operators.filter(op => {
                const term = operatorSearch.toLowerCase();
                return (
                  (op.full_name && op.full_name.toLowerCase().includes(term)) ||
                  (op.warehouse_name && op.warehouse_name.toLowerCase().includes(term)) ||
                  (op.email && op.email.toLowerCase().includes(term))
                );
              });

              return (
                <div className="diagnostics-card" style={{ padding: '24px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>Registered Operators Directory</h2>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Manage profile credentials and warehouse configurations.</p>
                    </div>

                    {/* Search / Filter Input */}
                    <div style={{ minWidth: '240px' }}>
                      <input 
                        type="text" 
                        placeholder="Search by name, warehouse..."
                        value={operatorSearch}
                        onChange={(e) => setOperatorSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)',
                          fontSize: '0.8rem',
                          outline: 'none',
                          backgroundColor: 'var(--bg-main)'
                        }}
                      />
                    </div>
                  </div>

                  {opSuccess && (
                    <div style={{ padding: '10px 14px', backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: '700' }}>
                      {opSuccess}
                    </div>
                  )}
                  {opError && (
                    <div style={{ padding: '10px 14px', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: '700' }}>
                      {opError}
                    </div>
                  )}

                  {loadingOps ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      <span>Loading operators profiles directory...</span>
                    </div>
                  ) : filteredOperators.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--text-muted)', gap: '10px' }}>
                      <ShieldAlert size={32} color="#94a3b8" />
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>No matching operators found.</p>
                    </div>
                  ) : (
                    <div className="table-responsive" style={{ flex: 1, overflowY: 'auto' }}>
                      <table className="logs-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', padding: '12px 16px' }}>Operator ID</th>
                            <th style={{ textAlign: 'left', padding: '12px 16px' }}>Full Name</th>
                            <th style={{ textAlign: 'left', padding: '12px 16px' }}>Phone No.</th>
                            <th style={{ textAlign: 'left', padding: '12px 16px' }}>Email Address</th>
                            <th style={{ textAlign: 'left', padding: '12px 16px' }}>Warehouse Name</th>
                            <th style={{ textAlign: 'left', padding: '12px 16px' }}>Registration Date</th>
                            <th style={{ textAlign: 'center', padding: '12px 16px' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOperators.map((op) => (
                            <tr key={op.id}>
                              <td style={{ padding: '12px 16px' }}>
                                <span className="status-badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 800 }}>
                                  #{op.id}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px', fontWeight: '600' }}>{op.full_name || '-'}</td>
                              <td style={{ padding: '12px 16px', fontWeight: '500' }}>{op.phone_no || '-'}</td>
                              <td style={{ padding: '12px 16px', fontWeight: '600' }}>{op.email}</td>
                              <td style={{ padding: '12px 16px', fontWeight: '500' }}>{op.warehouse_name || '-'}</td>
                              <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                {new Date(op.created_at).toLocaleDateString('en-GB')}
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  <button 
                                    className="btn-edit-log"
                                    onClick={() => startEditOperator(op)}
                                    title="Edit Operator Profile"
                                    style={{ backgroundColor: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1', padding: '6px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button 
                                    className="btn-delete-log"
                                    onClick={() => handleDeleteOperator(op.id)}
                                    title="Revoke Access (Delete)"
                                    style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', padding: '6px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </main>
    </div>
  );
}

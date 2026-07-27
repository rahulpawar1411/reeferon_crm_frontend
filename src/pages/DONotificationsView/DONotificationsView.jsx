import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, XCircle, Clock, RefreshCw, ArrowRight, Lock, Eye, AlertCircle } from 'lucide-react';
import { fetchPermissionRequests } from '../../services/api';
import './DONotificationsView.css';

export default function DONotificationsView({ setActiveDOMenu }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All'); // 'All' | 'Approved' | 'Denied' | 'Pending'

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPermissionRequests();
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Could not retrieve notifications. Please reload.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(() => {
      loadNotifications();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const parseRequestDescription = (descText) => {
    const info = {
      module: '-',
      client: '-',
      refNo: '',
      extra: '-'
    };
    if (!descText) return info;
    
    const parts = descText.split(' | ');
    
    if (descText.includes('Chamber')) {
      info.module = 'Chamber Temp';
    } else if (descText.includes('Inward')) {
      info.module = 'Inward DO';
    } else if (descText.includes('Outward')) {
      info.module = 'Outward DO';
    }
    
    // Match Ref: RF-XX-26-XXXX or ID: XX
    const refMatch = descText.match(/\((?:Ref|ID):\s*([^\)]+)\)/i);
    if (refMatch) {
      info.refNo = refMatch[1].trim();
    }
    
    const clientPart = parts.find(p => p.startsWith('Client:'));
    if (clientPart) {
      info.client = clientPart.replace('Client:', '').trim();
    }
    
    const extras = parts.filter(p => !p.startsWith('Client:') && !p.includes('Requested permission'));
    if (extras.length > 0) {
      info.extra = extras.join(' | ');
    }
    
    return info;
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'All') return true;
    return notif.status === filter;
  });

  return (
    <div className="temp-monitor-page do-notifications-page">
      {/* 1. Header Banner */}
      <div className="do-header-banner">
        <div className="do-header-left">
          <h2>
            <Bell size={26} color="#00a2e8" />
            <span>Permission & Access Notifications</span>
          </h2>
          <p>
            Track the status of your edit or delete request submissions.
          </p>
        </div>

        <button
          onClick={loadNotifications}
          disabled={loading}
          className="do-notifications-refresh-btn"
        >
          <RefreshCw size={14} className={loading ? 'spin-animation' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. Filter Tabs */}
      <div className="notifications-filter-container">
        {['All', 'Approved', 'Denied', 'Pending'].map((tab) => {
          const count = tab === 'All' ? notifications.length : notifications.filter(n => n.status === tab).length;
          
          let tabColor = 'var(--text-dark)';
          let tabBg = '#ffffff';
          let tabBorder = 'var(--border)';

          if (filter === tab) {
            tabBorder = 'var(--primary)';
            tabBg = 'var(--primary-light)';
            tabColor = 'var(--primary)';
          }

          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${tabBorder}`,
                backgroundColor: tabBg,
                color: tabColor,
                fontSize: '0.78rem',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span>{tab}</span>
              <span style={{
                fontSize: '0.7rem',
                padding: '2px 6px',
                borderRadius: '100px',
                backgroundColor: filter === tab ? 'var(--primary)' : '#f1f5f9',
                color: filter === tab ? '#ffffff' : '#475569',
                fontWeight: 'bold'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error State */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', fontWeight: '700' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Notifications Table Card */}
      <div className="notifications-table-card">
        {filteredNotifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Bell size={36} color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: '12px' }} />
            <h3 style={{ fontSize: '0.9rem', fontWeight: '800', margin: 0, color: 'var(--text-dark)' }}>No notifications found</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Any approval responses from the Super Admin will appear here.
            </p>
          </div>
        ) : (
          <div className="notifications-table-responsive">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Record ID</th>
                  <th>Log Module</th>
                  <th>Client Name</th>
                  <th>Request Type</th>
                  <th>Status</th>
                  <th className="wrap-text">Admin Response / Message</th>
                  <th>Timestamp</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotifications.map((notif) => {
                  const parsed = parseRequestDescription(notif.request_description || notif.description);
                  const isEdit = notif.raw_action?.includes('EDIT') || notif.description?.toLowerCase().includes('edit');
                  
                  let statusColor = '#ca8a04';
                  let statusBg = '#fef9c3';

                  if (notif.status === 'Approved') {
                    statusColor = '#16a34a';
                    statusBg = '#dcfce7';
                  } else if (notif.status === 'Denied') {
                    statusColor = '#dc2626';
                    statusBg = '#fee2e2';
                  }

                  return (
                    <tr key={notif.id}>
                      <td 
                        style={{ fontWeight: '700', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                        title="Click to copy Unique Reference ID"
                        onClick={() => {
                          const displayRef = parsed.refNo || `#${notif.record_id}`;
                          navigator.clipboard.writeText(displayRef);
                          alert(`Copied Reference ID: ${displayRef}`);
                        }}
                      >
                        {parsed.refNo || `#${notif.record_id}`}
                      </td>
                      <td>
                        <span className="status-badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: '0.66rem' }}>
                          {parsed.module}
                        </span>
                      </td>
                      <td style={{ fontWeight: '800', color: '#0f172a' }}>
                        {parsed.client}
                      </td>
                      <td>
                        <span className="status-badge" style={{ 
                          backgroundColor: isEdit ? '#e0f2fe' : '#fee2e2', 
                          color: isEdit ? '#0369a1' : '#dc2626', 
                          fontWeight: 800,
                          fontSize: '0.66rem'
                        }}>
                          {isEdit ? 'EDIT' : 'DELETE'}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '100px',
                          fontSize: '0.64rem',
                          fontWeight: '800',
                          color: statusColor,
                          backgroundColor: statusBg,
                        }}>
                          {notif.status}
                        </span>
                      </td>
                      <td className="wrap-text" style={{ color: '#334155' }}>
                        <div style={{ fontWeight: '500', wordBreak: 'break-word', whiteSpace: 'normal' }}>{notif.description}</div>
                        {parsed.extra !== '-' && (
                          <div style={{ fontSize: '0.66rem', color: '#64748b', fontStyle: 'italic', marginTop: '2px', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                            {parsed.extra}
                          </div>
                        )}
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.72rem' }}>
                        {new Date(notif.created_at).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {notif.status === 'Approved' ? (
                          <button
                            onClick={() => setActiveDOMenu('History')}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              backgroundColor: 'var(--primary)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.72rem',
                              fontWeight: '800',
                              cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(0, 162, 232, 0.15)',
                              transition: 'all 0.2s',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <span>Proceed</span>
                            <ArrowRight size={12} />
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

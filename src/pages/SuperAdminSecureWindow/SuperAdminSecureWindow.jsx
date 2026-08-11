// ====================================================================
// Super Admin Secure Window Component (src/pages/SuperAdminSecureWindow/SuperAdminSecureWindow.jsx)
// Paired with: src/pages/SuperAdminSecureWindow/SuperAdminSecureWindow.css
// Strictly accessible by role: 'super_admin' only.
// ====================================================================

import React, { useState, useEffect, useMemo, Suspense, lazy, useRef } from 'react';
import { 
  ShieldCheck, Clock, LogOut, Database, Lock,
  Thermometer, Trash2, Edit, UserPlus, ShieldAlert,
  Menu, X, ChevronRight, User, Eye, EyeOff, Activity, Search, Download, History, LayoutDashboard,
  Copy, Check, Loader2, CheckCircle, MessageSquareWarning, MessageSquare, Smartphone, Package, Users, LayoutGrid
} from 'lucide-react';
import Logo from '../../components/Logo/Logo';
import PaginationBar from '../../components/PaginationBar/PaginationBar';
import { 
  fetchOperators, createOperator, updateOperator, deleteOperator, fetchOperatorActivities,
  fetchAllOperatorActivities,
  fetchPermissionRequests, updatePermissionRequest, fetchSystemConfig, updateSystemConfig,
  fetchRecordPermissionHistory,
  fetchChamberLogs, fetchInwardLogs, fetchOutwardLogs, fetchDashboardStats,
  fetchAllChamberLogs, fetchAllInwardLogs, fetchAllOutwardLogs,
  deleteChamberLog, deleteInwardLog, deleteOutwardLog,
  toApiDateParam,
  fetchSubAdmins, createSubAdmin, updateSubAdmin, deleteSubAdmin, fetchAccessScopeOptions,
  changeSuperAdminPassword, verifySuperAdminProfileAccess,
  fetchCustomerReports, updateCustomerReportStatus, deleteCustomerReport,
  fetchCustomerNoteThreads, fetchCustomerNotes, postCustomerNote, deleteCustomerNote,
  fetchDailyInspections, deleteDailyInspection,
  fetchInventoryReconciliation, fetchInventoryFilterOptions, fetchDailyInventoryDeltas,
  fetchAppSubAdmins, createAppSubAdmin, deleteAppSubAdmin
} from '../../services/api';
import {
  requireExportDates,
  confirmExportSize,
  downloadCsv,
  formatExportProgress,
  getExportErrorMessage,
  isRetryableExportError
} from '../../utils/exportCsv';
import ExportErrorBanner from '../../components/ExportErrorBanner/ExportErrorBanner';
import LoadErrorBanner from '../../components/LoadErrorBanner/LoadErrorBanner';
import '../../components/DOSidebar/DOSidebar.css';
import './SuperAdminSecureWindow.css';

const TempMonitor = lazy(() => import('../TempMonitor/TempMonitor'));
const InwardMonitor = lazy(() => import('../InwardMonitor/InwardMonitor'));
const OutwardMonitor = lazy(() => import('../OutwardMonitor/OutwardMonitor'));

/** Highlight Added / Deleted keywords in DO operation log descriptions. */
const highlightAddedDeletedWords = (text, extraNodes = null) => {
  const str = String(text || '');
  if (!str) return extraNodes || '';
  const parts = str.split(/(\bAdded\b|\bDeleted\b|\badded\b|\bdeleted\b)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (/^(Added|Deleted|added|deleted)$/.test(part)) {
          return (
            <span key={`kw-${i}`} style={{ color: '#dc2626', fontWeight: 800 }}>
              {part}
            </span>
          );
        }
        return <React.Fragment key={`t-${i}`}>{part}</React.Fragment>;
      })}
      {extraNodes}
    </span>
  );
};

export default function SuperAdminSecureWindow({ user, onLogout, onUserUpdate }) {
  const [time, setTime] = useState(new Date());
  const [activeMenu, setActiveMenu] = useState(() => {
    const saved = localStorage.getItem('super_admin_active_menu');
    if (saved === 'customers' || saved === 'sub_admins' || saved === 'data_operators') {
      return 'user_management';
    }
    return saved || 'dashboard';
  });
  const [userTab, setUserTab] = useState(() => {
    const savedMenu = localStorage.getItem('super_admin_active_menu');
    if (savedMenu === 'data_operators') {
      return 'operators';
    }
    if (savedMenu === 'customers' || savedMenu === 'sub_admins') {
      return 'customers';
    }
    const savedTab = localStorage.getItem('super_admin_user_tab');
    if (savedTab === 'sub_admins') return 'customers';
    if (savedTab === 'data_operators') return 'operators';
    return savedTab || 'customers';
  });
  const [auditSubTab, setAuditSubTab] = useState(() => {
    return localStorage.getItem('super_admin_audit_sub_tab') || 'activity_log';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('super_admin_active_menu', activeMenu);
  }, [activeMenu]);

  useEffect(() => {
    localStorage.setItem('super_admin_user_tab', userTab);
  }, [userTab]);

  useEffect(() => {
    localStorage.setItem('super_admin_audit_sub_tab', auditSubTab);
  }, [auditSubTab]);

  useEffect(() => {
    setProfileEmail(user?.email || '');
    setOldProfileEmail(user?.email || '');
  }, [user?.email]);

  useEffect(() => {
    if (activeMenu === 'super_admin_profile') {
      setProfileAccessId(user?.email || '');
      setProfileAccessPassword('');
      setProfileAccessVerified(false);
      setProfileAccessLoading(false);
      setProfileAccessErr('');
      setNewAdminPassword('');
      setConfirmAdminPassword('');
      setProfilePwdMsg('');
      setProfilePwdErr('');
      setShowCurrentAdminPassword(false);
      setShowNewAdminPassword(false);
      setShowConfirmAdminPassword(false);
      setShowProfileConfirm(false);
      setProfileConfirmSummary(null);
      setProfileEmail(user?.email || '');
      setOldProfileEmail(user?.email || '');
      loadAppSubAdminsList();
    }
  }, [activeMenu, user?.email]);

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
  const [opChamberLimit, setOpChamberLimit] = useState(4);
  const [showPassword, setShowPassword] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [oldProfileEmail, setOldProfileEmail] = useState(user?.email || '');
  const [profileAccessId, setProfileAccessId] = useState(user?.email || '');
  const [profileAccessPassword, setProfileAccessPassword] = useState('');
  const [profileAccessVerified, setProfileAccessVerified] = useState(false);
  const [profileAccessLoading, setProfileAccessLoading] = useState(false);
  const [profileAccessErr, setProfileAccessErr] = useState('');
  const [profilePwdLoading, setProfilePwdLoading] = useState(false);
  const [profilePwdMsg, setProfilePwdMsg] = useState('');
  const [profilePwdErr, setProfilePwdErr] = useState('');
  const [showCurrentAdminPassword, setShowCurrentAdminPassword] = useState(false);
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false);
  const [showConfirmAdminPassword, setShowConfirmAdminPassword] = useState(false);
  const [showProfileConfirm, setShowProfileConfirm] = useState(false);
  const [profileConfirmSummary, setProfileConfirmSummary] = useState(null);

  // Mobile Sub-Admin registration (full app access)
  const [appSubAdmins, setAppSubAdmins] = useState([]);
  const [appSubAdminLoading, setAppSubAdminLoading] = useState(false);
  const [appSubAdminSaving, setAppSubAdminSaving] = useState(false);
  const [appSubAdminMsg, setAppSubAdminMsg] = useState('');
  const [appSubAdminErr, setAppSubAdminErr] = useState('');
  const [appSubFullName, setAppSubFullName] = useState('');
  const [appSubPhone, setAppSubPhone] = useState('');
  const [appSubEmail, setAppSubEmail] = useState('');
  const [appSubPassword, setAppSubPassword] = useState('');
  const [showAppSubPassword, setShowAppSubPassword] = useState(false);
  const [editingOp, setEditingOp] = useState(null);
  const [opError, setOpError] = useState('');
  const [opSuccess, setOpSuccess] = useState('');
  const [savingOp, setSavingOp] = useState(false);
  const [opProcessStatus, setOpProcessStatus] = useState('');
  const [operatorSearch, setOperatorSearch] = useState('');

  // Activity Logs States (server-paginated)
  const [activities, setActivities] = useState([]);
  const [hasNewDOChanges, setHasNewDOChanges] = useState(false);
  const [lastCheckedDOChanges, setLastCheckedDOChanges] = useState(() => localStorage.getItem('last_checked_do_changes') || '1970-01-01T00:00:00.000Z');
  const [activitiesTotal, setActivitiesTotal] = useState(0);
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('All');
  const [logsError, setLogsError] = useState('');
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Activity History Audit Logs States
  const [activitiesSearch, setActivitiesSearch] = useState('');
  const [activitiesFromDate, setActivitiesFromDate] = useState('');
  const [activitiesToDate, setActivitiesToDate] = useState('');
  const [activitiesActionFilter, setActivitiesActionFilter] = useState('All');
  const [activitiesCurrentPage, setActivitiesCurrentPage] = useState(1);
  const [activitiesPerPage] = useState(50);


  // Super Admin History Logs States
  const [historyTab, setHistoryTab] = useState('daily');
  const [chamberLogs, setChamberLogs] = useState([]);
  const [inwardLogs, setInwardLogs] = useState([]);
  const [outwardLogs, setOutwardLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const historyPerPage = 50;
  const [appliedLogsSearch, setAppliedLogsSearch] = useState('');
  const [logsExportLoading, setLogsExportLoading] = useState(false);
  const [logsExportProgressLabel, setLogsExportProgressLabel] = useState('Exporting…');
  const [exportError, setExportError] = useState(null); // { message, retryable, retryKey }
  const exportAbortRef = useRef(null);
  const [logsSearch, setLogsSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');
  const [selectedDetailLog, setSelectedDetailLog] = useState(null);
  const [detailType, setDetailType] = useState('');
  const [recordAllowHistory, setRecordAllowHistory] = useState([]);
  const [loadingAllowHistory, setLoadingAllowHistory] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  /** Super Admin direct edit (no permission): { type: 'daily'|'inward'|'outward', data } */
  const [saEditLog, setSaEditLog] = useState(null);
  const [saLogActionBusy, setSaLogActionBusy] = useState(false);

  // Lookup Menu States
  const [lookupQuery, setLookupQuery] = useState('');
  const [searchedRecord, setSearchedRecord] = useState(null);
  const [searchedRecordType, setSearchedRecordType] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [copiedRef, setCopiedRef] = useState(null);

  const formatDateStr = (dateVal) => {
    if (!dateVal) return '-';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return dateVal;
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    } catch {
      return dateVal;
    }
  };

  const formatDateTimeStr = (dateVal) => {
    if (!dateVal) return '-';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return dateVal;
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
    } catch {
      return dateVal;
    }
  };

  /** Shorten long file paths for readable update diffs */
  const shortenUpdateValue = (val) => {
    const s = String(val ?? '').trim();
    if (!s || s === 'N/A') return 'N/A';
    if (s.includes('/') || s.includes('\\')) {
      const name = s.split(/[/\\]/).pop();
      return name ? `…/${name}` : s;
    }
    return s.length > 48 ? `${s.slice(0, 45)}…` : s;
  };

  /**
   * Parses "Field: old ➔ new, Field2: old2 ➔ new2" into readable rows.
   * Also supports →, -> and pipe-separated multi-update history.
   */
  const parseUpdateDetails = (raw) => {
    if (!raw || !String(raw).trim()) return [];
    const text = String(raw).trim();
    // Split multi-edit history segments first
    const segments = text.split(/\s*\|\s*/);
    const rows = [];
    segments.forEach((segment) => {
      const parts = String(segment).split(/\s*,\s*(?=[^,:]+:\s)/);
      parts.forEach((part) => {
        const arrowMatch = part.match(/^(.*?):\s*(.*?)\s*(?:➔|→|->)\s*(.*)$/);
        if (arrowMatch) {
          rows.push({
            field: arrowMatch[1].trim(),
            from: shortenUpdateValue(arrowMatch[2]),
            to: shortenUpdateValue(arrowMatch[3])
          });
          return;
        }
        const colonIdx = part.indexOf(':');
        if (colonIdx === -1) {
          if (part.trim()) rows.push({ field: 'Change', from: '—', to: shortenUpdateValue(part) });
          return;
        }
        rows.push({
          field: part.slice(0, colonIdx).trim(),
          from: '—',
          to: shortenUpdateValue(part.slice(colonIdx + 1))
        });
      });
    });
    return rows.filter((row) => row.field);
  };

  const renderFieldCompareTable = (rows, { title = 'What Changed (Before → After)' } = {}) => {
    if (!rows || rows.length === 0) return null;
    const labelMap = {
      box_temp: 'Box Temperature',
      chamber_temp: 'Box Temperature',
      box_count: 'Box Count',
      client_name: 'Client Name',
      chamber_name: 'Chamber Name',
      chamber_type: 'Chamber Type',
      inspection_time: 'Inspection Time',
      shift: 'Shift',
      entry_date: 'Entry Date',
      monitor_supervisor_name: 'Supervisor Name',
      remarks: 'Remarks',
      overdue_time: 'Submission Delay',
      photo_capture_time: 'Photo Capture Time',
      temp_sensor_image: 'Sensor Photo',
      update_time: 'Update Time'
    };
    const nice = (field) => {
      const k = String(field || '').trim();
      return labelMap[k] || labelMap[k.toLowerCase()] || k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    };
    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1d4ed8', marginBottom: 8 }}>
          {title}
        </div>
        <div
          style={{
            width: '100%',
            border: '1px solid #bfdbfe',
            borderRadius: 10,
            overflow: 'hidden',
            backgroundColor: '#f8fafc'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.15fr 1fr 1fr',
              padding: '10px 12px',
              backgroundColor: '#dbeafe',
              borderBottom: '1px solid #bfdbfe',
              fontSize: '0.7rem',
              fontWeight: 800,
              color: '#1e3a8a',
              textTransform: 'uppercase'
            }}
          >
            <span>Field</span>
            <span>Before</span>
            <span>After</span>
          </div>
          {rows.map((row, idx) => (
            <div
              key={`${row.field}-${idx}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.15fr 1fr 1fr',
                gap: 10,
                padding: '11px 12px',
                borderBottom: idx === rows.length - 1 ? 'none' : '1px solid #e2e8f0',
                backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc'
              }}
            >
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>{nice(row.field)}</span>
              <span style={{ fontSize: '0.82rem', color: '#b91c1c', textDecoration: 'line-through', wordBreak: 'break-word' }}>
                {row.from}
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#15803d', wordBreak: 'break-word' }}>
                {row.to}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderUpdateDetailsReadable = (raw) => {
    const rows = parseUpdateDetails(raw);
    if (rows.length === 0) {
      return (
        <span className="profile-value" style={{ color: 'var(--text-muted)' }}>
          — No field changes recorded —
        </span>
      );
    }
    return renderFieldCompareTable(rows, { title: 'Update Details — Before → After' });
  };

  const resolveShiftLabel = (shift, inspectionTime, createdAt) => {
    const s = String(shift || '').trim();
    if (/^morning$/i.test(s)) return 'Morning';
    if (/^evening$/i.test(s)) return 'Evening';

    const t = String(inspectionTime || '').trim();
    const tUp = t.toUpperCase();
    if (/^10:00\b/.test(t) || tUp === '10:00 AM') return 'Morning';
    if (/^16:00\b|^18:00\b/.test(t) || tUp.includes('04:00 PM') || tUp.includes('06:00 PM')) {
      return 'Evening';
    }

    const hm = t.match(/^(\d{1,2}):(\d{2})/);
    if (hm) {
      let h = parseInt(hm[1], 10);
      if (tUp.includes('PM') && h < 12) h += 12;
      if (tUp.includes('AM') && h === 12) h = 0;
      return h < 14 ? 'Morning' : 'Evening';
    }

    if (createdAt) {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) return d.getHours() < 14 ? 'Morning' : 'Evening';
    }
    return 'Morning';
  };

  /** Chamber log detail — Quick Summary first, then full fields + update compare */
  const renderChamberLogFormView = (log, { enableCopyRef = false } = {}) => {
    if (!log) return null;
    const tempVal = log.chamber_temp ?? log.box_temp;
    const shiftLabel = resolveShiftLabel(log.shift, log.inspection_time, log.created_at);
    const updateRows = parseUpdateDetails(log.update_details);
    const hasUpdates = Number(log.update_count) > 0 || updateRows.length > 0;
    const entryDate = formatDateStr(log.formatted_date || log.entry_date) || '-';
    const boxCount =
      log.box_count !== undefined && log.box_count !== null ? String(log.box_count) : '-';

    const formField = (label, value, opts = {}) => (
      <div className="profile-item" style={opts.full ? { gridColumn: 'span 2' } : undefined}>
        <span className="profile-label">{label}</span>
        <span className="profile-value" style={opts.valueStyle || undefined}>
          {value}
        </span>
      </div>
    );

    const refNode = enableCopyRef ? (
      <span
        onClick={() => {
          if (log.reference_no) {
            navigator.clipboard.writeText(log.reference_no);
            setCopiedRef(log.reference_no);
            setTimeout(() => setCopiedRef(null), 1500);
          }
        }}
        title="Click to copy Reference Number"
        style={{
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 700,
          color: copiedRef === log.reference_no ? '#10b981' : 'var(--primary)'
        }}
      >
        {log.reference_no || '-'}
        {log.reference_no && (
          copiedRef === log.reference_no ? <Check size={12} color="#10b981" /> : <Copy size={10} style={{ opacity: 0.5 }} />
        )}
      </span>
    ) : (
      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{log.reference_no || '-'}</span>
    );

    return (
      <>
        <div
          className="profile-group-card"
          style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #f8fafc 100%)',
            border: '1px solid #bae6fd'
          }}
        >
          <div className="profile-group-title" style={{ color: '#0369a1' }}>
            Quick Summary
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12
            }}
          >
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Client Name</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', marginTop: 2 }}>{log.client_name || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Chamber</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', marginTop: 2 }}>{log.chamber_name || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Date</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', marginTop: 2 }}>{entryDate}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Time / Shift</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', marginTop: 2 }}>
                {log.inspection_time || '-'} · {shiftLabel}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Temperature</div>
              <div
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  marginTop: 2,
                  color: tempVal != null && Number(tempVal) <= -18 ? '#15803d' : '#b91c1c'
                }}
              >
                {tempVal != null ? `${tempVal}°C` : '-'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Boxes</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', marginTop: 2 }}>{boxCount}</div>
            </div>
          </div>

          {hasUpdates ? (
            <div
              style={{
                marginTop: 14,
                padding: '10px 12px',
                borderRadius: 8,
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa'
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#c2410c', marginBottom: 4 }}>
                Updated {Number(log.update_count) > 0 ? log.update_count : updateRows.length}{' '}
                {Number(log.update_count) === 1 ? 'time' : 'times'}
                {log.updated_at ? ` · Last: ${formatDateTimeStr(log.updated_at)}` : ''}
              </div>
              {updateRows.length > 0
                ? renderFieldCompareTable(updateRows, { title: 'Before → After' })
                : (
                  <div style={{ fontSize: '0.78rem', color: '#9a3412' }}>
                    This record was updated, but field-level before/after details were not saved.
                  </div>
                )}
            </div>
          ) : (
            <div style={{ marginTop: 12, fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>
              No updates yet — original submitted values below.
            </div>
          )}
        </div>

        <div className="profile-group-card">
          <div className="profile-group-title">Full Log Details</div>
          <div className="profile-grid-list">
            {formField('Entry Date', entryDate)}
            {formField('Reference No', refNode)}
            {formField('Client Name', log.client_name || '-')}
            {formField('Chamber Name', log.chamber_name || '-')}
            {formField('Chamber Type', log.chamber_type || 'Frozen')}
            {formField('Inspection Time', log.inspection_time || '-')}
            {formField('Shift', shiftLabel)}
            {formField(
              'Box Temp (°C)',
              tempVal != null ? `${tempVal}°C` : '-',
              {
                valueStyle: {
                  fontWeight: 700,
                  color: tempVal != null && Number(tempVal) <= -18 ? '#15803d' : '#b91c1c'
                }
              }
            )}
            {formField('Box Count', boxCount)}
            {formField('Supervisor Name', log.monitor_supervisor_name || '-')}
            {formField('Warehouse', log.warehouse_name || 'Generic')}
            {formField('Operator', renderOperatorEmail(log.operator_email))}
            {formField(
              'Photo Capture Time',
              log.photo_capture_time ? formatDateTimeStr(log.photo_capture_time) : '-'
            )}
            {formField(
              'Time Variance',
              log.time_variance_minutes !== undefined && log.time_variance_minutes !== null
                ? `${log.time_variance_minutes} mins`
                : '-'
            )}
            {formField('Submission Delay', log.overdue_time || 'same day', {
              valueStyle:
                log.overdue_time && log.overdue_time !== 'same day'
                  ? { color: '#dc2626', fontWeight: 700 }
                  : undefined
            })}
            {formField('Source', Number(log.is_native) === 1 ? 'Mobile Native App' : 'Web / Monitor')}
            {formField('Created At', formatDateTimeStr(log.created_at) || '-')}
            {formField('Updated At', log.updated_at ? formatDateTimeStr(log.updated_at) : '-')}
            {formField(
              'Update Count',
              Number(log.update_count) > 0 ? String(log.update_count) : '0'
            )}
            {formField('Remarks', log.remarks || '—', { full: true })}
          </div>
        </div>
      </>
    );
  };

  // Security & Access Logs States
  const [securitySearch, setSecuritySearch] = useState('');
  const [securityFromDate, setSecurityFromDate] = useState('');
  const [securityToDate, setSecurityToDate] = useState('');
  const [securityActionFilter, setSecurityActionFilter] = useState('All');
  const [securityCurrentPage, setSecurityCurrentPage] = useState(1);
  const [securityPerPage] = useState(50);

  // System & Error Logs States
  const [systemSearch, setSystemSearch] = useState('');
  const [systemFromDate, setSystemFromDate] = useState('');
  const [systemToDate, setSystemToDate] = useState('');
  const [systemActionFilter, setSystemActionFilter] = useState('All');
  const [systemCurrentPage, setSystemCurrentPage] = useState(1);
  const [systemPerPage] = useState(50);

  const [dashboardStats, setDashboardStats] = useState({
    totalLeads: 0,
    totalSubAdmins: 0,
    totalOperators: 0
  });



  // Inventory Log States
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [inventoryError, setInventoryError] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryWarehouseFilter, setInventoryWarehouseFilter] = useState('All');
  const [inventoryDiscrepancyFilter, setInventoryDiscrepancyFilter] = useState(false);
  const [inventorySubView, setInventorySubView] = useState('main'); // 'main' | 'breakdown'
  const [breakdownCurrentPage, setBreakdownCurrentPage] = useState(1);
  const [breakdownPerPage] = useState(15);

  // Daily Box Tracker — live warehouse → client cascading filters (from DB)
  const [inventoryFilterOptions, setInventoryFilterOptions] = useState({ warehouses: [], total_warehouses: 0, total_clients: 0 });
  const [dailyDeltas, setDailyDeltas] = useState([]);
  const [loadingDeltas, setLoadingDeltas] = useState(false);
  const [deltasError, setDeltasError] = useState('');
  const [deltasWarehouseFilter, setDeltasWarehouseFilter] = useState('All');
  const [deltasClientFilter, setDeltasClientFilter] = useState('All');
  const [deltasCurrentPage, setDeltasCurrentPage] = useState(1);
  const [deltasPerPage] = useState(15);
  const [deltasViewClient, setDeltasViewClient] = useState(null); // selected row for View detail
  const [deltasViewHistoryPage, setDeltasViewHistoryPage] = useState(1);
  const [deltasViewHistoryPerPage] = useState(10);

  const loadDailyBoxTrackerData = async (warehouseOverride) => {
    const warehouse = warehouseOverride !== undefined ? warehouseOverride : deltasWarehouseFilter;
    setLoadingDeltas(true);
    setDeltasError('');
    try {
      const [filterData, deltaRows] = await Promise.all([
        fetchInventoryFilterOptions(),
        fetchDailyInventoryDeltas({
          warehouse: warehouse && warehouse !== 'All' ? warehouse : undefined
        })
      ]);
      setInventoryFilterOptions({
        warehouses: Array.isArray(filterData?.warehouses) ? filterData.warehouses : [],
        total_warehouses: Number(filterData?.total_warehouses) || 0,
        total_clients: Number(filterData?.total_clients) || 0
      });
      setDailyDeltas(Array.isArray(deltaRows) ? deltaRows : []);
      setDeltasViewClient((prev) => {
        if (!prev) return null;
        const match = (Array.isArray(deltaRows) ? deltaRows : []).find((r) =>
          r.client_name === prev.client_name &&
          String(r.chamber_name || '') === String(prev.chamber_name || '') &&
          String(r.warehouse_name || '') === String(prev.warehouse_name || '')
        );
        return match || prev;
      });
      setDeltasCurrentPage(1);
    } catch (err) {
      console.error('Failed to load Daily Box Tracker data:', err);
      setDeltasError(err.message || 'Failed to load warehouse inventory data.');
      setInventoryFilterOptions({ warehouses: [], total_warehouses: 0, total_clients: 0 });
      setDailyDeltas([]);
    } finally {
      setLoadingDeltas(false);
    }
  };

  const loadInventoryReconciliationData = async () => {
    setLoadingInventory(true);
    setInventoryError('');
    try {
      const data = await fetchInventoryReconciliation({
        search: inventorySearch.trim(),
        warehouse: inventoryWarehouseFilter
      });
      setInventoryLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch inventory logs:', err);
      setInventoryError(err.message || 'Failed to fetch inventory reconciliation logs.');
      setInventoryLogs([]);
    } finally {
      setLoadingInventory(false);
    }
  };


  // Customers Management States
  const [subAdmins, setSubAdmins] = useState([]);
  const [subAdminSearch, setSubAdminSearch] = useState('');
  const [loadingSubAdmins, setLoadingSubAdmins] = useState(false);
  const [subAdminSuccess, setSubAdminSuccess] = useState('');
  const [subAdminError, setSubAdminError] = useState('');
  const [savingSubAdmin, setSavingSubAdmin] = useState(false);
  const [subAdminProcessStatus, setSubAdminProcessStatus] = useState('');
  const [subAdminEmail, setSubAdminEmail] = useState('');
  const [subAdminPassword, setSubAdminPassword] = useState('');
  const [subAdminFullName, setSubAdminFullName] = useState('');
  const [subAdminPhoneNo, setSubAdminPhoneNo] = useState('');
  const [editingSubAdmin, setEditingSubAdmin] = useState(null);

  // Access Scope States (Client & Warehouse restrictions)
  const [accessScopeOptions, setAccessScopeOptions] = useState({
    clients: [],
    warehouses: [],
    warehouseClients: {}
  });
  const [subAdminSelectedClients, setSubAdminSelectedClients] = useState([]);
  const [subAdminSelectedWarehouses, setSubAdminSelectedWarehouses] = useState([]);

  // Customer Reports (from Customer portal → customer_reports table)
  const [customerReports, setCustomerReports] = useState([]);
  const [loadingCustomerReports, setLoadingCustomerReports] = useState(false);
  const [customerReportsError, setCustomerReportsError] = useState('');
  const [customerReportSearch, setCustomerReportSearch] = useState('');
  const [customerReportStatusFilter, setCustomerReportStatusFilter] = useState('All');
  const [updatingReportId, setUpdatingReportId] = useState(null);
  const [customerReportsTab, setCustomerReportsTab] = useState('issues'); // issues | notes
  const [noteThreads, setNoteThreads] = useState([]);
  const [noteMessages, setNoteMessages] = useState([]);
  const [selectedNoteCustomer, setSelectedNoteCustomer] = useState('All');
  const [noteDraft, setNoteDraft] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [sendingNote, setSendingNote] = useState(false);
  const [notesError, setNotesError] = useState('');
  const notesChatEndRef = useRef(null);

  // Real-time ticking clock for header
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadCustomerReportsData = async () => {
    setLoadingCustomerReports(true);
    setCustomerReportsError('');
    try {
      const data = await fetchCustomerReports({
        status: customerReportStatusFilter,
        search: customerReportSearch.trim()
      });
      setCustomerReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch customer reports:', err);
      setCustomerReportsError(err.message || 'Failed to fetch customer reports.');
      setCustomerReports([]);
    } finally {
      setLoadingCustomerReports(false);
    }
  };

  const handleUpdateCustomerReportStatus = async (id, status) => {
    setUpdatingReportId(id);
    setCustomerReportsError('');
    try {
      await updateCustomerReportStatus(id, status);
      await loadCustomerReportsData();
    } catch (err) {
      setCustomerReportsError(err.message || 'Failed to update status.');
    } finally {
      setUpdatingReportId(null);
    }
  };

  const handleDeleteCustomerReport = async (id) => {
    if (!window.confirm('Delete this customer report permanently?')) return;
    setUpdatingReportId(id);
    setCustomerReportsError('');
    try {
      await deleteCustomerReport(id);
      await loadCustomerReportsData();
    } catch (err) {
      setCustomerReportsError(err.message || 'Failed to delete report.');
    } finally {
      setUpdatingReportId(null);
    }
  };

  const loadNoteThreads = async () => {
    setLoadingNotes(true);
    setNotesError('');
    try {
      const data = await fetchCustomerNoteThreads();
      setNoteThreads(Array.isArray(data) ? data : []);
    } catch (err) {
      setNotesError(err.message || 'Failed to load note threads.');
      setNoteThreads([]);
    } finally {
      setLoadingNotes(false);
    }
  };

  const loadNoteMessages = async (email) => {
    const clean = String(email || '').trim();
    setLoadingNotes(true);
    setNotesError('');
    try {
      const data =
        !clean || clean === 'All'
          ? await fetchCustomerNotes({})
          : await fetchCustomerNotes({ customer_email: clean.toLowerCase() });
      setNoteMessages(Array.isArray(data) ? data : []);
      setTimeout(() => notesChatEndRef.current?.scrollIntoView?.({ behavior: 'smooth' }), 80);
    } catch (err) {
      setNotesError(err.message || 'Failed to load notes.');
      setNoteMessages([]);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleSelectNoteCustomer = async (email) => {
    const raw = String(email || '').trim();
    const clean = raw === 'All' || !raw ? 'All' : raw.toLowerCase();
    setSelectedNoteCustomer(clean);
    setNoteDraft('');
    await loadNoteMessages(clean);
  };

  const handleSendCustomerNote = async () => {
    const msg = String(noteDraft || '').trim();
    if (!msg) {
      setNotesError('Type a note message.');
      return;
    }
    const isBroadcast = !selectedNoteCustomer || selectedNoteCustomer === 'All';
    setSendingNote(true);
    setNotesError('');
    try {
      if (isBroadcast) {
        let customers = Array.isArray(subAdmins) ? subAdmins : [];
        if (!customers.length) {
          try {
            customers = (await fetchSubAdmins()) || [];
            setSubAdmins(customers);
          } catch (_) {
            /* keep empty */
          }
        }
        const emails = [
          ...new Set(
            customers
              .map((c) => String(c?.email || '').trim().toLowerCase())
              .filter(Boolean)
          )
        ];
        if (!emails.length) {
          setNotesError('No customers found. Add customers first, then send to All.');
          return;
        }
        const ok = window.confirm(
          `All customers selected.\n\nSend this note to ${emails.length} customer(s)?`
        );
        if (!ok) return;

        // Prefer server broadcast; if unavailable, send one note per customer.
        let sentCount = 0;
        try {
          const result = await postCustomerNote({
            message: msg,
            broadcast: true,
            customer_email: 'All'
          });
          sentCount = Number(result?.count) || emails.length;
        } catch (_) {
          for (const email of emails) {
            await postCustomerNote({ customer_email: email, message: msg });
            sentCount += 1;
          }
        }

        setNoteDraft('');
        await Promise.all([loadNoteMessages('All'), loadNoteThreads()]);
        window.alert(`Note sent to ${sentCount} customer(s).`);
      } else {
        await postCustomerNote({ customer_email: selectedNoteCustomer, message: msg });
        setNoteDraft('');
        await Promise.all([loadNoteMessages(selectedNoteCustomer), loadNoteThreads()]);
      }
    } catch (err) {
      setNotesError(err.message || 'Failed to send note.');
    } finally {
      setSendingNote(false);
    }
  };

  const handleDeleteCustomerNote = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await deleteCustomerNote(id);
      await Promise.all([loadNoteMessages(selectedNoteCustomer), loadNoteThreads()]);
    } catch (err) {
      setNotesError(err.message || 'Failed to delete note.');
    }
  };



  const loadOperatorsData = async () => {
    setLoadingOps(true);
    setOpError('');
    try {
      const data = await fetchOperators();
      setOperators(Array.isArray(data) ? data : []);
    } catch (err) {
      setOpError(err.message || 'Failed to fetch operators.');
    } finally {
      setLoadingOps(false);
    }
  };

  const loadActivities = async () => {
    if (auditSubTab === 'permission_log') return;

    const category =
      auditSubTab === 'security_log' ? 'security' :
      auditSubTab === 'system_errors' ? 'system' :
      auditSubTab === 'do_changes' ? 'do_changes' :
      'activity';

    const page =
      category === 'security' ? securityCurrentPage :
      category === 'system' ? systemCurrentPage :
      activitiesCurrentPage;

    const limit =
      category === 'security' ? securityPerPage :
      category === 'system' ? systemPerPage :
      activitiesPerPage;

    const search =
      category === 'security' ? securitySearch :
      category === 'system' ? systemSearch :
      activitiesSearch;

    const fromDate =
      category === 'security' ? securityFromDate :
      category === 'system' ? systemFromDate :
      activitiesFromDate;

    const toDate =
      category === 'security' ? securityToDate :
      category === 'system' ? systemToDate :
      activitiesToDate;

    const action =
      category === 'security' ? securityActionFilter :
      category === 'system' ? systemActionFilter :
      activitiesActionFilter;

    setLoadingActivities(true);
    setLogsError('');
    try {
      const data = await fetchOperatorActivities({
        paginated: true,
        page,
        limit,
        category,
        search: (search || '').trim() || undefined,
        fromDate: toApiDateParam(fromDate) || undefined,
        toDate: toApiDateParam(toDate) || undefined,
        action: action !== 'All' ? action : undefined,
        warehouse: category === 'activity' && selectedWarehouseFilter !== 'All'
          ? selectedWarehouseFilter
          : undefined
      });
      setActivities(Array.isArray(data?.items) ? data.items : []);
      setActivitiesTotal(Number(data?.total) || 0);
      if (category === 'do_changes') {
        const nowStr = new Date().toISOString();
        localStorage.setItem('last_checked_do_changes', nowStr);
        setLastCheckedDOChanges(nowStr);
        setHasNewDOChanges(false);
      }
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
      setLogsError(err.message || 'Failed to fetch activity logs.');
      setActivities([]);
      setActivitiesTotal(0);
    } finally {
      setLoadingActivities(false);
    }
  };

  // Permission Requests State & Handlers
  const [permissionRequests, setPermissionRequests] = useState([]);
  const [loadingPermRequests, setLoadingPermRequests] = useState(false);

  const loadPermissionRequests = async (silent = false) => {
    if (!silent) {
      setLoadingPermRequests(true);
      setLogsError('');
    }
    try {
      const data = await fetchPermissionRequests();
      setPermissionRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch permission requests:', err);
      if (!silent) {
        setLogsError(err.message || 'Failed to fetch permission requests.');
      }
    } finally {
      if (!silent) {
        setLoadingPermRequests(false);
      }
    }
  };

  useEffect(() => {
    loadPermissionRequests(true);
    const interval = setInterval(() => {
      loadPermissionRequests(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApproveDenyPermission = async (id, status) => {
    setLogsError('');
    try {
      const res = await updatePermissionRequest(id, status);
      loadPermissionRequests();
      loadActivities();
      // Chamber Add approve bumps chamber_limit — refresh Operators Directory
      if (status === 'Approved') {
        loadOperatorsData();
      }
      if (res?.chamber_add?.ok) {
        setOpSuccess(
          `Chamber "${res.chamber_add.name}" added. Operator limit → ${res.chamber_add.chamber_limit}.`
        );
      }
    } catch (err) {
      console.error('Failed to update permission request:', err);
      setLogsError(err.message || 'Failed to update permission request.');
    }
  };

  const [systemConfig, setSystemConfig] = useState({
      Chamber_Edit: 'Require Approval',
    Chamber_Delete: 'Require Approval',
    ChamberMaster_Edit: 'Require Approval',
    ChamberMaster_Delete: 'Require Approval',
    ClientMaster_Edit: 'Allow',
    ClientMaster_Delete: 'Allow',
    Inward_Edit: 'Require Approval',
    Inward_Delete: 'Require Approval',
    Outward_Edit: 'Require Approval',
    Outward_Delete: 'Require Approval',
  });
  const [loadingConfig, setLoadingConfig] = useState(false);

  const loadSystemConfig = async () => {
    setLoadingConfig(true);
    setLogsError('');
    try {
      const data = await fetchSystemConfig();
      setSystemConfig(data);
    } catch (err) {
      console.error('Failed to load system config:', err);
      setLogsError(err.message || 'Failed to load system config.');
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleToggleConfig = async (configKey, currentVal) => {
    const newVal = currentVal === 'Allow' ? 'Require Approval' : 'Allow';
    setLogsError('');
    try {
      await updateSystemConfig(configKey, newVal);
      setSystemConfig(prev => ({
        ...prev,
        [configKey]: newVal
      }));
      loadActivities();
    } catch (err) {
      console.error('Failed to update configuration setting:', err);
      setLogsError(err.message || 'Failed to update configuration setting.');
    }
  };

  const parseRequestDescription = (descText, recordType = '') => {
    const info = {
      module: '-',
      client: '-',
      refNo: '',
      extra: '-'
    };
    if (!descText && !recordType) return info;
    
    const parts = (descText || '').split(' | ');
    
    if (recordType === 'MasterSetup' || (descText || '').includes('Master Setup') || (descText || '').includes('chambers & clients')) {
      info.module = 'Master Setup';
      info.client = 'Chambers & Clients';
      info.refNo = 'OPEN';
      info.extra = descText || 'Master Setup opens without Super Admin approval.';
      return info;
    } else if (
      recordType === 'ChamberMaster' ||
      (descText || '').includes('delete chamber') ||
      (descText || '').includes('ADD chamber')
    ) {
      if (/ADD chamber/i.test(descText || '')) info.module = 'Chamber Add';
      else info.module = 'Chamber Delete';
      const nameMatch =
        (descText || '').match(/ADD chamber "([^"]+)"/i) ||
        (descText || '').match(/delete chamber "([^"]+)"/i);
      info.client = nameMatch ? nameMatch[1] : 'Chamber';
      info.refNo = info.module === 'Chamber Add' ? 'ADD' : 'DELETE';
      info.extra = descText || 'Data Operator requested Super Admin approval for chamber master.';
      return info;
    } else if (
      recordType === 'ClientMaster' ||
      (descText || '').includes('client master') ||
      (descText || '').includes('EDIT client') ||
      (descText || '').includes('DELETE client') ||
      (descText || '').includes('edited client')
    ) {
      const isDelete = /DELETE client/i.test(descText || '');
      info.module = isDelete ? 'Client Notify' : 'Client Notify';
      const clientMatch =
        (descText || '').match(/EDIT client "([^"]+)"/i) ||
        (descText || '').match(/DELETE client "([^"]+)"/i) ||
        (descText || '').match(/client master "([^"]+)"/i) ||
        (descText || '').match(/client "([^"]+)"/i);
      const chamberMatch = (descText || '').match(/on chamber "([^"]+)"/i);
      const renameTo = (descText || '').match(/EDIT client "[^"]+"\s*(?:→|->)\s*"([^"]+)"/i);
      info.client = renameTo
        ? `${clientMatch ? clientMatch[1] : 'Client'} → ${renameTo[1]}`
        : (clientMatch ? clientMatch[1] : 'Client');
      info.refNo = 'NOTIFY';
      info.extra = chamberMatch
        ? `${chamberMatch[1]} · Notification only (approval not required)`
        : (descText || 'Client master change notified to Super Admin (approval not required).');
      return info;
    } else if ((descText || '').includes('Chamber')) {
      info.module = 'Chamber Temp';
    } else if ((descText || '').includes('Inward')) {
      info.module = 'Inward DO Log';
    } else if ((descText || '').includes('Outward')) {
      info.module = 'Outward DO Log';
    }
    
    // Match Ref: RF-XX-26-XXXX or ID: XX
    const refMatch = (descText || '').match(/\((?:Ref|ID):\s*([^\)]+)\)/i);
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

  const loadRecordAllowHistory = async (type, log) => {
    if (!log) {
      setRecordAllowHistory([]);
      return;
    }
    const recordType =
      type === 'daily' || type === 'Chamber' ? 'Chamber' :
      type === 'inward' || type === 'Inward' ? 'Inward' :
      type === 'outward' || type === 'Outward' ? 'Outward' :
      type || 'Chamber';
    const recordId =
      recordType === 'Inward'
        ? (log.inward_id || log.id)
        : recordType === 'Outward'
          ? (log.outward_id || log.id)
          : (log.id || log.chamber_id);
    if (!recordId) {
      setRecordAllowHistory([]);
      return;
    }
    setLoadingAllowHistory(true);
    try {
      const data = await fetchRecordPermissionHistory(recordType, recordId);
      setRecordAllowHistory(Array.isArray(data?.items) ? data.items : []);
    } catch (_) {
      setRecordAllowHistory([]);
    } finally {
      setLoadingAllowHistory(false);
    }
  };

  const formatAllowDate = (value) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (_) {
      return String(value);
    }
  };

  /** Structured Super Allow / update trail for History Log + Profile Lookup */
  const renderSuperAllowSection = (logForCompare = null) => {
    const latestCompareRows = parseUpdateDetails(logForCompare?.update_details);
    const hasTrail = recordAllowHistory.length > 0;
    const hasCompare = latestCompareRows.length > 0;

    return (
    <div
      className="profile-group-card"
      style={{
        marginTop: 12,
        border: '1px solid #bfdbfe',
        background: 'linear-gradient(180deg, #eff6ff 0%, #ffffff 48%)'
      }}
    >
      <div className="profile-group-title" style={{ color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 8 }}>
        <ShieldCheck size={16} color="#1d4ed8" />
        Approval & Update Comparison
      </div>
      <p style={{ margin: '0 0 12px 0', fontSize: '0.74rem', color: '#64748b' }}>
        After Super Admin approval — compare previous and updated values, remarks, and decision date
      </p>

      {hasCompare ? (
        <div style={{ marginBottom: 12, padding: 12, borderRadius: 10, border: '1px solid #86efac', background: '#f0fdf4' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#15803d', marginBottom: 4 }}>
            Latest field changes after approval / update
            {Number(logForCompare?.update_count) > 0 ? ` · Edit #${logForCompare.update_count}` : ''}
          </div>
          {renderFieldCompareTable(latestCompareRows, { title: 'Compare: Before → After' })}
          {logForCompare?.updated_at || logForCompare?.inward_updated_at || logForCompare?.outward_updated_at ? (
            <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
              Last updated: {formatAllowDate(
                logForCompare.updated_at || logForCompare.inward_updated_at || logForCompare.outward_updated_at
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {loadingAllowHistory ? (
        <div style={{ padding: '12px 0', color: '#64748b', fontSize: '0.8rem' }}>Loading approval history…</div>
      ) : !hasTrail ? (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem' }}>
          {hasCompare
            ? 'Field comparison is available above. No separate approval request history for this record yet.'
            : 'No Super Admin approval or update history is stored for this record yet.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recordAllowHistory.map((ev) => {
            const decision = String(ev.decision || '');
            const badgeBg =
              decision === 'Approved' ? '#dcfce7' :
              decision === 'Denied' ? '#fee2e2' :
              decision === 'Pending' ? '#fef9c3' :
              decision === 'Used' || decision === 'UPDATE' ? '#e0e7ff' :
              '#e2e8f0';
            const badgeFg =
              decision === 'Approved' ? '#15803d' :
              decision === 'Denied' ? '#b91c1c' :
              decision === 'Pending' ? '#a16207' :
              decision === 'Used' || decision === 'UPDATE' ? '#3730a3' :
              '#475569';
            const changeRows = Array.isArray(ev.change_rows) && ev.change_rows.length
              ? ev.change_rows
              : parseUpdateDetails(ev.changes || '');
            return (
              <div
                key={ev.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '12px 14px',
                  background: '#fff'
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    background: badgeBg,
                    color: badgeFg
                  }}>
                    {ev.event_label || ev.action}
                  </span>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    background: '#f1f5f9',
                    color: '#475569'
                  }}>
                    {ev.request_type || '—'}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 700, color: '#0f172a' }}>
                    {formatAllowDate(ev.date)}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, fontSize: '0.78rem' }}>
                  <div>
                    <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Decision</div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{ev.decision || ev.action || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Operator</div>
                    <div style={{ fontWeight: 600, color: '#334155' }}>{renderOperatorEmail(ev.operator_email)}</div>
                  </div>
                  {ev.decided_by ? (
                    <div>
                      <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Decided By</div>
                      <div style={{ fontWeight: 600, color: '#334155' }}>{ev.decided_by}</div>
                    </div>
                  ) : null}
                </div>

                {changeRows.length > 0
                  ? renderFieldCompareTable(changeRows, { title: 'Changed fields after approval' })
                  : (ev.changes ? (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>What updated</div>
                      <div style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 600 }}>{ev.changes}</div>
                    </div>
                  ) : null)}

                {(ev.remark || ev.sa_remark) ? (
                  <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                    {ev.remark ? (
                      <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>Remark</div>
                        <div style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 600 }}>{ev.remark}</div>
                      </div>
                    ) : null}
                    {ev.sa_remark ? (
                      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase' }}>Super Admin Remark</div>
                        <div style={{ fontSize: '0.8rem', color: '#1e3a8a', fontWeight: 600 }}>{ev.sa_remark}</div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {ev.description && !changeRows.length ? (
                  <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#64748b', lineHeight: 1.45 }}>
                    {ev.description}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
    );
  };

  const showLogDetailsByRef = async (refNo, fallbackId, moduleType) => {
    if (!refNo && !fallbackId) return;
    
    let foundLog = null;
    let type = '';
    
    // 1. Try matching reference number first (in-memory page cache)
    if (refNo) {
      const chamberLog = (chamberLogs || []).find(l => l && l.reference_no === refNo);
      if (chamberLog) {
        foundLog = chamberLog;
        type = 'daily';
      } else {
        const inwardLog = (inwardLogs || []).find(l => l && l.reference_no === refNo);
        if (inwardLog) {
          foundLog = inwardLog;
          type = 'inward';
        } else {
          const outwardLog = (outwardLogs || []).find(l => l && l.reference_no === refNo);
          if (outwardLog) {
            foundLog = outwardLog;
            type = 'outward';
          }
        }
      }
    }
    
    // 2. Try matching fallback ID (in-memory)
    if (!foundLog && fallbackId) {
      if (moduleType === 'Chamber Temp' || moduleType === 'Chamber Temp Log' || moduleType === 'Chamber') {
        foundLog = (chamberLogs || []).find(l => l && l.id == fallbackId);
        type = 'daily';
      } else if (moduleType === 'Inward DO Log' || moduleType === 'Inward DO' || moduleType === 'Inward' || moduleType === 'Inward Log') {
        foundLog = (inwardLogs || []).find(l => l && l.inward_id == fallbackId);
        type = 'inward';
      } else if (moduleType === 'Outward DO Log' || moduleType === 'Outward DO' || moduleType === 'Outward' || moduleType === 'Outward Log') {
        foundLog = (outwardLogs || []).find(l => l && l.outward_id == fallbackId);
        type = 'outward';
      }
    }

    // 3. Server lookup when not in current page cache
    if (!foundLog && refNo) {
      try {
        const searchOpts = { paginated: true, search: refNo, page: 1, limit: 20 };
        const [c, i, o] = await Promise.all([
          fetchChamberLogs('', searchOpts),
          fetchInwardLogs('', searchOpts),
          fetchOutwardLogs('', searchOpts)
        ]);
        foundLog =
          (c.items || []).find(l => l.reference_no === refNo) ||
          (i.items || []).find(l => l.reference_no === refNo) ||
          (o.items || []).find(l => l.reference_no === refNo);
        if (foundLog) {
          if ((c.items || []).some(l => l.reference_no === refNo)) type = 'daily';
          else if ((i.items || []).some(l => l.reference_no === refNo)) type = 'inward';
          else type = 'outward';
        }
      } catch (err) {
        console.error('Failed to resolve log by ref:', err);
      }
    }
    
    if (foundLog) {
      setSelectedDetailLog(foundLog);
      setDetailType(type);
      loadRecordAllowHistory(type, foundLog);
    } else {
      setRecordAllowHistory([]);
      alert(`Record details not loaded in system view yet. Reference: ${refNo || ('ID #' + fallbackId)}. Please view it inside History Logs tab or Profile Lookup.`);
    }
  };

  const renderOperatorEmail = (email) => {
    if (!email) return '-';
    const emailLower = email.toLowerCase().trim();
    const matchedOp = (operators || []).find(
      (op) => op && op.email && op.email.toLowerCase().trim() === emailLower
    );
    const doName = matchedOp?.full_name ? String(matchedOp.full_name).trim() : '';

    if (emailLower === 'system' || (emailLower.includes('admin') && !matchedOp)) {
      return email;
    }

    const isActive = Boolean(matchedOp);
    const identity = doName ? (
      <span style={{ display: 'inline-flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
        <span style={{ fontWeight: 800, color: '#0f172a' }}>{doName}</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>{email}</span>
      </span>
    ) : (
      <span>{email}</span>
    );

    if (!isActive) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4.5px' }}>
          {identity}
          <span style={{ 
            fontSize: '0.62rem', 
            fontWeight: '800', 
            color: '#ef4444', 
            backgroundColor: '#fee2e2', 
            padding: '1px 5px', 
            borderRadius: '4px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap'
          }}>
            Past DO
          </span>
        </span>
      );
    }
    return identity;
  };

  const formatDuration = (hoursStr, minsStr) => {
    const hours = parseInt(hoursStr) || 0;
    const mins = parseInt(minsStr) || 0;
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remHours = hours % 24;
      return `${days}d ${remHours}h ${mins}m`;
    }
    return `${hours}h ${mins}m`;
  };

  const getUpdateDiff = (created, updated) => {
    if (!created || !updated) return false;
    const cTime = Math.floor(new Date(created).getTime() / 1000);
    const uTime = Math.floor(new Date(updated).getTime() / 1000);
    return uTime > cTime;
  };

  const operatorWarehouseMap = {};
  (operators || []).forEach(op => {
    if (op && op.email && op.warehouse_name) {
      operatorWarehouseMap[op.email.toLowerCase()] = op.warehouse_name;
    }
  });
  const warehousesList = Array.from(new Set((operators || []).map(op => op && op.warehouse_name).filter(Boolean)));

  const loadDashboardStatsData = async () => {
    try {
      const stats = await fetchDashboardStats();
      if (stats) {
        setDashboardStats(stats);
      }
      checkNewDOChanges();
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    }
  };

  const checkNewDOChanges = async () => {
    try {
      const data = await fetchOperatorActivities({
        paginated: true,
        page: 1,
        limit: 1,
        category: 'do_changes'
      });
      const latestLog = data?.items && data.items.length > 0 ? data.items[0] : null;
      if (latestLog && latestLog.created_at) {
        const logTime = new Date(latestLog.created_at).getTime();
        const lastCheckTime = new Date(localStorage.getItem('last_checked_do_changes') || '1970-01-01T00:00:00.000Z').getTime();
        if (logTime > lastCheckTime) {
          setHasNewDOChanges(true);
        } else {
          setHasNewDOChanges(false);
        }
      } else {
        setHasNewDOChanges(false);
      }
    } catch (err) {
      console.warn('Failed to check for new DO changes:', err);
    }
  };

  useEffect(() => {
    checkNewDOChanges();
    const interval = setInterval(() => {
      checkNewDOChanges();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadHistoryLogs = async () => {
    setLoadingLogs(true);

    const opts = {
      paginated: true,
      page: historyPage,
      limit: historyPerPage,
      search: appliedLogsSearch,
      fromDate: toApiDateParam(appliedFromDate),
      toDate: toApiDateParam(appliedToDate),
      warehouse: selectedWarehouse !== 'All' ? selectedWarehouse : undefined
    };

    try {
      if (historyTab === 'daily') {
        const data = await fetchChamberLogs('', opts);
        setChamberLogs(Array.isArray(data?.items) ? data.items : []);
        setHistoryTotal(data?.total ?? 0);
      } else if (historyTab === 'inward') {
        const data = await fetchInwardLogs('', opts);
        setInwardLogs(Array.isArray(data?.items) ? data.items : []);
        setHistoryTotal(data?.total ?? 0);
      } else {
        const data = await fetchOutwardLogs('', opts);
        setOutwardLogs(Array.isArray(data?.items) ? data.items : []);
        setHistoryTotal(data?.total ?? 0);
      }
    } catch (err) {
      console.error('Error loading history logs:', err);
      if (historyTab === 'daily') setChamberLogs([]);
      else if (historyTab === 'inward') setInwardLogs([]);
      else setOutwardLogs([]);
      setHistoryTotal(0);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeMenu === 'dashboard') {
      loadOperatorsData();
      loadDashboardStatsData();
      loadSubAdminsData();
      loadCustomerReportsData();
      checkNewDOChanges();
    } else if (activeMenu === 'customers') {
      loadSubAdminsData();
      loadAccessScopeOptions();
    } else if (activeMenu === 'customer_reports') {
      loadCustomerReportsData();
      loadSubAdminsData();
      loadNoteThreads();
      loadNoteMessages('All');
    } else if (activeMenu === 'data_operators') {
      loadAccessScopeOptions();
      loadOperatorsData();
    } else if (activeMenu === 'user_management') {
      loadSubAdminsData();
      loadAccessScopeOptions();
      loadOperatorsData();
    } else if (activeMenu === 'activity_logs') {
      loadOperatorsData();
      loadPermissionRequests();
      loadSystemConfig();
    } else if (activeMenu === 'history_logs' || activeMenu === 'profile_lookup') {
      loadOperatorsData();
    } else if (activeMenu === 'inventory_log') {
      loadOperatorsData();
      loadInventoryReconciliationData();
    } else if (activeMenu === 'daily_box_tracker') {
      loadDailyBoxTrackerData();
    }
  }, [activeMenu]);

  useEffect(() => {
    if (activeMenu !== 'inventory_log') return;
    const timer = setTimeout(() => {
      loadInventoryReconciliationData();
    }, 280);
    return () => clearTimeout(timer);
  }, [activeMenu, inventorySearch, inventoryWarehouseFilter]);

  useEffect(() => {
    if (activeMenu !== 'history_logs') return;
    loadHistoryLogs();
  }, [activeMenu, historyTab, historyPage, appliedFromDate, appliedToDate, appliedLogsSearch, selectedWarehouse]);

  useEffect(() => {
    setHistoryPage(1);
  }, [historyTab]);

  useEffect(() => {
    if (activeMenu !== 'activity_logs') return;
    if (auditSubTab === 'permission_log') return;
    const timer = setTimeout(() => {
      loadActivities();
    }, 280);
    return () => clearTimeout(timer);
  }, [
    activeMenu,
    auditSubTab,
    activitiesCurrentPage,
    securityCurrentPage,
    systemCurrentPage,
    activitiesSearch,
    activitiesFromDate,
    activitiesToDate,
    activitiesActionFilter,
    securitySearch,
    securityFromDate,
    securityToDate,
    securityActionFilter,
    systemSearch,
    systemFromDate,
    systemToDate,
    systemActionFilter,
    selectedWarehouseFilter
  ]);

  useEffect(() => {
    setActivitiesCurrentPage(1);
    setSecurityCurrentPage(1);
    setSystemCurrentPage(1);
    setActivities([]);
    setActivitiesTotal(0);
  }, [auditSubTab]);

  const handleLookupSearch = async () => {
    const q = lookupQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearchedRecord(null);
      return;
    }

    setLoadingLogs(true);
    try {
      const searchOpts = { paginated: true, search: q, page: 1, limit: 100 };
      const [chamberRes, inwardRes, outwardRes] = await Promise.all([
        fetchChamberLogs('', searchOpts),
        fetchInwardLogs('', searchOpts),
        fetchOutwardLogs('', searchOpts)
      ]);

      const results = [];

      (chamberRes.items || []).forEach((log) => {
        results.push({
          type: 'daily',
          label: 'Daily Chamber Log',
          reference_no: log.reference_no,
          date: log.formatted_date || (log.entry_date ? String(log.entry_date).split('T')[0] : ''),
          facility: log.warehouse_name || 'Generic',
          client: log.client_name,
          details: `Chamber: ${log.chamber_name} | Temp: ${log.chamber_temp}°C`,
          original: log
        });
      });

      (inwardRes.items || []).forEach((log) => {
        results.push({
          type: 'inward',
          label: 'Inward Log',
          reference_no: log.reference_no,
          date: log.inward_entry_date ? String(log.inward_entry_date).split('T')[0] : '',
          facility: log.warehouse_name || 'Generic',
          client: log.inward_client_name,
          details: `Vehicle: ${log.inward_vehicle_no} | Temp: ${log.inward_vehicle_temp}°C | Pallets: ${log.inward_pallets_in_qty}`,
          original: log
        });
      });

      (outwardRes.items || []).forEach((log) => {
        results.push({
          type: 'outward',
          label: 'Outward Log',
          reference_no: log.reference_no,
          date: log.outward_entry_date ? String(log.outward_entry_date).split('T')[0] : '',
          facility: log.warehouse_name || 'Generic',
          client: log.outward_client_name,
          details: `Vehicle: ${log.outward_vehicle_no} | Temp: ${log.outward_vehicle_temp}°C | Pallets: ${log.outward_pallets_qty || log.outward_pallets_in_qty || 0}`,
          original: log
        });
      });

      setSearchResults(results);

      if (results.length === 1) {
        setSearchedRecord(results[0].original);
        setSearchedRecordType(results[0].type);
        loadRecordAllowHistory(results[0].type, results[0].original);
      } else {
        setSearchedRecord(null);
        setRecordAllowHistory([]);
      }
    } catch (err) {
      console.error('Lookup failed:', err);
      alert(err.message || 'Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const setExportFailure = (err, retryKey) => {
    const message = getExportErrorMessage(err);
    if (!message) return;
    setExportError({
      message,
      retryable: isRetryableExportError(err),
      retryKey
    });
  };

  const retryFailedExport = () => {
    const key = exportError?.retryKey;
    setExportError(null);
    if (key === 'history') handleExportLogsExcel();
    else if (key === 'activities') handleExportActivitiesExcel();
    else if (key === 'security') handleExportSecurityExcel();
    else if (key === 'system') handleExportSystemExcel();
    else if (key === 'operators') handleExportOperatorsDirectory();
  };

  const handleExportActivitiesExcel = async () => {
    setExportError(null);
    try {
      requireExportDates(activitiesFromDate, activitiesToDate);
      const { items: list } = await fetchAllOperatorActivities({
        category: 'activity',
        search: (activitiesSearch || '').trim() || undefined,
        fromDate: toApiDateParam(activitiesFromDate),
        toDate: toApiDateParam(activitiesToDate),
        action: activitiesActionFilter !== 'All' ? activitiesActionFilter : undefined,
        warehouse: selectedWarehouseFilter !== 'All' ? selectedWarehouseFilter : undefined,
        limit: 500
      });
      if (!confirmExportSize(list.length)) throw new Error('Export cancelled.');

      let csvContent = "\uFEFF";
      const headers = ["Timestamp", "DO Name / Operator", "Operator Email", "Allocated Warehouse", "Action Type", "Module Log", "Activity Description"];
      csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";

      list.forEach(act => {
        const timestamp = act.created_at ? new Date(act.created_at).toLocaleString() : '';
        const opEmail = act.operator_email || '-';
        const matchedOp = (operators || []).find(
          (op) => op && op.email && op.email.toLowerCase() === String(opEmail).toLowerCase()
        );
        const opName = matchedOp?.full_name ? String(matchedOp.full_name).trim() : '-';
        const opWarehouse = operatorWarehouseMap[opEmail.toLowerCase()] || 'System / Admin';
        const action = act.action || '-';
        const logType = act.log_type || '-';
        const description = act.description || '-';

        const row = [timestamp, opName, opEmail, opWarehouse, action, logType, description];
        csvContent += row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",") + "\n";
      });

      downloadCsv(`Operator_Activity_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
    } catch (err) {
      setExportFailure(err, 'activities');
    }
  };

  const handleExportOperatorsDirectory = () => {
    setExportError(null);
    try {
      const term = (operatorSearch || '').toLowerCase().trim();
      const list = (operators || []).filter((op) => {
        if (!op) return false;
        if (!term) return true;
        return (
          (op.full_name && op.full_name.toLowerCase().includes(term)) ||
          (op.warehouse_name && op.warehouse_name.toLowerCase().includes(term)) ||
          (op.email && op.email.toLowerCase().includes(term)) ||
          (op.phone_no && String(op.phone_no).toLowerCase().includes(term))
        );
      });
      if (!confirmExportSize(list.length)) throw new Error('Export cancelled.');

      let csvContent = '\uFEFF';
      const headers = [
        'Operator ID',
        'Full Name',
        'Phone No.',
        'Email Address',
        'Warehouse / Data Access',
        'Chambers Assigned',
        'Registration Date'
      ];
      csvContent += headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';

      list.forEach((op) => {
        const warehouse = op.warehouse_name || 'Not Configured';
        const accessScope = op.warehouse_name
          ? `Access: ${op.warehouse_name} Logs Only`
          : 'Access: Not Configured';
        const chambers = `1 to ${op.chamber_limit || 4}`;
        const registered = op.created_at
          ? new Date(op.created_at).toLocaleDateString('en-GB')
          : '-';
        const row = [
          op.id ?? '-',
          op.full_name || '-',
          op.phone_no || '-',
          op.email || '-',
          `${warehouse} | ${accessScope}`,
          chambers,
          registered
        ];
        csvContent += row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',') + '\n';
      });

      downloadCsv(
        `Registered_Operators_Directory_${new Date().toISOString().split('T')[0]}.csv`,
        csvContent
      );
    } catch (err) {
      setExportFailure(err, 'operators');
    }
  };

  const handleExportSecurityExcel = async () => {
    setExportError(null);
    try {
      requireExportDates(securityFromDate, securityToDate);
      const { items: list } = await fetchAllOperatorActivities({
        category: 'security',
        search: (securitySearch || '').trim() || undefined,
        fromDate: toApiDateParam(securityFromDate),
        toDate: toApiDateParam(securityToDate),
        action: securityActionFilter !== 'All' ? securityActionFilter : undefined,
        limit: 500
      });
      if (!confirmExportSize(list.length)) throw new Error('Export cancelled.');

      let csvContent = "\uFEFF";
      const headers = ["Timestamp", "Operator / Identity", "Allocated Warehouse", "Action Type", "Level", "Security Event Description"];
      csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";

      list.forEach(act => {
        const timestamp = act.created_at ? new Date(act.created_at).toLocaleString() : '';
        const opEmail = act.operator_email || 'System / Admin';
        const opWarehouse = operatorWarehouseMap[opEmail.toLowerCase()] || 'System / Admin';
        const action = act.action || '-';
        const level = act.log_type || '-';
        const description = act.description || '-';

        const row = [timestamp, opEmail, opWarehouse, action, level, description];
        csvContent += row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",") + "\n";
      });

      downloadCsv(`Security_Access_Logs_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
    } catch (err) {
      setExportFailure(err, 'security');
    }
  };


  const parseCheckpointDescription = (description) => {
    if (!description || typeof description !== 'string' || !description.includes('[CHECKPOINT]')) {
      return null;
    }
    const parts = {};
    description.split('|').forEach((chunk) => {
      const text = chunk.trim();
      if (!text || text === '[CHECKPOINT]') return;
      const eq = text.indexOf('=');
      if (eq <= 0) return;
      parts[text.slice(0, eq).trim()] = text.slice(eq + 1).trim();
    });
    return Object.keys(parts).length ? parts : null;
  };

  const renderSystemErrorDescription = (description, isError) => {
    const cp = parseCheckpointDescription(description);
    if (!cp) {
      return (
        <span style={{
          fontFamily: isError ? 'monospace' : 'inherit',
          fontSize: isError ? '0.74rem' : '0.78rem',
          color: '#334155'
        }}>
          {description || '-'}
        </span>
      );
    }

    const rows = [
      ['Type', cp.type],
      ['Status', cp.status],
      ['File', cp.file && cp.line ? `${cp.file}:${cp.line}` : (cp.file || null)],
      ['Checkpoint', cp.checkpoint],
      ['Request', cp.method && cp.url ? `${cp.method} ${cp.url}` : (cp.url || cp.method || null)],
      ['Message', cp.msg]
    ].filter(([, v]) => v && v !== '-');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: '240px' }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: 'flex', gap: '6px', alignItems: 'baseline', lineHeight: 1.35 }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', minWidth: '72px' }}>{label}</span>
            <span style={{
              fontSize: label === 'Message' ? '0.74rem' : '0.72rem',
              fontWeight: label === 'Message' ? 700 : 600,
              color: label === 'Status' && String(value).startsWith('5') ? '#dc2626' : '#334155',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              wordBreak: 'break-word'
            }}>
              {value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const handleExportSystemExcel = async () => {
    setExportError(null);
    try {
      requireExportDates(systemFromDate, systemToDate);
      const { items: list } = await fetchAllOperatorActivities({
        category: 'system',
        search: (systemSearch || '').trim() || undefined,
        fromDate: toApiDateParam(systemFromDate),
        toDate: toApiDateParam(systemToDate),
        action: systemActionFilter !== 'All' ? systemActionFilter : undefined,
        limit: 500
      });
      if (!confirmExportSize(list.length)) throw new Error('Export cancelled.');

      let csvContent = "\uFEFF";
      const headers = ["Timestamp", "Identity / Source", "Warehouse", "Log Type", "Action Event", "Process & Error Description"];
      csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";

      list.forEach(act => {
        const timestamp = act.created_at ? new Date(act.created_at).toLocaleString() : '';
        const opEmail = act.operator_email || 'system';
        const opWarehouse = operatorWarehouseMap[opEmail.toLowerCase()] || 'System';
        const logType = act.log_type || '-';
        const action = act.action || '-';
        const description = act.description || '-';

        const row = [timestamp, opEmail, opWarehouse, logType, action, description];
        csvContent += row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",") + "\n";
      });

      downloadCsv(`System_Process_Error_Logs_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
    } catch (err) {
      setExportFailure(err, 'system');
    }
  };


  const getFilteredHistoryLogs = () => {
    if (historyTab === 'daily') return chamberLogs;
    if (historyTab === 'inward') return inwardLogs;
    return outwardLogs;
  };

  const handleExportLogsExcel = async () => {
    setLogsExportLoading(true);
    setLogsExportProgressLabel('Exporting…');
    setExportError(null);
    if (exportAbortRef.current) exportAbortRef.current.abort();
    exportAbortRef.current = new AbortController();
    const { signal } = exportAbortRef.current;
    try {
      const { from, to } = requireExportDates(fromDate, toDate);
      setAppliedFromDate(fromDate);
      setAppliedToDate(toDate);
      setAppliedLogsSearch(logsSearch);

      const exportParams = {
        search: logsSearch,
        fromDate: from,
        toDate: to,
        warehouse: selectedWarehouse !== 'All' ? selectedWarehouse : undefined,
        signal
      };
      const onProgress = (p) => setLogsExportProgressLabel(formatExportProgress(p));

      let allItems = [];
      if (historyTab === 'daily') {
        ({ items: allItems } = await fetchAllChamberLogs(exportParams, onProgress));
      } else if (historyTab === 'inward') {
        ({ items: allItems } = await fetchAllInwardLogs(exportParams, onProgress));
      } else {
        ({ items: allItems } = await fetchAllOutwardLogs(exportParams, onProgress));
      }

      let filteredLogs = allItems;

    if (filteredLogs.length === 0) {
      throw new Error('No data available to export.');
    }

    setLogsExportProgressLabel('Building file…');

    const extractFilenames = (pathStr) => {
      if (!pathStr) return '';
      return String(pathStr)
        .split(',')
        .map(p => {
          const parts = p.trim().split(/[/\\]/);
          return parts[parts.length - 1];
        })
        .join(', ');
    };

    const formatDateDisplay = (dateStr) => {
      if (!dateStr) return '';
      const cleaned = dateStr.split('T')[0];
      const parts = cleaned.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    };

    const formatDateTimeDisplay = (dtStr) => {
      if (!dtStr) return '';
      try {
        const dt = new Date(dtStr);
        if (isNaN(dt.getTime())) return dtStr;
        const day = String(dt.getDate()).padStart(2, '0');
        const month = String(dt.getMonth() + 1).padStart(2, '0');
        const year = dt.getFullYear();
        let hours = dt.getHours();
        const minutes = String(dt.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        return `${day}/${month}/${year} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
      } catch {
        return dtStr;
      }
    };

    let csvContent = "\uFEFF"; // UTF-8 BOM for correct Excel character loading

    if (historyTab === 'daily') {
      const headers = [
        "Log ID", "Reference No", "Date", "Warehouse Name", "Operator Email", "Chamber Name", 
        "Client Name", "Inspection Time", "Box Temperature (°C)", "Supervisor Name", 
        "Sensor Photo Name", "Photo Capture Time", "Time Variance (minutes)", "Box Count", 
        "Chamber Type", "Overdue Status/Time", "Edit Details Log", "Edit Count", "Created At", "Updated At"
      ];
      csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";

      filteredLogs.forEach(log => {
        const row = [
          log.id || '',
          log.reference_no || '',
          formatDateDisplay(log.formatted_date || log.entry_date),
          log.warehouse_name || 'Generic',
          log.operator_email || '-',
          log.chamber_name || '',
          log.client_name || '',
          log.inspection_time || '',
          log.chamber_temp !== undefined ? `${log.chamber_temp}°C` : (log.box_temp !== undefined ? `${log.box_temp}°C` : ''),
          log.monitor_supervisor_name || '',
          extractFilenames(log.temp_sensor_image),
          log.photo_capture_time || '',
          log.time_variance_minutes !== undefined ? log.time_variance_minutes : '',
          log.box_count !== undefined ? log.box_count : '',
          log.chamber_type || '',
          log.overdue_time || '',
          log.update_details || '',
          log.update_count !== undefined ? log.update_count : 0,
          formatDateTimeDisplay(log.created_at),
          formatDateTimeDisplay(log.updated_at)
        ];
        csvContent += row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",") + "\n";
      });
    } else if (historyTab === 'inward') {
      const headers = [
        "Inward Log ID", "Reference No", "Date", "Warehouse Name", "Operator Email", "Vehicle No", "Seal No", 
        "Vehicle Temp (°C)", "Material Temp (°C)", "Transporter Name", "Driver Name", "Driver Contact No.", 
        "Client Name", "Dock No", "Vehicle Reporting Time", "Unloading Start Time", "Unloading Duration", 
        "Unloading End Time", "Pallets Qty", "Invoice Qty", "Received Pallets", 
        "Received Boxes", "Short Received Boxes", "Excess Received Boxes", "Damage Received Boxes", "Material Type", 
        "Supervisor Name", "Remarks", "Invoice Photos", "POD Photo", "Vehicle Seal Photo", "Vehicle Temp Photo", 
        "Material Temp Photo", "Vehicle Back Side Photo", "Vehicle Back Side Photo with Material", "Count Sheet Photo", 
        "Damage Boxes Photo", "Edit Details Log", "Edit Count", "Created At", "Updated At"
      ];
      csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";

      filteredLogs.forEach(log => {
        const row = [
          log.inward_id || '',
          log.reference_no || '',
          formatDateDisplay(log.inward_entry_date),
          log.warehouse_name || 'Generic',
          log.operator_email || '-',
          log.inward_vehicle_no || '',
          log.inward_seal_no || '',
          log.inward_vehicle_temp !== undefined ? `${log.inward_vehicle_temp}°C` : '',
          log.inward_material_temp !== undefined ? `${log.inward_material_temp}°C` : '',
          log.inward_transporter_name || '',
          log.inward_driver_name || '',
          log.inward_driver_no || '',
          log.inward_client_name || '',
          log.inward_dock_no || '',
          log.inward_vehicle_reporting_time || '',
          log.inward_unloading_start_time || '',
          formatDuration(log.inward_unloading_duration_hours, log.inward_unloading_duration_mins),
          log.inward_unloading_end_time || '',
          log.inward_pallets_in_qty !== undefined ? log.inward_pallets_in_qty : 0,
          log.inward_invoice_qty !== undefined ? log.inward_invoice_qty : 0,
          log.inward_received_qty !== undefined ? log.inward_received_qty : 0,
          log.inward_received_boxes_qty !== undefined ? log.inward_received_boxes_qty : 0,
          log.inward_short_received_boxes_qty !== undefined ? log.inward_short_received_boxes_qty : 0,
          log.inward_excess_received_boxes_qty !== undefined ? log.inward_excess_received_boxes_qty : 0,
          log.inward_damage_received_boxes_qty !== undefined ? log.inward_damage_received_boxes_qty : 0,
          log.inward_material_type || '',
          log.inward_unloading_supervisor_name || '',
          log.inward_remarks || '',
          extractFilenames(log.inward_invoice_photos),
          extractFilenames(log.inward_pod_photo),
          extractFilenames(log.inward_vehicle_seal_photo),
          extractFilenames(log.inward_vehicle_temp_photo),
          extractFilenames(log.inward_material_temp_photo),
          extractFilenames(log.inward_vehicle_back_side_photo),
          extractFilenames(log.inward_vehicle_back_side_photo_with_material),
          extractFilenames(log.inward_count_sheet_photo),
          extractFilenames(log.inward_damage_boxes_photo),
          log.update_details || '',
          log.update_count !== undefined ? log.update_count : 0,
          formatDateTimeDisplay(log.inward_created_at),
          formatDateTimeDisplay(log.inward_updated_at)
        ];
        csvContent += row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",") + "\n";
      });
    } else if (historyTab === 'outward') {
      const headers = [
        "Outward Log ID", "Reference No", "Date", "Warehouse Name", "Operator Email", "Vehicle No", "Seal No", 
        "Vehicle Temp (°C)", "Pre-Cooling Temp (°C)", "Material Temp (°C)", "Transporter Name", "Driver Name", 
        "Driver Contact No.", "Client Name", "Dock No", "Vehicle Reporting Time", "Loading Start Time", 
        "Loading Duration", "Loading End Time", "Pallets Qty", "Invoice Qty", 
        "Loaded Pallets", "Loaded Boxes", "Short Loaded Boxes", "Excess Loaded Boxes", "Damage Loaded Boxes", "Material Type", 
        "Supervisor Name", "Remarks", "Invoice Photos", "POD Photo", "Vehicle Seal Photo", "Vehicle Temp Photo", 
        "Pre-Cooling Temp Photo", "Material Temp Photo", "Vehicle Back Side Photo", "Vehicle Back Side Photo with Material", 
        "Damage Boxes Photo", "Edit Details Log", "Edit Count", "Created At", "Updated At"
      ];
      csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";

      filteredLogs.forEach(log => {
        const row = [
          log.outward_id || '',
          log.reference_no || '',
          formatDateDisplay(log.outward_entry_date),
          log.warehouse_name || 'Generic',
          log.operator_email || '-',
          log.outward_vehicle_no || '',
          log.outward_seal_no || '',
          log.outward_vehicle_temp !== undefined ? `${log.outward_vehicle_temp}°C` : '',
          log.outward_pre_vehicle_temp !== undefined ? `${log.outward_pre_vehicle_temp}°C` : '',
          log.outward_material_temp !== undefined ? `${log.outward_material_temp}°C` : '',
          log.outward_transporter_name || '',
          log.outward_driver_name || '',
          log.outward_driver_no || '',
          log.outward_client_name || '',
          log.outward_dock_no || '',
          log.outward_vehicle_reporting_time || '',
          log.outward_loading_start_time || '',
          formatDuration(log.outward_loading_duration_hours, log.outward_loading_duration_mins),
          log.outward_loading_end_time || '',
          log.outward_pallets_in_qty !== undefined ? log.outward_pallets_in_qty : 0,
          log.outward_invoice_qty !== undefined ? log.outward_invoice_qty : 0,
          log.outward_received_qty !== undefined ? log.outward_received_qty : 0,
          log.outward_received_boxes_qty !== undefined ? log.outward_received_boxes_qty : 0,
          log.outward_short_received_boxes_qty !== undefined ? log.outward_short_received_boxes_qty : 0,
          log.outward_excess_received_boxes_qty !== undefined ? log.outward_excess_received_boxes_qty : 0,
          log.outward_damage_received_boxes_qty !== undefined ? log.outward_damage_received_boxes_qty : 0,
          log.outward_material_type || '',
          log.outward_loading_supervisor_name || '',
          log.outward_remarks || '',
          extractFilenames(log.outward_invoice_photos),
          extractFilenames(log.outward_pod_photo),
          extractFilenames(log.outward_vehicle_seal_photo),
          extractFilenames(log.outward_vehicle_temp_photo),
          extractFilenames(log.outward_pre_vehicle_temp_photo),
          extractFilenames(log.outward_material_temp_photo),
          extractFilenames(log.outward_vehicle_back_side_photo),
          extractFilenames(log.outward_vehicle_back_side_photo_with_material),
          extractFilenames(log.outward_damage_boxes_photo),
          log.update_details || '',
          log.update_count !== undefined ? log.update_count : 0,
          formatDateTimeDisplay(log.outward_created_at),
          formatDateTimeDisplay(log.outward_updated_at)
        ];
        csvContent += row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",") + "\n";
      });
    }

    const tabLabel = historyTab === 'daily' ? 'ChamberLogs' : (historyTab === 'inward' ? 'InwardLogs' : 'OutwardLogs');
    const dateSuffix = new Date().toISOString().split('T')[0];
    downloadCsv(`ReeferON_${tabLabel}_SuperAdminExport_${dateSuffix}.csv`, csvContent);
    } catch (err) {
      setExportFailure(err, 'history');
    } finally {
      setLogsExportLoading(false);
      setLogsExportProgressLabel('Exporting…');
    }
  };

  const handleSaveOperator = async (e) => {
    e.preventDefault();
    setOpError('');
    setOpSuccess('');

    if (!opEmail || !opFullName || !opPhoneNo || !opWarehouseName) {
      setOpError('All fields (Full Name, Phone No., Email ID, Warehouse / Data Access) are required.');
      return;
    }

    if (!editingOp && !opPassword) {
      setOpError('Password is required for registration.');
      return;
    }

    setSavingOp(true);
    try {
      const payload = {
        email: opEmail,
        password: opPassword,
        full_name: opFullName,
        phone_no: opPhoneNo,
        warehouse_name: String(opWarehouseName || '').trim(),
        chamber_limit: opChamberLimit
      };

      if (editingOp) {
        setOpProcessStatus('Updating operator profile & Warehouse / Data Access…');
        const updated = await updateOperator(editingOp.id, payload);
        const synced = Number(updated?.past_logs_synced || 0);
        setOpSuccess(
          synced > 0
            ? `Operator updated. Warehouse / Data Access applied to profile and ${synced} past log(s).`
            : 'Operator profile & Warehouse / Data Access updated successfully.'
        );
      } else {
        setOpProcessStatus('Creating operator account…');
        // Yield so overlay paints before the network/email wait
        await new Promise((r) => setTimeout(r, 50));
        setOpProcessStatus('Creating account & sending credentials email…');
        const created = await createOperator(payload);
        if (created?.emailSent) {
          setOpProcessStatus('Email sent successfully.');
          setOpSuccess('Data operator registered with Warehouse / Data Access. Login credentials emailed successfully.');
        } else if (created?.emailSkipped) {
          setOpSuccess(
            created?.emailError
              || 'Data operator registered. Email skipped — set SMTP_USER and SMTP_PASS (Gmail App Password) in backend .env and restart server.'
          );
        } else {
          setOpSuccess(
            `Data operator registered, but email failed${created?.emailError ? `: ${created.emailError}` : '.'}`
          );
        }
      }

      cancelEditOperator();
      loadOperatorsData();
      loadAccessScopeOptions();
    } catch (err) {
      setOpError(err.message || 'Action failed.');
    } finally {
      setSavingOp(false);
      setOpProcessStatus('');
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
    setOpChamberLimit(op.chamber_limit || 4);
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
    setOpChamberLimit(4);
    setOpPassword('');
    setShowPassword(false);
    setOpError('');
    setOpSuccess('');
    setOperatorSearch('');
  };

  // Customers CRUD handlers
  const loadSubAdminsData = async () => {
    setLoadingSubAdmins(true);
    setSubAdminError('');
    try {
      const data = await fetchSubAdmins();
      setSubAdmins(data || []);
    } catch (err) {
      setSubAdminError(err.message || 'Failed to fetch customers.');
    } finally {
      setLoadingSubAdmins(false);
    }
  };

  const loadAccessScopeOptions = async () => {
    try {
      const data = await fetchAccessScopeOptions();
      setAccessScopeOptions({
        clients: Array.isArray(data?.clients) ? data.clients : [],
        warehouses: Array.isArray(data?.warehouses) ? data.warehouses : [],
        warehouseClients:
          data?.warehouseClients && typeof data.warehouseClients === 'object'
            ? data.warehouseClients
            : {}
      });
    } catch (err) {
      console.error('Failed to load access scope options:', err);
      setAccessScopeOptions({ clients: [], warehouses: [], warehouseClients: {} });
    }
  };

  // Clients shown in Customer form = only those linked to selected warehouses
  const subAdminClientOptions = useMemo(() => {
    const map = accessScopeOptions.warehouseClients || {};
    if (!subAdminSelectedWarehouses.length) return [];

    const merged = new Set();
    const selectedKeys = subAdminSelectedWarehouses.map((w) => String(w).trim().toLowerCase());

    Object.entries(map).forEach(([wh, clients]) => {
      const key = String(wh).trim().toLowerCase();
      if (!selectedKeys.includes(key)) return;
      (clients || []).forEach((c) => {
        if (c) merged.add(String(c).trim());
      });
    });

    // Case-insensitive unique
    const unique = [];
    const seen = new Set();
    [...merged]
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
      .forEach((name) => {
        const k = name.toLowerCase();
        if (seen.has(k)) return;
        seen.add(k);
        unique.push(name);
      });
    return unique;
  }, [accessScopeOptions.warehouseClients, subAdminSelectedWarehouses]);

  // Drop selected clients that no longer belong to selected warehouses
  useEffect(() => {
    if (!subAdminSelectedWarehouses.length) {
      setSubAdminSelectedClients((prev) => (prev.length ? [] : prev));
      return;
    }
    if (!subAdminClientOptions.length) return;
    setSubAdminSelectedClients((prev) => {
      const allowed = new Set(subAdminClientOptions.map((c) => c.toLowerCase()));
      const next = prev.filter((c) => allowed.has(String(c).trim().toLowerCase()));
      if (next.length === prev.length && next.every((v, i) => v === prev[i])) return prev;
      return next;
    });
  }, [subAdminSelectedWarehouses, subAdminClientOptions]);

  const handleSaveSubAdmin = async (e) => {
    e.preventDefault();
    setSubAdminError('');
    setSubAdminSuccess('');

    if (!subAdminEmail || !subAdminFullName || !subAdminPhoneNo) {
      setSubAdminError('All fields (Full Name, Phone No., Email ID) are required.');
      return;
    }

    if (!editingSubAdmin && !subAdminPassword) {
      setSubAdminError('Password is required for registration.');
      return;
    }

    setSavingSubAdmin(true);
    try {
      const payload = {
        email: subAdminEmail,
        password: subAdminPassword,
        full_name: subAdminFullName,
        phone_no: subAdminPhoneNo,
        allowed_clients: subAdminSelectedClients.length > 0 ? subAdminSelectedClients : null,
        allowed_warehouses: subAdminSelectedWarehouses.length > 0 ? subAdminSelectedWarehouses : null
      };

      if (editingSubAdmin) {
        setSubAdminProcessStatus('Updating Customer profile…');
        await updateSubAdmin(editingSubAdmin.id, payload);
        setSubAdminSuccess('Customer profile updated successfully.');
      } else {
        setSubAdminProcessStatus('Creating Customer account…');
        await new Promise((r) => setTimeout(r, 50));
        setSubAdminProcessStatus('Creating account & sending credentials email…');
        const created = await createSubAdmin(payload);
        if (created?.emailSent) {
          setSubAdminProcessStatus('Email sent successfully.');
          setSubAdminSuccess('Customer registered. Login credentials emailed successfully.');
        } else if (created?.emailSkipped) {
          setSubAdminSuccess(
            created?.emailError
              || 'Customer registered. Email skipped — set SMTP_USER and SMTP_PASS (Gmail App Password) in backend .env and restart server.'
          );
        } else {
          setSubAdminSuccess(
            `Customer registered, but email failed${created?.emailError ? `: ${created.emailError}` : '.'}`
          );
        }
      }

      cancelEditSubAdmin();
      loadSubAdminsData();
      loadDashboardStatsData();
    } catch (err) {
      setSubAdminError(err.message || 'Action failed.');
    } finally {
      setSavingSubAdmin(false);
      setSubAdminProcessStatus('');
    }
  };

  const handleDeleteSubAdmin = async (id) => {
    if (!window.confirm('Are you sure you want to revoke workspace access for this customer?')) {
      return;
    }
    setSubAdminError('');
    setSubAdminSuccess('');
    try {
      await deleteSubAdmin(id);
      setSubAdminSuccess('Customer credentials deleted successfully.');
      loadSubAdminsData();
      loadDashboardStatsData();
      if (editingSubAdmin && editingSubAdmin.id === id) {
        cancelEditSubAdmin();
      }
    } catch (err) {
      setSubAdminError(err.message || 'Failed to delete customer.');
    }
  };

  const startEditSubAdmin = (sa) => {
    setEditingSubAdmin(sa);
    setSubAdminEmail(sa.email);
    setSubAdminFullName(sa.full_name || '');
    setSubAdminPhoneNo(sa.phone_no || '');
    setSubAdminPassword('');
    setSubAdminSelectedClients(sa.allowed_clients ? sa.allowed_clients.split(',').map(c => c.trim()).filter(Boolean) : []);
    setSubAdminSelectedWarehouses(sa.allowed_warehouses ? sa.allowed_warehouses.split(',').map(w => w.trim()).filter(Boolean) : []);
    setSubAdminError('');
    setSubAdminSuccess('');
  };

  const cancelEditSubAdmin = () => {
    setEditingSubAdmin(null);
    setSubAdminEmail('');
    setSubAdminFullName('');
    setSubAdminPhoneNo('');
    setSubAdminPassword('');
    setSubAdminSelectedClients([]);
    setSubAdminSelectedWarehouses([]);
    setShowPassword(false);
    setSubAdminError('');
    setSubAdminSuccess('');
    setSubAdminSearch('');
  };

  const clearProfilePasswordForm = () => {
    setNewAdminPassword('');
    setConfirmAdminPassword('');
    setProfileEmail(user?.email || '');
    setOldProfileEmail(user?.email || '');
    setProfileAccessId(user?.email || '');
    setProfileAccessPassword('');
    setProfileAccessVerified(false);
    setProfileAccessLoading(false);
    setProfileAccessErr('');
    setProfilePwdMsg('');
    setProfilePwdErr('');
    setShowCurrentAdminPassword(false);
    setShowNewAdminPassword(false);
    setShowConfirmAdminPassword(false);
    setShowProfileConfirm(false);
    setProfileConfirmSummary(null);
  };

  const resetAppSubAdminForm = () => {
    setAppSubFullName('');
    setAppSubPhone('');
    setAppSubEmail('');
    setAppSubPassword('');
    setShowAppSubPassword(false);
  };

  const loadAppSubAdminsList = async () => {
    setAppSubAdminLoading(true);
    setAppSubAdminErr('');
    try {
      const rows = await fetchAppSubAdmins();
      setAppSubAdmins(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setAppSubAdmins([]);
      setAppSubAdminErr(err.message || 'Failed to load Sub-Admins.');
    } finally {
      setAppSubAdminLoading(false);
    }
  };

  const handleCreateAppSubAdmin = async (e) => {
    e.preventDefault();
    setAppSubAdminErr('');
    setAppSubAdminMsg('');
    if (!appSubFullName.trim() || !appSubPhone.trim() || !appSubEmail.trim() || !appSubPassword) {
      setAppSubAdminErr('Name, number, email and password are all required.');
      return;
    }
    setAppSubAdminSaving(true);
    try {
      const created = await createAppSubAdmin({
        full_name: appSubFullName.trim(),
        phone_no: appSubPhone.trim(),
        email: appSubEmail.trim().toLowerCase(),
        password: appSubPassword
      });
      setAppSubAdminMsg('Sub-Admin registered for mobile (full app access).');
      resetAppSubAdminForm();
      // Optimistic row so UI updates even if list refresh is slow
      if (created?.id) {
        setAppSubAdmins((prev) => [
          {
            id: created.id,
            email: created.email,
            full_name: created.full_name,
            phone_no: created.phone_no,
            created_at: new Date().toISOString()
          },
          ...prev.filter((r) => r.id !== created.id)
        ]);
      }
      await loadAppSubAdminsList();
    } catch (err) {
      setAppSubAdminErr(err.message || 'Failed to create Sub-Admin.');
    } finally {
      setAppSubAdminSaving(false);
    }
  };

  const handleDeleteAppSubAdmin = async (id) => {
    if (!window.confirm('Delete this Sub-Admin account? They will lose mobile access.')) return;
    setAppSubAdminErr('');
    setAppSubAdminMsg('');
    try {
      await deleteAppSubAdmin(id);
      setAppSubAdminMsg('Sub-Admin deleted.');
      setAppSubAdmins((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setAppSubAdminErr(err.message || 'Failed to delete Sub-Admin.');
      await loadAppSubAdminsList();
    }
  };

  const openSuperAdminProfileWindow = () => {
    setSaEditLog(null);
    clearProfilePasswordForm();
    setProfileAccessId(user?.email || '');
    setProfileEmail(user?.email || '');
    setOldProfileEmail(user?.email || '');
    setActiveMenu('super_admin_profile');
  };

  const handleProfileAccessVerify = async (e) => {
    e.preventDefault();
    setProfileAccessErr('');
    setProfilePwdMsg('');
    setProfilePwdErr('');

    const cleanId = (profileAccessId || '').trim().toLowerCase();
    if (!cleanId || !profileAccessPassword) {
      setProfileAccessErr('Please enter your ID and password.');
      return;
    }

    setProfileAccessLoading(true);
    try {
      const res = await verifySuperAdminProfileAccess({
        email: cleanId,
        password: profileAccessPassword
      });
      const verifiedEmail = res?.profile?.email || user?.email || cleanId;
      setProfileAccessVerified(true);
      setOldProfileEmail(verifiedEmail);
      setProfileEmail(verifiedEmail);
      setProfileAccessErr('');
    } catch (err) {
      setProfileAccessErr(err.message || 'Verification failed.');
      setProfileAccessVerified(false);
    } finally {
      setProfileAccessLoading(false);
    }
  };

  const handleProfilePasswordSubmit = (e) => {
    e.preventDefault();
    setProfilePwdErr('');
    setProfilePwdMsg('');
    if (!profileAccessVerified) {
      setProfilePwdErr('Please verify your ID and password first.');
      return;
    }

    const nextEmail = (profileEmail || '').trim().toLowerCase();
    const currentEmail = (oldProfileEmail || user?.email || '').trim().toLowerCase();
    const emailChanged = Boolean(nextEmail) && nextEmail !== currentEmail;
    const passwordChanged = Boolean(newAdminPassword || confirmAdminPassword);

    if (!emailChanged && !passwordChanged) {
      setProfilePwdErr('Update email and/or password before saving.');
      return;
    }
    if (emailChanged && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setProfilePwdErr('Please enter a valid email address.');
      return;
    }
    if (passwordChanged) {
      if (!newAdminPassword || !confirmAdminPassword) {
        setProfilePwdErr('Please enter and confirm your new password.');
        return;
      }
      if (newAdminPassword.length < 8) {
        setProfilePwdErr('New password must be at least 8 characters.');
        return;
      }
      if (newAdminPassword !== confirmAdminPassword) {
        setProfilePwdErr('New password and confirm password do not match.');
        return;
      }
    }

    // Same DO-style confirm window before applying changes
    setProfileConfirmSummary({
      oldEmail: oldProfileEmail || user?.email || '-',
      newEmail: emailChanged ? nextEmail : (oldProfileEmail || user?.email || '-'),
      emailChanged,
      passwordChanged
    });
    setShowProfileConfirm(true);
  };

  const handleConfirmProfileUpdate = async () => {
    if (!profileConfirmSummary) return;

    setProfilePwdLoading(true);
    setProfilePwdErr('');
    try {
      const res = await changeSuperAdminPassword({
        currentPassword: profileAccessPassword,
        newPassword: profileConfirmSummary.passwordChanged ? newAdminPassword : undefined,
        email: profileConfirmSummary.emailChanged ? profileConfirmSummary.newEmail : undefined
      });
      if (res?.user && typeof onUserUpdate === 'function') {
        onUserUpdate(res.user);
      }
      setShowProfileConfirm(false);
      setProfileConfirmSummary(null);
      setProfilePwdMsg(res?.message || 'Profile updated successfully.');
      setNewAdminPassword('');
      setConfirmAdminPassword('');
      setProfileAccessPassword('');
      setProfileAccessVerified(false);
      setProfileAccessId(res?.user?.email || user?.email || '');
      setShowCurrentAdminPassword(false);
      setShowNewAdminPassword(false);
      setShowConfirmAdminPassword(false);
      setProfileEmail(res?.user?.email || user?.email || '');
      setOldProfileEmail(res?.user?.email || user?.email || '');
    } catch (err) {
      setShowProfileConfirm(false);
      setProfileConfirmSummary(null);
      setProfilePwdErr(err.message || 'Failed to update profile.');
    } finally {
      setProfilePwdLoading(false);
    }
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

  const startSaEditLog = (type, log) => {
    setSelectedDetailLog(null);
    setSaEditLog({ type, data: log });
  };

  const handleSaDeleteLog = async (type, log) => {
    const id = type === 'daily' ? log.id : type === 'inward' ? log.inward_id : log.outward_id;
    const ref = log.reference_no || `#${id}`;
    if (!window.confirm(`Delete this ${type === 'daily' ? 'Chamber' : type === 'inward' ? 'Inward' : 'Outward'} log (${ref})?\n\nSuper Admin delete — no permission request required.`)) {
      return;
    }
    setSaLogActionBusy(true);
    try {
      if (type === 'daily') await deleteChamberLog(id);
      else if (type === 'inward') await deleteInwardLog(id);
      else await deleteOutwardLog(id);

      setSelectedDetailLog(null);
      if (saEditLog) setSaEditLog(null);

      if (type === 'daily') setChamberLogs((prev) => prev.filter((r) => r.id !== id));
      else if (type === 'inward') setInwardLogs((prev) => prev.filter((r) => r.inward_id !== id));
      else setOutwardLogs((prev) => prev.filter((r) => r.outward_id !== id));

      setHistoryTotal((t) => Math.max(0, (Number(t) || 0) - 1));
      alert('Log deleted successfully.');
    } catch (err) {
      alert(err.message || 'Failed to delete log.');
    } finally {
      setSaLogActionBusy(false);
    }
  };

  const renderSaLogActions = (type, log) => (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={() => {
          setSelectedDetailLog(log);
          setDetailType(type);
          loadRecordAllowHistory(type, log);
        }}
        title="View Data Profile & Photos"
        style={{
          backgroundColor: '#f1f5f9',
          border: '1px solid #cbd5e1',
          color: '#334155',
          padding: '6px 10px',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.75rem',
          fontWeight: 700
        }}
      >
        <Eye size={13} />
        <span>Details</span>
      </button>
      <button
        type="button"
        onClick={() => startSaEditLog(type, log)}
        title="Edit (Super Admin — no permission required)"
        disabled={saLogActionBusy}
        style={{
          backgroundColor: '#e0f2fe',
          border: '1px solid #bae6fd',
          color: '#0369a1',
          padding: '6px',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Edit size={14} />
      </button>
      <button
        type="button"
        className="btn-delete-log"
        onClick={() => handleSaDeleteLog(type, log)}
        title="Delete (Super Admin — no permission required)"
        disabled={saLogActionBusy}
        style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          padding: '6px',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  const hasPendingRequests = permissionRequests.some(
    (pr) =>
      pr.status === 'Pending' &&
      pr.record_type !== 'ClientMaster' &&
      pr.record_type !== 'MasterSetup'
  );

  const clearSaEditLog = async () => {
    setSaEditLog(null);
    if (activeMenu === 'history_logs' || activeMenu === 'profile_lookup') {
      try {
        await loadHistoryLogs();
      } catch (_) {
        /* ignore */
      }
    }
  };

  const renderSaEditPanel = () => {
    if (!saEditLog) return null;
    const editType = saEditLog.type;
    return (
      <div className="sa-edit-log-panel">
        <div className="sa-edit-log-topbar">
          <button type="button" className="sa-edit-log-back" onClick={() => setSaEditLog(null)}>
            <X size={16} />
            Cancel Edit
          </button>
          <span className="sa-edit-log-badge">
            Super Admin direct edit · no permission required
          </span>
        </div>
        <div className="sa-edit-log-body">
          <Suspense
            fallback={
              <div className="page-lazy-loader" style={{ position: 'relative', minHeight: 280 }}>
                <div className="page-lazy-loader-inner">
                  <span className="page-lazy-loader-spinner" />
                  <span>Loading editor…</span>
                </div>
              </div>
            }
          >
            {editType === 'daily' && (
              <TempMonitor
                editData={saEditLog.data}
                setEditData={(d) => {
                  if (!d) clearSaEditLog();
                  else setSaEditLog({ type: 'daily', data: d });
                }}
                forcedMenu="All"
                onMenuChange={() => clearSaEditLog()}
              />
            )}
            {editType === 'inward' && (
              <InwardMonitor
                editData={saEditLog.data}
                setEditData={(d) => {
                  if (!d) clearSaEditLog();
                  else setSaEditLog({ type: 'inward', data: d });
                }}
                setActiveDOMenu={() => clearSaEditLog()}
              />
            )}
            {editType === 'outward' && (
              <OutwardMonitor
                editData={saEditLog.data}
                setEditData={(d) => {
                  if (!d) clearSaEditLog();
                  else setSaEditLog({ type: 'outward', data: d });
                }}
                setActiveDOMenu={() => clearSaEditLog()}
              />
            )}
          </Suspense>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      {(savingOp || savingSubAdmin) && (
        <div className="account-save-overlay" role="status" aria-live="polite">
          <div className="account-save-overlay-card">
            <Loader2 size={28} className="spinner-icon" color="#00a2e8" />
            <strong>{savingOp ? (opProcessStatus || 'Processing…') : (subAdminProcessStatus || 'Processing…')}</strong>
            <span>Please wait — account save and email are in progress.</span>
          </div>
        </div>
      )}
      <style>{`
        @keyframes status-pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }
        .pulsing-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #ef4444;
          animation: status-pulse 2s infinite;
        }
      `}</style>
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
              className={`clean-menu-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveMenu('dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeMenu === 'dashboard' ? 'var(--primary-light)' : 'transparent',
                color: activeMenu === 'dashboard' ? 'var(--primary)' : 'var(--text-dark)',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LayoutDashboard size={18} />
                <span>Dashboard Overview</span>
              </div>
            </button>
            <button 
              className={`clean-menu-item ${activeMenu === 'user_management' ? 'active' : ''}`}
              onClick={() => setActiveMenu('user_management')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeMenu === 'user_management' ? 'var(--primary-light)' : 'transparent',
                color: activeMenu === 'user_management' ? 'var(--primary)' : 'var(--text-dark)',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={18} />
                <span>Customers & Operators</span>
              </div>
            </button>

            <button 
              className={`clean-menu-item ${activeMenu === 'customer_reports' ? 'active' : ''}`}
              onClick={() => setActiveMenu('customer_reports')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeMenu === 'customer_reports' ? 'var(--primary-light)' : 'transparent',
                color: activeMenu === 'customer_reports' ? 'var(--primary)' : 'var(--text-dark)',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageSquareWarning size={18} />
                <span>Customer Reports</span>
              </div>
              {customerReports.some((r) => r && r.status === 'Open') && (
                <span className="pulsing-dot" />
              )}
            </button>

            <button 
              className={`clean-menu-item ${activeMenu === 'activity_logs' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('activity_logs');
                if (hasNewDOChanges) setAuditSubTab('do_changes');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={18} />
                <span>Operator Activities</span>
              </div>
              {(hasPendingRequests || hasNewDOChanges) && <span className="pulsing-dot" />}
            </button> 
            <button 
              className={`clean-menu-item ${activeMenu === 'history_logs' ? 'active' : ''}`}
              onClick={() => setActiveMenu('history_logs')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeMenu === 'history_logs' ? 'var(--primary-light)' : 'transparent',
                color: activeMenu === 'history_logs' ? 'var(--primary)' : 'var(--text-dark)',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <History size={18} />
                <span>History Logs</span>
              </div>
            </button>
            <button 
              className={`clean-menu-item ${activeMenu === 'profile_lookup' ? 'active' : ''}`}
              onClick={() => setActiveMenu('profile_lookup')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeMenu === 'profile_lookup' ? 'var(--primary-light)' : 'transparent',
                color: activeMenu === 'profile_lookup' ? 'var(--primary)' : 'var(--text-dark)',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Search size={18} />
                <span>Profile Lookup</span>
              </div>
            </button>


            <button 
              className={`clean-menu-item ${activeMenu === 'daily_box_tracker' ? 'active' : ''}`}
              onClick={() => setActiveMenu('daily_box_tracker')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeMenu === 'daily_box_tracker' ? 'var(--primary-light)' : 'transparent',
                color: activeMenu === 'daily_box_tracker' ? 'var(--primary)' : 'var(--text-dark)',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={18} />
                <span>Daily Box Tracker</span>
              </div>
            </button>
          </div>
        </div>

        {/* Sidebar Footer with Profile + Logout */}
        <div className="secure-sidebar-bottom">
          <div
            className={`secure-profile-badge secure-profile-badge--clickable${activeMenu === 'super_admin_profile' ? ' is-active' : ''}`}
            onClick={openSuperAdminProfileWindow}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openSuperAdminProfileWindow();
              }
            }}
            title="Open Super Admin Profile"
          >
            <div className="secure-avatar">SA</div>
            <div className="secure-user-info">
              <strong>Super Admin</strong>
              <span>{user?.email || 'admin@reeferon.com'}</span>
            </div>
            <button
              type="button"
              className="secure-logout-btn"
              onClick={(e) => {
                e.stopPropagation();
                onLogout();
              }}
              title="Log Out Session"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Workspace Layout */}
      {/* Header */}
      <header
        className="secure-admin-header"
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 24px', zIndex: 110 }}
      >
        {/* Left section: Mobile-only Logo */}
        <div className="secure-header-left" style={{ position: 'absolute', left: '24px', display: 'flex', alignItems: 'center' }}>
          <div className="secure-mobile-logo mobile-only">
            <Logo compact={true} />
          </div>
        </div>

        {/* Center section: Super Admin + date/time below */}
        <div className="secure-header-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', textAlign: 'center' }}>
          <span className="secure-role-tag" style={{ margin: 0 }}>
            Super Admin
          </span>
          <div className="secure-clock-subtext" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700' }}>
            <span>{formatDate(time)}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={12} />
              {formatTime(time)}
            </span>
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
            <div
              className="drawer-user-info"
              role="button"
              tabIndex={0}
              onClick={() => {
                openSuperAdminProfileWindow();
                setIsMobileMenuOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openSuperAdminProfileWindow();
                  setIsMobileMenuOpen(false);
                }
              }}
              style={{ cursor: 'pointer' }}
              title="Open Super Admin Profile"
            >
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
              className={`clean-menu-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('dashboard');
                setIsMobileMenuOpen(false);
              }}
            >
              <div className="item-left">
                <LayoutDashboard size={18} className="item-icon" />
                <span>Dashboard Overview</span>
              </div>
              <ChevronRight size={16} className="item-arrow" />
            </button>
             <button 
              className={`clean-menu-item ${activeMenu === 'user_management' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('user_management');
                setIsMobileMenuOpen(false);
              }}
            >
              <div className="item-left">
                <Users size={18} className="item-icon" />
                <span>Customers & Operators</span>
              </div>
              <ChevronRight size={16} className="item-arrow" />
            </button>

            <button 
              className={`clean-menu-item ${activeMenu === 'customer_reports' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('customer_reports');
                setIsMobileMenuOpen(false);
              }}
            >
              <div className="item-left">
                <MessageSquareWarning size={18} className="item-icon" />
                <span>Customer Reports</span>
                {customerReports.some((r) => r && r.status === 'Open') && (
                  <span className="pulsing-dot" style={{ marginLeft: '8px' }} />
                )}
              </div>
              <ChevronRight size={16} className="item-arrow" />
            </button>

            <button 
              className={`clean-menu-item ${activeMenu === 'activity_logs' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('activity_logs');
                if (hasNewDOChanges) setAuditSubTab('do_changes');
                setIsMobileMenuOpen(false);
              }}
            >
              <div className="item-left">
                <Activity size={18} className="item-icon" />
                <span>Operator Activities</span>
                {(hasPendingRequests || hasNewDOChanges) && <span className="pulsing-dot" style={{ marginLeft: '8px' }} />}
              </div>
             </button>

             <button 
              className={`clean-menu-item ${activeMenu === 'history_logs' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('history_logs');
                setIsMobileMenuOpen(false);
              }}
            >
              <div className="item-left">
                <History size={18} className="item-icon" />
                <span>History Logs</span>
              </div>
              <ChevronRight size={16} className="item-arrow" />
            </button>

            <button 
              className={`clean-menu-item ${activeMenu === 'profile_lookup' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('profile_lookup');
                setIsMobileMenuOpen(false);
              }}
            >
              <div className="item-left">
                <Search size={18} className="item-icon" />
                <span>Profile Lookup</span>
              </div>
              <ChevronRight size={16} className="item-arrow" />
            </button>





            <button 
              className={`clean-menu-item ${activeMenu === 'daily_box_tracker' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('daily_box_tracker');
                setIsMobileMenuOpen(false);
              }}
            >
              <div className="item-left">
                <Activity size={18} className="item-icon" />
                <span>Daily Box Tracker</span>
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

      {/* Body Content Viewport — sidebar stays visible; edit stays in this column only */}
      <main className="app-viewport secure-admin-viewport" style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        {saEditLog ? (
          renderSaEditPanel()
        ) : (
          <>
        {activeMenu === 'super_admin_profile' && (
          <div className="sa-profile-window">
            <div className="sa-profile-window-top">
              <div className="sa-profile-window-title">
                <div className="sa-profile-window-icon">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h2>Super Admin Profile</h2>
                  <p>Update login email and password from this working window.</p>
                </div>
              </div>
              <button
                type="button"
                className="sa-profile-window-back"
                onClick={() => {
                  clearProfilePasswordForm();
                  setActiveMenu('dashboard');
                }}
              >
                <X size={16} />
                Close
              </button>
            </div>

            <div className="sa-profile-window-grid">
              <div className="sa-profile-info-card">
                <h3>Account Details</h3>
                <div className="sa-profile-info-row">
                  <span>Role</span>
                  <strong>Super Admin</strong>
                </div>
                <div className="sa-profile-info-row">
                  <span>Email</span>
                  <strong>{user?.email || '—'}</strong>
                </div>
                <div className="sa-profile-info-row">
                  <span>Name</span>
                  <strong>{user?.full_name || 'Super Administrator'}</strong>
                </div>
                <div className="sa-profile-info-note">
                  Verify with your ID and password first. After verification you can update email, password, or both.
                </div>
              </div>

              <div className="sa-profile-security-card">
                {!profileAccessVerified ? (
                  <>
                    <h3>Profile Access Verification</h3>
                    <p className="sa-profile-security-sub">
                      Enter your Super Admin ID and password to continue.
                    </p>
                    <form className="sa-profile-form" onSubmit={handleProfileAccessVerify} autoComplete="off">
                      <label>Super Admin ID</label>
                      <div className="sa-profile-input-wrap">
                        <input
                          type="email"
                          value={profileAccessId}
                          onChange={(e) => setProfileAccessId(e.target.value)}
                          placeholder="Enter your Super Admin ID"
                          autoComplete="off"
                          name="sa-profile-access-id"
                        />
                      </div>
                      <label>Password</label>
                      <div className="sa-profile-input-wrap">
                        <input
                          type={showCurrentAdminPassword ? 'text' : 'password'}
                          value={profileAccessPassword}
                          onChange={(e) => setProfileAccessPassword(e.target.value)}
                          placeholder="Enter your password"
                          autoComplete="new-password"
                          name="sa-profile-access-password"
                        />
                        <button
                          type="button"
                          className="sa-profile-eye-btn"
                          onClick={() => setShowCurrentAdminPassword((p) => !p)}
                          title={showCurrentAdminPassword ? 'Hide Password' : 'Show Password'}
                        >
                          {showCurrentAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {profileAccessErr && <div className="sa-profile-error">{profileAccessErr}</div>}
                      <button type="submit" className="sa-profile-submit" disabled={profileAccessLoading}>
                        {profileAccessLoading ? (
                          <>
                            <Loader2 size={16} className="sa-profile-spin" />
                            Verifying…
                          </>
                        ) : (
                          <>
                            <Lock size={16} />
                            Verify and Continue
                          </>
                        )}
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <h3>Update Email / Password</h3>
                    <p className="sa-profile-security-sub">
                      Update email, password, or both. Leave password fields blank if you only want to change email.
                    </p>
                    <form className="sa-profile-form" onSubmit={handleProfilePasswordSubmit} autoComplete="off">
                      <div className="sa-profile-old-email">
                        <h2>Old Email ID</h2>
                        <h1>{oldProfileEmail || user?.email || '-'}</h1>
                      </div>
                      <label>New Email ID</label>
                      <div className="sa-profile-input-wrap">
                        <input
                          type="email"
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          placeholder="Enter new email ID"
                          autoComplete="off"
                          name="sa-profile-new-email"
                        />
                      </div>
                      <label>New Password</label>
                      <div className="sa-profile-input-wrap">
                        <input
                          type={showNewAdminPassword ? 'text' : 'password'}
                          value={newAdminPassword}
                          onChange={(e) => setNewAdminPassword(e.target.value)}
                          placeholder="Leave blank to keep current password"
                          autoComplete="new-password"
                          name="sa-profile-new-password"
                        />
                        <button
                          type="button"
                          className="sa-profile-eye-btn"
                          onClick={() => setShowNewAdminPassword((p) => !p)}
                          title={showNewAdminPassword ? 'Hide Password' : 'Show Password'}
                        >
                          {showNewAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <label>Confirm Password</label>
                      <div className="sa-profile-input-wrap">
                        <input
                          type={showConfirmAdminPassword ? 'text' : 'password'}
                          value={confirmAdminPassword}
                          onChange={(e) => setConfirmAdminPassword(e.target.value)}
                          placeholder="Re-enter only if changing password"
                          autoComplete="new-password"
                          name="sa-profile-confirm-password"
                        />
                        <button
                          type="button"
                          className="sa-profile-eye-btn"
                          onClick={() => setShowConfirmAdminPassword((p) => !p)}
                          title={showConfirmAdminPassword ? 'Hide Password' : 'Show Password'}
                        >
                          {showConfirmAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>

                      {profilePwdErr && <div className="sa-profile-error">{profilePwdErr}</div>}
                      {profilePwdMsg && <div className="sa-profile-success">{profilePwdMsg}</div>}

                      <button type="submit" className="sa-profile-submit" disabled={profilePwdLoading}>
                        {profilePwdLoading ? (
                          <>
                            <Loader2 size={16} className="sa-profile-spin" />
                            Saving Changes…
                          </>
                        ) : (
                          <>
                            <Lock size={16} />
                            Save Profile Changes
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>

            <div className="sa-profile-subadmin-card">
              <div className="sa-profile-subadmin-head">
                <div>
                  <h3>Register Mobile Sub-Admin</h3>
                  <p>
                    Sub-Admins get full mobile app access (view and process all data). Separate from Customers.
                  </p>
                </div>
                <Smartphone size={22} color="#00a2e8" />
              </div>

              <form className="sa-profile-form" onSubmit={handleCreateAppSubAdmin} autoComplete="off">
                <div className="sa-profile-subadmin-grid">
                  <div>
                    <label>Name *</label>
                    <div className="sa-profile-input-wrap">
                      <input
                        type="text"
                        value={appSubFullName}
                        onChange={(e) => setAppSubFullName(e.target.value.replace(/[^a-zA-Z\s.'-]/g, ''))}
                        placeholder="Full name"
                        name="app-sub-name"
                        autoComplete="off"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label>Number *</label>
                    <div className="sa-profile-input-wrap">
                      <input
                        type="tel"
                        value={appSubPhone}
                        onChange={(e) => setAppSubPhone(e.target.value.replace(/[^\d+]/g, ''))}
                        placeholder="Phone number"
                        name="app-sub-phone"
                        autoComplete="off"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label>Email *</label>
                    <div className="sa-profile-input-wrap">
                      <input
                        type="email"
                        value={appSubEmail}
                        onChange={(e) => setAppSubEmail(e.target.value)}
                        placeholder="subadmin@company.com"
                        name="app-sub-email"
                        autoComplete="off"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label>Password *</label>
                    <div className="sa-profile-input-wrap">
                      <input
                        type={showAppSubPassword ? 'text' : 'password'}
                        value={appSubPassword}
                        onChange={(e) => setAppSubPassword(e.target.value)}
                        placeholder="Login password"
                        name="app-sub-password"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        className="sa-profile-eye-btn"
                        onClick={() => setShowAppSubPassword((p) => !p)}
                        title={showAppSubPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {showAppSubPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {appSubAdminErr && <div className="sa-profile-error">{appSubAdminErr}</div>}
                {appSubAdminMsg && <div className="sa-profile-success">{appSubAdminMsg}</div>}

                <button type="submit" className="sa-profile-submit" disabled={appSubAdminSaving}>
                  {appSubAdminSaving ? (
                    <>
                      <Loader2 size={16} className="sa-profile-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Create Sub-Admin
                    </>
                  )}
                </button>
              </form>

              <div className="sa-profile-subadmin-list">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                  <h4 style={{ margin: 0 }}>Registered Sub-Admins</h4>
                  <button
                    type="button"
                    className="sa-profile-window-back"
                    onClick={loadAppSubAdminsList}
                    disabled={appSubAdminLoading}
                    title="Refresh list"
                  >
                    {appSubAdminLoading ? 'Loading…' : 'Refresh'}
                  </button>
                </div>
                {appSubAdminErr && <div className="sa-profile-error">{appSubAdminErr}</div>}
                {appSubAdminLoading ? (
                  <p className="sa-profile-security-sub">Loading…</p>
                ) : appSubAdmins.length === 0 && !appSubAdminErr ? (
                  <p className="sa-profile-security-sub">No Sub-Admins yet.</p>
                ) : appSubAdmins.length === 0 ? null : (
                  <div className="table-responsive">
                    <table className="logs-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '10px 12px' }}>Name</th>
                          <th style={{ textAlign: 'left', padding: '10px 12px' }}>Number</th>
                          <th style={{ textAlign: 'left', padding: '10px 12px' }}>Email</th>
                          <th style={{ textAlign: 'center', padding: '10px 12px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appSubAdmins.map((row) => (
                          <tr key={row.id}>
                            <td style={{ padding: '10px 12px', fontWeight: 600 }}>{row.full_name || '—'}</td>
                            <td style={{ padding: '10px 12px' }}>{row.phone_no || '—'}</td>
                            <td style={{ padding: '10px 12px' }}>{row.email}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleDeleteAppSubAdmin(row.id)}
                                style={{
                                  border: 'none',
                                  background: '#fee2e2',
                                  color: '#dc2626',
                                  borderRadius: 8,
                                  padding: '6px 10px',
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                  fontSize: '0.75rem'
                                }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {showProfileConfirm && profileConfirmSummary && (
              <div className="sa-profile-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="sa-profile-confirm-title">
                <div className="sa-profile-confirm-content">
                  <div className="sa-profile-confirm-header">
                    <h3 id="sa-profile-confirm-title" className="sa-profile-confirm-title">
                      <CheckCircle size={20} color="#10b981" />
                      <span>Verify Profile Update</span>
                    </h3>
                  </div>

                  <div className="sa-profile-confirm-body">
                    <div className="sa-profile-confirm-box">
                      <h4>Change Summary</h4>

                      <div className="sa-profile-confirm-row">
                        <div className="sa-profile-confirm-item">
                          <span className="sa-profile-confirm-label">Current Email</span>
                          <strong>{profileConfirmSummary.oldEmail}</strong>
                        </div>
                        <div className="sa-profile-confirm-divider">→</div>
                        <div className="sa-profile-confirm-item">
                          <span className="sa-profile-confirm-label">
                            {profileConfirmSummary.emailChanged ? 'New Email' : 'Email (unchanged)'}
                          </span>
                          <strong>{profileConfirmSummary.newEmail}</strong>
                        </div>
                      </div>

                      <div className="sa-profile-confirm-flags">
                        <div className="sa-profile-confirm-flag">
                          <span>Email update</span>
                          <strong className={profileConfirmSummary.emailChanged ? 'is-yes' : 'is-no'}>
                            {profileConfirmSummary.emailChanged ? 'Yes' : 'No'}
                          </strong>
                        </div>
                        <div className="sa-profile-confirm-flag">
                          <span>Password update</span>
                          <strong className={profileConfirmSummary.passwordChanged ? 'is-yes' : 'is-no'}>
                            {profileConfirmSummary.passwordChanged ? 'Yes' : 'No'}
                          </strong>
                        </div>
                      </div>

                      <div className="sa-profile-confirm-banner">
                        Confirm to apply these Super Admin login changes. You may need to sign in again with the new credentials.
                      </div>
                    </div>
                  </div>

                  <div className="sa-profile-confirm-actions">
                    <button
                      type="button"
                      className="sa-profile-confirm-cancel"
                      onClick={() => {
                        setShowProfileConfirm(false);
                        setProfileConfirmSummary(null);
                      }}
                      disabled={profilePwdLoading}
                    >
                      <span>Back to Edit Form</span>
                    </button>
                    <button
                      type="button"
                      className="sa-profile-confirm-save"
                      onClick={handleConfirmProfileUpdate}
                      disabled={profilePwdLoading}
                    >
                      {profilePwdLoading ? (
                        <>
                          <Loader2 size={16} className="sa-profile-spin" />
                          <span>Saving…</span>
                        </>
                      ) : (
                        <span>Confirm & Save</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeMenu === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Top Row: Welcome Banner */}
            <div className="secure-welcome-dashboard-card" style={{ padding: '12px 18px' }}>
              <div className="welcome-info-left" style={{ gap: '12px' }}>
                <div style={{ backgroundColor: 'rgba(0,162,232,0.15)', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheck size={28} color="#00a2e8" />
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>Control Center Dashboard</h1>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>Super Admin overview of cold storage operations, operators activity logs and locations.</p>
                </div>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: '700', flexShrink: 0 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span>
                System Monitoring Online
              </div>
            </div>

            {/* Stats Cards Grid (3 columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {/* Card 1: Data Operators */}
              <div className="diagnostic-card" style={{ padding: '12px 16px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operators</span>
                  <div style={{ backgroundColor: 'var(--primary-light)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
                    <User size={16} color="var(--primary)" />
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, color: 'var(--text-dark)' }}>{operators.length}</h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Registered Data Operators</span>
                </div>
              </div>

              {/* Card 2: Warehouses */}
              <div className="diagnostic-card" style={{ padding: '12px 16px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Warehouses</span>
                  <div style={{ backgroundColor: '#e0f2fe', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
                    <Database size={16} color="#0284c7" />
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, color: 'var(--text-dark)' }}>{warehousesList.length}</h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Locations Managed</span>
                </div>
              </div>

              {/* Card 3: Customers */}
              <div className="diagnostic-card" style={{ padding: '12px 16px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customers</span>
                  <div style={{ backgroundColor: '#fee2e2', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
                    <ShieldCheck size={16} color="#dc2626" />
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, color: 'var(--text-dark)' }}>{subAdmins.length}</h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Registered Customers</span>
                </div>
              </div>
            </div>

            {/* Operational Shortcuts */}
            <div className="diagnostic-card" style={{ padding: '16px 20px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Operational Shortcuts</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <button 
                  onClick={() => {
                    setActiveMenu('user_management');
                    setUserTab('operators');
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-dark)',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease',
                    minWidth: 0,
                    overflow: 'hidden'
                  }}
                  className="dashboard-shortcut-btn"
                >
                  <UserPlus size={16} color="var(--primary)" />
                  <span>Register Operator</span>
                </button>

                <button 
                  onClick={() => {
                    setActiveMenu('activity_logs');
                    setAuditSubTab('permission_log');
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: hasPendingRequests ? '1px solid #ef4444' : '1px solid var(--border)',
                    backgroundColor: hasPendingRequests ? '#fef2f2' : 'var(--bg-main)',
                    color: hasPendingRequests ? '#ef4444' : 'var(--text-dark)',
                    fontWeight: hasPendingRequests ? '800' : '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease',
                    minWidth: 0,
                    overflow: 'hidden'
                  }}
                  className="dashboard-shortcut-btn"
                >
                  <Lock size={16} color={hasPendingRequests ? '#ef4444' : 'var(--primary)'} />
                  <span>Permission Requests</span>
                  {hasPendingRequests && <span className="pulsing-dot" style={{ marginLeft: '4px' }} />}
                </button>

                <button 
                  onClick={() => {
                    setActiveMenu('activity_logs');
                    setAuditSubTab('do_changes');
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: hasNewDOChanges ? '1px solid #ef4444' : '1px solid var(--border)',
                    backgroundColor: hasNewDOChanges ? '#fef2f2' : 'var(--bg-main)',
                    color: hasNewDOChanges ? '#ef4444' : 'var(--text-dark)',
                    fontWeight: hasNewDOChanges ? '800' : '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease',
                    minWidth: 0,
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                  className="dashboard-shortcut-btn"
                >
                  <Activity size={16} color={hasNewDOChanges ? '#ef4444' : 'var(--primary)'} />
                  <span>DO Operations Log</span>
                  {hasNewDOChanges && <span className="pulsing-dot" style={{ marginLeft: '4px', position: 'relative', top: 'auto', right: 'auto' }} />}
                </button>

                <button 
                  onClick={() => setActiveMenu('history_logs')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-dark)',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease',
                    minWidth: 0,
                    overflow: 'hidden'
                  }}
                  className="dashboard-shortcut-btn"
                >
                  <History size={16} color="var(--primary)" />
                  <span>System Logs</span>
                </button>

                <button 
                  onClick={() => setActiveMenu('profile_lookup')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-dark)',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease',
                    minWidth: 0,
                    overflow: 'hidden'
                  }}
                  className="dashboard-shortcut-btn"
                >
                  <Search size={16} color="var(--primary)" />
                  <span>Profile Lookup Portal</span>
                </button>
              </div>
            </div>
          </div>
        )}







        {activeMenu === 'inventory_log' && (
          <div className="diagnostics-card" style={{ padding: '24px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {inventorySubView === 'breakdown' ? (
              (() => {
                const clientMap = {};
                const filtered = inventoryLogs.filter(row => {
                  if (inventoryWarehouseFilter !== 'All' && row.warehouse_name !== inventoryWarehouseFilter) {
                    return false;
                  }
                  return true;
                });

                filtered.forEach(row => {
                  if (!row.client_name) return;
                  const client = row.client_name;
                  if (!clientMap[client]) {
                    clientMap[client] = {
                      clientName: client,
                      chambers: new Set(),
                      bookBalance: 0,
                      physicalBoxes: 0,
                      warehouseName: row.warehouse_name || '-'
                    };
                  }
                  if (row.chamber_name) clientMap[client].chambers.add(row.chamber_name);
                  clientMap[client].bookBalance += parseInt(row.calculated_balance, 10) || 0;
                  clientMap[client].physicalBoxes += parseInt(row.physical_audit_count, 10) || 0;
                });

                const breakdownList = Object.values(clientMap).map(item => ({
                  ...item,
                  chambersList: Array.from(item.chambers).join(', ') || '-'
                }));

                const totalBreakdownItems = breakdownList.length;
                const indexOfLastItem = breakdownCurrentPage * breakdownPerPage;
                const indexOfFirstItem = indexOfLastItem - breakdownPerPage;
                const currentBreakdownItems = breakdownList.slice(indexOfFirstItem, indexOfLastItem);

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                          onClick={() => setInventorySubView('main')}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--bg-main)',
                            color: 'var(--text-dark)',
                            fontWeight: '700',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          ← Back
                        </button>
                        <div>
                          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
                            Client Box Inventory Breakdown
                          </h2>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                            Warehouse: {inventoryWarehouseFilter === 'All' ? 'All Warehouses' : inventoryWarehouseFilter}
                          </p>
                        </div>
                      </div>

                      {/* Export CSV */}
                      <button
                        onClick={() => {
                          if (breakdownList.length === 0) {
                            alert('No data to export.');
                            return;
                          }
                          const headers = 'Client Name,Warehouse Name,Active Chambers,Book Balance,Physical Floor Box Count\n';
                          const csvContent = headers + breakdownList.map(row => {
                            return `"${row.clientName || '-'}","${row.warehouseName || '-'}","${row.chambersList || '-'}",${row.bookBalance},${row.physicalBoxes}`;
                          }).join('\n');
                          downloadCsv(`Client_Box_Breakdown_${inventoryWarehouseFilter}_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
                        }}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          backgroundColor: 'var(--primary)',
                          color: '#ffffff',
                          fontWeight: '700',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Download size={14} />
                        Export Breakdown CSV
                      </button>
                    </div>

                    {/* Table */}
                    {currentBreakdownItems.length === 0 ? (
                      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <span>No client stock records found.</span>
                      </div>
                    ) : (
                      <>
                        <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                          <table className="logs-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Client Name</th>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Warehouse</th>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Active Chambers</th>
                                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Book Balance</th>
                                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Physical Boxes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentBreakdownItems.map((client, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                  <td style={{ padding: '12px 16px', fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>{client.clientName}</td>
                                  <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{client.warehouseName}</td>
                                  <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{client.chambersList}</td>
                                  <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-dark)' }}>{client.bookBalance.toLocaleString()}</td>
                                  <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.82rem', fontWeight: '800', color: 'var(--primary)' }}>{client.physicalBoxes.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination Bar */}
                        <PaginationBar
                          page={breakdownCurrentPage}
                          totalItems={totalBreakdownItems}
                          pageSize={breakdownPerPage}
                          onPageChange={setBreakdownCurrentPage}
                          itemLabel="clients"
                        />
                      </>
                    )}
                  </div>
                );
              })()
            ) : (
              // Main Stock Reconciliation Page
              <>
                {/* Header section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
                      Inventory Stock Reconciliation
                    </h2>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                      Reconcile paper stock balances (Inward - Outward) with daily physical floor counts.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={loadInventoryReconciliationData}
                      disabled={loadingInventory}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg-main)',
                        color: 'var(--text-dark)',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Activity size={14} className={loadingInventory ? 'spin' : ''} />
                      Refresh
                    </button>
                    <button
                      onClick={() => {
                        if (inventoryLogs.length === 0) {
                          alert('No data to export.');
                          return;
                        }
                        const headers = 'Client Name,Warehouse Name,Total Inward Boxes,Total Outward Boxes,Book Balance,Physical Audit Count,Last Audit Date,Chamber Name,Discrepancy/Variance\n';
                        const csvContent = headers + inventoryLogs.map(row => {
                          const auditDate = row.last_audit_date ? new Date(row.last_audit_date).toLocaleDateString('en-GB') : '-';
                          return `"${row.client_name || '-'}","${row.warehouse_name || '-'}",${row.total_inward_boxes},${row.total_outward_boxes},${row.calculated_balance},${row.physical_audit_count},"${auditDate}","${row.chamber_name || '-'}",${row.discrepancy}`;
                        }).join('\n');
                        downloadCsv(`ReeferON_InventoryReconciliation_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
                      }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        backgroundColor: 'var(--primary)',
                        color: '#ffffff',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Download size={14} />
                      Export CSV
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {inventoryError && (
                  <LoadErrorBanner
                    message={inventoryError}
                    onRetry={loadInventoryReconciliationData}
                    onDismiss={() => setInventoryError('')}
                  />
                )}

                {(() => {
                  const uniqueClients = new Set(inventoryLogs.map(row => row.client_name).filter(Boolean)).size;
                  const uniqueChambers = new Set(inventoryLogs.map(row => row.chamber_name).filter(Boolean)).size;
                  const totalBoxes = inventoryLogs.reduce((sum, row) => sum + (parseInt(row.physical_audit_count, 10) || 0), 0);

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
                      {/* Warehouse Top Filter */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '280px' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Filter by Warehouse
                        </label>
                        <select
                          value={inventoryWarehouseFilter}
                          onChange={(e) => setInventoryWarehouseFilter(e.target.value)}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                            fontSize: '0.82rem',
                            outline: 'none',
                            backgroundColor: 'var(--bg-main)',
                            color: 'var(--text-dark)',
                            cursor: 'pointer',
                            fontWeight: '700'
                      }}
                    >
                      <option value="All">All Warehouses</option>
                      {warehousesList.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>

                  {/* Overview Stats Cards Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {/* Card 1: Total Clients */}
                    <div className="diagnostic-card" style={{ padding: '16px 20px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Clients</span>
                        <div style={{ backgroundColor: 'var(--primary-light)', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
                          <Users size={16} color="var(--primary)" />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '4px' }}>
                        <div>
                          <h3 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: 'var(--text-dark)' }}>{uniqueClients}</h3>
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Unique active clients</span>
                        </div>
                        <button
                          onClick={() => {
                            setInventorySubView('breakdown');
                            setBreakdownCurrentPage(1);
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'var(--primary)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Eye size={12} /> View Details
                        </button>
                      </div>
                    </div>

                    {/* Card 2: Total Physical Boxes */}
                    <div className="diagnostic-card" style={{ padding: '16px 20px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Boxes</span>
                        <div style={{ backgroundColor: '#e0f2fe', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
                          <Package size={16} color="#0284c7" />
                        </div>
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: 'var(--text-dark)' }}>{totalBoxes.toLocaleString()}</h3>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Boxes stored on floor</span>
                      </div>
                    </div>

                    {/* Card 3: Total Chambers */}
                    <div className="diagnostic-card" style={{ padding: '16px 20px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Chambers</span>
                        <div style={{ backgroundColor: '#fef3c7', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
                          <LayoutGrid size={16} color="#d97706" />
                        </div>
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: 'var(--text-dark)' }}>{uniqueChambers}</h3>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Chambers with inventory</span>
                      </div>
                    </div>
                  </div>
                </div>
                  );
                })()}

                {/* Filter / Search bar */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 2, minWidth: '240px' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>Search Client Name</label>
                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="Search by client name..."
                        value={inventorySearch}
                        onChange={(e) => setInventorySearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px 8px 34px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)',
                          fontSize: '0.8rem',
                          outline: 'none',
                          backgroundColor: 'var(--bg-main)',
                          color: 'var(--text-dark)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Discrepancy Only Checkbox */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                    <input
                      type="checkbox"
                      id="inventoryDiscrepancyOnly"
                      checked={inventoryDiscrepancyFilter}
                      onChange={(e) => setInventoryDiscrepancyFilter(e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <label htmlFor="inventoryDiscrepancyOnly" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dark)', cursor: 'pointer' }}>
                      Discrepancy Only (Mismatch Stock)
                    </label>
                  </div>
                </div>

                {/* Inventory Table */}
                {loadingInventory ? (
                  <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <span>Calculating inventory stock reconciliation...</span>
                  </div>
                ) : inventoryLogs.length === 0 ? (
                  <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <span>No stock records found matching filters.</span>
                  </div>
                ) : (
                  <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    <table className="logs-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Client</th>
                          <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Warehouse</th>
                          <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Inward (+)</th>
                          <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Outward (-)</th>
                          <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Book Balance</th>
                          <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Physical Floor Audit</th>
                          <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Variance / Discrepancy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryLogs
                          .filter(row => {
                            if (inventoryDiscrepancyFilter) {
                              return Number(row.discrepancy) !== 0;
                            }
                            return true;
                          })
                          .map((row, idx) => {
                            const hasDiscrepancy = Number(row.discrepancy) !== 0;
                            const formattedDate = row.last_audit_date ? new Date(row.last_audit_date).toLocaleDateString('en-GB') : '-';
                            return (
                              <tr key={idx} style={{ borderBottom: '1px solid var(--border)', backgroundColor: hasDiscrepancy ? 'rgba(239, 68, 68, 0.03)' : 'transparent' }}>
                                <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-dark)', fontWeight: '700' }}>
                                  {row.client_name}
                                </td>
                                <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  {row.warehouse_name || '-'}
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-dark)' }}>
                                  {row.total_inward_boxes.toLocaleString()}
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-dark)' }}>
                                  {row.total_outward_boxes.toLocaleString()}
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary)' }}>
                                  {row.calculated_balance.toLocaleString()}
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.8rem' }}>
                                  <span style={{ fontWeight: '700', color: 'var(--text-dark)' }}>{row.physical_audit_count.toLocaleString()}</span>
                                  {row.chamber_name && (
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                      {row.chamber_name} ({formattedDate})
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                  {hasDiscrepancy ? (
                                    <span style={{
                                      padding: '4px 8px',
                                      borderRadius: 'var(--radius-sm)',
                                      backgroundColor: '#fee2e2',
                                      color: '#ef4444',
                                      fontWeight: '800',
                                      fontSize: '0.74rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      ⚠️ {row.discrepancy > 0 ? `+${row.discrepancy} Excess` : `${row.discrepancy} Shortage`}
                                    </span>
                                  ) : (
                                    <span style={{
                                      padding: '4px 8px',
                                      borderRadius: 'var(--radius-sm)',
                                      backgroundColor: '#dcfce7',
                                      color: '#15803d',
                                      fontWeight: '800',
                                      fontSize: '0.74rem'
                                    }}>
                                      ✓ Matched
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

          </div>
        )}

        {activeMenu === 'daily_box_tracker' && (() => {
          const liveWarehouses = inventoryFilterOptions.warehouses || [];
          const selectedWh = liveWarehouses.find(
            (w) => String(w.name).toLowerCase().trim() === String(deltasWarehouseFilter).toLowerCase().trim()
          );

          const clientsForWarehouse = deltasWarehouseFilter === 'All'
            ? Array.from(new Set(liveWarehouses.flatMap((w) => w.clients || []))).sort((a, b) => a.localeCompare(b))
            : (selectedWh?.clients || []);

          const filteredRows = (dailyDeltas || [])
            .filter((row) => {
              if (!row || !row.client_name) return false;
              if (deltasWarehouseFilter !== 'All') {
                const rowWh = String(row.warehouse_name || '').toLowerCase().trim();
                const selWh = String(deltasWarehouseFilter).toLowerCase().trim();
                if (rowWh !== selWh) return false;
              }
              if (deltasClientFilter !== 'All' && row.client_name !== deltasClientFilter) return false;
              return true;
            })
            .slice()
            .sort((a, b) => {
              // Latest update on top
              const da = String(a.latest_date || '');
              const db = String(b.latest_date || '');
              if (db !== da) return db.localeCompare(da);
              return String(a.client_name || '').localeCompare(String(b.client_name || ''));
            });

          const totalBoxes = filteredRows.reduce((sum, r) => sum + (Number(r.latest_count) || 0), 0);
          const netDelta = filteredRows.reduce((sum, r) => sum + (Number(r.delta) || 0), 0);
          const uniqueClientsInData = new Set(filteredRows.map((r) => r.client_name)).size;

          // Client-wise box totals from live filtered rows (warehouse + client filters)
          const clientBoxMap = {};
          filteredRows.forEach((r) => {
            const name = r.client_name || 'Unknown';
            clientBoxMap[name] = (clientBoxMap[name] || 0) + (Number(r.latest_count) || 0);
          });
          const PIE_COLORS = [
            '#0284c7', '#0f766e', '#7c3aed', '#ea580c', '#16a34a',
            '#db2777', '#4f46e5', '#ca8a04', '#0891b2', '#dc2626'
          ];
          const clientPieSlices = Object.entries(clientBoxMap)
            .map(([name, boxes]) => ({ name, boxes }))
            .sort((a, b) => b.boxes - a.boxes);

          const renderClientBoxesPieSvg = () => {
            const size = 200;
            const cx = size / 2;
            const cy = size / 2;
            const radius = 78;
            const innerR = 48;
            const slices = clientPieSlices;
            const total = slices.reduce((s, x) => s + x.boxes, 0) || 0;

            if (!slices.length || total <= 0) {
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: size, height: size }}>
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                      <circle cx={cx} cy={cy} r={radius} fill="#f1f5f9" />
                      <circle cx={cx} cy={cy} r={innerR} fill="var(--surface, #fff)" />
                    </svg>
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexDirection: 'column', pointerEvents: 'none'
                    }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#94a3b8' }}>0</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8' }}>boxes</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    No client box data matches this filter.
                  </div>
                </div>
              );
            }

            const polar = (angleDeg, r) => {
              const rad = ((angleDeg - 90) * Math.PI) / 180;
              return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
            };

            let angle = 0;
            const paths = slices.map((slice, idx) => {
              const portion = slice.boxes / total;
              const sweep = Math.max(portion * 360, portion > 0 ? 0.3 : 0);
              const start = angle;
              const end = angle + sweep;
              angle = end;
              const large = sweep > 180 ? 1 : 0;
              const p1 = polar(start, radius);
              const p2 = polar(end, radius);
              const p3 = polar(end, innerR);
              const p4 = polar(start, innerR);
              const d = [
                `M ${p1.x} ${p1.y}`,
                `A ${radius} ${radius} 0 ${large} 1 ${p2.x} ${p2.y}`,
                `L ${p3.x} ${p3.y}`,
                `A ${innerR} ${innerR} 0 ${large} 0 ${p4.x} ${p4.y}`,
                'Z'
              ].join(' ');
              return {
                ...slice,
                d,
                color: PIE_COLORS[idx % PIE_COLORS.length],
                pct: Math.round(portion * 1000) / 10
              };
            });

            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
                  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Client boxes distribution">
                    {paths.map((p) => (
                      <path
                        key={p.name}
                        d={p.d}
                        fill={p.color}
                        stroke="var(--surface, #fff)"
                        strokeWidth={2}
                      >
                        <title>{`${p.name}: ${p.boxes.toLocaleString()} boxes (${p.pct}%)`}</title>
                      </path>
                    ))}
                  </svg>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    pointerEvents: 'none'
                  }}>
                    <span style={{
                      fontSize: String(total).length > 5 ? '0.95rem' : '1.25rem',
                      fontWeight: 900,
                      color: 'var(--text-dark)',
                      lineHeight: 1.1
                    }}>
                      {loadingDeltas ? '…' : total.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      boxes
                    </span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', marginTop: 2 }}>
                      {uniqueClientsInData} clients
                    </span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  maxHeight: 200,
                  overflowY: 'auto',
                  minWidth: 200,
                  flex: 1
                }}>
                  {paths.map((p) => (
                    <div
                      key={p.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: '0.76rem'
                      }}
                    >
                      <span style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        backgroundColor: p.color,
                        flexShrink: 0
                      }} />
                      <span style={{
                        fontWeight: 700,
                        color: 'var(--text-dark)',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                        title={p.name}
                      >
                        {p.name}
                      </span>
                      <span style={{ fontWeight: 800, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {p.boxes.toLocaleString()}
                        <span style={{ fontWeight: 600, marginLeft: 4 }}>({p.pct}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          };

          const clientCountLabel = deltasWarehouseFilter === 'All'
            ? `Showing ${filteredRows.length} lots · ${uniqueClientsInData} clients · ${totalBoxes.toLocaleString()} boxes`
            : `${deltasWarehouseFilter}: ${filteredRows.length} lots · ${uniqueClientsInData} clients · ${totalBoxes.toLocaleString()} boxes`;

          const pageStart = (deltasCurrentPage - 1) * deltasPerPage;
          const paginatedRows = filteredRows.slice(pageStart, pageStart + deltasPerPage);

          const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            const parts = String(dateStr).split('-');
            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
            return dateStr;
          };

          const handleExportBoxInventoryCSV = () => {
            if (!filteredRows.length) return;
            const headers = 'Client,Warehouse,Chamber,Previous Qty,Previous Temp,Previous Date,Latest Qty,Latest Temp,Latest Date,Plus/Minus,Status\n';
            const csvContent = headers + filteredRows.map((row) => {
              const latestQty = Math.max(0, Number(row.latest_count) || 0);
              const prevQty = Math.max(0, Number(row.prev_count) || 0);
              const inwardQty = Number(row.inward_qty) >= 0
                ? Number(row.inward_qty)
                : (latestQty > prevQty ? latestQty - prevQty : 0);
              const outwardQty = Number(row.outward_qty) >= 0
                ? Number(row.outward_qty)
                : (prevQty > latestQty ? prevQty - latestQty : 0);
              const status = inwardQty > 0 ? 'Plus' : outwardQty > 0 ? 'Minus' : 'No Change';
              const plusMinus = inwardQty > 0 ? `+${inwardQty}` : outwardQty > 0 ? `-${outwardQty}` : '0';
              const latestTemp = row.latest_temp != null && row.latest_temp !== '' ? `${row.latest_temp}°C` : '';
              const prevTemp = row.prev_temp != null && row.prev_temp !== '' ? `${row.prev_temp}°C` : '';
              return [
                `"${row.client_name || '-'}"`,
                `"${row.warehouse_name || '-'}"`,
                `"${row.chamber_name || '-'}"`,
                row.prev_date ? prevQty : '',
                prevTemp,
                `"${formatDate(row.prev_date)}"`,
                latestQty,
                latestTemp,
                `"${formatDate(row.latest_date)}"`,
                plusMinus,
                `"${status}"`
              ].join(',');
            }).join('\n');
            const whTag = deltasWarehouseFilter === 'All' ? 'All' : String(deltasWarehouseFilter).replace(/\s+/g, '_');
            downloadCsv(`Box_Inventory_${whTag}_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
          };

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: '70vh' }}>
              {deltasViewClient ? (() => {
                const row = deltasViewClient;
                const latestQty = Math.max(0, Number(row.latest_count) || 0);
                const prevQty = Math.max(0, Number(row.prev_count) || 0);
                const inwardQty = Number(row.inward_qty) >= 0
                  ? Number(row.inward_qty)
                  : (latestQty > prevQty ? latestQty - prevQty : 0);
                const outwardQty = Number(row.outward_qty) >= 0
                  ? Number(row.outward_qty)
                  : (prevQty > latestQty ? prevQty - latestQty : 0);
                const history = Array.isArray(row.history)
                  ? [...row.history].sort((a, b) => {
                      const da = String(a.date || a.entry_date || '');
                      const db = String(b.date || b.entry_date || '');
                      if (db !== da) return db.localeCompare(da);
                      const shiftOf = (h) => resolveShiftLabel(h.shift || h.slot, h.inspection_time, null);
                      const sa = shiftOf(a) === 'Evening' ? 1 : 0;
                      const sb = shiftOf(b) === 'Evening' ? 1 : 0;
                      if (sb !== sa) return sb - sa;
                      return (Number(b.id) || 0) - (Number(a.id) || 0);
                    })
                  : [];

                const historyStart = (deltasViewHistoryPage - 1) * deltasViewHistoryPerPage;
                const paginatedHistory = history.slice(historyStart, historyStart + deltasViewHistoryPerPage);

                const handleExportClientHistoryCSV = () => {
                  if (!history.length) return;
                  const headers = 'Date,Slot,Box Qty,Box Temp,Plus/Minus,Status\n';
                  const csvContent = headers + history.map((h, i) => {
                    const countRaw = h.box_count ?? h.count;
                    const count = countRaw === null || countRaw === undefined || countRaw === ''
                      ? ''
                      : Math.max(0, Number(countRaw) || 0);
                    const olderRaw = i < history.length - 1
                      ? (history[i + 1].box_count ?? history[i + 1].count)
                      : null;
                    const older = olderRaw === null || olderRaw === undefined || olderRaw === ''
                      ? null
                      : Math.max(0, Number(olderRaw) || 0);
                    const step = (count === '' || older === null) ? null : Number(count) - older;
                    const status = step == null ? 'Start' : step > 0 ? 'Plus' : step < 0 ? 'Minus' : 'No Change';
                    const plusMinus = step == null ? '' : step > 0 ? `+${step}` : step < 0 ? `-${Math.abs(step)}` : '0';
                    const tempRaw = h.box_temp ?? h.temp ?? h.chamber_temp;
                    const temp = tempRaw != null && tempRaw !== '' && Number.isFinite(Number(tempRaw))
                      ? `${Number(tempRaw)}°C`
                      : '';
                    const slot = resolveShiftLabel(h.shift || h.slot, h.inspection_time, null);
                    const dateVal = h.date || h.entry_date;
                    return [
                      `"${formatDate(dateVal)}"`,
                      `"${slot}"`,
                      count,
                      temp,
                      plusMinus,
                      `"${status}"`
                    ].join(',');
                  }).join('\n');
                  const safeName = String(row.client_name || 'Client').replace(/[^\w\-]+/g, '_');
                  downloadCsv(`Client_History_${safeName}_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
                };

                return (
                  <div className="diagnostics-card" style={{
                    flex: 1,
                    padding: 24,
                    backgroundColor: 'var(--surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 14, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setDeltasViewClient(null);
                            setDeltasViewHistoryPage(1);
                          }}
                          style={{
                            border: '1px solid var(--border)',
                            background: '#fff',
                            borderRadius: 'var(--radius-sm)',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            color: 'var(--text-dark)'
                          }}
                        >
                          ← Back
                        </button>
                        <div>
                          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                            {row.client_name}
                          </h2>
                          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {row.warehouse_name || '-'} · {row.chamber_name || '-'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportClientHistoryCSV}
                        disabled={history.length === 0}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          backgroundColor: history.length === 0 ? '#94a3b8' : '#22c55e',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: history.length === 0 ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <Download size={14} />
                        Export
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                      <div style={{ padding: 16, background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>Previous Qty</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 6 }}>
                          {row.prev_date ? prevQty.toLocaleString() : '—'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>{formatDate(row.prev_date)}</div>
                      </div>
                      <div style={{ padding: 16, background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>Latest Qty</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 6, color: 'var(--primary)' }}>
                          {latestQty.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>{formatDate(row.latest_date)}</div>
                      </div>
                      <div style={{ padding: 16, background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>Latest Slot</div>
                        {(() => {
                          const slotLabel = resolveShiftLabel(row.latest_shift || row.latest_slot, null, null);
                          const isMorning = slotLabel === 'Morning';
                          return (
                            <>
                              <div style={{
                                fontSize: '1.2rem',
                                fontWeight: 800,
                                marginTop: 6,
                                color: isMorning ? '#0369a1' : '#b45309'
                              }}>
                                {slotLabel}
                              </div>
                              {row.prev_shift && (
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                  Prev: {resolveShiftLabel(row.prev_shift || row.prev_slot, null, null)}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <div style={{ padding: 16, background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>Box Temp</div>
                        {(() => {
                          const latestTempRaw = row.latest_temp ?? row.box_temp ?? row.chamber_temp;
                          const latestTemp = latestTempRaw != null && latestTempRaw !== '' && Number.isFinite(Number(latestTempRaw))
                            ? Number(latestTempRaw)
                            : null;
                          const prevTempRaw = row.prev_temp;
                          const prevTemp = prevTempRaw != null && prevTempRaw !== '' && Number.isFinite(Number(prevTempRaw))
                            ? Number(prevTempRaw)
                            : null;
                          return (
                            <>
                              <div style={{
                                fontSize: '1.4rem',
                                fontWeight: 800,
                                marginTop: 6,
                                color: latestTemp == null ? '#64748b' : latestTemp <= -18 ? '#15803d' : '#b91c1c'
                              }}>
                                {latestTemp == null ? '—' : `${latestTemp}°C`}
                              </div>
                              {prevTemp != null && (
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                  Prev: {prevTemp}°C
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <div style={{ padding: 16, background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          {inwardQty > 0 ? 'Plus (In)' : outwardQty > 0 ? 'Minus (Out)' : 'In / Out'}
                        </div>
                        <div style={{
                          fontSize: '1.4rem',
                          fontWeight: 800,
                          marginTop: 6,
                          color: inwardQty > 0 ? '#16a34a' : outwardQty > 0 ? '#dc2626' : '#64748b'
                        }}>
                          {inwardQty > 0 ? `+${inwardQty}` : outwardQty > 0 ? `-${outwardQty}` : '0'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                        <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                          Audit History
                        </h3>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {history.length} records
                        </span>
                      </div>
                      {history.length === 0 ? (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No history available.</div>
                      ) : (
                        <>
                          <div className="table-responsive">
                            <table className="logs-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Date</th>
                                  <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Slot</th>
                                  <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Box Qty</th>
                                  <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Box Temp</th>
                                  <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>In / Out</th>
                                </tr>
                              </thead>
                              <tbody>
                                {paginatedHistory.map((h, i) => {
                                  const globalIndex = historyStart + i;
                                  const countRaw = h.box_count ?? h.count;
                                  const count = countRaw === null || countRaw === undefined || countRaw === ''
                                    ? null
                                    : Math.max(0, Number(countRaw) || 0);
                                  const olderRaw = globalIndex < history.length - 1
                                    ? (history[globalIndex + 1].box_count ?? history[globalIndex + 1].count)
                                    : null;
                                  const older = olderRaw === null || olderRaw === undefined || olderRaw === ''
                                    ? null
                                    : Math.max(0, Number(olderRaw) || 0);
                                  const step = (count === null || older === null) ? null : count - older;
                                  const tempRaw = h.box_temp ?? h.temp ?? h.chamber_temp;
                                  const tempVal = tempRaw != null && tempRaw !== '' && Number.isFinite(Number(tempRaw))
                                    ? Number(tempRaw)
                                    : null;
                                  const slotLabel = resolveShiftLabel(h.shift || h.slot, h.inspection_time, null);
                                  const isMorning = slotLabel === 'Morning';
                                  const isLastRow = i === paginatedHistory.length - 1;
                                  const cellBorder = isLastRow ? 'none' : undefined;
                                  const dateVal = h.date || h.entry_date;
                                  return (
                                    <tr key={`${dateVal}-${slotLabel}-${h.id || globalIndex}`}>
                                      <td style={{ padding: '10px 12px', fontWeight: 600, borderBottom: cellBorder }}>{formatDate(dateVal)}</td>
                                      <td style={{ padding: '10px 12px', textAlign: 'center', borderBottom: cellBorder }}>
                                        <span style={{
                                          padding: '3px 8px',
                                          borderRadius: 'var(--radius-sm)',
                                          backgroundColor: isMorning ? '#e0f2fe' : '#fef3c7',
                                          color: isMorning ? '#0369a1' : '#b45309',
                                          fontWeight: 800,
                                          fontSize: '0.7rem'
                                        }}>
                                          {slotLabel}
                                        </span>
                                      </td>
                                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, borderBottom: cellBorder }}>
                                        {count === null ? '—' : count.toLocaleString()}
                                      </td>
                                      <td style={{
                                        padding: '10px 12px',
                                        textAlign: 'center',
                                        fontWeight: 800,
                                        borderBottom: cellBorder,
                                        color: tempVal == null ? '#64748b' : tempVal <= -18 ? '#15803d' : '#b91c1c'
                                      }}>
                                        {tempVal == null ? '—' : `${tempVal}°C`}
                                      </td>
                                      <td style={{
                                        padding: '10px 12px',
                                        textAlign: 'center',
                                        fontWeight: 700,
                                        borderBottom: cellBorder,
                                        color: step == null ? '#64748b' : step > 0 ? '#16a34a' : step < 0 ? '#dc2626' : '#64748b'
                                      }}>
                                        {step == null
                                          ? '—'
                                          : step > 0
                                            ? `Plus: +${step}`
                                            : step < 0
                                              ? `Minus: -${Math.abs(step)}`
                                              : '0'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          <PaginationBar
                            page={deltasViewHistoryPage}
                            totalItems={history.length}
                            pageSize={deltasViewHistoryPerPage}
                            onPageChange={setDeltasViewHistoryPage}
                            itemLabel="records"
                          />
                        </>
                      )}
                    </div>
                  </div>
                );
              })() : (
              <>
              <div className="diagnostics-card" style={{ padding: '24px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
                      Daily Box Inventory Tracker
                    </h2>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                      Select a warehouse to view its box inventory below.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadDailyBoxTrackerData()}
                    disabled={loadingDeltas}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg-main)',
                      color: 'var(--text-dark)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: loadingDeltas ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    {loadingDeltas ? <Loader2 size={14} className="spinner-icon" /> : <Activity size={14} />}
                    Refresh Live Data
                  </button>
                </div>

                {deltasError && (
                  <LoadErrorBanner
                    message={deltasError}
                    onRetry={() => loadDailyBoxTrackerData()}
                    onDismiss={() => setDeltasError('')}
                  />
                )}
              </div>

              {/* Filters — separate outer div */}
              <div className="diagnostics-card" style={{
                padding: 16,
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                alignItems: 'flex-end'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 220 }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Warehouse (Live DB)
                  </label>
                  <select
                    value={deltasWarehouseFilter}
                    onChange={(e) => {
                      const wh = e.target.value;
                      setDeltasWarehouseFilter(wh);
                      setDeltasClientFilter('All');
                      setDeltasCurrentPage(1);
                      setDeltasViewClient(null);
                      loadDailyBoxTrackerData(wh);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      backgroundColor: deltasWarehouseFilter !== 'All' ? '#e0f2fe' : '#fff',
                      color: 'var(--text-dark)',
                      outline: 'none',
                      cursor: 'pointer',
                      height: 37
                    }}
                  >
                    <option value="All">
                      All Warehouses ({inventoryFilterOptions.total_warehouses})
                    </option>
                    {liveWarehouses.map((w) => (
                      <option key={w.name} value={w.name}>
                        {w.name} ({w.client_count} clients)
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 220 }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Client (by Warehouse)
                  </label>
                  <select
                    value={deltasClientFilter}
                    onChange={(e) => {
                      setDeltasClientFilter(e.target.value);
                      setDeltasCurrentPage(1);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      backgroundColor: deltasClientFilter !== 'All' ? '#e0f2fe' : '#fff',
                      color: 'var(--text-dark)',
                      outline: 'none',
                      cursor: 'pointer',
                      height: 37
                    }}
                  >
                    <option value="All">
                      All Clients ({clientsForWarehouse.length})
                    </option>
                    {clientsForWarehouse.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDeltasWarehouseFilter('All');
                    setDeltasClientFilter('All');
                    setDeltasCurrentPage(1);
                    loadDailyBoxTrackerData('All');
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    height: 37
                  }}
                >
                  Clear Filters
                </button>

                <div style={{
                  marginLeft: 'auto',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  color: '#0369a1',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  height: 37,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: loadingDeltas ? '#94a3b8' : '#22c55e',
                    boxShadow: loadingDeltas ? 'none' : '0 0 0 3px rgba(34,197,94,0.25)',
                    display: 'inline-block'
                  }} />
                  {loadingDeltas ? 'Loading live DB…' : clientCountLabel}
                </div>
              </div>

              {/* Single SVG — client-wise boxes (follows warehouse/client filters) */}
              <div className="diagnostics-card" style={{
                padding: '18px 20px',
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: loadingDeltas ? '#94a3b8' : '#22c55e',
                      boxShadow: loadingDeltas ? 'none' : '0 0 0 3px rgba(34,197,94,0.2)'
                    }} />
                    <h3 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                      Clients × Boxes
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {deltasWarehouseFilter === 'All' ? 'All Warehouses' : deltasWarehouseFilter}
                    {deltasClientFilter !== 'All' ? ` · ${deltasClientFilter}` : ''}
                    {' · '}
                    {loadingDeltas ? 'syncing…' : 'live DB'}
                  </span>
                </div>
                {renderClientBoxesPieSvg()}
              </div>

              {/* Warehouse-wise data table */}
              <div className="diagnostics-card" style={{
                padding: 20,
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 14
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                    {deltasWarehouseFilter === 'All' ? 'All Warehouses — Box Inventory' : `${deltasWarehouseFilter} — Box Inventory`}
                  </h3>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      Total boxes: <strong style={{ color: 'var(--text-dark)' }}>{totalBoxes.toLocaleString()}</strong>
                    </span>
                    <span style={{
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      color: netDelta > 0 ? '#16a34a' : netDelta < 0 ? '#dc2626' : '#64748b'
                    }}>
                      {netDelta > 0
                        ? `Net inward: +${netDelta}`
                        : netDelta < 0
                          ? `Net outward: ${Math.abs(netDelta)}`
                          : 'Net: No change'}
                    </span>
                    <button
                      type="button"
                      onClick={handleExportBoxInventoryCSV}
                      disabled={filteredRows.length === 0}
                      style={{
                        padding: '7px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        backgroundColor: filteredRows.length === 0 ? '#94a3b8' : '#22c55e',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: filteredRows.length === 0 ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5
                      }}
                    >
                      <Download size={14} />
                      Export
                    </button>
                  </div>
                </div>

                {loadingDeltas ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Loading warehouse inventory…
                  </div>
                ) : filteredRows.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No box inventory data matches this filter.
                  </div>
                ) : (
                  <>
                    <div className="table-responsive" style={{ maxHeight: 520, overflowY: 'auto' }}>
                      <table className="logs-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Client</th>
                            <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Warehouse</th>
                            <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Chamber</th>
                            <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Prev Qty</th>
                            <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Latest Qty</th>
                            <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Box Temp</th>
                            <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Slot</th>
                            <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>In / Out</th>
                            <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Latest Date</th>
                            <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                            <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedRows.map((row, idx) => {
                            const latestQty = Math.max(0, Number(row.latest_count) || 0);
                            const prevQty = Math.max(0, Number(row.prev_count) || 0);
                            const inwardQty = Number(row.inward_qty) >= 0
                              ? Number(row.inward_qty)
                              : (latestQty > prevQty ? latestQty - prevQty : 0);
                            const outwardQty = Number(row.outward_qty) >= 0
                              ? Number(row.outward_qty)
                              : (prevQty > latestQty ? prevQty - latestQty : 0);
                            const isUp = inwardQty > 0;
                            const isDown = outwardQty > 0;
                            // Only one at a time: Plus OR Minus
                            const flowLabel = isUp
                              ? `Plus: +${inwardQty}`
                              : isDown
                                ? `Minus: -${outwardQty}`
                                : '0';
                            const latestTempRaw = row.latest_temp ?? row.box_temp ?? row.chamber_temp;
                            const latestTemp = latestTempRaw != null && latestTempRaw !== '' && Number.isFinite(Number(latestTempRaw))
                              ? Number(latestTempRaw)
                              : null;
                            const slotLabel = resolveShiftLabel(row.latest_shift || row.latest_slot, null, null);
                            const isMorningSlot = slotLabel === 'Morning';

                            return (
                              <tr key={`${row.client_name}-${row.chamber_name}-${idx}`} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '10px 12px', fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-dark)' }}>{row.client_name}</td>
                                <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{row.warehouse_name || '-'}</td>
                                <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{row.chamber_name || '-'}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '0.8rem' }}>
                                  {row.prev_date ? prevQty.toLocaleString() : '-'}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '0.88rem', fontWeight: 900, color: 'var(--primary)' }}>
                                  {latestQty.toLocaleString()}
                                </td>
                                <td style={{
                                  padding: '10px 12px',
                                  textAlign: 'center',
                                  fontWeight: 800,
                                  fontSize: '0.8rem',
                                  color: latestTemp == null ? '#64748b' : latestTemp <= -18 ? '#15803d' : '#b91c1c'
                                }}>
                                  {latestTemp == null ? '—' : `${latestTemp}°C`}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                  <span style={{
                                    padding: '3px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    backgroundColor: isMorningSlot ? '#e0f2fe' : '#fef3c7',
                                    color: isMorningSlot ? '#0369a1' : '#b45309',
                                    fontWeight: 800,
                                    fontSize: '0.7rem'
                                  }}>
                                    {slotLabel}
                                  </span>
                                </td>
                                <td style={{
                                  padding: '10px 12px',
                                  textAlign: 'center',
                                  fontWeight: 800,
                                  fontSize: '0.8rem',
                                  color: isUp ? '#16a34a' : isDown ? '#dc2626' : '#64748b'
                                }}>
                                  {flowLabel}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                  {formatDate(row.latest_date)}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                  <span style={{
                                    padding: '3px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    backgroundColor: isUp ? '#dcfce7' : isDown ? '#fee2e2' : '#f1f5f9',
                                    color: isUp ? '#15803d' : isDown ? '#b91c1c' : '#475569',
                                    fontWeight: 800,
                                    fontSize: '0.7rem'
                                  }}>
                                    {isUp ? 'Inward' : isDown ? 'Outward' : 'No Change'}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeltasViewHistoryPage(1);
                                      // Always open from latest loaded row so temp/qty are fresh
                                      const fresh = (dailyDeltas || []).find((r) =>
                                        r.client_name === row.client_name &&
                                        String(r.chamber_name || '') === String(row.chamber_name || '') &&
                                        String(r.warehouse_name || '') === String(row.warehouse_name || '')
                                      );
                                      setDeltasViewClient(fresh || row);
                                    }}
                                    style={{
                                      border: 'none',
                                      background: 'transparent',
                                      color: 'var(--primary)',
                                      fontWeight: 600,
                                      fontSize: '0.78rem',
                                      cursor: 'pointer',
                                      textDecoration: 'underline',
                                      padding: 0
                                    }}
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {filteredRows.length > 0 && (
                      <PaginationBar
                        page={deltasCurrentPage}
                        totalItems={filteredRows.length}
                        pageSize={deltasPerPage}
                        onPageChange={setDeltasCurrentPage}
                        itemLabel="lots"
                      />
                    )}
                  </>
                )}
              </div>
              </>
              )}
            </div>
          );
        })()}


        {activeMenu === 'history_logs' && (
          <div className="diagnostics-card" style={{ padding: '24px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Tab Header & Control Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
                  System History Database Logs
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Select log category and filter by warehouse, search query or date range.
                </p>
              </div>

              {/* Tabs Switcher */}
              <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--bg-main)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
                <button
                  onClick={() => setHistoryTab('daily')}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: historyTab === 'daily' ? 'var(--surface)' : 'transparent',
                    color: historyTab === 'daily' ? 'var(--primary)' : 'var(--text-dark)',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: historyTab === 'daily' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Chamber Logs
                </button>
                <button
                  onClick={() => setHistoryTab('inward')}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: historyTab === 'inward' ? 'var(--surface)' : 'transparent',
                    color: historyTab === 'inward' ? 'var(--primary)' : 'var(--text-dark)',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: historyTab === 'inward' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Inward Logs
                </button>
                <button
                  onClick={() => setHistoryTab('outward')}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: historyTab === 'outward' ? 'var(--surface)' : 'transparent',
                    color: historyTab === 'outward' ? 'var(--primary)' : 'var(--text-dark)',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: historyTab === 'outward' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Outward Logs
                </button>
              </div>
            </div>

            {/* Filters Bar */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              
              {/* Warehouse filter dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '160px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>Warehouse Name</label>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => {
                    setSelectedWarehouse(e.target.value);
                    setHistoryPage(1);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    fontSize: '0.8rem',
                    outline: 'none',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-dark)',
                    fontWeight: '600'
                  }}
                >
                  <option value="All">All Warehouses</option>
                  {warehousesList.map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              {/* Search text box */}
              <div 
                style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '200px' }}
                title={
                  historyTab === 'daily'
                    ? "Search matches: Date, Ref No, Chamber, Client Name, or Supervisor"
                    : "Search matches: Date, Ref No, Vehicle Number, Client Name, Supervisor, Transporter, or Driver"
                }
              >
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>Search Query</label>
                <input
                  type="text"
                  placeholder={
                    historyTab === 'daily' 
                      ? "Search by Ref No, Client, Chamber, Supervisor, Date..." 
                      : "Search by Ref No, Vehicle No, Client, Supervisor, Date..."
                  }
                  title={
                    historyTab === 'daily'
                      ? "Search matches: Date, Ref No, Chamber, Client Name, or Supervisor"
                      : "Search matches: Date, Ref No, Vehicle Number, Client Name, Supervisor, Transporter, or Driver"
                  }
                  value={logsSearch}
                  onChange={(e) => setLogsSearch(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    fontSize: '0.8rem',
                    outline: 'none',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-dark)'
                  }}
                />
              </div>

              {/* From Date filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '130px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFromDate(val);
                    if (val && toDate && val > toDate) {
                      setToDate(val);
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    fontSize: '0.8rem',
                    outline: 'none',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-dark)'
                  }}
                />
              </div>

              {/* To Date filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '130px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>To Date</label>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(e) => {
                    const val = e.target.value;
                    setToDate(val);
                    if (val && fromDate && val < fromDate) {
                      setFromDate(val);
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    fontSize: '0.8rem',
                    outline: 'none',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-dark)'
                  }}
                />
              </div>

              {/* Filter Buttons */}
              <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
                <button
                  onClick={() => {
                    if (fromDate && toDate && fromDate > toDate) {
                      alert("⚠️ Date Range Error:\n'From Date' must be less than or equal to 'To Date'.");
                      return;
                    }
                    setAppliedFromDate(fromDate);
                    setAppliedToDate(toDate);
                    setAppliedLogsSearch(logsSearch);
                    setHistoryPage(1);
                  }}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Search size={14} />
                  Find
                </button>

                <button
                  onClick={() => {
                    setFromDate('');
                    setToDate('');
                    setAppliedFromDate('');
                    setAppliedToDate('');
                    setAppliedLogsSearch('');
                    setLogsSearch('');
                    setHistoryPage(1);
                  }}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    backgroundColor: '#ffffff',
                    color: 'var(--text-dark)',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Reset
                </button>

                <button
                  onClick={handleExportLogsExcel}
                  disabled={logsExportLoading || loadingLogs}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: logsExportLoading ? '#94a3b8' : '#22c55e',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: logsExportLoading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={14} />
                  {logsExportLoading ? logsExportProgressLabel : 'Export'}
                </button>
                {logsExportLoading && (
                  <button
                    type="button"
                    onClick={() => {
                      exportAbortRef.current?.abort();
                      setLogsExportLoading(false);
                      setLogsExportProgressLabel('Exporting…');
                    }}
                    style={{
                      padding: '9px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #fecaca',
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      fontWeight: '700',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {exportError?.retryKey === 'history' && (
              <ExportErrorBanner
                message={exportError.message}
                retryable={exportError.retryable}
                onRetry={retryFailedExport}
                onDismiss={() => setExportError(null)}
              />
            )}

            {/* Logs Table */}
            {loadingLogs ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <span>Loading system database logs...</span>
              </div>
            ) : getFilteredHistoryLogs().length === 0 ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <span>No logs found matching your filters.</span>
              </div>
            ) : (
              <>
              <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <table className="logs-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    {historyTab === 'daily' && (
                      <tr>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Date</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Ref No</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Warehouse</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Operator Email</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Chamber</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Client Name</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Inspection Time</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Temp (°C)</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Supervisor</th>
                        <th style={{ textAlign: 'center', padding: '12px 16px' }}>Actions</th>
                      </tr>
                    )}
                    {historyTab === 'inward' && (
                      <tr>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Date</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Ref No</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Warehouse</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Operator Email</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Vehicle No</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Client</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Dock No</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Vehicle Temp</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Material Temp</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Pallets</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Unloading Duration</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Supervisor</th>
                        <th style={{ textAlign: 'center', padding: '12px 16px' }}>Actions</th>
                      </tr>
                    )}
                    {historyTab === 'outward' && (
                      <tr>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Date</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Ref No</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Warehouse</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Operator Email</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Vehicle No</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Client</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Dock No</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Vehicle Temp</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Material Temp</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Pallets</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Loading Duration</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Supervisor</th>
                        <th style={{ textAlign: 'center', padding: '12px 16px' }}>Actions</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {historyTab === 'daily' && getFilteredHistoryLogs().map((log) => {
                       if (!log) return null;
                       return (
                      <tr key={log.id}>
                        <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
                            <span>{log.formatted_date || (log.entry_date ? log.entry_date.split('T')[0] : '')}</span>
                            {log.overdue_time && log.overdue_time !== 'same day' && (
                              <span style={{ 
                                backgroundColor: '#fee2e2', 
                                color: '#dc2626', 
                                fontSize: '9px', 
                                fontWeight: 'bold', 
                                padding: '1px 4px', 
                                borderRadius: '4px', 
                                border: '0.5px solid #fca5a5'
                              }}>
                                ⚠️ Late ({log.overdue_time})
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (log.reference_no) {
                                navigator.clipboard.writeText(log.reference_no);
                                setCopiedRef(log.reference_no);
                                setTimeout(() => setCopiedRef(null), 1500);
                              }
                            }}
                            title="Click to copy Reference Number"
                            style={{ 
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: copiedRef === log.reference_no ? '#10b981' : 'var(--primary)',
                              fontWeight: '700',
                              transition: 'color 0.2s ease'
                            }}
                          >
                            {log.reference_no || '-'}
                            {log.reference_no && (
                              copiedRef === log.reference_no ? (
                                <Check size={12} color="#10b981" />
                              ) : (
                                <Copy size={10} style={{ opacity: 0.5 }} />
                              )
                            )}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="status-badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 800 }}>
                            {log.warehouse_name || 'Generic'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{renderOperatorEmail(log.operator_email)}</td>
                        <td style={{ padding: '12px 16px' }}>{log.chamber_name}</td>
                        <td style={{ padding: '12px 16px' }}>{log.client_name}</td>
                        <td style={{ padding: '12px 16px' }}>{log.inspection_time}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="status-badge" style={{ 
                            backgroundColor: log.chamber_temp <= -18 ? '#dcfce7' : '#fee2e2', 
                            color: log.chamber_temp <= -18 ? '#15803d' : '#b91c1c', 
                            fontWeight: 800 
                          }}>
                            {log.chamber_temp}°C
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>{log.monitor_supervisor_name}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {renderSaLogActions('daily', log)}
                        </td>
                      </tr>
                       )
                    })}
                    {historyTab === 'inward' && getFilteredHistoryLogs().map((log) => {
                       if (!log) return null;
                       return (
                      <tr key={log.inward_id}>
                        <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                          {log.inward_entry_date ? log.inward_entry_date.split('T')[0] : ''}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (log.reference_no) {
                                navigator.clipboard.writeText(log.reference_no);
                                setCopiedRef(log.reference_no);
                                setTimeout(() => setCopiedRef(null), 1500);
                              }
                            }}
                            title="Click to copy Reference Number"
                            style={{ 
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: copiedRef === log.reference_no ? '#10b981' : 'var(--primary)',
                              fontWeight: '700',
                              transition: 'color 0.2s ease'
                            }}
                          >
                            {log.reference_no || '-'}
                            {log.reference_no && (
                              copiedRef === log.reference_no ? (
                                <Check size={12} color="#10b981" />
                              ) : (
                                <Copy size={10} style={{ opacity: 0.5 }} />
                              )
                            )}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="status-badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 800 }}>
                            {log.warehouse_name || 'Generic'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{renderOperatorEmail(log.operator_email)}</td>
                        <td style={{ padding: '12px 16px', fontWeight: '700' }}>{log.inward_vehicle_no}</td>
                        <td style={{ padding: '12px 16px' }}>{log.inward_client_name}</td>
                        <td style={{ padding: '12px 16px' }}>{log.inward_dock_no || '-'}</td>
                        <td style={{ padding: '12px 16px' }}>{log.inward_vehicle_temp}°C</td>
                        <td style={{ padding: '12px 16px' }}>{log.inward_material_temp}°C</td>
                        <td style={{ padding: '12px 16px' }}>{log.inward_pallets_in_qty}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700 }}>
                            {formatDuration(log.inward_unloading_duration_hours, log.inward_unloading_duration_mins)}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap' }}>
                            <div>S: {log.inward_unloading_start_time || '-'}</div>
                            <div>E: {log.inward_unloading_end_time || '-'}</div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>{log.inward_unloading_supervisor_name}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {renderSaLogActions('inward', log)}
                        </td>
                      </tr>
                       )
                    })}
                    {historyTab === 'outward' && getFilteredHistoryLogs().map((log) => {
                       if (!log) return null;
                       return (
                      <tr key={log.outward_id}>
                        <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                          {log.outward_entry_date ? log.outward_entry_date.split('T')[0] : ''}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (log.reference_no) {
                                navigator.clipboard.writeText(log.reference_no);
                                setCopiedRef(log.reference_no);
                                setTimeout(() => setCopiedRef(null), 1500);
                              }
                            }}
                            title="Click to copy Reference Number"
                            style={{ 
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: copiedRef === log.reference_no ? '#10b981' : 'var(--primary)',
                              fontWeight: '700',
                              transition: 'color 0.2s ease'
                            }}
                          >
                            {log.reference_no || '-'}
                            {log.reference_no && (
                              copiedRef === log.reference_no ? (
                                <Check size={12} color="#10b981" />
                              ) : (
                                <Copy size={10} style={{ opacity: 0.5 }} />
                              )
                            )}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="status-badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 800 }}>
                            {log.warehouse_name || 'Generic'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{renderOperatorEmail(log.operator_email)}</td>
                        <td style={{ padding: '12px 16px', fontWeight: '700' }}>{log.outward_vehicle_no}</td>
                        <td style={{ padding: '12px 16px' }}>{log.outward_client_name}</td>
                        <td style={{ padding: '12px 16px' }}>{log.outward_dock_no || '-'}</td>
                        <td style={{ padding: '12px 16px' }}>{log.outward_vehicle_temp}°C</td>
                        <td style={{ padding: '12px 16px' }}>{log.outward_material_temp}°C</td>
                        <td style={{ padding: '12px 16px' }}>{log.outward_pallets_in_qty || '-'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700 }}>
                            {formatDuration(log.outward_loading_duration_hours, log.outward_loading_duration_mins)}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap' }}>
                            <div>S: {log.outward_loading_start_time || '-'}</div>
                            <div>E: {log.outward_loading_end_time || '-'}</div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>{log.outward_loading_supervisor_name}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {renderSaLogActions('outward', log)}
                        </td>
                      </tr>
                       )
                    })}
                  </tbody>
                </table>
              </div>
              <PaginationBar
                page={historyPage}
                totalItems={historyTotal}
                pageSize={historyPerPage}
                onPageChange={setHistoryPage}
                itemLabel="entries"
              />
              </>
            )}
          </div>
        )}

        {activeMenu === 'profile_lookup' && (
          <div className="diagnostics-card" style={{ padding: '24px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'slideUp 0.25s ease' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
                  Log Profile Lookup Portal
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Locate and view full database profiles and uploaded images for Daily Chamber Logs, Inwards, and Outwards.
                </p>
              </div>
            </div>

            {searchedRecord ? (
              // FULL SCREEN PROFILE VIEW
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => {
                      setSearchedRecord(null);
                      setRecordAllowHistory([]);
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: '700',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--text-dark)'
                    }}
                  >
                    ← Back to Search Results
                  </button>
                  <button
                    type="button"
                    onClick={() => startSaEditLog(searchedRecordType || 'daily', searchedRecord)}
                    style={{ padding: '8px 12px', backgroundColor: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0369a1' }}
                  >
                    <Edit size={14} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await handleSaDeleteLog(searchedRecordType || 'daily', searchedRecord);
                      setSearchedRecord(null);
                    }}
                    style={{ padding: '8px 12px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#b91c1c' }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>

                <div className="profile-modal-body" style={{ padding: '0', animation: 'fadeIn 0.2s' }}>
                  {/* Left Column: Data Fields */}
                  <div className="profile-details-section">
                    {searchedRecordType !== 'daily' && (
                      <div className="profile-group-card">
                        <div className="profile-group-title">Metadata & Warehouse</div>
                        <div className="profile-grid-list">
                          <div className="profile-item">
                            <span className="profile-label">Warehouse Facility</span>
                            <span className="profile-value">{searchedRecord.warehouse_name || '-'}</span>
                          </div>
                          <div className="profile-item">
                            <span className="profile-label">Recorded By Operator</span>
                            <span className="profile-value">{renderOperatorEmail(searchedRecord.operator_email)}</span>
                          </div>
                          <div className="profile-item">
                            <span className="profile-label">Created Time</span>
                            <span className="profile-value">{formatDateTimeStr(searchedRecord.created_at || searchedRecord.inward_created_at || searchedRecord.outward_created_at)}</span>
                          </div>
                          {getUpdateDiff(
                            searchedRecord.created_at || searchedRecord.inward_created_at || searchedRecord.outward_created_at,
                            searchedRecord.updated_at || searchedRecord.inward_updated_at || searchedRecord.outward_updated_at
                          ) && (
                            <div className="profile-item">
                              <span className="profile-label">Last Updated Time</span>
                              <span className="profile-value" style={{ color: '#0284c7', fontWeight: '800' }}>
                                {formatDateTimeStr(searchedRecord.updated_at || searchedRecord.inward_updated_at || searchedRecord.outward_updated_at)}
                              </span>
                            </div>
                          )}
                          {(Number(searchedRecord.update_count) > 0 || searchedRecord.update_details) && (
                            <div className="profile-item" style={{ gridColumn: 'span 2' }}>
                              <span className="profile-label" style={{ color: 'var(--primary)', fontWeight: '800' }}>Last Updated Details</span>
                              <span className="profile-value" style={{ fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px', display: 'block' }}>
                                Changed {Number(searchedRecord.update_count) > 0 ? searchedRecord.update_count : 1} {Number(searchedRecord.update_count) === 1 ? 'time' : 'times'}
                              </span>
                              {searchedRecord.update_details
                                ? renderUpdateDetailsReadable(searchedRecord.update_details)
                                : null}
                            </div>
                          )}
                          {searchedRecord.remarks || searchedRecord.inward_remarks || searchedRecord.outward_remarks ? (
                            <div className="profile-item" style={{ gridColumn: 'span 2' }}>
                              <span className="profile-label">Remarks</span>
                              <span className="profile-value profile-value-remarks">
                                {searchedRecord.remarks || searchedRecord.inward_remarks || searchedRecord.outward_remarks}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}

                    {searchedRecordType === 'daily' && renderChamberLogFormView(searchedRecord, { enableCopyRef: true })}

                    {renderSuperAllowSection(searchedRecord)}

                    {searchedRecordType === 'inward' && (
                      <>
                        <div className="profile-group-card">
                          <div className="profile-group-title">Vehicle & General Information</div>
                          <div className="profile-grid-list">
                            <div className="profile-item">
                              <span className="profile-label">Date</span>
                              <span className="profile-value">{formatDateStr(searchedRecord.inward_entry_date)}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Reference No</span>
                              <span 
                                className="profile-value"
                                onClick={() => {
                                  if (searchedRecord.reference_no) {
                                    navigator.clipboard.writeText(searchedRecord.reference_no);
                                    setCopiedRef(searchedRecord.reference_no);
                                    setTimeout(() => setCopiedRef(null), 1500);
                                  }
                                }}
                                title="Click to copy Reference Number"
                                style={{ 
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  color: copiedRef === searchedRecord.reference_no ? '#10b981' : 'var(--text-dark)',
                                  transition: 'color 0.2s ease'
                                }}
                              >
                                {searchedRecord.reference_no || '-'}
                                {searchedRecord.reference_no && (
                                  copiedRef === searchedRecord.reference_no ? (
                                    <Check size={12} color="#10b981" />
                                  ) : (
                                    <Copy size={10} style={{ opacity: 0.5 }} />
                                  )
                                )}
                              </span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Vehicle Number</span>
                              <span className="profile-value">{searchedRecord.inward_vehicle_no}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Client Name</span>
                              <span className="profile-value">{searchedRecord.inward_client_name}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Dock Number</span>
                              <span className="profile-value">{searchedRecord.inward_dock_no || '-'}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Seal Number</span>
                              <span className="profile-value">{searchedRecord.inward_seal_no || '-'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="profile-group-card">
                          <div className="profile-group-title">Temperature & Logistics Details</div>
                          <div className="profile-grid-list">
                            <div className="profile-item">
                              <span className="profile-label">Vehicle Temp</span>
                              <span className="profile-value">{searchedRecord.inward_vehicle_temp !== null ? `${searchedRecord.inward_vehicle_temp}°C` : '-'}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Material Temp</span>
                              <span className="profile-value">{searchedRecord.inward_material_temp !== null ? `${searchedRecord.inward_material_temp}°C` : '-'}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Pallets In Quantity</span>
                              <span className="profile-value">{searchedRecord.inward_pallets_in_qty || '0'}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Material Type</span>
                              <span className="profile-value">{searchedRecord.inward_material_type || '-'}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Unloading Supervisor</span>
                              <span className="profile-value">{searchedRecord.inward_unloading_supervisor_name || '-'}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Unloading Duration</span>
                            <span className="profile-value">
                              <strong>{formatDuration(searchedRecord.inward_unloading_duration_hours, searchedRecord.inward_unloading_duration_mins)}</strong>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                <div>S: {searchedRecord.inward_unloading_start_time || '-'}</div>
                                <div>E: {searchedRecord.inward_unloading_end_time || '-'}</div>
                              </div>
                            </span>
                            </div>
                          </div>
                        </div>

                        <div className="profile-group-card">
                          <div className="profile-group-title">Transporter & Quantities</div>
                          <div className="profile-grid-list">
                            <div className="profile-item">
                              <span className="profile-label">Transporter</span>
                              <span className="profile-value">{searchedRecord.inward_transporter_name || '-'}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Driver Name</span>
                              <span className="profile-value">{searchedRecord.inward_driver_name || '-'}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Driver Phone</span>
                              <span className="profile-value">{searchedRecord.inward_driver_no || '-'}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Invoice / Received Qty</span>
                              <span className="profile-value">{searchedRecord.inward_invoice_qty || '0'} / {searchedRecord.inward_received_qty || '0'}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {searchedRecordType === 'outward' && (
                      <>
                        <div className="profile-group-card">
                          <div className="profile-group-title">Vehicle & General Information</div>
                          <div className="profile-grid-list">
                            <div className="profile-item">
                              <span className="profile-label">Date</span>
                              <span className="profile-value">{formatDateStr(searchedRecord.outward_entry_date)}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Reference No</span>
                              <span 
                                className="profile-value"
                                onClick={() => {
                                  if (searchedRecord.reference_no) {
                                    navigator.clipboard.writeText(searchedRecord.reference_no);
                                    setCopiedRef(searchedRecord.reference_no);
                                    setTimeout(() => setCopiedRef(null), 1500);
                                  }
                                }}
                                title="Click to copy Reference Number"
                                style={{ 
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  color: copiedRef === searchedRecord.reference_no ? '#10b981' : 'var(--text-dark)',
                                  transition: 'color 0.2s ease'
                                }}
                              >
                                {searchedRecord.reference_no || '-'}
                                {searchedRecord.reference_no && (
                                  copiedRef === searchedRecord.reference_no ? (
                                    <Check size={12} color="#10b981" />
                                  ) : (
                                    <Copy size={10} style={{ opacity: 0.5 }} />
                                  )
                                )}
                              </span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Vehicle Number</span>
                              <span className="profile-value">{searchedRecord.outward_vehicle_no}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Client Name</span>
                              <span className="profile-value">{searchedRecord.outward_client_name}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Dock Number</span>
                              <span className="profile-value">{searchedRecord.outward_dock_no || '-'}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Seal Number</span>
                              <span className="profile-value">{searchedRecord.outward_seal_no || '-'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="profile-group-card">
                          <div className="profile-group-title">Temperature & Logistics Details</div>
                          <div className="profile-grid-list">
                            <div className="profile-item">
                              <span className="profile-label">Pre-Cooling Temp</span>
                              <span className="profile-value">{searchedRecord.outward_pre_vehicle_temp !== null ? `${searchedRecord.outward_pre_vehicle_temp}°C` : '-'}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Loading Temp</span>
                              <span className="profile-value">{searchedRecord.outward_vehicle_temp !== null ? `${searchedRecord.outward_vehicle_temp}°C` : '-'}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Material Temp</span>
                              <span className="profile-value">{searchedRecord.outward_material_temp !== null ? `${searchedRecord.outward_material_temp}°C` : '-'}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Pallets Out Quantity</span>
                              <span className="profile-value">{searchedRecord.outward_pallets_in_qty || '-'}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Material Type</span>
                              <span className="profile-value">{searchedRecord.outward_material_type || '-'}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Loading Supervisor</span>
                              <span className="profile-value">{searchedRecord.outward_loading_supervisor_name || '-'}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Loading Duration</span>
                            <span className="profile-value">
                              <strong>{formatDuration(searchedRecord.outward_loading_duration_hours, searchedRecord.outward_loading_duration_mins)}</strong>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                <div>S: {searchedRecord.outward_loading_start_time || '-'}</div>
                                <div>E: {searchedRecord.outward_loading_end_time || '-'}</div>
                              </div>
                            </span>
                            </div>
                          </div>
                        </div>

                        <div className="profile-group-card">
                          <div className="profile-group-title">Transporter & Quantities</div>
                          <div className="profile-grid-list">
                            <div className="profile-item">
                              <span className="profile-label">Transporter</span>
                              <span className="profile-value">{searchedRecord.outward_transporter_name || '-'}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Driver Name</span>
                              <span className="profile-value">{searchedRecord.outward_driver_name || '-'}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Driver Phone</span>
                              <span className="profile-value">{searchedRecord.outward_driver_no || '-'}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Invoice / Loaded Qty</span>
                              <span className="profile-value">{searchedRecord.outward_invoice_qty || '0'} / {searchedRecord.outward_received_qty || '0'}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right Column: Photos Gallery */}
                  <div className="profile-photos-section">
                    <h4>Uploaded Audit Attachment Photos</h4>

                    {((searchedRecordType === 'daily' && searchedRecord.temp_sensor_image) ||
                      (searchedRecordType === 'inward' && (
                        searchedRecord.inward_invoice_photos ||
                        searchedRecord.inward_pod_photo ||
                        searchedRecord.inward_vehicle_seal_photo ||
                        searchedRecord.inward_vehicle_temp_photo ||
                        searchedRecord.inward_material_temp_photo ||
                        searchedRecord.inward_vehicle_back_side_photo ||
                        searchedRecord.inward_vehicle_back_side_photo_with_material ||
                        searchedRecord.inward_count_sheet_photo ||
                        searchedRecord.inward_damage_boxes_photo
                      )) ||
                      (searchedRecordType === 'outward' && (
                        searchedRecord.outward_invoice_photos ||
                        searchedRecord.outward_pod_photo ||
                        searchedRecord.outward_vehicle_seal_photo ||
                        searchedRecord.outward_vehicle_temp_photo ||
                        searchedRecord.outward_pre_vehicle_temp_photo ||
                        searchedRecord.outward_material_temp_photo ||
                        searchedRecord.outward_vehicle_back_side_photo ||
                        searchedRecord.outward_vehicle_back_side_photo_with_material ||
                        searchedRecord.outward_count_sheet_photo ||
                        searchedRecord.outward_damage_boxes_photo
                      ))) ? (
                      <div className="profile-photo-grid">
                        {searchedRecordType === 'daily' && searchedRecord.temp_sensor_image && (
                          <div className="profile-photo-card" onClick={() => setLightboxImg(searchedRecord.temp_sensor_image.startsWith('data:') || /^https?:\/\//i.test(searchedRecord.temp_sensor_image) ? searchedRecord.temp_sensor_image : `/${searchedRecord.temp_sensor_image}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={searchedRecord.temp_sensor_image.startsWith('data:') || /^https?:\/\//i.test(searchedRecord.temp_sensor_image) ? searchedRecord.temp_sensor_image : `/${searchedRecord.temp_sensor_image}`} alt="Temp Sensor" />
                            </div>
                            <div className="profile-photo-label">Temp Sensor</div>
                          </div>
                        )}

                        {searchedRecordType === 'inward' && (
                          <>
                            {searchedRecord.inward_invoice_photos && searchedRecord.inward_invoice_photos.split(',').map((p) => p.trim()).filter(Boolean).map((img, idx, arr) => (
                              <div key={`siinv-${idx}`} className="profile-photo-card" onClick={() => setLightboxImg(img.startsWith('data:') ? img : `/${img}`)}>
                                <div className="profile-photo-wrapper">
                                  <img src={img.startsWith('data:') ? img : `/${img}`} alt={`Invoice ${idx + 1}`} />
                                </div>
                                <div className="profile-photo-label">{arr.length === 1 ? 'Invoice Photo' : `Invoice #${idx + 1}`}</div>
                              </div>
                            ))}
                            {searchedRecord.inward_pod_photo && (
                              <div className="profile-photo-card" onClick={() => setLightboxImg(searchedRecord.inward_pod_photo.startsWith('data:') ? searchedRecord.inward_pod_photo : `/${searchedRecord.inward_pod_photo}`)}>
                                <div className="profile-photo-wrapper">
                                  <img src={searchedRecord.inward_pod_photo.startsWith('data:') ? searchedRecord.inward_pod_photo : `/${searchedRecord.inward_pod_photo}`} alt="POD" />
                                </div>
                                <div className="profile-photo-label">POD Photo</div>
                              </div>
                            )}
                            {searchedRecord.inward_vehicle_seal_photo && (
                              <div className="profile-photo-card" onClick={() => setLightboxImg(searchedRecord.inward_vehicle_seal_photo.startsWith('data:') ? searchedRecord.inward_vehicle_seal_photo : `/${searchedRecord.inward_vehicle_seal_photo}`)}>
                                <div className="profile-photo-wrapper">
                                  <img src={searchedRecord.inward_vehicle_seal_photo.startsWith('data:') ? searchedRecord.inward_vehicle_seal_photo : `/${searchedRecord.inward_vehicle_seal_photo}`} alt="Seal" />
                                </div>
                                <div className="profile-photo-label">Vehicle Seal</div>
                              </div>
                            )}
                            {searchedRecord.inward_vehicle_temp_photo && (
                              <div className="profile-photo-card" onClick={() => setLightboxImg(searchedRecord.inward_vehicle_temp_photo.startsWith('data:') ? searchedRecord.inward_vehicle_temp_photo : `/${searchedRecord.inward_vehicle_temp_photo}`)}>
                                <div className="profile-photo-wrapper">
                                  <img src={searchedRecord.inward_vehicle_temp_photo.startsWith('data:') ? searchedRecord.inward_vehicle_temp_photo : `/${searchedRecord.inward_vehicle_temp_photo}`} alt="Temp" />
                                </div>
                                <div className="profile-photo-label">Vehicle Temp</div>
                              </div>
                            )}
                            {searchedRecord.inward_material_temp_photo && (
                              <div className="profile-photo-card" onClick={() => setLightboxImg(searchedRecord.inward_material_temp_photo.startsWith('data:') ? searchedRecord.inward_material_temp_photo : `/${searchedRecord.inward_material_temp_photo}`)}>
                                <div className="profile-photo-wrapper">
                                  <img src={searchedRecord.inward_material_temp_photo.startsWith('data:') ? searchedRecord.inward_material_temp_photo : `/${searchedRecord.inward_material_temp_photo}`} alt="Material Temp" />
                                </div>
                                <div className="profile-photo-label">Material Temp</div>
                              </div>
                            )}
                            {searchedRecord.inward_vehicle_back_side_photo && (
                              <div className="profile-photo-card" onClick={() => setLightboxImg(searchedRecord.inward_vehicle_back_side_photo.startsWith('data:') ? searchedRecord.inward_vehicle_back_side_photo : `/${searchedRecord.inward_vehicle_back_side_photo}`)}>
                                <div className="profile-photo-wrapper">
                                  <img src={searchedRecord.inward_vehicle_back_side_photo.startsWith('data:') ? searchedRecord.inward_vehicle_back_side_photo : `/${searchedRecord.inward_vehicle_back_side_photo}`} alt="Back" />
                                </div>
                                <div className="profile-photo-label">Vehicle Back</div>
                              </div>
                            )}
                            {searchedRecord.inward_vehicle_back_side_photo_with_material && (
                              <div className="profile-photo-card" onClick={() => setLightboxImg(searchedRecord.inward_vehicle_back_side_photo_with_material.startsWith('data:') ? searchedRecord.inward_vehicle_back_side_photo_with_material : `/${searchedRecord.inward_vehicle_back_side_photo_with_material}`)}>
                                <div className="profile-photo-wrapper">
                                  <img src={searchedRecord.inward_vehicle_back_side_photo_with_material.startsWith('data:') ? searchedRecord.inward_vehicle_back_side_photo_with_material : `/${searchedRecord.inward_vehicle_back_side_photo_with_material}`} alt="Back Loaded" />
                                </div>
                                <div className="profile-photo-label">Vehicle Loaded</div>
                              </div>
                            )}
                            {searchedRecord.inward_count_sheet_photo && searchedRecord.inward_count_sheet_photo.split(',').map((p) => p.trim()).filter(Boolean).map((img, idx, arr) => (
                              <div key={`sics-${idx}`} className="profile-photo-card" onClick={() => setLightboxImg(img.startsWith('data:') ? img : `/${img}`)}>
                                <div className="profile-photo-wrapper">
                                  <img src={img.startsWith('data:') ? img : `/${img}`} alt={`Count Sheet ${idx + 1}`} />
                                </div>
                                <div className="profile-photo-label">{arr.length === 1 ? 'Count Sheet' : `Count Sheet #${idx + 1}`}</div>
                              </div>
                            ))}
                            {searchedRecord.inward_damage_boxes_photo && searchedRecord.inward_damage_boxes_photo.split(',').map((dmgImg, idx) => (
                              <div key={idx} className="profile-photo-card" onClick={() => setLightboxImg(dmgImg.startsWith('data:') ? dmgImg : `/${dmgImg}`)}>
                                <div className="profile-photo-wrapper">
                                  <img src={dmgImg.startsWith('data:') ? dmgImg : `/${dmgImg}`} alt="Damage" />
                                </div>
                                <div className="profile-photo-label">Damage #{idx + 1}</div>
                              </div>
                            ))}
                          </>
                        )}

                        {searchedRecordType === 'outward' && (
                          <>
                            {searchedRecord.outward_invoice_photos && searchedRecord.outward_invoice_photos.split(',').map((p) => p.trim()).filter(Boolean).map((img, idx, arr) => (
                              <div key={`soinv-${idx}`} className="profile-photo-card" onClick={() => setLightboxImg(img.startsWith('data:') ? img : `/${img}`)}>
                                <div className="profile-photo-wrapper">
                                  <img src={img.startsWith('data:') ? img : `/${img}`} alt={`Invoice ${idx + 1}`} />
                                </div>
                                <div className="profile-photo-label">{arr.length === 1 ? 'Invoice Photo' : `Invoice #${idx + 1}`}</div>
                              </div>
                            ))}
                            {searchedRecord.outward_pod_photo && (
                              <div className="profile-photo-card" onClick={() => setLightboxImg(searchedRecord.outward_pod_photo.startsWith('data:') ? searchedRecord.outward_pod_photo : `/${searchedRecord.outward_pod_photo}`)}>
                                <div className="profile-photo-wrapper">
                                  <img src={searchedRecord.outward_pod_photo.startsWith('data:') ? searchedRecord.outward_pod_photo : `/${searchedRecord.outward_pod_photo}`} alt="POD" />
                                </div>
                                <div className="profile-photo-label">POD Photo</div>
                              </div>
                            )}
                            {searchedRecord.outward_vehicle_seal_photo && (
                              <div className="profile-photo-card" onClick={() => setLightboxImg(searchedRecord.outward_vehicle_seal_photo.startsWith('data:') ? searchedRecord.outward_vehicle_seal_photo : `/${searchedRecord.outward_vehicle_seal_photo}`)}>
                                <div className="profile-photo-wrapper">
                                  <img src={searchedRecord.outward_vehicle_seal_photo.startsWith('data:') ? searchedRecord.outward_vehicle_seal_photo : `/${searchedRecord.outward_vehicle_seal_photo}`} alt="Seal" />
                                </div>
                                <div className="profile-photo-label">Vehicle Seal</div>
                              </div>
                            )}
                            {searchedRecord.outward_pre_vehicle_temp_photo && (
                              <div className="profile-photo-card" onClick={() => setLightboxImg(searchedRecord.outward_pre_vehicle_temp_photo.startsWith('data:') ? searchedRecord.outward_pre_vehicle_temp_photo : `/${searchedRecord.outward_pre_vehicle_temp_photo}`)}>
                                <div className="profile-photo-wrapper">
                                  <img src={searchedRecord.outward_pre_vehicle_temp_photo.startsWith('data:') ? searchedRecord.outward_pre_vehicle_temp_photo : `/${searchedRecord.outward_pre_vehicle_temp_photo}`} alt="Pre Temp" />
                                </div>
                                <div className="profile-photo-label">Pre-Cooling Temp</div>
                              </div>
                            )}
                            {searchedRecord.outward_vehicle_temp_photo && (
                              <div className="profile-photo-card" onClick={() => setLightboxImg(searchedRecord.outward_vehicle_temp_photo.startsWith('data:') ? searchedRecord.outward_vehicle_temp_photo : `/${searchedRecord.outward_vehicle_temp_photo}`)}>
                                <div className="profile-photo-wrapper">
                                  <img src={searchedRecord.outward_vehicle_temp_photo.startsWith('data:') ? searchedRecord.outward_vehicle_temp_photo : `/${searchedRecord.outward_vehicle_temp_photo}`} alt="Temp" />
                                </div>
                                <div className="profile-photo-label">Vehicle Temp</div>
                              </div>
                            )}
                            {searchedRecord.outward_material_temp_photo && (
                              <div className="profile-photo-card" onClick={() => setLightboxImg(searchedRecord.outward_material_temp_photo.startsWith('data:') ? searchedRecord.outward_material_temp_photo : `/${searchedRecord.outward_material_temp_photo}`)}>
                                <div className="profile-photo-wrapper">
                                  <img src={searchedRecord.outward_material_temp_photo.startsWith('data:') ? searchedRecord.outward_material_temp_photo : `/${searchedRecord.outward_material_temp_photo}`} alt="Material Temp" />
                                </div>
                                <div className="profile-photo-label">Material Temp</div>
                              </div>
                            )}
                            {searchedRecord.outward_vehicle_back_side_photo && (
                              <div className="profile-photo-card" onClick={() => setLightboxImg(searchedRecord.outward_vehicle_back_side_photo.startsWith('data:') ? searchedRecord.outward_vehicle_back_side_photo : `/${searchedRecord.outward_vehicle_back_side_photo}`)}>
                                <div className="profile-photo-wrapper">
                                  <img src={searchedRecord.outward_vehicle_back_side_photo.startsWith('data:') ? searchedRecord.outward_vehicle_back_side_photo : `/${searchedRecord.outward_vehicle_back_side_photo}`} alt="Back" />
                                </div>
                                <div className="profile-photo-label">Vehicle Back</div>
                              </div>
                            )}
                            {searchedRecord.outward_vehicle_back_side_photo_with_material && (
                              <div className="profile-photo-card" onClick={() => setLightboxImg(searchedRecord.outward_vehicle_back_side_photo_with_material.startsWith('data:') ? searchedRecord.outward_vehicle_back_side_photo_with_material : `/${searchedRecord.outward_vehicle_back_side_photo_with_material}`)}>
                                <div className="profile-photo-wrapper">
                                  <img src={searchedRecord.outward_vehicle_back_side_photo_with_material.startsWith('data:') ? searchedRecord.outward_vehicle_back_side_photo_with_material : `/${searchedRecord.outward_vehicle_back_side_photo_with_material}`} alt="Back Loaded" />
                                </div>
                                <div className="profile-photo-label">Vehicle Loaded</div>
                              </div>
                            )}
                            {searchedRecord.outward_count_sheet_photo && searchedRecord.outward_count_sheet_photo.split(',').map((p) => p.trim()).filter(Boolean).map((img, idx, arr) => (
                              <div key={`socs-${idx}`} className="profile-photo-card" onClick={() => setLightboxImg(img.startsWith('data:') ? img : `/${img}`)}>
                                <div className="profile-photo-wrapper">
                                  <img src={img.startsWith('data:') ? img : `/${img}`} alt={`Count Sheet ${idx + 1}`} />
                                </div>
                                <div className="profile-photo-label">{arr.length === 1 ? 'Count Sheet' : `Count Sheet #${idx + 1}`}</div>
                              </div>
                            ))}
                            {searchedRecord.outward_damage_boxes_photo && searchedRecord.outward_damage_boxes_photo.split(',').map((dmgImg, idx) => (
                              <div key={idx} className="profile-photo-card" onClick={() => setLightboxImg(dmgImg.startsWith('data:') ? dmgImg : `/${dmgImg}`)}>
                                <div className="profile-photo-wrapper">
                                  <img src={dmgImg.startsWith('data:') ? dmgImg : `/${dmgImg}`} alt="Damage" />
                                </div>
                                <div className="profile-photo-label">Damage #{idx + 1}</div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    ) : (
                      <div style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: 'var(--bg-main)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                        No audit attachment photos uploaded for this record.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // SEARCH DIRECT INPUT AND RESULTS LIST VIEW
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '600px' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      placeholder="Enter Ref No, vehicle, client name, supervisor..."
                      value={lookupQuery}
                      onChange={(e) => setLookupQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleLookupSearch();
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '0.86rem',
                        outline: 'none',
                        color: 'var(--text-dark)'
                      }}
                    />
                  </div>
                  <button 
                    onClick={handleLookupSearch}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: 'var(--primary)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0, 162, 232, 0.2)'
                    }}
                  >
                    Search Profile
                  </button>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                  {searchResults.length === 0 ? (
                    <div style={{ padding: '80px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', color: 'var(--text-muted)' }}>
                      <Search size={36} color="var(--border)" />
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-dark)', fontWeight: 800 }}>Search Database Profiles</h4>
                        <p style={{ margin: 0, fontSize: '0.78rem' }}>Enter reference numbers, vehicle license plates, or client names above to view full profiles.</p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase' }}>
                        Search Results ({searchResults.length} Match{searchResults.length > 1 ? 'es' : ''})
                      </h4>
                      {searchResults.map((res, index) => (
                        <div 
                          key={index}
                          onClick={() => {
                            setSearchedRecord(res.original);
                            setSearchedRecordType(res.type);
                            loadRecordAllowHistory(res.type, res.original);
                          }}
                          style={{
                            padding: '16px 20px',
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                          className="lookup-result-card"
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '100px',
                                backgroundColor: res.type === 'daily' ? '#eff6ff' : (res.type === 'inward' ? '#ecfdf5' : '#fff7ed'),
                                color: res.type === 'daily' ? '#2563eb' : (res.type === 'inward' ? '#059669' : '#d97706'),
                                textTransform: 'uppercase'
                              }}>
                                {res.label}
                              </span>
                              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                                {res.reference_no || `No Ref No (Date: ${res.date})`}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              <strong>Client:</strong> {res.client || '-'} | <strong>Warehouse:</strong> {res.facility}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#475569', fontStyle: 'italic' }}>
                              {res.details}
                            </div>
                          </div>
                          <ChevronRight size={18} color="var(--text-muted)" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeMenu === 'activity_logs' && (
          <div className="diagnostics-card" style={{ padding: '24px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Tab Header & Control Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
                  {auditSubTab === 'activity_log' ? 'Operator Activity Audit Logs' : 
                   auditSubTab === 'security_log' ? 'System Security & Access Logs' :
                   auditSubTab === 'system_errors' ? 'System Process & Error Logs' :
                   auditSubTab === 'do_changes' ? 'DO Client & Chamber Actions Log' :
                   'Role & Permission Requests'}
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  {auditSubTab === 'activity_log' ? 'Real-time database operations audit trail' : 
                   auditSubTab === 'security_log' ? 'Authentication events & security access logs' :
                   auditSubTab === 'system_errors' ? 'All application system processes and runtime exception logs' :
                   auditSubTab === 'do_changes' ? 'DO operator custom client additions, soft-deletions and updates' :
                   'Role authorizations, edit/delete permission settings & approvals'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
            </div>

            {/* Error Banner */}
            {logsError && (
              <LoadErrorBanner
                message={logsError}
                onRetry={() => {
                  if (auditSubTab === 'permission_log') loadPermissionRequests();
                  else if (auditSubTab === 'system_errors') loadSystemConfig();
                  else loadActivities();
                }}
                onDismiss={() => setLogsError('')}
              />
            )}

            {/* Sub-tab Selection & Warehouse Filter Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingBottom: '4px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setAuditSubTab('activity_log')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid ' + (auditSubTab === 'activity_log' ? 'var(--primary)' : 'var(--border)'),
                    backgroundColor: auditSubTab === 'activity_log' ? 'var(--primary-light)' : '#ffffff',
                    color: auditSubTab === 'activity_log' ? 'var(--primary)' : 'var(--text-dark)',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Activity Audit Trail
                </button>
                <button 
                  onClick={() => setAuditSubTab('do_changes')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid ' + (auditSubTab === 'do_changes' ? 'var(--primary)' : (hasNewDOChanges ? '#ef4444' : 'var(--border)')),
                    backgroundColor: auditSubTab === 'do_changes' ? 'var(--primary-light)' : (hasNewDOChanges ? '#fef2f2' : '#ffffff'),
                    color: auditSubTab === 'do_changes' ? 'var(--primary)' : (hasNewDOChanges ? '#ef4444' : 'var(--text-dark)'),
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <span>DO Operations Log</span>
                  {hasNewDOChanges && <span className="pulsing-dot" style={{ display: 'inline-block', position: 'relative', top: 'auto', right: 'auto', marginLeft: '2px' }} />}
                </button>
                <button 
                  onClick={() => setAuditSubTab('security_log')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid ' + (auditSubTab === 'security_log' ? 'var(--primary)' : 'var(--border)'),
                    backgroundColor: auditSubTab === 'security_log' ? 'var(--primary-light)' : '#ffffff',
                    color: auditSubTab === 'security_log' ? 'var(--primary)' : 'var(--text-dark)',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Security & Access Logs
                </button>
                <button 
                  onClick={() => setAuditSubTab('system_errors')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid ' + (auditSubTab === 'system_errors' ? 'var(--primary)' : 'var(--border)'),
                    backgroundColor: auditSubTab === 'system_errors' ? 'var(--primary-light)' : '#ffffff',
                    color: auditSubTab === 'system_errors' ? 'var(--primary)' : 'var(--text-dark)',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  System & Error Logs
                </button>
                <button 
                  onClick={() => setAuditSubTab('permission_log')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid ' + (auditSubTab === 'permission_log' ? 'var(--primary)' : 'var(--border)'),
                    backgroundColor: auditSubTab === 'permission_log' ? 'var(--primary-light)' : '#ffffff',
                    color: auditSubTab === 'permission_log' ? 'var(--primary)' : 'var(--text-dark)',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>Role & Permission Requests</span>
                  {hasPendingRequests && <span className="pulsing-dot" />}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dark)' }}>Warehouse:</span>
                <select
                  value={selectedWarehouseFilter}
                  onChange={(e) => {
                    setSelectedWarehouseFilter(e.target.value);
                    setActivitiesCurrentPage(1);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    color: 'var(--text-dark)',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="All">All Warehouses</option>
                  {warehousesList.map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                  <option value="System/Admin">System / Admin Logs</option>
                </select>
              </div>
            </div>

            { (auditSubTab === 'activity_log' || auditSubTab === 'do_changes') ? (
              // Tab 1: Operator Activity History Audit Logs & DO Operations Log
              (() => {
                const paginatedActivities = activities || [];
                const totalItems = activitiesTotal;
                const currentPage = activitiesCurrentPage;

                return (
                  <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--text-dark)' }}>
                      {auditSubTab === 'do_changes' ? 'DO Client & Chamber Actions Log' : 'Operator Activity History Audit Logs'}
                    </h3>
                    
                    {/* Search & Filter Controls */}
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      flexWrap: 'wrap',
                      alignItems: 'flex-end',
                      padding: '16px',
                      backgroundColor: 'var(--bg-main)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      marginBottom: '16px'
                    }}>
                      {/* 1. Search Query */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '2 1 200px', minWidth: '200px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>Search Query</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            placeholder="Search email, action, desc..."
                            value={activitiesSearch}
                            onChange={(e) => {
                              setActivitiesSearch(e.target.value);
                              setActivitiesCurrentPage(1);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px 8px 32px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border)',
                              fontSize: '0.8rem',
                              color: 'var(--text-dark)',
                              backgroundColor: '#ffffff',
                              outline: 'none'
                            }}
                          />
                          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        </div>
                      </div>

                      {/* 2. Action Filter */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 160px', minWidth: '160px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>Action Type</label>
                        <select
                          value={activitiesActionFilter}
                          onChange={(e) => {
                            setActivitiesActionFilter(e.target.value);
                            setActivitiesCurrentPage(1);
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            color: 'var(--text-dark)',
                            backgroundColor: '#ffffff',
                            outline: 'none',
                            cursor: 'pointer',
                            height: '37px'
                          }}
                        >
                          <option value="All">All Actions</option>
                          {auditSubTab === 'do_changes' ? (
                            <>
                              <option value="ADD_CLIENT">ADD_CLIENT</option>
                              <option value="DELETE_CLIENT">DELETE_CLIENT</option>
                              <option value="UPDATE_CLIENT">UPDATE_CLIENT</option>
                              <option value="ADD_CHAMBER">ADD_CHAMBER</option>
                              <option value="DELETE_CHAMBER">DELETE_CHAMBER</option>
                              <option value="REQUEST_EDIT">REQUEST_EDIT</option>
                              <option value="REQUEST_DELETE">REQUEST_DELETE</option>
                              <option value="GRANT_PERMISSION">GRANT (Allow Edit)</option>
                              <option value="GRANT_DELETE">GRANT (Allow Delete)</option>
                              <option value="DENY_PERMISSION">DENY Edit</option>
                              <option value="DENY_DELETE">DENY Delete</option>
                            </>
                          ) : (
                            <>
                              <option value="CREATE">CREATE</option>
                              <option value="UPDATE">UPDATE</option>
                              <option value="DELETE">DELETE</option>
                              <option value="LOGIN">LOGIN</option>
                              <option value="LOGIN_FAILED">LOGIN_FAILED</option>
                              <option value="REQUEST_EDIT">REQUEST_EDIT</option>
                              <option value="REQUEST_DELETE">REQUEST_DELETE</option>
                              <option value="GRANT_PERMISSION">GRANT_PERMISSION</option>
                              <option value="DENY_PERMISSION">DENY_PERMISSION</option>
                            </>
                          )}
                        </select>
                      </div>

                      {/* 3. From Date */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 140px', minWidth: '140px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>From Date</label>
                        <input
                          type="date"
                          value={activitiesFromDate}
                          max={activitiesToDate || undefined}
                          onChange={(e) => {
                            const val = e.target.value;
                            setActivitiesFromDate(val);
                            if (val && activitiesToDate && val > activitiesToDate) {
                              setActivitiesToDate(val);
                            }
                            setActivitiesCurrentPage(1);
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                            fontSize: '0.8rem',
                            color: 'var(--text-dark)',
                            backgroundColor: '#ffffff',
                            outline: 'none',
                            height: '37px'
                          }}
                        />
                      </div>

                      {/* 4. To Date */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 140px', minWidth: '140px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>To Date</label>
                        <input
                          type="date"
                          value={activitiesToDate}
                          min={activitiesFromDate || undefined}
                          onChange={(e) => {
                            const val = e.target.value;
                            setActivitiesToDate(val);
                            if (val && activitiesFromDate && val < activitiesFromDate) {
                              setActivitiesFromDate(val);
                            }
                            setActivitiesCurrentPage(1);
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                            fontSize: '0.8rem',
                            color: 'var(--text-dark)',
                            backgroundColor: '#ffffff',
                            outline: 'none',
                            height: '37px'
                          }}
                        />
                      </div>

                      {/* 5. Actions (Export & Reset) */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', height: '37px' }}>
                        <button
                          onClick={handleExportActivitiesExcel}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            backgroundColor: '#22c55e',
                            color: '#ffffff',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            height: '100%'
                          }}
                        >
                          <Download size={14} />
                          <span>Export</span>
                        </button>

                        {(activitiesSearch || activitiesFromDate || activitiesToDate || activitiesActionFilter !== 'All') && (
                          <button
                            onClick={() => {
                              setActivitiesSearch('');
                              setActivitiesFromDate('');
                              setActivitiesToDate('');
                              setActivitiesActionFilter('All');
                              setActivitiesCurrentPage(1);
                            }}
                            style={{
                              padding: '8px 14px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border)',
                              backgroundColor: '#ffffff',
                              color: 'var(--text-muted)',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              height: '100%'
                            }}
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {exportError?.retryKey === 'activities' && (
                      <ExportErrorBanner
                        message={exportError.message}
                        retryable={exportError.retryable}
                        onRetry={retryFailedExport}
                        onDismiss={() => setExportError(null)}
                      />
                    )}

                    {loadingActivities ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        <span>Loading activity history logs...</span>
                      </div>
                    ) : paginatedActivities.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        <span>No operator activities found matching the filters.</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ maxHeight: '420px', overflowY: 'auto', overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                          <table className="logs-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', backgroundColor: 'var(--bg-main)' }}>
                                <th style={{ padding: '8px 10px', fontWeight: '800', color: 'var(--text-dark)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>DO Name / Email</th>
                                <th style={{ padding: '8px 10px', fontWeight: '800', color: 'var(--text-dark)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Warehouse</th>
                                <th style={{ padding: '8px 10px', fontWeight: '800', color: 'var(--text-dark)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Action</th>
                                <th style={{ padding: '8px 10px', fontWeight: '800', color: 'var(--text-dark)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Module/Log</th>
                                <th style={{ padding: '8px 10px', fontWeight: '800', color: 'var(--text-dark)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Activity Description</th>
                                <th style={{ padding: '8px 10px', fontWeight: '800', color: 'var(--text-dark)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Remark</th>
                                <th style={{ padding: '8px 10px', fontWeight: '800', color: 'var(--text-dark)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Timestamp</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedActivities.map((act) => {
                                if (!act) return null;
                                let actionColor = '#3b82f6';
                                let actionBg = '#dbeafe';
                                if (act.action === 'CREATE' || act.action === 'ADD_CLIENT' || act.action === 'ADD_CHAMBER' || act.action === 'GRANT_PERMISSION' || act.action === 'GRANT_DELETE') {
                                  actionColor = '#10b981';
                                  actionBg = '#d1fae5';
                                } else if (act.action === 'DELETE' || act.action === 'DELETE_CLIENT' || act.action === 'DELETE_CHAMBER' || act.action === 'DENY_PERMISSION' || act.action === 'DENY_DELETE') {
                                  actionColor = '#ef4444';
                                  actionBg = '#fee2e2';
                                } else if (act.action === 'REQUEST_EDIT' || act.action === 'REQUEST_DELETE') {
                                  actionColor = '#a16207';
                                  actionBg = '#fef9c3';
                                }

                                return (
                                  <tr key={act.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '6px 8px', fontWeight: '700', color: '#0f172a' }}>{renderOperatorEmail(act.operator_email)}</td>
                                    <td style={{ padding: '6px 8px', color: '#475569', fontWeight: 600 }}>
                                      {operatorWarehouseMap[act.operator_email ? act.operator_email.toLowerCase() : ''] || 'System / Admin'}
                                    </td>
                                    <td style={{ padding: '6px 8px' }}>
                                      <span style={{
                                        display: 'inline-block',
                                        padding: '1px 6px',
                                        borderRadius: '100px',
                                        fontSize: '0.64rem',
                                        fontWeight: '800',
                                        color: actionColor,
                                        backgroundColor: actionBg,
                                        textTransform: 'uppercase'
                                      }}>
                                        {act.action}
                                      </span>
                                    </td>
                                    <td style={{ padding: '6px 8px', fontWeight: '700', color: '#475569' }}>{act.log_type}</td>
                                    <td style={{ padding: '6px 8px', color: '#334155' }}>
                                      {(() => {
                                        const refRegex = /\(Ref:\s*(RF-[A-Z]+-\d+-\d+)\)/i;
                                        const descStr = String(act.description || '');
                                        const match = descStr.match(refRegex);
                                        if (match) {
                                          const refNo = match[1];
                                          const parts = descStr.split(match[0]);
                                          return (
                                            <span>
                                              {highlightAddedDeletedWords(parts[0])}
                                              <span 
                                                onClick={() => showLogDetailsByRef(refNo, act.permission_req, act.log_type)}
                                                style={{ 
                                                  color: 'var(--primary)', 
                                                  fontWeight: '800', 
                                                  cursor: 'pointer', 
                                                  textDecoration: 'underline'
                                                }}
                                                title="Click to view data profile"
                                              >
                                                {refNo}
                                              </span>
                                              {highlightAddedDeletedWords(parts[1])}
                                            </span>
                                          );
                                        }
                                        return highlightAddedDeletedWords(descStr);
                                      })()}
                                    </td>
                                    <td style={{ padding: '6px 8px', color: '#0f766e', fontWeight: 600, fontSize: '0.72rem', maxWidth: 180 }}>
                                      {act.remark || '—'}
                                    </td>
                                    <td style={{ padding: '6px 8px', color: '#64748b', fontSize: '0.72rem' }}>
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

                        <PaginationBar
                          page={currentPage}
                          totalItems={totalItems}
                          pageSize={activitiesPerPage}
                          onPageChange={setActivitiesCurrentPage}
                          itemLabel="entries"
                        />
                      </>
                    )}
                  </div>
                );
              })()
            ) : auditSubTab === 'security_log' ? (
              // Tab 2: System Security & Permission Logs
              (() => {
                const paginatedSecurityLogs = activities || [];
                const totalItems = activitiesTotal;
                const currentPage = securityCurrentPage;

                return (
                  <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--text-dark)' }}>Recent Permission & Role Access Logs</h3>
                    
                    {/* Search & Filter Controls */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px',
                      alignItems: 'flex-end',
                      padding: '16px',
                      backgroundColor: 'var(--bg-main)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      marginBottom: '16px'
                    }}>
                      {/* 1. Search Query */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '2 1 200px', minWidth: '200px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>Search Query</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            placeholder="Search user, action, desc..."
                            value={securitySearch}
                            onChange={(e) => {
                              setSecuritySearch(e.target.value);
                              setSecurityCurrentPage(1);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px 8px 32px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border)',
                              fontSize: '0.8rem',
                              color: 'var(--text-dark)',
                              backgroundColor: '#ffffff',
                              outline: 'none'
                            }}
                          />
                          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        </div>
                      </div>

                      {/* 2. Action Filter */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 160px', minWidth: '160px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>Action Type</label>
                        <select
                          value={securityActionFilter}
                          onChange={(e) => {
                            setSecurityActionFilter(e.target.value);
                            setSecurityCurrentPage(1);
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            color: 'var(--text-dark)',
                            backgroundColor: '#ffffff',
                            outline: 'none',
                            cursor: 'pointer',
                            height: '37px'
                          }}
                        >
                          <option value="All">All Actions</option>
                          <option value="LOGIN">LOGIN</option>
                          <option value="LOGIN_FAILED">LOGIN_FAILED</option>
                          <option value="GRANT_PERMISSION">GRANT_PERMISSION</option>
                          <option value="DENY_PERMISSION">DENY_PERMISSION</option>
                          <option value="REQUEST_EDIT">REQUEST_EDIT</option>
                          <option value="REQUEST_DELETE">REQUEST_DELETE</option>
                          <option value="DELETE">DELETE</option>
                        </select>
                      </div>

                      {/* 3. From Date */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 140px', minWidth: '140px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>From Date</label>
                        <input
                          type="date"
                          value={securityFromDate}
                          max={securityToDate || undefined}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSecurityFromDate(val);
                            if (val && securityToDate && val > securityToDate) {
                              setSecurityToDate(val);
                            }
                            setSecurityCurrentPage(1);
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                            fontSize: '0.8rem',
                            color: 'var(--text-dark)',
                            backgroundColor: '#ffffff',
                            outline: 'none',
                            height: '37px'
                          }}
                        />
                      </div>

                      {/* 4. To Date */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 140px', minWidth: '140px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>To Date</label>
                        <input
                          type="date"
                          value={securityToDate}
                          min={securityFromDate || undefined}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSecurityToDate(val);
                            if (val && securityFromDate && val < securityFromDate) {
                              setSecurityFromDate(val);
                            }
                            setSecurityCurrentPage(1);
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                            fontSize: '0.8rem',
                            color: 'var(--text-dark)',
                            backgroundColor: '#ffffff',
                            outline: 'none',
                            height: '37px'
                          }}
                        />
                      </div>

                      {/* 5. Actions (Export & Reset) */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', height: '37px' }}>
                        <button
                          onClick={handleExportSecurityExcel}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            backgroundColor: '#22c55e',
                            color: '#ffffff',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            height: '100%'
                          }}
                        >
                          <Download size={14} />
                          <span>Export</span>
                        </button>

                        {(securitySearch || securityFromDate || securityToDate || securityActionFilter !== 'All') && (
                          <button
                            onClick={() => {
                              setSecuritySearch('');
                              setSecurityFromDate('');
                              setSecurityToDate('');
                              setSecurityActionFilter('All');
                              setSecurityCurrentPage(1);
                            }}
                            style={{
                              padding: '8px 14px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border)',
                              backgroundColor: '#ffffff',
                              color: 'var(--text-muted)',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              height: '100%'
                            }}
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {exportError?.retryKey === 'security' && (
                      <ExportErrorBanner
                        message={exportError.message}
                        retryable={exportError.retryable}
                        onRetry={retryFailedExport}
                        onDismiss={() => setExportError(null)}
                      />
                    )}

                    {loadingActivities ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        <span>Loading security logs...</span>
                      </div>
                    ) : paginatedSecurityLogs.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        <span>No permission or security logs found matching the filters.</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ maxHeight: '420px', overflowY: 'auto', overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                          <table className="logs-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', backgroundColor: 'var(--bg-main)' }}>
                                <th style={{ padding: '8px 10px', fontWeight: '800', color: 'var(--text-dark)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>User / Identity</th>
                                <th style={{ padding: '8px 10px', fontWeight: '800', color: 'var(--text-dark)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Warehouse</th>
                                <th style={{ padding: '8px 10px', fontWeight: '800', color: 'var(--text-dark)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Action</th>
                                <th style={{ padding: '8px 10px', fontWeight: '800', color: 'var(--text-dark)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Level</th>
                                <th style={{ padding: '8px 10px', fontWeight: '800', color: 'var(--text-dark)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Security Event Description</th>
                                <th style={{ padding: '8px 10px', fontWeight: '800', color: 'var(--text-dark)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Timestamp</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedSecurityLogs.map((act) => {
                                if (!act) return null;
                                let actionColor = '#ea580c';
                                let actionBg = '#ffedd5';
                                if (act.action === 'LOGIN') {
                                  actionColor = '#16a34a';
                                  actionBg = '#dcfce7';
                                } else if (act.action === 'LOGIN_FAILED') {
                                  actionColor = '#dc2626';
                                  actionBg = '#fee2e2';
                                } else if (act.action === 'DELETE') {
                                  actionColor = '#dc2626';
                                  actionBg = '#fee2e2';
                                }

                                return (
                                  <tr key={act.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '6px 8px', fontWeight: '700', color: '#0f172a' }}>{renderOperatorEmail(act.operator_email)}</td>
                                    <td style={{ padding: '6px 8px', color: '#475569', fontWeight: 600 }}>
                                      {operatorWarehouseMap[act.operator_email ? act.operator_email.toLowerCase() : ''] || 'System / Admin'}
                                    </td>
                                    <td style={{ padding: '6px 8px' }}>
                                      <span style={{
                                        display: 'inline-block',
                                        padding: '1px 6px',
                                        borderRadius: '100px',
                                        fontSize: '0.64rem',
                                        fontWeight: '800',
                                        color: actionColor,
                                        backgroundColor: actionBg,
                                        textTransform: 'uppercase'
                                      }}>
                                        {act.action}
                                      </span>
                                    </td>
                                    <td style={{ padding: '6px 8px', fontWeight: '700', color: act.log_type === 'SECURITY' ? '#dc2626' : '#ea580c' }}>{act.log_type}</td>
                                    <td style={{ padding: '6px 8px', color: '#334155' }}>{act.description}</td>
                                    <td style={{ padding: '6px 8px', color: '#64748b', fontSize: '0.72rem' }}>
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

                        <PaginationBar
                          page={currentPage}
                          totalItems={totalItems}
                          pageSize={securityPerPage}
                          onPageChange={setSecurityCurrentPage}
                          itemLabel="entries"
                        />
                      </>
                    )}
                  </div>
                );
              })()
            ) : auditSubTab === 'system_errors' ? (
              // Tab 3: System & Error Logs
              (() => {
                const paginatedSystemLogs = activities || [];
                const totalItems = activitiesTotal;
                const currentPage = systemCurrentPage;

                return (
                  <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--text-dark)' }}>System Process & Error Logs</h3>
                    
                    {/* Search & Filter Controls */}
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      flexWrap: 'wrap',
                      alignItems: 'flex-end',
                      padding: '16px',
                      backgroundColor: 'var(--bg-main)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      marginBottom: '16px'
                    }}>
                      {/* 1. Search Query */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '2 1 200px', minWidth: '200px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>Search Logs</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            placeholder="Search event, description..."
                            value={systemSearch}
                            onChange={(e) => {
                              setSystemSearch(e.target.value);
                              setSystemCurrentPage(1);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px 8px 32px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border)',
                              fontSize: '0.8rem',
                              color: 'var(--text-dark)',
                              backgroundColor: '#ffffff',
                              outline: 'none'
                            }}
                          />
                          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        </div>
                      </div>

                      {/* 2. Action Type Filter */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 160px', minWidth: '160px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>Log Level/Event</label>
                        <select
                          value={systemActionFilter}
                          onChange={(e) => {
                            setSystemActionFilter(e.target.value);
                            setSystemCurrentPage(1);
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            color: 'var(--text-dark)',
                            backgroundColor: '#ffffff',
                            outline: 'none',
                            cursor: 'pointer',
                            height: '37px'
                          }}
                        >
                          <option value="All">All Events</option>
                          <option value="SYSTEM_ERROR">SYSTEM_ERROR</option>
                          <option value="SERVER_STARTUP">SERVER_STARTUP</option>
                        </select>
                      </div>

                      {/* 3. From Date */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 140px', minWidth: '140px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>From Date</label>
                        <input
                          type="date"
                          value={systemFromDate}
                          max={systemToDate || undefined}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSystemFromDate(val);
                            if (val && systemToDate && val > systemToDate) {
                              setSystemToDate(val);
                            }
                            setSystemCurrentPage(1);
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                            fontSize: '0.8rem',
                            color: 'var(--text-dark)',
                            backgroundColor: '#ffffff',
                            outline: 'none',
                            height: '37px'
                          }}
                        />
                      </div>

                      {/* 4. To Date */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 140px', minWidth: '140px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>To Date</label>
                        <input
                          type="date"
                          value={systemToDate}
                          min={systemFromDate || undefined}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSystemToDate(val);
                            if (val && systemFromDate && val < systemFromDate) {
                              setSystemFromDate(val);
                            }
                            setSystemCurrentPage(1);
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                            fontSize: '0.8rem',
                            color: 'var(--text-dark)',
                            backgroundColor: '#ffffff',
                            outline: 'none',
                            height: '37px'
                          }}
                        />
                      </div>

                      {/* 5. Actions */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', height: '37px' }}>
                        <button
                          onClick={handleExportSystemExcel}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            backgroundColor: '#22c55e',
                            color: '#ffffff',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            height: '100%'
                          }}
                        >
                          <Download size={14} />
                          <span>Export</span>
                        </button>

                        {(systemSearch || systemFromDate || systemToDate || systemActionFilter !== 'All') && (
                          <button
                            onClick={() => {
                              setSystemSearch('');
                              setSystemFromDate('');
                              setSystemToDate('');
                              setSystemActionFilter('All');
                              setSystemCurrentPage(1);
                            }}
                            style={{
                              padding: '8px 14px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border)',
                              backgroundColor: '#ffffff',
                              color: 'var(--text-muted)',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              height: '100%'
                            }}
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {exportError?.retryKey === 'system' && (
                      <ExportErrorBanner
                        message={exportError.message}
                        retryable={exportError.retryable}
                        onRetry={retryFailedExport}
                        onDismiss={() => setExportError(null)}
                      />
                    )}

                    {loadingActivities ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        <span>Loading system logs...</span>
                      </div>
                    ) : paginatedSystemLogs.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        <span>No system or error logs found matching the filters.</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ maxHeight: '420px', overflowY: 'auto', overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                          <table className="logs-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', backgroundColor: 'var(--bg-main)' }}>
                                <th style={{ padding: '8px 10px', fontWeight: '800', color: 'var(--text-dark)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Identity / Source</th>
                                <th style={{ padding: '8px 10px', fontWeight: '800', color: 'var(--text-dark)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Warehouse</th>
                                <th style={{ padding: '8px 10px', fontWeight: '800', color: 'var(--text-dark)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Log Type</th>
                                <th style={{ padding: '8px 10px', fontWeight: '800', color: 'var(--text-dark)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Action Event</th>
                                <th style={{ padding: '8px 10px', fontWeight: '800', color: 'var(--text-dark)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Process & Error Description</th>
                                <th style={{ padding: '8px 10px', fontWeight: '800', color: 'var(--text-dark)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Timestamp</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedSystemLogs.map((act) => {
                                if (!act) return null;
                                let actionColor = '#3b82f6';
                                let actionBg = '#dbeafe';
                                if (act.log_type === 'ERROR') {
                                  actionColor = '#dc2626';
                                  actionBg = '#fee2e2';
                                } else if (act.action === 'SERVER_STARTUP') {
                                  actionColor = '#16a34a';
                                  actionBg = '#dcfce7';
                                }

                                return (
                                  <tr key={act.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '6px 8px', fontWeight: '700', color: '#0f172a' }}>{renderOperatorEmail(act.operator_email)}</td>
                                    <td style={{ padding: '6px 8px', color: '#475569', fontWeight: 600 }}>
                                      {operatorWarehouseMap[act.operator_email ? act.operator_email.toLowerCase() : ''] || 'System'}
                                    </td>
                                    <td style={{ padding: '6px 8px' }}>
                                      <span style={{
                                        display: 'inline-block',
                                        padding: '1px 6px',
                                        borderRadius: '100px',
                                        fontSize: '0.64rem',
                                        fontWeight: '800',
                                        color: act.log_type === 'ERROR' ? '#ffffff' : actionColor,
                                        backgroundColor: act.log_type === 'ERROR' ? '#dc2626' : actionBg,
                                        textTransform: 'uppercase'
                                      }}>
                                        {act.log_type}
                                      </span>
                                    </td>
                                    <td style={{ padding: '6px 8px', fontWeight: '700', color: '#475569' }}>{act.action}</td>
                                    <td style={{ padding: '6px 8px' }}>{renderSystemErrorDescription(act.description, act.log_type === 'ERROR')}</td>
                                    <td style={{ padding: '6px 8px', color: '#64748b', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
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

                        <PaginationBar
                          page={currentPage}
                          totalItems={totalItems}
                          pageSize={systemPerPage}
                          onPageChange={setSystemCurrentPage}
                          itemLabel="entries"
                        />
                      </>
                    )}
                  </div>
                );
              })()
            ) : (
              // Tab 2: Permission System Matrix & Logs
              (() => {
                const securityLogs = activities.filter(act => 
                  act.log_type === 'PERMISSION' || 
                  act.log_type === 'SECURITY'
                );

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* DO Edit & Delete Permission Requests Section */}
                    {(() => {
                      const pendingRequests = permissionRequests.filter(pr => pr.status === 'Pending');
                      const filteredPendingRequests = pendingRequests.filter(pr => {
                        // Client master = notify only; Master Setup = no allow gate
                        if (pr.record_type === 'ClientMaster' || pr.record_type === 'MasterSetup') {
                          return false;
                        }
                        // Ignore duplicate notify rows (DO_CHANGE) — real requests use Chamber / ChamberMaster / etc.
                        if (pr.record_type === 'DO_CHANGE' || pr.record_type === 'activity') {
                          return false;
                        }
                        if (selectedWarehouseFilter === 'All') return true;
                        const operatorEmail = pr.operator_email ? pr.operator_email.toLowerCase() : '';
                        const wh = operatorWarehouseMap[operatorEmail];
                        if (selectedWarehouseFilter === 'System/Admin') {
                          return !wh || operatorEmail === 'system';
                        }
                        return wh === selectedWarehouseFilter;
                      });

                      return (
                        <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Lock size={18} color="#ea580c" />
                            <span>Data Operator Edit & Delete Permission Requests</span>
                          </h3>
                          {filteredPendingRequests.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                              <span>No pending edit or delete permission requests found for the selected warehouse.</span>
                            </div>
                          ) : (
                            <div style={{ overflowX: 'auto' }}>
                              <table className="logs-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                                <thead>
                                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', backgroundColor: 'var(--bg-main)' }}>
                                    <th style={{ padding: '6px 8px', color: 'var(--text-dark)' }}>Operator Email</th>
                                    <th style={{ padding: '6px 8px', color: 'var(--text-dark)' }}>Warehouse</th>
                                    <th style={{ padding: '6px 8px', color: 'var(--text-dark)' }}>Log Module</th>
                                    <th style={{ padding: '6px 8px', color: 'var(--text-dark)' }}>Record ID</th>
                                    <th style={{ padding: '6px 8px', color: 'var(--text-dark)' }}>Client Name</th>
                                    <th style={{ padding: '6px 8px', color: 'var(--text-dark)' }}>Request Type</th>
                                    <th style={{ padding: '6px 8px', color: 'var(--text-dark)' }}>Request Details</th>
                                    <th style={{ padding: '6px 8px', color: 'var(--text-dark)' }}>Status</th>
                                    <th style={{ padding: '6px 8px', textAlign: 'center', color: 'var(--text-dark)' }}>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredPendingRequests.map((pr) => {
                                    if (!pr) return null;
                                    const parsed = parseRequestDescription(pr.description || pr.request_description, pr.record_type);
                                    const isMasterSetup = pr.record_type === 'MasterSetup';
                                    const isChamberMaster = pr.record_type === 'ChamberMaster';
                                    const isClientMaster = pr.record_type === 'ClientMaster';
                                    const isAllowStyle = isMasterSetup || isChamberMaster || isClientMaster;
                                    const badgeBg = isClientMaster
                                      ? (pr.raw_action === 'REQUEST_DELETE' ? '#fef2f2' : '#eff6ff')
                                      : isChamberMaster
                                        ? (parsed.refNo === 'ADD' ? '#eff6ff' : '#fef2f2')
                                        : (isMasterSetup ? '#f0fdf4' : '#f1f5f9');
                                    const badgeFg = isClientMaster
                                      ? (pr.raw_action === 'REQUEST_DELETE' ? '#b91c1c' : '#1d4ed8')
                                      : isChamberMaster
                                        ? (parsed.refNo === 'ADD' ? '#1d4ed8' : '#b91c1c')
                                        : (isMasterSetup ? '#15803d' : '#475569');
                                    
                                    return (
                                      <tr key={pr.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '6px 8px', fontWeight: '700', color: '#0f172a' }}>{renderOperatorEmail(pr.operator_email)}</td>
                                        <td style={{ padding: '6px 8px', color: '#475569', fontWeight: 600 }}>
                                          {operatorWarehouseMap[pr.operator_email ? pr.operator_email.toLowerCase() : ''] || 'System / Admin'}
                                        </td>
                                        <td style={{ padding: '6px 8px' }}>
                                          <span className="status-badge" style={{ backgroundColor: badgeBg, color: badgeFg, fontWeight: 700 }}>
                                            {parsed.module}
                                          </span>
                                        </td>
                                        <td 
                                          style={{ padding: '6px 8px', color: isAllowStyle ? badgeFg : 'var(--primary)', fontWeight: 700, cursor: isAllowStyle ? 'default' : 'pointer', textDecoration: isAllowStyle ? 'none' : 'underline' }}
                                          onClick={() => {
                                            if (isAllowStyle) return;
                                            showLogDetailsByRef(parsed.refNo, pr.record_id, parsed.module);
                                          }}
                                          title={isClientMaster ? 'Client master notify only' : (isChamberMaster ? (parsed.refNo === 'ADD' ? 'Chamber add allow request' : 'Chamber delete allow request') : (isMasterSetup ? 'Master Setup opens without allow' : 'Click to view data profile'))}
                                        >
                                          {isMasterSetup ? 'OPEN' : (isChamberMaster || isClientMaster ? (parsed.client || parsed.refNo) : (parsed.refNo || `#${pr.record_id}`))}
                                        </td>
                                        <td style={{ padding: '6px 8px', fontWeight: '700', color: '#0f172a' }}>{parsed.client}</td>
                                        <td style={{ padding: '6px 8px' }}>
                                          <span className="status-badge" style={{ 
                                            backgroundColor: isMasterSetup
                                              ? '#e0f2fe'
                                              : isClientMaster
                                                ? '#eff6ff'
                                              : (parsed.refNo === 'ADD'
                                                ? '#dbeafe'
                                                : (pr.raw_action === 'REQUEST_DELETE' || parsed.refNo === 'DELETE'
                                                  ? '#fee2e2'
                                                  : '#e0f2fe')),
                                            color: isMasterSetup
                                              ? '#0369a1'
                                              : isClientMaster
                                                ? '#1d4ed8'
                                              : (parsed.refNo === 'ADD'
                                                ? '#1d4ed8'
                                                : (pr.raw_action === 'REQUEST_DELETE' || parsed.refNo === 'DELETE'
                                                  ? '#dc2626'
                                                  : '#0369a1')),
                                            fontWeight: 800 
                                          }}>
                                            {isMasterSetup ? 'OPEN' : (isChamberMaster ? (parsed.refNo || 'ALLOW') : (isClientMaster ? (parsed.refNo || 'NOTIFY') : (pr.raw_action === 'REQUEST_DELETE' ? 'DELETE' : 'EDIT')))}
                                          </span>
                                        </td>
                                        <td style={{ padding: '6px 8px', color: '#334155' }}>
                                          <div style={{ fontWeight: '600', color: '#1e293b' }}>
                                            {(pr.description || '').split(' | ')[0]}
                                          </div>
                                          {(pr.remark || pr.request_remark) ? (
                                            <div style={{ fontSize: '0.66rem', color: '#0f766e', marginTop: '2px', fontWeight: 600 }}>
                                              Remark: {pr.remark || pr.request_remark}
                                            </div>
                                          ) : null}
                                          {parsed.extra !== '-' && (
                                            <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '2px', fontStyle: 'italic' }}>
                                              {parsed.extra}
                                            </div>
                                          )}
                                        </td>
                                        <td style={{ padding: '6px 8px' }}>
                                          <span style={{
                                            display: 'inline-block',
                                            padding: '1px 6px',
                                            borderRadius: '100px',
                                            fontSize: '0.64rem',
                                            fontWeight: '800',
                                            color: '#ca8a04',
                                            backgroundColor: '#fef9c3',
                                          }}>
                                            {pr.status}
                                          </span>
                                        </td>
                                        <td style={{ padding: '6px 8px' }}>
                                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                          <button
                                            onClick={() => handleApproveDenyPermission(pr.id, 'Approved')}
                                            style={{
                                              padding: '4px 10px',
                                              borderRadius: 'var(--radius-sm)',
                                              border: 'none',
                                              backgroundColor: '#ea580c',
                                              color: '#ffffff',
                                              fontSize: '0.72rem',
                                              fontWeight: '800',
                                              cursor: 'pointer',
                                              boxShadow: '0 2px 5px rgba(234, 88, 12, 0.25)'
                                            }}
                                          >
                                            Approve
                                          </button>
                                          <button
                                            onClick={() => handleApproveDenyPermission(pr.id, 'Denied')}
                                            style={{
                                              padding: '4px 10px',
                                              borderRadius: 'var(--radius-sm)',
                                              border: '1px solid var(--border)',
                                              backgroundColor: '#ffffff',
                                              color: 'var(--text-dark)',
                                              fontSize: '0.72rem',
                                              fontWeight: '700',
                                              cursor: 'pointer'
                                            }}
                                          >
                                            Deny
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Security logs removed from Tab 2 */}
                  </div>
                );
              })()
            )}
          </div>
        )}

        {activeMenu === 'user_management' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Top Toggle Buttons: Customers and Data Operators */}
            <div style={{
              display: 'flex',
              gap: '12px',
              backgroundColor: 'var(--surface)',
              padding: '6px 10px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              alignSelf: 'flex-start',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <button
                type="button"
                onClick={() => setUserTab('customers')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: userTab === 'customers' ? 'var(--primary)' : 'transparent',
                  color: userTab === 'customers' ? '#fff' : 'var(--text-dark)',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <ShieldCheck size={16} />
                Customers
              </button>
              <button
                type="button"
                onClick={() => setUserTab('operators')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: userTab === 'operators' ? 'var(--primary)' : 'transparent',
                  color: userTab === 'operators' ? '#fff' : 'var(--text-dark)',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <Thermometer size={16} />
                Data Operators
              </button>
            </div>

            {/* Render the appropriate view based on userTab */}
            {userTab === 'customers' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Top: Register New Customer Horizontal Form */}
                <div className="diagnostics-card" style={{ padding: '24px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {editingSubAdmin ? <Edit size={18} color="#00a2e8" /> : <UserPlus size={18} color="#00a2e8" />}
                      <span>{editingSubAdmin ? `Modify Customer Profile: ${editingSubAdmin.email}` : 'Register New Customer'}</span>
                    </h2>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                      All fields are mandatory. Registered credentials grant dashboard and inquiry management access to Customers.
                    </p>
                  </div>

                  <form onSubmit={handleSaveSubAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="horizontal-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      {/* Full Name */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dark)' }}>Full Name *</label>
                        <input 
                          type="text"
                          name="subadmin-full-name"
                          inputMode="text"
                          autoComplete="name"
                          placeholder="e.g. Jane Doe"
                          value={subAdminFullName}
                          onChange={(e) => setSubAdminFullName(e.target.value.replace(/[^a-zA-Z\s.'-]/g, ''))}
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
                          type="tel"
                          name="subadmin-phone"
                          inputMode="numeric"
                          autoComplete="tel"
                          placeholder="e.g. 9876543210"
                          value={subAdminPhoneNo}
                          onChange={(e) => setSubAdminPhoneNo(e.target.value.replace(/[^\d+]/g, ''))}
                          pattern="[0-9+]{7,15}"
                          title="Enter a valid phone number (digits only)"
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '280px', gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dark)' }}>Email ID *</label>
                        <input 
                          type="email"
                          name="subadmin-email"
                          inputMode="email"
                          autoComplete="email"
                          placeholder="e.g. customer@client.com"
                          value={subAdminEmail}
                          onChange={(e) => setSubAdminEmail(e.target.value)}
                          required
                          style={{
                            width: '100%',
                            minWidth: '280px',
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                            fontSize: '0.85rem',
                            outline: 'none',
                            backgroundColor: 'var(--bg-main)',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      {/* Password */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dark)' }}>
                          {editingSubAdmin ? 'Password (leave blank to keep)' : 'Password *'}
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input 
                            type={showPassword ? 'text' : 'password'}
                            name="subadmin-password"
                            autoComplete="new-password"
                            placeholder={editingSubAdmin ? '••••••••' : 'Enter login password'}
                            value={subAdminPassword}
                            onChange={(e) => setSubAdminPassword(e.target.value)}
                            required={!editingSubAdmin}
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

                      {/* Warehouse Filter Access — select first; clients cascade from these */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dark)' }}>Allowed Warehouses</label>
                        <select
                          value=""
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val && !subAdminSelectedWarehouses.includes(val)) {
                              setSubAdminSelectedWarehouses((prev) => [...prev, val]);
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--bg-main)',
                            fontSize: '0.85rem',
                            color: 'var(--text-dark)',
                            outline: 'none',
                            minWidth: 0,
                            cursor: 'pointer',
                            appearance: 'auto'
                          }}
                        >
                          <option value="">
                            {(accessScopeOptions.warehouses || []).length === 0
                              ? 'No warehouses yet — register a DO operator or save a log first'
                              : 'Select warehouse from DO records…'}
                          </option>
                          {(accessScopeOptions.warehouses || [])
                            .filter((w) => !subAdminSelectedWarehouses.includes(w))
                            .map((wh) => (
                              <option key={wh} value={wh}>
                                {wh}
                              </option>
                            ))}
                        </select>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', minHeight: '40px', alignItems: 'center' }}>
                          {subAdminSelectedWarehouses.length === 0 ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No warehouses selected — full warehouse access</span>
                          ) : (
                            subAdminSelectedWarehouses.map((wh, idx) => (
                              <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid rgba(0, 162, 232, 0.25)' }}>
                                {wh}
                                <button type="button" onClick={() => setSubAdminSelectedWarehouses(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 0, display: 'flex', alignItems: 'center' }}>
                                  <X size={12} />
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Client Filter Access — options depend on selected warehouses */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dark)' }}>Allowed Clients</label>
                        <select
                          value=""
                          disabled={subAdminSelectedWarehouses.length === 0}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val && !subAdminSelectedClients.includes(val)) {
                              setSubAdminSelectedClients((prev) => [...prev, val]);
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                            backgroundColor: subAdminSelectedWarehouses.length === 0 ? '#f1f5f9' : 'var(--bg-main)',
                            fontSize: '0.85rem',
                            color: 'var(--text-dark)',
                            outline: 'none',
                            minWidth: 0,
                            cursor: subAdminSelectedWarehouses.length === 0 ? 'not-allowed' : 'pointer',
                            appearance: 'auto'
                          }}
                        >
                          <option value="">
                            {subAdminSelectedWarehouses.length === 0
                              ? 'Select warehouse(s) first to see clients…'
                              : subAdminClientOptions.length === 0
                                ? 'No clients found for selected warehouse(s)'
                                : `Select client (${subAdminClientOptions.length} for selected warehouse(s))…`}
                          </option>
                          {subAdminClientOptions
                            .filter((c) => !subAdminSelectedClients.includes(c))
                            .map((client) => (
                              <option key={client} value={client}>
                                {client}
                              </option>
                            ))}
                        </select>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', minHeight: '40px', alignItems: 'center' }}>
                          {subAdminSelectedWarehouses.length === 0 ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pick warehouses above — clients will list for those warehouses only</span>
                          ) : subAdminSelectedClients.length === 0 ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No clients selected — all clients in selected warehouse(s)</span>
                          ) : (
                            subAdminSelectedClients.map((client, idx) => (
                              <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid rgba(0, 162, 232, 0.25)' }}>
                                {client}
                                <button type="button" onClick={() => setSubAdminSelectedClients(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 0, display: 'flex', alignItems: 'center' }}>
                                  <X size={12} />
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      {editingSubAdmin && (
                        <button 
                          type="button" 
                          onClick={cancelEditSubAdmin}
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
                        disabled={savingSubAdmin || loadingSubAdmins}
                        style={{
                          padding: '10px 24px',
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          background: editingSubAdmin ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#00a2e8',
                          color: '#ffffff',
                          fontSize: '0.85rem',
                          fontWeight: '800',
                          cursor: (savingSubAdmin || loadingSubAdmins) ? 'wait' : 'pointer',
                          opacity: (savingSubAdmin || loadingSubAdmins) ? 0.85 : 1,
                          boxShadow: editingSubAdmin ? '0 4px 12px rgba(249, 115, 22, 0.35)' : '0 4px 12px rgba(0, 162, 232, 0.25)',
                          transition: 'all 0.2s ease',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        {savingSubAdmin ? (
                          <>
                            <Loader2 size={16} className="spinner-icon" />
                            {subAdminProcessStatus || 'Processing…'}
                          </>
                        ) : (editingSubAdmin ? 'Update Customer' : 'Register Customer')}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Bottom: Customers Directory List */}
                {(() => {
                  const filteredSubAdminsList = subAdmins.filter(sa => {
                    const term = subAdminSearch.toLowerCase();
                    return (
                      (sa.full_name && sa.full_name.toLowerCase().includes(term)) ||
                      (sa.email && sa.email.toLowerCase().includes(term)) ||
                      (sa.phone_no && sa.phone_no.toLowerCase().includes(term))
                    );
                  });

                  return (
                    <div className="diagnostics-card" style={{ padding: '24px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>Customers Directory</h2>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Manage customer account credentials and system access permissions.</p>
                        </div>

                        <div style={{ minWidth: '240px' }}>
                          <input 
                            type="text" 
                            placeholder="Search by name, email..."
                            value={subAdminSearch}
                            onChange={(e) => setSubAdminSearch(e.target.value)}
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

                      {subAdminSuccess && (
                        <div style={{ padding: '10px 14px', backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: '700' }}>
                          {subAdminSuccess}
                        </div>
                      )}
                      {subAdminError && (
                        <div style={{ padding: '10px 14px', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: '700' }}>
                          {subAdminError}
                        </div>
                      )}

                      {loadingSubAdmins ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                          <span>Loading customers directory...</span>
                        </div>
                      ) : filteredSubAdminsList.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--text-muted)', gap: '10px' }}>
                          <ShieldAlert size={32} color="#94a3b8" />
                          <p style={{ margin: 0, fontSize: '0.85rem' }}>No matching customers found.</p>
                        </div>
                      ) : (
                        <div className="table-responsive" style={{ flex: 1, overflowY: 'auto' }}>
                          <table className="logs-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Full Name</th>
                                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Phone No.</th>
                                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Email Address</th>
                                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Role Level</th>
                                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Data Access Scope</th>
                                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Registration Date</th>
                                <th style={{ textAlign: 'center', padding: '12px 16px' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredSubAdminsList.map((sa) => (
                                <tr key={sa.id}>
                                  <td style={{ padding: '12px 16px', fontWeight: '600' }}>{sa.full_name || '-'}</td>
                                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>{sa.phone_no || '-'}</td>
                                  <td style={{ padding: '12px 16px', fontWeight: '600' }}>{sa.email}</td>
                                  <td style={{ padding: '12px 16px' }}>
                                    <span className="status-badge" style={{ backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: 800 }}>
                                      Customer
                                    </span>
                                  </td>
                                  <td style={{ padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      {sa.allowed_clients ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                          {sa.allowed_clients.split(',').map((c, i) => (
                                            <span key={i} style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '1px 6px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: '700', border: '1px solid rgba(0, 162, 232, 0.25)' }}>{c.trim()}</span>
                                          ))}
                                        </div>
                                      ) : (
                                        <span style={{ fontSize: '0.72rem', color: '#22c55e', fontWeight: '700' }}>All Clients</span>
                                      )}
                                      {sa.allowed_warehouses ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                          {sa.allowed_warehouses.split(',').map((w, i) => (
                                            <span key={i} style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '1px 6px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: '700', border: '1px solid rgba(0, 162, 232, 0.25)' }}>{w.trim()}</span>
                                          ))}
                                        </div>
                                      ) : (
                                        <span style={{ fontSize: '0.72rem', color: '#22c55e', fontWeight: '700' }}>All Warehouses</span>
                                      )}
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                    {new Date(sa.created_at).toLocaleDateString('en-GB')}
                                  </td>
                                  <td style={{ padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                      <button 
                                        className="btn-edit-log"
                                        type="button"
                                        onClick={() => startEditSubAdmin(sa)}
                                        title="Edit Customer Profile"
                                        style={{ backgroundColor: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1', padding: '6px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                      >
                                        <Edit size={14} />
                                      </button>
                                      <button 
                                        className="btn-delete-log"
                                        type="button"
                                        onClick={() => handleDeleteSubAdmin(sa.id)}
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
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Top: Register New Operator Horizontal Form */}
                <div className="diagnostics-card" style={{ padding: '24px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {editingOp ? <Edit size={18} color="#00a2e8" /> : <UserPlus size={18} color="#00a2e8" />}
                      <span>{editingOp ? `Modify Operator Profile: ${editingOp.email}` : 'Register New Data Operator'}</span>
                    </h2>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                      {editingOp ? 'Update account details, phone, Warehouse / Data Access, chambers, or password.' : 'All horizontal fields are mandatory. Warehouse / Data Access scopes this operator to one warehouse.'}
                    </p>
                  </div>

                  <form onSubmit={handleSaveOperator} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="horizontal-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      {/* Full Name */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dark)' }}>Full Name *</label>
                        <input 
                          type="text"
                          name="op-full-name"
                          inputMode="text"
                          autoComplete="name"
                          placeholder="e.g. John Doe"
                          value={opFullName}
                          onChange={(e) => setOpFullName(e.target.value.replace(/[^a-zA-Z\s.'-]/g, ''))}
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
                          type="tel"
                          name="op-phone"
                          inputMode="numeric"
                          autoComplete="tel"
                          placeholder="e.g. 9876543210"
                          value={opPhoneNo}
                          onChange={(e) => setOpPhoneNo(e.target.value.replace(/[^\d+]/g, ''))}
                          pattern="[0-9+]{7,15}"
                          title="Enter a valid phone number (digits only)"
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '280px', gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dark)' }}>Email ID *</label>
                        <input 
                          type="email"
                          name="op-email"
                          inputMode="email"
                          autoComplete="email"
                          placeholder="e.g. operator@reeferon.com"
                          value={opEmail}
                          onChange={(e) => setOpEmail(e.target.value)}
                          required
                          style={{
                            width: '100%',
                            minWidth: '280px',
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                            fontSize: '0.85rem',
                            outline: 'none',
                            backgroundColor: 'var(--bg-main)',
                            boxSizing: 'border-box'
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
                            name="op-password"
                            autoComplete="new-password"
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

                      {/* Warehouse / Data Access */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dark)' }}>Warehouse / Data Access *</label>
                        <input 
                          type="text"
                          name="op-warehouse"
                          list="op-warehouse-suggestions"
                          inputMode="text"
                          autoComplete="organization"
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
                        <datalist id="op-warehouse-suggestions">
                          {Array.from(new Set([
                            ...(accessScopeOptions.warehouses || []),
                            ...((operators || []).map((o) => o?.warehouse_name).filter(Boolean))
                          ]))
                            .sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: 'base' }))
                            .map((wh) => (
                              <option key={wh} value={wh} />
                            ))}
                        </datalist>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                          {editingOp
                            ? 'Updates profile + past logs for this operator. New tasks also use this warehouse.'
                            : 'New operator can only access logs for this warehouse.'}
                        </span>
                      </div>

                      {/* Assigned Chambers Limit */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dark)' }}>Total Chambers Assigned *</label>
                        <input 
                          type="number"
                          min="1"
                          max="100"
                          placeholder="e.g. 4"
                          value={opChamberLimit}
                          onChange={(e) => setOpChamberLimit(e.target.value)}
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
                        disabled={savingOp || loadingOps}
                        style={{
                          padding: '10px 24px',
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          background: editingOp ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#00a2e8',
                          color: '#ffffff',
                          fontSize: '0.85rem',
                          fontWeight: '800',
                          cursor: savingOp ? 'wait' : 'pointer',
                          opacity: savingOp ? 0.85 : 1,
                          boxShadow: editingOp ? '0 4px 12px rgba(249, 115, 22, 0.35)' : '0 4px 12px rgba(0, 162, 232, 0.25)',
                          transition: 'all 0.2s ease',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        {savingOp ? (
                          <>
                            <Loader2 size={16} className="spinner-icon" />
                            {opProcessStatus || 'Processing…'}
                          </>
                        ) : (editingOp ? 'Update Operator Profile' : 'Register Operator Profile')}
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                                backgroundColor: 'var(--bg-main)',
                                height: '37px',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleExportOperatorsDirectory}
                            disabled={!operators || operators.length === 0}
                            title="Export operators directory to CSV"
                            style={{
                              padding: '8px 14px',
                              borderRadius: 'var(--radius-sm)',
                              border: 'none',
                              backgroundColor: !operators || operators.length === 0 ? '#94a3b8' : '#22c55e',
                              color: '#ffffff',
                              fontSize: '0.8rem',
                              fontWeight: '700',
                              cursor: !operators || operators.length === 0 ? 'not-allowed' : 'pointer',
                              opacity: !operators || operators.length === 0 ? 0.7 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              height: '37px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <Download size={14} />
                            <span>Export</span>
                          </button>
                        </div>
                      </div>

                      {exportError?.retryKey === 'operators' && (
                        <ExportErrorBanner
                          message={exportError.message}
                          retryable={exportError.retryable}
                          onRetry={retryFailedExport}
                          onDismiss={() => setExportError(null)}
                        />
                      )}

                      {opSuccess && (
                        <div style={{ padding: '10px 14px', backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: '700' }}>
                          {opSuccess}
                        </div>
                      )}
                      {opError && (
                        <LoadErrorBanner
                          message={opError}
                          onRetry={loadOperatorsData}
                          onDismiss={() => setOpError('')}
                        />
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
                                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Warehouse / Data Access</th>
                                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Registration Date</th>
                                <th style={{ textAlign: 'center', padding: '12px 16px' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredOperators.map((op) => {
                                 if (!op) return null;
                                 return (
                                   <tr key={op.id}>
                                  <td style={{ padding: '12px 16px' }}>
                                    <span className="status-badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 800 }}>
                                      #{op.id}
                                    </span>
                                  </td>
                                  <td style={{ padding: '12px 16px', fontWeight: '600' }}>{op.full_name || '-'}</td>
                                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>{op.phone_no || '-'}</td>
                                  <td style={{ padding: '12px 16px', fontWeight: '600' }}>{op.email}</td>
                                  <td style={{ padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      <strong style={{ fontWeight: '700', color: op.warehouse_name ? 'var(--text-dark)' : '#ea580c' }}>
                                        {op.warehouse_name || 'Not Configured'}
                                      </strong>
                                      <span className="status-badge" style={{ 
                                        backgroundColor: op.warehouse_name ? 'var(--primary-light)' : '#ffedd5', 
                                        color: op.warehouse_name ? 'var(--primary)' : '#ea580c', 
                                        fontWeight: 800,
                                        fontSize: '0.64rem',
                                        display: 'inline-block',
                                        width: 'max-content',
                                        padding: '2px 8px',
                                        borderRadius: '100px'
                                      }}>
                                        {op.warehouse_name
                                          ? `Access: ${op.warehouse_name} Logs Only`
                                          : 'Access: Not Configured — edit profile'}
                                      </span>
                                      <span className="status-badge" style={{ 
                                        backgroundColor: '#f1f5f9', 
                                        color: '#475569', 
                                        fontWeight: 800,
                                        fontSize: '0.64rem',
                                        display: 'inline-block',
                                        width: 'max-content',
                                        padding: '2px 8px',
                                        borderRadius: '100px',
                                        marginTop: '2px'
                                      }}>
                                        Chambers: 1 to {op.chamber_limit || 4}
                                      </span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                    {new Date(op.created_at).toLocaleDateString('en-GB')}
                                  </td>
                                  <td style={{ padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                      <button 
                                        className="btn-edit-log"
                                        type="button"
                                        onClick={() => startEditOperator(op)}
                                        title="Edit Operator Profile"
                                        style={{ backgroundColor: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1', padding: '6px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                      >
                                        <Edit size={14} />
                                      </button>
                                      <button 
                                        className="btn-delete-log"
                                        type="button"
                                        onClick={() => handleDeleteOperator(op.id)}
                                        title="Revoke Access (Delete)"
                                        style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', padding: '6px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )})}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {activeMenu === 'customer_reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { id: 'issues', label: 'Issue reports', icon: MessageSquareWarning },
                { id: 'notes', label: 'Notes & updates', icon: MessageSquare }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = customerReportsTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setCustomerReportsTab(tab.id);
                      if (tab.id === 'notes') {
                        loadSubAdminsData();
                        loadNoteThreads();
                        loadNoteMessages(selectedNoteCustomer || 'All');
                      } else {
                        loadCustomerReportsData();
                      }
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 999,
                      border: active ? '1px solid var(--primary)' : '1px solid var(--border)',
                      background: active ? 'var(--primary-light)' : '#fff',
                      color: active ? 'var(--primary)' : 'var(--text-dark)',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {customerReportsTab === 'notes' ? (
              <div className="diagnostics-card" style={{ padding: '24px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MessageSquare size={18} color="#00a2e8" />
                      <span>Customer Notes & Updates</span>
                    </h2>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                      Chat-style notes from Super Admin to customers. Customers see these on mobile Dashboard → Updates (read only).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      loadNoteThreads();
                      loadNoteMessages(selectedNoteCustomer || 'All');
                    }}
                    disabled={loadingNotes}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      background: '#fff',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: loadingNotes ? 'wait' : 'pointer'
                    }}
                  >
                    Refresh
                  </button>
                </div>
                {notesError && (
                  <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 8, background: '#fef2f2', color: '#b91c1c', fontSize: '0.82rem', fontWeight: 600 }}>
                    {notesError}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) 1fr', gap: 16, minHeight: 420 }}>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontWeight: 800, fontSize: '0.75rem', color: '#64748b' }}>
                      CUSTOMERS
                    </div>
                    <div style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>
                      <select
                        value={selectedNoteCustomer || 'All'}
                        onChange={(e) => handleSelectNoteCustomer(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        <option value="All">All</option>
                        {(subAdmins || []).map((c) => (
                          <option key={c.id || c.email} value={String(c.email || '').toLowerCase()}>
                            {c.full_name || c.email} ({c.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                      {noteThreads.length === 0 ? (
                        <div style={{ padding: 16, fontSize: '0.78rem', color: '#94a3b8' }}>No note threads yet.</div>
                      ) : (
                        noteThreads.map((t) => {
                          const email = String(t.customer_email || '').toLowerCase();
                          const active =
                            selectedNoteCustomer !== 'All' && email === selectedNoteCustomer;
                          return (
                            <button
                              key={email}
                              type="button"
                              onClick={() => handleSelectNoteCustomer(email)}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '12px',
                                border: 'none',
                                borderBottom: '1px solid var(--border)',
                                background: active ? '#e0f2fe' : 'transparent',
                                cursor: 'pointer'
                              }}
                            >
                              <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>
                                {t.customer_name || email}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>{email}</div>
                              <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {t.last_message || '—'}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', minHeight: 420, background: '#fff' }}>
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>
                      {selectedNoteCustomer && selectedNoteCustomer !== 'All'
                        ? `Chat · ${selectedNoteCustomer}`
                        : `All customers selected · send goes to everyone (${(subAdmins || []).length || 0})`}
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10, background: '#f8fafc' }}>
                      {noteMessages.length === 0 ? (
                        <div style={{ margin: 'auto', color: '#94a3b8', fontSize: '0.85rem' }}>
                          {selectedNoteCustomer && selectedNoteCustomer !== 'All'
                            ? 'No notes yet. Send the first update.'
                            : 'No notes yet.'}
                        </div>
                      ) : (
                        noteMessages.map((m) => {
                          const fromAdmin = m.author_role === 'super_admin';
                          const showCustomer =
                            selectedNoteCustomer === 'All' || !selectedNoteCustomer;
                          return (
                            <div
                              key={m.id}
                              style={{
                                alignSelf: fromAdmin ? 'flex-end' : 'flex-start',
                                maxWidth: '78%',
                                background: fromAdmin ? '#003580' : '#fff',
                                color: fromAdmin ? '#fff' : '#0f172a',
                                border: fromAdmin ? 'none' : '1px solid #e2e8f0',
                                borderRadius: 12,
                                padding: '10px 12px'
                              }}
                            >
                              <div style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 700, marginBottom: 4 }}>
                                {showCustomer
                                  ? `${m.customer_name || m.customer_email || 'Customer'} · `
                                  : ''}
                                {fromAdmin ? 'Super Admin' : (m.author_name || 'Customer')}
                                {' · '}
                                {m.created_at ? new Date(m.created_at).toLocaleString() : ''}
                              </div>
                              <div style={{ fontSize: '0.84rem', lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                {m.message}
                              </div>
                              {fromAdmin ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomerNote(m.id)}
                                  style={{ marginTop: 6, border: 'none', background: 'transparent', color: '#fecaca', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                                >
                                  Delete
                                </button>
                              ) : null}
                            </div>
                          );
                        })
                      )}
                      <div ref={notesChatEndRef} />
                    </div>
                    <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                      <textarea
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder={
                          selectedNoteCustomer && selectedNoteCustomer !== 'All'
                            ? 'Write an update / note for this customer…'
                            : 'Write a note — will send to ALL customers…'
                        }
                        disabled={sendingNote}
                        rows={2}
                        style={{ flex: 1, resize: 'vertical', minHeight: 44, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: '0.84rem', fontFamily: 'inherit' }}
                      />
                      <button
                        type="button"
                        onClick={handleSendCustomerNote}
                        disabled={sendingNote || !String(noteDraft || '').trim()}
                        style={{
                          padding: '0 18px',
                          borderRadius: 10,
                          border: 'none',
                          background: 'var(--primary)',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '0.84rem',
                          cursor: sendingNote ? 'not-allowed' : 'pointer',
                          opacity: sendingNote ? 0.6 : 1
                        }}
                      >
                        {sendingNote
                          ? 'Sending…'
                          : selectedNoteCustomer && selectedNoteCustomer !== 'All'
                            ? 'Send'
                            : 'Send to all'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
            <div className="diagnostics-card" style={{ padding: '24px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquareWarning size={18} color="#00a2e8" />
                    <span>Customer Reports</span>
                  </h2>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    Issues & queries from the Customer profile. Each row shows the customer, Ref No. (or Query), and message.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadCustomerReportsData}
                  disabled={loadingCustomerReports}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: '#fff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: loadingCustomerReports ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {loadingCustomerReports ? <Loader2 size={14} className="spinner-icon" /> : null}
                  Refresh
                </button>
              </div>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'flex-end',
                padding: '14px',
                background: 'var(--bg-main)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '2 1 220px' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>Search</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Customer name, email, phone, Ref No., issue…"
                      value={customerReportSearch}
                      onChange={(e) => setCustomerReportSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') loadCustomerReportsData();
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 32px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        fontSize: '0.8rem',
                        background: '#fff',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 140px' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>Status</label>
                  <select
                    value={customerReportStatusFilter}
                    onChange={(e) => setCustomerReportStatusFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: '#fff',
                      height: 37
                    }}
                  >
                    <option value="All">All</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={loadCustomerReportsData}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    height: 37
                  }}
                >
                  Apply
                </button>
              </div>

              {customerReportsError && (
                <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 8, background: '#fef2f2', color: '#b91c1c', fontSize: '0.82rem', fontWeight: 600 }}>
                  {customerReportsError}
                </div>
              )}

              {loadingCustomerReports ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                  <Loader2 size={18} className="spinner-icon" />
                  <span>Loading customer reports…</span>
                </div>
              ) : customerReports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No customer reports found.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <table className="logs-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-main)', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px', fontWeight: 800 }}>Customer Identity</th>
                        <th style={{ padding: '10px 12px', fontWeight: 800 }}>Access Scope</th>
                        <th style={{ padding: '10px 12px', fontWeight: 800 }}>Ref No.</th>
                        <th style={{ padding: '10px 12px', fontWeight: 800 }}>Issue</th>
                        <th style={{ padding: '10px 12px', fontWeight: 800 }}>Status</th>
                        <th style={{ padding: '10px 12px', fontWeight: 800 }}>Submitted</th>
                        <th style={{ padding: '10px 12px', fontWeight: 800 }}>Update</th>
                        <th style={{ padding: '10px 12px', fontWeight: 800 }}>Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerReports.map((report) => {
                        if (!report) return null;
                        const statusColor =
                          report.status === 'Open' ? '#dc2626'
                            : report.status === 'In Progress' ? '#d97706'
                              : report.status === 'Resolved' ? '#16a34a'
                                : '#64748b';
                        const statusBg =
                          report.status === 'Open' ? '#fee2e2'
                            : report.status === 'In Progress' ? '#ffedd5'
                              : report.status === 'Resolved' ? '#dcfce7'
                                : '#f1f5f9';
                        return (
                          <tr key={report.id} style={{ borderBottom: '1px solid var(--border)', verticalAlign: 'top' }}>
                            <td style={{ padding: '12px' }}>
                              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                                {report.customer_name || 'Unnamed customer'}
                              </div>
                              <div style={{ color: '#475569', fontWeight: 600 }}>{report.customer_email}</div>
                              <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: 4 }}>
                                {report.customer_id != null ? `Customer ID: ${report.customer_id}` : 'Customer ID: —'}
                                {report.customer_phone ? ` · ${report.customer_phone}` : ''}
                              </div>
                            </td>
                            <td style={{ padding: '12px', maxWidth: 180 }}>
                              <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 4 }}>
                                <strong style={{ color: '#334155' }}>Clients:</strong>{' '}
                                {report.allowed_clients || 'All / not set'}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                <strong style={{ color: '#334155' }}>Warehouses:</strong>{' '}
                                {report.allowed_warehouses || 'All / not set'}
                              </div>
                            </td>
                            <td style={{ padding: '12px', fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                              {report.reference_no}
                            </td>
                            <td style={{ padding: '12px', color: '#334155', maxWidth: 280, lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {report.message}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 999,
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                color: statusColor,
                                background: statusBg
                              }}>
                                {report.status}
                              </span>
                            </td>
                            <td style={{ padding: '12px', color: '#64748b', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                              {report.created_at
                                ? new Date(report.created_at).toLocaleString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })
                                : '—'}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <select
                                value={report.status}
                                disabled={updatingReportId === report.id}
                                onChange={(e) => handleUpdateCustomerReportStatus(report.id, e.target.value)}
                                style={{
                                  padding: '6px 8px',
                                  borderRadius: 6,
                                  border: '1px solid var(--border)',
                                  fontSize: '0.74rem',
                                  fontWeight: 600,
                                  background: '#fff',
                                  cursor: updatingReportId === report.id ? 'wait' : 'pointer',
                                  minWidth: 120
                                }}
                              >
                                <option value="Open">Open</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Closed">Closed</option>
                              </select>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <button
                                type="button"
                                title="Delete report"
                                disabled={updatingReportId === report.id}
                                onClick={() => handleDeleteCustomerReport(report.id)}
                                style={{
                                  backgroundColor: '#fee2e2',
                                  border: '1px solid #fecaca',
                                  color: '#b91c1c',
                                  padding: '6px 8px',
                                  borderRadius: 6,
                                  cursor: updatingReportId === report.id ? 'wait' : 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
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
          </div>
        )}
          </>
        )}
      </main>



      {/* Detailed Data Profile Modal */}
      {selectedDetailLog && (
        <div className="profile-modal-overlay" onClick={() => {
          setSelectedDetailLog(null);
          setRecordAllowHistory([]);
        }}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>
                <History size={20} color="var(--primary)" />
                <span>Log Details: {selectedDetailLog.reference_no || `ID: ${selectedDetailLog.id || selectedDetailLog.inward_id || selectedDetailLog.outward_id}`}</span>
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => startSaEditLog(detailType || (selectedDetailLog.inward_id ? 'inward' : selectedDetailLog.outward_id ? 'outward' : 'daily'), selectedDetailLog)}
                  title="Edit (Super Admin — no permission)"
                  style={{ backgroundColor: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1', padding: '6px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700 }}
                >
                  <Edit size={14} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleSaDeleteLog(detailType || (selectedDetailLog.inward_id ? 'inward' : selectedDetailLog.outward_id ? 'outward' : 'daily'), selectedDetailLog)}
                  title="Delete (Super Admin — no permission)"
                  style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', padding: '6px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700 }}
                >
                  <Trash2 size={14} /> Delete
                </button>
                <button className="profile-modal-close-btn" onClick={() => {
                  setSelectedDetailLog(null);
                  setRecordAllowHistory([]);
                }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="profile-modal-body">
              {/* Left Column: Data Fields */}
              <div className="profile-details-section">
                {detailType !== 'daily' && (
                  <div className="profile-group-card">
                    <div className="profile-group-title">Metadata & Warehouse</div>
                    <div className="profile-grid-list">
                      <div className="profile-item">
                        <span className="profile-label">Warehouse Facility</span>
                        <span className="profile-value">{selectedDetailLog.warehouse_name || '-'}</span>
                      </div>
                      <div className="profile-item">
                        <span className="profile-label">Recorded By Operator</span>
                        <span className="profile-value">{renderOperatorEmail(selectedDetailLog.operator_email)}</span>
                      </div>
                      <div className="profile-item">
                        <span className="profile-label">Created Time</span>
                        <span className="profile-value">{formatDateTimeStr(selectedDetailLog.created_at || selectedDetailLog.inward_created_at || selectedDetailLog.outward_created_at)}</span>
                      </div>
                      {getUpdateDiff(
                        selectedDetailLog.created_at || selectedDetailLog.inward_created_at || selectedDetailLog.outward_created_at,
                        selectedDetailLog.updated_at || selectedDetailLog.inward_updated_at || selectedDetailLog.outward_updated_at
                      ) && (
                        <div className="profile-item">
                          <span className="profile-label">Last Updated Time</span>
                          <span className="profile-value" style={{ color: '#0284c7', fontWeight: '800' }}>
                            {formatDateTimeStr(selectedDetailLog.updated_at || selectedDetailLog.inward_updated_at || selectedDetailLog.outward_updated_at)}
                          </span>
                        </div>
                      )}
                      {(Number(selectedDetailLog.update_count) > 0 || selectedDetailLog.update_details) && (
                        <div className="profile-item" style={{ gridColumn: 'span 2' }}>
                          <span className="profile-label" style={{ color: 'var(--primary)', fontWeight: '800' }}>
                            Last Updated Details
                          </span>
                          <span className="profile-value" style={{ fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px', display: 'block' }}>
                            Changed {Number(selectedDetailLog.update_count) > 0 ? selectedDetailLog.update_count : 1}{' '}
                            {Number(selectedDetailLog.update_count) === 1 ? 'time' : 'times'}
                          </span>
                          {selectedDetailLog.update_details
                            ? renderUpdateDetailsReadable(selectedDetailLog.update_details)
                            : null}
                        </div>
                      )}
                      {selectedDetailLog.remarks || selectedDetailLog.inward_remarks || selectedDetailLog.outward_remarks ? (
                        <div className="profile-item" style={{ gridColumn: 'span 2' }}>
                          <span className="profile-label">Remarks</span>
                          <span className="profile-value profile-value-remarks">
                            {selectedDetailLog.remarks || selectedDetailLog.inward_remarks || selectedDetailLog.outward_remarks}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                {detailType === 'daily' && renderChamberLogFormView(selectedDetailLog)}

                {renderSuperAllowSection(selectedDetailLog)}

                {detailType === 'inward' && (
                  <>
                    <div className="profile-group-card">
                      <div className="profile-group-title">Vehicle & General Information</div>
                      <div className="profile-grid-list">
                        <div className="profile-item">
                          <span className="profile-label">Date</span>
                          <span className="profile-value">{formatDateStr(selectedDetailLog.inward_entry_date)}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Reference No</span>
                          <span className="profile-value">{selectedDetailLog.reference_no || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Vehicle Number</span>
                          <span className="profile-value">{selectedDetailLog.inward_vehicle_no}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Client Name</span>
                          <span className="profile-value">{selectedDetailLog.inward_client_name}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Dock Number</span>
                          <span className="profile-value">{selectedDetailLog.inward_dock_no || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Seal Number</span>
                          <span className="profile-value">{selectedDetailLog.inward_seal_no || '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="profile-group-card">
                      <div className="profile-group-title">Temperature & Logistics Details</div>
                      <div className="profile-grid-list">
                        <div className="profile-item">
                          <span className="profile-label">Vehicle Temp</span>
                          <span className="profile-value">{selectedDetailLog.inward_vehicle_temp !== null ? `${selectedDetailLog.inward_vehicle_temp}°C` : '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Material Temp</span>
                          <span className="profile-value">{selectedDetailLog.inward_material_temp !== null ? `${selectedDetailLog.inward_material_temp}°C` : '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Pallets In Quantity</span>
                          <span className="profile-value">{selectedDetailLog.inward_pallets_in_qty || '0'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Material Type</span>
                          <span className="profile-value">{selectedDetailLog.inward_material_type || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Unloading Supervisor</span>
                          <span className="profile-value">{selectedDetailLog.inward_unloading_supervisor_name || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Invoice / Received Qty</span>
                          <span className="profile-value">{selectedDetailLog.inward_invoice_qty || '0'} / {selectedDetailLog.inward_received_qty || '0'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="profile-group-card">
                      <div className="profile-group-title">Driver & Timing Info</div>
                      <div className="profile-grid-list">
                        <div className="profile-item">
                          <span className="profile-label">Transporter</span>
                          <span className="profile-value">{selectedDetailLog.inward_transporter_name || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Driver Name</span>
                          <span className="profile-value">{selectedDetailLog.inward_driver_name || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Driver Phone</span>
                          <span className="profile-value">{selectedDetailLog.inward_driver_no || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Reporting Time</span>
                          <span className="profile-value">{selectedDetailLog.inward_vehicle_reporting_time || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Unloading Start</span>
                          <span className="profile-value">{selectedDetailLog.inward_unloading_start_time || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Unloading End</span>
                          <span className="profile-value">{selectedDetailLog.inward_unloading_end_time || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Unloading Duration</span>
                          <span className="profile-value">
                            <strong>{formatDuration(selectedDetailLog.inward_unloading_duration_hours, selectedDetailLog.inward_unloading_duration_mins)}</strong>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                <div>S: {selectedDetailLog.inward_unloading_start_time || '-'}</div>
                                <div>E: {selectedDetailLog.inward_unloading_end_time || '-'}</div>
                            </div>
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {detailType === 'outward' && (
                  <>
                    <div className="profile-group-card">
                      <div className="profile-group-title">Vehicle & General Information</div>
                      <div className="profile-grid-list">
                        <div className="profile-item">
                          <span className="profile-label">Date</span>
                          <span className="profile-value">{formatDateStr(selectedDetailLog.outward_entry_date)}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Reference No</span>
                          <span className="profile-value">{selectedDetailLog.reference_no || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Vehicle Number</span>
                          <span className="profile-value">{selectedDetailLog.outward_vehicle_no}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Client Name</span>
                          <span className="profile-value">{selectedDetailLog.outward_client_name}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Dock Number</span>
                          <span className="profile-value">{selectedDetailLog.outward_dock_no || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Seal Number</span>
                          <span className="profile-value">{selectedDetailLog.outward_seal_no || '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="profile-group-card">
                      <div className="profile-group-title">Temperature & Logistics Details</div>
                      <div className="profile-grid-list">
                        <div className="profile-item">
                          <span className="profile-label">Pre-Cooling Temp</span>
                          <span className="profile-value">{selectedDetailLog.outward_pre_vehicle_temp !== null ? `${selectedDetailLog.outward_pre_vehicle_temp}°C` : '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Loading Temp</span>
                          <span className="profile-value">{selectedDetailLog.outward_vehicle_temp !== null ? `${selectedDetailLog.outward_vehicle_temp}°C` : '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Material Temp</span>
                          <span className="profile-value">{selectedDetailLog.outward_material_temp !== null ? `${selectedDetailLog.outward_material_temp}°C` : '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Pallets Out Quantity</span>
                          <span className="profile-value">{selectedDetailLog.outward_pallets_in_qty || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Material Type</span>
                          <span className="profile-value">{selectedDetailLog.outward_material_type || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Loading Supervisor</span>
                          <span className="profile-value">{selectedDetailLog.outward_loading_supervisor_name || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Invoice / Loaded Qty</span>
                          <span className="profile-value">{selectedDetailLog.outward_invoice_qty || '0'} / {selectedDetailLog.outward_received_qty || '0'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="profile-group-card">
                      <div className="profile-group-title">Driver & Timing Info</div>
                      <div className="profile-grid-list">
                        <div className="profile-item">
                          <span className="profile-label">Transporter</span>
                          <span className="profile-value">{selectedDetailLog.outward_transporter_name || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Driver Name</span>
                          <span className="profile-value">{selectedDetailLog.outward_driver_name || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Driver Phone</span>
                          <span className="profile-value">{selectedDetailLog.outward_driver_no || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Reporting Time</span>
                          <span className="profile-value">{selectedDetailLog.outward_vehicle_reporting_time || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Loading Start</span>
                          <span className="profile-value">{selectedDetailLog.outward_loading_start_time || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Loading End</span>
                          <span className="profile-value">{selectedDetailLog.outward_loading_end_time || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Loading Duration</span>
                          <span className="profile-value">
                            <strong>{formatDuration(selectedDetailLog.outward_loading_duration_hours, selectedDetailLog.outward_loading_duration_mins)}</strong>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                <div>S: {selectedDetailLog.outward_loading_start_time || '-'}</div>
                                <div>E: {selectedDetailLog.outward_loading_end_time || '-'}</div>
                            </div>
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Right Column: Uploaded Photos & Files */}
              <div className="profile-photos-section">
                <h4>Uploaded Audit Attachment Photos</h4>
                
                {/* Check if any photos exist */}
                {((detailType === 'daily' && selectedDetailLog.temp_sensor_image) ||
                  (detailType === 'inward' && (
                    selectedDetailLog.inward_invoice_photos ||
                    selectedDetailLog.inward_pod_photo ||
                    selectedDetailLog.inward_vehicle_seal_photo ||
                    selectedDetailLog.inward_vehicle_temp_photo ||
                    selectedDetailLog.inward_material_temp_photo ||
                    selectedDetailLog.inward_vehicle_back_side_photo ||
                    selectedDetailLog.inward_vehicle_back_side_photo_with_material ||
                    selectedDetailLog.inward_count_sheet_photo ||
                    selectedDetailLog.inward_damage_boxes_photo
                  )) ||
                  (detailType === 'outward' && (
                    selectedDetailLog.outward_invoice_photos ||
                    selectedDetailLog.outward_pod_photo ||
                    selectedDetailLog.outward_vehicle_seal_photo ||
                    selectedDetailLog.outward_vehicle_temp_photo ||
                    selectedDetailLog.outward_pre_vehicle_temp_photo ||
                    selectedDetailLog.outward_material_temp_photo ||
                    selectedDetailLog.outward_vehicle_back_side_photo ||
                    selectedDetailLog.outward_vehicle_back_side_photo_with_material ||
                    selectedDetailLog.outward_count_sheet_photo ||
                    selectedDetailLog.outward_damage_boxes_photo
                  ))) ? (
                  <div className="profile-photo-grid">
                    {detailType === 'daily' && selectedDetailLog.temp_sensor_image && (
                      <div className="profile-photo-card" onClick={() => setLightboxImg(selectedDetailLog.temp_sensor_image.startsWith('data:') || /^https?:\/\//i.test(selectedDetailLog.temp_sensor_image) ? selectedDetailLog.temp_sensor_image : `/${selectedDetailLog.temp_sensor_image}`)}>
                        <div className="profile-photo-wrapper">
                          <img src={selectedDetailLog.temp_sensor_image.startsWith('data:') || /^https?:\/\//i.test(selectedDetailLog.temp_sensor_image) ? selectedDetailLog.temp_sensor_image : `/${selectedDetailLog.temp_sensor_image}`} alt="Temp Sensor" />
                        </div>
                        <div className="profile-photo-label">Temp Sensor</div>
                      </div>
                    )}

                    {/* Render Inward Logs Photos */}
                    {detailType === 'inward' && (
                      <>
                        {selectedDetailLog.inward_invoice_photos && selectedDetailLog.inward_invoice_photos.split(',').map((p) => p.trim()).filter(Boolean).map((img, idx, arr) => (
                          <div key={`diinv-${idx}`} className="profile-photo-card" onClick={() => setLightboxImg(img.startsWith('data:') ? img : `/${img}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={img.startsWith('data:') ? img : `/${img}`} alt={`Invoice ${idx + 1}`} />
                            </div>
                            <div className="profile-photo-label">{arr.length === 1 ? 'Invoice Photo' : `Invoice #${idx + 1}`}</div>
                          </div>
                        ))}
                        {selectedDetailLog.inward_pod_photo && (
                          <div className="profile-photo-card" onClick={() => setLightboxImg(selectedDetailLog.inward_pod_photo.startsWith('data:') ? selectedDetailLog.inward_pod_photo : `/${selectedDetailLog.inward_pod_photo}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={selectedDetailLog.inward_pod_photo.startsWith('data:') ? selectedDetailLog.inward_pod_photo : `/${selectedDetailLog.inward_pod_photo}`} alt="POD" />
                            </div>
                            <div className="profile-photo-label">POD Photo</div>
                          </div>
                        )}
                        {selectedDetailLog.inward_vehicle_seal_photo && (
                          <div className="profile-photo-card" onClick={() => setLightboxImg(selectedDetailLog.inward_vehicle_seal_photo.startsWith('data:') ? selectedDetailLog.inward_vehicle_seal_photo : `/${selectedDetailLog.inward_vehicle_seal_photo}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={selectedDetailLog.inward_vehicle_seal_photo.startsWith('data:') ? selectedDetailLog.inward_vehicle_seal_photo : `/${selectedDetailLog.inward_vehicle_seal_photo}`} alt="Vehicle Seal" />
                            </div>
                            <div className="profile-photo-label">Vehicle Seal</div>
                          </div>
                        )}
                        {selectedDetailLog.inward_vehicle_temp_photo && (
                          <div className="profile-photo-card" onClick={() => setLightboxImg(selectedDetailLog.inward_vehicle_temp_photo.startsWith('data:') ? selectedDetailLog.inward_vehicle_temp_photo : `/${selectedDetailLog.inward_vehicle_temp_photo}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={selectedDetailLog.inward_vehicle_temp_photo.startsWith('data:') ? selectedDetailLog.inward_vehicle_temp_photo : `/${selectedDetailLog.inward_vehicle_temp_photo}`} alt="Vehicle Temp" />
                            </div>
                            <div className="profile-photo-label">Vehicle Temp</div>
                          </div>
                        )}
                        {selectedDetailLog.inward_material_temp_photo && (
                          <div className="profile-photo-card" onClick={() => setLightboxImg(selectedDetailLog.inward_material_temp_photo.startsWith('data:') ? selectedDetailLog.inward_material_temp_photo : `/${selectedDetailLog.inward_material_temp_photo}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={selectedDetailLog.inward_material_temp_photo.startsWith('data:') ? selectedDetailLog.inward_material_temp_photo : `/${selectedDetailLog.inward_material_temp_photo}`} alt="Material Temp" />
                            </div>
                            <div className="profile-photo-label">Material Temp</div>
                          </div>
                        )}
                        {selectedDetailLog.inward_vehicle_back_side_photo && (
                          <div className="profile-photo-card" onClick={() => setLightboxImg(selectedDetailLog.inward_vehicle_back_side_photo.startsWith('data:') ? selectedDetailLog.inward_vehicle_back_side_photo : `/${selectedDetailLog.inward_vehicle_back_side_photo}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={selectedDetailLog.inward_vehicle_back_side_photo.startsWith('data:') ? selectedDetailLog.inward_vehicle_back_side_photo : `/${selectedDetailLog.inward_vehicle_back_side_photo}`} alt="Vehicle Back" />
                            </div>
                            <div className="profile-photo-label">Vehicle Back</div>
                          </div>
                        )}
                        {selectedDetailLog.inward_vehicle_back_side_photo_with_material && (
                          <div className="profile-photo-card" onClick={() => setLightboxImg(selectedDetailLog.inward_vehicle_back_side_photo_with_material.startsWith('data:') ? selectedDetailLog.inward_vehicle_back_side_photo_with_material : `/${selectedDetailLog.inward_vehicle_back_side_photo_with_material}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={selectedDetailLog.inward_vehicle_back_side_photo_with_material.startsWith('data:') ? selectedDetailLog.inward_vehicle_back_side_photo_with_material : `/${selectedDetailLog.inward_vehicle_back_side_photo_with_material}`} alt="Vehicle Back Load" />
                            </div>
                            <div className="profile-photo-label">Vehicle Loaded</div>
                          </div>
                        )}
                        {selectedDetailLog.inward_count_sheet_photo && selectedDetailLog.inward_count_sheet_photo.split(',').map((p) => p.trim()).filter(Boolean).map((img, idx, arr) => (
                          <div key={`dics-${idx}`} className="profile-photo-card" onClick={() => setLightboxImg(img.startsWith('data:') ? img : `/${img}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={img.startsWith('data:') ? img : `/${img}`} alt={`Count Sheet ${idx + 1}`} />
                            </div>
                            <div className="profile-photo-label">{arr.length === 1 ? 'Count Sheet' : `Count Sheet #${idx + 1}`}</div>
                          </div>
                        ))}
                        {selectedDetailLog.inward_damage_boxes_photo && selectedDetailLog.inward_damage_boxes_photo.split(',').map((dmgImg, idx) => (
                          <div key={idx} className="profile-photo-card" onClick={() => setLightboxImg(dmgImg.startsWith('data:') ? dmgImg : `/${dmgImg}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={dmgImg.startsWith('data:') ? dmgImg : `/${dmgImg}`} alt={`Damage ${idx + 1}`} />
                            </div>
                            <div className="profile-photo-label">Damage #{idx + 1}</div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Render Outward Logs Photos */}
                    {detailType === 'outward' && (
                      <>
                        {selectedDetailLog.outward_invoice_photos && selectedDetailLog.outward_invoice_photos.split(',').map((p) => p.trim()).filter(Boolean).map((img, idx, arr) => (
                          <div key={`doinv-${idx}`} className="profile-photo-card" onClick={() => setLightboxImg(img.startsWith('data:') ? img : `/${img}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={img.startsWith('data:') ? img : `/${img}`} alt={`Invoice ${idx + 1}`} />
                            </div>
                            <div className="profile-photo-label">{arr.length === 1 ? 'Invoice Photo' : `Invoice #${idx + 1}`}</div>
                          </div>
                        ))}
                        {selectedDetailLog.outward_pod_photo && (
                          <div className="profile-photo-card" onClick={() => setLightboxImg(selectedDetailLog.outward_pod_photo.startsWith('data:') ? selectedDetailLog.outward_pod_photo : `/${selectedDetailLog.outward_pod_photo}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={selectedDetailLog.outward_pod_photo.startsWith('data:') ? selectedDetailLog.outward_pod_photo : `/${selectedDetailLog.outward_pod_photo}`} alt="POD" />
                            </div>
                            <div className="profile-photo-label">POD Photo</div>
                          </div>
                        )}
                        {selectedDetailLog.outward_vehicle_seal_photo && (
                          <div className="profile-photo-card" onClick={() => setLightboxImg(selectedDetailLog.outward_vehicle_seal_photo.startsWith('data:') ? selectedDetailLog.outward_vehicle_seal_photo : `/${selectedDetailLog.outward_vehicle_seal_photo}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={selectedDetailLog.outward_vehicle_seal_photo.startsWith('data:') ? selectedDetailLog.outward_vehicle_seal_photo : `/${selectedDetailLog.outward_vehicle_seal_photo}`} alt="Vehicle Seal" />
                            </div>
                            <div className="profile-photo-label">Vehicle Seal</div>
                          </div>
                        )}
                        {selectedDetailLog.outward_pre_vehicle_temp_photo && (
                          <div className="profile-photo-card" onClick={() => setLightboxImg(selectedDetailLog.outward_pre_vehicle_temp_photo.startsWith('data:') ? selectedDetailLog.outward_pre_vehicle_temp_photo : `/${selectedDetailLog.outward_pre_vehicle_temp_photo}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={selectedDetailLog.outward_pre_vehicle_temp_photo.startsWith('data:') ? selectedDetailLog.outward_pre_vehicle_temp_photo : `/${selectedDetailLog.outward_pre_vehicle_temp_photo}`} alt="Pre vehicle temp" />
                            </div>
                            <div className="profile-photo-label">Pre-Cooling Temp</div>
                          </div>
                        )}
                        {selectedDetailLog.outward_vehicle_temp_photo && (
                          <div className="profile-photo-card" onClick={() => setLightboxImg(selectedDetailLog.outward_vehicle_temp_photo.startsWith('data:') ? selectedDetailLog.outward_vehicle_temp_photo : `/${selectedDetailLog.outward_vehicle_temp_photo}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={selectedDetailLog.outward_vehicle_temp_photo.startsWith('data:') ? selectedDetailLog.outward_vehicle_temp_photo : `/${selectedDetailLog.outward_vehicle_temp_photo}`} alt="Vehicle Temp" />
                            </div>
                            <div className="profile-photo-label">Vehicle Temp</div>
                          </div>
                        )}
                        {selectedDetailLog.outward_material_temp_photo && (
                          <div className="profile-photo-card" onClick={() => setLightboxImg(selectedDetailLog.outward_material_temp_photo.startsWith('data:') ? selectedDetailLog.outward_material_temp_photo : `/${selectedDetailLog.outward_material_temp_photo}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={selectedDetailLog.outward_material_temp_photo.startsWith('data:') ? selectedDetailLog.outward_material_temp_photo : `/${selectedDetailLog.outward_material_temp_photo}`} alt="Material Temp" />
                            </div>
                            <div className="profile-photo-label">Material Temp</div>
                          </div>
                        )}
                        {selectedDetailLog.outward_vehicle_back_side_photo && (
                          <div className="profile-photo-card" onClick={() => setLightboxImg(selectedDetailLog.outward_vehicle_back_side_photo.startsWith('data:') ? selectedDetailLog.outward_vehicle_back_side_photo : `/${selectedDetailLog.outward_vehicle_back_side_photo}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={selectedDetailLog.outward_vehicle_back_side_photo.startsWith('data:') ? selectedDetailLog.outward_vehicle_back_side_photo : `/${selectedDetailLog.outward_vehicle_back_side_photo}`} alt="Vehicle Back" />
                            </div>
                            <div className="profile-photo-label">Vehicle Back</div>
                          </div>
                        )}
                        {selectedDetailLog.outward_vehicle_back_side_photo_with_material && (
                          <div className="profile-photo-card" onClick={() => setLightboxImg(selectedDetailLog.outward_vehicle_back_side_photo_with_material.startsWith('data:') ? selectedDetailLog.outward_vehicle_back_side_photo_with_material : `/${selectedDetailLog.outward_vehicle_back_side_photo_with_material}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={selectedDetailLog.outward_vehicle_back_side_photo_with_material.startsWith('data:') ? selectedDetailLog.outward_vehicle_back_side_photo_with_material : `/${selectedDetailLog.outward_vehicle_back_side_photo_with_material}`} alt="Vehicle Back Load" />
                            </div>
                            <div className="profile-photo-label">Vehicle Loaded</div>
                          </div>
                        )}
                        {selectedDetailLog.outward_count_sheet_photo && selectedDetailLog.outward_count_sheet_photo.split(',').map((p) => p.trim()).filter(Boolean).map((img, idx, arr) => (
                          <div key={`docs-${idx}`} className="profile-photo-card" onClick={() => setLightboxImg(img.startsWith('data:') ? img : `/${img}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={img.startsWith('data:') ? img : `/${img}`} alt={`Count Sheet ${idx + 1}`} />
                            </div>
                            <div className="profile-photo-label">{arr.length === 1 ? 'Count Sheet' : `Count Sheet #${idx + 1}`}</div>
                          </div>
                        ))}
                        {selectedDetailLog.outward_damage_boxes_photo && selectedDetailLog.outward_damage_boxes_photo.split(',').map((dmgImg, idx) => (
                          <div key={idx} className="profile-photo-card" onClick={() => setLightboxImg(dmgImg.startsWith('data:') ? dmgImg : `/${dmgImg}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={dmgImg.startsWith('data:') ? dmgImg : `/${dmgImg}`} alt={`Damage ${idx + 1}`} />
                            </div>
                            <div className="profile-photo-label">Damage #{idx + 1}</div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: 'var(--bg-main)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                    No audit attachment photos uploaded for this record.
                  </div>
                )}
              </div>
            </div>

            <div className="profile-modal-footer">
              <button className="profile-close-btn" onClick={() => {
                setSelectedDetailLog(null);
                setRecordAllowHistory([]);
              }}>Close View</button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox View Modal with absolute positioned controls */}
      {lightboxImg && (
        <div 
          className="lightbox-overlay" 
          onClick={() => setLightboxImg(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            animation: 'fadeIn 0.22s ease'
          }}
        >
          {/* Absolute Floating Controls Header */}
          <div 
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              display: 'flex',
              gap: '12px',
              zIndex: 100000,
              pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Download Button */}
            <a 
              href={lightboxImg && lightboxImg.includes('res.cloudinary.com') ? lightboxImg.replace('/upload/', '/upload/fl_attachment/') : lightboxImg} 
              download={`Audit_Attachment_${new Date().getTime()}.png`}
              title="Download Photo"
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                borderRadius: 'var(--radius-sm)',
                fontWeight: '700',
                fontSize: '0.84rem',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(0, 162, 232, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Download size={16} />
              <span>Download Photo</span>
            </a>

            {/* Close Button */}
            <button 
              onClick={() => setLightboxImg(null)}
              style={{
                padding: '10px 18px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '0.84rem',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
                transition: 'all 0.2s'
              }}
              title="Close View"
            >
              <X size={16} />
              <span>Close</span>
            </button>
          </div>

          {/* Image Wrapper */}
          <div 
            className="lightbox-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'transparent',
              boxShadow: 'none',
              border: 'none',
              padding: 0
            }}
          >
            <img 
              src={lightboxImg} 
              alt="Enlarged Audit Attachment" 
              style={{
                display: 'block',
                maxWidth: '95vw',
                maxHeight: '85vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                border: '4px solid rgba(255,255,255,0.1)'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

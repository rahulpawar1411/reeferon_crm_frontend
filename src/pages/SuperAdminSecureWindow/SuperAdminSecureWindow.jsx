// ====================================================================
// Super Admin Secure Window Component (src/pages/SuperAdminSecureWindow/SuperAdminSecureWindow.jsx)
// Paired with: src/pages/SuperAdminSecureWindow/SuperAdminSecureWindow.css
// Strictly accessible by role: 'super_admin' only.
// ====================================================================

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { 
  ShieldCheck, Clock, LogOut, Database, Lock,
  Thermometer, Trash2, Edit, UserPlus, ShieldAlert,
  Menu, X, ChevronRight, User, Eye, EyeOff, Activity, Search, Download, History, LayoutDashboard,
  Copy, Check, Loader2, CheckCircle, MessageSquareWarning, Smartphone, Package, Users, LayoutGrid
} from 'lucide-react';
import Logo from '../../components/Logo/Logo';
import PaginationBar from '../../components/PaginationBar/PaginationBar';
import { 
  fetchOperators, createOperator, updateOperator, deleteOperator, fetchOperatorActivities,
  fetchAllOperatorActivities,
  fetchPermissionRequests, updatePermissionRequest, fetchSystemConfig, updateSystemConfig,
  fetchChamberLogs, fetchInwardLogs, fetchOutwardLogs, fetchDashboardStats,
  fetchAllChamberLogs, fetchAllInwardLogs, fetchAllOutwardLogs,
  deleteChamberLog, deleteInwardLog, deleteOutwardLog,
  toApiDateParam,
  fetchSubAdmins, createSubAdmin, updateSubAdmin, deleteSubAdmin, fetchAccessScopeOptions,
  changeSuperAdminPassword, verifySuperAdminProfileAccess,
  fetchCustomerReports, updateCustomerReportStatus,
  fetchDailyInspections, deleteDailyInspection,
  fetchInventoryReconciliation, fetchDailyInventoryDeltas
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
import '../../components/DOSidebar/DOSidebar.css';
import './SuperAdminSecureWindow.css';

const TempMonitor = lazy(() => import('../TempMonitor/TempMonitor'));
const InwardMonitor = lazy(() => import('../InwardMonitor/InwardMonitor'));
const OutwardMonitor = lazy(() => import('../OutwardMonitor/OutwardMonitor'));

export default function SuperAdminSecureWindow({ user, onLogout, onUserUpdate }) {
  const [time, setTime] = useState(new Date());
  const [activeMenu, setActiveMenu] = useState(() => {
    return localStorage.getItem('super_admin_active_menu') || 'dashboard';
  });
  const [auditSubTab, setAuditSubTab] = useState(() => {
    return localStorage.getItem('super_admin_audit_sub_tab') || 'activity_log';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('super_admin_active_menu', activeMenu);
  }, [activeMenu]);

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
  const [logsSearch, setLogsSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');
  const [selectedDetailLog, setSelectedDetailLog] = useState(null);
  const [detailType, setDetailType] = useState('');
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

  // Native Mobile Daily Inspections States
  const [inspections, setInspections] = useState([]);
  const [loadingInspections, setLoadingInspections] = useState(false);
  const [inspectionsError, setInspectionsError] = useState('');
  const [inspectionsSearch, setInspectionsSearch] = useState('');

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

  // Daily Box Tracker States
  const [dailyDeltas, setDailyDeltas] = useState([]);
  const [loadingDeltas, setLoadingDeltas] = useState(false);
  const [deltasError, setDeltasError] = useState('');
  const [deltasSearch, setDeltasSearch] = useState('');
  const [deltasWarehouseFilter, setDeltasWarehouseFilter] = useState('All');
  const [deltasCurrentPage, setDeltasCurrentPage] = useState(1);
  const [deltasPerPage] = useState(10);

  const loadDailyInventoryDeltas = async () => {
    setLoadingDeltas(true);
    setDeltasError('');
    try {
      const data = await fetchDailyInventoryDeltas({
        warehouse: deltasWarehouseFilter === 'All' ? '' : deltasWarehouseFilter
      });
      setDailyDeltas(Array.isArray(data) ? data : []);
      setDeltasCurrentPage(1);
    } catch (err) {
      console.error('Failed to fetch daily deltas:', err);
      setDeltasError(err.message || 'Failed to fetch daily inventory comparison logs.');
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


  // Sub-Admins Management States
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
  const [accessScopeOptions, setAccessScopeOptions] = useState({ clients: [], warehouses: [] });
  const [subAdminSelectedClients, setSubAdminSelectedClients] = useState([]);
  const [subAdminSelectedWarehouses, setSubAdminSelectedWarehouses] = useState([]);

  // Customer Reports (from Sub Admin portal → customer_reports table)
  const [customerReports, setCustomerReports] = useState([]);
  const [loadingCustomerReports, setLoadingCustomerReports] = useState(false);
  const [customerReportsError, setCustomerReportsError] = useState('');
  const [customerReportSearch, setCustomerReportSearch] = useState('');
  const [customerReportStatusFilter, setCustomerReportStatusFilter] = useState('All');
  const [updatingReportId, setUpdatingReportId] = useState(null);

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

  const loadDailyInspectionsData = async () => {
    setLoadingInspections(true);
    setInspectionsError('');
    try {
      const data = await fetchDailyInspections();
      setInspections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch native daily inspections:', err);
      setInspectionsError(err.message || 'Failed to fetch native daily inspections.');
      setInspections([]);
    } finally {
      setLoadingInspections(false);
    }
  };

  const handleDeleteDailyInspection = async (id) => {
    if (!window.confirm('Are you sure you want to delete this daily inspection log?')) {
      return;
    }
    setInspectionsError('');
    try {
      await deleteDailyInspection(id);
      await loadDailyInspectionsData();
    } catch (err) {
      setInspectionsError(err.message || 'Failed to delete inspection log.');
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
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleApproveDenyPermission = async (id, status) => {
    setLogsError('');
    try {
      const res = await updatePermissionRequest(id, status);
      loadPermissionRequests();
      loadActivities();
    } catch (err) {
      console.error('Failed to update permission request:', err);
      setLogsError(err.message || 'Failed to update permission request.');
    }
  };

  const [systemConfig, setSystemConfig] = useState({
    Chamber_Edit: 'Require Approval',
    Chamber_Delete: 'Require Approval',
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
      info.module = 'Inward DO Log';
    } else if (descText.includes('Outward')) {
      info.module = 'Outward DO Log';
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
    } else {
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
    } else if (activeMenu === 'sub_admins') {
      loadSubAdminsData();
      loadAccessScopeOptions();
    } else if (activeMenu === 'customer_reports') {
      loadCustomerReportsData();
    } else if (activeMenu === 'data_operators') {
      loadOperatorsData();
    } else if (activeMenu === 'activity_logs') {
      loadOperatorsData();
      loadPermissionRequests();
      loadSystemConfig();
    } else if (activeMenu === 'history_logs' || activeMenu === 'profile_lookup') {
      loadOperatorsData();
    } else if (activeMenu === 'native_inspections') {
      loadDailyInspectionsData();
    } else if (activeMenu === 'inventory_log') {
      loadOperatorsData();
      loadInventoryReconciliationData();
    } else if (activeMenu === 'daily_box_tracker') {
      loadDailyInventoryDeltas();
    }
  }, [activeMenu]);

  useEffect(() => {
    if (activeMenu !== 'daily_box_tracker') return;
    loadDailyInventoryDeltas();
  }, [activeMenu, deltasWarehouseFilter]);

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
      } else {
        setSearchedRecord(null);
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
        'Warehouse',
        'Data Access Scope',
        'Registration Date'
      ];
      csvContent += headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';

      list.forEach((op) => {
        const warehouse = op.warehouse_name || 'Not Configured';
        const accessScope = op.warehouse_name
          ? `Access: ${op.warehouse_name} Logs Only`
          : 'Access: All Warehouses';
        const registered = op.created_at
          ? new Date(op.created_at).toLocaleDateString('en-GB')
          : '-';
        const row = [
          op.id ?? '-',
          op.full_name || '-',
          op.phone_no || '-',
          op.email || '-',
          warehouse,
          accessScope,
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
    try {
      // Use dates currently selected in the filters (not only after Find)
      const { from, to } = requireExportDates(fromDate, toDate);
      setAppliedFromDate(fromDate);
      setAppliedToDate(toDate);
      setAppliedLogsSearch(logsSearch);

      const exportParams = {
        search: logsSearch,
        fromDate: from,
        toDate: to,
        warehouse: selectedWarehouse !== 'All' ? selectedWarehouse : undefined
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

    let csvContent = "\uFEFF"; // UTF-8 BOM for correct Excel character loading

    if (historyTab === 'daily') {
      const headers = ["Date", "Warehouse", "Operator Email", "Chamber", "Client Name", "Inspection Time", "Temperature (°C)", "Supervisor"];
      csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";

      filteredLogs.forEach(log => {
        const row = [
          log.formatted_date || (log.entry_date ? log.entry_date.split('T')[0] : ''),
          log.warehouse_name || 'Generic',
          log.operator_email || '-',
          log.chamber_name || '',
          log.client_name || '',
          log.inspection_time || '',
          log.chamber_temp !== undefined ? `${log.chamber_temp}°C` : '',
          log.monitor_supervisor_name || ''
        ];
        csvContent += row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",") + "\n";
      });
    } else if (historyTab === 'inward') {
      const headers = [
        "Date", "Warehouse", "Operator Email", "Vehicle No", "Seal No", "Client", "Transporter", "Driver Name", "Driver Contact", "Dock No", 
        "Reporting Time", "Vehicle Temp (°C)", "Material Temp (°C)", "Material Type", "Pallets Qty", 
        "Invoice Qty", "Received Pallets", "Received Boxes", "Short Boxes", "Excess Boxes", "Damage Boxes", 
        "Unloading Start", "Unloading End", "Unloading Duration", "Supervisor", "Remarks"
      ];
      csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";

      filteredLogs.forEach(log => {
        const row = [
          log.inward_entry_date ? log.inward_entry_date.split('T')[0] : '',
          log.warehouse_name || 'Generic',
          log.operator_email || '-',
          log.inward_vehicle_no || '',
          log.inward_seal_no || '',
          log.inward_client_name || '',
          log.inward_transporter_name || '',
          log.inward_driver_name || '',
          log.inward_driver_no || '',
          log.inward_dock_no || '',
          log.inward_vehicle_reporting_time || '',
          log.inward_vehicle_temp !== undefined ? `${log.inward_vehicle_temp}°C` : '',
          log.inward_material_temp !== undefined ? `${log.inward_material_temp}°C` : '',
          log.inward_material_type || '',
          log.inward_pallets_in_qty || 0,
          log.inward_invoice_qty || 0,
          log.inward_received_qty || 0,
          log.inward_received_boxes_qty || 0,
          log.inward_short_received_boxes_qty || 0,
          log.inward_excess_received_boxes_qty || 0,
          log.inward_damage_received_boxes_qty || 0,
          log.inward_unloading_start_time || '',
          log.inward_unloading_end_time || '',
          formatDuration(log.inward_unloading_duration_hours, log.inward_unloading_duration_mins),
          log.inward_unloading_supervisor_name || '',
          log.inward_remarks || ''
        ];
        csvContent += row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",") + "\n";
      });
    } else if (historyTab === 'outward') {
      const headers = [
        "Date", "Warehouse", "Operator Email", "Vehicle No", "Seal No", "Client", "Transporter", "Driver Name", "Driver Contact", "Dock No", 
        "Reporting Time", "Vehicle Temp (°C)", "Material Temp (°C)", "Material Type", "Pallets Qty", 
        "Invoice Qty", "Loaded Pallets", "Loaded Boxes", "Short Loaded Boxes", "Excess Loaded Boxes", "Damage Boxes", 
        "Loading Start", "Loading End", "Loading Duration", "Supervisor", "Remarks"
      ];
      csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";

      filteredLogs.forEach(log => {
        const row = [
          log.outward_entry_date ? log.outward_entry_date.split('T')[0] : '',
          log.warehouse_name || 'Generic',
          log.operator_email || '-',
          log.outward_vehicle_no || '',
          log.outward_seal_no || '',
          log.outward_client_name || '',
          log.outward_transporter_name || '',
          log.outward_driver_name || '',
          log.outward_driver_no || '',
          log.outward_dock_no || '',
          log.outward_vehicle_reporting_time || '',
          log.outward_vehicle_temp !== undefined ? `${log.outward_vehicle_temp}°C` : '',
          log.outward_material_temp !== undefined ? `${log.outward_material_temp}°C` : '',
          log.outward_material_type || '',
          log.outward_pallets_in_qty || 0,
          log.outward_invoice_qty || 0,
          log.outward_received_qty || 0,
          log.outward_received_boxes_qty || 0,
          log.outward_short_received_boxes_qty || 0,
          log.outward_excess_received_boxes_qty || 0,
          log.outward_damage_received_boxes_qty || 0,
          log.outward_loading_start_time || '',
          log.outward_loading_end_time || '',
          formatDuration(log.outward_loading_duration_hours, log.outward_loading_duration_mins),
          log.outward_loading_supervisor_name || '',
          log.outward_remarks || ''
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
      setOpError('All fields (Full Name, Phone No., Email ID, Warehouse Name) are required.');
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
        warehouse_name: opWarehouseName,
        chamber_limit: opChamberLimit
      };

      if (editingOp) {
        setOpProcessStatus('Updating operator profile…');
        await updateOperator(editingOp.id, payload);
        setOpSuccess('Operator profile updated successfully.');
      } else {
        setOpProcessStatus('Creating operator account…');
        // Yield so overlay paints before the network/email wait
        await new Promise((r) => setTimeout(r, 50));
        setOpProcessStatus('Creating account & sending credentials email…');
        const created = await createOperator(payload);
        if (created?.emailSent) {
          setOpProcessStatus('Email sent successfully.');
          setOpSuccess('Data operator registered. Login credentials emailed successfully.');
        } else if (created?.emailSkipped) {
          setOpSuccess(
            created?.emailError
              || 'Data operator registered. Email skipped — set RESEND_API_KEY in backend .env and restart server.'
          );
        } else {
          setOpSuccess(
            `Data operator registered, but email failed${created?.emailError ? `: ${created.emailError}` : '.'}`
          );
        }
      }

      cancelEditOperator();
      loadOperatorsData();
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

  // Sub-Admins CRUD handlers
  const loadSubAdminsData = async () => {
    setLoadingSubAdmins(true);
    setSubAdminError('');
    try {
      const data = await fetchSubAdmins();
      setSubAdmins(data || []);
    } catch (err) {
      setSubAdminError(err.message || 'Failed to fetch sub-admins.');
    } finally {
      setLoadingSubAdmins(false);
    }
  };

  const loadAccessScopeOptions = async () => {
    try {
      const data = await fetchAccessScopeOptions();
      setAccessScopeOptions(data || { clients: [], warehouses: [] });
    } catch (err) {
      console.error('Failed to load access scope options:', err);
    }
  };

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
        setSubAdminProcessStatus('Updating Sub-Admin profile…');
        await updateSubAdmin(editingSubAdmin.id, payload);
        setSubAdminSuccess('Sub-Admin profile updated successfully.');
      } else {
        setSubAdminProcessStatus('Creating Sub-Admin account…');
        await new Promise((r) => setTimeout(r, 50));
        setSubAdminProcessStatus('Creating account & sending credentials email…');
        const created = await createSubAdmin(payload);
        if (created?.emailSent) {
          setSubAdminProcessStatus('Email sent successfully.');
          setSubAdminSuccess('Sub-Admin registered. Login credentials emailed successfully.');
        } else if (created?.emailSkipped) {
          setSubAdminSuccess(
            created?.emailError
              || 'Sub-Admin registered. Email skipped — set RESEND_API_KEY in backend .env and restart server.'
          );
        } else {
          setSubAdminSuccess(
            `Sub-Admin registered, but email failed${created?.emailError ? `: ${created.emailError}` : '.'}`
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
    if (!window.confirm('Are you sure you want to revoke workspace access for this sub-admin?')) {
      return;
    }
    setSubAdminError('');
    setSubAdminSuccess('');
    try {
      await deleteSubAdmin(id);
      setSubAdminSuccess('Sub-Admin credentials deleted successfully.');
      loadSubAdminsData();
      loadDashboardStatsData();
      if (editingSubAdmin && editingSubAdmin.id === id) {
        cancelEditSubAdmin();
      }
    } catch (err) {
      setSubAdminError(err.message || 'Failed to delete sub-admin.');
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

  const hasPendingRequests = permissionRequests.some(pr => pr.status === 'Pending');

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
              className={`clean-menu-item ${activeMenu === 'data_operators' ? 'active' : ''}`}
              onClick={() => setActiveMenu('data_operators')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Thermometer size={18} />
                <span>Data Operators</span>
              </div>
            </button>

            <button 
              className={`clean-menu-item ${activeMenu === 'sub_admins' ? 'active' : ''}`}
              onClick={() => setActiveMenu('sub_admins')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeMenu === 'sub_admins' ? 'var(--primary-light)' : 'transparent',
                color: activeMenu === 'sub_admins' ? 'var(--primary)' : 'var(--text-dark)',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={18} />
                <span>Sub-Admins</span>
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
              onClick={() => setActiveMenu('activity_logs')}
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
              className={`clean-menu-item ${activeMenu === 'native_inspections' ? 'active' : ''}`}
              onClick={() => setActiveMenu('native_inspections')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeMenu === 'native_inspections' ? 'var(--primary-light)' : 'transparent',
                color: activeMenu === 'native_inspections' ? 'var(--primary)' : 'var(--text-dark)',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Smartphone size={18} />
                <span>Native App Logs</span>
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

        {/* Center section: Super Administrator & Time (Centered) */}
        <div className="secure-header-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', textAlign: 'center' }}>
          <span className="secure-role-tag" style={{ margin: 0 }}>
            {activeMenu === 'dashboard'
              ? 'Super Admin - Control Dashboard'
              : activeMenu === 'sub_admins'
                ? 'Super Admin - Sub-Admin Profiles'
                : activeMenu === 'customer_reports'
                  ? 'Super Admin - Customer Reports'
                : activeMenu === 'data_operators' 
                  ? 'Super Admin - Operator Profiles' 
                  : activeMenu === 'history_logs' 
                    ? 'Super Admin - History Logs' 
                    : activeMenu === 'activity_logs'
                      ? 'Super Admin - Operator Activities'
                      : activeMenu === 'profile_lookup'
                        ? 'Super Admin - Profile Lookup'
                        : activeMenu === 'native_inspections'
                          ? 'Super Admin - Native App Logs'
                        : activeMenu === 'inventory_log'
                          ? 'Super Admin - Inventory Reconciliation'
                        : activeMenu === 'super_admin_profile'
                          ? 'Super Admin - Profile & Security'
                          : 'Super Administrator'}
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
              className={`clean-menu-item ${activeMenu === 'sub_admins' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('sub_admins');
                setIsMobileMenuOpen(false);
              }}
            >
              <div className="item-left">
                <ShieldCheck size={18} className="item-icon" />
                <span>Sub-Admins</span>
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
              className={`clean-menu-item ${activeMenu === 'native_inspections' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('native_inspections');
                setIsMobileMenuOpen(false);
              }}
            >
              <div className="item-left">
                <Smartphone size={18} className="item-icon" />
                <span>Native App Logs</span>
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

              {/* Card 3: Customers (Sub-Admins) */}
              <div className="diagnostic-card" style={{ padding: '12px 16px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customers</span>
                  <div style={{ backgroundColor: '#fee2e2', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
                    <ShieldCheck size={16} color="#dc2626" />
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, color: 'var(--text-dark)' }}>{subAdmins.length}</h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Registered Customers (Sub-Admins)</span>
                </div>
              </div>
            </div>

            {/* Operational Shortcuts */}
            <div className="diagnostic-card" style={{ padding: '16px 20px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Operational Shortcuts</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <button 
                  onClick={() => setActiveMenu('data_operators')}
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
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                  className="dashboard-shortcut-btn"
                >
                  <Activity size={16} color="var(--primary)" />
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



        {activeMenu === 'native_inspections' && (
          <div className="diagnostics-card" style={{ padding: '24px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Header section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
                  Native App Daily Inspections
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Monitor and manage daily chamber temperature logs submitted from the mobile native application.
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={loadDailyInspectionsData}
                  disabled={loadingInspections}
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
                  <Activity size={14} className={loadingInspections ? 'spin' : ''} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {inspectionsError && (
              <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 'var(--radius-sm)', color: '#ef4444', fontSize: '0.8rem', fontWeight: '700' }}>
                {inspectionsError}
              </div>
            )}

            {/* Filter / Search bar */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '240px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>Search Logs</label>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search by operator, chamber, or client..."
                    value={inspectionsSearch}
                    onChange={(e) => setInspectionsSearch(e.target.value)}
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
            </div>

            {/* Inspections Table */}
            {loadingInspections ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <span>Loading daily inspections...</span>
              </div>
            ) : inspections.length === 0 ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <span>No inspections logged yet from the native application.</span>
              </div>
            ) : (
              <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <table className="logs-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px 16px' }}>Date & Time</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px' }}>Chamber</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px' }}>Client</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px' }}>Temp</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px' }}>Operator</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px' }}>Photo</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspections
                      .filter((insp) => {
                        const term = inspectionsSearch.toLowerCase().trim();
                        if (!term) return true;
                        return (
                          (insp.operator_name && insp.operator_name.toLowerCase().includes(term)) ||
                          (insp.chamber_name && insp.chamber_name.toLowerCase().includes(term)) ||
                          (insp.client_name && insp.client_name.toLowerCase().includes(term))
                        );
                      })
                      .map((insp) => {
                        const formattedDate = insp.entry_date ? new Date(insp.entry_date).toLocaleDateString('en-GB') : '-';
                        const formattedTime = insp.inspection_time || '-';
                        const photoUrl = insp.photo_url
                          ? (insp.photo_url.startsWith('uploads') ? `/${insp.photo_url}` : insp.photo_url)
                          : null;

                        return (
                          <tr key={insp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-dark)', fontWeight: '600' }}>
                              {formattedDate} <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginLeft: '6px' }}>{formattedTime}</span>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-dark)', fontWeight: '700' }}>
                              {insp.chamber_name || `Chamber #${insp.chamber_id}`}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-dark)' }}>
                              {insp.client_name}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-dark)', fontWeight: '700' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: insp.temperature > 0 ? '#fee2e2' : '#e0f2fe',
                                color: insp.temperature > 0 ? '#ef4444' : '#0284c7'
                              }}>
                                {insp.temperature}°C
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-dark)' }}>
                              {insp.operator_name}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              {photoUrl ? (
                                <div 
                                  onClick={() => setLightboxImg(photoUrl)}
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: 'var(--radius-sm)',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    border: '1px solid var(--border)',
                                    display: 'inline-block'
                                  }}
                                >
                                  <img 
                                    src={photoUrl} 
                                    alt="Sensor reading" 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                  />
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>No Photo</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDetailLog(insp);
                                    setDetailType('daily');
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
                                </button>
                                <button
                                  onClick={() => handleDeleteDailyInspection(insp.id)}
                                  style={{
                                    padding: '6px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    transition: 'color 0.2s'
                                  }}
                                  title="Delete Log"
                                >
                                  <Trash2 size={16} />
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
                  <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 'var(--radius-sm)', color: '#ef4444', fontSize: '0.8rem', fontWeight: '700' }}>
                    {inventoryError}
                  </div>
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
          const filtered = dailyDeltas.filter(row => {
            if (!row.client_name) return false;
            if (deltasSearch.trim() !== '') {
              return row.client_name.toLowerCase().includes(deltasSearch.toLowerCase());
            }
            return true;
          });

          const handleExportDeltasCSV = () => {
            if (!filtered || filtered.length === 0) return;
            const headers = 'Client Name,Warehouse Name,Chamber Name,Previous Audit Date,Previous Box Count,Latest Audit Date,Latest Box Count,Change (Delta),Trend Status\n';
            const csvContent = headers + filtered.map(row => {
              const prevDate = row.prev_date ? new Date(row.prev_date).toLocaleDateString('en-GB') : '-';
              const latestDate = row.latest_date ? new Date(row.latest_date).toLocaleDateString('en-GB') : '-';
              const trend = row.delta > 0 ? 'Inward Increase' : row.delta < 0 ? 'Outward Decrease' : 'No Change';
              return `"${row.client_name || '-'}","${row.warehouse_name || '-'}","${row.chamber_name || '-'}","${prevDate}",${row.prev_count},"${latestDate}",${row.latest_count},${row.delta},"${trend}"`;
            }).join('\n');
            downloadCsv(`ReeferON_DailyBoxDeltas_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
          };

          const chartData = filtered.slice(0, 8);
          const maxVal = Math.max(...chartData.map(d => Math.max(d.latest_count, d.prev_count)), 10);

          const startIndex = (deltasCurrentPage - 1) * deltasPerPage;
          const endIndex = startIndex + deltasPerPage;
          const paginatedRows = filtered.slice(startIndex, endIndex);

          return (
            <div className="diagnostics-card" style={{ padding: '24px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Header section */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
                    Daily Box Inventory Tracker
                  </h2>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    Track and visualize daily changes in client box counts across physical inspections.
                  </p>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleExportDeltasCSV}
                    disabled={filtered.length === 0}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '0.8rem',
                      cursor: filtered.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: filtered.length === 0 ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Download size={14} />
                    Export CSV
                  </button>

                  <button
                    onClick={loadDailyInventoryDeltas}
                    disabled={loadingDeltas}
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
                    <Activity size={14} className={loadingDeltas ? 'spin' : ''} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Error Banner */}
              {deltasError && (
                <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 'var(--radius-sm)', color: '#ef4444', fontSize: '0.8rem', fontWeight: '700' }}>
                  {deltasError}
                </div>
              )}

              {/* Top Filter and Search Bar */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Warehouse Filter */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '220px' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Filter by Warehouse
                  </label>
                  <select
                    value={deltasWarehouseFilter}
                    onChange={(e) => {
                      setDeltasWarehouseFilter(e.target.value);
                      setDeltasCurrentPage(1);
                    }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      fontSize: '0.82rem',
                      outline: 'none',
                      backgroundColor: 'var(--bg-main)',
                      color: 'var(--text-dark)',
                      cursor: 'pointer',
                      fontWeight: '700',
                      width: '100%'
                    }}
                  >
                    <option value="All">All Warehouses</option>
                    {warehousesList.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>

                {/* Client Search */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '280px' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Search Client Name
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={14} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search client lot..."
                      value={deltasSearch}
                      onChange={(e) => {
                        setDeltasSearch(e.target.value);
                        setDeltasCurrentPage(1);
                      }}
                      style={{
                        padding: '10px 14px 10px 34px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        fontSize: '0.82rem',
                        outline: 'none',
                        backgroundColor: 'var(--bg-main)',
                        color: 'var(--text-dark)',
                        width: '100%',
                        fontWeight: '600'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Visual Chart Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Chart Card */}
                {chartData.length > 0 ? (
                  <div style={{ 
                    padding: '28px', 
                    background: 'linear-gradient(135deg, var(--surface) 0%, var(--bg-main) 100%)', 
                    borderRadius: 'var(--radius-lg)', 
                    border: '1px solid var(--border)',
                    boxShadow: '0 8px 30px -4px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '3px', height: '16px', backgroundColor: 'var(--primary)', borderRadius: '2px' }} />
                        <span style={{ fontSize: '0.9rem', fontWeight: '850', color: 'var(--text-dark)', letterSpacing: '-0.01em' }}>
                          Client Box Audit Reconciliation Chart
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '0.76rem', fontWeight: '800' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '14px', height: '14px', background: 'linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%)', borderRadius: '4px' }} />
                          <span style={{ color: 'var(--text-muted)' }}>Previous Count</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '14px', height: '14px', background: 'linear-gradient(180deg, var(--primary) 0%, #1d4ed8 100%)', borderRadius: '4px' }} />
                          <span style={{ color: 'var(--text-dark)' }}>Latest Count</span>
                        </div>
                      </div>
                    </div>

                    {/* Chart Grid Wrapper */}
                    <div style={{ 
                      position: 'relative', 
                      height: '240px', 
                      paddingTop: '20px',
                      backgroundImage: 'linear-gradient(to right, rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.08) 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      {/* Horizontal Grid lines */}
                      <div style={{ position: 'absolute', top: '20px', left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                        <div style={{ borderBottom: '1px dashed rgba(148, 163, 184, 0.16)', width: '100%', height: 0 }} />
                        <div style={{ borderBottom: '1px dashed rgba(148, 163, 184, 0.16)', width: '100%', height: 0 }} />
                        <div style={{ borderBottom: '1px dashed rgba(148, 163, 184, 0.16)', width: '100%', height: 0 }} />
                        <div style={{ borderBottom: '1px dashed rgba(148, 163, 184, 0.16)', width: '100%', height: 0 }} />
                        <div style={{ borderBottom: '2px solid var(--border)', width: '100%', height: 0 }} />
                      </div>

                      {/* Bars Container */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: `repeat(${chartData.length}, 1fr)`, 
                        gap: '24px', 
                        height: '100%', 
                        alignItems: 'end',
                        position: 'relative',
                        zIndex: 2
                      }}>
                        {chartData.map((d, index) => {
                          const prevHeight = (d.prev_count / maxVal) * 150;
                          const latestHeight = (d.latest_count / maxVal) * 150;
                          const isGreen = d.delta > 0;
                          const isRed = d.delta < 0;

                          return (
                            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
                              
                              {/* Hoverable Count Indicators */}
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                gap: '6px', 
                                position: 'absolute', 
                                bottom: `${Math.max(prevHeight, latestHeight) + 12}px`, 
                                fontSize: '0.74rem', 
                                fontWeight: '850',
                                backgroundColor: '#1e293b', // Solid dark slate background
                                color: '#ffffff',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                border: '1px solid #334155',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                zIndex: 10
                              }}>
                                <span style={{ color: '#cbd5e1' }} title="Previous Count">{d.prev_count}</span>
                                <span style={{ color: '#64748b', fontSize: '0.65rem' }}>➔</span>
                                <span style={{ color: '#38bdf8', fontWeight: '900' }} title="Latest Count">{d.latest_count}</span>
                              </div>

                              {/* Bars Container */}
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'end', width: '100%', justifyContent: 'center' }}>
                                {/* Previous Bar */}
                                <div 
                                  title={`Previous: ${d.prev_count} boxes`}
                                  style={{ 
                                    width: '18px', 
                                    height: `${Math.max(prevHeight, 4)}px`, 
                                    background: 'linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)', 
                                    borderRadius: '4px 4px 0 0',
                                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: 'pointer'
                                  }} 
                                />
                                {/* Latest Bar */}
                                <div 
                                  title={`Latest: ${d.latest_count} boxes`}
                                  style={{ 
                                    width: '18px', 
                                    height: `${Math.max(latestHeight, 4)}px`, 
                                    background: 'linear-gradient(180deg, var(--primary) 0%, #1d4ed8 100%)', 
                                    borderRadius: '4px 4px 0 0',
                                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15), inset 0 1px 0 rgba(255,255,255,0.3)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: 'pointer'
                                  }} 
                                />
                              </div>

                              {/* Client Name Label */}
                              <div style={{ 
                                marginTop: '10px', 
                                fontSize: '0.74rem', 
                                fontWeight: '800', 
                                color: 'var(--text-dark)', 
                                textAlign: 'center',
                                width: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }} title={d.client_name}>
                                {d.client_name}
                              </div>

                              {/* Delta Pill Tag */}
                              <div style={{
                                fontSize: '0.64rem',
                                fontWeight: '850',
                                color: isGreen ? '#16a34a' : isRed ? '#dc2626' : '#64748b',
                                marginTop: '4px',
                                backgroundColor: isGreen ? '#f0fdf4' : isRed ? '#fef2f2' : '#f8fafc',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                border: `1px solid ${isGreen ? '#dcfce7' : isRed ? '#fee2e2' : '#f1f5f9'}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}>
                                {isGreen ? `▲ +${d.delta}` : isRed ? `▼ ${d.delta}` : `● 0`}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Add temperature audit logs in native app to display comparative metrics.
                  </div>
                )}

                {/* Main Grid Table */}
                <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <table className="logs-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Client Name</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Warehouse</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Chamber Name</th>
                        <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Previous Audit Date</th>
                        <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Previous Count</th>
                        <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>In / Out Flow</th>
                        <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Latest Audit Date</th>
                        <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Final Count (In Chamber)</th>
                        <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Trend Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRows.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                            No records found matching filters.
                          </td>
                        </tr>
                      ) : (
                        paginatedRows.map((row, idx) => {
                          const isGreen = row.delta > 0;
                          const isRed = row.delta < 0;
                          const formattedPrevDate = row.prev_date ? new Date(row.prev_date).toLocaleDateString('en-GB') : '-';
                          const formattedLatestDate = row.latest_date ? new Date(row.latest_date).toLocaleDateString('en-GB') : '-';
                          
                          const absDelta = Math.abs(row.delta);
                          const flowText = row.delta > 0 ? `+${absDelta} In` : row.delta < 0 ? `-${absDelta} Out` : `0`;
                          const flowColor = row.delta > 0 ? '#16a34a' : row.delta < 0 ? '#dc2626' : 'var(--text-muted)';

                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-dark)', fontWeight: '700' }}>
                                {row.client_name}
                              </td>
                              <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {row.warehouse_name}
                              </td>
                              <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {row.chamber_name}
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {formattedPrevDate}
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-dark)' }}>
                                {row.prev_date ? row.prev_count.toLocaleString() : '-'}
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.82rem', fontWeight: '800', color: flowColor }}>
                                {flowText}
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {formattedLatestDate}
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>
                                {row.latest_count.toLocaleString()}
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: 'var(--radius-sm)',
                                  backgroundColor: isGreen ? '#dcfce7' : isRed ? '#fee2e2' : '#f1f5f9',
                                  color: isGreen ? '#15803d' : isRed ? '#b91c1c' : '#475569',
                                  fontWeight: '800',
                                  fontSize: '0.72rem'
                                }}>
                                  {isGreen ? '▲ Inward Increase' : isRed ? '▼ Outward Decrease' : '● No Change'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Bar */}
                {filtered.length > 0 && (
                  <PaginationBar
                    page={deltasCurrentPage}
                    totalItems={filtered.length}
                    pageSize={deltasPerPage}
                    onPageChange={setDeltasCurrentPage}
                    itemLabel="records"
                  />
                )}
              </div>
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
                            <span className="profile-value" style={{ fontWeight: '800', color: 'var(--text-dark)' }}>
                              Changed {Number(searchedRecord.update_count) > 0 ? searchedRecord.update_count : 1} {Number(searchedRecord.update_count) === 1 ? 'time' : 'times'}
                            </span>
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

                    {searchedRecordType === 'daily' && (
                      <>
                        <div className="profile-group-card">
                          <div className="profile-group-title">General Information</div>
                          <div className="profile-grid-list">
                            <div className="profile-item">
                              <span className="profile-label">Date</span>
                              <span className="profile-value">{formatDateStr(searchedRecord.formatted_date || searchedRecord.entry_date)}</span>
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
                              <span className="profile-label">Chamber Name</span>
                              <span className="profile-value">{searchedRecord.chamber_name}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Client Name</span>
                              <span className="profile-value">{searchedRecord.client_name}</span>
                            </div>
                          </div>
                        </div>

                        <div className="profile-group-card">
                          <div className="profile-group-title">Temperature & Supervisor</div>
                          <div className="profile-grid-list">
                            <div className="profile-item">
                              <span className="profile-label">Chamber Temp</span>
                              <span className="profile-value">{searchedRecord.chamber_temp}°C</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Inspection Time</span>
                              <span className="profile-value">{searchedRecord.inspection_time || '-'}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Supervisor Name</span>
                              <span className="profile-value">{searchedRecord.monitor_supervisor_name || '-'}</span>
                            </div>
                            <div className="profile-item">
                              <span className="profile-label">Recorded Time variance</span>
                              <span className="profile-value">{searchedRecord.time_variance_minutes !== undefined ? `${searchedRecord.time_variance_minutes} mins` : '-'}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

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
                          <div className="profile-photo-card" onClick={() => setLightboxImg(searchedRecord.temp_sensor_image.startsWith('data:') ? searchedRecord.temp_sensor_image : `/${searchedRecord.temp_sensor_image}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={searchedRecord.temp_sensor_image.startsWith('data:') ? searchedRecord.temp_sensor_image : `/${searchedRecord.temp_sensor_image}`} alt="Temp Sensor" />
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
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                color: '#dc2626',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <ShieldAlert size={16} color="#dc2626" />
                <span>Error: {logsError}</span>
              </div>
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
                    border: '1px solid ' + (auditSubTab === 'do_changes' ? 'var(--primary)' : 'var(--border)'),
                    backgroundColor: auditSubTab === 'do_changes' ? 'var(--primary-light)' : '#ffffff',
                    color: auditSubTab === 'do_changes' ? 'var(--primary)' : 'var(--text-dark)',
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
                          <option value="CREATE">CREATE</option>
                          <option value="UPDATE">UPDATE</option>
                          <option value="DELETE">DELETE</option>
                          <option value="LOGIN">LOGIN</option>
                          <option value="LOGIN_FAILED">LOGIN_FAILED</option>
                          <option value="REQUEST_EDIT">REQUEST_EDIT</option>
                          <option value="REQUEST_DELETE">REQUEST_DELETE</option>
                          <option value="GRANT_PERMISSION">GRANT_PERMISSION</option>
                          <option value="DENY_PERMISSION">DENY_PERMISSION</option>
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
                                <th style={{ padding: '8px 10px', fontWeight: '800', color: 'var(--text-dark)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Timestamp</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedActivities.map((act) => {
                                if (!act) return null;
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
                                              {parts[0]}
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
                                              {parts[1]}
                                            </span>
                                          );
                                        }
                                        return descStr;
                                      })()}
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
                                    const parsed = parseRequestDescription(pr.description);
                                    
                                    return (
                                      <tr key={pr.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '6px 8px', fontWeight: '700', color: '#0f172a' }}>{renderOperatorEmail(pr.operator_email)}</td>
                                        <td style={{ padding: '6px 8px', color: '#475569', fontWeight: 600 }}>
                                          {operatorWarehouseMap[pr.operator_email ? pr.operator_email.toLowerCase() : ''] || 'System / Admin'}
                                        </td>
                                        <td style={{ padding: '6px 8px' }}>
                                          <span className="status-badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 700 }}>
                                            {parsed.module}
                                          </span>
                                        </td>
                                        <td 
                                          style={{ padding: '6px 8px', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                                          onClick={() => showLogDetailsByRef(parsed.refNo, pr.record_id, parsed.module)}
                                          title="Click to view data profile"
                                        >
                                          {parsed.refNo || `#${pr.record_id}`}
                                        </td>
                                        <td style={{ padding: '6px 8px', fontWeight: '700', color: '#0f172a' }}>{parsed.client}</td>
                                        <td style={{ padding: '6px 8px' }}>
                                          <span className="status-badge" style={{ 
                                            backgroundColor: pr.raw_action === 'REQUEST_DELETE' ? '#fee2e2' : '#e0f2fe', 
                                            color: pr.raw_action === 'REQUEST_DELETE' ? '#dc2626' : '#0369a1', 
                                            fontWeight: 800 
                                          }}>
                                            {pr.raw_action === 'REQUEST_DELETE' ? 'DELETE' : 'EDIT'}
                                          </span>
                                        </td>
                                        <td style={{ padding: '6px 8px', color: '#334155' }}>
                                          <div style={{ fontWeight: '600', color: '#1e293b' }}>
                                            {(pr.description || '').split(' | ')[0]}
                                          </div>
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

        {activeMenu === 'sub_admins' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Top: Register New Sub-Admin Horizontal Form */}
            <div className="diagnostics-card" style={{ padding: '24px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editingSubAdmin ? <Edit size={18} color="#00a2e8" /> : <UserPlus size={18} color="#00a2e8" />}
                  <span>{editingSubAdmin ? `Modify Sub-Admin Profile: ${editingSubAdmin.email}` : 'Register New Sub-Admin'}</span>
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  All fields are mandatory. Registered credentials grant dashboard and inquiry management access to Sub-Admins.
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
                      placeholder="e.g. 9998887776"
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dark)' }}>Email Address *</label>
                    <input 
                      type="email"
                      name="subadmin-email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="e.g. jane@reeferon.com"
                      value={subAdminEmail}
                      onChange={(e) => setSubAdminEmail(e.target.value)}
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
                      {editingSubAdmin ? 'New Password (Optional)' : 'Password *'}
                    </label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        name="subadmin-password"
                        autoComplete="new-password"
                        placeholder={editingSubAdmin ? 'Leave blank to retain current' : 'Enter account password'}
                        value={subAdminPassword}
                        onChange={(e) => setSubAdminPassword(e.target.value)}
                        required={!editingSubAdmin}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          paddingRight: '40px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)',
                          fontSize: '0.85rem',
                          outline: 'none',
                          backgroundColor: 'var(--bg-main)'
                        }}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(p => !p)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Data Access Scope: Client & Warehouse Restrictions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lock size={14} color="#ea580c" />
                      Data Access Scope
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                      Restrict which client & warehouse data this sub-admin can view. Leave empty for full access.
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {/* Client Names Multi-Select (options from DO monitor logs) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dark)' }}>Allowed Client Names</label>
                      <select
                        value=""
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
                          {(accessScopeOptions.clients || []).length === 0
                            ? 'No client names yet — save a DO inward/outward/chamber log first'
                            : 'Select client name from DO records…'}
                        </option>
                        {(accessScopeOptions.clients || [])
                          .filter((c) => !subAdminSelectedClients.includes(c))
                          .map((client) => (
                            <option key={client} value={client}>
                              {client}
                            </option>
                          ))}
                      </select>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', minHeight: '40px', alignItems: 'center' }}>
                        {subAdminSelectedClients.length === 0 ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No clients selected — full client access</span>
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

                    {/* Warehouse Names Multi-Select — same theme as clients */}
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
                      cursor: savingSubAdmin ? 'wait' : 'pointer',
                      opacity: savingSubAdmin ? 0.85 : 1,
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
                    ) : (editingSubAdmin ? 'Update Sub-Admin' : 'Register Sub-Admin')}
                  </button>
                </div>
              </form>
            </div>

            {/* Bottom: Sub-Admins Directory List */}
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
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>Sub-Admins Directory</h2>
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
                      <span>Loading sub-admins directory...</span>
                    </div>
                  ) : filteredSubAdminsList.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--text-muted)', gap: '10px' }}>
                      <ShieldAlert size={32} color="#94a3b8" />
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>No matching sub-admins found.</p>
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
                                  Sub-Admin / Customer
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
                                    title="Edit Sub-Admin Profile"
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
        )}

        {activeMenu === 'customer_reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="diagnostics-card" style={{ padding: '24px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquareWarning size={18} color="#00a2e8" />
                    <span>Customer Reports</span>
                  </h2>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    Issues submitted from the Customer portal. Each row identifies the customer account, Ref No., and issue message.
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
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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

                  {/* Warehouse Name */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dark)' }}>Warehouse Name *</label>
                    <input 
                      type="text"
                      name="op-warehouse"
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
                                    {op.warehouse_name ? `Access: ${op.warehouse_name} Logs Only` : 'Access: All Warehouses'}
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
          </>
        )}
      </main>



      {/* Detailed Data Profile Modal */}
      {selectedDetailLog && (
        <div className="profile-modal-overlay" onClick={() => setSelectedDetailLog(null)}>
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
                <button className="profile-modal-close-btn" onClick={() => setSelectedDetailLog(null)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="profile-modal-body">
              {/* Left Column: Data Fields */}
              <div className="profile-details-section">
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
                        <span className="profile-label" style={{ color: 'var(--primary)', fontWeight: '800' }}>Last Updated Details</span>
                        <span className="profile-value" style={{ fontWeight: '800', color: 'var(--text-dark)' }}>
                          Changed {Number(selectedDetailLog.update_count) > 0 ? selectedDetailLog.update_count : 1} {Number(selectedDetailLog.update_count) === 1 ? 'time' : 'times'}
                        </span>
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

                {detailType === 'daily' && (
                  <>
                    <div className="profile-group-card">
                      <div className="profile-group-title">General Information</div>
                      <div className="profile-grid-list">
                        <div className="profile-item">
                          <span className="profile-label">Date</span>
                          <span className="profile-value">{formatDateStr(selectedDetailLog.formatted_date || selectedDetailLog.entry_date)}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Reference No</span>
                          <span className="profile-value">{selectedDetailLog.reference_no || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Chamber Name</span>
                          <span className="profile-value">{selectedDetailLog.chamber_name} ({selectedDetailLog.chamber_type || 'Frozen'})</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Client Name</span>
                          <span className="profile-value">{selectedDetailLog.client_name}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Box Count</span>
                          <span className="profile-value">{selectedDetailLog.box_count !== undefined && selectedDetailLog.box_count !== null ? `${selectedDetailLog.box_count} Boxes` : '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Warehouse</span>
                          <span className="profile-value">{selectedDetailLog.warehouse_name || 'Generic'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="profile-group-card">
                      <div className="profile-group-title">Temperature & Supervisor</div>
                      <div className="profile-grid-list">
                        <div className="profile-item">
                          <span className="profile-label">Chamber Temp</span>
                          <span className="profile-value">{selectedDetailLog.chamber_temp}°C</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Inspection Time</span>
                          <span className="profile-value">{selectedDetailLog.inspection_time || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Photo Capture Time</span>
                          <span className="profile-value">{selectedDetailLog.photo_capture_time || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Supervisor Name</span>
                          <span className="profile-value">{selectedDetailLog.monitor_supervisor_name || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Time Variance</span>
                          <span className="profile-value">{selectedDetailLog.time_variance_minutes !== undefined ? `${selectedDetailLog.time_variance_minutes} mins` : '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Submission Delay (Overdue)</span>
                          <span className="profile-value" style={{ color: selectedDetailLog.overdue_time && selectedDetailLog.overdue_time !== 'same day' ? '#dc2626' : 'inherit', fontWeight: selectedDetailLog.overdue_time && selectedDetailLog.overdue_time !== 'same day' ? 'bold' : 'normal' }}>
                            {selectedDetailLog.overdue_time || 'same day'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

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
                    {/* Render Chamber Logs Photo */}
                    {detailType === 'daily' && selectedDetailLog.temp_sensor_image && (
                      <div className="profile-photo-card" onClick={() => setLightboxImg(selectedDetailLog.temp_sensor_image.startsWith('data:') ? selectedDetailLog.temp_sensor_image : `/${selectedDetailLog.temp_sensor_image}`)}>
                        <div className="profile-photo-wrapper">
                          <img src={selectedDetailLog.temp_sensor_image.startsWith('data:') ? selectedDetailLog.temp_sensor_image : `/${selectedDetailLog.temp_sensor_image}`} alt="Temp Sensor" />
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
              <button className="profile-close-btn" onClick={() => setSelectedDetailLog(null)}>Close View</button>
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
              href={lightboxImg} 
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

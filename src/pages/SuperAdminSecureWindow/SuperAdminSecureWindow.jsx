// ====================================================================
// Super Admin Secure Window Component (src/pages/SuperAdminSecureWindow/SuperAdminSecureWindow.jsx)
// Paired with: src/pages/SuperAdminSecureWindow/SuperAdminSecureWindow.css
// Strictly accessible by role: 'super_admin' only.
// ====================================================================

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Clock, LogOut, Database, Lock,
  Thermometer, Trash2, Edit, UserPlus, ShieldAlert,
  Menu, X, ChevronRight, User, Eye, EyeOff, Activity, Search, Download, History, LayoutDashboard,
  Copy, Check
} from 'lucide-react';
import Logo from '../../components/Logo/Logo';
import { 
  fetchOperators, createOperator, updateOperator, deleteOperator, fetchOperatorActivities,
  fetchPermissionRequests, updatePermissionRequest, fetchSystemConfig, updateSystemConfig,
  fetchChamberLogs, fetchInwardLogs, fetchOutwardLogs, fetchDashboardStats,
  fetchSubAdmins, createSubAdmin, updateSubAdmin, deleteSubAdmin
} from '../../services/api';
import './SuperAdminSecureWindow.css';

export default function SuperAdminSecureWindow({ user, onLogout }) {
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
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('All');
  const [logsError, setLogsError] = useState('');
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Activity History Audit Logs States
  const [activitiesSearch, setActivitiesSearch] = useState('');
  const [activitiesFromDate, setActivitiesFromDate] = useState('');
  const [activitiesToDate, setActivitiesToDate] = useState('');
  const [activitiesActionFilter, setActivitiesActionFilter] = useState('All');
  const [activitiesCurrentPage, setActivitiesCurrentPage] = useState(1);
  const [activitiesPerPage] = useState(20);


  // Super Admin History Logs States
  const [historyTab, setHistoryTab] = useState('daily');
  const [chamberLogs, setChamberLogs] = useState([]);
  const [inwardLogs, setInwardLogs] = useState([]);
  const [outwardLogs, setOutwardLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsSearch, setLogsSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');
  const [selectedDetailLog, setSelectedDetailLog] = useState(null);
  const [detailType, setDetailType] = useState('');
  const [lightboxImg, setLightboxImg] = useState(null);

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
  const [securityPerPage] = useState(20);

  // System & Error Logs States
  const [systemSearch, setSystemSearch] = useState('');
  const [systemFromDate, setSystemFromDate] = useState('');
  const [systemToDate, setSystemToDate] = useState('');
  const [systemActionFilter, setSystemActionFilter] = useState('All');
  const [systemCurrentPage, setSystemCurrentPage] = useState(1);
  const [systemPerPage] = useState(20);

  const [dashboardStats, setDashboardStats] = useState({
    totalLeads: 0,
    totalSubAdmins: 0,
    totalOperators: 0
  });

  // Sub-Admins Management States
  const [subAdmins, setSubAdmins] = useState([]);
  const [subAdminSearch, setSubAdminSearch] = useState('');
  const [loadingSubAdmins, setLoadingSubAdmins] = useState(false);
  const [subAdminSuccess, setSubAdminSuccess] = useState('');
  const [subAdminError, setSubAdminError] = useState('');
  const [subAdminEmail, setSubAdminEmail] = useState('');
  const [subAdminPassword, setSubAdminPassword] = useState('');
  const [subAdminFullName, setSubAdminFullName] = useState('');
  const [subAdminPhoneNo, setSubAdminPhoneNo] = useState('');
  const [editingSubAdmin, setEditingSubAdmin] = useState(null);

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
      setOperators(Array.isArray(data) ? data : []);
    } catch (err) {
      setOpError(err.message || 'Failed to fetch operators.');
    } finally {
      setLoadingOps(false);
    }
  };

  const loadActivities = async () => {
    setLoadingActivities(true);
    setLogsError('');
    try {
      const data = await fetchOperatorActivities();
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
      setLogsError(err.message || 'Failed to fetch activity logs.');
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

  const showLogDetailsByRef = (refNo, fallbackId, moduleType) => {
    if (!refNo && !fallbackId) return;
    
    let foundLog = null;
    let type = '';
    
    // 1. Try matching reference number first
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
    
    // 2. Try matching fallback ID
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
    if (emailLower === 'system' || emailLower.includes('admin')) {
      return email;
    }
    const isActive = (operators || []).some(
      op => op && op.email && op.email.toLowerCase().trim() === emailLower
    );
    if (!isActive) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4.5px' }}>
          <span>{email}</span>
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
    return email;
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
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    }
  };

  const loadHistoryLogs = async () => {
    setLoadingLogs(true);
    
    // 1. Fetch Chamber Logs
    try {
      const chamberData = await fetchChamberLogs();
      setChamberLogs(Array.isArray(chamberData) ? chamberData : []);
    } catch (err) {
      console.error('Error loading chamber logs:', err);
      setChamberLogs([]);
    }

    // 2. Fetch Inward Logs
    try {
      const inwardData = await fetchInwardLogs();
      setInwardLogs(Array.isArray(inwardData) ? inwardData : []);
    } catch (err) {
      console.error('Error loading inward logs:', err);
      setInwardLogs([]);
    }

    // 3. Fetch Outward Logs
    try {
      const outwardData = await fetchOutwardLogs();
      setOutwardLogs(Array.isArray(outwardData) ? outwardData : []);
    } catch (err) {
      console.error('Error loading outward logs:', err);
      setOutwardLogs([]);
    }

    setLoadingLogs(false);
  };

  useEffect(() => {
    if (activeMenu === 'dashboard') {
      loadOperatorsData();
      loadHistoryLogs();
      loadDashboardStatsData();
      loadSubAdminsData();
    } else if (activeMenu === 'sub_admins') {
      loadSubAdminsData();
    } else if (activeMenu === 'data_operators') {
      loadOperatorsData();
    } else if (activeMenu === 'activity_logs') {
      loadOperatorsData();
      loadActivities();
      loadPermissionRequests();
      loadSystemConfig();
    } else if (activeMenu === 'history_logs' || activeMenu === 'profile_lookup') {
      loadOperatorsData();
      loadHistoryLogs();
    }
  }, [activeMenu]);

  const handleLookupSearch = () => {
    const q = lookupQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      setSearchedRecord(null);
      return;
    }

    const results = [];

    // Search in Daily Chamber logs
    chamberLogs.forEach(log => {
      const dateStr = (log.formatted_date || (log.entry_date ? log.entry_date.split('T')[0] : '')).toLowerCase();
      if (
        (log.reference_no && log.reference_no.toLowerCase().includes(q)) ||
        (log.client_name && log.client_name.toLowerCase().includes(q)) ||
        (log.chamber_name && log.chamber_name.toLowerCase().includes(q)) ||
        (log.monitor_supervisor_name && log.monitor_supervisor_name.toLowerCase().includes(q)) ||
        dateStr.includes(q)
      ) {
        results.push({
          type: 'daily',
          label: 'Daily Chamber Log',
          reference_no: log.reference_no,
          date: log.formatted_date || (log.entry_date ? log.entry_date.split('T')[0] : ''),
          facility: log.warehouse_name || 'Generic',
          client: log.client_name,
          details: `Chamber: ${log.chamber_name} | Temp: ${log.chamber_temp}°C`,
          original: log
        });
      }
    });

    // Search Inward logs
    inwardLogs.forEach(log => {
      const dateStr = (log.inward_entry_date ? log.inward_entry_date.split('T')[0] : '').toLowerCase();
      if (
        (log.reference_no && log.reference_no.toLowerCase().includes(q)) ||
        (log.inward_vehicle_no && log.inward_vehicle_no.toLowerCase().includes(q)) ||
        (log.inward_client_name && log.inward_client_name.toLowerCase().includes(q)) ||
        (log.inward_transporter_name && log.inward_transporter_name.toLowerCase().includes(q)) ||
        (log.inward_driver_name && log.inward_driver_name.toLowerCase().includes(q)) ||
        dateStr.includes(q)
      ) {
        results.push({
          type: 'inward',
          label: 'Inward Log',
          reference_no: log.reference_no,
          date: log.inward_entry_date ? log.inward_entry_date.split('T')[0] : '',
          facility: log.warehouse_name || 'Generic',
          client: log.inward_client_name,
          details: `Vehicle: ${log.inward_vehicle_no} | Temp: ${log.inward_vehicle_temp}°C | Pallets: ${log.inward_pallets_in_qty}`,
          original: log
        });
      }
    });

    // Search Outward logs
    outwardLogs.forEach(log => {
      const dateStr = (log.outward_entry_date ? log.outward_entry_date.split('T')[0] : '').toLowerCase();
      if (
        (log.reference_no && log.reference_no.toLowerCase().includes(q)) ||
        (log.outward_vehicle_no && log.outward_vehicle_no.toLowerCase().includes(q)) ||
        (log.outward_client_name && log.outward_client_name.toLowerCase().includes(q)) ||
        (log.outward_transporter_name && log.outward_transporter_name.toLowerCase().includes(q)) ||
        (log.outward_driver_name && log.outward_driver_name.toLowerCase().includes(q)) ||
        dateStr.includes(q)
      ) {
        results.push({
          type: 'outward',
          label: 'Outward Log',
          reference_no: log.reference_no,
          date: log.outward_entry_date ? log.outward_entry_date.split('T')[0] : '',
          facility: log.warehouse_name || 'Generic',
          client: log.outward_client_name,
          details: `Vehicle: ${log.outward_vehicle_no} | Temp: ${log.outward_vehicle_temp}°C | Pallets: ${log.outward_pallets_qty || log.outward_pallets_in_qty || 0}`,
          original: log
        });
      }
    });

    setSearchResults(results);

    // If exactly one match, view it directly
    if (results.length === 1) {
      setSearchedRecord(results[0].original);
      setSearchedRecordType(results[0].type);
    } else {
      setSearchedRecord(null);
    }
  };

  const getFilteredActivities = () => {
    let list = (activities || []).filter(act => 
      act && 
      act.log_type !== 'PERMISSION' && 
      act.log_type !== 'SECURITY'
    );

    // Apply warehouse filter
    if (selectedWarehouseFilter !== 'All') {
      list = list.filter(act => {
        if (!act) return false;
        const opEmail = act.operator_email ? act.operator_email.toLowerCase() : '';
        const opWarehouse = operatorWarehouseMap[opEmail] || '';
        return opWarehouse === selectedWarehouseFilter;
      });
    }

    // Apply Action filter
    if (activitiesActionFilter !== 'All') {
      list = list.filter(act => act && act.action === activitiesActionFilter);
    }

    // Apply Search filter (matches operator email, description, action type)
    if (activitiesSearch.trim() !== '') {
      const q = activitiesSearch.toLowerCase().trim();
      list = list.filter(act => 
        act && (
          (act.operator_email && act.operator_email.toLowerCase().includes(q)) ||
          (act.description && act.description.toLowerCase().includes(q)) ||
          (act.action && act.action.toLowerCase().includes(q))
        )
      );
    }

    // Apply Date filters
    if (activitiesFromDate) {
      list = list.filter(act => {
        if (!act || !act.created_at) return false;
        const actDate = act.created_at.split('T')[0];
        return actDate >= activitiesFromDate;
      });
    }
    if (activitiesToDate) {
      list = list.filter(act => {
        if (!act || !act.created_at) return false;
        const actDate = act.created_at.split('T')[0];
        return actDate <= activitiesToDate;
      });
    }

    return list;
  };


  const handleExportActivitiesExcel = () => {
    const list = getFilteredActivities();
    let csvContent = "\uFEFF"; // UTF-8 BOM
    const headers = ["Timestamp", "Operator Email", "Allocated Warehouse", "Action Type", "Module Log", "Activity Description"];
    csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";

    list.forEach(act => {
      const timestamp = act.created_at ? new Date(act.created_at).toLocaleString() : '';
      const opEmail = act.operator_email || '-';
      const opWarehouse = operatorWarehouseMap[opEmail.toLowerCase()] || 'System / Admin';
      const action = act.action || '-';
      const logType = act.log_type || '-';
      const description = act.description || '-';

      const row = [timestamp, opEmail, opWarehouse, action, logType, description];
      csvContent += row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Operator_Activity_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFilteredSecurityLogs = () => {
    let list = (activities || []).filter(act => 
      act && (
        act.log_type === 'PERMISSION' || 
        act.log_type === 'SECURITY'
      )
    );

    // Apply Action filter
    if (securityActionFilter !== 'All') {
      list = list.filter(act => act && act.action === securityActionFilter);
    }

    // Apply Search filter (matches operator email, description, action type)
    if (securitySearch.trim() !== '') {
      const q = securitySearch.toLowerCase().trim();
      list = list.filter(act => 
        act && (
          (act.operator_email && act.operator_email.toLowerCase().includes(q)) ||
          (act.description && act.description.toLowerCase().includes(q)) ||
          (act.action && act.action.toLowerCase().includes(q))
        )
      );
    }

    // Apply Date filters
    if (securityFromDate) {
      list = list.filter(act => {
        if (!act || !act.created_at) return false;
        const actDate = act.created_at.split('T')[0];
        return actDate >= securityFromDate;
      });
    }
    if (securityToDate) {
      list = list.filter(act => {
        if (!act || !act.created_at) return false;
        const actDate = act.created_at.split('T')[0];
        return actDate <= securityToDate;
      });
    }

    return list;
  };

  const handleExportSecurityExcel = () => {
    const list = getFilteredSecurityLogs();
    let csvContent = "\uFEFF"; // UTF-8 BOM
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

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Security_Access_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const getFilteredSystemLogs = () => {
    let list = (activities || []).filter(act => 
      act && (
        act.log_type === 'SYSTEM' || 
        act.log_type === 'ERROR' ||
        act.action === 'SYSTEM_ERROR'
      )
    );

    // Apply Action filter
    if (systemActionFilter !== 'All') {
      list = list.filter(act => act && act.action === systemActionFilter);
    }

    // Apply Search filter (matches operator email, description, action type)
    if (systemSearch.trim() !== '') {
      const q = systemSearch.toLowerCase().trim();
      list = list.filter(act => 
        act && (
          (act.operator_email && act.operator_email.toLowerCase().includes(q)) ||
          (act.description && act.description.toLowerCase().includes(q)) ||
          (act.action && act.action.toLowerCase().includes(q)) ||
          (act.log_type && act.log_type.toLowerCase().includes(q))
        )
      );
    }

    // Apply Date filters
    if (systemFromDate) {
      list = list.filter(act => {
        if (!act || !act.created_at) return false;
        const actDate = act.created_at.split('T')[0];
        return actDate >= systemFromDate;
      });
    }
    if (systemToDate) {
      list = list.filter(act => {
        if (!act || !act.created_at) return false;
        const actDate = act.created_at.split('T')[0];
        return actDate <= systemToDate;
      });
    }

    return list;
  };

  const handleExportSystemExcel = () => {
    const list = getFilteredSystemLogs();
    let csvContent = "\uFEFF"; // UTF-8 BOM
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

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `System_Process_Error_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const getFilteredHistoryLogs = () => {
    let logs = [];
    if (historyTab === 'daily') {
      logs = chamberLogs;
    } else if (historyTab === 'inward') {
      logs = inwardLogs;
    } else if (historyTab === 'outward') {
      logs = outwardLogs;
    }

    // Filter by Warehouse
    if (selectedWarehouse && selectedWarehouse !== 'All') {
      logs = logs.filter(l => l.warehouse_name === selectedWarehouse);
    }

    // Filter by Search Query
    if (logsSearch) {
      const q = logsSearch.toLowerCase();
      logs = logs.filter(l => {
        const opEmail = l.operator_email ? l.operator_email.toLowerCase() : '';
        const opProfile = operators.find(o => o.email.toLowerCase() === opEmail);
        const opName = opProfile && opProfile.full_name ? opProfile.full_name.toLowerCase() : '';
        const opPhone = opProfile && opProfile.phone_no ? opProfile.phone_no.toLowerCase() : '';
        
        const matchesOperator = opEmail.includes(q) || opName.includes(q) || opPhone.includes(q);

        if (historyTab === 'daily') {
          const dateStr = (l.formatted_date || (l.entry_date ? l.entry_date.split('T')[0] : '')).toLowerCase();
          return matchesOperator ||
            (l.reference_no && l.reference_no.toLowerCase().includes(q)) ||
            (l.client_name && l.client_name.toLowerCase().includes(q)) ||
            (l.chamber_name && l.chamber_name.toLowerCase().includes(q)) ||
            (l.monitor_supervisor_name && l.monitor_supervisor_name.toLowerCase().includes(q)) ||
            dateStr.includes(q);
        } else if (historyTab === 'inward') {
          const dateStr = (l.inward_entry_date ? l.inward_entry_date.split('T')[0] : '').toLowerCase();
          return matchesOperator ||
            (l.reference_no && l.reference_no.toLowerCase().includes(q)) ||
            (l.inward_vehicle_no && l.inward_vehicle_no.toLowerCase().includes(q)) ||
            (l.inward_client_name && l.inward_client_name.toLowerCase().includes(q)) ||
            (l.inward_transporter_name && l.inward_transporter_name.toLowerCase().includes(q)) ||
            (l.inward_driver_name && l.inward_driver_name.toLowerCase().includes(q)) ||
            dateStr.includes(q);
        } else if (historyTab === 'outward') {
          const dateStr = (l.outward_entry_date ? l.outward_entry_date.split('T')[0] : '').toLowerCase();
          return matchesOperator ||
            (l.reference_no && l.reference_no.toLowerCase().includes(q)) ||
            (l.outward_vehicle_no && l.outward_vehicle_no.toLowerCase().includes(q)) ||
            (l.outward_client_name && l.outward_client_name.toLowerCase().includes(q)) ||
            (l.outward_transporter_name && l.outward_transporter_name.toLowerCase().includes(q)) ||
            (l.outward_driver_name && l.outward_driver_name.toLowerCase().includes(q)) ||
            dateStr.includes(q);
        }
        return false;
      });
    }

    // Filter by Date Range (using applied filters)
    if (appliedFromDate || appliedToDate) {
      logs = logs.filter(l => {
        const entryDateStr = historyTab === 'daily' 
          ? (l.formatted_date || l.entry_date) 
          : (historyTab === 'inward' ? l.inward_entry_date : l.outward_entry_date);
        
        if (!entryDateStr) return false;
        
        let logDateObj;
        if (entryDateStr.includes('-')) {
          const parts = entryDateStr.split('T')[0].split('-');
          if (parts[0].length === 4) {
            logDateObj = new Date(parts[0], parts[1] - 1, parts[2]);
          } else {
            logDateObj = new Date(parts[2], parts[1] - 1, parts[0]);
          }
        } else {
          logDateObj = new Date(entryDateStr);
        }
        
        if (isNaN(logDateObj.getTime())) return false;

        if (appliedFromDate) {
          const [fY, fM, fD] = appliedFromDate.split('-');
          const fromDateObj = new Date(fY, fM - 1, fD);
          if (logDateObj < fromDateObj) return false;
        }
        if (appliedToDate) {
          const [tY, tM, tD] = appliedToDate.split('-');
          const toDateObj = new Date(tY, tM - 1, tD);
          if (logDateObj > toDateObj) return false;
        }
        return true;
      });
    }

    return logs;
  };

  const handleExportLogsExcel = () => {
    const filteredLogs = getFilteredHistoryLogs();
    if (filteredLogs.length === 0) {
      alert("No data available to export.");
      return;
    }

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

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const tabLabel = historyTab === 'daily' ? 'ChamberLogs' : (historyTab === 'inward' ? 'InwardLogs' : 'OutwardLogs');
    const dateSuffix = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `ReeferON_${tabLabel}_SuperAdminExport_${dateSuffix}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

    try {
      const payload = {
        email: subAdminEmail,
        password: subAdminPassword,
        full_name: subAdminFullName,
        phone_no: subAdminPhoneNo
      };

      if (editingSubAdmin) {
        await updateSubAdmin(editingSubAdmin.id, payload);
        setSubAdminSuccess('Sub-Admin profile updated successfully.');
      } else {
        await createSubAdmin(payload);
        setSubAdminSuccess('Sub-Admin registered successfully.');
      }

      cancelEditSubAdmin();
      loadSubAdminsData();
      loadDashboardStatsData();
    } catch (err) {
      setSubAdminError(err.message || 'Action failed.');
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
    setSubAdminError('');
    setSubAdminSuccess('');
  };

  const cancelEditSubAdmin = () => {
    setEditingSubAdmin(null);
    setSubAdminEmail('');
    setSubAdminFullName('');
    setSubAdminPhoneNo('');
    setSubAdminPassword('');
    setShowPassword(false);
    setSubAdminError('');
    setSubAdminSuccess('');
    setSubAdminSearch('');
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

  const hasPendingRequests = permissionRequests.some(pr => pr.status === 'Pending');

  return (
    <div className="app-container">
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
              {hasPendingRequests && <span className="pulsing-dot" />}
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
            {activeMenu === 'dashboard'
              ? 'Super Admin - Control Dashboard'
              : activeMenu === 'sub_admins'
                ? 'Super Admin - Sub-Admin Profiles'
                : activeMenu === 'data_operators' 
                  ? 'Super Admin - Operator Profiles' 
                  : activeMenu === 'history_logs' 
                    ? 'Super Admin - History Logs' 
                    : activeMenu === 'activity_logs'
                      ? 'Super Admin - Operator Activities'
                      : activeMenu === 'profile_lookup'
                        ? 'Super Admin - Profile Lookup'
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
              className={`clean-menu-item ${activeMenu === 'activity_logs' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('activity_logs');
                setIsMobileMenuOpen(false);
              }}
            >
              <div className="item-left">
                <Activity size={18} className="item-icon" />
                <span>Operator Activities</span>
                {hasPendingRequests && <span className="pulsing-dot" style={{ marginLeft: '8px' }} />}
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
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
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
                  onChange={(e) => setFromDate(e.target.value)}
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
                  onChange={(e) => setToDate(e.target.value)}
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
                    setAppliedFromDate(fromDate);
                    setAppliedToDate(toDate);
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
                  style={{
                    padding: '9px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: '#22c55e',
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
                  Export
                </button>
              </div>
            </div>

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
                          {log.formatted_date || (log.entry_date ? log.entry_date.split('T')[0] : '')}
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
                          <button 
                            onClick={() => {
                              setSelectedDetailLog(log);
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
                              justifyContent: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>
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
                            {log.inward_unloading_start_time || '-'} to {log.inward_unloading_end_time || '-'}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>{log.inward_unloading_supervisor_name}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button 
                            onClick={() => {
                              setSelectedDetailLog(log);
                              setDetailType('inward');
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
                              justifyContent: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>
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
                            {log.outward_loading_start_time || '-'} to {log.outward_loading_end_time || '-'}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>{log.outward_loading_supervisor_name}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button 
                            onClick={() => {
                              setSelectedDetailLog(log);
                              setDetailType('outward');
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
                              justifyContent: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                       )
                    })}
                  </tbody>
                </table>
              </div>
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
                <div>
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
                        {searchedRecord.remarks || searchedRecord.inward_remarks || searchedRecord.outward_remarks ? (
                          <div className="profile-item" style={{ gridColumn: 'span 2' }}>
                            <span className="profile-label">Remarks</span>
                            <span className="profile-value" style={{ fontWeight: 'normal', fontStyle: 'italic' }}>
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
                                ({searchedRecord.inward_unloading_start_time || '-'} to {searchedRecord.inward_unloading_end_time || '-'})
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
                                ({searchedRecord.outward_loading_start_time || '-'} to {searchedRecord.outward_loading_end_time || '-'})
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
                            {searchedRecord.inward_invoice_photos && (
                              <div className="profile-photo-card" onClick={() => setLightboxImg(searchedRecord.inward_invoice_photos.startsWith('data:') ? searchedRecord.inward_invoice_photos : `/${searchedRecord.inward_invoice_photos}`)}>
                                <div className="profile-photo-wrapper">
                                  <img src={searchedRecord.inward_invoice_photos.startsWith('data:') ? searchedRecord.inward_invoice_photos : `/${searchedRecord.inward_invoice_photos}`} alt="Invoice" />
                                </div>
                                <div className="profile-photo-label">Invoice Photo</div>
                              </div>
                            )}
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
                            {searchedRecord.inward_count_sheet_photo && (
                              <div className="profile-photo-card" onClick={() => setLightboxImg(searchedRecord.inward_count_sheet_photo.startsWith('data:') ? searchedRecord.inward_count_sheet_photo : `/${searchedRecord.inward_count_sheet_photo}`)}>
                                <div className="profile-photo-wrapper">
                                  <img src={searchedRecord.inward_count_sheet_photo.startsWith('data:') ? searchedRecord.inward_count_sheet_photo : `/${searchedRecord.inward_count_sheet_photo}`} alt="Count Sheet" />
                                </div>
                                <div className="profile-photo-label">Count Sheet</div>
                              </div>
                            )}
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
                            {searchedRecord.outward_invoice_photos && (
                              <div className="profile-photo-card" onClick={() => setLightboxImg(searchedRecord.outward_invoice_photos.startsWith('data:') ? searchedRecord.outward_invoice_photos : `/${searchedRecord.outward_invoice_photos}`)}>
                                <div className="profile-photo-wrapper">
                                  <img src={searchedRecord.outward_invoice_photos.startsWith('data:') ? searchedRecord.outward_invoice_photos : `/${searchedRecord.outward_invoice_photos}`} alt="Invoice" />
                                </div>
                                <div className="profile-photo-label">Invoice Photo</div>
                              </div>
                            )}
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
                            {searchedRecord.outward_count_sheet_photo && (
                              <div className="profile-photo-card" onClick={() => setLightboxImg(searchedRecord.outward_count_sheet_photo.startsWith('data:') ? searchedRecord.outward_count_sheet_photo : `/${searchedRecord.outward_count_sheet_photo}`)}>
                                <div className="profile-photo-wrapper">
                                  <img src={searchedRecord.outward_count_sheet_photo.startsWith('data:') ? searchedRecord.outward_count_sheet_photo : `/${searchedRecord.outward_count_sheet_photo}`} alt="Count Sheet" />
                                </div>
                                <div className="profile-photo-label">Count Sheet</div>
                              </div>
                            )}
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
                   'Role & Permission Requests'}
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  {auditSubTab === 'activity_log' ? 'Real-time database operations audit trail' : 
                   auditSubTab === 'security_log' ? 'Authentication events & security access logs' :
                   auditSubTab === 'system_errors' ? 'All application system processes and runtime exception logs' :
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
                  onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
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

            {loadingActivities ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <span>Loading activity history logs...</span>
              </div>
            ) : auditSubTab === 'activity_log' ? (
              // Tab 1: Operator Activity History Audit Logs
              (() => {
                const filteredActivities = getFilteredActivities();

                // Pagination calculations
                const totalItems = filteredActivities.length;
                const totalPages = Math.ceil(totalItems / activitiesPerPage) || 1;
                const currentPage = Math.min(Math.max(activitiesCurrentPage, 1), totalPages);
                const startIndex = (currentPage - 1) * activitiesPerPage;
                const paginatedActivities = filteredActivities.slice(startIndex, startIndex + activitiesPerPage);

                return (
                  <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--text-dark)' }}>Operator Activity History Audit Logs</h3>
                    
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
                          onChange={(e) => {
                            setActivitiesFromDate(e.target.value);
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
                          onChange={(e) => {
                            setActivitiesToDate(e.target.value);
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
                            border: '1px solid var(--primary)',
                            backgroundColor: 'var(--primary-light)',
                            color: 'var(--primary)',
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

                    {paginatedActivities.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        <span>No operator activities found matching the filters.</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ maxHeight: '420px', overflowY: 'auto', overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                          <table className="logs-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', backgroundColor: 'var(--bg-main)' }}>
                                <th style={{ padding: '8px 10px', fontWeight: '800', color: 'var(--text-dark)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Operator Email</th>
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

                        {/* Pagination controls */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 4px 4px 4px',
                          borderTop: '1px solid var(--border)',
                          marginTop: '12px',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Showing <strong style={{ color: 'var(--text-dark)' }}>{startIndex + 1}</strong> to{' '}
                            <strong style={{ color: 'var(--text-dark)' }}>{Math.min(startIndex + paginatedActivities.length, totalItems)}</strong> of{' '}
                            <strong style={{ color: 'var(--text-dark)' }}>{totalItems}</strong> entries
                          </span>

                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <button
                              disabled={currentPage === 1}
                              onClick={() => setActivitiesCurrentPage(p => Math.max(p - 1, 1))}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border)',
                                backgroundColor: currentPage === 1 ? '#f1f5f9' : '#ffffff',
                                color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-dark)',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                cursor: currentPage === 1 ? 'default' : 'pointer'
                              }}
                            >
                              Previous
                            </button>

                            {/* Page numbers */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                              .map((p, idx, arr) => {
                                const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                                return (
                                  <React.Fragment key={p}>
                                    {showEllipsis && <span style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: '0.72rem' }}>...</span>}
                                    <button
                                      onClick={() => setActivitiesCurrentPage(p)}
                                      style={{
                                        padding: '4px 8px',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid ' + (p === currentPage ? 'var(--primary)' : 'var(--border)'),
                                        backgroundColor: p === currentPage ? 'var(--primary)' : '#ffffff',
                                        color: p === currentPage ? '#ffffff' : 'var(--text-dark)',
                                        fontSize: '0.72rem',
                                        fontWeight: '700',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {p}
                                    </button>
                                  </React.Fragment>
                                );
                              })}

                            <button
                              disabled={currentPage === totalPages}
                              onClick={() => setActivitiesCurrentPage(p => Math.min(p + 1, totalPages))}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border)',
                                backgroundColor: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
                                color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-dark)',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                cursor: currentPage === totalPages ? 'default' : 'pointer'
                              }}
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()
            ) : auditSubTab === 'security_log' ? (
              // Tab 2: System Security & Permission Logs
              (() => {
                const filteredSecurityLogs = getFilteredSecurityLogs();

                // Pagination calculations
                const totalItems = filteredSecurityLogs.length;
                const totalPages = Math.ceil(totalItems / securityPerPage) || 1;
                const currentPage = Math.min(Math.max(securityCurrentPage, 1), totalPages);
                const startIndex = (currentPage - 1) * securityPerPage;
                const paginatedSecurityLogs = filteredSecurityLogs.slice(startIndex, startIndex + securityPerPage);

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
                          onChange={(e) => {
                            setSecurityFromDate(e.target.value);
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
                          onChange={(e) => {
                            setSecurityToDate(e.target.value);
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
                            border: '1px solid var(--primary)',
                            backgroundColor: 'var(--primary-light)',
                            color: 'var(--primary)',
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

                    {paginatedSecurityLogs.length === 0 ? (
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

                        {/* Pagination controls */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 4px 4px 4px',
                          borderTop: '1px solid var(--border)',
                          marginTop: '12px',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Showing <strong style={{ color: 'var(--text-dark)' }}>{startIndex + 1}</strong> to{' '}
                            <strong style={{ color: 'var(--text-dark)' }}>{Math.min(startIndex + paginatedSecurityLogs.length, totalItems)}</strong> of{' '}
                            <strong style={{ color: 'var(--text-dark)' }}>{totalItems}</strong> entries
                          </span>

                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <button
                              disabled={currentPage === 1}
                              onClick={() => setSecurityCurrentPage(p => Math.max(p - 1, 1))}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border)',
                                backgroundColor: currentPage === 1 ? '#f1f5f9' : '#ffffff',
                                color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-dark)',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                cursor: currentPage === 1 ? 'default' : 'pointer'
                              }}
                            >
                              Previous
                            </button>

                            {/* Page numbers */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                              .map((p, idx, arr) => {
                                const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                                return (
                                  <React.Fragment key={p}>
                                    {showEllipsis && <span style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: '0.72rem' }}>...</span>}
                                    <button
                                      onClick={() => setSecurityCurrentPage(p)}
                                      style={{
                                        padding: '4px 8px',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid ' + (p === currentPage ? 'var(--primary)' : 'var(--border)'),
                                        backgroundColor: p === currentPage ? 'var(--primary)' : '#ffffff',
                                        color: p === currentPage ? '#ffffff' : 'var(--text-dark)',
                                        fontSize: '0.72rem',
                                        fontWeight: '700',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {p}
                                    </button>
                                  </React.Fragment>
                                );
                              })}

                            <button
                              disabled={currentPage === totalPages}
                              onClick={() => setSecurityCurrentPage(p => Math.min(p + 1, totalPages))}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border)',
                                backgroundColor: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
                                color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-dark)',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                cursor: currentPage === totalPages ? 'default' : 'pointer'
                              }}
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()
            ) : auditSubTab === 'system_errors' ? (
              // Tab 3: System & Error Logs
              (() => {
                const filteredSystemLogs = getFilteredSystemLogs();

                // Pagination calculations
                const totalItems = filteredSystemLogs.length;
                const totalPages = Math.ceil(totalItems / systemPerPage) || 1;
                const currentPage = Math.min(Math.max(systemCurrentPage, 1), totalPages);
                const startIndex = (currentPage - 1) * systemPerPage;
                const paginatedSystemLogs = filteredSystemLogs.slice(startIndex, startIndex + systemPerPage);

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
                          onChange={(e) => {
                            setSystemFromDate(e.target.value);
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
                          onChange={(e) => {
                            setSystemToDate(e.target.value);
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
                            border: '1px solid var(--primary)',
                            backgroundColor: 'var(--primary-light)',
                            color: 'var(--primary)',
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

                    {paginatedSystemLogs.length === 0 ? (
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
                                    <td style={{ padding: '6px 8px', color: '#334155', fontFamily: act.log_type === 'ERROR' ? 'monospace' : 'inherit', fontSize: act.log_type === 'ERROR' ? '0.74rem' : '0.78rem' }}>{act.description}</td>
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

                        {/* Pagination controls */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 4px 4px 4px',
                          borderTop: '1px solid var(--border)',
                          marginTop: '12px',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Showing <strong style={{ color: 'var(--text-dark)' }}>{startIndex + 1}</strong> to{' '}
                            <strong style={{ color: 'var(--text-dark)' }}>{Math.min(startIndex + paginatedSystemLogs.length, totalItems)}</strong> of{' '}
                            <strong style={{ color: 'var(--text-dark)' }}>{totalItems}</strong> entries
                          </span>

                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <button
                              disabled={currentPage === 1}
                              onClick={() => setSystemCurrentPage(p => Math.max(p - 1, 1))}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border)',
                                backgroundColor: currentPage === 1 ? '#f1f5f9' : '#ffffff',
                                color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-dark)',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                cursor: currentPage === 1 ? 'default' : 'pointer'
                              }}
                            >
                              Previous
                            </button>

                            {/* Page numbers */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                              .map((p, idx, arr) => {
                                const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                                return (
                                  <React.Fragment key={p}>
                                    {showEllipsis && <span style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: '0.72rem' }}>...</span>}
                                    <button
                                      onClick={() => setSystemCurrentPage(p)}
                                      style={{
                                        padding: '4px 8px',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid ' + (p === currentPage ? 'var(--primary)' : 'var(--border)'),
                                        backgroundColor: p === currentPage ? 'var(--primary)' : '#ffffff',
                                        color: p === currentPage ? '#ffffff' : 'var(--text-dark)',
                                        fontSize: '0.72rem',
                                        fontWeight: '700',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {p}
                                    </button>
                                  </React.Fragment>
                                );
                              })}

                            <button
                              disabled={currentPage === totalPages}
                              onClick={() => setSystemCurrentPage(p => Math.min(p + 1, totalPages))}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border)',
                                backgroundColor: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
                                color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-dark)',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                cursor: currentPage === totalPages ? 'default' : 'pointer'
                              }}
                            >
                              Next
                            </button>
                          </div>
                        </div>
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
                      placeholder="e.g. Jane Doe"
                      value={subAdminFullName}
                      onChange={(e) => setSubAdminFullName(e.target.value)}
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
                      placeholder="e.g. +91 9998887776"
                      value={subAdminPhoneNo}
                      onChange={(e) => setSubAdminPhoneNo(e.target.value)}
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
                    disabled={loadingSubAdmins}
                    style={{
                      padding: '10px 24px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: editingSubAdmin ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#00a2e8',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      boxShadow: editingSubAdmin ? '0 4px 12px rgba(249, 115, 22, 0.35)' : '0 4px 12px rgba(0, 162, 232, 0.25)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {loadingSubAdmins ? 'Processing...' : (editingSubAdmin ? 'Update Sub-Admin' : 'Register Sub-Admin')}
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
                      background: editingOp ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#00a2e8',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      boxShadow: editingOp ? '0 4px 12px rgba(249, 115, 22, 0.35)' : '0 4px 12px rgba(0, 162, 232, 0.25)',
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
              <button className="profile-modal-close-btn" onClick={() => setSelectedDetailLog(null)}>
                <X size={20} />
              </button>
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
                    {selectedDetailLog.remarks || selectedDetailLog.inward_remarks || selectedDetailLog.outward_remarks ? (
                      <div className="profile-item" style={{ gridColumn: 'span 2' }}>
                        <span className="profile-label">Remarks</span>
                        <span className="profile-value" style={{ fontWeight: 'normal', fontStyle: 'italic' }}>
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
                          <span className="profile-value">{selectedDetailLog.chamber_name}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Client Name</span>
                          <span className="profile-value">{selectedDetailLog.client_name}</span>
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
                          <span className="profile-label">Supervisor Name</span>
                          <span className="profile-value">{selectedDetailLog.monitor_supervisor_name || '-'}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">Recorded Time variance</span>
                          <span className="profile-value">{selectedDetailLog.time_variance_minutes !== undefined ? `${selectedDetailLog.time_variance_minutes} mins` : '-'}</span>
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
                              ({selectedDetailLog.inward_unloading_start_time || '-'} to {selectedDetailLog.inward_unloading_end_time || '-'})
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
                              ({selectedDetailLog.outward_loading_start_time || '-'} to {selectedDetailLog.outward_loading_end_time || '-'})
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
                        {selectedDetailLog.inward_invoice_photos && (
                          <div className="profile-photo-card" onClick={() => setLightboxImg(selectedDetailLog.inward_invoice_photos.startsWith('data:') ? selectedDetailLog.inward_invoice_photos : `/${selectedDetailLog.inward_invoice_photos}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={selectedDetailLog.inward_invoice_photos.startsWith('data:') ? selectedDetailLog.inward_invoice_photos : `/${selectedDetailLog.inward_invoice_photos}`} alt="Invoice" />
                            </div>
                            <div className="profile-photo-label">Invoice Photo</div>
                          </div>
                        )}
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
                        {selectedDetailLog.inward_count_sheet_photo && (
                          <div className="profile-photo-card" onClick={() => setLightboxImg(selectedDetailLog.inward_count_sheet_photo.startsWith('data:') ? selectedDetailLog.inward_count_sheet_photo : `/${selectedDetailLog.inward_count_sheet_photo}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={selectedDetailLog.inward_count_sheet_photo.startsWith('data:') ? selectedDetailLog.inward_count_sheet_photo : `/${selectedDetailLog.inward_count_sheet_photo}`} alt="Count Sheet" />
                            </div>
                            <div className="profile-photo-label">Count Sheet</div>
                          </div>
                        )}
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
                        {selectedDetailLog.outward_invoice_photos && (
                          <div className="profile-photo-card" onClick={() => setLightboxImg(selectedDetailLog.outward_invoice_photos.startsWith('data:') ? selectedDetailLog.outward_invoice_photos : `/${selectedDetailLog.outward_invoice_photos}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={selectedDetailLog.outward_invoice_photos.startsWith('data:') ? selectedDetailLog.outward_invoice_photos : `/${selectedDetailLog.outward_invoice_photos}`} alt="Invoice" />
                            </div>
                            <div className="profile-photo-label">Invoice Photo</div>
                          </div>
                        )}
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
                        {selectedDetailLog.outward_count_sheet_photo && (
                          <div className="profile-photo-card" onClick={() => setLightboxImg(selectedDetailLog.outward_count_sheet_photo.startsWith('data:') ? selectedDetailLog.outward_count_sheet_photo : `/${selectedDetailLog.outward_count_sheet_photo}`)}>
                            <div className="profile-photo-wrapper">
                              <img src={selectedDetailLog.outward_count_sheet_photo.startsWith('data:') ? selectedDetailLog.outward_count_sheet_photo : `/${selectedDetailLog.outward_count_sheet_photo}`} alt="Count Sheet" />
                            </div>
                            <div className="profile-photo-label">Count Sheet</div>
                          </div>
                        )}
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

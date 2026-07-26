// ====================================================================
// Super Admin Secure Window Component (src/pages/SuperAdminSecureWindow/SuperAdminSecureWindow.jsx)
// Paired with: src/pages/SuperAdminSecureWindow/SuperAdminSecureWindow.css
// Strictly accessible by role: 'super_admin' only.
// ====================================================================

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Cpu, Database, Server, Clock, LogOut, 
  ArrowRight, Lock, Thermometer, Trash2, Edit, UserPlus, ShieldAlert,
  Menu, X, ChevronRight, User, Eye, EyeOff, Activity, Search, Download, History, LayoutDashboard
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
      setOperators(data);
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
      setActivities(data);
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
      setPermissionRequests(data);
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

  const operatorWarehouseMap = {};
  operators.forEach(op => {
    if (op.email && op.warehouse_name) {
      operatorWarehouseMap[op.email.toLowerCase()] = op.warehouse_name;
    }
  });
  const warehousesList = Array.from(new Set(operators.map(op => op.warehouse_name).filter(Boolean)));

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
    try {
      const [chamberData, inwardData, outwardData] = await Promise.all([
        fetchChamberLogs(),
        fetchInwardLogs(),
        fetchOutwardLogs()
      ]);
      setChamberLogs(chamberData || []);
      setInwardLogs(inwardData || []);
      setOutwardLogs(outwardData || []);
    } catch (err) {
      console.error('Error loading history logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeMenu === 'dashboard') {
      loadOperatorsData();
      loadHistoryLogs();
      loadDashboardStatsData();
      loadSubAdminsData();
    } else if (activeMenu === 'sub_admins') {
      loadSubAdminsData();
    } else if (activeMenu === 'activity_audit') {
      loadOperatorsData();
      loadActivities();
    } else if (activeMenu === 'role_permission') {
      loadOperatorsData();
      loadActivities();
      loadPermissionRequests();
      loadSystemConfig();
    } else if (activeMenu === 'history_logs') {
      loadOperatorsData();
      loadHistoryLogs();
    }
  }, [activeMenu]);

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
          return matchesOperator ||
            (l.client_name && l.client_name.toLowerCase().includes(q)) ||
            (l.chamber_name && l.chamber_name.toLowerCase().includes(q)) ||
            (l.monitor_supervisor_name && l.monitor_supervisor_name.toLowerCase().includes(q));
        } else if (historyTab === 'inward') {
          return matchesOperator ||
            (l.inward_vehicle_no && l.inward_vehicle_no.toLowerCase().includes(q)) ||
            (l.inward_client_name && l.inward_client_name.toLowerCase().includes(q)) ||
            (l.inward_transporter_name && l.inward_transporter_name.toLowerCase().includes(q)) ||
            (l.inward_driver_name && l.inward_driver_name.toLowerCase().includes(q));
        } else if (historyTab === 'outward') {
          return matchesOperator ||
            (l.outward_vehicle_no && l.outward_vehicle_no.toLowerCase().includes(q)) ||
            (l.outward_client_name && l.outward_client_name.toLowerCase().includes(q)) ||
            (l.outward_transporter_name && l.outward_transporter_name.toLowerCase().includes(q)) ||
            (l.outward_driver_name && l.outward_driver_name.toLowerCase().includes(q));
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
          `${log.inward_unloading_duration_hours || '0'}h ${log.inward_unloading_duration_mins || '0'}m`,
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
          `${log.outward_loading_duration_hours || '0'}h ${log.outward_loading_duration_mins || '0'}m`,
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
              className={`clean-menu-item ${activeMenu === 'diagnostics' ? 'active' : ''}`}
              onClick={() => setActiveMenu('diagnostics')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Cpu size={18} />
                <span>System Diagnostics</span>
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
        {activeMenu === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Top Row: Welcome Banner */}
            <div className="secure-welcome-dashboard-card">
              <div className="welcome-info-left">
                <div style={{ backgroundColor: 'rgba(0,162,232,0.15)', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheck size={36} color="#00a2e8" />
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>Control Center Dashboard</h1>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>Super Admin overview of cold storage operations, operators activity logs and locations.</p>
                </div>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: '700', flexShrink: 0 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span>
                System Monitoring Online
              </div>
            </div>

            {/* Stats Cards Grid (4 columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              {/* Card 1: Data Operators */}
              <div className="diagnostic-card" style={{ padding: '20px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operators</span>
                  <div style={{ backgroundColor: 'var(--primary-light)', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
                    <User size={18} color="var(--primary)" />
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, color: 'var(--text-dark)' }}>{operators.length}</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Registered Data Operators</span>
                </div>
              </div>

              {/* Card 2: Warehouses */}
              <div className="diagnostic-card" style={{ padding: '20px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Warehouses</span>
                  <div style={{ backgroundColor: '#e0f2fe', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
                    <Database size={18} color="#0284c7" />
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, color: 'var(--text-dark)' }}>{warehousesList.length}</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Locations Managed</span>
                </div>
              </div>

              {/* Card 3: Customers (Sub-Admins) */}
              <div className="diagnostic-card" style={{ padding: '20px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customers</span>
                  <div style={{ backgroundColor: '#fee2e2', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
                    <ShieldCheck size={18} color="#dc2626" />
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, color: 'var(--text-dark)' }}>{subAdmins.length}</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Registered Customers (Sub-Admins)</span>
                </div>
              </div>
            </div>

            {/* Operational Shortcuts */}
            <div className="diagnostic-card" style={{ padding: '24px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>Operational Shortcuts</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <button 
                  onClick={() => setActiveMenu('data_operators')}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-dark)',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  className="dashboard-shortcut-btn"
                >
                  <UserPlus size={20} color="var(--primary)" />
                  Register Operator
                </button>

                <button 
                  onClick={() => setActiveMenu('history_logs')}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-dark)',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  className="dashboard-shortcut-btn"
                >
                  <History size={20} color="var(--primary)" />
                  System Logs
                </button>
              </div>
            </div>
          </div>
        )}

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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '200px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>Search Query</label>
                <input
                  type="text"
                  placeholder="Search by client, supervisor, vehicle..."
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
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Warehouse</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Operator Email</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Chamber</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Client Name</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Inspection Time</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Temp (°C)</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Supervisor</th>
                      </tr>
                    )}
                    {historyTab === 'inward' && (
                      <tr>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Date</th>
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
                      </tr>
                    )}
                    {historyTab === 'outward' && (
                      <tr>
                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Date</th>
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
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {historyTab === 'daily' && getFilteredHistoryLogs().map((log) => (
                      <tr key={log.id}>
                        <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                          {log.formatted_date || (log.entry_date ? log.entry_date.split('T')[0] : '')}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="status-badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 800 }}>
                            {log.warehouse_name || 'Generic'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{log.operator_email || '-'}</td>
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
                      </tr>
                    ))}
                    {historyTab === 'inward' && getFilteredHistoryLogs().map((log) => (
                      <tr key={log.inward_id}>
                        <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                          {log.inward_entry_date ? log.inward_entry_date.split('T')[0] : ''}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="status-badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 800 }}>
                            {log.warehouse_name || 'Generic'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{log.operator_email || '-'}</td>
                        <td style={{ padding: '12px 16px', fontWeight: '700' }}>{log.inward_vehicle_no}</td>
                        <td style={{ padding: '12px 16px' }}>{log.inward_client_name}</td>
                        <td style={{ padding: '12px 16px' }}>{log.inward_dock_no || '-'}</td>
                        <td style={{ padding: '12px 16px' }}>{log.inward_vehicle_temp}°C</td>
                        <td style={{ padding: '12px 16px' }}>{log.inward_material_temp}°C</td>
                        <td style={{ padding: '12px 16px' }}>{log.inward_pallets_in_qty}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {log.inward_unloading_duration_hours || '0'}h {log.inward_unloading_duration_mins || '0'}m
                        </td>
                        <td style={{ padding: '12px 16px' }}>{log.inward_unloading_supervisor_name}</td>
                      </tr>
                    ))}
                    {historyTab === 'outward' && getFilteredHistoryLogs().map((log) => (
                      <tr key={log.outward_id}>
                        <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                          {log.outward_entry_date ? log.outward_entry_date.split('T')[0] : ''}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="status-badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 800 }}>
                            {log.warehouse_name || 'Generic'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{log.operator_email || '-'}</td>
                        <td style={{ padding: '12px 16px', fontWeight: '700' }}>{log.outward_vehicle_no}</td>
                        <td style={{ padding: '12px 16px' }}>{log.outward_client_name}</td>
                        <td style={{ padding: '12px 16px' }}>{log.outward_dock_no || '-'}</td>
                        <td style={{ padding: '12px 16px' }}>{log.outward_vehicle_temp}°C</td>
                        <td style={{ padding: '12px 16px' }}>{log.outward_material_temp}°C</td>
                        <td style={{ padding: '12px 16px' }}>{log.outward_pallets_in_qty || '-'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {log.outward_loading_duration_hours || '0'}h {log.outward_loading_duration_mins || '0'}m
                        </td>
                        <td style={{ padding: '12px 16px' }}>{log.outward_loading_supervisor_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                  {auditSubTab === 'activity_log' ? 'Operator Activity Audit Logs' : 'System Security & Permission Logs'}
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  {auditSubTab === 'activity_log' ? 'Real-time database operations audit trail' : 'Access control matrix & authentication security trail'}
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
              <div style={{ display: 'flex', gap: '8px' }}>
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
                  <span>Role & Permission Log</span>
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
              // Tab 1: Unified Activity & Security Logs
              (() => {
                const generalActivities = activities.filter(act => 
                  act.log_type !== 'PERMISSION' && 
                  act.log_type !== 'SECURITY'
                );

                const filteredActivities = generalActivities.filter(act => {
                  if (selectedWarehouseFilter === 'All') return true;
                  const operatorEmail = act.operator_email ? act.operator_email.toLowerCase() : '';
                  const wh = operatorWarehouseMap[operatorEmail];
                  if (selectedWarehouseFilter === 'System/Admin') {
                    return !wh || operatorEmail === 'system';
                  }
                  return wh === selectedWarehouseFilter;
                });

                const securityLogs = activities.filter(act => 
                  act.log_type === 'PERMISSION' || 
                  act.log_type === 'SECURITY'
                );

                const filteredSecurityLogs = securityLogs.filter(act => {
                  if (selectedWarehouseFilter === 'All') return true;
                  const operatorEmail = act.operator_email ? act.operator_email.toLowerCase() : '';
                  const wh = operatorWarehouseMap[operatorEmail];
                  if (selectedWarehouseFilter === 'System/Admin') {
                    return !wh || operatorEmail === 'system';
                  }
                  return wh === selectedWarehouseFilter;
                });

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* General Audit Logs */}
                    <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--text-dark)' }}>Operator Activity History Audit Logs</h3>
                      {filteredActivities.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                          <span>No operator activities found for the selected warehouse filter.</span>
                        </div>
                      ) : (
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
                              {filteredActivities.slice(0, 15).map((act) => {
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
                                    <td style={{ padding: '6px 8px', fontWeight: '700', color: '#0f172a' }}>{act.operator_email}</td>
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
                      )}
                    </div>

                    {/* Security & Access Logs */}
                    <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--text-dark)' }}>Recent Permission & Role Access Logs</h3>
                      {filteredSecurityLogs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                          <span>No permission or security logs found for the selected warehouse filter.</span>
                        </div>
                      ) : (
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
                              {filteredSecurityLogs.slice(0, 15).map((act) => {
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
                                    <td style={{ padding: '6px 8px', fontWeight: '700', color: '#0f172a' }}>{act.operator_email}</td>
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
                      )}
                    </div>
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
                                    const parsed = parseRequestDescription(pr.description);
                                    
                                    return (
                                      <tr key={pr.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '6px 8px', fontWeight: '700', color: '#0f172a' }}>{pr.operator_email}</td>
                                        <td style={{ padding: '6px 8px', color: '#475569', fontWeight: 600 }}>
                                          {operatorWarehouseMap[pr.operator_email ? pr.operator_email.toLowerCase() : ''] || 'System / Admin'}
                                        </td>
                                        <td style={{ padding: '6px 8px' }}>
                                          <span className="status-badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 700 }}>
                                            {parsed.module}
                                          </span>
                                        </td>
                                        <td style={{ padding: '6px 8px', color: '#475569', fontWeight: 700 }}>#{pr.record_id}</td>
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
                                            {pr.description.split(' | ')[0]}
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

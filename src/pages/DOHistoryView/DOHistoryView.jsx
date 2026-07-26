// ====================================================================
// DO History View Component (src/pages/DOHistoryView/DOHistoryView.jsx)
// Paired with: src/pages/DOHistoryView/DOHistoryView.css
// Unified temperature logs history view with tabs, search, filters & lightboxes.
// ====================================================================

import React, { useState, useEffect } from 'react';
import { 
  History, Search, Calendar, Trash2, X, Eye, 
  Thermometer, ArrowDownLeft, ArrowUpRight, Loader2, AlertCircle, Edit, Download 
} from 'lucide-react';
import { 
  fetchChamberLogs, deleteChamberLog, 
  fetchInwardLogs, deleteInwardLog, 
  fetchOutwardLogs, deleteOutwardLog,
  checkEditPermission, requestEditPermission,
  API_BASE_URL
} from '../../services/api';
import './DOHistoryView.css';

export default function DOHistoryView({ setActiveDOMenu, setEditInwardData, setEditOutwardData, setEditDailyData }) {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'inward' | 'outward'
  const [loading, setLoading] = useState(false);
  
  // Permission Request States & Handlers
  const [permissionModalData, setPermissionModalData] = useState({
    isOpen: false,
    recordType: '',
    recordId: null,
    log: null,
    action: 'Edit',
    status: 'None',
    proceedWithEdit: null
  });

  const handleEditAttempt = async (recordType, log, proceedWithEdit) => {
    const recordId = recordType === 'Chamber' ? log.id : (recordType === 'Inward' ? log.inward_id : log.outward_id);
    try {
      const res = await checkEditPermission(recordType, recordId, 'Edit');
      if (res.approved) {
        proceedWithEdit();
      } else {
        setPermissionModalData({
          isOpen: true,
          recordType,
          recordId,
          log,
          action: 'Edit',
          status: res.status || 'None',
          proceedWithEdit
        });
      }
    } catch (err) {
      console.error(err);
      alert('Error verifying edit permissions. Please try again.');
    }
  };

  const handleRequestPermission = async () => {
    try {
      const { recordType, recordId, action, log } = permissionModalData;
      const actionLabel = action === 'Delete' ? 'delete' : 'edit';
      
      let extraDetails = '';
      if (log) {
        if (recordType === 'Chamber') {
          const client = log.client_name || 'N/A';
          extraDetails = ` | Client: ${client} | Chamber: ${log.chamber_name || 'N/A'} | Temp: ${log.chamber_temp || 'N/A'}°C`;
        } else if (recordType === 'Inward') {
          const client = log.inward_client_name || 'N/A';
          extraDetails = ` | Client: ${client} | Vehicle: ${log.inward_vehicle_no || 'N/A'} | Temp: ${log.inward_material_temp || 'N/A'}°C`;
        } else if (recordType === 'Outward') {
          const client = log.outward_client_name || 'N/A';
          extraDetails = ` | Client: ${client} | Vehicle: ${log.outward_vehicle_no || 'N/A'} | Temp: ${log.outward_material_temp || 'N/A'}°C`;
        }
      }

      const descText = `Requested permission to ${actionLabel} ${recordType} log (ID: ${recordId})${extraDetails}`;
      const res = await requestEditPermission(
        recordType,
        recordId,
        descText,
        action || 'Edit'
      );
      setPermissionModalData(prev => ({
        ...prev,
        status: 'Pending'
      }));
      alert(res.message || 'Permission request sent successfully.');
    } catch (err) {
      alert(err.message || 'Failed to request permission.');
    }
  };
  
  // Data lists
  const [dailyLogs, setDailyLogs] = useState([]);
  const [inwardLogs, setInwardLogs] = useState([]);
  const [outwardLogs, setOutwardLogs] = useState([]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Applied filter state (only changed when clicking Find button)
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');

  // Helper to format today's date in YYYY-MM-DD
  const getTodayDateStr = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Handler to apply filters
  const handleFind = () => {
    const fromNum = parseDateToNumber(fromDate);
    const toNum = parseDateToNumber(toDate);
    const todayNum = parseInt(getTodayDateStr().replace(/-/g, ''), 10);

    if (fromNum && fromNum > todayNum) {
      alert("⚠️ Date Error:\n'From Date' cannot be in the future.");
      return;
    }
    if (toNum && toNum > todayNum) {
      alert("⚠️ Date Error:\n'To Date' cannot be in the future.");
      return;
    }
    if (fromNum && toNum && fromNum > toNum) {
      alert("⚠️ Date Range Error:\n'From Date' must be less than or equal to 'To Date'.");
      return;
    }
    setAppliedSearchTerm(searchTerm);
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
  };

  // Handler to export filtered logs to Excel (CSV format)
  const handleExportExcel = () => {
    if (filteredLogs.length === 0) {
      alert("No data available to export.");
      return;
    }

    let csvContent = "\uFEFF"; // UTF-8 BOM for correct Excel character loading

    if (activeTab === 'daily') {
      const headers = ["Date", "Chamber", "Client Name", "Inspection Time", "Temperature (°C)", "Supervisor", "Last Updated"];
      csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";

      filteredLogs.forEach(log => {
        const row = [
          formatDateStr(log.formatted_date || log.entry_date),
          log.chamber_name || '',
          log.client_name || '',
          log.inspection_time || '',
          log.chamber_temp !== undefined ? `${log.chamber_temp}°C` : '',
          log.monitor_supervisor_name || '',
          getUpdateDiff(log.created_at, log.updated_at) ? formatDateTimeStr(log.updated_at) : ''
        ];
        csvContent += row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",") + "\n";
      });
    } else if (activeTab === 'inward') {
      const headers = [
        "Date", "Vehicle No", "Seal No", "Client", "Transporter", "Driver Name", "Driver Contact", "Dock No", 
        "Reporting Time", "Vehicle Temp (°C)", "Material Temp (°C)", "Material Type", "Pallets Qty", 
        "Invoice Qty", "Received Pallets", "Received Boxes", "Short Boxes", "Excess Boxes", "Damage Boxes", 
        "Unloading Start", "Unloading End", "Unloading Duration", "Supervisor", "Remarks", "Last Updated"
      ];
      csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";

      filteredLogs.forEach(log => {
        const row = [
          formatDateStr(log.inward_entry_date),
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
          log.inward_remarks || '',
          getUpdateDiff(log.inward_created_at, log.inward_updated_at) ? formatDateTimeStr(log.inward_updated_at) : ''
        ];
        csvContent += row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",") + "\n";
      });
    } else if (activeTab === 'outward') {
      const headers = [
        "Date", "Vehicle No", "Seal No", "Client", "Transporter", "Driver Name", "Driver Contact", "Dock No", 
        "Reporting Time", "Vehicle Temp (°C)", "Material Temp (°C)", "Material Type", "Pallets Qty", 
        "Invoice Qty", "Loaded Pallets", "Loaded Boxes", "Short Loaded Boxes", "Excess Loaded Boxes", "Damage Boxes", 
        "Loading Start", "Loading End", "Loading Duration", "Supervisor", "Remarks", "Last Updated"
      ];
      csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";

      filteredLogs.forEach(log => {
        const row = [
          formatDateStr(log.outward_entry_date),
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
          log.outward_remarks || '',
          getUpdateDiff(log.outward_created_at, log.outward_updated_at) ? formatDateTimeStr(log.outward_updated_at) : ''
        ];
        csvContent += row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",") + "\n";
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const tabLabel = activeTab === 'daily' ? 'Daily_Chamber' : activeTab === 'inward' ? 'Inward_Logs' : 'Outward_Logs';
    const dateSuffix = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

    link.setAttribute("href", url);
    link.setAttribute("download", `ReeferON_${tabLabel}_Export_${dateSuffix}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Photo Lightbox state
  const [lightboxImg, setLightboxImg] = useState(null);

  // Load all logs on mount & tab change
  const loadLogs = async () => {
    setLoading(true);
    try {
      if (activeTab === 'daily') {
        const data = await fetchChamberLogs();
        setDailyLogs(data || []);
      } else if (activeTab === 'inward') {
        const data = await fetchInwardLogs();
        setInwardLogs(data || []);
      } else if (activeTab === 'outward') {
        const data = await fetchOutwardLogs();
        setOutwardLogs(data || []);
      }
    } catch (err) {
      console.error("Failed to load logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [activeTab]);

  // Handle Log Deletion
  const handleDeleteLog = async (log) => {
    const id = activeTab === 'daily' ? log.id : (activeTab === 'inward' ? log.inward_id : log.outward_id);
    const recordType = activeTab === 'daily' ? 'Chamber' : (activeTab === 'inward' ? 'Inward' : 'Outward');
    try {
      const res = await checkEditPermission(recordType, id, 'Delete');
      if (res.approved) {
        if (!window.confirm("Are you sure you want to delete this log entry?")) return;
        if (activeTab === 'daily') {
          await deleteChamberLog(id);
        } else if (activeTab === 'inward') {
          await deleteInwardLog(id);
        } else if (activeTab === 'outward') {
          await deleteOutwardLog(id);
        }
        loadLogs();
      } else {
        setPermissionModalData({
          isOpen: true,
          recordType,
          recordId: id,
          log,
          action: 'Delete',
          status: res.status || 'None',
          proceedWithEdit: async () => {
            if (activeTab === 'daily') {
              await deleteChamberLog(id);
            } else if (activeTab === 'inward') {
              await deleteInwardLog(id);
            } else if (activeTab === 'outward') {
              await deleteOutwardLog(id);
            }
            loadLogs();
          }
        });
      }
    } catch (err) {
      console.error(err);
      alert('Error verifying delete permissions. Please try again.');
    }
  };

  // Safe split date formatter to return DD-MM-YYYY format
  const formatDateStr = (dateVal) => {
    if (!dateVal) return '-';
    let cleanDate = '';
    if (typeof dateVal === 'string') {
      cleanDate = dateVal.split('T')[0];
    } else if (dateVal instanceof Date) {
      const yyyy = dateVal.getFullYear();
      const mm = String(dateVal.getMonth() + 1).padStart(2, '0');
      const dd = String(dateVal.getDate()).padStart(2, '0');
      cleanDate = `${yyyy}-${mm}-${dd}`;
    } else {
      try {
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          cleanDate = `${yyyy}-${mm}-${dd}`;
        } else {
          cleanDate = String(dateVal).split('T')[0];
        }
      } catch (e) {
        cleanDate = String(dateVal).split('T')[0];
      }
    }

    const parts = cleanDate.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`; // 'DD-MM-YYYY'
    }
    return cleanDate;
  };

  const formatDateTimeStr = (dateTimeVal) => {
    if (!dateTimeVal) return '';
    try {
      const d = new Date(dateTimeVal);
      if (isNaN(d.getTime())) return '';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      return `${dd}-${mm}-${yyyy} ${hh}:${min}:${ss}`;
    } catch (e) {
      return '';
    }
  };

  const getUpdateDiff = (created, updated) => {
    if (!created || !updated) return false;
    const cTime = Math.floor(new Date(created).getTime() / 1000);
    const uTime = Math.floor(new Date(updated).getTime() / 1000);
    return uTime > cTime;
  };

  // Helper to format image paths
  const getFullImgPath = (path) => {
    if (!path) return null;
    const cleanBase = API_BASE_URL.replace('/api', '');
    if (cleanBase) {
      return `${cleanBase}/${path}`;
    }
    return `/${path}`;
  };

  // Helper to convert DD-MM-YYYY to YYYYMMDD number for easy comparison
  const parseDateToNumber = (ddMMyyyyStr) => {
    if (!ddMMyyyyStr) return null;
    const parts = ddMMyyyyStr.split('-');
    if (parts.length !== 3) return null;
    const dd = parts[0].padStart(2, '0');
    const mm = parts[1].padStart(2, '0');
    const yyyy = parts[2];
    if (yyyy.length < 4) return null; // Wait for full year typing
    return parseInt(`${yyyy}${mm}${dd}`, 10);
  };

  // Helper to convert raw DB date (string/Date object) to YYYYMMDD number
  const rawDateToNumber = (rawDate) => {
    if (!rawDate) return 0;
    let datePart = '';
    if (typeof rawDate === 'string') {
      datePart = rawDate.split('T')[0]; // "YYYY-MM-DD"
    } else if (rawDate instanceof Date) {
      const yyyy = rawDate.getFullYear();
      const mm = String(rawDate.getMonth() + 1).padStart(2, '0');
      const dd = String(rawDate.getDate()).padStart(2, '0');
      datePart = `${yyyy}-${mm}-${dd}`;
    } else {
      try {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          datePart = `${yyyy}-${mm}-${dd}`;
        }
      } catch (e) {}
    }
    if (!datePart) return 0;
    const parts = datePart.split('-');
    if (parts.length !== 3) return 0;
    return parseInt(`${parts[0]}${parts[1]}${parts[2]}`, 10);
  };

  // Filtered lists logic
  const getFilteredLogs = () => {
    const term = appliedSearchTerm.toLowerCase();
    const fromNum = parseDateToNumber(appliedFromDate);
    const toNum = parseDateToNumber(appliedToDate);

    const matchDateRange = (rawDate) => {
      const logNum = rawDateToNumber(rawDate);
      if (!logNum) return true; // fallback if no date
      if (fromNum && toNum) {
        return logNum >= fromNum && logNum <= toNum;
      }
      if (fromNum) {
        return logNum >= fromNum;
      }
      if (toNum) {
        return logNum <= toNum;
      }
      return true;
    };

    if (activeTab === 'daily') {
      return dailyLogs.filter(log => {
        const matchSearch = 
          (log.client_name || '').toLowerCase().includes(term) ||
          (log.chamber_name || '').toLowerCase().includes(term) ||
          (log.monitor_supervisor_name || '').toLowerCase().includes(term);
        const matchDate = matchDateRange(log.entry_date);
        return matchSearch && matchDate;
      });
    } else if (activeTab === 'inward') {
      return inwardLogs.filter(log => {
        const matchSearch = 
          (log.inward_client_name || '').toLowerCase().includes(term) ||
          (log.inward_vehicle_no || '').toLowerCase().includes(term) ||
          (log.inward_unloading_supervisor_name || '').toLowerCase().includes(term) ||
          (log.inward_transporter_name || '').toLowerCase().includes(term);
        const matchDate = matchDateRange(log.inward_entry_date);
        return matchSearch && matchDate;
      });
    } else {
      return outwardLogs.filter(log => {
        const matchSearch = 
          (log.outward_client_name || '').toLowerCase().includes(term) ||
          (log.outward_vehicle_no || '').toLowerCase().includes(term) ||
          (log.outward_loading_supervisor_name || '').toLowerCase().includes(term) ||
          (log.outward_transporter_name || '').toLowerCase().includes(term);
        const matchDate = matchDateRange(log.outward_entry_date);
        return matchSearch && matchDate;
      });
    }
  };

  const filteredLogs = getFilteredLogs();

  return (
    <div className="temp-monitor-page do-history-page">
      {/* 1. Header Banner */}
      <div className="do-header-banner">
        <div className="do-header-left">
          <h2>
            <History size={26} color="#00a2e8" />
            <span>DO Temperature Log History</span>
          </h2>
          <p>
            View, search, filter and audit all past daily chamber temperature, inward shipment, and outward shipment logs.
          </p>
        </div>
      </div>

      {/* 2. Tabs & Filters Control Panel */}
      <div className="history-control-card">
        {/* Navigation Tabs */}
        <div className="history-tabs">
          <button 
            className={`history-tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
            onClick={() => { 
              setActiveTab('daily'); 
              setSearchTerm(''); setFromDate(''); setToDate(''); 
              setAppliedSearchTerm(''); setAppliedFromDate(''); setAppliedToDate('');
            }}
          >
            <Thermometer size={16} />
            <span>Daily Chamber Logs</span>
          </button>
          <button 
            className={`history-tab-btn ${activeTab === 'inward' ? 'active' : ''}`}
            onClick={() => { 
              setActiveTab('inward'); 
              setSearchTerm(''); setFromDate(''); setToDate(''); 
              setAppliedSearchTerm(''); setAppliedFromDate(''); setAppliedToDate('');
            }}
          >
            <ArrowDownLeft size={16} />
            <span>Inward Logs</span>
          </button>
          <button 
            className={`history-tab-btn ${activeTab === 'outward' ? 'active' : ''}`}
            onClick={() => { 
              setActiveTab('outward'); 
              setSearchTerm(''); setFromDate(''); setToDate(''); 
              setAppliedSearchTerm(''); setAppliedFromDate(''); setAppliedToDate('');
            }}
          >
            <ArrowUpRight size={16} />
            <span>Outward Logs</span>
          </button>
        </div>

        {/* Search and Filters Bar */}
        <div className="history-filters-bar">
          <div className="filter-input-group search-group">
            <Search size={16} className="filter-icon" />
            <input 
              type="text" 
              placeholder={
                activeTab === 'daily' 
                  ? "Search by Client, Chamber, Supervisor..." 
                  : "Search by Client, Vehicle No, Transporter..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFind();
              }}
            />
          </div>

          <div className="filter-input-group date-group">
            <Calendar size={16} className="filter-icon" />
            <input 
              type="date" 
              placeholder="From Date"
              className={fromDate ? 'has-value' : 'empty-date'}
              style={{ cursor: 'pointer' }}
              value={fromDate ? fromDate.split('-').reverse().join('-') : ''}
              max={toDate ? (
                // Use minimum of toDate and today
                parseDateToNumber(toDate) < parseDateToNumber(getTodayDateStr().split('-').reverse().join('-')) 
                  ? toDate.split('-').reverse().join('-') 
                  : getTodayDateStr()
              ) : getTodayDateStr()}
              onClick={(e) => {
                if (typeof e.target.showPicker === 'function') {
                  try { e.target.showPicker(); } catch (err) {}
                }
              }}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  setFromDate('');
                  setAppliedFromDate('');
                  return;
                }
                const [yyyy, mm, dd] = val.split('-');
                setFromDate(`${dd}-${mm}-${yyyy}`);
              }}
            />
            {fromDate && (
              <button className="clear-date-btn" onClick={() => { setFromDate(''); setAppliedFromDate(''); }}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="filter-input-group date-group">
            <Calendar size={16} className="filter-icon" />
            <input 
              type="date" 
              placeholder="To Date"
              className={toDate ? 'has-value' : 'empty-date'}
              style={{ cursor: 'pointer' }}
              value={toDate ? toDate.split('-').reverse().join('-') : ''}
              min={fromDate ? fromDate.split('-').reverse().join('-') : undefined}
              max={getTodayDateStr()}
              onClick={(e) => {
                if (typeof e.target.showPicker === 'function') {
                  try { e.target.showPicker(); } catch (err) {}
                }
              }}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  setToDate('');
                  setAppliedToDate('');
                  return;
                }
                const [yyyy, mm, dd] = val.split('-');
                setToDate(`${dd}-${mm}-${yyyy}`);
              }}
            />
            {toDate && (
              <button className="clear-date-btn" onClick={() => { setToDate(''); setAppliedToDate(''); }}>
                <X size={14} />
              </button>
            )}
          </div>

          <button 
            className="btn-find" 
            onClick={handleFind}
            style={{ 
              backgroundColor: 'var(--primary)', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: 'var(--radius-sm)', 
              height: '40px', 
              padding: '0 20px', 
              fontWeight: 700, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <Search size={16} />
            <span>Find</span>
          </button>

          <button 
            className="btn-export" 
            onClick={handleExportExcel}
            style={{ 
              backgroundColor: '#22c55e', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: 'var(--radius-sm)', 
              height: '40px', 
              padding: '0 20px', 
              fontWeight: 700, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            title="Export filtered records to Excel"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 3. History Logs List Table */}
      <div className="inward-history-card">
        <div className="direct-form-header">
          <h3>
            <History size={18} color="#00a2e8" />
            <span>
              {activeTab === 'daily' && 'Daily Chamber Logs'}
              {activeTab === 'inward' && 'Inward Shipments Logs'}
              {activeTab === 'outward' && 'Outward Shipments Logs'}
            </span>
          </h3>
        </div>

        {loading ? (
          <div className="loading-logs">
            <Loader2 size={28} className="spinner-icon" color="#00a2e8" />
            <span>Loading history database logs...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="no-logs">
            <AlertCircle size={32} color="#94a3b8" />
            <p>No temperature logs found matching the filter criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="logs-table inward-table">
              <thead>
                {activeTab === 'daily' && (
                  <tr>
                    <th>Date</th>
                    <th>Chamber</th>
                    <th>Client Name</th>
                    <th>Inspection Time</th>
                    <th>Temp (°C)</th>
                    <th>Supervisor</th>
                    <th>Actions</th>
                  </tr>
                )}
                {activeTab === 'inward' && (
                  <tr>
                    <th>Date</th>
                    <th>Vehicle No</th>
                    <th className="wrap-text">Client</th>
                    <th>Inward Vehicle Temp</th>
                    <th>Inward Material Temp</th>
                    <th>Pallets</th>
                    <th>Unloading Time</th>
                    <th className="wrap-text">Supervisor</th>
                    <th>Actions</th>
                  </tr>
                )}
                {activeTab === 'outward' && (
                  <tr>
                    <th>Date</th>
                    <th>Vehicle No</th>
                    <th className="wrap-text">Client</th>
                    <th>Outward Vehicle Temp</th>
                    <th>Outward Material Temp</th>
                    <th>Pallets</th>
                    <th>Loading Time</th>
                    <th className="wrap-text">Supervisor</th>
                    <th>Actions</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {activeTab === 'daily' && filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <strong>{formatDateStr(log.formatted_date || log.entry_date)}</strong>
                      {getUpdateDiff(log.created_at, log.updated_at) && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap' }} title="Last Updated">
                          Upd: {formatDateTimeStr(log.updated_at)}
                        </div>
                      )}
                    </td>
                    <td><span className="status-badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 800 }}>{log.chamber_name}</span></td>
                    <td>{log.client_name || '-'}</td>
                    <td>{log.inspection_time || '-'}</td>
                    <td>
                      <span className="status-badge" style={{ 
                        backgroundColor: log.chamber_temp <= -18 ? '#dcfce7' : '#fee2e2', 
                        color: log.chamber_temp <= -18 ? '#15803d' : '#b91c1c', 
                        fontWeight: 800 
                      }}>
                        {log.chamber_temp}°C
                      </span>
                    </td>
                    <td>{log.monitor_supervisor_name || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button 
                          className="btn-edit-log"
                          onClick={() => handleEditAttempt('Chamber', log, () => {
                            setEditDailyData(log);
                            setActiveDOMenu('All');
                          })}
                          title="Edit Entry"
                          style={{ backgroundColor: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1', padding: '6px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Edit size={15} />
                        </button>
                        <button 
                          className="btn-delete-log"
                          onClick={() => handleDeleteLog(log)}
                          title="Delete Entry"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {activeTab === 'inward' && filteredLogs.map((log) => (
                  <tr key={log.inward_id}>
                    <td>
                      <strong>{formatDateStr(log.inward_entry_date)}</strong>
                      {getUpdateDiff(log.inward_created_at, log.inward_updated_at) && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap' }} title="Last Updated">
                          Upd: {formatDateTimeStr(log.inward_updated_at)}
                        </div>
                      )}
                    </td>
                    <td><strong>{log.inward_vehicle_no}</strong></td>
                    <td className="wrap-text">{log.inward_client_name}</td>
                    <td>{log.inward_vehicle_temp}°C</td>
                    <td>{log.inward_material_temp}°C</td>
                    <td>{log.inward_pallets_in_qty}</td>
                    <td>
                      <div style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        <div>S: {log.inward_unloading_start_time || '-'}</div>
                        <div>E: {log.inward_unloading_end_time || '-'}</div>
                        <div style={{ color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>
                          Dur: {log.inward_unloading_duration_hours || '0'}h {log.inward_unloading_duration_mins || '0'}m
                        </div>
                      </div>
                    </td>
                    <td className="wrap-text">{log.inward_unloading_supervisor_name}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button 
                          className="btn-edit-log"
                          onClick={() => handleEditAttempt('Inward', log, () => {
                            setEditInwardData(log);
                            setActiveDOMenu('Inward');
                          })}
                          title="Edit Entry"
                          style={{ backgroundColor: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1', padding: '6px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Edit size={15} />
                        </button>
                        <button 
                          className="btn-delete-log"
                          onClick={() => handleDeleteLog(log)}
                          title="Delete Entry"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {activeTab === 'outward' && filteredLogs.map((log) => (
                  <tr key={log.outward_id}>
                    <td>
                      <strong>{formatDateStr(log.outward_entry_date)}</strong>
                      {getUpdateDiff(log.outward_created_at, log.outward_updated_at) && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap' }} title="Last Updated">
                          Upd: {formatDateTimeStr(log.outward_updated_at)}
                        </div>
                      )}
                    </td>
                    <td><strong>{log.outward_vehicle_no}</strong></td>
                    <td className="wrap-text">{log.outward_client_name}</td>
                    <td>{log.outward_vehicle_temp}°C</td>
                    <td>{log.outward_material_temp}°C</td>
                    <td>{log.outward_pallets_in_qty || '-'}</td>
                    <td>
                      <div style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        <div>S: {log.outward_loading_start_time || '-'}</div>
                        <div>E: {log.outward_loading_end_time || '-'}</div>
                        <div style={{ color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>
                          Dur: {log.outward_loading_duration_hours || '0'}h {log.outward_loading_duration_mins || '0'}m
                        </div>
                      </div>
                    </td>
                    <td className="wrap-text">{log.outward_loading_supervisor_name}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button 
                          className="btn-edit-log"
                          onClick={() => handleEditAttempt('Outward', log, () => {
                            setEditOutwardData(log);
                            setActiveDOMenu('Outward');
                          })}
                          title="Edit Entry"
                          style={{ backgroundColor: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1', padding: '6px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Edit size={15} />
                        </button>
                        <button 
                          className="btn-delete-log"
                          onClick={() => handleDeleteLog(log)}
                          title="Delete Entry"
                        >
                          <Trash2 size={15} />
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

      {/* 4. Lightbox View Modal */}
      {lightboxImg && (
        <div className="lightbox-overlay" onClick={() => setLightboxImg(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightboxImg(null)}>
              <X size={24} />
            </button>
            <img src={lightboxImg} alt="Enlarged Audit Attachment" />
          </div>
        </div>
      )}

      {/* 5. Permission Verification & Request Modal */}
      {permissionModalData.isOpen && (
        <div className="lightbox-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: '450px', width: '90%', padding: '24px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} color="#eab308" />
                <span>Permission Required</span>
              </h3>
              <button 
                onClick={() => setPermissionModalData(prev => ({ ...prev, isOpen: false }))} 
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              <p style={{ fontWeight: '700', color: '#b45309', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', padding: '12px', borderRadius: 'var(--radius-sm)', margin: '0 0 14px 0' }}>
                If you want to {permissionModalData.action === 'Delete' ? 'delete' : 'edit'} this data, first get permission from admin.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '14px' }}>
                <div><strong>Record Type:</strong> {permissionModalData.recordType} DO Log</div>
                <div><strong>Record ID:</strong> #{permissionModalData.recordId}</div>
                <div><strong>Action Attempted:</strong> {permissionModalData.action || 'Edit'}</div>
                <div><strong>Current Request Status:</strong> 
                  <span style={{ 
                    marginLeft: '6px', 
                    fontWeight: 800, 
                    color: permissionModalData.status === 'Pending' ? '#ca8a04' : (permissionModalData.status === 'Denied' ? '#dc2626' : '#16a34a') 
                  }}>
                    {permissionModalData.status === 'None' ? 'Not Requested' : permissionModalData.status}
                  </span>
                </div>
              </div>

              {permissionModalData.status === 'Pending' ? (
                <p style={{ fontWeight: '600', color: '#ca8a04', margin: 0 }}>
                  Your request is already pending admin approval. Please wait for the admin to grant access.
                </p>
              ) : (
                <p style={{ fontWeight: '600', color: 'var(--text-dark)', margin: 0 }}>
                  Do you want to send a {permissionModalData.action === 'Delete' ? 'delete' : 'edit'} request to the admin?
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button 
                type="button" 
                onClick={() => setPermissionModalData(prev => ({ ...prev, isOpen: false }))} 
                style={{
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  backgroundColor: '#ffffff',
                  color: 'var(--text-dark)',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Back
              </button>

              {(permissionModalData.status === 'None' || permissionModalData.status === 'Denied') && (
                <button 
                  type="button" 
                  onClick={handleRequestPermission}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: '#ea580c',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(234, 88, 12, 0.25)'
                  }}
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

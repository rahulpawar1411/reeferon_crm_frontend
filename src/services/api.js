// ====================================================================
// Frontend API Service Layer (src/services/api.js)
// Supports FormData Image Uploads for Daily Chamber Temp Logs.
// ====================================================================

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Globally override fetch to enforce HttpOnly Cookies credentials passing in development & production
const originalFetch = window.fetch;
window.fetch = function (url, options = {}) {
  options.credentials = 'include';
  return originalFetch(url, options);
};

// In-memory fallback for Chamber Logs
let fallbackChamberLogs = [];

// ====================================================================
// 1. Daily Chamber Temperature Monitoring APIs
// ====================================================================
export const fetchChamberLogs = async (search = '') => {
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_BASE_URL}/chamber-temp${query}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {}
  let result = [...fallbackChamberLogs];
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(l => 
      (l.client_name && l.client_name.toLowerCase().includes(q)) ||
      (l.chamber_name && l.chamber_name.toLowerCase().includes(q)) ||
      (l.inspection_time && l.inspection_time.toLowerCase().includes(q)) ||
      (l.monitor_supervisor_name && l.monitor_supervisor_name.toLowerCase().includes(q))
    );
  }
  return result;
};

export const addChamberLog = async (logData) => {
  try {
    let bodyData;
    let headers = {};

    if (logData instanceof FormData) {
      bodyData = logData; // Multer FormData with image
    } else {
      bodyData = JSON.stringify(logData);
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE_URL}/chamber-temp`, {
      method: 'POST',
      headers,
      body: bodyData
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  const newEntry = {
    id: Date.now(),
    entry_date: logData.entry_date || new Date().toISOString().split('T')[0],
    client_name: logData.client_name || '',
    chamber_name: logData.chamber_name || '',
    inspection_time: logData.inspection_time || '11:00 AM',
    chamber_temp: parseFloat(logData.chamber_temp || 0),
    monitor_supervisor_name: logData.monitor_supervisor_name || '',
    chamber_image: null,
    created_at: new Date().toISOString()
  };
  fallbackChamberLogs.unshift(newEntry);
  return { id: newEntry.id, message: 'Saved (local)' };
};

export const updateChamberLog = async (id, updateData) => {
  try {
    let bodyData;
    let headers = {};

    if (updateData instanceof FormData) {
      bodyData = updateData;
    } else {
      bodyData = JSON.stringify(updateData);
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE_URL}/chamber-temp/${id}`, {
      method: 'PUT',
      headers,
      body: bodyData
    });
    if (res.ok) return await res.json();
  } catch (err) {}
  const item = fallbackChamberLogs.find(l => l.id == id);
  if (item) {
    if (updateData.chamber_name) item.chamber_name = updateData.chamber_name;
    if (updateData.inspection_time) item.inspection_time = updateData.inspection_time;
    if (updateData.chamber_temp !== undefined) item.chamber_temp = updateData.chamber_temp !== '' ? parseFloat(updateData.chamber_temp) : null;
    if (updateData.monitor_supervisor_name) item.monitor_supervisor_name = updateData.monitor_supervisor_name;
  }
  return { message: 'Updated (local)' };
};

export const deleteChamberLog = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/chamber-temp/${id}`, { method: 'DELETE' });
    if (res.ok) return await res.json();
  } catch (err) {}
  fallbackChamberLogs = fallbackChamberLogs.filter(l => l.id != id);
  return { message: 'Deleted (local)' };
};

// ====================================================================
// Inward DO Logs APIs
// ====================================================================
let fallbackInwardLogs = [];

export const fetchInwardLogs = async (search = '') => {
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_BASE_URL}/inward-logs${query}`);
    if (res.ok) return await res.json();
  } catch (err) {}
  let list = [...fallbackInwardLogs];
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(l => 
      (l.inward_vehicle_no && l.inward_vehicle_no.toLowerCase().includes(q)) ||
      (l.inward_client_name && l.inward_client_name.toLowerCase().includes(q))
    );
  }
  return list;
};

export const addInwardLog = async (formData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/inward-logs`, {
      method: 'POST',
      body: formData
    });
    if (res.ok) return await res.json();
  } catch (err) {}
  
  // Local fallback entry mapping
  const newLog = {
    inward_id: Date.now(),
    inward_entry_date: formData.get('inward_entry_date'),
    inward_vehicle_no: formData.get('inward_vehicle_no'),
    inward_client_name: formData.get('inward_client_name'),
    inward_seal_no: formData.get('inward_seal_no'),
    inward_vehicle_temp: formData.get('inward_vehicle_temp'),
    inward_material_temp: formData.get('inward_material_temp'),
    inward_transporter_name: formData.get('inward_transporter_name'),
    inward_driver_name: formData.get('inward_driver_name'),
    inward_driver_no: formData.get('inward_driver_no'),
    inward_dock_no: formData.get('inward_dock_no'),
    inward_vehicle_reporting_time: formData.get('inward_vehicle_reporting_time'),
    inward_unloading_start_time: formData.get('inward_unloading_start_time'),
    inward_unloading_duration_hours: formData.get('inward_unloading_duration_hours'),
    inward_unloading_duration_mins: formData.get('inward_unloading_duration_mins'),
    inward_unloading_end_time: formData.get('inward_unloading_end_time'),
    inward_pallets_in_qty: formData.get('inward_pallets_in_qty') || 0,
    inward_invoice_qty: formData.get('inward_invoice_qty') || 0,
    inward_received_qty: formData.get('inward_received_qty') || 0,
    inward_received_boxes_qty: formData.get('inward_received_boxes_qty') || 0,
    inward_short_received_boxes_qty: formData.get('inward_short_received_boxes_qty') || 0,
    inward_excess_received_boxes_qty: formData.get('inward_excess_received_boxes_qty') || 0,
    inward_damage_received_boxes_qty: formData.get('inward_damage_received_boxes_qty') || 0,
    inward_material_type: formData.get('inward_material_type'),
    inward_unloading_supervisor_name: formData.get('inward_unloading_supervisor_name'),
    inward_remarks: formData.get('inward_remarks'),
    inward_vehicle_back_side_photo: formData.get('inward_vehicle_back_side_photo'),
    inward_vehicle_back_side_photo_with_material: formData.get('inward_vehicle_back_side_photo_with_material'),
    inward_count_sheet_photo: formData.get('inward_count_sheet_photo')
  };
  fallbackInwardLogs.unshift(newLog);
  return { id: newLog.inward_id, message: 'Saved (local)' };
};

export const deleteInwardLog = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/inward-logs/${id}`, { method: 'DELETE' });
    if (res.ok) return await res.json();
  } catch (err) {}
  fallbackInwardLogs = fallbackInwardLogs.filter(l => l.inward_id != id);
  return { message: 'Deleted (local)' };
};

export const updateInwardLog = async (id, formData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/inward-logs/${id}`, {
      method: 'PUT',
      body: formData
    });
    if (res.ok) return await res.json();
  } catch (err) {}
  
  // Local fallback entry mapping
  const idx = fallbackInwardLogs.findIndex(l => l.inward_id == id);
  if (idx !== -1) {
    const updated = {
      inward_id: id,
      inward_entry_date: formData.get('inward_entry_date'),
      inward_vehicle_no: formData.get('inward_vehicle_no'),
      inward_client_name: formData.get('inward_client_name'),
      inward_seal_no: formData.get('inward_seal_no'),
      inward_vehicle_temp: formData.get('inward_vehicle_temp'),
      inward_material_temp: formData.get('inward_material_temp'),
      inward_transporter_name: formData.get('inward_transporter_name'),
      inward_driver_name: formData.get('inward_driver_name'),
      inward_driver_no: formData.get('inward_driver_no'),
      inward_dock_no: formData.get('inward_dock_no'),
      inward_vehicle_reporting_time: formData.get('inward_vehicle_reporting_time'),
      inward_unloading_start_time: formData.get('inward_unloading_start_time'),
      inward_unloading_duration_hours: formData.get('inward_unloading_duration_hours'),
      inward_unloading_duration_mins: formData.get('inward_unloading_duration_mins'),
      inward_unloading_end_time: formData.get('inward_unloading_end_time'),
      inward_pallets_in_qty: formData.get('inward_pallets_in_qty') || 0,
      inward_invoice_qty: formData.get('inward_invoice_qty') || 0,
      inward_received_qty: formData.get('inward_received_qty') || 0,
      inward_received_boxes_qty: formData.get('inward_received_boxes_qty') || 0,
      inward_short_received_boxes_qty: formData.get('inward_short_received_boxes_qty') || 0,
      inward_excess_received_boxes_qty: formData.get('inward_excess_received_boxes_qty') || 0,
      inward_damage_received_boxes_qty: formData.get('inward_damage_received_boxes_qty') || 0,
      inward_material_type: formData.get('inward_material_type'),
      inward_unloading_supervisor_name: formData.get('inward_unloading_supervisor_name'),
      inward_remarks: formData.get('inward_remarks')
    };
    fallbackInwardLogs[idx] = updated;
  }
  return { message: 'Updated (local)' };
};

// ====================================================================
// Outward DO Logs APIs
// ====================================================================
let fallbackOutwardLogs = [];

export const fetchOutwardLogs = async (search = '') => {
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_BASE_URL}/outward-logs${query}`);
    if (res.ok) return await res.json();
  } catch (err) {}
  let list = [...fallbackOutwardLogs];
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(l => 
      (l.outward_vehicle_no && l.outward_vehicle_no.toLowerCase().includes(q)) ||
      (l.outward_client_name && l.outward_client_name.toLowerCase().includes(q))
    );
  }
  return list;
};

export const addOutwardLog = async (formData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/outward-logs`, {
      method: 'POST',
      body: formData
    });
    if (res.ok) return await res.json();
  } catch (err) {}
  
  // Local fallback entry mapping
  const newLog = {
    outward_id: Date.now(),
    outward_entry_date: formData.get('outward_entry_date'),
    outward_vehicle_no: formData.get('outward_vehicle_no'),
    outward_client_name: formData.get('outward_client_name'),
    outward_seal_no: formData.get('outward_seal_no'),
    outward_vehicle_temp: formData.get('outward_vehicle_temp'),
    outward_material_temp: formData.get('outward_material_temp'),
    outward_transporter_name: formData.get('outward_transporter_name'),
    outward_driver_name: formData.get('outward_driver_name'),
    outward_driver_no: formData.get('outward_driver_no'),
    outward_dock_no: formData.get('outward_dock_no'),
    outward_vehicle_reporting_time: formData.get('outward_vehicle_reporting_time'),
    outward_loading_start_time: formData.get('outward_loading_start_time'),
    outward_loading_duration_hours: formData.get('outward_loading_duration_hours'),
    outward_loading_duration_mins: formData.get('outward_loading_duration_mins'),
    outward_loading_end_time: formData.get('outward_loading_end_time'),
    outward_pallets_in_qty: formData.get('outward_pallets_in_qty') || 0,
    outward_invoice_qty: formData.get('outward_invoice_qty') || 0,
    outward_received_qty: formData.get('outward_received_qty') || 0,
    outward_received_boxes_qty: formData.get('outward_received_boxes_qty') || 0,
    outward_short_received_boxes_qty: formData.get('outward_short_received_boxes_qty') || 0,
    outward_excess_received_boxes_qty: formData.get('outward_excess_received_boxes_qty') || 0,
    outward_damage_received_boxes_qty: formData.get('outward_damage_received_boxes_qty') || 0,
    outward_material_type: formData.get('outward_material_type'),
    outward_loading_supervisor_name: formData.get('outward_loading_supervisor_name'),
    outward_remarks: formData.get('outward_remarks'),
    outward_vehicle_back_side_photo: formData.get('outward_vehicle_back_side_photo'),
    outward_vehicle_back_side_photo_with_material: formData.get('outward_vehicle_back_side_photo_with_material'),
    outward_count_sheet_photo: formData.get('outward_count_sheet_photo')
  };
  fallbackOutwardLogs.unshift(newLog);
  return { id: newLog.outward_id, message: 'Saved (local)' };
};

export const deleteOutwardLog = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/outward-logs/${id}`, { method: 'DELETE' });
    if (res.ok) return await res.json();
  } catch (err) {}
  fallbackOutwardLogs = fallbackOutwardLogs.filter(l => l.outward_id != id);
  return { message: 'Deleted (local)' };
};

export const updateOutwardLog = async (id, formData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/outward-logs/${id}`, {
      method: 'PUT',
      body: formData
    });
    if (res.ok) return await res.json();
  } catch (err) {}
  
  // Local fallback entry mapping
  const idx = fallbackOutwardLogs.findIndex(l => l.outward_id == id);
  if (idx !== -1) {
    const updated = {
      outward_id: id,
      outward_entry_date: formData.get('outward_entry_date'),
      outward_vehicle_no: formData.get('outward_vehicle_no'),
      outward_client_name: formData.get('outward_client_name'),
      outward_seal_no: formData.get('outward_seal_no'),
      outward_vehicle_temp: formData.get('outward_vehicle_temp'),
      outward_material_temp: formData.get('outward_material_temp'),
      outward_transporter_name: formData.get('outward_transporter_name'),
      outward_driver_name: formData.get('outward_driver_name'),
      outward_driver_no: formData.get('outward_driver_no'),
      outward_dock_no: formData.get('outward_dock_no'),
      outward_vehicle_reporting_time: formData.get('outward_vehicle_reporting_time'),
      outward_loading_start_time: formData.get('outward_loading_start_time'),
      outward_loading_duration_hours: formData.get('outward_loading_duration_hours'),
      outward_loading_duration_mins: formData.get('outward_loading_duration_mins'),
      outward_loading_end_time: formData.get('outward_loading_end_time'),
      outward_pallets_in_qty: formData.get('outward_pallets_in_qty') || 0,
      outward_invoice_qty: formData.get('outward_invoice_qty') || 0,
      outward_received_qty: formData.get('outward_received_qty') || 0,
      outward_received_boxes_qty: formData.get('outward_received_boxes_qty') || 0,
      outward_short_received_boxes_qty: formData.get('outward_short_received_boxes_qty') || 0,
      outward_excess_received_boxes_qty: formData.get('outward_excess_received_boxes_qty') || 0,
      outward_damage_received_boxes_qty: formData.get('outward_damage_received_boxes_qty') || 0,
      outward_material_type: formData.get('outward_material_type'),
      outward_loading_supervisor_name: formData.get('outward_loading_supervisor_name'),
      outward_remarks: formData.get('outward_remarks')
    };
    fallbackOutwardLogs[idx] = updated;
  }
  return { message: 'Updated (local)' };
};

// ====================================================================
// 2. Legacy Inward & Outward DO Logs APIs
// ====================================================================
let fallbackTempLogs = [];

export const fetchTempLogs = async (type = 'All', search = '') => {
  try {
    const query = `?type=${encodeURIComponent(type)}&search=${encodeURIComponent(search)}`;
    const res = await fetch(`${API_BASE_URL}/temp-logs${query}`);
    if (res.ok) return await res.json();
  } catch (err) {}
  let res = [...fallbackTempLogs];
  if (type && type !== 'All') {
    res = res.filter(l => l.entry_type === type);
  }
  if (search) {
    const q = search.toLowerCase();
    res = res.filter(l => 
      (l.container_number && l.container_number.toLowerCase().includes(q)) ||
      (l.client_name && l.client_name.toLowerCase().includes(q))
    );
  }
  return res;
};

export const addTempLog = async (logData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/temp-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    });
    if (res.ok) return await res.json();
  } catch (err) {}
  const newLog = { id: Date.now(), ...logData, created_at: new Date().toISOString() };
  fallbackTempLogs.unshift(newLog);
  return { id: newLog.id, message: 'Saved (local)', success: true };
};

export const createTempLog = addTempLog;

export const deleteTempLog = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/temp-logs/${id}`, { method: 'DELETE' });
    if (res.ok) return await res.json();
  } catch (err) {}
  fallbackTempLogs = fallbackTempLogs.filter(l => l.id != id);
  return { message: 'Deleted (local)' };
};

// ====================================================================
// 3. Sales Leads APIs
// ====================================================================
let fallbackLeads = [];

export const fetchLeads = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/leads`);
    if (res.ok) return await res.json();
  } catch (err) {}
  return fallbackLeads;
};

export const addLead = async (leadData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData)
    });
    if (res.ok) return await res.json();
  } catch (err) {}
  const newLead = { id: Date.now(), ...leadData, status: 'New', created_at: new Date().toISOString() };
  fallbackLeads.unshift(newLead);
  return { id: newLead.id, message: 'Saved (local)' };
};

export const createLead = addLead;

export const updateLeadStatus = async (id, status) => {
  try {
    const res = await fetch(`${API_BASE_URL}/leads/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) return await res.json();
  } catch (err) {}
  const lead = fallbackLeads.find(l => l.id == id);
  if (lead) lead.status = status;
  return { message: 'Updated (local)' };
};

export const updateLead = async (id, data) => {
  if (typeof data === 'string') {
    return updateLeadStatus(id, data);
  }
  const lead = fallbackLeads.find(l => l.id == id);
  if (lead) Object.assign(lead, data);
  return { message: 'Updated (local)' };
};

export const deleteLead = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/leads/${id}`, { method: 'DELETE' });
    if (res.ok) return await res.json();
  } catch (err) {}
  fallbackLeads = fallbackLeads.filter(l => l.id != id);
  return { message: 'Deleted (local)' };
};

// ====================================================================
// 4. Sales Dashboard Summary APIs
// ====================================================================
export const fetchDashboardStats = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/dashboard`);
    if (res.ok) return await res.json();
  } catch (err) {}
  return {
    totalLeads: fallbackLeads.length,
    newLeads: fallbackLeads.filter(l => l.status === 'New').length,
    inProgress: fallbackLeads.filter(l => l.status === 'In-Progress' || l.status === 'Contacted').length,
    wonLeads: fallbackLeads.filter(l => l.status === 'Won').length,
    recentLeads: fallbackLeads.slice(0, 5)
  };
};

// ====================================================================
// 5. Data Operator CRUD APIs (Super Admin only)
// ====================================================================
export const fetchOperators = async () => {
  const res = await fetch(`${API_BASE_URL}/do-operators`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch data operators.');
  }
  return await res.json();
};

export const createOperator = async (data) => {
  const res = await fetch(`${API_BASE_URL}/do-operators`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create data operator.');
  }
  return await res.json();
};

export const updateOperator = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/do-operators/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update data operator.');
  }
  return await res.json();
};

export const deleteOperator = async (id) => {
  const res = await fetch(`${API_BASE_URL}/do-operators/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete data operator.');
  }
  return await res.json();
};

// ====================================================================
// Sub-Admin CRUD APIs (Super Admin only)
// ====================================================================
export const fetchSubAdmins = async () => {
  const res = await fetch(`${API_BASE_URL}/sub-admins`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch sub-admins.');
  }
  return await res.json();
};

export const createSubAdmin = async (data) => {
  const res = await fetch(`${API_BASE_URL}/sub-admins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create sub-admin.');
  }
  return await res.json();
};

export const updateSubAdmin = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/sub-admins/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update sub-admin.');
  }
  return await res.json();
};

export const deleteSubAdmin = async (id) => {
  const res = await fetch(`${API_BASE_URL}/sub-admins/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete sub-admin.');
  }
  return await res.json();
};

export const fetchOperatorActivities = async () => {
  const res = await fetch(`${API_BASE_URL}/operator-activities`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch operator activity logs.');
  }
  return await res.json();
};

// ====================================================================
// 6. Permission Requests APIs
// ====================================================================
export const checkEditPermission = async (recordType, recordId, action = 'Edit') => {
  const res = await fetch(`${API_BASE_URL}/permission-requests/check?record_type=${encodeURIComponent(recordType)}&record_id=${encodeURIComponent(recordId)}&action=${encodeURIComponent(action)}`);
  if (!res.ok) {
    throw new Error('Failed to check permission.');
  }
  return await res.json();
};

export const requestEditPermission = async (recordType, recordId, description, action = 'Edit') => {
  const res = await fetch(`${API_BASE_URL}/permission-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ record_type: recordType, record_id: recordId, description, action })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to request permission.');
  }
  return await res.json();
};

export const fetchPermissionRequests = async () => {
  const res = await fetch(`${API_BASE_URL}/permission-requests`);
  if (!res.ok) {
    throw new Error('Failed to fetch permission requests.');
  }
  return await res.json();
};

export const updatePermissionRequest = async (id, status) => {
  const res = await fetch(`${API_BASE_URL}/permission-requests/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update permission request.');
  }
  return await res.json();
};

export const fetchSystemConfig = async () => {
  const res = await fetch(`${API_BASE_URL}/permission-requests/config`);
  if (!res.ok) {
    throw new Error('Failed to fetch permission config.');
  }
  return await res.json();
};

export const updateSystemConfig = async (configKey, configValue) => {
  const res = await fetch(`${API_BASE_URL}/permission-requests/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config_key: configKey, config_value: configValue })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update permission config.');
  }
  return await res.json();
};

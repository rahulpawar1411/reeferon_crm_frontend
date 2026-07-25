// ====================================================================
// Frontend API Service Layer (src/services/api.js)
// Supports FormData Image Uploads for Daily Chamber Temp Logs.
// ====================================================================

const API_BASE_URL = window.location.origin === 'http://localhost:3000'
  ? 'http://localhost:5000/api'
  : '/api';

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
  return { id: newLog.id, message: 'Saved (local)' };
};

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

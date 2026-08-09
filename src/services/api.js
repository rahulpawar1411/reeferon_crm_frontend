// ====================================================================
// Frontend API Service Layer (src/services/api.js)
// Supports FormData Image Uploads for Daily Chamber Temp Logs.
// ====================================================================

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/** Let the browser paint between heavy export/page loops. */
export const yieldToMain = () =>
  new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => setTimeout(resolve, 0));
    } else {
      setTimeout(resolve, 0);
    }
  });

/** DD-MM-YYYY or YYYY-MM-DD → YYYY-MM-DD for API query params. */
export function toApiDateParam(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parts = trimmed.split('-');
  if (parts.length === 3 && parts[0].length <= 2 && parts[2].length === 4) {
    const [dd, mm, yyyy] = parts;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  return trimmed;
}

export function normalizeLogListResponse(data) {
  if (Array.isArray(data)) {
    return { items: data, total: data.length, page: 1, limit: data.length, hasMore: false };
  }
  if (data && Array.isArray(data.items)) {
    return {
      items: data.items,
      total: Number(data.total) || data.items.length,
      page: Number(data.page) || 1,
      limit: Number(data.limit) || data.items.length,
      hasMore: Boolean(data.hasMore)
    };
  }
  return { items: [], total: 0, page: 1, limit: 0, hasMore: false };
}

/** Read API error body safely (proxy/HTML/text must not crash res.json()). */
async function readApiError(res, fallback) {
  const text = await res.text().catch(() => '');
  try {
    const data = text ? JSON.parse(text) : {};
    return data.error || data.message || fallback;
  } catch (_) {
    if (res.status === 401) return 'Session expired. Please log in again as Super Admin.';
    if (res.status === 403) return 'Access denied.';
    if (/an error occurred while trying to proxy/i.test(text)) {
      return 'Backend not reachable on port 5000. Start backend (npm start) and try again.';
    }
    if (/^an error occurred/i.test(text.trim())) {
      return 'Server timed out or failed (common on free deploy when email/DB is slow). Retry — account may already be created.';
    }
    if (res.status >= 500) return 'Server error. Please try again later.';
    if (text && text.length < 200) return text;
    return fallback;
  }
}

function buildLogListQuery(params = {}) {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.page != null) qs.set('page', String(params.page));
  if (params.limit != null) qs.set('limit', String(params.limit));
  if (params.fromDate) qs.set('fromDate', params.fromDate);
  if (params.toDate) qs.set('toDate', params.toDate);
  if (params.warehouse && params.warehouse !== 'All') qs.set('warehouse', params.warehouse);
  if (params.action && params.action !== 'All') qs.set('action', params.action);
  if (params.category) qs.set('category', params.category);
  if (params.export) qs.set('export', '1');
  const s = qs.toString();
  return s ? `?${s}` : '';
}

async function fetchLogListEndpoint(path, params = {}) {
  const query = buildLogListQuery(params);
  const res = await fetch(`${API_BASE_URL}${path}${query}`);
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Request failed (${res.status})`);
  }
  const data = await res.json();
  return normalizeLogListResponse(data);
}

/** Fetch every page for export (chunked, yields to UI). Caps at maxRows. */
export async function fetchAllLogPages(path, params = {}, onProgress) {
  const pageLimit = params.limit ?? 500;
  const maxRows = params.maxRows ?? 100000;
  let page = 1;
  const all = [];
  let total = 0;
  let warned = false;

  for (;;) {
    const chunk = await fetchLogListEndpoint(path, {
      ...params,
      page,
      limit: pageLimit,
      export: true
    });
    if (page === 1) {
      total = chunk.total;
      if (total > maxRows) {
        throw new Error(
          `Export too large (${Number(total).toLocaleString()} rows). Maximum is ${maxRows.toLocaleString()} rows. Please narrow the date range or filters.`
        );
      }
      if (total >= 50000 && !warned) {
        const ok = window.confirm(
          `This export has about ${Number(total).toLocaleString()} rows and may take time.\n\nContinue?`
        );
        if (!ok) throw new Error('Export cancelled.');
        warned = true;
      }
    }
    all.push(...chunk.items);
    if (typeof onProgress === 'function') {
      onProgress({ loaded: all.length, total: total || chunk.total, page });
    }
    if (all.length >= maxRows) {
      all.length = maxRows;
      break;
    }
    if (!chunk.hasMore || chunk.items.length === 0) break;
    page += 1;
    await yieldToMain();
  }

  return { items: all, total: total || all.length };
}

export const fetchChamberLogsPage = (params) => fetchLogListEndpoint('/chamber-temp', params);
export const fetchInwardLogsPage = (params) => fetchLogListEndpoint('/inward-logs', params);
export const fetchOutwardLogsPage = (params) => fetchLogListEndpoint('/outward-logs', params);

export const fetchAllChamberLogs = (params, onProgress) =>
  fetchAllLogPages('/chamber-temp', params, onProgress);
export const fetchAllInwardLogs = (params, onProgress) =>
  fetchAllLogPages('/inward-logs', params, onProgress);
export const fetchAllOutwardLogs = (params, onProgress) =>
  fetchAllLogPages('/outward-logs', params, onProgress);

// Globally override fetch to enforce HttpOnly Cookies credentials passing in development & production
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
  options.credentials = 'include';
  try {
    const res = await originalFetch(url, options);
    const urlStr = typeof url === 'string' ? url : (url && url.url ? url.url : '');
    
    // If unauthorized (401) and not a login request, clear storage and log out
    if (
      res.status === 401 &&
      !urlStr.includes('/auth/login') &&
      !urlStr.includes('/auth/verify-profile-access') &&
      !urlStr.includes('/permission-requests/check')
    ) {
      console.warn('⚠️ Session expired (401). Logging out...');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('unauthorized-session-expired'));
    }
    return res;
  } catch (err) {
    throw err;
  }
};

// In-memory fallback for Chamber Logs
let fallbackChamberLogs = [];

// ====================================================================
// 1. Daily Chamber Temperature Monitoring APIs
// ====================================================================
export const fetchChamberLogs = async (search = '', options = {}) => {
  const params = {
    search: search || options.search || '',
    page: options.page ?? 1,
    limit: options.limit ?? (options.paginated ? 50 : 200),
    fromDate: options.fromDate,
    toDate: options.toDate,
    warehouse: options.warehouse
  };
  try {
    const result = await fetchChamberLogsPage(params);
    if (options.paginated) return result;
    return result.items;
  } catch (err) {
    if (options.paginated) throw err;
  }
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
    box_temp: parseFloat(logData.box_temp || 0),
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

export const fetchInwardLogs = async (search = '', options = {}) => {
  const params = {
    search: search || options.search || '',
    page: options.page ?? 1,
    limit: options.limit ?? (options.paginated ? 50 : 200),
    fromDate: options.fromDate,
    toDate: options.toDate,
    warehouse: options.warehouse
  };
  try {
    const result = await fetchInwardLogsPage(params);
    if (options.paginated) return result;
    return result.items;
  } catch (err) {
    if (options.paginated) throw err;
  }
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

/** POD-only update — no admin edit permission required. */
export const updateInwardPodPhoto = async (id, file) => {
  const formData = new FormData();
  formData.append('inward_pod_photo', file, file.name || 'pod-photo.jpg');
  const res = await fetch(`${API_BASE_URL}/inward-logs/${id}/pod-photo`, {
    method: 'PUT',
    body: formData
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `Failed to update POD photo (${res.status}).`);
  }
  return data;
};

export const updateOutwardPodPhoto = async (id, file) => {
  const formData = new FormData();
  formData.append('outward_pod_photo', file, file.name || 'pod-photo.jpg');
  const res = await fetch(`${API_BASE_URL}/outward-logs/${id}/pod-photo`, {
    method: 'PUT',
    body: formData
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `Failed to update POD photo (${res.status}).`);
  }
  return data;
};

// ====================================================================
// Outward DO Logs APIs
// ====================================================================
let fallbackOutwardLogs = [];

export const fetchOutwardLogs = async (search = '', options = {}) => {
  const params = {
    search: search || options.search || '',
    page: options.page ?? 1,
    limit: options.limit ?? (options.paginated ? 50 : 200),
    fromDate: options.fromDate,
    toDate: options.toDate,
    warehouse: options.warehouse
  };
  try {
    const result = await fetchOutwardLogsPage(params);
    if (options.paginated) return result;
    return result.items;
  } catch (err) {
    if (options.paginated) throw err;
  }
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
    if (res.ok) {
      const data = await res.json();
      return data.stats || data;
    }
  } catch (err) {}
  return {
    totalLeads: fallbackLeads.length,
    newLeads: fallbackLeads.filter(l => l.status === 'New').length,
    inProgress: fallbackLeads.filter(l => l.status === 'In-Progress' || l.status === 'Contacted').length,
    wonLeads: fallbackLeads.filter(l => l.status === 'Won').length,
    recentLeads: fallbackLeads.slice(0, 5)
  };
};

export const fetchInventoryReconciliation = async ({ search, warehouse } = {}) => {
  const queryParams = new URLSearchParams();
  if (search) queryParams.append('search', search);
  if (warehouse) queryParams.append('warehouse', warehouse);

  const res = await fetch(`${API_BASE_URL}/dashboard/inventory-reconciliation?${queryParams.toString()}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch inventory reconciliation logs.');
  }
  const data = await res.json();
  return data.items || [];
};

export const fetchInventoryFilterOptions = async () => {
  const res = await fetch(`${API_BASE_URL}/dashboard/inventory-filter-options`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to fetch live warehouse/client filters.');
  }
  return await res.json();
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

/** Chamber master list (id, name, total_clients) */
export const fetchChambers = async () => {
  const res = await fetch(`${API_BASE_URL}/chambers`, { credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to fetch chambers.');
  }
  const body = await res.json();
  return Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
};

/** Update chamber name and/or total_clients */
export const updateChamber = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/chambers/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    throw new Error(await readApiError(res, 'Failed to update chamber.'));
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
    throw new Error(await readApiError(res, 'Failed to create data operator.'));
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
// Customer CRUD APIs (Super Admin only; formerly Sub-Admin)
// ====================================================================
export const fetchSubAdmins = async () => {
  const res = await fetch(`${API_BASE_URL}/customers`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch customers.');
  }
  return await res.json();
};

export const createSubAdmin = async (data) => {
  const res = await fetch(`${API_BASE_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    throw new Error(await readApiError(res, 'Failed to create customer.'));
  }
  return await res.json();
};

export const updateSubAdmin = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/customers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update customer.');
  }
  return await res.json();
};

export const deleteSubAdmin = async (id) => {
  const res = await fetch(`${API_BASE_URL}/customers/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete customer.');
  }
  return await res.json();
};

export const fetchAccessScopeOptions = async () => {
  const res = await fetch(`${API_BASE_URL}/dashboard/access-options`);
  if (!res.ok) {
    throw new Error('Failed to fetch access scope options.');
  }
  return await res.json();
};

export const submitCustomerReport = async ({ reference_no, message }) => {
  const res = await fetch(`${API_BASE_URL}/customer-reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference_no, message })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit report.');
  }
  return data;
};

export const fetchCustomerReports = async ({ status = 'All', search = '' } = {}) => {
  const qs = new URLSearchParams();
  if (status && status !== 'All') qs.set('status', status);
  if (search) qs.set('search', search);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  const res = await fetch(`${API_BASE_URL}/customer-reports${query}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch customer reports.');
  }
  return Array.isArray(data) ? data : [];
};

export const updateCustomerReportStatus = async (id, status) => {
  const res = await fetch(`${API_BASE_URL}/customer-reports/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update report status.');
  }
  return data;
};

/** Paginated activity / security / system logs. Returns { items, total, page, limit, hasMore }. */
export const fetchOperatorActivities = async (params = {}) => {
  return fetchLogListEndpoint('/operator-activities', params);
};

export const fetchAllOperatorActivities = (params = {}, onProgress) =>
  fetchAllLogPages('/operator-activities', params, onProgress);

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

export const fetchPermissionRequests = async (cacheBustQuery = '') => {
  const suffix = cacheBustQuery.startsWith('?') ? cacheBustQuery : '';
  const res = await fetch(`${API_BASE_URL}/permission-requests${suffix}`);
  if (!res.ok) {
    throw new Error('Failed to fetch permission requests.');
  }
  return await res.json();
};

export const updatePermissionRequest = async (id, status, remark = '') => {
  const res = await fetch(`${API_BASE_URL}/permission-requests/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, remark: remark || undefined })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update permission request.');
  }
  return await res.json();
};

/** Super Allow / request / update trail for a History or Profile log record */
export const fetchRecordPermissionHistory = async (recordType, recordId) => {
  const qs = new URLSearchParams({
    record_type: String(recordType || ''),
    record_id: String(recordId || '')
  });
  const res = await fetch(`${API_BASE_URL}/permission-requests/record-history?${qs.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load approval history.');
  }
  return await res.json();
};

export const markPermissionRequestComplete = async (id) => {
  const res = await fetch(`${API_BASE_URL}/permission-requests/${id}/complete`, {
    method: 'PATCH'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to mark notification complete.');
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

export const changeSuperAdminPassword = async ({ currentPassword, newPassword, email }) => {
  const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword, email })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Failed to update profile.');
  }
  return data;
};

export const verifySuperAdminProfileAccess = async ({ email, password }) => {
  const res = await fetch(`${API_BASE_URL}/auth/verify-profile-access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Verification failed.');
  }
  return data;
};

// ====================================================================
// 7. Native Mobile Inspections APIs
// ====================================================================
export const fetchDailyInspections = async () => {
  const res = await fetch(`${API_BASE_URL}/chambers/inspections`);
  if (!res.ok) {
    throw new Error('Failed to fetch native daily inspections.');
  }
  const body = await res.json();
  return body.data || [];
};

export const deleteDailyInspection = async (id) => {
  const res = await fetch(`${API_BASE_URL}/chambers/inspections/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete inspection log.');
  }
  return await res.json();
};

export const fetchDailyInventoryDeltas = async ({ warehouse, fromDate, toDate } = {}) => {
  const queryParams = new URLSearchParams();
  if (warehouse) queryParams.append('warehouse', warehouse);
  if (fromDate) queryParams.append('fromDate', fromDate);
  if (toDate) queryParams.append('toDate', toDate);

  const res = await fetch(`${API_BASE_URL}/dashboard/daily-inventory-deltas?${queryParams.toString()}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch daily inventory comparisons.');
  }
  const data = await res.json();
  return data.items || [];
};

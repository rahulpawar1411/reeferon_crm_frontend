/**
 * Super Admin web — Master Data panel (catalog only).
 *
 * Manages warehouse_master + client_master via /api/masters.
 * Does NOT edit chamber ↔ client assignments (those are DO / Sub Admin
 * Master Setup: chambers + chamber_client_assignments).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  CheckCircle,
  Database,
  Edit,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Users
} from 'lucide-react';
import {
  fetchMasterWarehouses,
  createMasterWarehouse,
  updateMasterWarehouse,
  fetchMasterClients,
  createMasterClient,
  updateMasterClient
} from '../../services/api';
import { formatMasterLabel } from '../../utils/masterLabels';
import { generateClientCode } from '../../utils/generateClientCode';
import './MasterDataPanel.css';

function StatusBadge({ active }) {
  const isActive = Number(active) !== 0;
  return (
    <span className={`mdm-badge ${isActive ? 'active' : 'inactive'}`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

export default function MasterDataPanel() {
  const [tab, setTab] = useState('warehouses');
  const [warehouses, setWarehouses] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const [whCode, setWhCode] = useState('');
  const [whName, setWhName] = useState('');
  const [whCity, setWhCity] = useState('');
  const [editingWh, setEditingWh] = useState(null);
  const [savingWh, setSavingWh] = useState(false);

  const [clCode, setClCode] = useState('');
  const [clName, setClName] = useState('');
  const [clWarehouse, setClWarehouse] = useState('');
  const [editingCl, setEditingCl] = useState(null);
  const [savingCl, setSavingCl] = useState(false);
  const clCodeManualRef = useRef(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [wh, cl] = await Promise.all([
        fetchMasterWarehouses({ activeOnly: !showInactive }),
        fetchMasterClients({ activeOnly: !showInactive })
      ]);
      setWarehouses(Array.isArray(wh) ? wh : []);
      setClients(Array.isArray(cl) ? cl : []);
    } catch (err) {
      setError(err.message || 'Failed to load master data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive]);

  const activeWarehouses = useMemo(
    () => (warehouses || []).filter((w) => Number(w.is_active) !== 0),
    [warehouses]
  );

  useEffect(() => {
    if (editingCl || clCodeManualRef.current) return;
    const selectedWh = activeWarehouses.find((w) => w.warehouse_code === clWarehouse);
    const code = generateClientCode(
      clName,
      selectedWh?.warehouse_name || '',
      selectedWh?.warehouse_code || clWarehouse
    );
    if (code !== clCode) setClCode(code);
  }, [clName, clWarehouse, activeWarehouses, editingCl, clCode]);

  const needle = search.trim().toLowerCase();

  const filteredWarehouses = useMemo(() => {
    if (!needle) return warehouses;
    return warehouses.filter((row) => {
      const hay = [
        row.warehouse_code,
        row.warehouse_name,
        row.city
      ]
        .map((v) => String(v || '').toLowerCase())
        .join(' ');
      return hay.includes(needle);
    });
  }, [warehouses, needle]);

  const filteredClients = useMemo(() => {
    if (!needle) return clients;
    return clients.filter((row) => {
      const hay = [
        row.client_code,
        row.client_name,
        row.warehouse_code,
        row.warehouse_name,
        formatMasterLabel(row.warehouse_code, row.warehouse_name)
      ]
        .map((v) => String(v || '').toLowerCase())
        .join(' ');
      return hay.includes(needle);
    });
  }, [clients, needle]);

  const resetWhForm = () => {
    setEditingWh(null);
    setWhCode('');
    setWhName('');
    setWhCity('');
  };

  const resetClForm = () => {
    clCodeManualRef.current = false;
    setEditingCl(null);
    setClCode('');
    setClName('');
    setClWarehouse('');
  };

  const startEditWarehouse = (row) => {
    setTab('warehouses');
    setEditingWh(row);
    setWhName(row.warehouse_name || '');
    setWhCity(row.city || '');
    setSuccess('');
    setError('');
  };

  const startEditClient = (row) => {
    setTab('clients');
    setEditingCl(row);
    setClName(row.client_name || '');
    setClWarehouse(row.warehouse_code || '');
    setSuccess('');
    setError('');
  };

  const handleSaveWarehouse = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSavingWh(true);
    try {
      if (editingWh) {
        await updateMasterWarehouse(editingWh.id, {
          warehouse_name: whName,
          city: whCity,
          is_active: editingWh.is_active
        });
        setSuccess('Warehouse updated successfully.');
      } else {
        await createMasterWarehouse({
          warehouse_code: whCode,
          warehouse_name: whName,
          city: whCity
        });
        setSuccess('Warehouse added to master list.');
      }
      resetWhForm();
      await load();
    } catch (err) {
      setError(err.message || 'Failed to save warehouse.');
    } finally {
      setSavingWh(false);
    }
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSavingCl(true);
    try {
      const selectedWh = activeWarehouses.find((w) => w.warehouse_code === clWarehouse);
      if (editingCl) {
        await updateMasterClient(editingCl.id, {
          client_name: clName,
          warehouse_name: selectedWh?.warehouse_name || clWarehouse || null,
          is_active: editingCl.is_active
        });
        setSuccess('Client updated successfully.');
      } else {
        await createMasterClient({
          client_code: clCode,
          client_name: clName,
          warehouse_name: selectedWh?.warehouse_name || null
        });
        setSuccess('Client added to master list.');
      }
      resetClForm();
      await load();
    } catch (err) {
      setError(err.message || 'Failed to save client.');
    } finally {
      setSavingCl(false);
    }
  };

  const toggleActive = async (type, row) => {
    setError('');
    setSuccess('');
    try {
      if (type === 'warehouse') {
        await updateMasterWarehouse(row.id, { is_active: Number(row.is_active) ? 0 : 1 });
      } else {
        await updateMasterClient(row.id, { is_active: Number(row.is_active) ? 0 : 1 });
      }
      setSuccess(Number(row.is_active) ? 'Marked inactive — history is kept.' : 'Marked active again.');
      await load();
    } catch (err) {
      setError(err.message || 'Failed to update status.');
    }
  };

  const whActiveCount = warehouses.filter((w) => Number(w.is_active) !== 0).length;
  const clActiveCount = clients.filter((c) => Number(c.is_active) !== 0).length;

  return (
    <div className="sa-um mdm-panel">
      <div className="sa-op-gmail">
        <section className="sa-op-card">
          <div className="sa-op-card-head">
            <div className="sa-op-card-icon"><Database size={14} /></div>
            <div>
              <h2 className="sa-op-title">Warehouse & Client Master</h2>
              <p className="sa-op-sub">
                Unique codes for dropdowns, DO scope, and exports. Inactive keeps history — no hard delete.
              </p>
            </div>
          </div>

          <div className="mdm-tabs">
            <button
              type="button"
              className={`mdm-tab ${tab === 'warehouses' ? 'active' : ''}`}
              onClick={() => { setTab('warehouses'); setSuccess(''); setError(''); }}
            >
              <Building2 size={13} />
              Warehouses
              <span className="mdm-tab-count">{whActiveCount}</span>
            </button>
            <button
              type="button"
              className={`mdm-tab ${tab === 'clients' ? 'active' : ''}`}
              onClick={() => { setTab('clients'); setSuccess(''); setError(''); }}
            >
              <Users size={13} />
              Clients
              <span className="mdm-tab-count">{clActiveCount}</span>
            </button>
            <div className="mdm-toolbar-extra">
              <label className="mdm-check">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                />
                Show inactive
              </label>
              <button type="button" className="sa-op-btn-text" onClick={load} disabled={loading} title="Refresh">
                <RefreshCw size={13} className={loading ? 'spin' : ''} />
                Refresh
              </button>
            </div>
          </div>

          {error ? <div className="sa-op-banner error">{error}</div> : null}
          {success ? <div className="sa-op-banner success">{success}</div> : null}

          {tab === 'warehouses' ? (
            <form className="sa-op-form" onSubmit={handleSaveWarehouse}>
              <div className="sa-op-form-grid">
                {!editingWh ? (
                  <label className="sa-op-field">
                    <span>Warehouse Code</span>
                    <input
                      value={whCode}
                      onChange={(e) => setWhCode(e.target.value.toUpperCase().replace(/\s+/g, '-'))}
                      placeholder="WH-PUN-01"
                      required
                      autoComplete="off"
                    />
                    <em>Unique code used in exports and DO assignment.</em>
                  </label>
                ) : (
                  <label className="sa-op-field">
                    <span>Warehouse Code</span>
                    <input value={editingWh.warehouse_code || ''} readOnly disabled />
                    <em>Code cannot be changed after creation.</em>
                  </label>
                )}
                <label className="sa-op-field">
                  <span>Warehouse Name</span>
                  <input
                    value={whName}
                    onChange={(e) => setWhName(e.target.value)}
                    placeholder="Pune Cold Store"
                    required
                  />
                </label>
                <label className="sa-op-field">
                  <span>City</span>
                  <input
                    value={whCity}
                    onChange={(e) => setWhCity(e.target.value)}
                    placeholder="Pune"
                  />
                </label>
              </div>
              <div className="sa-op-form-actions">
                {editingWh ? (
                  <button type="button" className="sa-op-btn-text" onClick={resetWhForm}>
                    Cancel
                  </button>
                ) : null}
                <button type="submit" className={`sa-op-btn-primary${editingWh ? ' update' : ''}`} disabled={savingWh}>
                  {savingWh ? (
                    <>
                      <Loader2 size={14} className="spinner-icon" />
                      Saving…
                    </>
                  ) : (editingWh ? 'Update Warehouse' : 'Add Warehouse')}
                </button>
              </div>
            </form>
          ) : (
            <form className="sa-op-form" onSubmit={handleSaveClient}>
              <div className="sa-op-form-grid">
                {!editingCl ? (
                  <label className="sa-op-field">
                    <span>Client Code</span>
                    <input
                      value={clCode}
                      onChange={(e) => {
                        clCodeManualRef.current = true;
                        setClCode(e.target.value.toUpperCase().replace(/\s+/g, '-'));
                      }}
                      placeholder="CL-WH-CLIENT"
                      required
                      autoComplete="off"
                    />
                    <em>Auto-generated from client + warehouse. Edit only if needed.</em>
                  </label>
                ) : (
                  <label className="sa-op-field">
                    <span>Client Code</span>
                    <input value={editingCl.client_code || ''} readOnly disabled />
                    <em>Code cannot be changed after creation.</em>
                  </label>
                )}
                <label className="sa-op-field">
                  <span>Client Name</span>
                  <input
                    value={clName}
                    onChange={(e) => setClName(e.target.value)}
                    placeholder="Amul Logistics"
                    required
                  />
                </label>
                <label className="sa-op-field sa-op-field-wide">
                  <span>Linked Warehouse</span>
                  <select value={clWarehouse} onChange={(e) => setClWarehouse(e.target.value)}>
                    <option value="">No warehouse (global client)</option>
                    {activeWarehouses.map((w) => (
                      <option key={w.id} value={w.warehouse_code}>
                        {formatMasterLabel(w.warehouse_code, w.warehouse_name)}
                      </option>
                    ))}
                  </select>
                  {activeWarehouses.length === 0 ? (
                    <em>Add a warehouse first to link clients by location.</em>
                  ) : null}
                </label>
              </div>
              <div className="sa-op-form-actions">
                {editingCl ? (
                  <button type="button" className="sa-op-btn-text" onClick={resetClForm}>
                    Cancel
                  </button>
                ) : null}
                <button type="submit" className={`sa-op-btn-primary${editingCl ? ' update' : ''}`} disabled={savingCl}>
                  {savingCl ? (
                    <>
                      <Loader2 size={14} className="spinner-icon" />
                      Saving…
                    </>
                  ) : (editingCl ? 'Update Client' : 'Add Client')}
                </button>
              </div>
            </form>
          )}

          <p className="mdm-footnote">
            <CheckCircle size={12} />
            Codes stay unique. Same client name in two warehouses stays separate by code.
          </p>
        </section>

        <section className="sa-op-card sa-op-directory">
          <div className="sa-op-dir-toolbar">
            <div>
              <h2 className="sa-op-title">
                {tab === 'warehouses' ? 'Warehouse Directory' : 'Client Directory'}
              </h2>
              <p className="sa-op-sub">
                {tab === 'warehouses'
                  ? `${filteredWarehouses.length} warehouse${filteredWarehouses.length === 1 ? '' : 's'} · search, edit or change status`
                  : `${filteredClients.length} client${filteredClients.length === 1 ? '' : 's'} · search, edit or change status`}
              </p>
            </div>
            <div className="sa-op-dir-tools">
              <label className="sa-op-search">
                <Search size={14} />
                <input
                  type="search"
                  placeholder={tab === 'warehouses' ? 'Search code, name or city…' : 'Search code, name or warehouse…'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>
          </div>

          {loading ? (
            <div className="sa-op-empty">
              <Loader2 size={22} className="spin" />
              <p>Loading master data…</p>
            </div>
          ) : tab === 'warehouses' ? (
            filteredWarehouses.length === 0 ? (
              <div className="sa-op-empty">
                <Building2 size={28} />
                <p>{needle ? 'No matching warehouses.' : 'No warehouses yet — add one above.'}</p>
              </div>
            ) : (
              <div className="sa-op-inbox">
                {filteredWarehouses.map((row) => {
                  const initials = String(row.warehouse_code || row.warehouse_name || 'WH')
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <div key={row.id} className="sa-op-inbox-row">
                      <button
                        type="button"
                        className="sa-op-inbox-main"
                        onClick={() => startEditWarehouse(row)}
                        title="Edit warehouse"
                      >
                        <span className="sa-op-avatar">{initials}</span>
                        <span className="mdm-inbox-meta">
                          <strong>{row.warehouse_name || 'Unnamed warehouse'}</strong>
                          <em className="mdm-code">{row.warehouse_code}</em>
                        </span>
                        <span className="sa-op-snippet">{row.city || 'City not set'}</span>
                        <StatusBadge active={row.is_active} />
                        <span className="sa-op-date">
                          {row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB') : '—'}
                        </span>
                      </button>
                      <div className="sa-op-row-actions">
                        <button
                          type="button"
                          className="sa-op-icon-btn"
                          onClick={() => startEditWarehouse(row)}
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          className="sa-op-icon-btn"
                          onClick={() => toggleActive('warehouse', row)}
                          title={Number(row.is_active) ? 'Mark inactive' : 'Reactivate'}
                        >
                          {Number(row.is_active) ? <Package size={14} /> : <CheckCircle size={14} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : filteredClients.length === 0 ? (
            <div className="sa-op-empty">
              <Users size={28} />
              <p>{needle ? 'No matching clients.' : 'No clients yet — add one above.'}</p>
            </div>
          ) : (
            <div className="sa-op-inbox">
              {filteredClients.map((row) => {
                const initials = String(row.client_code || row.client_name || 'CL')
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <div key={row.id} className="sa-op-inbox-row">
                    <button
                      type="button"
                      className="sa-op-inbox-main"
                      onClick={() => startEditClient(row)}
                      title="Edit client"
                    >
                      <span className="sa-op-avatar">{initials}</span>
                      <span className="mdm-inbox-meta">
                        <strong>{row.client_name || 'Unnamed client'}</strong>
                        <em className="mdm-code">{row.client_code}</em>
                      </span>
                      <span className="sa-op-snippet">
                        {formatMasterLabel(row.warehouse_code, row.warehouse_name) || 'No warehouse linked'}
                      </span>
                      <StatusBadge active={row.is_active} />
                      <span className="sa-op-date">
                        {row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB') : '—'}
                      </span>
                    </button>
                    <div className="sa-op-row-actions">
                      <button
                        type="button"
                        className="sa-op-icon-btn"
                        onClick={() => startEditClient(row)}
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        className="sa-op-icon-btn"
                        onClick={() => toggleActive('client', row)}
                        title={Number(row.is_active) ? 'Mark inactive' : 'Reactivate'}
                      >
                        {Number(row.is_active) ? <Package size={14} /> : <CheckCircle size={14} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

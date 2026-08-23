export function formatMasterLabel(code, name) {
  const c = String(code || '').trim();
  const n = String(name || '').trim();
  if (c && n) return `${c} — ${n}`;
  return c || n || '';
}

export function masterOptionValue(row) {
  if (!row) return '';
  if (typeof row === 'string') return row;
  return String(row.code || row.warehouse_code || row.client_code || row.name || row.warehouse_name || row.client_name || '').trim();
}

export function lookupMasterLabel(value, options = []) {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return '';
  const hit = (options || []).find((row) => {
    const code = String(row.code || row.warehouse_code || row.client_code || '').trim().toLowerCase();
    const name = String(row.name || row.warehouse_name || row.client_name || '').trim().toLowerCase();
    return code === v || name === v;
  });
  if (hit) {
    return formatMasterLabel(
      hit.code || hit.warehouse_code || hit.client_code,
      hit.name || hit.warehouse_name || hit.client_name
    );
  }
  return String(value || '').trim();
}

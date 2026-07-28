export function formatDateStr(dateVal) {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  } catch {
    return dateVal;
  }
}

export function formatDateTimeStr(dateVal) {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
  } catch {
    return dateVal;
  }
}

export function formatDuration(hoursStr, minsStr) {
  const hours = parseInt(hoursStr, 10) || 0;
  const mins = parseInt(minsStr, 10) || 0;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours}h ${mins}m`;
  }
  return `${hours}h ${mins}m`;
}

export function getUpdateDiff(created, updated) {
  if (!created || !updated) return false;
  const cTime = Math.floor(new Date(created).getTime() / 1000);
  const uTime = Math.floor(new Date(updated).getTime() / 1000);
  return uTime > cTime;
}

export function formatQty(val) {
  if (val == null || val === '') return '0';
  const n = Number(val);
  if (Number.isNaN(n)) return String(val).trim();
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4
  }).format(n);
}

export function resolveImageSrc(path) {
  if (!path || !String(path).trim()) return null;
  const p = String(path).trim();
  if (p.startsWith('data:')) return p;
  return p.startsWith('/') ? p : `/${p}`;
}

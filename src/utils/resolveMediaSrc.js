/**
 * Build display URL candidates for uploaded media.
 * Cloudinary URLs in DB often 404 while local /uploads backups still exist.
 */

const UPLOAD_FOLDER_RE =
  /(outward_images|inward_images|daily_temp_monitor_images|crm\/(?:outward_images|inward_images|daily_temp_monitor_images))/i;

export function cloudinaryUrlToUploadsPath(raw) {
  if (raw == null) return null;
  const value = String(raw).trim();
  if (!/^https?:\/\/res\.cloudinary\.com\//i.test(value)) return null;

  const match = value.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\?|$)/i);
  if (!match) return null;

  let rest = match[1].replace(/^crm\//i, '');
  if (!UPLOAD_FOLDER_RE.test(rest)) return null;
  if (rest.startsWith('crm/')) rest = rest.slice(4);
  return `uploads/${rest}`;
}

/**
 * Resolve a single best-effort src for <img>.
 * Prefers local /uploads when the value is a Cloudinary CRM asset URL.
 */
export function resolveMediaSrc(path) {
  const candidates = buildMediaSrcCandidates(path);
  return candidates[0] || null;
}

/**
 * Ordered candidates for onError fallback (local ↔ CDN).
 */
export function buildMediaSrcCandidates(path) {
  if (path == null) return [];
  const value = String(path).trim();
  if (!value || value === 'null' || value === 'undefined') return [];

  if (value.startsWith('data:') || value.startsWith('blob:')) return [value];

  const out = [];
  const push = (u) => {
    if (!u) return;
    const s = String(u).trim();
    if (!s || out.includes(s)) return;
    out.push(s);
  };

  if (/^https?:\/\//i.test(value)) {
    const local = cloudinaryUrlToUploadsPath(value);
    if (local) push(`/${local}`);
    push(value);
    return out;
  }

  const normalized = value.replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalized.startsWith('uploads/')) {
    push(`/${normalized}`);
  } else if (!normalized.includes('/')) {
    push(`/${normalized}`);
  } else {
    push(`/${normalized}`);
  }
  return out;
}

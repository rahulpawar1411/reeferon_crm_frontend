/**
 * Build display URL candidates for uploaded media.
 *
 * MySQL may still store Cloudinary URLs from the old CDN.
 * Those URLs stay as-is in the DB. We map them to:
 *   /uploads/crm/inward_images|outward_images|daily_temp_monitor_images/<file>
 * (same Cloudinary public_id path).
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'de9ba8bpk';

const UPLOAD_FOLDER_RE =
  /(outward_images|inward_images|daily_temp_monitor_images|crm\/(?:outward_images|inward_images|daily_temp_monitor_images))/i;

function apiOrigin() {
  const api = String(import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
  if (/^https?:\/\//i.test(api)) return api.replace(/\/api$/i, '');
  return '';
}

function toUploadsUrl(relPath) {
  const clean = String(relPath || '').replace(/^\/+/, '');
  const origin = apiOrigin();
  return origin ? `${origin}/${clean}` : `/${clean}`;
}

/** Map Cloudinary CRM URL → local uploads path. */
export function cloudinaryUrlToUploadsPath(raw) {
  if (raw == null) return null;
  const value = String(raw).trim();
  if (!/^https?:\/\/res\.cloudinary\.com\//i.test(value)) return null;

  const match = value.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\?|$)/i);
  if (!match) return null;

  let rest = match[1];
  if (rest.startsWith('crm/')) rest = rest.slice(4);
  if (!UPLOAD_FOLDER_RE.test(rest)) return null;
  if (rest.startsWith('crm/')) rest = rest.slice(4);
  return `uploads/crm/${rest}`;
}

/** Map uploads/… path → Cloudinary CDN URL (optional fallback only). */
export function uploadsPathToCloudinaryUrl(raw) {
  if (raw == null) return null;
  const value = String(raw).trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (!value.startsWith('uploads/')) return null;

  const match = value.match(
    /^uploads\/(?:crm\/)?(outward_images|inward_images|daily_temp_monitor_images)\/(.+)$/i
  );
  if (!match || !match[2]) return null;

  const folder = match[1];
  const file = String(match[2]).replace(/\.(jpe?g|png|webp|gif)$/i, '');
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/crm/${folder}/${file}`;
}

function isCloudinaryUrl(u) {
  return /^https?:\/\/res\.cloudinary\.com\//i.test(String(u || ''));
}

function preferCdnFirst() {
  return import.meta.env.VITE_PREFER_CLOUDINARY === 'true';
}

/**
 * Resolve a single best-effort src for <img>.
 * Default: server /uploads. Cloudinary only if VITE_PREFER_CLOUDINARY=true.
 */
export function resolveMediaSrc(path) {
  const candidates = buildMediaSrcCandidates(path);
  if (!candidates.length) return null;
  if (preferCdnFirst()) {
    const cdn = candidates.find(isCloudinaryUrl);
    if (cdn) return cdn;
  }
  return candidates[0];
}

/**
 * Ordered candidates for onError fallback.
 * Default: local uploads first, then original Cloudinary URL.
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

  const cdnFirst = preferCdnFirst();

  if (/^https?:\/\//i.test(value)) {
    const local = cloudinaryUrlToUploadsPath(value);
    if (cdnFirst) {
      push(value);
      if (local) push(toUploadsUrl(local));
    } else {
      if (local) push(toUploadsUrl(local));
      push(value);
    }
    return out;
  }

  const normalized = value.replace(/\\/g, '/').replace(/^\/+/, '');

  if (normalized.startsWith('uploads/')) {
    push(toUploadsUrl(normalized));
    if (cdnFirst) {
      const cloudUrl = uploadsPathToCloudinaryUrl(normalized);
      if (cloudUrl) push(cloudUrl);
    }
    return out;
  }

  push(toUploadsUrl(normalized));
  return out;
}

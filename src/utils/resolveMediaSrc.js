/**
 * Build display URL candidates for uploaded media.
 *
 * Live DB often stores `uploads/…` while the file also lives on Cloudinary
 * under `crm/<folder>/<file>`. Prefer CDN for those paths so local backends
 * without the binary still show images; keep `/uploads` as fallback.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'de9ba8bpk';

const UPLOAD_FOLDER_RE =
  /(outward_images|inward_images|daily_temp_monitor_images|crm\/(?:outward_images|inward_images|daily_temp_monitor_images))/i;

/** Map Cloudinary CRM URL → local uploads path. */
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

/** Map uploads/… path → Cloudinary CDN URL (testing / backup only). */
export function uploadsPathToCloudinaryUrl(raw) {
  if (raw == null) return null;
  const value = String(raw).trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (!value.startsWith('uploads/')) return null;

  const match = value.match(
    /^uploads\/(outward_images|inward_images|daily_temp_monitor_images)\/(.+)$/i
  );
  if (!match || !match[2]) return null;

  const folder = match[1];
  const file = match[2];
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/crm/${folder}/${file}`;
}

function isCloudinaryUrl(u) {
  return /^https?:\/\/res\.cloudinary\.com\//i.test(String(u || ''));
}

/** Live/production: Cloudinary first. Local: /uploads unless flag is on. */
function preferCdnFirst() {
  return import.meta.env.PROD || import.meta.env.VITE_PREFER_CLOUDINARY === 'true';
}

/**
 * Resolve a single best-effort src for <img>.
 * Default: `/uploads/…` on the API/server.
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
 * Default order: server uploads first; Cloudinary only if testing flag is on.
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
      if (local) push(`/${local}`);
    } else {
      // Feature: prefer mapped /uploads when CDN URL is stored
      if (local) push(`/${local}`);
      push(value);
    }
    return out;
  }

  const normalized = value.replace(/\\/g, '/').replace(/^\/+/, '');

  if (normalized.startsWith('uploads/')) {
    const cloudUrl = uploadsPathToCloudinaryUrl(normalized);
    // Live DB often stores uploads/… while the real file is on Cloudinary (same name).
    // Prefer CDN so local/dev backends without the file still show images.
    if (cloudUrl) push(cloudUrl);
    push(`/${normalized}`);
    return out;
  }

  if (!normalized.includes('/')) {
    push(`/${normalized}`);
  } else {
    push(`/${normalized}`);
  }
  return out;
}

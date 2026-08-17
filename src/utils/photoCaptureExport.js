/** CSV / Excel export helpers for photo capture time + GPS metadata. */

export const PHOTO_META_EXPORT_LABELS = {
  inward_invoice_photos: 'Invoice Photo',
  inward_pod_photo: 'POD Photo',
  inward_vehicle_seal_photo: 'Seal Photo',
  inward_vehicle_temp_photo: 'Vehicle Temp Photo',
  inward_material_temp_photo: 'Material Temp Photo',
  inward_vehicle_back_side_photo: 'Vehicle Back Photo',
  inward_vehicle_back_side_photo_with_material: 'Loaded Vehicle Photo',
  inward_count_sheet_photo: 'Count Sheet Photo',
  inward_damage_boxes_photo: 'Damage Boxes Photo',
  outward_invoice_photos: 'Invoice Photo',
  outward_pod_photo: 'POD Photo',
  outward_vehicle_seal_photo: 'Seal Photo',
  outward_vehicle_temp_photo: 'Vehicle Temp Photo',
  outward_pre_vehicle_temp_photo: 'Pre Vehicle Temp Photo',
  outward_material_temp_photo: 'Material Temp Photo',
  outward_vehicle_back_side_photo: 'Vehicle Back Photo',
  outward_vehicle_back_side_photo_with_material: 'Loaded Vehicle Photo',
  outward_count_sheet_photo: 'Count Sheet Photo',
  outward_damage_boxes_photo: 'Damage Boxes Photo',
};

export function formatPhotoGpsForExport(lat, lng, accuracy) {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return '';
  const acc =
    accuracy != null && accuracy !== '' && Number.isFinite(parseFloat(accuracy))
      ? ` (±${Math.round(parseFloat(accuracy))}m)`
      : '';
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}${acc}`;
}

export function formatPhotoCaptureMetadataForExport(raw) {
  if (!raw) return '';
  let meta = raw;
  if (typeof meta === 'string') {
    try {
      meta = JSON.parse(meta);
    } catch {
      return '';
    }
  }
  if (!meta || typeof meta !== 'object') return '';

  const parts = [];
  Object.entries(meta).forEach(([key, val]) => {
    const label = PHOTO_META_EXPORT_LABELS[key] || key.replace(/_/g, ' ');
    const entries = Array.isArray(val) ? val : [val];
    entries.forEach((entry, idx) => {
      if (!entry || typeof entry !== 'object') return;
      const suffix = Array.isArray(val) && val.length > 1 ? ` #${idx + 1}` : '';
      const time = entry.capturedAt ? String(entry.capturedAt) : '';
      const gps = formatPhotoGpsForExport(entry.latitude, entry.longitude, entry.accuracy);
      if (time && gps) {
        parts.push(`${label}${suffix}: ${time} @ ${gps}`);
      } else if (time) {
        parts.push(`${label}${suffix}: ${time}`);
      } else if (gps) {
        parts.push(`${label}${suffix}: ${gps}`);
      }
    });
  });

  return parts.join(' | ');
}

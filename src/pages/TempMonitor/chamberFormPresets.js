/** Shared chamber / inspection presets for DO Daily Chamber Temp Monitor */
export const CHAMBER_PRESETS = [
  'BDF-1',
  'BDF-2',
  'BDF-3',
  'BDF-4',
  'BDF-5',
  'BDF-6',
  'BDF-7',
  'BDF-8',
  'Antechamber'
];

export const INSPECTION_TIME_PRESETS = ['11:00', '18:00'];

export const DRAFT_STORAGE_KEY = 'do_chamber_temp_form_draft';

export function isPresetChamber(name) {
  return CHAMBER_PRESETS.includes(name);
}

export function isPresetInspectionTime(time) {
  return INSPECTION_TIME_PRESETS.includes(time);
}

export function readChamberFormDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeChamberFormDraft(formData) {
  try {
    sessionStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        entry_date: formData.entry_date,
        client_name: formData.client_name,
        chamber_name: formData.chamber_name,
        inspection_time: formData.inspection_time,
        chamber_temp: formData.chamber_temp,
        monitor_supervisor_name: formData.monitor_supervisor_name
      })
    );
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearChamberFormDraft() {
  try {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Chamber inspection task status for a Data Operator (Morning / Evening per client). */

export const localDateStr = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const logDateKey = (log) => {
  const raw = log?.formatted_date ?? log?.entry_date ?? log?.date ?? '';
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return localDateStr(raw);
  }
  const s = String(raw).trim();
  if (!s) return '';
  const ymd = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (ymd) return ymd[1];
  const dmy = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return localDateStr(parsed);
  return s.slice(0, 10);
};

export const resolveLogShift = (log) => {
  const s = String(log?.shift || '').trim();
  if (/^morning$/i.test(s)) return 'Morning';
  if (/^evening$/i.test(s)) return 'Evening';
  const t = String(log?.inspection_time || '').trim();
  if (!t) return 'Morning';
  if (t.startsWith('10:00') || t === '10:00 AM' || /^10:/.test(t)) return 'Morning';
  if (t.startsWith('16:00') || t.startsWith('18:00') || t.includes('04:00 PM') || t.includes('4:00 PM')) {
    return 'Evening';
  }
  if (/PM/i.test(t) && !/10:00/i.test(t)) return 'Evening';
  if (/AM/i.test(t)) return 'Morning';
  const hm = t.match(/^(\d{1,2}):(\d{2})/);
  if (hm) return parseInt(hm[1], 10) < 14 ? 'Morning' : 'Evening';
  return 'Morning';
};

const namesMatch = (a, b) =>
  String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

export const chamberNumberFromName = (name) => {
  const m = String(name || '').match(/(?:chamber\s*)?(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
};

const assignmentChamberNum = (assignment) => {
  const fromName = chamberNumberFromName(assignment?.chamber_name);
  if (fromName != null) return fromName;
  const id = Number(assignment?.chamber_id);
  return Number.isFinite(id) ? id : null;
};

export const logMatchesAssignment = (log, assignment) => {
  if (!log || !assignment) return false;
  if (!namesMatch(log.client_name, assignment.client_name)) return false;

  if (
    assignment.chamber_id != null &&
    log.chamber_id != null &&
    Number(log.chamber_id) === Number(assignment.chamber_id)
  ) {
    return true;
  }

  if (assignment.chamber_name && log.chamber_name && namesMatch(assignment.chamber_name, log.chamber_name)) {
    return true;
  }

  const assignNum = assignmentChamberNum(assignment);
  const logNum =
    chamberNumberFromName(log.chamber_name) ??
    (Number.isFinite(Number(log.chamber_id)) ? Number(log.chamber_id) : null);
  if (assignNum != null && logNum != null && assignNum === logNum) {
    return true;
  }

  return false;
};

export function enumerateDateKeys(fromDate, toDate) {
  const out = [];
  const from = new Date(`${fromDate}T12:00:00`);
  const to = new Date(`${toDate}T12:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return out;
  const cur = new Date(from);
  while (cur <= to) {
    out.push(localDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export function getActiveOperatorAssignments(mappings, chamberLimit) {
  const limit = Number(chamberLimit) || 4;
  const seen = new Set();
  const out = [];
  (mappings || []).forEach((row) => {
    if (!row || String(row.status || 'active').trim().toLowerCase() === 'inactive') return;
    const num = assignmentChamberNum(row);
    if (num != null && num > limit) return;
    const key = `${num ?? row.chamber_id ?? ''}|${String(row.client_name || '').trim().toLowerCase()}`;
    if (!String(row.client_name || '').trim() || seen.has(key)) return;
    seen.add(key);
    out.push({
      ...row,
      chamber_name: row.chamber_name || (num != null ? `Chamber ${num}` : row.chamber_name)
    });
  });
  return out;
}

export function getDefaultOpTaskRange(days = 7) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (Math.max(1, days) - 1));
  return { fromDate: localDateStr(from), toDate: localDateStr(to) };
};

export function findMatchingTaskLog(logs, assignment, dateKey, shift) {
  return (logs || []).find(
    (l) =>
      logDateKey(l) === dateKey &&
      logMatchesAssignment(l, assignment) &&
      resolveLogShift(l) === shift
  );
}

export function computeDoTaskStatus({
  assignments,
  logs,
  fromDate,
  toDate,
  today = localDateStr()
}) {
  if (!fromDate || !toDate) {
    return {
      completed: 0,
      pending: 0,
      overdue: 0,
      total: 0,
      statusLabel: 'Select date range',
      statusTone: 'muted',
      items: [],
      todayPending: 0,
      assignmentCount: assignments?.length || 0
    };
  }

  const dates = enumerateDateKeys(fromDate, toDate);
  const items = [];
  let completed = 0;
  let pending = 0;
  let overdue = 0;

  dates.forEach((dateKey) => {
    if (dateKey > today) return;

    (assignments || []).forEach((assignment) => {
      ['Morning', 'Evening'].forEach((shift) => {
        const log = findMatchingTaskLog(logs, assignment, dateKey, shift);

        let status;
        if (log) {
          status = 'completed';
          completed += 1;
        } else if (dateKey < today) {
          status = 'overdue';
          overdue += 1;
        } else {
          status = 'pending';
          pending += 1;
        }

        items.push({
          date: dateKey,
          shift,
          chamber_name: assignment.chamber_name || `Chamber ${assignment.chamber_id ?? '—'}`,
          client_name: assignment.client_name,
          status,
          reference_no: log?.reference_no || null,
          log: log || null,
          logId: log?.id ?? null
        });
      });
    });
  });

  const todayPending = items.filter((i) => i.date === today && i.status === 'pending').length;
  const hasOverdue = overdue > 0;

  let statusLabel = 'On track';
  let statusTone = 'good';
  if (!assignments?.length) {
    statusLabel = 'No active clients';
    statusTone = 'muted';
  } else if (hasOverdue && todayPending > 0) {
    statusLabel = 'Overdue & pending';
    statusTone = 'mixed';
  } else if (hasOverdue) {
    statusLabel = 'Overdue tasks';
    statusTone = 'bad';
  } else if (todayPending > 0) {
    statusLabel = 'Pending today';
    statusTone = 'warn';
  }

  return {
    completed,
    pending,
    overdue,
    total: items.length,
    statusLabel,
    statusTone,
    items,
    todayPending,
    assignmentCount: assignments?.length || 0
  };
}

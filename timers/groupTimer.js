const mongoose = require('mongoose');
const Group = require('../models/Group');
const User = require('../models/User');


const MAX_TIMEOUT = 24 * 60 * 60 * 1000;
const timeouts = new Map();

function intervalToMs(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Interval must be a positive number');
  }
  const factor = 24 * 60 * 60 * 1000; //ms to days

  return Math.floor(amount * factor);
}

async function userIsAdmin(username, group) {
  if (!username || !group) {
    return false;
  }
  if (Array.isArray(group.admins) && group.admins.indexOf(username) > -1) {
    return true;
  }
  const user = await User.findOne({ username });
  return !!(user && (user.accessLevel === 'admin' || user.accessLevel === 'superuser'));
}

const CLOSED_STATUSES = ['Fertig', 'Nicht relevant'];
const OVERDUE_STATUS = '\u00dcberf\u00e4llig'; // "Überfällig"

// Werte ausserhalb des gueltigen Bereichs zaehlen als 1 (wie im Frontend)
function clampValue(value, min, max) {
  const n = Number(value);
  return (n >= min && n <= max) ? n : 1;
}

function priorityOf(req) {
  return clampValue(req.cost, 1, 3) * clampValue(req.effort, 1, 3) * clampValue(req.impact, 1, 5);
}

// Hoechste Prioritaet zuerst, bei Gleichstand alphabetisch nach Titel
function comparePriority(a, b) {
  const diff = priorityOf(b) - priorityOf(a);
  if (diff !== 0) {
    return diff;
  }
  return String(a.title || '').localeCompare(String(b.title || ''));
}

// Kriterien, die noch in der Warteschlange des Timers stehen
function isQueued(req) {
  return !req.timerConsumed
    && CLOSED_STATUSES.indexOf(req.status) === -1
    && req.status !== OVERDUE_STATUS;
}

async function onGroupInterval(group) {
  // Called every time a group's configured interval elapses while the timer is running.
  // Das naechste faellige Kriterium (hoechste Prioritaet) wird auf "Ueberfaellig" gesetzt.
  // Kriterien mit Status "Fertig" / "Nicht relevant" werden uebersprungen.
  const next = (group.requirements || []).filter(isQueued).sort(comparePriority)[0];
  if (!next) {
    console.log(`Group timer tick for ${group.name}: no open requirement left`);
    return null;
  }
  next.status = OVERDUE_STATUS;
  next.timerConsumed = true;
  console.log(`Group timer tick for ${group.name}: "${next.title}" is now overdue`);
  return next;
}

function clearGroupTimeout(groupId) {
  const handle = timeouts.get(groupId);
  if (handle) {
    clearTimeout(handle);
  }
  timeouts.delete(groupId);
}

function ensureTimer(group) {
  if (!group.timer) {
    group.timer = {
      intervalValue: null,
      intervalUnit: 'days',
      status: 'off',
      lastTickAt: null,
      nextTickAt: null,
      remainingMs: null
    };
  }
  return group.timer;
}

function scheduleGroup(group) {
  if (!group) {
    return;
  }
  const id = group._id.toString();
  clearGroupTimeout(id);
  const timer = group.timer;
  if (!timer || timer.status !== 'running' || !timer.nextTickAt) {
    return;
  }
  const delay = new Date(timer.nextTickAt).getTime() - Date.now();
  if (delay <= 0) {
    handleTick(group._id);
    return;
  }
  const wait = Math.min(delay, MAX_TIMEOUT);
  timeouts.set(id, setTimeout(async () => {
    const fresh = await Group.findById(group._id);
    scheduleGroup(fresh);
  }, wait));
}

async function handleTick(groupId) {
  const group = await Group.findById(groupId);
  if (!group) {
    return;
  }
  const timer = ensureTimer(group);
  if (timer.status !== 'running') {
    return;
  }
  if (timer.nextTickAt && new Date(timer.nextTickAt).getTime() > Date.now()) {
    scheduleGroup(group);
    return;
  }
  await onGroupInterval(group);
  const ms = intervalToMs(timer.intervalValue);
  const now = new Date();
  timer.lastTickAt = now;
  timer.nextTickAt = new Date(now.getTime() + ms);
  timer.remainingMs = null;
  await group.save();
  scheduleGroup(group);
}

async function applyTimerChange(group, { intervalValue, intervalUnit, action }) {
  const timer = ensureTimer(group);
  const now = Date.now();

  if (action === 'set') {
    const ms = intervalToMs(intervalValue);
    timer.intervalValue = Number(intervalValue);
    if (timer.status === 'running') {
      timer.nextTickAt = new Date(now + ms);
      timer.remainingMs = null;
    } else if (timer.status === 'paused') {
      timer.remainingMs = ms;
      timer.nextTickAt = null;
    }
  } else if (action === 'start') {
    if (intervalValue != null && intervalValue !== '') {
      timer.intervalValue = Number(intervalValue);
    }
    const ms = intervalToMs(timer.intervalValue);
    timer.status = 'running';
    timer.nextTickAt = new Date(now + ms);
    timer.remainingMs = null;
  } else if (action === 'pause') {
    if (timer.status !== 'running') {
      throw new Error('Timer is not running');
    }
    const remaining = timer.nextTickAt ? Math.max(0, new Date(timer.nextTickAt).getTime() - now) : 0;
    timer.status = 'paused';
    timer.remainingMs = remaining;
    timer.nextTickAt = null;
  } else if (action === 'resume') {
    if (timer.status !== 'paused') {
      throw new Error('Timer is not paused');
    }
    const remaining = timer.remainingMs != null
      ? timer.remainingMs
      : intervalToMs(timer.intervalValue);
    timer.status = 'running';
    timer.nextTickAt = new Date(now + remaining);
    timer.remainingMs = null;
  } else if (action === 'off') {
    timer.status = 'off';
    timer.nextTickAt = null;
    timer.remainingMs = null;
  } else {
    throw new Error('Unknown timer action');
  }

  await group.save();
  scheduleGroup(group);
  return group;
}

// Loest den Timer einmal manuell aus (wie ein regulaerer Ablauf).
// Laeuft der Timer, beginnt das Intervall danach von vorne.
async function triggerGroupNow(group) {
  const timer = ensureTimer(group);
  const changed = await onGroupInterval(group);
  if (timer.status === 'running') {
    const now = new Date();
    timer.lastTickAt = now;
    timer.nextTickAt = new Date(now.getTime() + intervalToMs(timer.intervalValue));
    timer.remainingMs = null;
  }
  await group.save();
  scheduleGroup(group);
  return { group, changed };
}

async function startScheduler() {
  if (mongoose.connection.readyState !== 1) {
    mongoose.connection.once('open', () => {
      startScheduler().catch((err) => console.error('Failed to start group timers', err));
    });
    return;
  }
  const groups = await Group.find({ 'timer.status': 'running' });
  groups.forEach(scheduleGroup);
  console.log(`Group timers started (${groups.length} running)`);
}

module.exports = {
  userIsAdmin,
  onGroupInterval,
  applyTimerChange,
  triggerGroupNow,
  startScheduler,
  scheduleGroup
};

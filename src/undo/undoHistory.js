import { CALENDAR_STORAGE_KEY } from "../calendar/calendarStore";
import { PLANNING_STORAGE_KEY } from "../planning/planningStore";

const MAX_STACK = 50;

const undoStack = [];
const redoStack = [];

let isRestoring = false;

const captureSnapshot = () => ({
  planning: window.localStorage.getItem(PLANNING_STORAGE_KEY),
  calendar: window.localStorage.getItem(CALENDAR_STORAGE_KEY),
});

const snapshotsEqual = (a, b) =>
  a.planning === b.planning && a.calendar === b.calendar;

const notifyStoresUpdated = () => {
  window.dispatchEvent(new CustomEvent("lp21-planning-updated"));
  window.dispatchEvent(new CustomEvent("lp21-calendar-updated"));
};

const applySnapshot = (snap) => {
  if (!snap) {
    return;
  }
  if (snap.planning) {
    window.localStorage.setItem(PLANNING_STORAGE_KEY, snap.planning);
  } else {
    window.localStorage.removeItem(PLANNING_STORAGE_KEY);
  }
  if (snap.calendar) {
    window.localStorage.setItem(CALENDAR_STORAGE_KEY, snap.calendar);
  } else {
    window.localStorage.removeItem(CALENDAR_STORAGE_KEY);
  }
};

/** Vor jedem Speichern aufrufen (Planung/Kalender). */
export const recordUndoSnapshot = () => {
  if (isRestoring) {
    return;
  }
  const snap = captureSnapshot();
  const top = undoStack[undoStack.length - 1];
  if (top && snapshotsEqual(top, snap)) {
    return;
  }
  undoStack.push(snap);
  if (undoStack.length > MAX_STACK) {
    undoStack.shift();
  }
  redoStack.length = 0;
};

export const canUndo = () => undoStack.length > 0;

export const canRedo = () => redoStack.length > 0;

export const performUndo = () => {
  if (undoStack.length === 0) {
    return false;
  }
  const prev = undoStack.pop();
  redoStack.push(captureSnapshot());
  isRestoring = true;
  try {
    applySnapshot(prev);
    notifyStoresUpdated();
  } finally {
    isRestoring = false;
  }
  return true;
};

export const performRedo = () => {
  if (redoStack.length === 0) {
    return false;
  }
  const next = redoStack.pop();
  undoStack.push(captureSnapshot());
  isRestoring = true;
  try {
    applySnapshot(next);
    notifyStoresUpdated();
  } finally {
    isRestoring = false;
  }
  return true;
};

export const clearUndoHistory = () => {
  undoStack.length = 0;
  redoStack.length = 0;
};

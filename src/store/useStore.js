import { useState, useEffect, useCallback, useRef } from 'react';
import { idbGet, idbPut } from '../utils/idb';

const KEYS = {
  WORK_ENTRIES: 'wt_work_entries',
  EVENTS:       'wt_events',
  TODOS:        'wt_todos',
};

// ── Synchronous localStorage helpers (seed + fallback) ────────────────────
function lsLoad(key) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : []; }
  catch { return []; }
}
function lsSave(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

// ── Bootstrap: start with localStorage so first render is instant ──────────
let _workEntries = lsLoad(KEYS.WORK_ENTRIES);
let _events      = lsLoad(KEYS.EVENTS);
let _todos       = lsLoad(KEYS.TODOS);

// Track whether IndexedDB has loaded (may have more / fresher data than LS)
let _idbReady = false;

const _listeners = new Set();
function notify() { _listeners.forEach(fn => fn()); }

/** Persist to both IndexedDB (primary) and localStorage (fallback). */
function save(key, value) {
  lsSave(key, value);
  idbPut(key, value); // fire-and-forget; idb.js swallows errors
}

/** On startup: load from IndexedDB and replace in-memory state if IDB has data. */
async function hydrateFromIDB() {
  const [we, ev, td] = await Promise.all([
    idbGet(KEYS.WORK_ENTRIES),
    idbGet(KEYS.EVENTS),
    idbGet(KEYS.TODOS),
  ]);

  let changed = false;
  if (Array.isArray(we) && we.length >= _workEntries.length) { _workEntries = we; changed = true; }
  if (Array.isArray(ev) && ev.length >= _events.length)      { _events      = ev; changed = true; }
  if (Array.isArray(td) && td.length >= _todos.length)       { _todos       = td; changed = true; }

  _idbReady = true;
  if (changed) notify();
}

hydrateFromIDB();

// ── Public: bulk-replace all data (used by import) ────────────────────────
export function replaceAllData({ workEntries, events, todos }) {
  _workEntries = workEntries;
  _events      = events;
  _todos       = todos;
  save(KEYS.WORK_ENTRIES, _workEntries);
  save(KEYS.EVENTS,       _events);
  save(KEYS.TODOS,        _todos);
  notify();
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useStore() {
  const [, rerender] = useState(0);

  useEffect(() => {
    const fn = () => rerender(n => n + 1);
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  }, []);

  // ── Work Entries ─────────────────────────────────────────────
  const addWorkEntry = useCallback((entry) => {
    const item = { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    _workEntries = [..._workEntries, item];
    save(KEYS.WORK_ENTRIES, _workEntries);
    notify();
    return item;
  }, []);

  const updateWorkEntry = useCallback((id, updates) => {
    _workEntries = _workEntries.map(e =>
      e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e);
    save(KEYS.WORK_ENTRIES, _workEntries);
    notify();
  }, []);

  const deleteWorkEntry = useCallback((id) => {
    _workEntries = _workEntries.filter(e => e.id !== id);
    save(KEYS.WORK_ENTRIES, _workEntries);
    notify();
  }, []);

  // A range entry (endDate set) matches a day if that day falls within [date, endDate].
  // A single-day entry matches only its exact date.
  const getWorkEntriesForDate = useCallback((d) =>
    _workEntries.filter(e => e.date <= d && (e.endDate ? e.endDate >= d : e.date === d)), []);

  // For range queries: entry overlaps [s, e] if entry.date <= e AND entry.end >= s
  const getWorkEntriesInRange = useCallback((s, e) =>
    _workEntries.filter(x => x.date <= e && (x.endDate ? x.endDate >= s : x.date >= s)), []);

  // ── Events ───────────────────────────────────────────────────
  const addEvent = useCallback((event) => {
    const item = { ...event, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    _events = [..._events, item];
    save(KEYS.EVENTS, _events);
    notify();
    return item;
  }, []);

  const updateEvent = useCallback((id, updates) => {
    _events = _events.map(e => e.id === id ? { ...e, ...updates } : e);
    save(KEYS.EVENTS, _events);
    notify();
  }, []);

  const deleteEvent = useCallback((id) => {
    _events = _events.filter(e => e.id !== id);
    save(KEYS.EVENTS, _events);
    notify();
  }, []);

  const getEventsForDate  = useCallback((d)  => _events.filter(e => e.date === d), []);
  const getEventsInRange  = useCallback((s,e) => _events.filter(x => x.date >= s && x.date <= e), []);

  // ── Todos ─────────────────────────────────────────────────────
  const addTodo = useCallback((todo) => {
    const item = { ...todo, id: crypto.randomUUID(), completed: false, createdAt: new Date().toISOString() };
    _todos = [..._todos, item];
    save(KEYS.TODOS, _todos);
    notify();
    return item;
  }, []);

  const updateTodo = useCallback((id, updates) => {
    _todos = _todos.map(t => t.id === id ? { ...t, ...updates } : t);
    save(KEYS.TODOS, _todos);
    notify();
  }, []);

  const deleteTodo = useCallback((id) => {
    _todos = _todos.filter(t => t.id !== id);
    save(KEYS.TODOS, _todos);
    notify();
  }, []);

  const toggleTodo = useCallback((id) => {
    _todos = _todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    save(KEYS.TODOS, _todos);
    notify();
  }, []);

  // A day-scope todo appears on dateStr if:
  //   a) scopeValue === dateStr  (its origin day), OR
  //   b) it has a dueDate > scopeValue AND dateStr falls in [scopeValue, dueDate]
  //      AND it is not yet completed (spread stops once done)
  const getTodosForDate = useCallback((d) =>
    _todos.filter(t => {
      if (t.scope !== 'day') return false;
      if (t.scopeValue === d) return true;
      // spread: show on every day between scopeValue and dueDate while pending
      if (t.dueDate && t.dueDate > t.scopeValue && d > t.scopeValue && d <= t.dueDate && !t.completed)
        return true;
      return false;
    }), []);

  const getTodosForWeek  = useCallback((w) => _todos.filter(t => t.scope === 'week'  && t.scopeValue === w), []);
  const getTodosForMonth = useCallback((m) => _todos.filter(t => t.scope === 'month' && t.scopeValue === m), []);

  // ── Reorder helpers ───────────────────────────────────────────
  const reorderWorkEntries = useCallback((fromIdx, toIdx) => {
    const arr = [..._workEntries];
    const [moved] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, moved);
    _workEntries = arr;
    save(KEYS.WORK_ENTRIES, _workEntries);
    notify();
  }, []);

  const reorderEvents = useCallback((fromIdx, toIdx) => {
    const arr = [..._events];
    const [moved] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, moved);
    _events = arr;
    save(KEYS.EVENTS, _events);
    notify();
  }, []);

  const reorderTodos = useCallback((fromIdx, toIdx) => {
    const arr = [..._todos];
    const [moved] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, moved);
    _todos = arr;
    save(KEYS.TODOS, _todos);
    notify();
  }, []);

  return {
    workEntries: _workEntries,
    events:      _events,
    todos:       _todos,
    addWorkEntry, updateWorkEntry, deleteWorkEntry,
    getWorkEntriesForDate, getWorkEntriesInRange,
    reorderWorkEntries,
    addEvent, updateEvent, deleteEvent,
    getEventsForDate, getEventsInRange,
    reorderEvents,
    addTodo, updateTodo, deleteTodo, toggleTodo,
    getTodosForDate, getTodosForWeek, getTodosForMonth,
    reorderTodos,
  };
}

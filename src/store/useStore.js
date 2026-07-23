import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEYS = {
  WORK_ENTRIES: 'wt_work_entries',
  EVENTS: 'wt_events',
  TODOS: 'wt_todos',
};

function loadFromStorage(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Singleton state shared across hook calls
let _workEntries = loadFromStorage(STORAGE_KEYS.WORK_ENTRIES);
let _events = loadFromStorage(STORAGE_KEYS.EVENTS);
let _todos = loadFromStorage(STORAGE_KEYS.TODOS);
const _listeners = new Set();

function notify() {
  _listeners.forEach(fn => fn());
}

export function useStore() {
  const [, rerender] = useState(0);

  useEffect(() => {
    const fn = () => rerender(n => n + 1);
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  }, []);

  // ── Work Entries ──────────────────────────────────────────────
  const addWorkEntry = useCallback((entry) => {
    const newEntry = { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    _workEntries = [..._workEntries, newEntry];
    saveToStorage(STORAGE_KEYS.WORK_ENTRIES, _workEntries);
    notify();
    return newEntry;
  }, []);

  const updateWorkEntry = useCallback((id, updates) => {
    _workEntries = _workEntries.map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e);
    saveToStorage(STORAGE_KEYS.WORK_ENTRIES, _workEntries);
    notify();
  }, []);

  const deleteWorkEntry = useCallback((id) => {
    _workEntries = _workEntries.filter(e => e.id !== id);
    saveToStorage(STORAGE_KEYS.WORK_ENTRIES, _workEntries);
    notify();
  }, []);

  const getWorkEntriesForDate = useCallback((dateStr) => {
    return _workEntries.filter(e => e.date === dateStr);
  }, []);

  const getWorkEntriesInRange = useCallback((startDate, endDate) => {
    return _workEntries.filter(e => e.date >= startDate && e.date <= endDate);
  }, []);

  // ── Events ───────────────────────────────────────────────────
  const addEvent = useCallback((event) => {
    const newEvent = { ...event, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    _events = [..._events, newEvent];
    saveToStorage(STORAGE_KEYS.EVENTS, _events);
    notify();
    return newEvent;
  }, []);

  const updateEvent = useCallback((id, updates) => {
    _events = _events.map(e => e.id === id ? { ...e, ...updates } : e);
    saveToStorage(STORAGE_KEYS.EVENTS, _events);
    notify();
  }, []);

  const deleteEvent = useCallback((id) => {
    _events = _events.filter(e => e.id !== id);
    saveToStorage(STORAGE_KEYS.EVENTS, _events);
    notify();
  }, []);

  const getEventsForDate = useCallback((dateStr) => {
    return _events.filter(e => e.date === dateStr);
  }, []);

  const getEventsInRange = useCallback((startDate, endDate) => {
    return _events.filter(e => e.date >= startDate && e.date <= endDate);
  }, []);

  // ── Todos ─────────────────────────────────────────────────────
  const addTodo = useCallback((todo) => {
    const newTodo = { ...todo, id: crypto.randomUUID(), completed: false, createdAt: new Date().toISOString() };
    _todos = [..._todos, newTodo];
    saveToStorage(STORAGE_KEYS.TODOS, _todos);
    notify();
    return newTodo;
  }, []);

  const updateTodo = useCallback((id, updates) => {
    _todos = _todos.map(t => t.id === id ? { ...t, ...updates } : t);
    saveToStorage(STORAGE_KEYS.TODOS, _todos);
    notify();
  }, []);

  const deleteTodo = useCallback((id) => {
    _todos = _todos.filter(t => t.id !== id);
    saveToStorage(STORAGE_KEYS.TODOS, _todos);
    notify();
  }, []);

  const toggleTodo = useCallback((id) => {
    _todos = _todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveToStorage(STORAGE_KEYS.TODOS, _todos);
    notify();
  }, []);

  const getTodosForDate = useCallback((dateStr) => {
    return _todos.filter(t => t.scope === 'day' && t.scopeValue === dateStr);
  }, []);

  const getTodosForWeek = useCallback((weekStr) => {
    return _todos.filter(t => t.scope === 'week' && t.scopeValue === weekStr);
  }, []);

  const getTodosForMonth = useCallback((monthStr) => {
    return _todos.filter(t => t.scope === 'month' && t.scopeValue === monthStr);
  }, []);

  return {
    workEntries: _workEntries,
    events: _events,
    todos: _todos,
    addWorkEntry, updateWorkEntry, deleteWorkEntry,
    getWorkEntriesForDate, getWorkEntriesInRange,
    addEvent, updateEvent, deleteEvent,
    getEventsForDate, getEventsInRange,
    addTodo, updateTodo, deleteTodo, toggleTodo,
    getTodosForDate, getTodosForWeek, getTodosForMonth,
  };
}

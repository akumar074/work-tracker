import { useState } from 'react';
import { useStore } from './store/useStore';
import CalendarView from './components/CalendarView';
import DayDetail from './components/DayDetail';
import ExportPanel from './components/ExportPanel';
import { fmt } from './utils/dateUtils';
import { Download, LayoutDashboard, ListTodo, CalendarDays } from 'lucide-react';
import './App.css';

export default function App() {
  const store = useStore();
  const [selectedDate, setSelectedDate] = useState(fmt(new Date()));
  const [viewMode, setViewMode] = useState('month');
  const [showExport, setShowExport] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'todos' | 'overview'

  const pendingTodos = store.todos.filter(t => !t.completed).length;
  const todayEntries = store.getWorkEntriesForDate(fmt(new Date()));
  const todayHours = todayEntries.reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);

  return (
    <div className="app">
      {/* ── Top Bar ──────────────────────────────────────── */}
      <header className="topbar">
        <div className="topbar-brand">
          <span className="brand-icon">📋</span>
          <span className="brand-name">Work Tracker</span>
        </div>
        <div className="topbar-stats">
          <span className="stat-pill">Today: <strong>{todayHours}h</strong></span>
          <span className="stat-pill">Pending todos: <strong>{pendingTodos}</strong></span>
        </div>
        <button className="btn btn-outline" onClick={() => setShowExport(true)}>
          <Download size={15} /> Export Excel
        </button>
      </header>

      {/* ── Nav Tabs ─────────────────────────────────────── */}
      <nav className="tab-nav">
        <button className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}>
          <CalendarDays size={16} /> Calendar
        </button>
        <button className={`tab-btn ${activeTab === 'todos' ? 'active' : ''}`}
          onClick={() => setActiveTab('todos')}>
          <ListTodo size={16} /> All Todos
          {pendingTodos > 0 && <span className="tab-badge">{pendingTodos}</span>}
        </button>
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}>
          <LayoutDashboard size={16} /> Overview
        </button>
      </nav>

      {/* ── Main ─────────────────────────────────────────── */}
      <main className="main-content">
        {activeTab === 'calendar' && (
          <div className="calendar-layout">
            <CalendarView
              store={store}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
            <DayDetail dateStr={selectedDate} store={store} />
          </div>
        )}
        {activeTab === 'todos' && <AllTodosView store={store} />}
        {activeTab === 'overview' && <OverviewView store={store} />}
      </main>

      {showExport && <ExportPanel store={store} onClose={() => setShowExport(false)} />}
    </div>
  );
}

// ── All Todos View ──────────────────────────────────────────────────────────
import TodoModal from './components/TodoModal';
import { Plus, Pencil, Trash2, CheckSquare, Square } from 'lucide-react';

function AllTodosView({ store }) {
  const [filter, setFilter] = useState('all');  // all | pending | completed
  const [scopeFilter, setScopeFilter] = useState('all');
  const [todoModal, setTodoModal] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const PRIORITY_COLORS = { high: '#ef4444', medium: '#f97316', low: '#6b7280' };

  let todos = store.todos;
  if (filter === 'pending') todos = todos.filter(t => !t.completed);
  if (filter === 'completed') todos = todos.filter(t => t.completed);
  if (scopeFilter !== 'all') todos = todos.filter(t => t.scope === scopeFilter);

  const grouped = todos.reduce((acc, t) => {
    const key = `${t.scope}:${t.scopeValue}`;
    if (!acc[key]) acc[key] = { scope: t.scope, scopeValue: t.scopeValue, items: [] };
    acc[key].items.push(t);
    return acc;
  }, {});

  return (
    <div className="todos-page">
      <div className="todos-toolbar">
        <h2>All Todos</h2>
        <div className="todos-filters">
          {['all', 'pending', 'completed'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
          <select className="scope-select" value={scopeFilter} onChange={e => setScopeFilter(e.target.value)}>
            <option value="all">All Scopes</option>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setTodoModal('add')}>
          <Plus size={14} /> New Todo
        </button>
      </div>

      {Object.keys(grouped).length === 0
        ? <div className="empty-state"><p>No todos found.</p></div>
        : Object.values(grouped).sort((a, b) => b.scopeValue.localeCompare(a.scopeValue)).map(group => (
          <div key={`${group.scope}:${group.scopeValue}`} className="todo-group">
            <div className="todo-group-header">
              <span className="scope-label">{group.scope.toUpperCase()}</span>
              <span className="scope-value">{group.scopeValue}</span>
              <span className="muted">{group.items.filter(t => t.completed).length}/{group.items.length} done</span>
            </div>
            {group.items.map(t => (
              <div key={t.id} className={`todo-item ${t.completed ? 'completed' : ''}`}>
                <button className="icon-btn" onClick={() => store.toggleTodo(t.id)}>
                  {t.completed ? <CheckSquare size={16} color="#10b981" /> : <Square size={16} />}
                </button>
                <div className="todo-content">
                  <span className="todo-title">{t.title}</span>
                  <div className="todo-meta">
                    <span style={{ color: PRIORITY_COLORS[t.priority] }}>{t.priority}</span>
                    {t.dueDate && <span className="muted">due {t.dueDate}</span>}
                    {t.notes && <span className="muted">{t.notes}</span>}
                  </div>
                </div>
                <div className="item-actions">
                  <button className="icon-btn" onClick={() => setTodoModal(t)}><Pencil size={14} /></button>
                  <button className="icon-btn danger" onClick={() => setConfirmId(t.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        ))
      }

      {todoModal && (
        <TodoModal
          todo={todoModal === 'add' ? null : todoModal}
          onSave={data => {
            if (todoModal === 'add') store.addTodo(data);
            else store.updateTodo(todoModal.id, data);
            setTodoModal(null);
          }}
          onClose={() => setTodoModal(null)}
        />
      )}
      {confirmId && (
        <div className="modal-overlay" onClick={() => setConfirmId(null)}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Todo?</h3>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { store.deleteTodo(confirmId); setConfirmId(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Overview / Dashboard ────────────────────────────────────────────────────
import { fmt as fmtDate, getDateRangePreset } from './utils/dateUtils';

function OverviewView({ store }) {
  const last30 = getDateRangePreset('lastMonth');
  const recentEntries = store.getWorkEntriesInRange(last30.start, last30.end);
  const recentEvents = store.getEventsInRange(last30.start, last30.end);
  const totalHours = recentEntries.reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);
  const leaves = recentEvents.filter(e => e.type === 'leave' || e.type === 'sick').length;
  const pending = store.todos.filter(t => !t.completed).length;
  const done = store.todos.filter(t => t.completed).length;

  // Category breakdown
  const catMap = recentEntries.reduce((acc, e) => {
    acc[e.category || 'Other'] = (acc[e.category || 'Other'] || 0) + 1;
    return acc;
  }, {});

  // Recent activity (last 7 entries)
  const recent = [...store.workEntries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  return (
    <div className="overview-page">
      <h2>Dashboard</h2>
      <p className="muted">Last 30 days overview</p>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-num">{recentEntries.length}</span>
          <span className="stat-label">Work Entries</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{totalHours.toFixed(1)}h</span>
          <span className="stat-label">Hours Logged</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{leaves}</span>
          <span className="stat-label">Leave Days</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{pending}</span>
          <span className="stat-label">Pending Todos</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{done}</span>
          <span className="stat-label">Completed Todos</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{recentEvents.length}</span>
          <span className="stat-label">Events</span>
        </div>
      </div>

      <div className="overview-row">
        <div className="overview-card">
          <h3>Category Breakdown</h3>
          {Object.keys(catMap).length === 0
            ? <p className="empty-hint">No entries yet.</p>
            : Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
              <div key={cat} className="cat-row">
                <span className="cat-name">{cat}</span>
                <div className="cat-bar-bg">
                  <div className="cat-bar"
                    style={{ width: `${Math.round((count / recentEntries.length) * 100)}%` }} />
                </div>
                <span className="cat-count">{count}</span>
              </div>
            ))
          }
        </div>

        <div className="overview-card">
          <h3>Recent Activity</h3>
          {recent.length === 0
            ? <p className="empty-hint">No work entries yet.</p>
            : recent.map(e => (
              <div key={e.id} className="recent-row">
                <span className="recent-date">{e.date}</span>
                <span className="recent-title">{e.title}</span>
                {e.hours && <span className="recent-hours">{e.hours}h</span>}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useStore } from './store/useStore';
import CalendarView from './components/CalendarView';
import DayDetail from './components/DayDetail';
import ExportPanel from './components/ExportPanel';
import TodoModal from './components/TodoModal';
import WorkEntryModal from './components/WorkEntryModal';
import {
  fmt, fmtDisplay, getDateRangePreset, subDays, startOfMonth, subMonths, format
} from './utils/dateUtils';
import ImportExportPanel from './components/ImportExportPanel';
import GistPanel from './components/GistPanel';
import {
  LayoutDashboard, CalendarDays, ListTodo, BookOpen,
  Download, Upload, Plus, Pencil, Trash2, CheckSquare, Square,
  Clock, Tag, TrendingUp, Activity, ChevronRight, X, Menu, Cloud
} from 'lucide-react';
import './App.css';

const NAV = [
  { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'calendar',  label: 'Calendar',   icon: CalendarDays },
  { id: 'logs',      label: 'Work Logs',  icon: BookOpen },
  { id: 'todos',     label: 'Todos',      icon: ListTodo },
];

const EVENT_COLORS = {
  leave:'#ef4444',holiday:'#f97316',sick:'#8b5cf6',wfh:'#06b6d4',
  travel:'#3b82f6',training:'#10b981',meeting:'#f59e0b',other:'#6b7280',
};
const PRIORITY_COLORS = { high:'#ef4444', medium:'#f59e0b', low:'#10b981' };

export default function App() {
  const store = useStore();
  const [page, setPage] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(fmt(new Date()));
  const [viewMode, setViewMode] = useState('month');
  const [showExport, setShowExport] = useState(false);
  const [showIE, setShowIE] = useState(false);
  const [showGist, setShowGist] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const pendingTodos = store.todos.filter(t => !t.completed).length;
  const todayEntries = store.getWorkEntriesForDate(fmt(new Date()));
  const todayHours = todayEntries.reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">📋</span>
          <span className="sidebar-logo-text">WorkTracker</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`sidebar-link ${page === id ? 'active' : ''}`}
              onClick={() => setPage(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === 'todos' && pendingTodos > 0 &&
                <span className="sidebar-badge">{pendingTodos}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={() => setShowGist(true)}>
            <Cloud size={18} /><span>Gist Sync</span>
          </button>
          <button className="sidebar-link" onClick={() => setShowIE(true)}>
            <Upload size={18} /><span>Import / Export</span>
          </button>
          <button className="sidebar-link" onClick={() => setShowExport(true)}>
            <Download size={18} /><span>Export Excel</span>
          </button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────── */}
      <div className="main-area">

        {/* Topbar */}
        <header className="topbar">
          <button className="icon-btn topbar-toggle" onClick={() => setSidebarOpen(s => !s)}>
            <Menu size={20} />
          </button>
          <div className="topbar-title">
            {NAV.find(n => n.id === page)?.label ?? 'WorkTracker'}
          </div>
          <div className="topbar-pills">
            <span className="stat-pill">Today <strong>{todayHours}h</strong></span>
            <span className="stat-pill">Pending <strong>{pendingTodos}</strong></span>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          {page === 'dashboard' && <DashboardPage store={store} onNavigate={setPage} />}
          {page === 'calendar'  && (
            <div className="calendar-layout-stacked">
              <CalendarView store={store} selectedDate={selectedDate}
                onSelectDate={setSelectedDate} viewMode={viewMode} onViewModeChange={setViewMode} />
              <DayDetail dateStr={selectedDate} store={store} />
            </div>
          )}
          {page === 'logs'   && <LogsPage store={store} />}
          {page === 'todos'  && <TodosPage store={store} />}
        </main>
      </div>

      {showExport && <ExportPanel store={store} onClose={() => setShowExport(false)} />}
      {showIE && <ImportExportPanel store={store} onClose={() => setShowIE(false)} />}
      {showGist && <GistPanel store={store} onClose={() => setShowGist(false)} />}
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function DashboardPage({ store, onNavigate }) {
  const today = new Date();
  const last30 = getDateRangePreset('last3Months');
  const entries = store.getWorkEntriesInRange(last30.start, last30.end);
  const events  = store.getEventsInRange(last30.start, last30.end);
  const totalHours = entries.reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);
  const leaves  = events.filter(e => e.type === 'leave' || e.type === 'sick').length;
  const pending = store.todos.filter(t => !t.completed).length;
  const done    = store.todos.filter(t =>  t.completed).length;
  const avgHours = entries.length ? (totalHours / entries.length).toFixed(1) : 0;

  // Last 12 weeks bar chart data
  const weeklyData = useMemo(() => {
    const weeks = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = fmt(subDays(today, i * 7 + 6));
      const weekEnd   = fmt(subDays(today, i * 7));
      const wEntries  = store.getWorkEntriesInRange(weekStart, weekEnd);
      const hours     = wEntries.reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);
      weeks.push({ label: format(new Date(weekEnd + 'T00:00:00'), 'MMM d'), hours });
    }
    return weeks;
  }, [store.workEntries]);

  // Last 30 days daily hours — sparkline
  const dailyData = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = fmt(subDays(today, i));
      const h = store.getWorkEntriesForDate(d).reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);
      days.push(h);
    }
    return days;
  }, [store.workEntries]);

  // Category donut
  const catMap = useMemo(() => {
    const m = {};
    entries.forEach(e => { m[e.category || 'Other'] = (m[e.category || 'Other'] || 0) + (parseFloat(e.hours) || 1); });
    return m;
  }, [entries]);
  const catTotal = Object.values(catMap).reduce((a, b) => a + b, 0);

  // Recent 6 entries
  const recent = [...store.workEntries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return (
    <div className="dashboard">

      {/* KPI row */}
      <div className="kpi-row">
        <KpiCard label="Hours Logged" value={`${totalHours.toFixed(1)}h`} sub="last 3 months" color="accent" icon={<Clock size={20}/>} />
        <KpiCard label="Work Entries" value={entries.length} sub="last 3 months" color="secondary" icon={<BookOpen size={20}/>} />
        <KpiCard label="Avg hrs / entry" value={`${avgHours}h`} sub="last 3 months" color="teal" icon={<TrendingUp size={20}/>} />
        <KpiCard label="Pending Todos" value={pending} sub={`${done} completed`} color="warning" icon={<ListTodo size={20}/>} />
        <KpiCard label="Leave / Sick" value={leaves} sub="last 3 months" color="danger" icon={<Activity size={20}/>} />
      </div>

      {/* Charts row */}
      <div className="charts-row">
        <div className="chart-card wide">
          <div className="chart-card-header">
            <span className="chart-card-title">Weekly Hours</span>
            <span className="chart-card-sub">Last 12 weeks</span>
          </div>
          <BarChart data={weeklyData} />
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <span className="chart-card-title">Category Mix</span>
            <span className="chart-card-sub">by hours</span>
          </div>
          <DonutChart data={catMap} total={catTotal} />
        </div>
      </div>

      {/* Sparkline + recent */}
      <div className="charts-row">
        <div className="chart-card wide">
          <div className="chart-card-header">
            <span className="chart-card-title">Daily Activity</span>
            <span className="chart-card-sub">Last 30 days</span>
          </div>
          <Sparkline data={dailyData} />
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <span className="chart-card-title">Todo Progress</span>
            <span className="chart-card-sub">{done}/{done + pending} done</span>
          </div>
          <TodoProgress done={done} pending={pending} />
        </div>
      </div>

      {/* Recent activity */}
      <div className="recent-card">
        <div className="recent-card-header">
          <span className="chart-card-title">Recent Work Entries</span>
          <button className="btn btn-sm btn-ghost" onClick={() => onNavigate('logs')}>
            View all <ChevronRight size={13}/>
          </button>
        </div>
        {recent.length === 0
          ? <p className="empty-hint">No entries yet.</p>
          : <div className="recent-list">
            {recent.map(e => (
              <div key={e.id} className="recent-entry">
                <div className="recent-entry-date">{e.date}</div>
                <div className="recent-entry-title">{e.title}</div>
                <span className="category-badge">{e.category}</span>
                {e.hours && <span className="recent-entry-hours">{e.hours}h</span>}
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color, icon }) {
  return (
    <div className={`kpi-card kpi-${color}`}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-body">
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-sub">{sub}</div>
      </div>
    </div>
  );
}

// ── SVG Charts ───────────────────────────────────────────────────────────────
function BarChart({ data }) {
  if (!data.length) return <p className="empty-hint">No data yet.</p>;
  const max = Math.max(...data.map(d => d.hours), 1);
  const W = 600, H = 160, PAD = 32, BAR_GAP = 4;
  const barW = (W - PAD * 2) / data.length - BAR_GAP;

  return (
    <svg viewBox={`0 0 ${W} ${H + 28}`} className="chart-svg" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={PAD} x2={W - PAD} y1={H - H * f} y2={H - H * f}
          stroke="var(--border)" strokeWidth="1" />
      ))}
      {data.map((d, i) => {
        const x = PAD + i * (barW + BAR_GAP);
        const bh = d.hours > 0 ? Math.max((d.hours / max) * H, 3) : 0;
        const y = H - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx="3"
              fill={d.hours > 0 ? 'var(--accent)' : 'var(--surface2)'}
              opacity={d.hours > 0 ? 0.85 : 0.4} />
            {d.hours > 0 && (
              <text x={x + barW / 2} y={y - 3} textAnchor="middle"
                fontSize="8" fill="var(--accent)" fontWeight="600">{d.hours.toFixed(1)}</text>
            )}
            {i % 2 === 0 && (
              <text x={x + barW / 2} y={H + 14} textAnchor="middle"
                fontSize="9" fill="var(--muted)">{d.label}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Sparkline({ data }) {
  if (!data.length) return <p className="empty-hint">No data yet.</p>;
  const max = Math.max(...data, 1);
  const W = 600, H = 100, PAD = 8;
  const step = (W - PAD * 2) / (data.length - 1);

  const points = data.map((v, i) => [PAD + i * step, H - (v / max) * (H - 10)]);
  const polyline = points.map(([x, y]) => `${x},${y}`).join(' ');
  const area = `M${points[0][0]},${H} ` + points.map(([x, y]) => `L${x},${y}`).join(' ') + ` L${points[points.length - 1][0]},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H + 10}`} className="chart-svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-grad)" />
      <polyline points={polyline} fill="none" stroke="var(--accent)" strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round" />
      {points.map(([x, y], i) => data[i] > 0 && (
        <circle key={i} cx={x} cy={y} r="3" fill="var(--accent)" />
      ))}
    </svg>
  );
}

function DonutChart({ data, total }) {
  if (!total) return <p className="empty-hint">No entries yet.</p>;
  const COLORS = ['var(--accent)','var(--secondary)','var(--teal)','var(--warning)','var(--danger)',
                  '#06b6d4','#84cc16','#ec4899'];
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const R = 60, CX = 90, CY = 75, stroke = 28;
  let cum = 0;
  const slices = entries.map(([cat, val], i) => {
    const pct = val / total;
    const start = cum * 2 * Math.PI - Math.PI / 2;
    cum += pct;
    const end = cum * 2 * Math.PI - Math.PI / 2;
    const x1 = CX + R * Math.cos(start), y1 = CY + R * Math.sin(start);
    const x2 = CX + R * Math.cos(end),   y2 = CY + R * Math.sin(end);
    const large = pct > 0.5 ? 1 : 0;
    return { cat, pct, d: `M${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2}`, color: COLORS[i % COLORS.length] };
  });

  return (
    <div className="donut-wrap">
      <svg viewBox={`0 0 ${CX * 2 + 10} ${CY * 2 + 10}`} className="donut-svg">
        {slices.map((s, i) => (
          <path key={i} d={s.d} fill="none" stroke={s.color}
            strokeWidth={stroke} strokeLinecap="butt" />
        ))}
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize="14" fontWeight="800"
          fill="var(--text)">{total.toFixed(0)}</text>
        <text x={CX} y={CY + 10} textAnchor="middle" fontSize="9"
          fill="var(--muted)">total hrs</text>
      </svg>
      <div className="donut-legend">
        {slices.slice(0, 6).map((s, i) => (
          <div key={i} className="donut-legend-item">
            <span className="donut-dot" style={{ background: s.color }} />
            <span className="donut-cat">{s.cat}</span>
            <span className="donut-pct">{(s.pct * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TodoProgress({ done, pending }) {
  const total = done + pending;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const R = 54, CX = 80, CY = 80, circ = 2 * Math.PI * R;
  const dash = (pct / 100) * circ;

  return (
    <div className="progress-wrap">
      <svg viewBox="0 0 160 160" className="progress-svg">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--surface2)" strokeWidth="16" />
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--teal)" strokeWidth="16"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${CX} ${CY})`} />
        <text x={CX} y={CY - 8} textAnchor="middle" fontSize="22" fontWeight="900"
          fill="var(--text)">{pct}%</text>
        <text x={CX} y={CY + 12} textAnchor="middle" fontSize="11"
          fill="var(--muted)">complete</text>
      </svg>
      <div className="progress-stats">
        <div className="progress-stat"><span className="ps-num" style={{color:'var(--teal)'}}>{done}</span><span className="ps-lbl">Done</span></div>
        <div className="progress-stat"><span className="ps-num" style={{color:'var(--warning)'}}>{pending}</span><span className="ps-lbl">Pending</span></div>
        <div className="progress-stat"><span className="ps-num">{total}</span><span className="ps-lbl">Total</span></div>
      </div>
    </div>
  );
}

// ── Work Logs Page ────────────────────────────────────────────────────────────
function LogsPage({ store }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [workModal, setWorkModal] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const cats = ['all', ...new Set(store.workEntries.map(e => e.category).filter(Boolean))];

  const entries = [...store.workEntries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter(e => catFilter === 'all' || e.category === catFilter)
    .filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.description || '').toLowerCase().includes(search.toLowerCase()));

  const totalHours = entries.reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);

  return (
    <div className="logs-page">
      <div className="page-toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Work Logs</h1>
          <span className="page-meta">{entries.length} entries · {totalHours.toFixed(1)}h total</span>
        </div>
        <div className="toolbar-right">
          <input className="search-input" placeholder="Search…" value={search}
            onChange={e => setSearch(e.target.value)} />
          <select className="filter-select" value={catFilter}
            onChange={e => setCatFilter(e.target.value)}>
            {cats.map(c => <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setWorkModal('add')}>
            <Plus size={14} /> New Entry
          </button>
        </div>
      </div>

      <div className="logs-table-wrap">
        {entries.length === 0
          ? <div className="empty-state"><BookOpen size={40} /><p>No entries found.</p></div>
          : (
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Date</th><th>Title</th><th>Category</th>
                  <th>Hours</th><th>Tags</th><th></th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id}>
                    <td className="td-date">{e.date}</td>
                    <td className="td-title">
                      <span className="entry-title">{e.title}</span>
                      {e.description && <span className="entry-desc">{e.description}</span>}
                    </td>
                    <td><span className="category-badge">{e.category}</span></td>
                    <td className="td-hours">{e.hours ? `${e.hours}h` : '—'}</td>
                    <td className="td-tags">
                      {(e.tags || []).map(t => <span key={t} className="tag-chip">{t}</span>)}
                    </td>
                    <td className="td-actions">
                      <button className="icon-btn" onClick={() => setWorkModal(e)}><Pencil size={13}/></button>
                      <button className="icon-btn danger" onClick={() => setConfirmId(e.id)}><Trash2 size={13}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>

      {workModal && (
        <WorkEntryModal
          date={fmt(new Date())}
          entry={workModal === 'add' ? null : workModal}
          onSave={data => {
            if (workModal === 'add') store.addWorkEntry(data);
            else store.updateWorkEntry(workModal.id, data);
            setWorkModal(null);
          }}
          onClose={() => setWorkModal(null)}
        />
      )}
      {confirmId && (
        <ConfirmModal text="Delete this work entry?" onConfirm={() => { store.deleteWorkEntry(confirmId); setConfirmId(null); }} onClose={() => setConfirmId(null)} />
      )}
    </div>
  );
}

// ── Todos Page ────────────────────────────────────────────────────────────────
function TodosPage({ store }) {
  const [filter, setFilter] = useState('all');
  const [todoModal, setTodoModal] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  let todos = [...store.todos].sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 };
    return (p[a.priority] ?? 1) - (p[b.priority] ?? 1);
  });
  if (filter === 'pending')   todos = todos.filter(t => !t.completed);
  if (filter === 'completed') todos = todos.filter(t =>  t.completed);

  const grouped = todos.reduce((acc, t) => {
    const key = `${t.scope}:${t.scopeValue}`;
    if (!acc[key]) acc[key] = { scope: t.scope, scopeValue: t.scopeValue, items: [] };
    acc[key].items.push(t);
    return acc;
  }, {});

  return (
    <div className="todos-page">
      <div className="page-toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Todos</h1>
          <span className="page-meta">{store.todos.filter(t=>!t.completed).length} pending</span>
        </div>
        <div className="toolbar-right">
          <div className="filter-pills">
            {['all','pending','completed'].map(f => (
              <button key={f} className={`filter-pill ${filter===f?'active':''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setTodoModal('add')}>
            <Plus size={14}/> New Todo
          </button>
        </div>
      </div>

      {Object.keys(grouped).length === 0
        ? <div className="empty-state"><ListTodo size={40}/><p>No todos found.</p></div>
        : Object.values(grouped).sort((a,b) => b.scopeValue.localeCompare(a.scopeValue)).map(group => (
          <div key={`${group.scope}:${group.scopeValue}`} className="todo-group">
            <div className="todo-group-header">
              <span className="scope-label">{group.scope}</span>
              <span className="scope-value">{group.scopeValue}</span>
              <span className="scope-progress">
                {group.items.filter(t=>t.completed).length}/{group.items.length}
              </span>
            </div>
            {group.items.map(t => (
              <div key={t.id} className={`todo-row ${t.completed?'completed':''}`}>
                <button className="icon-btn" onClick={() => store.toggleTodo(t.id)}>
                  {t.completed
                    ? <CheckSquare size={16} color="var(--teal)"/>
                    : <Square size={16}/>}
                </button>
                <div className="todo-row-body">
                  <span className="todo-title">{t.title}</span>
                  <div className="todo-meta">
                    <span className="priority-dot" style={{background: PRIORITY_COLORS[t.priority]}}/>
                    <span style={{color: PRIORITY_COLORS[t.priority], fontSize:11, fontWeight:700}}>{t.priority}</span>
                    {t.dueDate && <span className="muted">· due {t.dueDate}</span>}
                    {t.notes && <span className="muted">· {t.notes}</span>}
                  </div>
                </div>
                <div className="item-actions">
                  <button className="icon-btn" onClick={() => setTodoModal(t)}><Pencil size={13}/></button>
                  <button className="icon-btn danger" onClick={() => setConfirmId(t.id)}><Trash2 size={13}/></button>
                </div>
              </div>
            ))}
          </div>
        ))
      }

      {todoModal && (
        <TodoModal
          todo={todoModal==='add' ? null : todoModal}
          onSave={data => {
            if (todoModal==='add') store.addTodo(data);
            else store.updateTodo(todoModal.id, data);
            setTodoModal(null);
          }}
          onClose={() => setTodoModal(null)}
        />
      )}
      {confirmId && (
        <ConfirmModal text="Delete this todo?" onConfirm={() => { store.deleteTodo(confirmId); setConfirmId(null); }} onClose={() => setConfirmId(null)} />
      )}
    </div>
  );
}

function ConfirmModal({ text, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
        <h3>Confirm</h3>
        <p>{text} This cannot be undone.</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

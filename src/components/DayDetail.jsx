import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Clock, Tag, CheckSquare, Square, ChevronDown, ChevronUp, GripVertical, ArrowRightLeft, Eye } from 'lucide-react';
import { fmt, fmtDisplay, fmtWeekKey, fmtMonthKey } from '../utils/dateUtils';
import WorkEntryModal from './WorkEntryModal';
import EventModal from './EventModal';
import TodoModal from './TodoModal';
import ItemDetailDialog from './ItemDetailDialog';

const EVENT_COLORS = {
  leave: '#ef4444', holiday: '#f97316', sick: '#8b5cf6', wfh: '#06b6d4',
  travel: '#3b82f6', training: '#10b981', meeting: '#f59e0b', other: '#6b7280',
};
const EVENT_EMOJI = {
  leave: '🏖️', holiday: '🎉', sick: '🤒', wfh: '🏠',
  travel: '✈️', training: '📚', meeting: '👥', other: '📌',
};
const PRIORITY_COLORS = { high: '#ef4444', medium: '#f97316', low: '#6b7280' };

// ── Generic drag-reorder hook ─────────────────────────────────────────────────
function useDragReorder(items, reorder) {
  const dragIdx = useRef(null);
  const [overIdx, setOverIdx] = useState(null);

  function onDragStart(e, idx) {
    dragIdx.current = idx;
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging');
  }

  function onDragOver(e, idx) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIdx(idx);
  }

  function onDragLeave() { setOverIdx(null); }

  function onDrop(e, idx) {
    e.preventDefault();
    setOverIdx(null);
    if (dragIdx.current !== null && dragIdx.current !== idx) {
      reorder(dragIdx.current, idx);
    }
    dragIdx.current = null;
  }

  function onDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    setOverIdx(null);
    dragIdx.current = null;
  }

  return { overIdx, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd };
}

// ── Helpers to map a displayed list item back to global index ─────────────────
function globalIdx(allItems, item) {
  return allItems.findIndex(x => x.id === item.id);
}

export default function DayDetail({ dateStr, store }) {
  const [workModal, setWorkModal] = useState(null);
  const [eventModal, setEventModal] = useState(null);
  const [todoModal, setTodoModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [convertTodo, setConvertTodo] = useState(null);
  const [viewItem, setViewItem] = useState(null); // { item, type }
  const [sectionsOpen, setSectionsOpen] = useState({ work: true, events: true, todos: true });

  if (!dateStr) {
    return (
      <div className="day-detail empty-state">
        <p>Select a day on the calendar to view details</p>
      </div>
    );
  }

  const date = new Date(dateStr + 'T00:00:00');
  const weekKey = fmtWeekKey(date);
  const monthKey = fmtMonthKey(date);

  const workEntries = store.getWorkEntriesForDate(dateStr);
  const events      = store.getEventsForDate(dateStr);
  const dayTodos    = store.getTodosForDate(dateStr);
  const weekTodos   = store.getTodosForWeek(weekKey);
  const monthTodos  = store.getTodosForMonth(monthKey);
  const totalHours  = workEntries.reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);

  function toggleSection(key) {
    setSectionsOpen(s => ({ ...s, [key]: !s[key] }));
  }

  function handleDeleteConfirmed() {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'work')  store.deleteWorkEntry(confirmDelete.id);
    if (confirmDelete.type === 'event') store.deleteEvent(confirmDelete.id);
    if (confirmDelete.type === 'todo')  store.deleteTodo(confirmDelete.id);
    setConfirmDelete(null);
  }

  // Drag state for each section
  const workDrag  = useDragReorder(store.workEntries, (fi, ti) =>
    store.reorderWorkEntries(globalIdx(store.workEntries, workEntries[fi]), globalIdx(store.workEntries, workEntries[ti])));

  const eventDrag = useDragReorder(store.events, (fi, ti) =>
    store.reorderEvents(globalIdx(store.events, events[fi]), globalIdx(store.events, events[ti])));

  // For todos we operate on the combined visible list per group independently
  function makeTodoDrag(visibleList) {
    return useDragReorder(store.todos, (fi, ti) =>
      store.reorderTodos(globalIdx(store.todos, visibleList[fi]), globalIdx(store.todos, visibleList[ti])));
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const dayTodoDrag   = makeTodoDrag(dayTodos);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const weekTodoDrag  = makeTodoDrag(weekTodos);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const monthTodoDrag = makeTodoDrag(monthTodos);

  function renderTodoList(todos, scopeLabel, drag) {
    if (!todos.length) return <p className="empty-hint">No {scopeLabel} todos yet.</p>;
    return todos.map((t, i) => {
      const isSpread = t.scopeValue !== dateStr; // shown via spread, not origin day
      return (
        <div
          key={t.id}
          className={`todo-item ${t.completed ? 'completed' : ''} ${drag.overIdx === i ? 'drag-over' : ''}`}
          draggable
          onDragStart={e => drag.onDragStart(e, i)}
          onDragOver={e => drag.onDragOver(e, i)}
          onDragLeave={drag.onDragLeave}
          onDrop={e => drag.onDrop(e, i)}
          onDragEnd={drag.onDragEnd}
        >
          <span className="drag-handle"><GripVertical size={13} /></span>
          <button className="icon-btn" onClick={() => store.toggleTodo(t.id)}>
            {t.completed ? <CheckSquare size={16} color="#10b981" /> : <Square size={16} />}
          </button>
          <div className="todo-content">
            <span className="todo-title">{t.title}</span>
            <div className="todo-meta">
              <span className={`priority-pill priority-pill--${t.priority}`}>
                {t.priority}
              </span>
              {t.dueDate && <span className="muted">due {t.dueDate}</span>}
              {isSpread && <span className="spread-badge">↩ from {t.scopeValue}</span>}
            </div>
          </div>
          <div className="item-actions">
            <button className="icon-btn" title="View details" onClick={() => setViewItem({ item: t, type: 'todo' })}><Eye size={13} /></button>
            <button className="icon-btn convert-btn" title="Convert to work entry" onClick={() => setConvertTodo(t)}>
              <ArrowRightLeft size={13} />
            </button>
            <button className="icon-btn" title="Edit"   onClick={() => setTodoModal(t)}><Pencil size={14} /></button>
            <button className="icon-btn danger" title="Delete" onClick={() => setConfirmDelete({ type: 'todo', id: t.id })}><Trash2 size={14} /></button>
          </div>
        </div>
      );
    });
  }

  return (
    <div className="day-detail">
      <div className="day-detail-header">
        <h2>{fmtDisplay(date)}</h2>
        {totalHours > 0 && <span className="hours-badge">{totalHours}h logged</span>}
      </div>

      {/* ── Work Entries ──────────────────────────────────── */}
      <section className="detail-section">
        <div className="section-header" onClick={() => toggleSection('work')}>
          <h3>💼 Work Entries <span className="count">{workEntries.length}</span></h3>
          <div className="section-actions">
            <button className="btn btn-sm btn-primary" onClick={e => { e.stopPropagation(); setWorkModal('add'); }}>
              <Plus size={14} /> Add
            </button>
            {sectionsOpen.work ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
        {sectionsOpen.work && (
          <div className="section-body">
            {workEntries.length === 0
              ? <p className="empty-hint">No work entries yet. Click Add to log work.</p>
              : workEntries.map((entry, i) => (
                <div
                  key={entry.id}
                  className={`work-item draggable-item ${workDrag.overIdx === i ? 'drag-over' : ''}`}
                  draggable
                  onDragStart={e => workDrag.onDragStart(e, i)}
                  onDragOver={e => workDrag.onDragOver(e, i)}
                  onDragLeave={workDrag.onDragLeave}
                  onDrop={e => workDrag.onDrop(e, i)}
                  onDragEnd={workDrag.onDragEnd}
                >
                  <div className="work-item-top">
                    <span className="drag-handle"><GripVertical size={13} /></span>
                    <span className="work-title">{entry.title}</span>
                    <div className="item-actions">
                      <button className="icon-btn" title="View details" onClick={() => setViewItem({ item: entry, type: 'work' })}><Eye size={14} /></button>
                      <button className="icon-btn" title="Edit"   onClick={() => setWorkModal(entry)}><Pencil size={14} /></button>
                      <button className="icon-btn danger" title="Delete" onClick={() => setConfirmDelete({ type: 'work', id: entry.id })}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="work-meta">
                    <span className="category-badge">{entry.category}</span>
                    {entry.endDate && entry.endDate !== entry.date && (
                      <span className="date-range-badge">📅 {entry.date} → {entry.endDate}</span>
                    )}
                    {entry.hours && <span><Clock size={12} /> {entry.hours}h</span>}
                    {(entry.tags || []).map(tag => (
                      <span key={tag} className="tag-pill"><Tag size={10} />{tag}</span>
                    ))}
                  </div>
                  {entry.description && <p className="work-desc">{entry.description}</p>}
                </div>
              ))
            }
          </div>
        )}
      </section>

      {/* ── Events ────────────────────────────────────────── */}
      <section className="detail-section">
        <div className="section-header" onClick={() => toggleSection('events')}>
          <h3>📅 Events <span className="count">{events.length}</span></h3>
          <div className="section-actions">
            <button className="btn btn-sm btn-secondary" onClick={e => { e.stopPropagation(); setEventModal('add'); }}>
              <Plus size={14} /> Add
            </button>
            {sectionsOpen.events ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
        {sectionsOpen.events && (
          <div className="section-body">
            {events.length === 0
              ? <p className="empty-hint">No events for this day.</p>
              : events.map((ev, i) => (
                <div
                  key={ev.id}
                  className={`event-item draggable-item ${eventDrag.overIdx === i ? 'drag-over' : ''}`}
                  draggable
                  onDragStart={e => eventDrag.onDragStart(e, i)}
                  onDragOver={e => eventDrag.onDragOver(e, i)}
                  onDragLeave={eventDrag.onDragLeave}
                  onDrop={e => eventDrag.onDrop(e, i)}
                  onDragEnd={eventDrag.onDragEnd}
                  style={{ borderLeftColor: EVENT_COLORS[ev.type] || EVENT_COLORS.other }}
                >
                  <span className="drag-handle"><GripVertical size={13} /></span>
                  <span className="event-emoji">{EVENT_EMOJI[ev.type] || '📌'}</span>
                  <div className="event-content">
                    <span className="event-title">{ev.title}</span>
                    <span className="event-type muted">{ev.type}</span>
                    {ev.description && <p className="event-desc">{ev.description}</p>}
                  </div>
                  <div className="item-actions">
                    <button className="icon-btn" title="View details" onClick={() => setViewItem({ item: ev, type: 'event' })}><Eye size={14} /></button>
                    <button className="icon-btn" onClick={() => setEventModal(ev)}><Pencil size={14} /></button>
                    <button className="icon-btn danger" onClick={() => setConfirmDelete({ type: 'event', id: ev.id })}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </section>

      {/* ── Todos ─────────────────────────────────────────── */}
      <section className="detail-section">
        <div className="section-header" onClick={() => toggleSection('todos')}>
          <h3>✅ Todos <span className="count">{dayTodos.length + weekTodos.length + monthTodos.length}</span></h3>
          <div className="section-actions">
            <button className="btn btn-sm btn-tertiary" onClick={e => { e.stopPropagation(); setTodoModal('add'); }}>
              <Plus size={14} /> Add
            </button>
            {sectionsOpen.todos ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
        {sectionsOpen.todos && (
          <div className="section-body">
            {dayTodos.length > 0 && <div className="todo-group-label">Day</div>}
            {renderTodoList(dayTodos, 'day', dayTodoDrag)}
            {weekTodos.length > 0 && <div className="todo-group-label">Week ({weekKey})</div>}
            {weekTodos.length > 0 && renderTodoList(weekTodos, 'week', weekTodoDrag)}
            {monthTodos.length > 0 && <div className="todo-group-label">Month ({monthKey})</div>}
            {monthTodos.length > 0 && renderTodoList(monthTodos, 'month', monthTodoDrag)}
            {dayTodos.length === 0 && weekTodos.length === 0 && monthTodos.length === 0 &&
              <p className="empty-hint">No todos. Click Add to create one.</p>}
          </div>
        )}
      </section>

      {/* ── Modals ────────────────────────────────────────── */}
      {workModal && (
        <WorkEntryModal
          date={dateStr}
          entry={workModal === 'add' ? null : workModal}
          onSave={data => {
            if (workModal === 'add') store.addWorkEntry(data);
            else store.updateWorkEntry(workModal.id, data);
            setWorkModal(null);
          }}
          onClose={() => setWorkModal(null)}
        />
      )}
      {eventModal && (
        <EventModal
          date={dateStr}
          event={eventModal === 'add' ? null : eventModal}
          onSave={data => {
            if (eventModal === 'add') store.addEvent(data);
            else store.updateEvent(eventModal.id, data);
            setEventModal(null);
          }}
          onClose={() => setEventModal(null)}
        />
      )}
      {todoModal && (
        <TodoModal
          date={dateStr}
          todo={todoModal === 'add' ? null : todoModal}
          onSave={data => {
            if (todoModal === 'add') store.addTodo(data);
            else store.updateTodo(todoModal.id, data);
            setTodoModal(null);
          }}
          onClose={() => setTodoModal(null)}
        />
      )}
      {convertTodo && (
        <WorkEntryModal
          convertMode
          date={convertTodo.scope === 'day' ? convertTodo.scopeValue : dateStr}
          entry={{
            title:       convertTodo.title,
            description: convertTodo.notes || '',
            category:    'Development',
            hours:       '',
            tags:        [],
            date:        convertTodo.scope === 'day' ? convertTodo.scopeValue : dateStr,
            endDate:     convertTodo.dueDate && convertTodo.scope === 'day' &&
                         convertTodo.dueDate !== convertTodo.scopeValue ? convertTodo.dueDate : null,
          }}
          onSave={data => {
            store.addWorkEntry(data);
            store.updateTodo(convertTodo.id, { completed: true });
            setConvertTodo(null);
          }}
          onClose={() => setConvertTodo(null)}
        />
      )}

      {/* ── Item Detail View ──────────────────────────────── */}
      {viewItem && (
        <ItemDetailDialog
          item={viewItem.item}
          type={viewItem.type}
          onClose={() => setViewItem(null)}
          onEdit={() => {
            if (viewItem.type === 'work')  { setWorkModal(viewItem.item);  setViewItem(null); }
            if (viewItem.type === 'event') { setEventModal(viewItem.item); setViewItem(null); }
            if (viewItem.type === 'todo')  { setTodoModal(viewItem.item);  setViewItem(null); }
          }}
          onConvert={() => {
            setConvertTodo(viewItem.item);
            setViewItem(null);
          }}
        />
      )}

      {/* ── Confirm Delete ────────────────────────────────── */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this {confirmDelete.type}? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteConfirmed}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

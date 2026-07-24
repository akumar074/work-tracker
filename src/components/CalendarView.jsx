import { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import {
  fmt, fmtMonth, getMonthGrid, getWeekDays, fmtWeekKey,
  isToday, isSameMonth, isSameDay, addMonths, subDays, addDays, addWeeks,
  startOfWeek, endOfWeek, format
} from '../utils/dateUtils';

const EVENT_COLORS = {
  leave: '#ef4444',
  holiday: '#f97316',
  sick: '#8b5cf6',
  wfh: '#06b6d4',
  travel: '#3b82f6',
  training: '#10b981',
  meeting: '#f59e0b',
  other: '#6b7280',
};

const EVENT_EMOJI = {
  leave: '🏖️', holiday: '🎉', sick: '🤒', wfh: '🏠',
  travel: '✈️', training: '📚', meeting: '👥', other: '📌',
};

export default function CalendarView({ store, selectedDate, onSelectDate, viewMode, onViewModeChange }) {
  const [navDate, setNavDate] = useState(selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date());

  const goToPrev = () => {
    if (viewMode === 'month') setNavDate(d => addMonths(d, -1));
    else setNavDate(d => addDays(d, -7));
  };
  const goToNext = () => {
    if (viewMode === 'month') setNavDate(d => addMonths(d, 1));
    else setNavDate(d => addDays(d, 7));
  };
  const goToToday = () => { setNavDate(new Date()); onSelectDate(fmt(new Date())); };

  function renderDayCell(day) {
    const dateStr = fmt(day);
    const isSelected = selectedDate === dateStr;
    const todayFlag = isToday(day);
    const inMonth = viewMode === 'week' || isSameMonth(day, navDate);
    const entries = store.getWorkEntriesForDate(dateStr);
    const events  = store.getEventsForDate(dateStr);
    const todos   = store.getTodosForDate(dateStr);
    const totalHours   = entries.reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);
    const pendingTodos = todos.filter(t => !t.completed).length;
    const doneTodos    = todos.filter(t =>  t.completed).length;

    // Collapse many events: show first two inline, rest as "+N"
    const visibleEvents = events.slice(0, 2);
    const extraEvents   = events.length - visibleEvents.length;

    return (
      <div
        key={dateStr}
        className={`calendar-day ${isSelected ? 'selected' : ''} ${todayFlag ? 'today' : ''} ${!inMonth ? 'out-of-month' : ''}`}
        onClick={() => onSelectDate(dateStr)}
      >
        {/* ── Day number row ── */}
        <div className="day-header-row">
          <span className="day-number">{format(day, 'd')}</span>
          {entries.length > 0 && (
            <span className="day-chip work-chip" title={`${entries.length} work entr${entries.length > 1 ? 'ies' : 'y'}`}>
              {entries.length}w
            </span>
          )}
        </div>

        {/* ── Work hours pill ── */}
        {totalHours > 0 && (
          <div className="day-row day-row-work" title={`${totalHours}h logged`}>
            <span className="day-row-icon">⏱</span>
            <span className="day-row-text">{totalHours}h</span>
          </div>
        )}

        {/* ── Events ── */}
        {visibleEvents.map(ev => (
          <div key={ev.id} className="day-row day-row-event" title={ev.title}
            style={{ '--ev-color': EVENT_COLORS[ev.type] || EVENT_COLORS.other }}>
            <span className="day-row-icon">{EVENT_EMOJI[ev.type] || '📌'}</span>
            <span className="day-row-text day-row-truncate">{ev.title}</span>
          </div>
        ))}
        {extraEvents > 0 && (
          <div className="day-row day-row-more">+{extraEvents} more</div>
        )}

        {/* ── Todos ── */}
        {(pendingTodos > 0 || doneTodos > 0) && (
          <div className="day-row day-row-todo"
            title={`${pendingTodos} pending · ${doneTodos} done`}>
            <span className="day-row-icon">✓</span>
            <span className="day-row-text">
              {pendingTodos > 0 && <span className="todo-pending-count">{pendingTodos}</span>}
              {pendingTodos > 0 && doneTodos > 0 && <span className="todo-sep">/</span>}
              {doneTodos > 0 && <span className="todo-done-count">{doneTodos}</span>}
              <span className="todo-label"> todo{(pendingTodos + doneTodos) > 1 ? 's' : ''}</span>
            </span>
          </div>
        )}
      </div>
    );
  }

  const days = viewMode === 'month' ? getMonthGrid(navDate) : getWeekDays(navDate);
  const weekStart = startOfWeek(navDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(navDate, { weekStartsOn: 1 });

  return (
    <div className="calendar-container">
      <div className="calendar-toolbar">
        <div className="cal-nav">
          <button className="icon-btn" onClick={goToPrev}><ChevronLeft size={18} /></button>
          <h3 className="cal-title">
            {viewMode === 'month'
              ? fmtMonth(navDate)
              : `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`}
          </h3>
          <button className="icon-btn" onClick={goToNext}><ChevronRight size={18} /></button>
        </div>
        <div className="cal-controls">
          <button className="btn btn-sm btn-ghost" onClick={goToToday}>
            <CalendarDays size={14} /> Today
          </button>
          <div className="view-toggle">
            <button className={`btn btn-sm ${viewMode === 'month' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => onViewModeChange('month')}>Month</button>
            <button className={`btn btn-sm ${viewMode === 'week' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => onViewModeChange('week')}>Week</button>
          </div>
        </div>
      </div>

      <div className="calendar-grid">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="calendar-header-cell">{d}</div>
        ))}
        {days.map(day => renderDayCell(day))}
      </div>

      <div className="calendar-legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#3b82f6' }} />Work Entry</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }} />Leave</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#10b981' }} />Todo</span>
      </div>
    </div>
  );
}

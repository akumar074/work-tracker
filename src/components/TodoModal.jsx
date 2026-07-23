import { useState } from 'react';
import { X } from 'lucide-react';
import { fmt, fmtWeekKey, fmtMonthKey } from '../utils/dateUtils';

const SCOPES = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

function defaultScopeValue(scope, date) {
  const d = date ? new Date(date + 'T00:00:00') : new Date();
  if (scope === 'day') return fmt(d);
  if (scope === 'week') return fmtWeekKey(d);
  if (scope === 'month') return fmtMonthKey(d);
  return fmt(d);
}

export default function TodoModal({ date, todo, onSave, onClose }) {
  const isEdit = !!todo;
  const [form, setForm] = useState({
    title: todo?.title || '',
    scope: todo?.scope || 'day',
    scopeValue: todo?.scopeValue || defaultScopeValue('day', date),
    priority: todo?.priority || 'medium',
    dueDate: todo?.dueDate || '',
    notes: todo?.notes || '',
  });
  const [errors, setErrors] = useState({});

  function handleScopeChange(scope) {
    setForm(f => ({ ...f, scope, scopeValue: defaultScopeValue(scope, date) }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setErrors({ title: 'Title is required' }); return; }
    onSave(form);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Todo' : 'Add Todo'}</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Title *</label>
            <input type="text" value={form.title} placeholder="What needs to be done?"
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            {errors.title && <span className="error">{errors.title}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Scope</label>
              <select value={form.scope} onChange={e => handleScopeChange(e.target.value)}>
                {SCOPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Scope Value</label>
              {form.scope === 'day' ? (
                <input type="date" value={form.scopeValue}
                  onChange={e => setForm(f => ({ ...f, scopeValue: e.target.value }))} />
              ) : (
                <input type="text" value={form.scopeValue}
                  placeholder={form.scope === 'week' ? 'e.g. 2025-W22' : 'e.g. 2025-06'}
                  onChange={e => setForm(f => ({ ...f, scopeValue: e.target.value }))} />
              )}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input type="date" value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea rows={3} value={form.notes} placeholder="Additional details..."
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{isEdit ? 'Save Changes' : 'Add Todo'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

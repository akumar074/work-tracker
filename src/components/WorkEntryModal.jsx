import { useState } from 'react';
import { X } from 'lucide-react';
import { fmt, fmtDisplay } from '../utils/dateUtils';

const CATEGORIES = ['Development', 'Meeting', 'Review', 'Documentation', 'Testing', 'Research', 'Other'];

export default function WorkEntryModal({ date, entry, onSave, onClose }) {
  const isEdit = !!entry;
  const [form, setForm] = useState({
    title: entry?.title || '',
    description: entry?.description || '',
    category: entry?.category || 'Development',
    hours: entry?.hours || '',
    tags: entry?.tags?.join(', ') || '',
    date: entry?.date || date || fmt(new Date()),
    endDate: entry?.endDate || '',
  });
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (form.hours && (isNaN(form.hours) || form.hours < 0 || form.hours > 24))
      e.hours = 'Hours must be 0–24';
    if (form.endDate && form.endDate < form.date)
      e.endDate = 'End date must be on or after start date';
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({
      ...form,
      endDate: form.endDate || null,
      hours: form.hours ? parseFloat(form.hours) : null,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    });
  }

  const isRange = !!(form.endDate && form.endDate !== form.date);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Work Entry' : 'Add Work Entry'}</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>End Date <span className="muted">(optional)</span></label>
              <input type="date" value={form.endDate}
                min={form.date}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              {errors.endDate && <span className="error">{errors.endDate}</span>}
            </div>
          </div>
          {isRange && (
            <p className="date-range-hint">
              📅 This entry spans <strong>{daysBetween(form.date, form.endDate)}</strong> days
            </p>
          )}
          <div className="form-group">
            <label>Title *</label>
            <input type="text" value={form.title} placeholder="What did you work on?"
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            {errors.title && <span className="error">{errors.title}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Hours</label>
              <input type="number" step="0.5" min="0" max="24" value={form.hours}
                placeholder="e.g. 2.5"
                onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} />
              {errors.hours && <span className="error">{errors.hours}</span>}
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={4} value={form.description} placeholder="Details about the work..."
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Tags <span className="muted">(comma separated)</span></label>
            <input type="text" value={form.tags} placeholder="e.g. backend, api, bug-fix"
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{isEdit ? 'Save Changes' : 'Add Entry'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function daysBetween(start, end) {
  const ms = new Date(end + 'T00:00:00') - new Date(start + 'T00:00:00');
  return Math.round(ms / 86400000) + 1;
}

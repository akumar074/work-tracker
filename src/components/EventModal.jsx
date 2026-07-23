import { useState } from 'react';
import { X } from 'lucide-react';
import { fmt } from '../utils/dateUtils';

const EVENT_TYPES = [
  { value: 'leave', label: '🏖️ Leave / Day Off' },
  { value: 'holiday', label: '🎉 Public Holiday' },
  { value: 'sick', label: '🤒 Sick Leave' },
  { value: 'wfh', label: '🏠 Work From Home' },
  { value: 'travel', label: '✈️ Travel' },
  { value: 'training', label: '📚 Training' },
  { value: 'meeting', label: '👥 All-day Meeting' },
  { value: 'other', label: '📌 Other' },
];

export default function EventModal({ date, event, onSave, onClose }) {
  const isEdit = !!event;
  const [form, setForm] = useState({
    title: event?.title || '',
    type: event?.type || 'leave',
    date: event?.date || date || fmt(new Date()),
    description: event?.description || '',
  });
  const [errors, setErrors] = useState({});

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setErrors({ title: 'Title is required' }); return; }
    onSave(form);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Event' : 'Add Event'}</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Title *</label>
            <input type="text" value={form.title} placeholder="Event title"
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            {errors.title && <span className="error">{errors.title}</span>}
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={3} value={form.description} placeholder="Optional notes..."
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{isEdit ? 'Save Changes' : 'Add Event'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

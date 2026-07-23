import { useState } from 'react';
import { Download, Calendar } from 'lucide-react';
import { getDateRangePreset, fmt } from '../utils/dateUtils';
import { exportToExcel } from '../utils/exportUtils';

const PRESETS = [
  { key: 'last7', label: 'Last 7 days' },
  { key: 'lastWeek', label: 'Last week' },
  { key: 'lastMonth', label: 'Last month' },
  { key: 'last3Months', label: 'Last 3 months' },
  { key: 'last6Months', label: 'Last 6 months' },
  { key: 'custom', label: 'Custom range' },
];

export default function ExportPanel({ store, onClose }) {
  const [preset, setPreset] = useState('lastMonth');
  const [custom, setCustom] = useState({ start: fmt(new Date()), end: fmt(new Date()) });
  const [exporting, setExporting] = useState(false);
  const [preview, setPreview] = useState(null);

  function getRange() {
    if (preset === 'custom') return { start: custom.start, end: custom.end, label: 'Custom range' };
    return getDateRangePreset(preset);
  }

  function handlePreview() {
    const range = getRange();
    const entries = store.getWorkEntriesInRange(range.start, range.end);
    const events = store.getEventsInRange(range.start, range.end);
    setPreview({ ...range, entries: entries.length, events: events.length, todos: store.todos.length });
  }

  function handleExport() {
    setExporting(true);
    const range = getRange();
    try {
      exportToExcel({
        workEntries: store.workEntries,
        events: store.events,
        todos: store.todos,
        startDate: range.start,
        endDate: range.end,
        label: range.label,
      });
    } finally {
      setExporting(false);
    }
  }

  const range = getRange();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal export-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2><Download size={18} /> Export to Excel</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-form">
          <div className="form-group">
            <label>Date Range Preset</label>
            <div className="preset-grid">
              {PRESETS.map(p => (
                <button
                  key={p.key}
                  className={`preset-btn ${preset === p.key ? 'active' : ''}`}
                  onClick={() => { setPreset(p.key); setPreview(null); }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {preset === 'custom' && (
            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input type="date" value={custom.start}
                  onChange={e => setCustom(c => ({ ...c, start: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input type="date" value={custom.end} min={custom.start}
                  onChange={e => setCustom(c => ({ ...c, end: e.target.value }))} />
              </div>
            </div>
          )}

          <div className="range-display">
            <Calendar size={14} />
            <span>{range.start} → {range.end}</span>
          </div>

          {preview && (
            <div className="export-preview">
              <div className="preview-stat"><strong>{preview.entries}</strong><span>Work entries</span></div>
              <div className="preview-stat"><strong>{preview.events}</strong><span>Events</span></div>
              <div className="preview-stat"><strong>{preview.todos}</strong><span>Todos</span></div>
            </div>
          )}

          <div className="export-info">
            <p>The Excel file will contain 4 sheets: <strong>Work Entries</strong>, <strong>Events</strong>, <strong>Todos</strong>, and <strong>Summary</strong>.</p>
          </div>

          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-secondary" onClick={handlePreview}>Preview</button>
            <button className="btn btn-primary" onClick={handleExport} disabled={exporting}>
              <Download size={14} /> {exporting ? 'Exporting…' : 'Download Excel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

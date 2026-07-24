import { useRef, useState } from 'react';
import { Download, Upload, FileJson, AlertCircle, CheckCircle, X } from 'lucide-react';
import { exportJSON, importJSON } from '../utils/dataPortability';
import { replaceAllData } from '../store/useStore';

export default function ImportExportPanel({ store, onClose }) {
  const fileRef = useRef(null);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg }
  const [importing, setImporting] = useState(false);
  const [confirmImport, setConfirmImport] = useState(null); // parsed data waiting for confirm

  function handleExport() {
    exportJSON({
      workEntries: store.workEntries,
      events:      store.events,
      todos:       store.todos,
    });
    setStatus({ type: 'success', msg: 'File downloaded successfully.' });
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    // reset input so the same file can be re-selected
    e.target.value = '';
    setImporting(true);
    setStatus(null);
    try {
      const data = await importJSON(file);
      // Ask for confirmation before overwriting
      setConfirmImport(data);
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setImporting(false);
    }
  }

  function handleConfirmImport() {
    replaceAllData(confirmImport);
    setConfirmImport(null);
    setStatus({
      type: 'success',
      msg: `Imported ${confirmImport.workEntries.length} entries, ` +
           `${confirmImport.events.length} events, ` +
           `${confirmImport.todos.length} todos.`,
    });
  }

  const totalRecords = store.workEntries.length + store.events.length + store.todos.length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal ie-modal" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <h2><FileJson size={18} /> Import / Export</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-form">

          {/* ── Export ──────────────────────────────────────────── */}
          <div className="ie-section">
            <div className="ie-section-title">
              <Download size={16} /> Export data
            </div>
            <p className="ie-section-desc">
              Downloads all your data as a <code>.json</code> file you can keep as a backup
              or move to another browser / device.
              Currently storing <strong>{totalRecords}</strong> records.
            </p>
            <button className="btn btn-primary" onClick={handleExport}>
              <Download size={14} /> Download JSON backup
            </button>
          </div>

          <div className="ie-divider" />

          {/* ── Import ──────────────────────────────────────────── */}
          <div className="ie-section">
            <div className="ie-section-title">
              <Upload size={16} /> Import data
            </div>
            <p className="ie-section-desc">
              Select a <code>.json</code> file previously exported from Work Tracker.
              <strong> This will overwrite all current data.</strong>
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button
              className="btn btn-outline"
              onClick={() => fileRef.current?.click()}
              disabled={importing}
            >
              <Upload size={14} /> {importing ? 'Reading file…' : 'Choose JSON file'}
            </button>
          </div>

          {/* ── Confirm overwrite ───────────────────────────────── */}
          {confirmImport && (
            <div className="ie-confirm">
              <AlertCircle size={16} color="var(--warning)" />
              <div className="ie-confirm-body">
                <strong>Replace all data?</strong>
                <span className="muted">
                  File contains {confirmImport.workEntries.length} work entries,&nbsp;
                  {confirmImport.events.length} events,&nbsp;
                  {confirmImport.todos.length} todos
                  {confirmImport.exportedAt
                    ? ` (exported ${confirmImport.exportedAt.slice(0, 10)})`
                    : ''}.
                  Your current data will be lost.
                </span>
              </div>
              <div className="ie-confirm-actions">
                <button className="btn btn-sm btn-ghost" onClick={() => setConfirmImport(null)}>Cancel</button>
                <button className="btn btn-sm btn-danger" onClick={handleConfirmImport}>Replace</button>
              </div>
            </div>
          )}

          {/* ── Status message ──────────────────────────────────── */}
          {status && (
            <div className={`ie-status ie-status-${status.type}`}>
              {status.type === 'success'
                ? <CheckCircle size={15} />
                : <AlertCircle size={15} />}
              {status.msg}
            </div>
          )}

          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

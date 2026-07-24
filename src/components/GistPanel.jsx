import { useState, useEffect } from 'react';
import {
  Cloud, CloudOff, RefreshCw, Upload, Download,
  Link, Unlink, CheckCircle, AlertCircle, X, Eye, EyeOff
} from 'lucide-react';
import {
  getPAT, getGistId, getGHHost,
  savePAT, saveGistId, saveGHHost, clearGistConfig,
  isConnected, verifyPAT, pushToGist, pullFromGist, connectToExistingGist,
} from '../utils/gist';
import { replaceAllData } from '../store/useStore';

// Status helpers
const STATUS = { idle: 'idle', busy: 'busy', ok: 'ok', err: 'err' };

export default function GistPanel({ store, onClose }) {
  const [pat,     setPat]     = useState(getPAT());
  const [gistId,  setGistId]  = useState(getGistId());
  const [ghHost,  setGhHost]  = useState(getGHHost());
  const [showPat, setShowPat] = useState(false);

  const [user,   setUser]   = useState(null);   // { login, avatar }
  const [status, setStatus] = useState(STATUS.idle);
  const [msg,    setMsg]    = useState('');

  const [pullConfirm, setPullConfirm] = useState(null); // data waiting to be imported

  const connected = isConnected();

  // Refresh connection indicator on open
  useEffect(() => {
    if (connected) setMsg(`Connected — Gist ${getGistId().slice(0, 8)}…`);
  }, []);

  function setOk(m)  { setStatus(STATUS.ok);  setMsg(m); }
  function setErr(m) { setStatus(STATUS.err);  setMsg(m); }
  function setBusy()  { setStatus(STATUS.busy); setMsg(''); }

  // ── Connect / verify PAT ───────────────────────────────────────────────
  async function handleConnect() {
    if (!pat.trim()) return setErr('Enter a GitHub Personal Access Token first.');
    setBusy();
    try {
      savePAT(pat.trim());
      saveGHHost(ghHost.trim() || 'api.github.com');
      const u = await verifyPAT();
      setUser(u);
      if (gistId.trim()) {
        await connectToExistingGist(gistId.trim());
        setGistId(gistId.trim());
        setOk(`Connected as ${u.login} — using existing Gist.`);
      } else {
        setOk(`Authenticated as ${u.login}. Push to create a new Gist.`);
      }
    } catch (e) { setErr(e.message); }
  }

  // ── Disconnect ─────────────────────────────────────────────────────────
  function handleDisconnect() {
    clearGistConfig();
    setPat(''); setGistId(''); setUser(null);
    setStatus(STATUS.idle); setMsg('Disconnected.');
  }

  // ── Push ──────────────────────────────────────────────────────────────
  async function handlePush() {
    setBusy();
    try {
      const id = await pushToGist({
        workEntries: store.workEntries,
        events:      store.events,
        todos:       store.todos,
      });
      setGistId(id);
      setOk(`Pushed ${store.workEntries.length} entries, ${store.events.length} events, ${store.todos.length} todos → Gist ${id.slice(0,8)}…`);
    } catch (e) { setErr(e.message); }
  }

  // ── Pull ──────────────────────────────────────────────────────────────
  async function handlePull() {
    setBusy();
    try {
      const data = await pullFromGist();
      setPullConfirm(data);
      setStatus(STATUS.idle);
    } catch (e) { setErr(e.message); }
  }

  function confirmPull() {
    replaceAllData(pullConfirm);
    setPullConfirm(null);
    setOk(`Imported ${pullConfirm.workEntries.length} entries, ${pullConfirm.events.length} events, ${pullConfirm.todos.length} todos from Gist.`);
  }

  const busy = status === STATUS.busy;
  const currentGistId = getGistId();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal gist-modal" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <h2>
            {connected ? <Cloud size={18} color="var(--teal)" /> : <CloudOff size={18} />}
            GitHub Gist Sync
          </h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-form">

          {/* ── Connection status banner ─────────────────────── */}
          {connected && (
            <div className="gist-banner gist-banner-connected">
              <CheckCircle size={14} />
              Connected · Gist&nbsp;
              <a
                href={`https://${getGHHost().replace('api.','')}/gist/${currentGistId}`}
                target="_blank" rel="noopener noreferrer"
                className="gist-link"
              >
                {currentGistId.slice(0, 10)}…
              </a>
            </div>
          )}

          {/* ── Credentials ──────────────────────────────────── */}
          <div className="gist-section">
            <div className="gist-section-title">Credentials</div>

            <div className="form-group">
              <label>GitHub API Host</label>
              <input
                type="text"
                value={ghHost}
                placeholder="api.github.com  or  github.ibm.com"
                onChange={e => setGhHost(e.target.value)}
                disabled={connected}
              />
              <span className="form-hint">
                Use <code>api.github.com</code> for github.com or <code>github.ibm.com</code> for IBM GHE.
              </span>
            </div>

            <div className="form-group">
              <label>Personal Access Token (PAT)</label>
              <div className="pat-row">
                <input
                  type={showPat ? 'text' : 'password'}
                  value={pat}
                  placeholder="ghp_… or IBM GHE token"
                  onChange={e => setPat(e.target.value)}
                  disabled={connected}
                  autoComplete="off"
                />
                <button className="icon-btn" onClick={() => setShowPat(v => !v)} title="Toggle visibility">
                  {showPat ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
              <span className="form-hint">
                Needs <strong>gist</strong> scope (github.com) or <strong>api</strong> scope (IBM GHE).
                The token is stored only in your browser's localStorage.
              </span>
            </div>

            <div className="form-group">
              <label>Existing Gist ID <span className="muted">(optional — leave blank to create new)</span></label>
              <input
                type="text"
                value={gistId}
                placeholder="Paste an existing Gist ID to link"
                onChange={e => setGistId(e.target.value)}
                disabled={connected}
              />
            </div>

            <div className="gist-connect-row">
              {!connected
                ? <button className="btn btn-primary" onClick={handleConnect} disabled={busy}>
                    <Link size={14}/> {busy ? 'Connecting…' : 'Connect'}
                  </button>
                : <button className="btn btn-ghost" onClick={handleDisconnect}>
                    <Unlink size={14}/> Disconnect
                  </button>
              }
            </div>
          </div>

          {/* ── Sync actions ─────────────────────────────────── */}
          {connected && (
            <div className="gist-section">
              <div className="gist-section-title">Sync</div>
              <div className="gist-sync-row">
                <div className="gist-sync-card">
                  <Upload size={20} color="var(--accent)" />
                  <div className="gist-sync-body">
                    <strong>Push</strong>
                    <span>Upload local data → Gist</span>
                    <span className="muted">{store.workEntries.length} entries · {store.todos.length} todos</span>
                  </div>
                  <button className="btn btn-sm btn-primary" onClick={handlePush} disabled={busy}>
                    {busy ? <RefreshCw size={13} className="spin"/> : <Upload size={13}/>}
                    Push
                  </button>
                </div>

                <div className="gist-sync-card">
                  <Download size={20} color="var(--secondary)" />
                  <div className="gist-sync-body">
                    <strong>Pull</strong>
                    <span>Download Gist → local data</span>
                    <span className="muted">Overwrites current data</span>
                  </div>
                  <button className="btn btn-sm btn-secondary" onClick={handlePull} disabled={busy}>
                    {busy ? <RefreshCw size={13} className="spin"/> : <Download size={13}/>}
                    Pull
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Pull confirm ──────────────────────────────────── */}
          {pullConfirm && (
            <div className="ie-confirm">
              <AlertCircle size={16} color="var(--warning)" />
              <div className="ie-confirm-body">
                <strong>Replace all local data?</strong>
                <span className="muted">
                  Gist contains {pullConfirm.workEntries.length} entries,&nbsp;
                  {pullConfirm.events.length} events,&nbsp;
                  {pullConfirm.todos.length} todos
                  {pullConfirm.pushedAt ? ` (pushed ${pullConfirm.pushedAt.slice(0,10)})` : ''}.
                </span>
              </div>
              <div className="ie-confirm-actions">
                <button className="btn btn-sm btn-ghost" onClick={() => setPullConfirm(null)}>Cancel</button>
                <button className="btn btn-sm btn-danger" onClick={confirmPull}>Replace</button>
              </div>
            </div>
          )}

          {/* ── Status message ────────────────────────────────── */}
          {msg && (
            <div className={`ie-status ${status === STATUS.err ? 'ie-status-error' : status === STATUS.ok ? 'ie-status-success' : 'ie-status-busy'}`}>
              {status === STATUS.ok  && <CheckCircle size={15}/>}
              {status === STATUS.err && <AlertCircle size={15}/>}
              {status === STATUS.busy && <RefreshCw size={15} className="spin"/>}
              {msg}
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

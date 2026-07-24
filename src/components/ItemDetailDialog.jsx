import { X, Clock, Tag, Calendar, AlertCircle, CheckCircle, Pencil, ArrowRightLeft } from 'lucide-react';

const EVENT_COLORS = {
  leave: '#ef4444', holiday: '#f97316', sick: '#8b5cf6', wfh: '#06b6d4',
  travel: '#3b82f6', training: '#10b981', meeting: '#f59e0b', other: '#6b7280',
};
const EVENT_EMOJI = {
  leave: '🏖️', holiday: '🎉', sick: '🤒', wfh: '🏠',
  travel: '✈️', training: '📚', meeting: '👥', other: '📌',
};
const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

// ── Work Entry Detail ──────────────────────────────────────────────────────────
function WorkDetail({ item, onEdit }) {
  return (
    <>
      <div className="detail-dialog-hero">
        <div className="detail-dialog-type-label">💼 Work Entry</div>
        <h2 className="detail-dialog-title">{item.title}</h2>
        <div className="detail-dialog-meta-row">
          <span className="category-badge">{item.category}</span>
          {item.hours && (
            <span className="detail-meta-chip">
              <Clock size={12} /> {item.hours}h
            </span>
          )}
          {item.endDate && item.endDate !== item.date
            ? <span className="date-range-badge">📅 {item.date} → {item.endDate}</span>
            : <span className="detail-meta-chip"><Calendar size={12} /> {item.date}</span>
          }
        </div>
        {(item.tags || []).length > 0 && (
          <div className="detail-dialog-tags">
            {item.tags.map(t => <span key={t} className="tag-pill"><Tag size={10}/>{t}</span>)}
          </div>
        )}
      </div>
      {item.description && (
        <div className="detail-dialog-section">
          <div className="detail-dialog-section-label">Description</div>
          <p className="detail-dialog-body">{item.description}</p>
        </div>
      )}
      {item.createdAt && (
        <div className="detail-dialog-footer-meta">
          Created {new Date(item.createdAt).toLocaleString()}
          {item.updatedAt && <> · Updated {new Date(item.updatedAt).toLocaleString()}</>}
        </div>
      )}
      <div className="detail-dialog-actions">
        <button className="btn btn-primary btn-sm" onClick={onEdit}>
          <Pencil size={13}/> Edit Entry
        </button>
      </div>
    </>
  );
}

// ── Event Detail ───────────────────────────────────────────────────────────────
function EventDetail({ item, onEdit }) {
  const color = EVENT_COLORS[item.type] || EVENT_COLORS.other;
  const emoji = EVENT_EMOJI[item.type] || '📌';
  return (
    <>
      <div className="detail-dialog-hero" style={{ borderLeft: `4px solid ${color}` }}>
        <div className="detail-dialog-type-label" style={{ color }}>
          {emoji} Event · <span style={{ textTransform: 'capitalize' }}>{item.type}</span>
        </div>
        <h2 className="detail-dialog-title">{item.title}</h2>
        <div className="detail-dialog-meta-row">
          <span className="detail-meta-chip"><Calendar size={12}/> {item.date}</span>
        </div>
      </div>
      {item.description && (
        <div className="detail-dialog-section">
          <div className="detail-dialog-section-label">Description</div>
          <p className="detail-dialog-body">{item.description}</p>
        </div>
      )}
      {item.createdAt && (
        <div className="detail-dialog-footer-meta">
          Created {new Date(item.createdAt).toLocaleString()}
        </div>
      )}
      <div className="detail-dialog-actions">
        <button className="btn btn-secondary btn-sm" onClick={onEdit}>
          <Pencil size={13}/> Edit Event
        </button>
      </div>
    </>
  );
}

// ── Todo Detail ────────────────────────────────────────────────────────────────
function TodoDetail({ item, onEdit, onConvert }) {
  const pColor = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.medium;
  return (
    <>
      <div className="detail-dialog-hero">
        <div className="detail-dialog-type-label">✅ Todo</div>
        <h2 className={`detail-dialog-title ${item.completed ? 'completed-title' : ''}`}>
          {item.title}
        </h2>
        <div className="detail-dialog-meta-row">
          <span className={`priority-pill priority-pill--${item.priority}`}>{item.priority}</span>
          {item.completed
            ? <span className="detail-status-pill done"><CheckCircle size={12}/> Completed</span>
            : <span className="detail-status-pill pending"><AlertCircle size={12}/> Pending</span>
          }
          <span className="detail-meta-chip">
            <Calendar size={12}/>
            {item.scope === 'day' ? item.scopeValue : `${item.scope}: ${item.scopeValue}`}
          </span>
          {item.dueDate && (
            <span className="detail-meta-chip" style={{ color: pColor }}>
              ⏰ Due {item.dueDate}
            </span>
          )}
        </div>
      </div>
      {item.notes && (
        <div className="detail-dialog-section">
          <div className="detail-dialog-section-label">Notes</div>
          <p className="detail-dialog-body">{item.notes}</p>
        </div>
      )}
      {item.createdAt && (
        <div className="detail-dialog-footer-meta">
          Created {new Date(item.createdAt).toLocaleString()}
        </div>
      )}
      <div className="detail-dialog-actions">
        <button className="btn btn-ghost btn-sm" onClick={onEdit}>
          <Pencil size={13}/> Edit
        </button>
        {!item.completed && (
          <button className="btn btn-secondary btn-sm" onClick={onConvert}>
            <ArrowRightLeft size={13}/> Convert to Work Entry
          </button>
        )}
      </div>
    </>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function ItemDetailDialog({ item, type, onClose, onEdit, onConvert }) {
  if (!item) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal detail-dialog" onClick={e => e.stopPropagation()}>
        <div className="detail-dialog-header">
          <button className="icon-btn" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="detail-dialog-content">
          {type === 'work'  && <WorkDetail  item={item} onEdit={onEdit} />}
          {type === 'event' && <EventDetail item={item} onEdit={onEdit} />}
          {type === 'todo'  && <TodoDetail  item={item} onEdit={onEdit} onConvert={onConvert} />}
        </div>
      </div>
    </div>
  );
}

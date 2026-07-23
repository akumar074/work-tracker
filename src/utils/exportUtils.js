import * as XLSX from 'xlsx';
import { fmtDisplay } from './dateUtils';

export function exportToExcel({ workEntries, events, todos, startDate, endDate, label }) {
  const wb = XLSX.utils.book_new();

  // ── Work Entries Sheet ─────────────────────────────────────
  const weFiltered = workEntries.filter(e => e.date >= startDate && e.date <= endDate);
  const weRows = weFiltered.map(e => ({
    Date: fmtDisplay(new Date(e.date + 'T00:00:00')),
    Title: e.title,
    Description: e.description || '',
    Category: e.category || '',
    Hours: e.hours || '',
    Tags: (e.tags || []).join(', '),
  }));
  const weSheet = XLSX.utils.json_to_sheet(weRows.length ? weRows : [{ Date: 'No entries', Title: '', Description: '', Category: '', Hours: '', Tags: '' }]);
  applyColumnWidths(weSheet, [15, 30, 50, 20, 10, 25]);
  XLSX.utils.book_append_sheet(wb, weSheet, 'Work Entries');

  // ── Events Sheet ──────────────────────────────────────────
  const evFiltered = events.filter(e => e.date >= startDate && e.date <= endDate);
  const evRows = evFiltered.map(e => ({
    Date: fmtDisplay(new Date(e.date + 'T00:00:00')),
    Title: e.title,
    Type: e.type || '',
    Description: e.description || '',
  }));
  const evSheet = XLSX.utils.json_to_sheet(evRows.length ? evRows : [{ Date: 'No events', Title: '', Type: '', Description: '' }]);
  applyColumnWidths(evSheet, [15, 30, 15, 50]);
  XLSX.utils.book_append_sheet(wb, evSheet, 'Events');

  // ── Todos Sheet ───────────────────────────────────────────
  const todoRows = todos.map(t => ({
    Scope: t.scope,
    'Scope Value': t.scopeValue,
    Title: t.title,
    Completed: t.completed ? 'Yes' : 'No',
    Priority: t.priority || 'medium',
    'Due Date': t.dueDate || '',
  }));
  const todoSheet = XLSX.utils.json_to_sheet(todoRows.length ? todoRows : [{ Scope: 'No todos', 'Scope Value': '', Title: '', Completed: '', Priority: '', 'Due Date': '' }]);
  applyColumnWidths(todoSheet, [10, 15, 40, 12, 12, 15]);
  XLSX.utils.book_append_sheet(wb, todoSheet, 'Todos');

  // ── Summary Sheet ─────────────────────────────────────────
  const totalHours = weFiltered.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0);
  const summaryRows = [
    { Metric: 'Export Range', Value: `${fmtDisplay(new Date(startDate + 'T00:00:00'))} – ${fmtDisplay(new Date(endDate + 'T00:00:00'))}` },
    { Metric: 'Preset', Value: label },
    { Metric: 'Total Work Entries', Value: weFiltered.length },
    { Metric: 'Total Hours Logged', Value: totalHours.toFixed(1) },
    { Metric: 'Total Events', Value: evFiltered.length },
    { Metric: 'Leaves / Days Off', Value: evFiltered.filter(e => e.type === 'leave').length },
    { Metric: 'Total Todos', Value: todos.length },
    { Metric: 'Completed Todos', Value: todos.filter(t => t.completed).length },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  applyColumnWidths(summarySheet, [25, 40]);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  const filename = `work-tracker-${startDate}-to-${endDate}.xlsx`;
  XLSX.writeFile(wb, filename);
}

function applyColumnWidths(sheet, widths) {
  sheet['!cols'] = widths.map(w => ({ wch: w }));
}

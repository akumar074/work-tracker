/**
 * JSON export / import for all app data.
 * Export  → downloads a timestamped .json file to disk.
 * Import  → reads a .json file and returns the parsed payload,
 *           validation included. Caller decides what to do with it.
 */

const SCHEMA_VERSION = 1;

/** Download all data as a JSON file. */
export function exportJSON({ workEntries, events, todos }) {
  const payload = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    workEntries,
    events,
    todos,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const ts   = new Date().toISOString().slice(0, 10);
  a.href     = url;
  a.download = `work-tracker-${ts}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Read a File object chosen by the user and return the parsed data.
 * Resolves with { workEntries, events, todos } or rejects with an Error.
 */
export function importJSON(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.name.endsWith('.json')) {
      return reject(new Error('Please select a .json file exported by Work Tracker.'));
    }

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);

        // Basic shape validation
        if (!Array.isArray(data.workEntries) ||
            !Array.isArray(data.events)      ||
            !Array.isArray(data.todos)) {
          return reject(new Error('Invalid file: missing workEntries, events, or todos arrays.'));
        }

        resolve({
          workEntries: data.workEntries,
          events:      data.events,
          todos:       data.todos,
          exportedAt:  data.exportedAt ?? null,
        });
      } catch {
        reject(new Error('Could not parse file. Is it a valid Work Tracker JSON export?'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}

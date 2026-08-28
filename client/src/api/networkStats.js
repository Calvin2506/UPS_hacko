let snapshot = { calls: 0, bytes: 0 };
const listeners = new Set();

export const networkStats = {
  subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  getSnapshot() { return snapshot; },
  record(response) {
    const bytes = new Blob([JSON.stringify(response)]).size;
    snapshot = { calls: snapshot.calls + 1, bytes: snapshot.bytes + bytes };
    listeners.forEach((listener) => listener());
  },
};

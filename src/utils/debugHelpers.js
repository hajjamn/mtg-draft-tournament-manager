const DEBUG = import.meta.env.VITE_APP_DEBUG === 'true'; // Use import.meta.env for Vite

export function debugLog(...args) {
  if (DEBUG) {
    console.log(...args);
  }
}
import { useEffect, useState } from 'react';

/** useState that persists to localStorage; degrades silently when storage is unavailable. */
export default function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw != null ? JSON.parse(raw) : typeof initial === 'function' ? initial() : initial;
    } catch {
      return typeof initial === 'function' ? initial() : initial;
    }
  });
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
  }, [key, value]);
  return [value, setValue];
}

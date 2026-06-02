import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { debounce } from 'lodash';
import { localCache } from '@/lib/localCache';

const WindowContext = createContext(null);

let nextZIndex = 100;

export function WindowProvider({ children, resolveContent }) {
  const [windows, setWindows] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const restoredRef = useRef(false);

  // --- Persistence helpers ---
  const persist = useRef(
    debounce(async (wins, id, setId) => {
      // Strip non-serializable content before saving
      const open_windows = wins.map(({ content, id: _id, ...meta }) => meta);
      const last_active_app = [...wins].sort((a, b) => b.zIndex - a.zIndex)[0]?.appId || '';
      // Mirror to localStorage for instant/offline restore
      localCache.setSession(open_windows);
      try {
        if (id) {
          await base44.entities.workspace_session.update(id, { open_windows, last_active_app });
        } else {
          const created = await base44.entities.workspace_session.create({ open_windows, last_active_app });
          setId(created.id);
        }
      } catch (e) {
        // Non-fatal: persistence is best-effort
      }
    }, 800)
  ).current;

  const hydrate = useCallback((openWindows) => {
    const restored = (openWindows || []).map(meta => ({
      ...meta,
      id: Date.now().toString() + Math.random(),
      content: resolveContent(meta.appId, meta.title),
    })).filter(w => w.content);
    if (restored.length) {
      const maxZ = Math.max(...restored.map(w => w.zIndex || 100));
      nextZIndex = Math.max(nextZIndex, maxZ + 1);
      setWindows(restored);
    }
  }, [resolveContent]);

  // Restore session on mount: localStorage first (instant/offline), then reconcile with backend
  useEffect(() => {
    if (restoredRef.current || !resolveContent) return;
    restoredRef.current = true;

    const cached = localCache.getSession();
    if (cached && cached.length) hydrate(cached);

    (async () => {
      try {
        const sessions = await base44.entities.workspace_session.list('-updated_date', 1);
        const session = sessions[0];
        if (!session) return;
        setSessionId(session.id);
        if (!cached || !cached.length) hydrate(session.open_windows);
      } catch {
        // Offline — localStorage restore already applied
      }
    })();
  }, [resolveContent, hydrate]);

  // Save whenever windows change (after restore)
  useEffect(() => {
    if (!restoredRef.current) return;
    persist(windows, sessionId, setSessionId);
  }, [windows, sessionId, persist]);

  const openWindow = useCallback((appId, title, content) => {
    setWindows(prev => {
      const existing = prev.find(w => w.appId === appId);
      if (existing) {
        return prev.map(w =>
          w.appId === appId
            ? { ...w, minimized: false, zIndex: ++nextZIndex }
            : w
        );
      }
      const offset = prev.length * 30;
      return [...prev, {
        id: Date.now().toString(),
        appId,
        title,
        content,
        x: 80 + offset,
        y: 80 + offset,
        width: 700,
        height: 480,
        minimized: false,
        zIndex: ++nextZIndex,
      }];
    });
  }, []);

  const closeWindow = useCallback((appId) => {
    setWindows(prev => prev.filter(w => w.appId !== appId));
  }, []);

  const focusWindow = useCallback((appId) => {
    setWindows(prev => prev.map(w =>
      w.appId === appId ? { ...w, zIndex: ++nextZIndex } : w
    ));
  }, []);

  const minimizeWindow = useCallback((appId) => {
    setWindows(prev => prev.map(w =>
      w.appId === appId ? { ...w, minimized: !w.minimized } : w
    ));
  }, []);

  const updateWindow = useCallback((appId, updates) => {
    setWindows(prev => prev.map(w =>
      w.appId === appId ? { ...w, ...updates } : w
    ));
  }, []);

  return (
    <WindowContext.Provider value={{
      windows, openWindow, closeWindow, focusWindow, minimizeWindow, updateWindow
    }}>
      {children}
    </WindowContext.Provider>
  );
}

export function useWindows() {
  const ctx = useContext(WindowContext);
  if (!ctx) throw new Error('useWindows must be used within WindowProvider');
  return ctx;
}
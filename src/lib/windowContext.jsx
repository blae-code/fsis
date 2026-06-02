import React, { createContext, useContext, useState, useCallback } from 'react';

const WindowContext = createContext(null);

let nextZIndex = 100;

export function WindowProvider({ children }) {
  const [windows, setWindows] = useState([]);

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
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Minus, GripHorizontal } from 'lucide-react';
import { useWindows } from '@/lib/windowContext.jsx';

export default function AppWindow({ window: win }) {
  const { closeWindow, focusWindow, minimizeWindow, updateWindow } = useWindows();
  const dragRef = useRef(null);
  const windowRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isPhone = viewport.width < 640;
  const minWidth = isPhone ? 280 : 400;
  const minHeight = isPhone ? 240 : 300;
  const maxWidth = isPhone ? viewport.width - 16 : viewport.width - 24;
  const maxHeight = isPhone ? viewport.height - 112 : viewport.height - 64;
  const displayWidth = Math.min(Math.max(win.width, minWidth), maxWidth);
  const displayHeight = Math.min(Math.max(win.height, minHeight), maxHeight);
  const displayX = Math.max(8, Math.min(win.x, viewport.width - displayWidth - 8));
  const displayY = Math.max(isPhone ? 48 : 40, Math.min(win.y, viewport.height - displayHeight - (isPhone ? 72 : 12)));

  // Dragging
  const onDragStart = useCallback((e) => {
    if (e.target.closest('.window-controls')) return;
    e.preventDefault();
    focusWindow(win.appId);
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragOffset.current = { x: clientX - win.x, y: clientY - win.y };
  }, [win.x, win.y, win.appId, focusWindow]);

  const onDragMove = useCallback((e) => {
    if (!isDragging) return;
    if (e.cancelable) e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const nextX = clientX - dragOffset.current.x;
    const nextY = clientY - dragOffset.current.y;
    updateWindow(win.appId, {
      x: Math.max(8, Math.min(nextX, viewport.width - displayWidth - 8)),
      y: Math.max(isPhone ? 48 : 40, Math.min(nextY, viewport.height - displayHeight - (isPhone ? 72 : 12))),
    });
  }, [isDragging, win.appId, updateWindow, viewport.width, viewport.height, displayWidth, displayHeight, isPhone]);

  const onDragEnd = useCallback(() => setIsDragging(false), []);

  // Resizing
  const onResizeStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    focusWindow(win.appId);
    setIsResizing(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    resizeStart.current = { x: clientX, y: clientY, w: win.width, h: win.height };
  }, [win.appId, win.width, win.height, focusWindow]);

  const onResizeMove = useCallback((e) => {
    if (!isResizing) return;
    if (e.cancelable) e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - resizeStart.current.x;
    const dy = clientY - resizeStart.current.y;
    updateWindow(win.appId, {
      width: Math.min(maxWidth, Math.max(minWidth, resizeStart.current.w + dx)),
      height: Math.min(maxHeight, Math.max(minHeight, resizeStart.current.h + dy)),
    });
  }, [isResizing, win.appId, updateWindow, minWidth, minHeight, maxWidth, maxHeight]);

  const onResizeEnd = useCallback(() => setIsResizing(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onDragMove);
      window.addEventListener('mouseup', onDragEnd);
      window.addEventListener('touchmove', onDragMove, { passive: false });
      window.addEventListener('touchend', onDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onDragMove);
      window.removeEventListener('mouseup', onDragEnd);
      window.removeEventListener('touchmove', onDragMove);
      window.removeEventListener('touchend', onDragEnd);
    };
  }, [isDragging, onDragMove, onDragEnd]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', onResizeMove);
      window.addEventListener('mouseup', onResizeEnd);
      window.addEventListener('touchmove', onResizeMove, { passive: false });
      window.addEventListener('touchend', onResizeEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onResizeMove);
      window.removeEventListener('mouseup', onResizeEnd);
      window.removeEventListener('touchmove', onResizeMove);
      window.removeEventListener('touchend', onResizeEnd);
    };
  }, [isResizing, onResizeMove, onResizeEnd]);

  if (win.minimized) return null;

  return (
    <motion.div
      ref={windowRef}
      className="fixed select-none"
      style={{
        left: displayX,
        top: displayY,
        width: displayWidth,
        height: displayHeight,
        touchAction: isDragging || isResizing ? 'none' : 'auto',
        zIndex: win.zIndex,
      }}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.25 }}
      onClick={() => focusWindow(win.appId)}
    >
      <div
        className="w-full h-full flex flex-col rounded-lg overflow-hidden"
        style={{
          background: 'hsl(28, 8%, 9%)',
          border: '1px solid hsl(33, 18%, 17%, 0.6)',
          boxShadow: '0 8px 32px hsl(30, 15%, 2%, 0.6), 0 0 1px hsl(38, 72%, 52%, 0.12)',
        }}
      >
        {/* Window header - draggable */}
        <div
          ref={dragRef}
          className="flex items-center justify-between gap-2 px-3 sm:px-4 h-12 sm:h-10 shrink-0 cursor-move touch-none"
          style={{
            background: 'linear-gradient(to right, hsl(30, 12%, 12%), hsl(30, 10%, 10%))',
            borderBottom: '1px solid hsl(33, 18%, 17%, 0.5)',
          }}
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
        >
          <div className="flex items-center gap-2 min-w-0">
            <GripHorizontal className="w-4 h-4 sm:w-3 sm:h-3 text-primary/50 shrink-0" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
            <span className="font-mono text-[12px] sm:text-[11px] tracking-wider text-foreground/70 truncate">
              {win.title}
            </span>
          </div>
          <div className="window-controls flex items-center gap-1">
            <button
              aria-label="Minimize window"
              onClick={(e) => { e.stopPropagation(); minimizeWindow(win.appId); }}
              className="w-11 h-11 sm:w-6 sm:h-6 flex items-center justify-center rounded hover:bg-muted active:bg-muted transition-colors touch-manipulation"
            >
              <Minus className="w-5 h-5 sm:w-3 sm:h-3 text-muted-foreground" />
            </button>
            <button
              aria-label="Close window"
              onClick={(e) => { e.stopPropagation(); closeWindow(win.appId); }}
              className="w-11 h-11 sm:w-6 sm:h-6 flex items-center justify-center rounded hover:bg-destructive/20 active:bg-destructive/20 transition-colors touch-manipulation"
            >
              <X className="w-5 h-5 sm:w-3 sm:h-3 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        </div>

        {/* Window content - industrial interior with entrance animation */}
        <motion.div
          className="flex-1 overflow-auto industrial-interior p-4"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.3 }}
        >
          {win.content}
        </motion.div>

        {/* Resize handle */}
        <div
          aria-label="Resize window"
          className="absolute bottom-0 right-0 w-14 h-14 sm:w-6 sm:h-6 cursor-se-resize touch-none flex items-end justify-end p-2 sm:p-1"
          onMouseDown={onResizeStart}
          onTouchStart={onResizeStart}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" className="text-primary/45 sm:text-muted-foreground/30">
            <path d="M25 25L8 25L25 8Z" fill="currentColor" />
            <path d="M24 17L17 24M24 10L10 24" stroke="rgba(8,6,4,0.75)" strokeWidth="2" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Minus, Maximize2 } from 'lucide-react';
import { useWindows } from '@/lib/windowContext.jsx';

export default function AppWindow({ window: win }) {
  const { closeWindow, focusWindow, minimizeWindow, updateWindow } = useWindows();
  const dragRef = useRef(null);
  const windowRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

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
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    updateWindow(win.appId, {
      x: clientX - dragOffset.current.x,
      y: Math.max(40, clientY - dragOffset.current.y), // Keep below status bar
    });
  }, [isDragging, win.appId, updateWindow]);

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
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - resizeStart.current.x;
    const dy = clientY - resizeStart.current.y;
    updateWindow(win.appId, {
      width: Math.max(400, resizeStart.current.w + dx),
      height: Math.max(300, resizeStart.current.h + dy),
    });
  }, [isResizing, win.appId, updateWindow]);

  const onResizeEnd = useCallback(() => setIsResizing(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onDragMove);
      window.addEventListener('mouseup', onDragEnd);
      window.addEventListener('touchmove', onDragMove);
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
      window.addEventListener('touchmove', onResizeMove);
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
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
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
          className="flex items-center justify-between px-4 h-10 shrink-0 cursor-move"
          style={{
            background: 'linear-gradient(to right, hsl(30, 12%, 12%), hsl(30, 10%, 10%))',
            borderBottom: '1px solid hsl(33, 18%, 17%, 0.5)',
          }}
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
            <span className="font-mono text-[11px] tracking-wider text-foreground/70">
              {win.title}
            </span>
          </div>
          <div className="window-controls flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); minimizeWindow(win.appId); }}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
            >
              <Minus className="w-3 h-3 text-muted-foreground" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); closeWindow(win.appId); }}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-destructive/20 transition-colors"
            >
              <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
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
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={onResizeStart}
          onTouchStart={onResizeStart}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" className="text-muted-foreground/30">
            <path d="M14 14L8 14L14 8Z" fill="currentColor" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
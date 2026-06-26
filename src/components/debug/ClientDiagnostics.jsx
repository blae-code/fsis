import { useEffect } from 'react';
import { logDebugEvent } from '@/lib/debugLogger';

export default function ClientDiagnostics() {
  useEffect(() => {
    const onError = (event) => logDebugEvent({ source: 'window_error', message: event.message, stack: event.error?.stack, context: { filename: event.filename, lineno: event.lineno, colno: event.colno } });
    const onRejection = (event) => logDebugEvent({ source: 'unhandled_rejection', message: event.reason?.message || String(event.reason), stack: event.reason?.stack });
    const originalError = console.error;
    const originalWarn = console.warn;
    console.error = (...args) => { originalError(...args); logDebugEvent({ source: 'console_error', message: args.map(String).join(' '), context: { args } }); };
    console.warn = (...args) => { originalWarn(...args); logDebugEvent({ severity: 'warning', source: 'console_warning', message: args.map(String).join(' '), context: { args } }); };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);
  return null;
}
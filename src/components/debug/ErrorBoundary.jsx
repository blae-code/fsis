import React from 'react';
import { logDebugEvent } from '@/lib/debugLogger';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  componentDidCatch(error, info) {
    this.setState({ error });
    logDebugEvent({ source: 'error_boundary', message: error?.message, stack: error?.stack, context: { componentStack: info?.componentStack } });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#080604', color: '#D8CFC0' }}>
        <div className="border max-w-xl p-6 space-y-3" style={{ borderColor: '#8A3A2E', background: '#120D08' }}>
          <p className="text-[10px] tracking-[0.24em]" style={{ color: '#C05050' }}>SYSTEM FAULT CAPTURED</p>
          <h1 className="text-xl font-bold">The app caught an error and logged diagnostics.</h1>
          <p className="text-sm" style={{ color: '#A89C8A' }}>{this.state.error.message}</p>
          <button onClick={() => window.location.reload()} className="border px-4 py-2 text-xs" style={{ borderColor: '#E0A22E', color: '#E0A22E' }}>RELOAD APP</button>
        </div>
      </div>
    );
  }
}
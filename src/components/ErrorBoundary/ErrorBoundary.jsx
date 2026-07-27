// ====================================================================
// Global Error Boundary Component (src/components/ErrorBoundary/ErrorBoundary.jsx)
// Catch all frontend javascript errors and prevent blank screens.
// Renders a high-fidelity visual fallback with dynamic system restoration actions.
// ====================================================================

import React from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error("ErrorBoundary caught an unhandled runtime exception:", error, errorInfo);
  }

  handleReload = () => {
    // Clear potentially corrupt navigation state
    localStorage.removeItem('activeDOMenu');
    window.location.reload();
  };

  handleGoHome = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // High-fidelity Error Fallback UI
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100vw',
          backgroundColor: '#f8fafc',
          color: '#0f172a',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '24px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '550px',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e2e8f0',
            padding: '40px 32px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* Warning Circle Gradient Icon */}
            <div style={{
              alignSelf: 'center',
              backgroundColor: '#fff7ed',
              border: '2px solid #fed7aa',
              padding: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.1)'
            }}>
              <AlertTriangle size={48} color="#ea580c" style={{ animation: 'pulse 2s infinite' }} />
            </div>

            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 10px 0', color: '#1e293b' }}>
                System Interface Recovery
              </h1>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
                An unexpected component rendering error was intercepted. The system successfully contained the issue to prevent database data corruption.
              </p>
            </div>

            {/* Actions Grid */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#00a2e8',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0, 162, 232, 0.2)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <RefreshCw size={15} />
                <span>Reset View</span>
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <Home size={15} />
                <span>Clear Cache & Restart</span>
              </button>
            </div>

            {/* Error Message Details accordian */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', textAlign: 'left' }}>
              <button
                onClick={() => this.setState(prev => ({ showDetails: !prev }))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.76rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: 0
                }}
              >
                <ShieldAlert size={14} color="#ea580c" />
                <span>{this.state.showDetails ? 'Hide Diagnostic Report' : 'Show Diagnostic Report'}</span>
              </button>

              {this.state.showDetails && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px 16px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '0.72rem',
                  color: '#ef4444',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '150px',
                  overflowY: 'auto'
                }}>
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

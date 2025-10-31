// components/shared/ErrorBoundary.js - React Error Boundary
import React from 'react';
import { toast } from 'react-toastify';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Show user-friendly error toast
    toast.error('Something went wrong. Please refresh the page.', {
      autoClose: 5000
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          textAlign: 'center',
          background: 'var(--bg-primary, #1a1a2e)'
        }}>
          <div style={{
            maxWidth: '600px',
            background: 'var(--bg-secondary, #16213e)',
            padding: '40px',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <h1 style={{
              fontSize: '48px',
              marginBottom: '16px',
              color: 'var(--text-primary, #ffffff)'
            }}>
              😵 Oops!
            </h1>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '16px',
              color: 'var(--text-primary, #ffffff)'
            }}>
              Something went wrong
            </h2>
            <p style={{
              fontSize: '16px',
              marginBottom: '24px',
              color: 'var(--text-secondary, #94a1b2)',
              lineHeight: '1.6'
            }}>
              An unexpected error occurred in the application. 
              Don't worry, your workflow data is still safe.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                marginBottom: '24px',
                textAlign: 'left',
                background: 'var(--bg-tertiary, #0f1419)',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#ff6b6b',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: '8px', fontWeight: 'bold' }}>
                  Error Details (Development Only)
                </summary>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  background: 'transparent',
                  color: 'var(--text-primary, #ffffff)',
                  border: '2px solid var(--border-color, #667eea)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

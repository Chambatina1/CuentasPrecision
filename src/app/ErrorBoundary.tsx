'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ color: '#dc2626', fontSize: 24 }}>Error detectado</h2>
          <p style={{ marginTop: 10, color: '#6b7280' }}>El siguiente error causó el crash:</p>
          <pre style={{
            marginTop: 16, padding: 16, background: '#fef2f2', border: '1px solid #fca5a5',
            borderRadius: 8, overflow: 'auto', fontSize: 13, whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          {this.state.errorInfo?.componentStack && (
            <div>
              <p style={{ marginTop: 20, fontWeight: 'bold' }}>Component Stack:</p>
              <pre style={{
                marginTop: 8, padding: 16, background: '#f0f9ff', border: '1px solid #93c5fd',
                borderRadius: 8, overflow: 'auto', fontSize: 12, whiteSpace: 'pre-wrap'
              }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </div>
          )}
          <button
            onClick={() => { this.setState({ hasError: false, error: null, errorInfo: null }); window.location.reload() }}
            style={{ marginTop: 20, padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            Reintentar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

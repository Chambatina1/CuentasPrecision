'use client'
import React from 'react'
import dynamic from 'next/dynamic'

const CuentasPrecisionApp = dynamic(
  () => import('./client-app'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-12 w-64 bg-gray-200 animate-pulse rounded-md" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-xl" />
            ))}
          </div>
          <div className="h-80 bg-gray-200 animate-pulse rounded-xl" />
        </div>
      </div>
    )
  }
)

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('CAUGHT ERROR:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', whiteSpace: 'pre-wrap', background: '#fef2f2', minHeight: '100vh' }}>
          <h2 style={{ color: '#dc2626' }}>Client Error (debug)</h2>
          <p style={{ color: '#991b1b', fontWeight: 'bold' }}>{this.state.error?.message}</p>
          <p style={{ color: '#666', fontSize: 12, marginTop: 10 }}>Stack:</p>
          <p style={{ color: '#333', fontSize: 11 }}>{this.state.error?.stack}</p>
        </div>
      )
    }
    return <>{this.props.children}</>
  }
}

export function Home() {
  return (
    <ErrorBoundary>
      <CuentasPrecisionApp />
    </ErrorBoundary>
  )
}

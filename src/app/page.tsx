'use client'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

// Global error capture
if (typeof window !== 'undefined') {
  window.onerror = function(msg, url, line, col, err) {
    document.title = 'ERR: ' + (err?.message || msg)
    return false
  }
  window.addEventListener('unhandledrejection', function(e) {
    document.title = 'REJ: ' + (e.reason?.message || String(e.reason))
  })
}

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

export default function Home() {
  const [error, setError] = useState('')

  useEffect(() => {
    const checkTitle = setInterval(() => {
      const t = document.title
      if (t.startsWith('ERR:') || t.startsWith('REJ:')) {
        setError(t.substring(4))
        document.title = 'CuentasPrecisión'
      }
    }, 500)
    return () => clearInterval(checkTitle)
  }, [])

  if (error) {
    return (
      <div style={{ padding: 40, background: '#fef2f2', minHeight: '100vh' }}>
        <h2 style={{ color: '#dc2626' }}>Error detectado:</h2>
        <pre style={{ color: '#991b1b', fontSize: 14 }}>{error}</pre>
        <button onClick={() => { setError(''); location.reload() }} style={{ marginTop: 20, padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 4 }}>Reintentar</button>
      </div>
    )
  }

  return <CuentasPrecisionApp />
}

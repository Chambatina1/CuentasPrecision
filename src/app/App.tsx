'use client'

import React, { useState, useEffect } from 'react'

export default function App() {
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div style={{padding: 40}}>Cargando...</div>
  }

  return (
    <div style={{padding: 40}}>
      <h1>CuentasPrecisión</h1>
      <p>App loaded successfully. {error && <span style={{color:'red'}}>{error}</span>}</p>
    </div>
  )
}

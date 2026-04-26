'use client'
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

export default function Home() {
  return <CuentasPrecisionApp />
}

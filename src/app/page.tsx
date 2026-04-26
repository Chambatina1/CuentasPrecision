'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  LayoutDashboard, ArrowRightLeft, Receipt, BookOpen, Bell, Settings,
  Plus, TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle,
  Info, Trash2, Edit, Save, Eye,
  Calculator, Building2, Wallet, ArrowUpRight, ArrowDownRight,
  RefreshCw, Shield, Target, Lightbulb,
  FileText, BarChart3, Menu, CircleDollarSign,
  Lock, UserPlus, Users, LogIn, Download, Upload, Database
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts'
import {
  getDB, generateId, simpleHash, seedDatabase,
  exportAllData, importAllData,
  type Business, type Transaction, type TaxRate, type ExchangeRate, type AlertItem, type User
} from '@/lib/db-client'

// ─── Constants ───────────────────────────────────────────────────────
const INCOME_CATEGORIES = ["Ventas de Productos", "Prestación de Servicios", "Alquileres", "Comisiones", "Intereses", "Otros Ingresos"]
const EXPENSE_CATEGORIES = ["Materia Prima e Insumos", "Alquiler", "Servicios Públicos (Agua/Electricidad/Gas)", "Salarios y Nóminas", "Transporte", "Mantenimiento y Reparaciones", "Impuestos y Contribuciones", "Marketing y Publicidad", "Seguros", "Depreciación", "Gastos Financieros", "Otros Gastos"]
const TCP_ACTIVITIES = ["Gastronomía", "Transporte de Pasajeros", "Transporte de Carga", "Servicios Técnicos", "Construcción y Reparaciones", "Telecomunicaciones (Agente)", "Servicios de Belleza", "Artesanía", "Alquiler de Viviendas", "Servicios de Limpieza", "Educación Particular", "Reparación de Equipos", "Otra Actividad"]
const MIPYME_ACTIVITIES = ["Comercio", "Gastronomía", "Construcción", "Transporte", "Tecnología", "Servicios Profesionales", "Manufactura", "Agricultura", "Otra Actividad"]
const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316']

const formatCUP = (n: number) => { try { return new Intl.NumberFormat('es-CU', { style: 'currency', currency: 'CUP' }).format(n) } catch { return '$' + n } }
const formatUSD = (n: number, rate: number) => { try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n / rate) } catch { return '$' + (n/rate).toFixed(2) } }
const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString('es-CU', { day: '2-digit', month: '2-digit', year: 'numeric' }) } catch { return d } }

function SeverityBadge({ severity }: { severity: string }) {
  const m: Record<string, { label: string; cls: string }> = {
    CRITICAL: { label: 'Crítico', cls: 'bg-red-600 text-white' },
    HIGH: { label: 'Alto', cls: 'bg-red-100 text-red-700' },
    MEDIUM: { label: 'Medio', cls: 'bg-amber-100 text-amber-700' },
    LOW: { label: 'Bajo', cls: 'bg-gray-100 text-gray-600' },
    INFO: { label: 'Info', cls: 'bg-blue-100 text-blue-700' },
  }
  const s = m[severity] || m.INFO
  return <Badge className={s.cls}>{s.label}</Badge>
}

// ═══════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true); setError('')
    try {
      const _d = await getDB(); const user = await _d.users.where('username').equals(username).first()
      if (!user) { setError('Usuario no encontrado'); setLoading(false); return }
      if (!user.isActive) { setError('Usuario desactivado. Contacte al administrador.'); setLoading(false); return }
      const hash = await simpleHash(password)
      if (hash !== user.password) { setError('Contraseña incorrecta'); setLoading(false); return }
      onLogin(user)
    } catch { setError('Error al iniciar sesión') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="h-16 w-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CircleDollarSign className="h-9 w-9 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">CuentasPrecisión</h1>
            <p className="text-sm text-gray-500 mt-1">Contabilidad Tributaria para MiPYMEs y TCP</p>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Usuario</Label>
              <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" className="mt-1" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
            <div>
              <Label>Contraseña</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="mt-1" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
            {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>}
            <Button onClick={handleLogin} className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              <LogIn className="h-4 w-4 mr-2" /> Iniciar Sesión
            </Button>
          </div>
          <div className="mt-6 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-700 text-center">
              <strong>Primera vez?</strong> Usuario: <code className="bg-amber-100 px-1 rounded">admin</code> / Contraseña: <code className="bg-amber-100 px-1 rounded">admin123</code>
            </p>
            <p className="text-xs text-amber-600 text-center mt-1">Cámbielo en Configuración → Usuarios</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN APP (lazy render with strict error boundary)
// ═══════════════════════════════════════════════════════════════════════
export default function Home() {
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Data
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState('')
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [appError, setAppError] = useState<string | null>(null)

  // Forms
  const [showBusinessForm, setShowBusinessForm] = useState(false)
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [showExchangeForm, setShowExchangeForm] = useState(false)
  const [showUserForm, setShowUserForm] = useState(false)
  const [cupAmount, setCupAmount] = useState('')
  const [bizForm, setBizForm] = useState<Partial<Business>>({})
  const [txForm, setTxForm] = useState<Partial<Transaction> & { dateStr: string }>({
    type: 'INGRESO', category: '', amountCUP: 0, taxDeductible: false, dateStr: new Date().toISOString().split('T')[0]
  })
  const [exForm, setExForm] = useState<Partial<ExchangeRate> & { dateStr: string }>({
    source: 'Manual', rateUSD: 0, dateStr: new Date().toISOString().split('T')[0]
  })
  const [userForm, setUserForm] = useState<Partial<User>>({ role: 'user', isActive: true })
  const [successMsg, setSuccessMsg] = useState('')

  // ─── SSR Guard ─────────────────────────────────────────────────
  useEffect(() => { setMounted(true) }, [])

  // ─── Init ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return
    ;(async () => {
      try {
        await seedDatabase()
      } catch (e: any) {
        console.error('seedDatabase error:', e)
        setAppError('DB init: ' + e.message)
      }
      const session = sessionStorage.getItem('cp_session')
      if (session) {
        try {
          const u = JSON.parse(session)
          setAuthUser(u)
        } catch { sessionStorage.removeItem('cp_session') }
      }
      setInitialized(true)
    })()
  }, [mounted])

  // ─── Load Data ────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      setLoading(true)
      const d = await getDB()
      const [bz, tx, tr, er, al, us] = await Promise.all([
        d.businesses.toArray(),
        d.transactions.toArray(),
        d.taxRates.toArray(),
        d.exchangeRates.orderBy('date').reverse().limit(30).toArray(),
        d.alerts.orderBy('createdAt').reverse().limit(50).toArray(),
        d.users.toArray()
      ])
      setBusinesses(bz as Business[])
      setTransactions(tx as Transaction[])
      setTaxRates(tr as TaxRate[])
      setExchangeRates(er as ExchangeRate[])
      setAlerts(al as AlertItem[])
      setUsers(us as User[])
      if (bz.length > 0 && !selectedBusiness) setSelectedBusiness((bz[0] as any).id || '')
    } catch (e: any) {
      console.error('loadAll error:', e)
      setAppError('Load: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [selectedBusiness])

  useEffect(() => {
    if (authUser) loadAll()
  }, [authUser, loadAll])

  // ─── Derived Data ─────────────────────────────────────────────────
  const bizTransactions = selectedBusiness ? transactions.filter(t => t.businessId === selectedBusiness) : transactions
  const rate = exchangeRates.length > 0 ? exchangeRates[0].rateUSD : 350

  const calcTotals = (txs: Transaction[]) => {
    try {
      const income = txs.filter(t => t.type === 'INGRESO').reduce((s, t) => s + (t.amountCUP || 0), 0)
      const expenses = txs.filter(t => t.type === 'GASTO').reduce((s, t) => s + (t.amountCUP || 0), 0)
      const taxDeductible = txs.filter(t => t.type === 'GASTO' && t.taxDeductible).reduce((s, t) => s + (t.amountCUP || 0), 0)
      return { income, expenses, net: income - expenses, taxDeductible }
    } catch { return { income: 0, expenses: 0, net: 0, taxDeductible: 0 } }
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const monthlyTx = bizTransactions.filter(t => { try { return new Date(t.date) >= monthStart } catch { return false } })
  const yearlyTx = bizTransactions.filter(t => { try { return new Date(t.date) >= yearStart } catch { return false } })

  const expenseCategories: Record<string, number> = {}
  monthlyTx.filter(t => t.type === 'GASTO').forEach(t => { expenseCategories[t.category] = (expenseCategories[t.category] || 0) + (t.amountCUP || 0) })

  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    try {
      const ms = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const me = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 0, 23, 59, 59)
      const mtx = bizTransactions.filter(t => { try { const d = new Date(t.date); return d >= ms && d <= me } catch { return false } })
      return { month: ms.toLocaleString('es-CU', { month: 'short' }), ...calcTotals(mtx) }
    } catch { return { month: '', income: 0, expenses: 0, net: 0, taxDeductible: 0 } }
  })

  const unreadAlerts = alerts.filter(a => !a.isRead).length
  const recentTx = [...bizTransactions].sort((a, b) => { try { return new Date(b.date).getTime() - new Date(a.date).getTime() } catch { return 0 } }).slice(0, 10)

  const flash = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000) }

  // ─── CRUD Handlers ────────────────────────────────────────────────
  const handleSaveBusiness = async () => {
    if (!bizForm.name) return
    if (bizForm.id) {
      const _d = await getDB(); await _d.businesses.update(bizForm.id, { ...bizForm, updatedAt: new Date().toISOString() } as any)
    } else {
      const id = generateId()
      const _d = await getDB(); await _d.businesses.add({ ...bizForm, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), currency: 'CUP' } as any)
      if (!selectedBusiness) setSelectedBusiness(id)
    }
    setShowBusinessForm(false); setBizForm({}); loadAll(); flash('Negocio guardado')
  }

  const handleDeleteBusiness = async (id: string) => {
    if (!confirm('¿Eliminar este negocio y todos sus datos?')) return
    const _d = await getDB(); await _d.transactions.where('businessId').equals(id).delete(); await _d.businesses.delete(id)
    if (selectedBusiness === id) setSelectedBusiness(businesses.find(b => b.id !== id)?.id || '')
    loadAll(); flash('Negocio eliminado')
  }

  const handleSaveTransaction = async () => {
    if (!txForm.description || !txForm.amountCUP || !txForm.dateStr) return
    const data = {
      businessId: selectedBusiness, type: txForm.type!, category: txForm.category!,
      description: txForm.description!, amountCUP: Number(txForm.amountCUP),
      amountUSD: Number(txForm.amountCUP) / rate, exchangeRate: rate,
      date: txForm.dateStr, taxDeductible: txForm.taxDeductible || false,
      subcategory: txForm.subcategory, referenceNumber: txForm.referenceNumber, notes: txForm.notes,
      createdAt: new Date().toISOString()
    }
    const _d2 = await getDB()
    if (txForm.id) { await _d2.transactions.update(txForm.id, { ...data, updatedAt: new Date().toISOString() } as any) }
    else { await _d2.transactions.add({ ...data, id: generateId() } as any) }
    setShowTransactionForm(false)
    setTxForm({ type: 'INGRESO', category: '', amountCUP: 0, taxDeductible: false, dateStr: new Date().toISOString().split('T')[0] })
    loadAll(); flash('Movimiento registrado')
  }

  const handleDeleteTransaction = async (id: string) => {
    const _d = await getDB(); await _d.transactions.delete(id); loadAll(); flash('Movimiento eliminado')
  }

  const handleSaveExchangeRate = async () => {
    const _d = await getDB(); await _d.exchangeRates.add({
      ...exForm, id: generateId(), rateUSD: Number(exForm.rateUSD), rateEUR: exForm.rateEUR ? Number(exForm.rateEUR) : undefined,
      rateMLC: exForm.rateMLC ? Number(exForm.rateMLC) : undefined, date: exForm.dateStr || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    } as any)
    setShowExchangeForm(false)
    setExForm({ source: 'Manual', rateUSD: 0, dateStr: new Date().toISOString().split('T')[0] })
    loadAll(); flash('Tasa actualizada')
  }

  const handleToggleAlertRead = async (alert: AlertItem) => {
    if (alert.id) { const _d = await getDB(); await _d.alerts.update(alert.id, { isRead: !alert.isRead } as any); loadAll() }
  }

  const handleSaveUser = async () => {
    if (!userForm.username || !userForm.password || !userForm.name) return
    const hash = await simpleHash(userForm.password)
    if (userForm.id) {
      const _d = await getDB(); await _d.users.update(userForm.id, { ...userForm, password: hash } as any)
    } else {
      const _d = await getDB(); await _d.users.add({ ...userForm, id: generateId(), password: hash, createdAt: new Date().toISOString() } as any)
    }
    setShowUserForm(false); setUserForm({ role: 'user', isActive: true }); loadAll(); flash('Usuario guardado')
  }

  const handleDeleteUser = async (id: string) => {
    if (id === authUser?.id) return alert('No puede eliminar su propia cuenta')
    if (!confirm('¿Eliminar este usuario?')) return
    const _d = await getDB(); await _d.users.delete(id); loadAll(); flash('Usuario eliminado')
  }

  const handleToggleUserActive = async (user: User) => {
    if (user.id) { const _d = await getDB(); await _d.users.update(user.id, { isActive: !user.isActive } as any); loadAll() }
  }

  const handleExport = async () => {
    const data = await exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `cuentasprecision_backup_${new Date().toISOString().split('T')[0]}.json`; a.click()
    URL.revokeObjectURL(url); flash('Datos exportados')
  }

  const handleImport = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json'
    input.onchange = async (e: any) => {
      try {
        const file = e.target.files[0]; const text = await file.text(); const data = JSON.parse(text)
        if (!confirm('¿Importar datos? Esto reemplazará todos los datos actuales.')) return
        await importAllData(data); loadAll(); flash('Datos importados correctamente')
      } catch { alert('Error al importar archivo') }
    }
    input.click()
  }

  const handleLogout = () => { sessionStorage.removeItem('cp_session'); setAuthUser(null) }

  // ─── Loading / SSR Guard ─────────────────────────────────────────
  if (!mounted || !initialized) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  // ─── Error Display ──────────────────────────────────────────────
  if (appError) {
    return (
      <div className="min-h-screen bg-red-50 p-8 flex items-center justify-center">
        <Card className="max-w-lg w-full border-red-200"><CardContent className="p-6">
          <h2 className="text-lg font-bold text-red-700 mb-2">Error</h2>
          <pre className="text-sm text-red-600 bg-red-50 p-3 rounded overflow-auto max-h-40">{appError}</pre>
          <Button onClick={() => { setAppError(null); location.reload() }} className="mt-4">Reintentar</Button>
        </CardContent></Card>
      </div>
    )
  }

  // ─── Login Gate ───────────────────────────────────────────────────
  if (!authUser) return <LoginScreen onLogin={(u) => { setAuthUser(u); sessionStorage.setItem('cp_session', JSON.stringify(u)) }} />

  // ─── Navigation ───────────────────────────────────────────────────
  const navItems = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'movements', label: 'Movimientos', icon: ArrowRightLeft },
    { id: 'taxes', label: 'Impuestos', icon: Receipt },
    { id: 'books', label: 'Libros', icon: BookOpen },
    { id: 'alerts', label: 'Alertas', icon: Bell, badge: unreadAlerts },
    { id: 'settings', label: 'Config', icon: Settings },
  ]

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {successMsg && (
        <div className="fixed top-4 right-4 z-[100] bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle className="h-4 w-4" /> {successMsg}
        </div>
      )}

      {/* Header */}
      <header className="bg-emerald-700 text-white sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu className="h-6 w-6" /></button>
            <CircleDollarSign className="h-7 w-7" />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold leading-tight">CuentasPrecisión</h1>
              <p className="text-xs text-emerald-200">Contabilidad Tributaria Cuba</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-emerald-800 rounded-lg px-3 py-1.5">
              <DollarSign className="h-4 w-4 text-emerald-300" />
              <span className="text-sm font-medium">1 USD = {rate.toFixed(0)} CUP</span>
            </div>
            {unreadAlerts > 0 && (
              <button onClick={() => setActiveTab('alerts')} className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{unreadAlerts}</span>
              </button>
            )}
            {businesses.length > 0 && (
              <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                <SelectTrigger className="w-36 md:w-48 bg-emerald-800 border-emerald-600 text-white text-sm h-8"><SelectValue placeholder="Negocio" /></SelectTrigger>
                <SelectContent>{businesses.map(b => <SelectItem key={b.id} value={b.id!}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <button onClick={handleLogout} className="text-emerald-200 hover:text-white" title="Cerrar sesión"><LogIn className="h-5 w-5 rotate-180" /></button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Desktop */}
        <aside className="hidden md:flex w-60 bg-white border-r flex-col flex-shrink-0">
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === item.id ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                <item.icon className="h-5 w-5" />{item.label}
                {item.badge ? <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0">{item.badge}</Badge> : null}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t">
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center"><User className="h-4 w-4 text-emerald-600" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{authUser?.name || ''}</p>
                <p className="text-xs text-gray-400">{authUser?.role === 'admin' ? 'Administrador' : 'Usuario'}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl z-50">
              <nav className="p-4 space-y-1 mt-14">
                {navItems.map(item => (
                  <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${activeTab === item.id ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600'}`}>
                    <item.icon className="h-5 w-5" />{item.label}
                    {item.badge ? <Badge variant="destructive" className="ml-auto text-xs">{item.badge}</Badge> : null}
                  </button>
                ))}
                <Separator className="my-3" />
                <button onClick={() => { handleLogout(); setSidebarOpen(false) }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-red-600 hover:bg-red-50">
                  <LogIn className="h-5 w-5 rotate-180" /> Cerrar Sesión
                </button>
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto">

            {/* ═══ DASHBOARD ═══ */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div><h2 className="text-2xl font-bold text-gray-900">Panel de Control</h2><p className="text-gray-500">Resumen financiero y métricas clave</p></div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={loadAll}><RefreshCw className="h-4 w-4 mr-1" /> Actualizar</Button>
                    <Button size="sm" onClick={() => { setTxForm({ type: 'INGRESO', category: '', amountCUP: 0, taxDeductible: false, dateStr: new Date().toISOString().split('T')[0] }); setShowTransactionForm(true) }}>
                      <Plus className="h-4 w-4 mr-1" /> Nuevo Movimiento
                    </Button>
                  </div>
                </div>

                {businesses.length === 0 && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
                      <Building2 className="h-12 w-12 text-amber-500" />
                      <div><h3 className="text-lg font-semibold text-amber-800">Configure su negocio</h3><p className="text-amber-600 text-sm mt-1">Registre su MiPYME o actividad como TCP para comenzar.</p></div>
                      <Button onClick={() => { setBizForm({ businessType: 'TCP', taxRegime: 'Simplificado' }); setShowBusinessForm(true) }}><Plus className="h-4 w-4 mr-2" /> Registrar Negocio</Button>
                    </CardContent>
                  </Card>
                )}

                {/* Exchange Rate Widget */}
                <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center"><DollarSign className="h-7 w-7 text-emerald-600" /></div>
                        <div>
                          <p className="text-sm text-emerald-600 font-medium">Tasa de Cambio Referencia</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-gray-900">1 USD = {rate.toFixed(2)} CUP</span>
                            <span className="text-sm text-gray-500">{exchangeRates[0]?.source || 'Referencia'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input type="number" placeholder="CUP" value={cupAmount} onChange={e => setCupAmount(e.target.value)} className="w-28" />
                        <ArrowRightLeft className="h-4 w-4 text-gray-400" />
                        <div className="bg-white rounded-lg border px-3 py-2 min-w-[80px] text-center">
                          <span className="text-sm text-gray-500">$</span><span className="text-lg font-semibold">{cupAmount ? (Number(cupAmount) / rate).toFixed(2) : '0.00'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-l-4 border-l-emerald-500"><CardContent className="p-4"><div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500 font-medium">Ingresos (mes)</span><TrendingUp className="h-4 w-4 text-emerald-500" /></div><p className="text-xl md:text-2xl font-bold text-emerald-600">{formatCUP(calcTotals(monthlyTx).income)}</p><p className="text-xs text-gray-400 mt-1">{formatUSD(calcTotals(monthlyTx).income, rate)}</p></CardContent></Card>
                  <Card className="border-l-4 border-l-red-500"><CardContent className="p-4"><div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500 font-medium">Gastos (mes)</span><TrendingDown className="h-4 w-4 text-red-500" /></div><p className="text-xl md:text-2xl font-bold text-red-600">{formatCUP(calcTotals(monthlyTx).expenses)}</p><p className="text-xs text-gray-400 mt-1">{formatUSD(calcTotals(monthlyTx).expenses, rate)}</p></CardContent></Card>
                  <Card className="border-l-4 border-l-blue-500"><CardContent className="p-4"><div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500 font-medium">Balance Neto</span><Wallet className="h-4 w-4 text-blue-500" /></div><p className={`text-xl md:text-2xl font-bold ${calcTotals(monthlyTx).net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCUP(calcTotals(monthlyTx).net)}</p><p className="text-xs text-gray-400 mt-1">{formatUSD(calcTotals(monthlyTx).net, rate)}</p></CardContent></Card>
                  <Card className="border-l-4 border-l-amber-500"><CardContent className="p-4"><div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500 font-medium">Deducible (mes)</span><Shield className="h-4 w-4 text-amber-500" /></div><p className="text-xl md:text-2xl font-bold text-amber-600">{formatCUP(calcTotals(monthlyTx).taxDeductible)}</p><p className="text-xs text-gray-400 mt-1">Gastos deducibles</p></CardContent></Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Tendencia Mensual (6 meses)</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={monthlyTrend}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} /><Tooltip formatter={(v: number) => formatCUP(v)} /><Legend /><Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4,4,0,0]} /><Bar dataKey="expenses" name="Gastos" fill="#ef4444" radius={[4,4,0,0]} /></BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Gastos por Categoría</CardTitle></CardHeader>
                    <CardContent>
                      {Object.keys(expenseCategories).length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart><Pie data={Object.entries(expenseCategories).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name.substring(0,12)} ${(percent*100).toFixed(0)}%`} labelLine={false}>{Object.entries(expenseCategories).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => formatCUP(v)} /></PieChart>
                        </ResponsiveContainer>
                      ) : <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">Sin gastos este mes</div>}
                    </CardContent>
                  </Card>
                </div>

                {/* Alerts & Recent */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-base font-semibold">Alertas Recientes</CardTitle><Button variant="ghost" size="sm" onClick={() => setActiveTab('alerts')}>Ver todas</Button></div></CardHeader>
                    <CardContent className="space-y-3">
                      {alerts.slice(0, 4).map(a => (
                        <div key={a.id} className={`p-3 rounded-lg border ${a.isRead ? 'bg-gray-50 border-gray-100' : 'bg-white border-emerald-100'}`}>
                          <div className="flex items-start gap-2">
                            {a.severity === 'HIGH' || a.severity === 'CRITICAL' ? <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" /> : a.severity === 'MEDIUM' ? <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" /> : <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                            <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{a.title}</p><p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.message}</p></div>
                            <SeverityBadge severity={a.severity} />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-base font-semibold">Movimientos Recientes</CardTitle><Button variant="ghost" size="sm" onClick={() => setActiveTab('movements')}>Ver todos</Button></div></CardHeader>
                    <CardContent className="space-y-2">
                      {recentTx.length > 0 ? recentTx.slice(0, 6).map(tx => (
                        <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${tx.type === 'INGRESO' ? 'bg-emerald-100' : 'bg-red-100'}`}>{tx.type === 'INGRESO' ? <ArrowUpRight className="h-4 w-4 text-emerald-600" /> : <ArrowDownRight className="h-4 w-4 text-red-600" />}</div>
                            <div><p className="text-sm font-medium text-gray-900">{tx.description}</p><p className="text-xs text-gray-400">{tx.category} &bull; {formatDate(tx.date)}</p></div>
                          </div>
                          <span className={`text-sm font-semibold ${tx.type === 'INGRESO' ? 'text-emerald-600' : 'text-red-600'}`}>{tx.type === 'INGRESO' ? '+' : '-'}{formatCUP(tx.amountCUP)}</span>
                        </div>
                      )) : <p className="text-sm text-gray-400 text-center py-8">Sin movimientos</p>}
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-gray-900">{bizTransactions.length}</p><p className="text-xs text-gray-500">Transacciones</p></CardContent></Card>
                  <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-gray-900">{businesses.length}</p><p className="text-xs text-gray-500">Negocios</p></CardContent></Card>
                  <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{unreadAlerts}</p><p className="text-xs text-gray-500">Alertas nuevas</p></CardContent></Card>
                </div>
              </div>
            )}

            {/* ═══ MOVIMIENTOS ═══ */}
            {activeTab === 'movements' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div><h2 className="text-2xl font-bold text-gray-900">Movimientos</h2><p className="text-gray-500">Registro de ingresos y gastos</p></div>
                  <Button onClick={() => { setTxForm({ type: 'INGRESO', category: '', amountCUP: 0, taxDeductible: false, dateStr: new Date().toISOString().split('T')[0] }); setShowTransactionForm(true) }}><Plus className="h-4 w-4 mr-2" /> Nuevo Movimiento</Button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-50 rounded-xl p-4 text-center"><p className="text-xs text-emerald-600 font-medium">Ingresos (mes)</p><p className="text-xl font-bold text-emerald-700 mt-1">{formatCUP(calcTotals(monthlyTx).income)}</p></div>
                  <div className="bg-red-50 rounded-xl p-4 text-center"><p className="text-xs text-red-600 font-medium">Gastos (mes)</p><p className="text-xl font-bold text-red-700 mt-1">{formatCUP(calcTotals(monthlyTx).expenses)}</p></div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center"><p className="text-xs text-blue-600 font-medium">Balance</p><p className={`text-xl font-bold mt-1 ${calcTotals(monthlyTx).net >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCUP(calcTotals(monthlyTx).net)}</p></div>
                </div>
                <Card><CardContent className="p-0">
                  <div className="max-h-[600px] overflow-y-auto">
                    {bizTransactions.length > 0 ? bizTransactions.sort((a,b) => new Date(b.date).getTime()-new Date(a.date).getTime()).map(tx => (
                      <div key={tx.id} className="flex items-center justify-between p-4 border-b hover:bg-gray-50">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${tx.type === 'INGRESO' ? 'bg-emerald-100' : 'bg-red-100'}`}>{tx.type === 'INGRESO' ? <ArrowUpRight className="h-5 w-5 text-emerald-600" /> : <ArrowDownRight className="h-5 w-5 text-red-600" />}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2"><p className="text-sm font-semibold text-gray-900 truncate">{tx.description}</p>{tx.taxDeductible && <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-600 border-emerald-200 flex-shrink-0">Deducible</Badge>}</div>
                            <p className="text-xs text-gray-400">{tx.category} &bull; {formatDate(tx.date)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                          <div className="text-right"><p className={`text-sm font-bold ${tx.type === 'INGRESO' ? 'text-emerald-600' : 'text-red-600'}`}>{tx.type === 'INGRESO' ? '+' : '-'}{formatCUP(tx.amountCUP)}</p><p className="text-xs text-gray-400">${(tx.amountUSD||0).toFixed(2)} USD</p></div>
                          <button onClick={() => handleDeleteTransaction(tx.id!)} className="text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    )) : <div className="text-center py-16 text-gray-400"><Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No hay movimientos registrados</p></div>}
                  </div>
                </CardContent></Card>
              </div>
            )}

            {/* ═══ IMPUESTOS ═══ */}
            {activeTab === 'taxes' && (
              <div className="space-y-6">
                <div><h2 className="text-2xl font-bold text-gray-900">Impuestos y Tributos</h2><p className="text-gray-500">Tasas vigentes según Gaceta Oficial de Cuba</p></div>
                <Card className="border-emerald-200 bg-emerald-50">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calculator className="h-5 w-5" /> Calculadora de Impuestos</CardTitle><CardDescription>Estime sus obligaciones tributarias mensuales</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><Label className="text-sm">Ingresos Brutos Mensuales (CUP)</Label><Input type="number" id="taxCalcIncome" placeholder="Ej: 15000" className="mt-1" /></div>
                      <div><Label className="text-sm">Gastos Deducibles (CUP)</Label><Input type="number" id="taxCalcExpenses" placeholder="Ej: 5000" className="mt-1" /></div>
                      <div className="flex items-end">
                        <Button onClick={() => {
                          const inc = Number((document.getElementById('taxCalcIncome') as HTMLInputElement)?.value || 0)
                          const exp = Number((document.getElementById('taxCalcExpenses') as HTMLInputElement)?.value || 0)
                          const taxable = Math.max(0, inc - exp)
                          const iitRate = taxable > 50000 ? 0.20 : 0.15
                          const cssRate = 0.25
                          const iit = taxable * iitRate; const css = inc * cssRate; const total = iit + css; const net = inc - exp - total
                          const el = document.getElementById('taxResult')
                          if (el) el.innerHTML = `<div class="space-y-2 text-sm"><div class="flex justify-between"><span>Ingreso Bruto:</span><strong>${formatCUP(inc)}</strong></div><div class="flex justify-between"><span>Gastos Deducibles:</span><strong>-${formatCUP(exp)}</strong></div><div class="flex justify-between"><span>Base Imponible:</span><strong>${formatCUP(taxable)}</strong></div><hr class="my-2"><div class="flex justify-between"><span>IIT (${(iitRate*100).toFixed(0)}%):</span><strong class="text-red-600">${formatCUP(iit)}</strong></div><div class="flex justify-between"><span>CSS (25%):</span><strong class="text-red-600">${formatCUP(css)}</strong></div><hr class="my-2"><div class="flex justify-between text-base"><span>Total Impuestos:</span><strong class="text-red-700">${formatCUP(total)}</strong></div><div class="flex justify-between text-base"><span>Ingreso Neto:</span><strong class="text-emerald-700">${formatCUP(net)}</strong></div></div>`
                        }} className="w-full"><Calculator className="h-4 w-4 mr-2" /> Calcular</Button>
                      </div>
                    </div>
                    <div id="taxResult" className="bg-white rounded-lg p-4 border" />
                  </CardContent>
                </Card>
                <Card><CardHeader><CardTitle className="text-base">Tabla de Impuestos Vigentes</CardTitle><CardDescription>Referencias de Gaceta Oficial</CardDescription></CardHeader><CardContent className="p-0">
                  <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b"><th className="text-left p-3 font-medium text-gray-600">Impuesto</th><th className="text-center p-3 font-medium text-gray-600">Tasa</th><th className="text-center p-3 font-medium text-gray-600">Aplica</th><th className="text-left p-3 font-medium text-gray-600 hidden md:table-cell">Referencia</th></tr></thead>
                  <tbody>{taxRates.map(tr => (
                    <tr key={tr.id} className="border-b hover:bg-gray-50">
                      <td className="p-3"><p className="font-medium text-gray-900">{tr.name}</p><p className="text-xs text-gray-400 mt-0.5">{tr.description?.substring(0,80)}</p></td>
                      <td className="p-3 text-center"><Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{tr.rate > 0 ? `${tr.rate}%` : `${formatCUP(tr.minValue||0)}-${formatCUP(tr.maxValue||0)}`}</Badge></td>
                      <td className="p-3 text-center"><Badge variant="outline">{tr.category}</Badge></td>
                      <td className="p-3 text-xs text-gray-500 hidden md:table-cell max-w-[200px] truncate">{tr.gacetaRef}</td>
                    </tr>
                  ))}</tbody></table></div>
                </CardContent></Card>
                <Card className="border-blue-200 bg-blue-50"><CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="h-5 w-5 text-blue-600" /> Consejos Estratégicos</CardTitle></CardHeader><CardContent className="space-y-3">
                  {[
                    { t: "Maximice deducciones", d: "Registre todos los gastos deducibles: materia prima, alquiler, servicios públicos, depreciación." },
                    { t: "Cumpla con los plazos", d: "Presente declaraciones antes del día 15 de cada mes. Recargos por mora: 10%." },
                    { t: "Contribuya a la Seguridad Social", d: "El aporte del 25% como TCP genera derecho a jubilación y prestaciones." },
                    { t: "Considere formalizarse como MiPYME", d: "Si ingresos superan 50,000 CUP anuales, la formalización puede ofrecer ventajas." }
                  ].map((tip, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-white rounded-lg"><Lightbulb className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" /><div><p className="text-sm font-semibold text-gray-900">{tip.t}</p><p className="text-xs text-gray-500 mt-0.5">{tip.d}</p></div></div>
                  ))}
                </CardContent></Card>
              </div>
            )}

            {/* ═══ LIBROS ═══ */}
            {activeTab === 'books' && (
              <div className="space-y-6">
                <div><h2 className="text-2xl font-bold text-gray-900">Libros Contables</h2><p className="text-gray-500">Libro Diario, Mayor y Balance de Comprobación</p></div>
                <Tabs defaultValue="diario"><TabsList className="w-full grid grid-cols-3"><TabsTrigger value="diario"><FileText className="h-4 w-4 mr-1" /> Diario</TabsTrigger><TabsTrigger value="mayor"><BookOpen className="h-4 w-4 mr-1" /> Mayor</TabsTrigger><TabsTrigger value="balance"><BarChart3 className="h-4 w-4 mr-1" /> Balance</TabsTrigger></TabsList>
                  <TabsContent value="diario"><Card><CardHeader><CardTitle className="text-base">Libro Diario</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b"><th className="text-left p-3">Fecha</th><th className="text-left p-3">Descripción</th><th className="text-left p-3">Cuenta</th><th className="text-center p-3">Debe</th><th className="text-center p-3">Haber</th></tr></thead>
                  <tbody>{bizTransactions.sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime()).map(tx => (
                    <tr key={tx.id} className="border-b hover:bg-gray-50"><td className="p-3 text-gray-600">{formatDate(tx.date)}</td><td className="p-3 font-medium text-gray-900">{tx.description}</td><td className="p-3"><Badge variant="outline" className="text-xs">{tx.category}</Badge></td>
                    <td className="p-3 text-center">{tx.type === 'INGRESO' ? <span className="text-emerald-600 font-medium">{formatCUP(tx.amountCUP)}</span> : '-'}</td><td className="p-3 text-center">{tx.type === 'GASTO' ? <span className="text-red-600 font-medium">{formatCUP(tx.amountCUP)}</span> : '-'}</td></tr>
                  ))}{bizTransactions.length > 0 && <tr className="bg-emerald-50 font-semibold"><td colSpan={3} className="p-3">TOTALES</td><td className="p-3 text-center text-emerald-700">{formatCUP(bizTransactions.filter(t=>t.type==='INGRESO').reduce((s,t)=>s+(t.amountCUP||0),0))}</td><td className="p-3 text-center text-red-700">{formatCUP(bizTransactions.filter(t=>t.type==='GASTO').reduce((s,t)=>s+(t.amountCUP||0),0))}</td></tr>}{bizTransactions.length===0 && <tr><td colSpan={5} className="text-center py-12 text-gray-400">Sin registros</td></tr>}</tbody></table></div></CardContent></Card></TabsContent>
                  <TabsContent value="mayor"><Card><CardHeader><CardTitle className="text-base">Libro Mayor</CardTitle></CardHeader><CardContent><div className="space-y-4">{(() => {
                    const accts: Record<string,{d:number;c:number;n:number}> = {}
                    bizTransactions.forEach(tx => { if(!accts[tx.category]) accts[tx.category]={d:0,c:0,n:0}; if(tx.type==='INGRESO') accts[tx.category].d+=tx.amountCUP||0; else accts[tx.category].c+=tx.amountCUP||0; accts[tx.category].n++ })
                    const entries = Object.entries(accts)
                    if(entries.length===0) return <p className="text-center text-gray-400 py-12">Sin registros</p>
                    return entries.map(([account,data])=>(
                      <div key={account} className="border rounded-lg p-4"><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><Badge variant="outline">{account}</Badge><span className="text-xs text-gray-400">{data.n} movs</span></div><span className={`text-sm font-bold ${data.d-data.c>=0?'text-emerald-600':'text-red-600'}`}>Saldo: {formatCUP(data.d-data.c)}</span></div><div className="grid grid-cols-2 gap-4 text-sm"><div className="bg-emerald-50 rounded p-3 text-center"><p className="text-xs text-emerald-600">Debe</p><p className="text-lg font-bold text-emerald-700">{formatCUP(data.d)}</p></div><div className="bg-red-50 rounded p-3 text-center"><p className="text-xs text-red-600">Haber</p><p className="text-lg font-bold text-red-700">{formatCUP(data.c)}</p></div></div><Progress value={(data.d/(data.d+data.c)*100)||0} className="mt-2 h-2" /></div>
                    ))
                  })()}</div></CardContent></Card></TabsContent>
                  <TabsContent value="balance"><Card><CardHeader><CardTitle className="text-base">Balance de Comprobación</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b"><th className="text-left p-3">Cuenta</th><th className="text-center p-3">Saldo Deudor</th><th className="text-center p-3">Saldo Acreedor</th><th className="text-center p-3">USD</th></tr></thead>
                  <tbody>{(() => {
                    const accts:Record<string,{d:number;c:number}>={}
                    bizTransactions.forEach(tx=>{if(!accts[tx.category])accts[tx.category]={d:0,c:0};if(tx.type==='INGRESO')accts[tx.category].d+=tx.amountCUP||0;else accts[tx.category].c+=tx.amountCUP||0})
                    const entries=Object.entries(accts)
                    if(entries.length===0) return <tr><td colSpan={4} className="text-center py-12 text-gray-400">Sin datos</td></tr>
                    let tD=0,tC=0
                    return entries.map(([a,d])=>{tD+=d.d;tC+=d.c;return(<tr key={a} className="border-b hover:bg-gray-50"><td className="p-3 font-medium">{a}</td><td className="p-3 text-center text-emerald-600">{d.d>0?formatCUP(d.d):'-'}</td><td className="p-3 text-center text-red-600">{d.c>0?formatCUP(d.c):'-'}</td><td className="p-3 text-center text-gray-500">{(Math.abs(d.d-d.c)/rate).toFixed(2)}</td></tr>)})
                    .concat([<tr key="_t" className="bg-gray-50 font-bold"><td className="p-3">TOTAL</td><td className="p-3 text-center text-emerald-700">{formatCUP(tD)}</td><td className="p-3 text-center text-red-700">{formatCUP(tC)}</td><td className="p-3 text-center">{(Math.abs(tD-tC)/rate).toFixed(2)}</td></tr>])
                  })()}</tbody></table></div></CardContent></Card></TabsContent>
                </Tabs>
              </div>
            )}

            {/* ═══ ALERTAS ═══ */}
            {activeTab === 'alerts' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div><h2 className="text-2xl font-bold text-gray-900">Centro de Alertas</h2><p className="text-gray-500">Notificaciones y sugerencias tributarias</p></div>
                  <div className="flex gap-2">
                    {unreadAlerts > 0 && <Button variant="outline" size="sm" onClick={async () => { for (const a of alerts.filter(al=>!al.isRead)) { if(a.id) { const _d = await getDB(); await _d.alerts.update(a.id,{isRead:true} as any) } } loadAll() }}><CheckCircle className="h-4 w-4 mr-1" /> Leer todas</Button>}
                    <Button variant="outline" size="sm" onClick={loadAll}><RefreshCw className="h-4 w-4 mr-1" /></Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[{l:'Vencimientos',c:alerts.filter(a=>a.type==='TAX_DEADLINE').length,cl:'text-red-600 bg-red-50',ic:AlertTriangle},{l:'Ahorro Fiscal',c:alerts.filter(a=>a.type==='SAVING_OPPORTUNITY').length,cl:'text-emerald-600 bg-emerald-50',ic:Target},{l:'Sugerencias',c:alerts.filter(a=>a.type==='SUGGESTION').length,cl:'text-blue-600 bg-blue-50',ic:Lightbulb},{l:'Advertencias',c:alerts.filter(a=>a.type==='WARNING').length,cl:'text-amber-600 bg-amber-50',ic:Shield}].map((s,i)=>(
                    <div key={i} className={`${s.cl} rounded-xl p-4 text-center`}><s.ic className="h-5 w-5 mx-auto mb-1" /><p className="text-2xl font-bold">{s.c}</p><p className="text-xs font-medium">{s.l}</p></div>
                  ))}
                </div>
                <div className="space-y-3">{alerts.map(a=>(
                  <Card key={a.id} className={a.isRead?'opacity-60':''}><CardContent className="p-4"><div className="flex items-start gap-3"><div className="flex-shrink-0 mt-0.5">{a.severity==='HIGH'||a.severity==='CRITICAL'?<AlertTriangle className="h-5 w-5 text-red-500"/>:a.severity==='MEDIUM'?<Lightbulb className="h-5 w-5 text-amber-500"/>:a.type==='SAVING_OPPORTUNITY'?<Target className="h-5 w-5 text-emerald-500"/>:<Info className="h-5 w-5 text-blue-500"/>}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><h4 className="text-sm font-semibold text-gray-900">{a.title}</h4><SeverityBadge severity={a.severity}/>{!a.isRead&&<Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Nueva</Badge>}</div><p className="text-sm text-gray-600 mt-1">{a.message}</p></div><Button variant="ghost" size="sm" onClick={()=>handleToggleAlertRead(a)}>{a.isRead?<Eye className="h-4 w-4"/>:<CheckCircle className="h-4 w-4"/>}</Button></div></CardContent></Card>
                ))}</div>
              </div>
            )}

            {/* ═══ CONFIGURACIÓN ═══ */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div><h2 className="text-2xl font-bold text-gray-900">Configuración</h2><p className="text-gray-500">Gestione su cuenta, negocios y datos</p></div>

                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Mis Negocios</h3>
                  <Button size="sm" onClick={() => { setBizForm({ businessType: 'TCP', taxRegime: 'Simplificado' }); setShowBusinessForm(true) }}><Plus className="h-4 w-4 mr-1" /> Nuevo</Button>
                </div>
                {businesses.length === 0 ? (
                  <Card className="border-dashed"><CardContent className="p-8 text-center text-gray-400"><Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No hay negocios registrados</p></CardContent></Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{businesses.map(biz => (
                    <Card key={biz.id} className={selectedBusiness === biz.id ? 'border-emerald-300 ring-2 ring-emerald-100' : ''}>
                      <CardContent className="p-4"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center"><Building2 className="h-5 w-5 text-emerald-600" /></div><div><h4 className="font-semibold text-gray-900">{biz.name}</h4><div className="flex items-center gap-2 mt-1"><Badge variant={biz.businessType==='MIPYME'?'default':'secondary'}>{biz.businessType}</Badge><span className="text-xs text-gray-400">{biz.activityType}</span></div></div></div><div className="flex gap-1"><button onClick={()=>{setBizForm(biz);setShowBusinessForm(true)}} className="p-1 text-gray-400 hover:text-blue-500"><Edit className="h-4 w-4"/></button><button onClick={()=>handleDeleteBusiness(biz.id!)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4"/></button></div></div>
                      {biz.nif && <p className="text-xs text-gray-400 mt-2">NIF: {biz.nif}</p>}
                      <div className="mt-3"><Button size="sm" variant={selectedBusiness===biz.id?'default':'outline'} onClick={()=>setSelectedBusiness(biz.id!)}>{selectedBusiness===biz.id?<CheckCircle className="h-3 w-3 mr-1"/>:null}{selectedBusiness===biz.id?'Activo':'Seleccionar'}</Button></div></CardContent>
                    </Card>
                  ))}</div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Users className="h-5 w-5" /> Usuarios</h3>
                  <Button size="sm" onClick={() => { setUserForm({ role: 'user', isActive: true }); setShowUserForm(true) }}><UserPlus className="h-4 w-4 mr-1" /> Nuevo Usuario</Button>
                </div>
                <Card><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b"><th className="text-left p-3">Nombre</th><th className="text-left p-3">Usuario</th><th className="text-center p-3">Rol</th><th className="text-center p-3">Estado</th><th className="text-right p-3">Acciones</th></tr></thead>
                <tbody>{users.map(u => (
                  <tr key={u.id} className="border-b hover:bg-gray-50"><td className="p-3 font-medium">{u.name}</td><td className="p-3 text-gray-500">{u.username}</td><td className="p-3 text-center"><Badge variant={u.role==='admin'?'default':'secondary'}>{u.role}</Badge></td><td className="p-3 text-center"><Button size="sm" variant={u.isActive?'outline':'destructive'} className="text-xs h-7" onClick={()=>handleToggleUserActive(u)}>{u.isActive?'Activo':'Inactivo'}</Button></td>
                  <td className="p-3 text-right"><div className="flex justify-end gap-1"><button onClick={()=>{setUserForm(u);setShowUserForm(true)}} className="p-1 text-gray-400 hover:text-blue-500"><Edit className="h-4 w-4"/></button>{u.id!==authUser?.id && <button onClick={()=>handleDeleteUser(u.id!)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4"/></button>}</div></td></tr>
                ))}</tbody></table></div></CardContent></Card>

                <Separator />

                <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Tasas de Cambio</h3><Button size="sm" onClick={()=>setShowExchangeForm(true)}><Plus className="h-4 w-4 mr-1" /> Actualizar Tasa</Button></div>
                <Card><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b"><th className="text-left p-3">Fecha</th><th className="text-center p-3">USD/CUP</th><th className="text-center p-3">EUR/CUP</th><th className="text-center p-3">MLC/CUP</th><th className="text-left p-3">Fuente</th></tr></thead>
                <tbody>{exchangeRates.slice(0,10).map(er=>(<tr key={er.id} className="border-b hover:bg-gray-50"><td className="p-3 text-gray-600">{formatDate(er.date)}</td><td className="p-3 text-center font-semibold">{(er.rateUSD||0).toFixed(2)}</td><td className="p-3 text-center">{(er.rateEUR||0).toFixed(2)||'-'}</td><td className="p-3 text-center">{(er.rateMLC||0).toFixed(2)||'-'}</td><td className="p-3"><Badge variant="outline">{er.source}</Badge></td></tr>))}</tbody></table></div></CardContent></Card>

                <Separator />

                <h3 className="text-lg font-semibold flex items-center gap-2"><Database className="h-5 w-5" /> Datos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-dashed cursor-pointer hover:border-emerald-300 transition-colors" onClick={handleExport}><CardContent className="p-6 text-center"><Download className="h-8 w-8 mx-auto mb-2 text-emerald-600" /><p className="font-medium text-gray-900">Exportar Backup</p><p className="text-xs text-gray-400 mt-1">Descargar todos los datos como JSON</p></CardContent></Card>
                  <Card className="border-dashed cursor-pointer hover:border-blue-300 transition-colors" onClick={handleImport}><CardContent className="p-6 text-center"><Upload className="h-8 w-8 mx-auto mb-2 text-blue-600" /><p className="font-medium text-gray-900">Importar Datos</p><p className="text-xs text-gray-400 mt-1">Restaurar desde backup</p></CardContent></Card>
                </div>

                <Card className="bg-gray-50"><CardContent className="p-6 text-center">
                  <CircleDollarSign className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
                  <h3 className="text-lg font-bold text-gray-900">CuentasPrecisión v1.0</h3>
                  <p className="text-sm text-gray-500 mt-1">Contabilidad tributaria para MiPYMEs y TCP en Cuba</p>
                  <p className="text-xs text-gray-400 mt-2">BD local (IndexedDB) &bull; Sin servidor &bull; Funciona offline</p>
                </CardContent></Card>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="flex justify-around py-2">{navItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs ${activeTab===item.id?'text-emerald-600':'text-gray-400'}`}>
            <div className="relative"><item.icon className="h-5 w-5" />{item.badge?<span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center">{item.badge>9?'9+':item.badge}</span>:null}</div>
            <span>{item.label}</span>
          </button>
        ))}</div>
      </nav>

      {/* ═══ DIALOGS ═══ */}

      {/* Business Form */}
      <Dialog open={showBusinessForm} onOpenChange={setShowBusinessForm}><DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{bizForm.id?'Editar':'Nuevo'} Negocio</DialogTitle><DialogDescription>Registre su MiPYME o actividad como TCP</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div><Label>Nombre *</Label><Input value={bizForm.name||''} onChange={e=>setBizForm({...bizForm,name:e.target.value})} placeholder="Ej: Restaurante El Morro" className="mt-1"/></div>
          <div className="grid grid-cols-2 gap-4"><div><Label>Tipo *</Label><Select value={bizForm.businessType} onValueChange={v=>setBizForm({...bizForm,businessType:v})}><SelectTrigger className="mt-1"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="TCP">TCP</SelectItem><SelectItem value="MIPYME">MiPYME</SelectItem></SelectContent></Select></div><div><Label>Régimen *</Label><Select value={bizForm.taxRegime} onValueChange={v=>setBizForm({...bizForm,taxRegime:v})}><SelectTrigger className="mt-1"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Simplificado">Simplificado</SelectItem><SelectItem value="General">General</SelectItem></SelectContent></Select></div></div>
          <div><Label>Actividad *</Label><Select value={bizForm.activityType} onValueChange={v=>setBizForm({...bizForm,activityType:v})}><SelectTrigger className="mt-1"><SelectValue placeholder="Seleccione..."/></SelectTrigger><SelectContent>{(bizForm.businessType==='MIPYME'?MIPYME_ACTIVITIES:TCP_ACTIVITIES).map(a=><SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>NIF</Label><Input value={bizForm.nif||''} onChange={e=>setBizForm({...bizForm,nif:e.target.value})} className="mt-1"/></div>
          <div><Label>Dirección</Label><Input value={bizForm.address||''} onChange={e=>setBizForm({...bizForm,address:e.target.value})} className="mt-1"/></div>
          <div className="grid grid-cols-2 gap-4"><div><Label>Teléfono</Label><Input value={bizForm.phone||''} onChange={e=>setBizForm({...bizForm,phone:e.target.value})} className="mt-1"/></div><div><Label>Email</Label><Input type="email" value={bizForm.email||''} onChange={e=>setBizForm({...bizForm,email:e.target.value})} className="mt-1"/></div></div>
          <div className="flex gap-2 justify-end pt-2"><Button variant="outline" onClick={()=>{setShowBusinessForm(false);setBizForm({})}}>Cancelar</Button><Button onClick={handleSaveBusiness}><Save className="h-4 w-4 mr-1"/> Guardar</Button></div>
        </div>
      </DialogContent></Dialog>

      {/* Transaction Form */}
      <Dialog open={showTransactionForm} onOpenChange={setShowTransactionForm}><DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Nuevo Movimiento</DialogTitle><DialogDescription>Registre un ingreso o gasto</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4"><div><Label>Tipo *</Label><Select value={txForm.type} onValueChange={v=>setTxForm({...txForm,type:v,category:''})}><SelectTrigger className="mt-1"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="INGRESO">Ingreso</SelectItem><SelectItem value="GASTO">Gasto</SelectItem></SelectContent></Select></div><div><Label>Fecha *</Label><Input type="date" value={txForm.dateStr} onChange={e=>setTxForm({...txForm,dateStr:e.target.value})} className="mt-1"/></div></div>
          <div><Label>Descripción *</Label><Input value={txForm.description||''} onChange={e=>setTxForm({...txForm,description:e.target.value})} className="mt-1"/></div>
          <div className="grid grid-cols-2 gap-4"><div><Label>Categoría *</Label><Select value={txForm.category} onValueChange={v=>setTxForm({...txForm,category:v})}><SelectTrigger className="mt-1"><SelectValue placeholder="Seleccione..."/></SelectTrigger><SelectContent>{(txForm.type==='INGRESO'?INCOME_CATEGORIES:EXPENSE_CATEGORIES).map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div><div><Label>Monto (CUP) *</Label><Input type="number" value={txForm.amountCUP||''} onChange={e=>setTxForm({...txForm,amountCUP:Number(e.target.value)})} className="mt-1"/></div></div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"><DollarSign className="h-4 w-4 text-gray-400"/><span className="text-sm text-gray-500">USD: <strong>{txForm.amountCUP?(txForm.amountCUP/rate).toFixed(2):'0.00'}</strong> (tasa: {rate})</span></div>
          <div><Label>Ref.</Label><Input value={txForm.referenceNumber||''} onChange={e=>setTxForm({...txForm,referenceNumber:e.target.value})} className="mt-1"/></div>
          <div className="flex items-center gap-3"><Switch checked={txForm.taxDeductible} onCheckedChange={v=>setTxForm({...txForm,taxDeductible:v})}/><Label className="text-sm">Marcar como deducible</Label></div>
          <div><Label>Notas</Label><Textarea value={txForm.notes||''} onChange={e=>setTxForm({...txForm,notes:e.target.value})} className="mt-1" rows={2}/></div>
          <div className="flex gap-2 justify-end pt-2"><Button variant="outline" onClick={()=>{setShowTransactionForm(false);setTxForm({type:'INGRESO',category:'',amountCUP:0,taxDeductible:false,dateStr:new Date().toISOString().split('T')[0]})}}>Cancelar</Button><Button onClick={handleSaveTransaction}><Save className="h-4 w-4 mr-1"/> Registrar</Button></div>
        </div>
      </DialogContent></Dialog>

      {/* Exchange Rate Form */}
      <Dialog open={showExchangeForm} onOpenChange={setShowExchangeForm}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Actualizar Tasa</DialogTitle><DialogDescription>Registre la tasa desde fuentes alternativas</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4"><div><Label>Fuente</Label><Select value={exForm.source} onValueChange={v=>setExForm({...exForm,source:v})}><SelectTrigger className="mt-1"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="El Toque">El Toque</SelectItem><SelectItem value="Atales">Atales</SelectItem><SelectItem value="Manual">Manual</SelectItem></SelectContent></Select></div><div><Label>Fecha</Label><Input type="date" value={exForm.dateStr||''} onChange={e=>setExForm({...exForm,dateStr:e.target.value})} className="mt-1"/></div></div>
          <div className="grid grid-cols-3 gap-4"><div><Label>USD/CUP</Label><Input type="number" value={exForm.rateUSD||''} onChange={e=>setExForm({...exForm,rateUSD:Number(e.target.value)})} className="mt-1"/></div><div><Label>EUR/CUP</Label><Input type="number" value={exForm.rateEUR||''} onChange={e=>setExForm({...exForm,rateEUR:Number(e.target.value)})} className="mt-1"/></div><div><Label>MLC/CUP</Label><Input type="number" value={exForm.rateMLC||''} onChange={e=>setExForm({...exForm,rateMLC:Number(e.target.value)})} className="mt-1"/></div></div>
          <div className="flex gap-2 justify-end pt-2"><Button variant="outline" onClick={()=>setShowExchangeForm(false)}>Cancelar</Button><Button onClick={handleSaveExchangeRate}><Save className="h-4 w-4 mr-1"/> Guardar</Button></div>
        </div>
      </DialogContent></Dialog>

      {/* User Form */}
      <Dialog open={showUserForm} onOpenChange={setShowUserForm}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{userForm.id?'Editar':'Nuevo'} Usuario</DialogTitle><DialogDescription>{userForm.id?'Modifique los datos del usuario':'Cree una cuenta de acceso'}</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div><Label>Nombre completo *</Label><Input value={userForm.name||''} onChange={e=>setUserForm({...userForm,name:e.target.value})} className="mt-1"/></div>
          <div><Label>Nombre de usuario *</Label><Input value={userForm.username||''} onChange={e=>setUserForm({...userForm,username:e.target.value})} className="mt-1"/></div>
          <div><Label>{userForm.id?'Nueva contraseña (dejar vacío para no cambiar)':'Contraseña *'}</Label><Input type="password" value={userForm.password||''} onChange={e=>setUserForm({...userForm,password:e.target.value})} className="mt-1"/></div>
          <div><Label>Rol</Label><Select value={userForm.role} onValueChange={v=>setUserForm({...userForm,role:v})}><SelectTrigger className="mt-1"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="admin">Administrador</SelectItem><SelectItem value="user">Usuario</SelectItem></SelectContent></Select></div>
          <div className="flex gap-2 justify-end pt-2"><Button variant="outline" onClick={()=>{setShowUserForm(false);setUserForm({role:'user',isActive:true})}}>Cancelar</Button><Button onClick={handleSaveUser}><Save className="h-4 w-4 mr-1"/> Guardar</Button></div>
        </div>
      </DialogContent></Dialog>
    </div>
  )
}

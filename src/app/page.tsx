'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard, ArrowRightLeft, Receipt, BookOpen, Bell, Settings,
  Plus, TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle,
  Info, ChevronDown, ChevronUp, Trash2, Edit, X, Save, Eye,
  Calculator, Building2, Wallet, ArrowUpRight, ArrowDownRight,
  Search, Filter, Download, RefreshCw, Shield, Target, Lightbulb,
  Calendar, FileText, BarChart3, PieChart, LineChart, Activity,
  Menu, LogOut, CircleDollarSign
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart,
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────
interface Business {
  id: string; name: string; businessType: string; activityType: string;
  taxRegime: string; nif?: string; address?: string; phone?: string; email?: string;
  createdAt: string;
}

interface Transaction {
  id: string; businessId: string; type: string; category: string; subcategory?: string;
  description: string; amountCUP: number; amountUSD?: number; exchangeRate?: number;
  date: string; referenceNumber?: string; taxDeductible: boolean; notes?: string;
}

interface TaxRate {
  id: string; name: string; code: string; description: string; rate: number;
  minValue?: number; maxValue?: number; gacetaRef?: string; category?: string;
}

interface ExchangeRate {
  id: string; source: string; rateUSD: number; rateEUR?: number; rateMLC?: number;
  date: string;
}

interface AlertItem {
  id: string; type: string; title: string; message: string; severity: string;
  isRead: boolean; createdAt: string;
}

interface DashboardData {
  summary: {
    allTime: { income: number; expenses: number; net: number; taxDeductible: number };
    monthly: { income: number; expenses: number; net: number; taxDeductible: number };
    yearly: { income: number; expenses: number; net: number; taxDeductible: number };
  };
  exchangeRate: ExchangeRate;
  unreadAlerts: number;
  pendingTaxes: number;
  expenseCategories: Record<string, number>;
  monthlyTrend: { month: string; income: number; expenses: number; net: number }[];
  recentTransactions: Transaction[];
  totalTransactions: number;
  totalBusinesses: number;
}

// ─── Constants ───────────────────────────────────────────────────────
const INCOME_CATEGORIES = [
  "Ventas de Productos", "Prestación de Servicios", "Alquileres",
  "Comisiones", "Intereses", "Otros Ingresos"
]
const EXPENSE_CATEGORIES = [
  "Materia Prima e Insumos", "Alquiler", "Servicios Públicos (Agua/Electricidad/Gas)",
  "Salarios y Nóminas", "Transporte", "Mantenimiento y Reparaciones",
  "Impuestos y Contribuciones", "Marketing y Publicidad", "Seguros",
  "Depreciación", "Gastos Financieros", "Otros Gastos"
]
const TCP_ACTIVITIES = [
  "Gastronomía", "Transporte de Pasajeros", "Transporte de Carga",
  "Servicios Técnicos", "Construcción y Reparaciones", "Telecomunicaciones (Agente)",
  "Servicios de Belleza", "Artesanía", "Alquiler de Viviendas",
  "Servicios de Limpieza", "Educación Particular", "Reparación de Equipos", "Otra Actividad"
]
const MIPYME_ACTIVITIES = [
  "Comercio", "Gastronomía", "Construcción", "Transporte",
  "Tecnología", "Servicios Profesionales", "Manufactura", "Agricultura", "Otra Actividad"
]
const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316']

const formatCUP = (n: number) => new Intl.NumberFormat('es-CU', { style: 'currency', currency: 'CUP' }).format(n)
const formatUSD = (n: number, rate: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n / rate)
const formatDate = (d: string) => new Date(d).toLocaleDateString('es-CU', { day: '2-digit', month: '2-digit', year: 'numeric' })

// ─── Severity Badge ──────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
    CRITICAL: { label: 'Crítico', variant: 'destructive', className: '' },
    HIGH: { label: 'Alto', variant: 'destructive', className: '' },
    MEDIUM: { label: 'Medio', variant: 'default', className: 'bg-amber-500 text-white hover:bg-amber-600' },
    LOW: { label: 'Bajo', variant: 'secondary', className: '' },
    INFO: { label: 'Info', variant: 'secondary', className: '' },
  }
  const s = map[severity] || map.INFO
  return <Badge variant={s.variant} className={s.className}>{s.label}</Badge>
}

// ─── Main App ────────────────────────────────────────────────────────
export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Data states
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Form states
  const [showBusinessForm, setShowBusinessForm] = useState(false)
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [showExchangeForm, setShowExchangeForm] = useState(false)
  const [cupAmount, setCupAmount] = useState('')
  const [editingAlert, setEditingAlert] = useState<AlertItem | null>(null)

  const [bizForm, setBizForm] = useState<Partial<Business>>({})
  const [txForm, setTxForm] = useState<Partial<Transaction> & { dateStr: string }>({
    type: 'INGRESO', category: '', amountCUP: 0, taxDeductible: false, dateStr: new Date().toISOString().split('T')[0]
  })
  const [exForm, setExForm] = useState<Partial<ExchangeRate>>({ source: 'Manual', rateUSD: 0, rateEUR: 0, rateMLC: 0, dateStr: new Date().toISOString().split('T')[0] })

  // ─── Load Data ──────────────────────────────────────────────────
  const loadSeed = useCallback(async () => {
    await fetch('/api/seed', { method: 'POST' })
  }, [])

  const loadDashboard = useCallback(async () => {
    const params = selectedBusiness ? `?businessId=${selectedBusiness}` : ''
    const res = await fetch(`/api/dashboard${params}`)
    if (res.ok) setDashboardData(await res.json())
  }, [selectedBusiness])

  const loadBusinesses = useCallback(async () => {
    const res = await fetch('/api/business')
    if (res.ok) {
      const data = await res.json()
      setBusinesses(data)
      if (data.length > 0 && !selectedBusiness) setSelectedBusiness(data[0].id)
    }
  }, [selectedBusiness])

  const loadTransactions = useCallback(async () => {
    const params = selectedBusiness ? `?businessId=${selectedBusiness}` : ''
    const res = await fetch(`/api/transactions${params}`)
    if (res.ok) setTransactions(await res.json())
  }, [selectedBusiness])

  const loadTaxes = useCallback(async () => {
    const res = await fetch('/api/taxes')
    if (res.ok) setTaxRates(await res.json())
  }, [])

  const loadExchangeRates = useCallback(async () => {
    const res = await fetch('/api/exchange-rate')
    if (res.ok) setExchangeRates(await res.json())
  }, [])

  const loadAlerts = useCallback(async () => {
    const res = await fetch('/api/alerts')
    if (res.ok) setAlerts(await res.json())
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    await loadSeed()
    await Promise.all([loadDashboard(), loadBusinesses(), loadTransactions(), loadTaxes(), loadExchangeRates(), loadAlerts()])
    setLoading(false)
  }, [loadSeed, loadDashboard, loadBusinesses, loadTransactions, loadTaxes, loadExchangeRates, loadAlerts])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadAll() }, [loadAll])
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadDashboard(); void loadTransactions() }, [selectedBusiness, loadDashboard, loadTransactions])

  // ─── CRUD Handlers ──────────────────────────────────────────────
  const handleSaveBusiness = async () => {
    if (!bizForm.name) return
    if (bizForm.id) {
      await fetch('/api/business', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bizForm) })
    } else {
      const res = await fetch('/api/business', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bizForm) })
      const newBiz = await res.json()
      if (!selectedBusiness) setSelectedBusiness(newBiz.id)
    }
    setShowBusinessForm(false)
    setBizForm({})
    loadBusinesses(); loadDashboard()
  }

  const handleDeleteBusiness = async (id: string) => {
    if (!confirm('¿Eliminar este negocio y todos sus datos?')) return
    await fetch('/api/business', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (selectedBusiness === id) setSelectedBusiness('')
    loadBusinesses(); loadDashboard(); loadTransactions()
  }

  const handleSaveTransaction = async () => {
    if (!txForm.description || !txForm.amountCUP || !txForm.dateStr) return
    const data = { ...txForm, businessId: selectedBusiness, date: txForm.dateStr, amountCUP: Number(txForm.amountCUP), amountUSD: txForm.amountCUP ? Number(txForm.amountCUP) / (dashboardData?.exchangeRate.rateUSD || 350) : 0, exchangeRate: dashboardData?.exchangeRate.rateUSD || 350 }
    if (txForm.id) {
      await fetch('/api/transactions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    } else {
      await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    }
    setShowTransactionForm(false)
    setTxForm({ type: 'INGRESO', category: '', amountCUP: 0, taxDeductible: false, dateStr: new Date().toISOString().split('T')[0] })
    loadTransactions(); loadDashboard()
  }

  const handleDeleteTransaction = async (id: string) => {
    await fetch('/api/transactions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadTransactions(); loadDashboard()
  }

  const handleSaveExchangeRate = async () => {
    await fetch('/api/exchange-rate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(exForm) })
    setShowExchangeForm(false)
    setExForm({ source: 'Manual', rateUSD: 0, rateEUR: 0, rateMLC: 0, dateStr: new Date().toISOString().split('T')[0] })
    loadExchangeRates(); loadDashboard()
  }

  const handleToggleAlertRead = async (alert: AlertItem) => {
    await fetch('/api/alerts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: alert.id, isRead: !alert.isRead }) })
    loadAlerts(); loadDashboard()
  }

  const rate = dashboardData?.exchangeRate.rateUSD || 350

  // ─── Navigation Items ───────────────────────────────────────────
  const navItems = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'movements', label: 'Movimientos', icon: ArrowRightLeft },
    { id: 'taxes', label: 'Impuestos', icon: Receipt },
    { id: 'books', label: 'Libros', icon: BookOpen },
    { id: 'alerts', label: 'Alertas', icon: Bell, badge: dashboardData?.unreadAlerts || 0 },
    { id: 'settings', label: 'Config', icon: Settings },
  ]

  // ─── Loading State ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-60 rounded-xl" />
        </div>
      </div>
    )
  }

  // ─── RENDER ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-emerald-700 text-white sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-6 w-6" />
            </button>
            <CircleDollarSign className="h-7 w-7" />
            <div>
              <h1 className="text-lg font-bold leading-tight">CuentasPrecisión</h1>
              <p className="text-xs text-emerald-200">Contabilidad Tributaria Cuba</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Exchange Rate Badge */}
            <div className="hidden sm:flex items-center gap-2 bg-emerald-800 rounded-lg px-3 py-1.5">
              <DollarSign className="h-4 w-4 text-emerald-300" />
              <span className="text-sm font-medium">1 USD = {rate.toFixed(0)} CUP</span>
            </div>
            {/* Alert indicator */}
            {(dashboardData?.unreadAlerts || 0) > 0 && (
              <button onClick={() => setActiveTab('alerts')} className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {dashboardData?.unreadAlerts}
                </span>
              </button>
            )}
            {businesses.length > 0 && (
              <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                <SelectTrigger className="w-40 md:w-52 bg-emerald-800 border-emerald-600 text-white text-sm h-8">
                  <SelectValue placeholder="Negocio" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex w-64 bg-white border-r flex-col flex-shrink-0">
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                {item.badge ? <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0">{item.badge}</Badge> : null}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t">
            <div className="text-xs text-gray-400 text-center">
              CuentasPrecisión v1.0<br />Contabilidad para MiPYME y TCP
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl z-50">
              <nav className="p-4 space-y-1 mt-14">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      activeTab === item.id
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                    {item.badge ? <Badge variant="destructive" className="ml-auto text-xs">{item.badge}</Badge> : null}
                  </button>
                ))}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">

            {/* ═══ DASHBOARD ═══ */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Welcome */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Panel de Control</h2>
                    <p className="text-gray-500">Resumen financiero y métricas clave</p>
                  </div>
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
                      <div>
                        <h3 className="text-lg font-semibold text-amber-800">Configura tu negocio</h3>
                        <p className="text-amber-600 text-sm mt-1">Para comenzar a llevar tus libros contables, registra primero tu negocio o actividad como TCP.</p>
                      </div>
                      <Button onClick={() => { setBizForm({ businessType: 'TCP', taxRegime: 'Simplificado' }); setShowBusinessForm(true) }}>
                        <Plus className="h-4 w-4 mr-2" /> Registrar Negocio
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Exchange Rate Widget */}
                <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 overflow-hidden">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <DollarSign className="h-7 w-7 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm text-emerald-600 font-medium">Tasa de Cambio Referencia</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-gray-900">1 USD = {rate.toFixed(2)} CUP</span>
                            <span className="text-sm text-gray-500">Fuente: {dashboardData?.exchangeRate.source}</span>
                          </div>
                          {dashboardData?.exchangeRate.rateEUR && (
                            <p className="text-sm text-gray-500">1 EUR = {dashboardData.exchangeRate.rateEUR.toFixed(2)} CUP &bull; 1 MLC = {dashboardData.exchangeRate.rateMLC?.toFixed(2) || rate.toFixed(2)} CUP</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input type="number" placeholder="CUP" value={cupAmount} onChange={e => setCupAmount(e.target.value)} className="w-28" />
                        <ArrowRightLeft className="h-4 w-4 text-gray-400" />
                        <div className="bg-white rounded-lg border px-3 py-2 min-w-[80px] text-center">
                          <span className="text-sm text-gray-500">$</span>
                          <span className="text-lg font-semibold">{cupAmount ? (Number(cupAmount) / rate).toFixed(2) : '0.00'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-l-4 border-l-emerald-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 font-medium">Ingresos (mes)</span>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      </div>
                      <p className="text-xl md:text-2xl font-bold text-emerald-600">{formatCUP(dashboardData?.summary.monthly.income || 0)}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatUSD(dashboardData?.summary.monthly.income || 0, rate)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 font-medium">Gastos (mes)</span>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      </div>
                      <p className="text-xl md:text-2xl font-bold text-red-600">{formatCUP(dashboardData?.summary.monthly.expenses || 0)}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatUSD(dashboardData?.summary.monthly.expenses || 0, rate)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 font-medium">Balance Neto</span>
                        <Wallet className="h-4 w-4 text-blue-500" />
                      </div>
                      <p className={`text-xl md:text-2xl font-bold ${(dashboardData?.summary.monthly.net || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCUP(dashboardData?.summary.monthly.net || 0)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{formatUSD(dashboardData?.summary.monthly.net || 0, rate)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 font-medium">Deducible (mes)</span>
                        <Shield className="h-4 w-4 text-amber-500" />
                      </div>
                      <p className="text-xl md:text-2xl font-bold text-amber-600">{formatCUP(dashboardData?.summary.monthly.taxDeductible || 0)}</p>
                      <p className="text-xs text-gray-400 mt-1">Gastos deducibles de impuestos</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Monthly Trend */}
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold">Tendencia Mensual (6 meses)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={dashboardData?.monthlyTrend || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                          <Tooltip formatter={(v: number) => formatCUP(v)} />
                          <Legend />
                          <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expenses" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Expense Categories Pie */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold">Gastos por Categoría</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {dashboardData && Object.keys(dashboardData.expenseCategories).length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <RechartsPieChart>
                            <Pie
                              data={Object.entries(dashboardData.expenseCategories).map(([name, value]) => ({ name, value }))}
                              cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                              dataKey="value" label={({ name, percent }) => `${name.substring(0, 12)}... ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {Object.entries(dashboardData.expenseCategories).map((_, i) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: number) => formatCUP(v)} />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">
                          Sin gastos registrados este mes
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Alerts & Recent Transactions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quick Alerts */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">Alertas Recientes</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('alerts')}>Ver todas</Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {alerts.slice(0, 4).map(a => (
                        <div key={a.id} className={`p-3 rounded-lg border ${a.isRead ? 'bg-gray-50 border-gray-100' : 'bg-white border-emerald-100'}`}>
                          <div className="flex items-start gap-2">
                            {a.severity === 'HIGH' || a.severity === 'CRITICAL' ? <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" /> :
                             a.severity === 'MEDIUM' ? <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" /> :
                             <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.message}</p>
                            </div>
                            <SeverityBadge severity={a.severity} />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Recent Transactions */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">Movimientos Recientes</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('movements')}>Ver todos</Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {(dashboardData?.recentTransactions || []).slice(0, 6).map(tx => (
                        <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${tx.type === 'INGRESO' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                              {tx.type === 'INGRESO' ? <ArrowUpRight className="h-4 w-4 text-emerald-600" /> : <ArrowDownRight className="h-4 w-4 text-red-600" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                              <p className="text-xs text-gray-400">{tx.category} &bull; {formatDate(tx.date)}</p>
                            </div>
                          </div>
                          <span className={`text-sm font-semibold ${tx.type === 'INGRESO' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {tx.type === 'INGRESO' ? '+' : '-'}{formatCUP(tx.amountCUP)}
                          </span>
                        </div>
                      ))}
                      {(dashboardData?.recentTransactions || []).length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-8">No hay movimientos registrados</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Stats Footer */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-white">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-gray-900">{dashboardData?.totalTransactions || 0}</p>
                      <p className="text-xs text-gray-500">Total Transacciones</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-gray-900">{dashboardData?.totalBusinesses || 0}</p>
                      <p className="text-xs text-gray-500">Negocios</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-amber-600">{dashboardData?.pendingTaxes || 0}</p>
                      <p className="text-xs text-gray-500">Tasas Pendientes</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ═══ MOVIMIENTOS ═══ */}
            {activeTab === 'movements' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Movimientos</h2>
                    <p className="text-gray-500">Registro de ingresos y gastos</p>
                  </div>
                  <Button onClick={() => { setTxForm({ type: 'INGRESO', category: '', amountCUP: 0, taxDeductible: false, dateStr: new Date().toISOString().split('T')[0] }); setShowTransactionForm(true) }}>
                    <Plus className="h-4 w-4 mr-2" /> Nuevo Movimiento
                  </Button>
                </div>

                {/* Monthly summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-emerald-600 font-medium">Ingresos del mes</p>
                    <p className="text-xl font-bold text-emerald-700 mt-1">{formatCUP(dashboardData?.summary.monthly.income || 0)}</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-red-600 font-medium">Gastos del mes</p>
                    <p className="text-xl font-bold text-red-700 mt-1">{formatCUP(dashboardData?.summary.monthly.expenses || 0)}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-blue-600 font-medium">Balance</p>
                    <p className={`text-xl font-bold mt-1 ${(dashboardData?.summary.monthly.net || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {formatCUP(dashboardData?.summary.monthly.net || 0)}
                    </p>
                  </div>
                </div>

                {/* Transactions List */}
                <Card>
                  <CardContent className="p-0">
                    <div className="max-h-[600px] overflow-y-auto">
                      {transactions.length > 0 ? transactions.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between p-4 border-b hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${tx.type === 'INGRESO' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                              {tx.type === 'INGRESO' ? <ArrowUpRight className="h-5 w-5 text-emerald-600" /> : <ArrowDownRight className="h-5 w-5 text-red-600" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900 truncate">{tx.description}</p>
                                {tx.taxDeductible && <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-600 border-emerald-200 flex-shrink-0">Deducible</Badge>}
                              </div>
                              <p className="text-xs text-gray-400">{tx.category}{tx.subcategory ? ` > ${tx.subcategory}` : ''} &bull; {formatDate(tx.date)}{tx.referenceNumber ? ` &bull; ${tx.referenceNumber}` : ''}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                            <div className="text-right">
                              <p className={`text-sm font-bold ${tx.type === 'INGRESO' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {tx.type === 'INGRESO' ? '+' : '-'}{formatCUP(tx.amountCUP)}
                              </p>
                              <p className="text-xs text-gray-400">${tx.amountUSD?.toFixed(2)} USD</p>
                            </div>
                            <button onClick={() => handleDeleteTransaction(tx.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-16 text-gray-400">
                          <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>No hay movimientos registrados</p>
                          <p className="text-sm mt-1">Comience agregando su primer ingreso o gasto</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ═══ IMPUESTOS ═══ */}
            {activeTab === 'taxes' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Impuestos y Tributos</h2>
                  <p className="text-gray-500">Tasas vigentes según Gaceta Oficial de la República de Cuba</p>
                </div>

                {/* Tax Calculator */}
                <Card className="border-emerald-200 bg-emerald-50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Calculator className="h-5 w-5" /> Calculadora de Impuestos</CardTitle>
                    <CardDescription>Estime sus obligaciones tributarias mensuales</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm">Ingresos Brutos Mensuales (CUP)</Label>
                        <Input type="number" id="taxCalcIncome" placeholder="Ej: 15000" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-sm">Gastos Deducibles (CUP)</Label>
                        <Input type="number" id="taxCalcExpenses" placeholder="Ej: 5000" className="mt-1" />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={() => {
                          const inc = Number((document.getElementById('taxCalcIncome') as HTMLInputElement)?.value || 0)
                          const exp = Number((document.getElementById('taxCalcExpenses') as HTMLInputElement)?.value || 0)
                          const taxable = Math.max(0, inc - exp)
                          const iitRate = taxable > 50000 ? 0.20 : 0.15
                          const cssRate = 0.25
                          const iit = taxable * iitRate
                          const css = inc * cssRate
                          const total = iit + css
                          const net = inc - exp - total
                          const resultEl = document.getElementById('taxResult')
                          if (resultEl) {
                            resultEl.innerHTML = `
                              <div class="space-y-2 text-sm">
                                <div class="flex justify-between"><span>Ingreso Bruto:</span><strong>${formatCUP(inc)}</strong></div>
                                <div class="flex justify-between"><span>Gastos Deducibles:</span><strong>-${formatCUP(exp)}</strong></div>
                                <div class="flex justify-between"><span>Base Imponible:</span><strong>${formatCUP(taxable)}</strong></div>
                                <hr class="my-2">
                                <div class="flex justify-between"><span>Impuesto sobre Ingresos (${(iitRate * 100).toFixed(0)}%):</span><strong class="text-red-600">${formatCUP(iit)}</strong></div>
                                <div class="flex justify-between"><span>Seguridad Social (25%):</span><strong class="text-red-600">${formatCUP(css)}</strong></div>
                                <hr class="my-2">
                                <div class="flex justify-between text-base"><span>Total Impuestos:</span><strong class="text-red-700">${formatCUP(total)}</strong></div>
                                <div class="flex justify-between text-base"><span>Ingreso Neto:</span><strong class="text-emerald-700">${formatCUP(net)}</strong></div>
                                <div class="flex justify-between text-xs text-gray-500"><span>Equivalente USD:</span><span>${(net / rate).toFixed(2)} USD (a ${rate} CUP/USD)</span></div>
                              </div>
                            `
                          }
                        }} className="w-full">
                          <Calculator className="h-4 w-4 mr-2" /> Calcular
                        </Button>
                      </div>
                    </div>
                    <div id="taxResult" className="bg-white rounded-lg p-4 border"></div>
                  </CardContent>
                </Card>

                {/* Tax Rates Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tabla de Impuestos Vigentes</CardTitle>
                    <CardDescription>Referencias de Gaceta Oficial incluidas</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="text-left p-3 font-medium text-gray-600">Impuesto</th>
                            <th className="text-center p-3 font-medium text-gray-600">Tasa</th>
                            <th className="text-center p-3 font-medium text-gray-600">Aplica</th>
                            <th className="text-left p-3 font-medium text-gray-600 hidden md:table-cell">Referencia Legal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {taxRates.map(tr => (
                            <tr key={tr.id} className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                <p className="font-medium text-gray-900">{tr.name}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{tr.description.substring(0, 80)}...</p>
                              </td>
                              <td className="p-3 text-center">
                                <Badge variant={tr.rate > 0 ? 'default' : 'secondary'} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                  {tr.rate > 0 ? `${tr.rate}%` : `${formatCUP(tr.minValue || 0)} - ${formatCUP(tr.maxValue || 0)}`}
                                </Badge>
                              </td>
                              <td className="p-3 text-center">
                                <Badge variant="outline">{tr.category}</Badge>
                              </td>
                              <td className="p-3 text-xs text-gray-500 hidden md:table-cell max-w-[200px] truncate" title={tr.gacetaRef || ''}>
                                {tr.gacetaRef || 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Strategic Tips */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Target className="h-5 w-5 text-blue-600" /> Consejos Estratégicos Tributarios</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { title: "Maximice deducciones", desc: "Registre todos los gastos deducibles: materia prima, alquiler, servicios públicos, depreciación. Cada peso deducido reduce su base imponible." },
                      { title: "Cumpla con los plazos", desc: "Presente declaraciones antes del día 15 de cada mes. Los recargos por mora son del 10% sobre el monto adeudado más intereses." },
                      { title: "Contribuya a la Seguridad Social", desc: "El aporte del 25% como TCP genera derecho a jubilación y prestaciones de seguridad social. Es una inversión a futuro." },
                      { title: "Considere formalizarse como MiPYME", desc: "Si sus ingresos superan los 50,000 CUP anuales, la formalización como MiPYME puede ofrecer ventajas tributarias significativas." },
                    ].map((tip, i) => (
                      <div key={i} className="flex gap-3 p-3 bg-white rounded-lg">
                        <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{tip.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{tip.desc}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ═══ LIBROS CONTABLES ═══ */}
            {activeTab === 'books' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Libros Contables</h2>
                  <p className="text-gray-500">Libro Diario, Mayor y Balance de Comprobación</p>
                </div>

                <Tabs defaultValue="diario" className="w-full">
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="diario"><FileText className="h-4 w-4 mr-1" /> Diario</TabsTrigger>
                    <TabsTrigger value="mayor"><BookOpen className="h-4 w-4 mr-1" /> Mayor</TabsTrigger>
                    <TabsTrigger value="balance"><BarChart3 className="h-4 w-4 mr-1" /> Balance</TabsTrigger>
                  </TabsList>

                  {/* Libro Diario */}
                  <TabsContent value="diario">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Libro Diario</CardTitle>
                        <CardDescription>Registro cronológico de todas las transacciones</CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50 border-b">
                                <th className="text-left p-3 font-medium text-gray-600">Fecha</th>
                                <th className="text-left p-3 font-medium text-gray-600">Descripción</th>
                                <th className="text-left p-3 font-medium text-gray-600">Cuenta</th>
                                <th className="text-center p-3 font-medium text-gray-600">Debe</th>
                                <th className="text-center p-3 font-medium text-gray-600">Haber</th>
                              </tr>
                            </thead>
                            <tbody>
                              {transactions.map((tx, i) => (
                                <tr key={tx.id} className="border-b hover:bg-gray-50">
                                  <td className="p-3 text-gray-600">{formatDate(tx.date)}</td>
                                  <td className="p-3 font-medium text-gray-900">{tx.description}</td>
                                  <td className="p-3">
                                    <Badge variant="outline" className="text-xs">{tx.category}</Badge>
                                  </td>
                                  <td className="p-3 text-center">
                                    {tx.type === 'INGRESO' ? <span className="text-emerald-600 font-medium">{formatCUP(tx.amountCUP)}</span> : '-'}
                                  </td>
                                  <td className="p-3 text-center">
                                    {tx.type === 'GASTO' ? <span className="text-red-600 font-medium">{formatCUP(tx.amountCUP)}</span> : '-'}
                                  </td>
                                </tr>
                              ))}
                              {transactions.length === 0 && (
                                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Sin registros en el Libro Diario</td></tr>
                              )}
                              {transactions.length > 0 && (
                                <tr className="bg-emerald-50 font-semibold">
                                  <td colSpan={3} className="p-3">TOTALES</td>
                                  <td className="p-3 text-center text-emerald-700">{formatCUP(transactions.filter(t => t.type === 'INGRESO').reduce((s, t) => s + t.amountCUP, 0))}</td>
                                  <td className="p-3 text-center text-red-700">{formatCUP(transactions.filter(t => t.type === 'GASTO').reduce((s, t) => s + t.amountCUP, 0))}</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Libro Mayor */}
                  <TabsContent value="mayor">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Libro Mayor</CardTitle>
                        <CardDescription>Agrupación por cuentas contables</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {(() => {
                            const accounts: Record<string, { debit: number; credit: number; count: number }> = {}
                            transactions.forEach(tx => {
                              if (!accounts[tx.category]) accounts[tx.category] = { debit: 0, credit: 0, count: 0 }
                              if (tx.type === 'INGRESO') accounts[tx.category].debit += tx.amountCUP
                              else accounts[tx.category].credit += tx.amountCUP
                              accounts[tx.category].count++
                            })
                            const entries = Object.entries(accounts)
                            if (entries.length === 0) return <p className="text-center text-gray-400 py-12">Sin registros en el Libro Mayor</p>
                            return entries.map(([account, data]) => (
                              <div key={account} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">{account}</Badge>
                                    <span className="text-xs text-gray-400">{data.count} movimientos</span>
                                  </div>
                                  <span className={`text-sm font-bold ${data.debit - data.credit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    Saldo: {formatCUP(data.debit - data.credit)}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="bg-emerald-50 rounded p-3 text-center">
                                    <p className="text-xs text-emerald-600">Debe (Ingresos)</p>
                                    <p className="text-lg font-bold text-emerald-700">{formatCUP(data.debit)}</p>
                                  </div>
                                  <div className="bg-red-50 rounded p-3 text-center">
                                    <p className="text-xs text-red-600">Haber (Gastos)</p>
                                    <p className="text-lg font-bold text-red-700">{formatCUP(data.credit)}</p>
                                  </div>
                                </div>
                                <Progress value={(data.debit / (data.debit + data.credit) * 100) || 0} className="mt-2 h-2" />
                              </div>
                            ))
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Balance de Comprobación */}
                  <TabsContent value="balance">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Balance de Comprobación</CardTitle>
                        <CardDescription>Resumen de saldos por cuenta</CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50 border-b">
                                <th className="text-left p-3 font-medium text-gray-600">Cuenta</th>
                                <th className="text-center p-3 font-medium text-gray-600">Saldo Deudor</th>
                                <th className="text-center p-3 font-medium text-gray-600">Saldo Acreedor</th>
                                <th className="text-center p-3 font-medium text-gray-600">Equivalente USD</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const accounts: Record<string, { d: number; c: number }> = {}
                                transactions.forEach(tx => {
                                  if (!accounts[tx.category]) accounts[tx.category] = { d: 0, c: 0 }
                                  if (tx.type === 'INGRESO') accounts[tx.category].d += tx.amountCUP
                                  else accounts[tx.category].c += tx.amountCUP
                                })
                                const entries = Object.entries(accounts)
                                if (entries.length === 0) return <tr><td colSpan={4} className="text-center py-12 text-gray-400">Sin datos para el balance</td></tr>
                                let totalD = 0, totalC = 0
                                return entries.map(([account, data]) => {
                                  totalD += data.d; totalC += data.c
                                  return (
                                    <tr key={account} className="border-b hover:bg-gray-50">
                                      <td className="p-3 font-medium">{account}</td>
                                      <td className="p-3 text-center text-emerald-600">{data.d > 0 ? formatCUP(data.d) : '-'}</td>
                                      <td className="p-3 text-center text-red-600">{data.c > 0 ? formatCUP(data.c) : '-'}</td>
                                      <td className="p-3 text-center text-gray-500">{(Math.abs(data.d - data.c) / rate).toFixed(2)}</td>
                                    </tr>
                                  )
                                }).concat(
                                  <tr key="_total" className="bg-gray-50 font-bold">
                                    <td className="p-3">TOTAL</td>
                                    <td className="p-3 text-center text-emerald-700">{formatCUP(totalD)}</td>
                                    <td className="p-3 text-center text-red-700">{formatCUP(totalC)}</td>
                                    <td className="p-3 text-center">{(Math.abs(totalD - totalC) / rate).toFixed(2)}</td>
                                  </tr>
                                )
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* ═══ ALERTAS ═══ */}
            {activeTab === 'alerts' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Centro de Alertas</h2>
                    <p className="text-gray-500">Notificaciones, sugerencias y recordatorios tributarios</p>
                  </div>
                  <div className="flex gap-2">
                    {(dashboardData?.unreadAlerts || 0) > 0 && (
                      <Button variant="outline" size="sm" onClick={async () => {
                        for (const a of alerts.filter(al => !al.isRead)) {
                          await fetch('/api/alerts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: a.id, isRead: true }) })
                        }
                        loadAlerts(); loadDashboard()
                      }}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Marcar todas leídas
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={loadAlerts}><RefreshCw className="h-4 w-4 mr-1" /> Actualizar</Button>
                  </div>
                </div>

                {/* Alert Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Vencimientos', count: alerts.filter(a => a.type === 'TAX_DEADLINE').length, color: 'text-red-600 bg-red-50', icon: AlertTriangle },
                    { label: 'Ahorro Fiscal', count: alerts.filter(a => a.type === 'SAVING_OPPORTUNITY').length, color: 'text-emerald-600 bg-emerald-50', icon: Target },
                    { label: 'Sugerencias', count: alerts.filter(a => a.type === 'SUGGESTION').length, color: 'text-blue-600 bg-blue-50', icon: Lightbulb },
                    { label: 'Advertencias', count: alerts.filter(a => a.type === 'WARNING').length, color: 'text-amber-600 bg-amber-50', icon: Shield },
                  ].map((s, i) => (
                    <div key={i} className={`${s.color} rounded-xl p-4 text-center`}>
                      <s.icon className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-2xl font-bold">{s.count}</p>
                      <p className="text-xs font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Alert List */}
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <Card key={alert.id} className={`${alert.isRead ? 'opacity-60' : ''} transition-opacity`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {alert.severity === 'HIGH' || alert.severity === 'CRITICAL' ? <AlertTriangle className="h-5 w-5 text-red-500" /> :
                             alert.severity === 'MEDIUM' ? <Lightbulb className="h-5 w-5 text-amber-500" /> :
                             alert.type === 'SAVING_OPPORTUNITY' ? <Target className="h-5 w-5 text-emerald-500" /> :
                             <Info className="h-5 w-5 text-blue-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-semibold text-gray-900">{alert.title}</h4>
                              <SeverityBadge severity={alert.severity} />
                              {!alert.isRead && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Nueva</Badge>}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                            <p className="text-xs text-gray-400 mt-2">{new Date(alert.createdAt).toLocaleDateString('es-CU', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleToggleAlertRead(alert)}>
                            {alert.isRead ? <Eye className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ CONFIGURACIÓN ═══ */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Configuración</h2>
                  <p className="text-gray-500">Gestione sus negocios y preferencias</p>
                </div>

                {/* Business Management */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Mis Negocios</h3>
                  <Button size="sm" onClick={() => { setBizForm({ businessType: 'TCP', taxRegime: 'Simplificado' }); setShowBusinessForm(true) }}>
                    <Plus className="h-4 w-4 mr-1" /> Nuevo Negocio
                  </Button>
                </div>

                {businesses.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-8 text-center text-gray-400">
                      <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No hay negocios registrados</p>
                      <p className="text-sm mt-1">Agregue su primer negocio o actividad TCP para comenzar</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {businesses.map(biz => (
                      <Card key={biz.id} className={selectedBusiness === biz.id ? 'border-emerald-300 ring-2 ring-emerald-100' : ''}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{biz.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={biz.businessType === 'MIPYME' ? 'default' : 'secondary'}>{biz.businessType}</Badge>
                                  <span className="text-xs text-gray-400">{biz.activityType}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => { setBizForm(biz); setShowBusinessForm(true) }} className="p-1 text-gray-400 hover:text-blue-500"><Edit className="h-4 w-4" /></button>
                              <button onClick={() => handleDeleteBusiness(biz.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </div>
                          {biz.nif && <p className="text-xs text-gray-400 mt-2">NIF: {biz.nif}</p>}
                          {biz.address && <p className="text-xs text-gray-400">{biz.address}</p>}
                          <div className="mt-3 flex gap-2">
                            <Button size="sm" variant={selectedBusiness === biz.id ? 'default' : 'outline'} onClick={() => setSelectedBusiness(biz.id)}>
                              {selectedBusiness === biz.id ? <CheckCircle className="h-3 w-3 mr-1" /> : null}
                              {selectedBusiness === biz.id ? 'Activo' : 'Seleccionar'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Exchange Rate Management */}
                <Separator />
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Tasas de Cambio</h3>
                  <Button size="sm" onClick={() => setShowExchangeForm(true)}><Plus className="h-4 w-4 mr-1" /> Actualizar Tasa</Button>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="text-left p-3 font-medium text-gray-600">Fecha</th>
                            <th className="text-center p-3 font-medium text-gray-600">USD/CUP</th>
                            <th className="text-center p-3 font-medium text-gray-600">EUR/CUP</th>
                            <th className="text-center p-3 font-medium text-gray-600">MLC/CUP</th>
                            <th className="text-left p-3 font-medium text-gray-600">Fuente</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exchangeRates.slice(0, 10).map(er => (
                            <tr key={er.id} className="border-b hover:bg-gray-50">
                              <td className="p-3 text-gray-600">{formatDate(er.date)}</td>
                              <td className="p-3 text-center font-semibold">{er.rateUSD.toFixed(2)}</td>
                              <td className="p-3 text-center">{er.rateEUR?.toFixed(2) || '-'}</td>
                              <td className="p-3 text-center">{er.rateMLC?.toFixed(2) || '-'}</td>
                              <td className="p-3"><Badge variant="outline">{er.source}</Badge></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* About */}
                <Card className="bg-gray-50">
                  <CardContent className="p-6 text-center">
                    <CircleDollarSign className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
                    <h3 className="text-lg font-bold text-gray-900">CuentasPrecisión</h3>
                    <p className="text-sm text-gray-500 mt-1">Herramienta de contabilidad tributaria para MiPYMEs y Trabajadores por Cuenta Propia en Cuba.</p>
                    <p className="text-xs text-gray-400 mt-2">Tasas actualizadas según Gaceta Oficial &bull; Fuentes alternativas: El Toque, Atales</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 safe-area-bottom">
        <div className="flex justify-around py-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs ${activeTab === item.id ? 'text-emerald-600' : 'text-gray-400'}`}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.badge ? <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center">{item.badge > 9 ? '9+' : item.badge}</span> : null}
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ─── DIALOGS ─── */}

      {/* Business Form Dialog */}
      <Dialog open={showBusinessForm} onOpenChange={setShowBusinessForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{bizForm.id ? 'Editar Negocio' : 'Nuevo Negocio'}</DialogTitle>
            <DialogDescription>Registre su MiPYME o actividad como Trabajador por Cuenta Propia</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre del Negocio *</Label>
              <Input value={bizForm.name || ''} onChange={e => setBizForm({ ...bizForm, name: e.target.value })} placeholder="Ej: Restaurante El Morro" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Negocio *</Label>
                <Select value={bizForm.businessType} onValueChange={v => setBizForm({ ...bizForm, businessType: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TCP">TCP (Cuenta Propia)</SelectItem>
                    <SelectItem value="MIPYME">MiPYME</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Régimen Tributario *</Label>
                <Select value={bizForm.taxRegime} onValueChange={v => setBizForm({ ...bizForm, taxRegime: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Simplificado">Simplificado</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Actividad Económica *</Label>
              <Select value={bizForm.activityType} onValueChange={v => setBizForm({ ...bizForm, activityType: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                <SelectContent>
                  {(bizForm.businessType === 'MIPYME' ? MIPYME_ACTIVITIES : TCP_ACTIVITIES).map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>NIF (Número de Identificación Fiscal)</Label>
              <Input value={bizForm.nif || ''} onChange={e => setBizForm({ ...bizForm, nif: e.target.value })} placeholder="Opcional" className="mt-1" />
            </div>
            <div>
              <Label>Dirección</Label>
              <Input value={bizForm.address || ''} onChange={e => setBizForm({ ...bizForm, address: e.target.value })} placeholder="Calle, municipio, provincia" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Teléfono</Label>
                <Input value={bizForm.phone || ''} onChange={e => setBizForm({ ...bizForm, phone: e.target.value })} placeholder="+53 5 XXXXXXX" className="mt-1" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={bizForm.email || ''} onChange={e => setBizForm({ ...bizForm, email: e.target.value })} placeholder="correo@ejemplo.cu" className="mt-1" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => { setShowBusinessForm(false); setBizForm({}) }}>Cancelar</Button>
              <Button onClick={handleSaveBusiness}><Save className="h-4 w-4 mr-1" /> Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Form Dialog */}
      <Dialog open={showTransactionForm} onOpenChange={setShowTransactionForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Movimiento</DialogTitle>
            <DialogDescription>Registre un ingreso o gasto para su contabilidad</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo *</Label>
                <Select value={txForm.type} onValueChange={v => setTxForm({ ...txForm, type: v, category: '' })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INGRESO">Ingreso</SelectItem>
                    <SelectItem value="GASTO">Gasto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fecha *</Label>
                <Input type="date" value={txForm.dateStr} onChange={e => setTxForm({ ...txForm, dateStr: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Descripción *</Label>
              <Input value={txForm.description || ''} onChange={e => setTxForm({ ...txForm, description: e.target.value })} placeholder="Ej: Venta de almuerzos, Compra de materia prima" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoría *</Label>
                <Select value={txForm.category} onValueChange={v => setTxForm({ ...txForm, category: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                  <SelectContent>
                    {(txForm.type === 'INGRESO' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Monto (CUP) *</Label>
                <Input type="number" value={txForm.amountCUP || ''} onChange={e => setTxForm({ ...txForm, amountCUP: Number(e.target.value) })} placeholder="0.00" className="mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">
                Equivalente USD: <strong>{txForm.amountCUP ? (txForm.amountCUP / rate).toFixed(2) : '0.00'} USD</strong> (tasa: {rate} CUP/USD)
              </span>
            </div>
            <div>
              <Label>N. Referencia</Label>
              <Input value={txForm.referenceNumber || ''} onChange={e => setTxForm({ ...txForm, referenceNumber: e.target.value })} placeholder="No. de factura o recibo" className="mt-1" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={txForm.taxDeductible} onCheckedChange={v => setTxForm({ ...txForm, taxDeductible: v })} />
              <Label className="text-sm">Marcar como gasto deducible de impuestos</Label>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea value={txForm.notes || ''} onChange={e => setTxForm({ ...txForm, notes: e.target.value })} placeholder="Observaciones adicionales..." className="mt-1" rows={2} />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => { setShowTransactionForm(false); setTxForm({ type: 'INGRESO', category: '', amountCUP: 0, taxDeductible: false, dateStr: new Date().toISOString().split('T')[0] }) }}>Cancelar</Button>
              <Button onClick={handleSaveTransaction}><Save className="h-4 w-4 mr-1" /> Registrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exchange Rate Dialog */}
      <Dialog open={showExchangeForm} onOpenChange={setShowExchangeForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Actualizar Tasa de Cambio</DialogTitle>
            <DialogDescription>Registre la tasa actual desde fuentes alternativas</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fuente</Label>
                <Select value={exForm.source} onValueChange={v => setExForm({ ...exForm, source: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="El Toque">El Toque</SelectItem>
                    <SelectItem value="Atales">Atales</SelectItem>
                    <SelectItem value="Manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={(exForm as any).dateStr || ''} onChange={e => setExForm({ ...exForm, dateStr: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>1 USD = CUP</Label>
                <Input type="number" value={exForm.rateUSD || ''} onChange={e => setExForm({ ...exForm, rateUSD: Number(e.target.value) })} className="mt-1" />
              </div>
              <div>
                <Label>1 EUR = CUP</Label>
                <Input type="number" value={exForm.rateEUR || ''} onChange={e => setExForm({ ...exForm, rateEUR: Number(e.target.value) })} className="mt-1" />
              </div>
              <div>
                <Label>1 MLC = CUP</Label>
                <Input type="number" value={exForm.rateMLC || ''} onChange={e => setExForm({ ...exForm, rateMLC: Number(e.target.value) })} className="mt-1" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowExchangeForm(false)}>Cancelar</Button>
              <Button onClick={handleSaveExchangeRate}><Save className="h-4 w-4 mr-1" /> Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

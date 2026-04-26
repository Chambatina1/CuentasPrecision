// ─── Types ───────────────────────────────────────────────────────────
export interface Business {
  id?: string
  name: string
  businessType: string
  activityType: string
  taxRegime: string
  nif?: string
  address?: string
  phone?: string
  email?: string
  currency?: string
  createdAt?: string
  updatedAt?: string
}

export interface Transaction {
  id?: string
  businessId: string
  type: string
  category: string
  subcategory?: string
  description: string
  amountCUP: number
  amountUSD?: number
  exchangeRate?: number
  date: string
  referenceNumber?: string
  taxDeductible: boolean
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface TaxRate {
  id?: string
  name: string
  code: string
  description: string
  rate: number
  minValue?: number
  maxValue?: number
  effectiveFrom: string
  effectiveTo?: string
  gacetaRef?: string
  category?: string
  createdAt?: string
}

export interface ExchangeRate {
  id?: string
  source: string
  rateUSD: number
  rateEUR?: number
  rateMLC?: number
  date: string
  createdAt?: string
}

export interface AlertItem {
  id?: string
  type: string
  title: string
  message: string
  severity: string
  isRead: boolean
  createdAt?: string
}

export interface User {
  id?: string
  username: string
  name: string
  password: string
  role: string
  isActive: boolean
  createdAt?: string
}

// ─── Lazy Database (NO top-level Dexie import) ──────────────────────
let _db: any = null

async function getDBInternal() {
  if (_db) return _db
  const Dexie = (await import('dexie')).default

  class CuentasDB extends Dexie {
    businesses!: any
    transactions!: any
    taxRates!: any
    exchangeRates!: any
    alerts!: any
    users!: any

    constructor() {
      super('CuentasPrecisionDB')
      this.version(1).stores({
        businesses: '++id, name, businessType, activityType, createdAt',
        transactions: '++id, businessId, type, category, date, createdAt',
        taxRates: '++id, code, category',
        exchangeRates: '++id, source, date, createdAt',
        alerts: '++id, type, severity, isRead, createdAt',
        users: '++id, username, role, isActive'
      })
    }
  }

  _db = new CuentasDB()
  return _db
}

export async function getDB() {
  if (typeof window === 'undefined') throw new Error('Not available on server')
  return getDBInternal()
}

// ─── ID Generator ────────────────────────────────────────────────────
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

// ─── Simple Hash ─────────────────────────────────────────────────────
export async function simpleHash(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str + '_cuentas_precision_salt_2025')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// ─── Seed Data ───────────────────────────────────────────────────────
const CUBAN_TAX_RATES = [
  { name: "Impuesto sobre Ingresos Personales (TCP)", code: "IIT_TCP", description: "Aplicable a Trabajadores por Cuenta Propia. Tramo base hasta 50,000 CUP anuales.", rate: 15, minValue: 0, maxValue: 50000, effectiveFrom: "2022-01-01", gacetaRef: "Gaceta Oficial No. 87 Extraordinaria de 25 de noviembre de 2022", category: "TCP" },
  { name: "Impuesto sobre Ingresos (TCP) - Tramo Superior", code: "IIT_TCP_HIGH", description: "Para ingresos superiores a 50,000 CUP anuales como TCP.", rate: 20, minValue: 50000, maxValue: 100000, effectiveFrom: "2022-01-01", gacetaRef: "Gaceta Oficial No. 87 Extraordinaria de 25 de noviembre de 2022", category: "TCP" },
  { name: "Contribución a la Seguridad Social (TCP)", code: "CSS_TCP", description: "Aporte del 25% sobre ingresos brutos mensuales para TCP.", rate: 25, minValue: 0, effectiveFrom: "2023-01-01", gacetaRef: "Decreto-Ley 334/2022", category: "TCP" },
  { name: "Impuesto por Utilización de Fuerza de Trabajo", code: "IUFT", description: "Aplicable a contratistas con trabajadores asalariados.", rate: 5, minValue: 0, effectiveFrom: "2021-01-01", gacetaRef: "Resolución 52/2021", category: "TCP" },
  { name: "Impuesto sobre Ingresos (MiPYME)", code: "II_MIPYME", description: "Impuesto sobre ingresos para MiPYMEs según Decreto-Ley 345/2023.", rate: 30, minValue: 0, maxValue: 500000, effectiveFrom: "2023-01-01", gacetaRef: "Gaceta Oficial Extraordinaria No. 22 de 16 de marzo de 2023", category: "MIPYME" },
  { name: "Contribución a la Seguridad Social (MiPYME)", code: "CSS_MIPYME", description: "Aporte patronal del 16.5% sobre nómina bruta mensual.", rate: 16.5, minValue: 0, effectiveFrom: "2023-01-01", gacetaRef: "Decreto-Ley 334/2022", category: "MIPYME" },
  { name: "Impuesto sobre los Servicios (ITSS)", code: "ITSS", description: "Impuesto sobre la prestación de servicios. Tasa general del 11%.", rate: 11, minValue: 0, effectiveFrom: "2023-01-01", gacetaRef: "Resolución 92/2023", category: "GENERAL" },
  { name: "Impuesto a la Circulación de Vehículos", code: "ICV", description: "Impuesto anual por circulación de vehículos de motor.", rate: 0, minValue: 100, maxValue: 5000, effectiveFrom: "2023-01-01", gacetaRef: "Resolución 356/2018", category: "GENERAL" },
  { name: "Impuesto sobre Transmisiones Patrimoniales", code: "ITP", description: "Aplicable a la compraventa de bienes inmuebles y vehículos. 4% del valor.", rate: 4, minValue: 0, effectiveFrom: "2019-01-01", gacetaRef: "Decreto-Ley 308/2013", category: "GENERAL" },
  { name: "Tasa por Licencia de Actividad (TCP)", code: "TSA_TCP", description: "Tasa anual por el ejercicio de actividad como TCP.", rate: 0, minValue: 500, maxValue: 3000, effectiveFrom: "2022-01-01", gacetaRef: "Resolución 198/2022", category: "TCP" },
  { name: "Impuesto sobre Utilidades (MiPYME)", code: "IU_MIPYME", description: "Sobre utilidades netas de MiPYMEs. Escala progresiva.", rate: 35, minValue: 0, effectiveFrom: "2023-01-01", gacetaRef: "Decreto-Ley 345/2023", category: "MIPYME" }
]

const SEED_EXCHANGE_RATES = [
  { source: "El Toque", rateUSD: 340, rateEUR: 370, rateMLC: 340, date: "2025-01-15" },
  { source: "El Toque", rateUSD: 350, rateEUR: 380, rateMLC: 350, date: "2025-02-15" },
  { source: "Atales", rateUSD: 355, rateEUR: 385, rateMLC: 355, date: "2025-03-15" },
  { source: "El Toque", rateUSD: 365, rateEUR: 395, rateMLC: 365, date: "2025-04-10" },
  { source: "Atales", rateUSD: 370, rateEUR: 400, rateMLC: 370, date: "2025-04-20" },
]

const SEED_ALERTS = [
  { type: "INFO", title: "Bienvenido a CuentasPrecisión", message: "Configure su negocio para comenzar a llevar sus libros contables. Registre su MiPYME o actividad como TCP para recibir asesoría tributaria personalizada.", severity: "INFO", isRead: false },
  { type: "TAX_DEADLINE", title: "Vencimiento de declaración fiscal", message: "Las declaraciones fiscales mensuales deben presentarse antes del día 15 de cada mes. Mantenga sus registros actualizados para evitar recargos del 10% por tardanza.", severity: "HIGH", isRead: false },
  { type: "SAVING_OPPORTUNITY", title: "Maximice sus deducciones", message: "Los gastos de materia prima, alquileres, servicios públicos y depreciación de equipos son deducibles del impuesto sobre ingresos. Registre correctamente cada gasto para maximizar su beneficio fiscal.", severity: "MEDIUM", isRead: false },
  { type: "SUGGESTION", title: "Separe sus cuentas personales y de negocio", message: "Mantenga una cuenta bancaria separada para su actividad económica. Esto facilita el control contable.", severity: "LOW", isRead: false },
  { type: "WARNING", title: "Actualización normativa tributaria", message: "Se han publicado nuevas regulaciones en Gaceta Oficial. Verifique las tasas vigentes en el módulo de Impuestos.", severity: "MEDIUM", isRead: false },
  { type: "TAX_DEADLINE", title: "Contribución a la Seguridad Social", message: "El vencimiento del aporte a la Seguridad Social es el día 10 de cada mes para TCP (25% de ingresos brutos).", severity: "HIGH", isRead: false },
  { type: "SUGGESTION", title: "Optimice su régimen tributario", message: "Si sus ingresos anuales superan los 50,000 CUP, considere la formalización como MiPYME.", severity: "MEDIUM", isRead: false }
]

export async function seedDatabase() {
  const database = await getDB()
  const taxCount = await database.taxRates.count()
  if (taxCount === 0) await database.taxRates.bulkAdd(CUBAN_TAX_RATES)
  const exCount = await database.exchangeRates.count()
  if (exCount === 0) await database.exchangeRates.bulkAdd(SEED_EXCHANGE_RATES)
  const alertCount = await database.alerts.count()
  if (alertCount === 0) await database.alerts.bulkAdd(SEED_ALERTS)
  const userCount = await database.users.count()
  if (userCount === 0) {
    const adminHash = await simpleHash('admin123')
    await database.users.add({ username: 'admin', name: 'Administrador', password: adminHash, role: 'admin', isActive: true, createdAt: new Date().toISOString() })
  }
}

export async function exportAllData() {
  const database = await getDB()
  const [businesses, transactions, taxRates, exchangeRates, alerts] = await Promise.all([
    database.businesses.toArray(), database.transactions.toArray(), database.taxRates.toArray(),
    database.exchangeRates.toArray(), database.alerts.toArray(),
  ])
  return { exportDate: new Date().toISOString(), version: '1.0', app: 'CuentasPrecisión', data: { businesses, transactions, taxRates, exchangeRates, alerts } }
}

export async function importAllData(jsonData: any) {
  const database = await getDB()
  await database.transaction('rw', database.businesses, database.transactions, database.taxRates, database.exchangeRates, database.alerts, async () => {
    if (jsonData.data?.businesses) { await database.businesses.clear(); await database.businesses.bulkAdd(jsonData.data.businesses) }
    if (jsonData.data?.transactions) { await database.transactions.clear(); await database.transactions.bulkAdd(jsonData.data.transactions) }
    if (jsonData.data?.taxRates) { await database.taxRates.clear(); await database.taxRates.bulkAdd(jsonData.data.taxRates) }
    if (jsonData.data?.exchangeRates) { await database.exchangeRates.clear(); await database.exchangeRates.bulkAdd(jsonData.data.exchangeRates) }
    if (jsonData.data?.alerts) { await database.alerts.clear(); await database.alerts.bulkAdd(jsonData.data.alerts) }
  })
}

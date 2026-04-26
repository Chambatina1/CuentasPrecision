import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    const where: Record<string, unknown> = {}
    if (businessId) where.businessId = businessId

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    const allTransactions = await db.transaction.findMany({ where })
    const monthlyTransactions = await db.transaction.findMany({
      where: { ...where, date: { gte: startOfMonth } }
    })
    const yearlyTransactions = await db.transaction.findMany({
      where: { ...where, date: { gte: startOfYear } }
    })

    const calculateTotals = (transactions: { type: string; amountCUP: number; taxDeductible: boolean }[]) => {
      const income = transactions.filter(t => t.type === 'INGRESO').reduce((s, t) => s + t.amountCUP, 0)
      const expenses = transactions.filter(t => t.type === 'GASTO').reduce((s, t) => s + t.amountCUP, 0)
      const taxDeductible = transactions.filter(t => t.type === 'GASTO' && t.taxDeductible).reduce((s, t) => s + t.amountCUP, 0)
      return { income, expenses, net: income - expenses, taxDeductible }
    }

    const exchangeRates = await db.exchangeRate.findMany({
      orderBy: { date: 'desc' },
      take: 1
    })

    const unreadAlerts = await db.alert.count({ where: { isRead: false } })
    const pendingTaxes = await db.taxDeclaration.count({
      where: { ...where, status: 'PENDIENTE' }
    })

    const expenseCategories: Record<string, number> = {}
    monthlyTransactions
      .filter(t => t.type === 'GASTO')
      .forEach(t => {
        expenseCategories[t.category] = (expenseCategories[t.category] || 0) + t.amountCUP
      })

    const monthlyTrend: { month: string; income: number; expenses: number; net: number; taxDeductible: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      const monthTx = allTransactions.filter(t => {
        const d = new Date(t.date)
        return d >= monthStart && d <= monthEnd
      })
      const totals = calculateTotals(monthTx)
      monthlyTrend.push({
        month: monthStart.toLocaleString('es-CU', { month: 'short' }),
        ...totals
      })
    }

    const recentTransactions = await db.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 10
    })

    const businesses = await db.business.findMany()

    return NextResponse.json({
      summary: {
        allTime: calculateTotals(allTransactions),
        monthly: calculateTotals(monthlyTransactions),
        yearly: calculateTotals(yearlyTransactions),
      },
      exchangeRate: exchangeRates[0] || { rateUSD: 350, source: "Referencia", date: new Date() },
      unreadAlerts,
      pendingTaxes,
      expenseCategories,
      monthlyTrend,
      recentTransactions,
      totalTransactions: allTransactions.length,
      totalBusinesses: businesses.length,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener dashboard' }, { status: 500 })
  }
}

import { db } from '@/lib/db'
import { NextResponse, NextRequest } from 'next/server'

export async function GET() {
  try {
    const rates = await db.exchangeRate.findMany({
      orderBy: { date: 'desc' },
      take: 30
    })
    return NextResponse.json(rates)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener tasas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const rate = await db.exchangeRate.create({
      data: {
        source: data.source || "Manual",
        rateUSD: data.rateUSD,
        rateEUR: data.rateEUR,
        rateMLC: data.rateMLC,
        date: data.date ? new Date(data.date) : new Date()
      }
    })
    return NextResponse.json(rate, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al registrar tasa' }, { status: 500 })
  }
}

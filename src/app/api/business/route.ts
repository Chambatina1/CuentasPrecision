import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const businesses = await db.business.findMany({
      orderBy: { createdAt: 'desc' },
      include: { transactions: { orderBy: { date: 'desc' }, take: 5 } }
    })
    return NextResponse.json(businesses)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener negocios' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const business = await db.business.create({ data })
    return NextResponse.json(business, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear negocio' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const business = await db.business.update({
      where: { id: data.id },
      data
    })
    return NextResponse.json(business)
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar negocio' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    await db.transaction.deleteMany({ where: { businessId: id } })
    await db.taxDeclaration.deleteMany({ where: { businessId: id } })
    await db.business.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar negocio' }, { status: 500 })
  }
}

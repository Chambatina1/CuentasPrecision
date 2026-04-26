import { db } from '@/lib/db'
import { NextResponse, NextRequest } from 'next/server'

export async function GET() {
  try {
    const alerts = await db.alert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    return NextResponse.json(alerts)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener alertas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const alert = await db.alert.create({ data })
    return NextResponse.json(alert, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear alerta' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const alert = await db.alert.update({
      where: { id: data.id },
      data: { isRead: data.isRead }
    })
    return NextResponse.json(alert)
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar alerta' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    await db.alert.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar alerta' }, { status: 500 })
  }
}

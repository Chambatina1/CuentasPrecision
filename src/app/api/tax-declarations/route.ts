import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const businessId = searchParams.get('businessId')

  const where: Record<string, unknown> = {}
  if (businessId) where.businessId = businessId

  const declarations = await db.taxDeclaration.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(declarations)
}

export async function POST(request: NextRequest) {
  const data = await request.json()
  const declaration = await db.taxDeclaration.create({ data })
  return NextResponse.json(declaration, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const data = await request.json()
  const { id, ...updateData } = data
  const declaration = await db.taxDeclaration.update({
    where: { id },
    data: updateData
  })
  return NextResponse.json(declaration)
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  await db.taxDeclaration.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

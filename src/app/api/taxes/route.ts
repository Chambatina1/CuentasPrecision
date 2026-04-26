import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const CUBAN_TAX_RATES = [
  {
    name: "Impuesto sobre Ingresos Personales (TCP)",
    code: "IIT_TCP",
    description: "Aplicable a Trabajadores por Cuenta Propia. Tramo base hasta 50,000 CUP anuales.",
    rate: 15,
    minValue: 0,
    maxValue: 50000,
    effectiveFrom: new Date("2022-01-01"),
    gacetaRef: "Gaceta Oficial No. 87 Extraordinaria de 25 de noviembre de 2022",
    category: "TCP"
  },
  {
    name: "Impuesto sobre Ingresos (TCP) - Tramo Superior",
    code: "IIT_TCP_HIGH",
    description: "Para ingresos superiores a 50,000 CUP anuales como TCP.",
    rate: 20,
    minValue: 50000,
    maxValue: 100000,
    effectiveFrom: new Date("2022-01-01"),
    gacetaRef: "Gaceta Oficial No. 87 Extraordinaria de 25 de noviembre de 2022",
    category: "TCP"
  },
  {
    name: "Contribución a la Seguridad Social (TCP)",
    code: "CSS_TCP",
    description: "Aporte del 25% sobre ingresos brutos mensuales para trabajadores por cuenta propia.",
    rate: 25,
    minValue: 0,
    effectiveFrom: new Date("2023-01-01"),
    gacetaRef: "Decreto-Ley 334/2022",
    category: "TCP"
  },
  {
    name: "Impuesto por la Utilización de la Fuerza de Trabajo",
    code: "IUFT",
    description: "Aplicable a contratistas con trabajadores asalariados. Varía según actividad y provincia.",
    rate: 5,
    minValue: 0,
    effectiveFrom: new Date("2021-01-01"),
    gacetaRef: "Resolución 52/2021",
    category: "TCP"
  },
  {
    name: "Impuesto sobre Ingresos (MiPYME)",
    code: "II_MIPYME",
    description: "Impuesto sobre ingresos para MiPYMEs según Decreto-Ley 345/2023.",
    rate: 30,
    minValue: 0,
    maxValue: 500000,
    effectiveFrom: new Date("2023-01-01"),
    gacetaRef: "Gaceta Oficial Extraordinaria No. 22 de 16 de marzo de 2023",
    category: "MIPYME"
  },
  {
    name: "Contribución a la Seguridad Social (MiPYME)",
    code: "CSS_MIPYME",
    description: "Aporte patronal del 16.5% sobre nómina bruta mensual.",
    rate: 16.5,
    minValue: 0,
    effectiveFrom: new Date("2023-01-01"),
    gacetaRef: "Decreto-Ley 334/2022",
    category: "MIPYME"
  },
  {
    name: "Impuesto sobre los Servicios (ITSS)",
    code: "ITSS",
    description: "Impuesto sobre la prestación de servicios. Tasa general del 11%.",
    rate: 11,
    minValue: 0,
    effectiveFrom: new Date("2023-01-01"),
    gacetaRef: "Resolución 92/2023 del MINSAP",
    category: "GENERAL"
  },
  {
    name: "Impuesto a la Circulación de Vehículos",
    code: "ICV",
    description: "Impuesto anual por circulación de vehículos de motor. Monto fijo según tipo.",
    rate: 0,
    minValue: 100,
    maxValue: 5000,
    effectiveFrom: new Date("2023-01-01"),
    gacetaRef: "Resolución 356/2018",
    category: "GENERAL"
  },
  {
    name: "Impuesto sobre Transmisiones Patrimoniales",
    code: "ITP",
    description: "Aplicable a la compraventa de bienes inmuebles y vehículos. 4% del valor.",
    rate: 4,
    minValue: 0,
    effectiveFrom: new Date("2019-01-01"),
    gacetaRef: "Decreto-Ley 308/2013",
    category: "GENERAL"
  },
  {
    name: "Tasa por Licencia de Actividad (TCP)",
    code: "TSA_TCP",
    description: "Tasa anual por el ejercicio de actividad como TCP.",
    rate: 0,
    minValue: 500,
    maxValue: 3000,
    effectiveFrom: new Date("2022-01-01"),
    gacetaRef: "Resolución 198/2022",
    category: "TCP"
  },
  {
    name: "Impuesto sobre Utilidades (MiPYME)",
    code: "IU_MIPYME",
    description: "Aplicable sobre las utilidades netas de MiPYMEs. Escala progresiva.",
    rate: 35,
    minValue: 0,
    effectiveFrom: new Date("2023-01-01"),
    gacetaRef: "Decreto-Ley 345/2023",
    category: "MIPYME"
  }
]

export async function GET() {
  try {
    let taxRates = await db.taxRate.findMany({ orderBy: { createdAt: 'desc' } })
    if (taxRates.length === 0) {
      for (const rate of CUBAN_TAX_RATES) {
        await db.taxRate.create({ data: rate })
      }
      taxRates = await db.taxRate.findMany({ orderBy: { createdAt: 'desc' } })
    }
    return NextResponse.json(taxRates)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener tasas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const taxRate = await db.taxRate.create({ data })
    return NextResponse.json(taxRate, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear tasa' }, { status: 500 })
  }
}

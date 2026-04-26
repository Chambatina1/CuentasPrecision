import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const existingRates = await db.exchangeRate.findMany()
    if (existingRates.length === 0) {
      await db.exchangeRate.createMany({
        data: [
          { source: "El Toque", rateUSD: 340, rateEUR: 370, rateMLC: 340, date: new Date("2025-01-15") },
          { source: "El Toque", rateUSD: 350, rateEUR: 380, rateMLC: 350, date: new Date("2025-02-15") },
          { source: "Atales", rateUSD: 355, rateEUR: 385, rateMLC: 355, date: new Date("2025-03-15") },
          { source: "El Toque", rateUSD: 365, rateEUR: 395, rateMLC: 365, date: new Date("2025-04-10") },
          { source: "Atales", rateUSD: 370, rateEUR: 400, rateMLC: 370, date: new Date("2025-04-20") },
        ]
      })
    }

    const existingAlerts = await db.alert.findMany()
    if (existingAlerts.length === 0) {
      await db.alert.createMany({
        data: [
          {
            type: "INFO",
            title: "Bienvenido a CuentasPrecisión",
            message: "Configure su negocio para comenzar a llevar sus libros contables. Registre su MiPYME o actividad como TCP para recibir asesoría tributaria personalizada.",
            severity: "INFO"
          },
          {
            type: "TAX_DEADLINE",
            title: "Vencimiento de declaración fiscal",
            message: "Las declaraciones fiscales mensuales deben presentarse antes del día 15 de cada mes. Mantenga sus registros actualizados para evitar recargos del 10% por tardanza.",
            severity: "HIGH"
          },
          {
            type: "SAVING_OPPORTUNITY",
            title: "Maximice sus deducciones",
            message: "Los gastos de materia prima, alquileres, servicios públicos y depreciación de equipos son deducibles del impuesto sobre ingresos. Registre correctamente cada gasto para maximizar su beneficio fiscal.",
            severity: "MEDIUM"
          },
          {
            type: "SUGGESTION",
            title: "Separe sus cuentas personales y de negocio",
            message: "Mantenga una cuenta bancaria separada para su actividad económica. Esto facilita el control contable, la presentación de declaraciones ante la ONAT y demuestra seriedad ante posibles auditorías.",
            severity: "LOW"
          },
          {
            type: "WARNING",
            title: "Actualización normativa tributaria",
            message: "Se han publicado nuevas regulaciones en Gaceta Oficial. Verifique las tasas vigentes en el módulo de Impuestos para asegurar cumplimiento total de las obligaciones fiscales vigentes en Cuba.",
            severity: "MEDIUM"
          },
          {
            type: "TAX_DEADLINE",
            title: "Contribución a la Seguridad Social",
            message: "El vencimiento del aporte a la Seguridad Social es el día 10 de cada mes para TCP (25% de ingresos brutos). El pago extemporáneo genera intereses moratorios.",
            severity: "HIGH"
          },
          {
            type: "SUGGESTION",
            title: "Optimice su régimen tributario",
            message: "Si sus ingresos anuales superan los 50,000 CUP, considere opciones de planificación fiscal como la formalización como MiPYME para acceder a tasas diferenciadas y beneficios adicionales.",
            severity: "MEDIUM"
          }
        ]
      })
    }

    return NextResponse.json({ success: true, message: "Datos iniciales cargados correctamente" })
  } catch (error) {
    return NextResponse.json({ error: 'Error al cargar datos iniciales' }, { status: 500 })
  }
}

const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  PageBreak, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  TableOfContents, LevelFormat,
} = require("docx");

// ─── Palette: DM-1 Deep Cyan (Tech) ────────────────────────────────
const P = {
  bg: "162235", primary: "FFFFFF", accent: "37DCF2",
  cover: { titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "90989F", footerColor: "687078" },
  body: "1A2B40", secondary: "6878A0", accentDark: "1B6B7A",
  surface: "F0F4F8", tableBg: "EDF3F5",
};
const c = (hex) => hex.replace("#", "");

// ─── Borders ───────────────────────────────────────────────────────
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "D0D8DE" };

// ─── Helper: calcTitleLayout ───────────────────────────────────────
function calcTitleLayout(title, maxWidthTwips, preferredPt = 40, minPt = 24) {
  const charWidth = (pt) => pt * 10;
  const charsPerLine = (pt) => Math.floor(maxWidthTwips / charWidth(pt));
  let titlePt = preferredPt;
  let lines;
  while (titlePt >= minPt) {
    const cpl = charsPerLine(titlePt);
    if (cpl < 2) { titlePt -= 2; continue; }
    lines = splitTitleLines(title, cpl);
    if (lines.length <= 3) break;
    titlePt -= 2;
  }
  if (!lines || lines.length > 3) {
    const cpl = charsPerLine(minPt);
    lines = splitTitleLines(title, cpl);
    titlePt = minPt;
  }
  return { titlePt, titleLines: lines };
}

function splitTitleLines(title, charsPerLine) {
  if (title.length <= charsPerLine) return [title];
  const breakAfter = new Set([' ', '-', '/', ':', '.', ',', ';']);
  const lines = [];
  let remaining = title;
  while (remaining.length > charsPerLine) {
    let breakAt = -1;
    for (let i = charsPerLine; i >= Math.floor(charsPerLine * 0.6); i--) {
      if (i < remaining.length && breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
    }
    if (breakAt === -1) {
      for (let i = charsPerLine + 1; i <= Math.min(remaining.length, Math.ceil(charsPerLine * 1.3)); i++) {
        if (breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
      }
    }
    if (breakAt === -1) breakAt = charsPerLine;
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  if (remaining) lines.push(remaining);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop();
    lines[lines.length - 1] += last;
  }
  return lines;
}

// ─── Helpers ───────────────────────────────────────────────────────
function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, color: c("0A1628") })],
  });
}
function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, size: 28, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, color: c("0A1628") })],
  });
}
function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 24, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, color: c(P.accentDark) })],
  });
}
function body(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { after: 120, line: 312 },
    children: [new TextRun({ text, size: 24, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, color: c(P.body) })],
  });
}
function bodyNoIndent(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 120, line: 312 },
    children: [new TextRun({ text, size: 24, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, color: c(P.body) })],
  });
}

function tableCell(text, opts = {}) {
  return new TableCell({
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      children: [new TextRun({ text, size: 21, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, color: opts.headerText ? c("FFFFFF") : c(P.body), bold: opts.bold || false })],
    })],
    shading: opts.shading ? { type: ShadingType.CLEAR, fill: opts.shading } : undefined,
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    width: { size: opts.width || 50, type: WidthType.PERCENTAGE },
  });
}

// ─── Cover (R1 Pure Paragraph Left) ────────────────────────────────
const coverTitle = "CuentasPrecision";
const coverSubtitle = "Informe Tecnico del Proyecto y Plan de Mejoras";
const coverMeta = ["Aplicacion Web de Contabilidad Tributaria para Cuba", "GitHub: Chambatina1/CuentasPrecision", "Desplegado en Vercel", "Fecha: Abril 2026"];
const coverWidth = 11906 - 0 - 0;
const { titlePt, titleLines } = calcTitleLayout(coverTitle, coverWidth - 2400, 40, 24);

function buildCover() {
  const children = [
    // Top spacing
    new Paragraph({ spacing: { before: 5000 }, children: [] }),
    // Title lines
    ...titleLines.map(line => new Paragraph({
      spacing: { after: 80, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: line, font: { ascii: "Calibri" }, size: titlePt * 2, bold: true, color: c(P.cover.titleColor) })],
    })),
    // Accent line
    new Paragraph({
      indent: { left: 0 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: c(P.accent), space: 12 } },
      spacing: { before: 300, after: 300 },
      children: [],
    }),
    // Subtitle
    new Paragraph({
      spacing: { after: 400 },
      children: [new TextRun({ text: coverSubtitle, font: { ascii: "Calibri" }, size: 28, color: c(P.cover.subtitleColor) })],
    }),
    // Meta lines
    ...coverMeta.map(line => new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: line, font: { ascii: "Calibri" }, size: 22, color: c(P.cover.metaColor) })],
    })),
  ];
  return new Table({
    borders: allNoBorders,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        width: { size: 100, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: c(P.bg) },
        verticalAlign: "top",
        borders: allNoBorders,
        children: [
          new Paragraph({ spacing: { before: 0 }, children: [] }),
          ...children,
        ],
      })],
    })],
  });
}

// ─── Body Content ──────────────────────────────────────────────────
const bodyContent = [
  // ═══ RESUMEN EJECUTIVO ═══
  heading1("1. Resumen Ejecutivo"),
  body("CuentasPrecision es una aplicacion web progresiva disenada especificamente para satisfacer las necesidades contables y tributarias de las Micro, Pequenas y Medianas Empresas (MiPYME) y los Trabajadores por Cuenta Propia (TCP) en Cuba. La aplicacion fue desarrollada utilizando Next.js 16 con TypeScript, TailwindCSS para la interfaz de usuario, shadcn/ui como sistema de componentes, Recharts para la visualizacion de datos, y Dexie.js para el almacenamiento local mediante IndexedDB."),
  body("El proyecto nace con la premisa fundamental de que los datos financieros y contables de cada negocio deben residir exclusivamente en el dispositivo del usuario, eliminando la dependencia de servidores externos y bases de datos centralizadas. Este enfoque garantiza la privacidad total de la informacion, la disponibilidad offline del sistema, y el cumplimiento con las regulaciones de proteccion de datos vigentes en el contexto cubano."),
  body("La aplicacion se encuentra actualmente desplegada en produccion en Vercel, accesible a traves de Internet, y funcional en dispositivos de escritorio y moviles. Incluye un sistema de autenticacion local con roles de administrador y usuario, un modulo completo de gestion de negocios, registro de ingresos y gastos, calculadora de impuestos basada en la legislacion de la Gaceta Oficial, convertidor de divisas CUP/USD, sistema de alertas tributarias, y capacidad de exportar e importar datos en formato JSON."),

  // ═══ ESTADO ACTUAL ═══
  heading1("2. Estado Actual del Proyecto"),
  heading2("2.1. Informacion de Despliegue"),
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.SINGLE, size: 2, color: c(P.accentDark) }, bottom: { style: BorderStyle.SINGLE, size: 2, color: c(P.accentDark) }, left: BorderStyle.NONE, right: BorderStyle.NONE, insideHorizontal: thinBorder, insideVertical: BorderStyle.NONE },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: [
        tableCell("Parametro", { width: 35, bold: true, shading: c(P.accentDark), headerText: true, align: AlignmentType.CENTER }),
        tableCell("Valor", { width: 65, bold: true, shading: c(P.accentDark), headerText: true, align: AlignmentType.CENTER }),
      ]}),
      new TableRow({ cantSplit: true, children: [tableCell("URL Produccion", { width: 35, shading: c(P.tableBg) }), tableCell("https://my-project-steel-six.vercel.app", { width: 65 })] }),
      new TableRow({ cantSplit: true, children: [tableCell("Plataforma", { width: 35, shading: c(P.tableBg) }), tableCell("Vercel (Serverless)", { width: 65 })] }),
      new TableRow({ cantSplit: true, children: [tableCell("Framework", { width: 35, shading: c(P.tableBg) }), tableCell("Next.js 16.1.3 con App Router", { width: 65 })] }),
      new TableRow({ cantSplit: true, children: [tableCell("Lenguaje", { width: 35, shading: c(P.tableBg) }), tableCell("TypeScript", { width: 65 })] }),
      new TableRow({ cantSplit: true, children: [tableCell("Base de Datos", { width: 35, shading: c(P.tableBg) }), tableCell("IndexedDB via Dexie.js (local en dispositivo)", { width: 65 })] }),
      new TableRow({ cantSplit: true, children: [tableCell("Repositorio", { width: 35, shading: c(P.tableBg) }), tableCell("github.com/Chambatina1/CuentasPrecision", { width: 65 })] }),
      new TableRow({ cantSplit: true, children: [tableCell("UI Framework", { width: 35, shading: c(P.tableBg) }), tableCell("TailwindCSS 4 + shadcn/ui", { width: 65 })] }),
      new TableRow({ cantSplit: true, children: [tableCell("Graficos", { width: 35, shading: c(P.tableBg) }), tableCell("Recharts (barras, circulares)", { width: 65 })] }),
    ],
  }),
  new Paragraph({ spacing: { after: 200 }, children: [] }),

  heading2("2.2. Estructura de Archivos Clave"),
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.SINGLE, size: 2, color: c(P.accentDark) }, bottom: { style: BorderStyle.SINGLE, size: 2, color: c(P.accentDark) }, left: BorderStyle.NONE, right: BorderStyle.NONE, insideHorizontal: thinBorder, insideVertical: BorderStyle.NONE },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: [
        tableCell("Archivo", { width: 45, bold: true, shading: c(P.accentDark), headerText: true, align: AlignmentType.CENTER }),
        tableCell("Descripcion", { width: 55, bold: true, shading: c(P.accentDark), headerText: true, align: AlignmentType.CENTER }),
      ]}),
      new TableRow({ cantSplit: true, children: [tableCell("src/app/page.tsx", { width: 45, shading: c(P.tableBg) }), tableCell("Punto de entrada: dynamic import con ssr:false + ErrorBoundary", { width: 55 })] }),
      new TableRow({ cantSplit: true, children: [tableCell("src/app/App.tsx", { width: 45, shading: c(P.tableBg) }), tableCell("Aplicacion principal (~854 lineas): login, dashboard, CRUD, graficos", { width: 55 })] }),
      new TableRow({ cantSplit: true, children: [tableCell("src/app/ErrorBoundary.tsx", { width: 45, shading: c(P.tableBg) }), tableCell("Componente React de captura de errores en tiempo de ejecucion", { width: 55 })] }),
      new TableRow({ cantSplit: true, children: [tableCell("src/lib/db-client.ts", { width: 45, shading: c(P.tableBg) }), tableCell("Wrapper Dexie.js: tipos, esquema IndexedDB, seed data, export/import", { width: 55 })] }),
      new TableRow({ cantSplit: true, children: [tableCell("src/components/ui/*", { width: 45, shading: c(P.tableBg) }), tableCell("Componentes shadcn/ui (48 componentes)", { width: 55 })] }),
    ],
  }),
  new Paragraph({ spacing: { after: 200 }, children: [] }),

  // ═══ ARQUITECTURA ═══
  heading1("3. Arquitectura Tecnica"),
  heading2("3.1. Arquitectura General"),
  body("La aplicacion sigue una arquitectura de tipo Single Page Application (SPA) ejecutada integramente en el navegador del usuario. Next.js se utiliza unicamente como plataforma de compilacion, optimizacion y despliegue, mientras que toda la logica de negocio, el almacenamiento de datos y la renderizacion de la interfaz se ejecutan en el lado del cliente. Este patron arquitectonico garantiza que la aplicacion funciona completamente offline una vez cargada, ya que no depende de llamadas a servidores backend para ninguna operacion critica."),
  body("El flujo de renderizado esta disenado con multiples capas de proteccion contra errores de hidratacion del lado del servidor. En primer lugar, el archivo page.tsx utiliza next/dynamic con la opcion ssr: false para evitar que Next.js intente renderizar la aplicacion en el servidor. En segundo lugar, un componente ErrorBoundary de React envuelve toda la aplicacion para capturar y mostrar errores de tiempo de ejecucion de forma informativa. Finalmente, dentro del componente App.tsx, un guardia de montaje (mounted state + useEffect) asegura que ninguna operacion dependiente del navegador se ejecute antes de que el componente este completamente hidratado."),

  heading2("3.2. Capa de Datos (IndexedDB + Dexie.js)"),
  body("La capa de datos utiliza IndexedDB a traves de la biblioteca Dexie.js, proporcionando un almacenamiento persistente, transaccional y de alta capacidad directamente en el navegador del usuario. La base de datos se denomina CuentasPrecisionDB y contiene seis tablas principales: businesses (negocios registrados), transactions (movimientos de ingresos y gastos), taxRates (tasas impositivas vigentes segun la Gaceta Oficial), exchangeRates (tasas de cambio historicas), alerts (alertas tributarias y sugerencias), y users (usuarios del sistema con roles)."),
  body("El modulo db-client.ts implementa un patron de importacion diferida (lazy loading) de Dexie, lo que significa que la biblioteca no se importa hasta que se solicita por primera vez la base de datos. Ademas, incluye una verificacion de entorno que lanza un error si se intenta acceder a IndexedDB desde el servidor (typeof window === undefined). Los datos iniciales (tasas impositivas cubanas, tasas de cambio de referencia, alertas tributarias, y un usuario administrador por defecto) se insertan automaticamente la primera vez que se accede a la base de datos a traves de la funcion seedDatabase()."),

  heading2("3.3. Tablas de IndexedDB"),
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.SINGLE, size: 2, color: c(P.accentDark) }, bottom: { style: BorderStyle.SINGLE, size: 2, color: c(P.accentDark) }, left: BorderStyle.NONE, right: BorderStyle.NONE, insideHorizontal: thinBorder, insideVertical: BorderStyle.NONE },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: [
        tableCell("Tabla", { width: 22, bold: true, shading: c(P.accentDark), headerText: true, align: AlignmentType.CENTER }),
        tableCell("Indice Principal", { width: 25, bold: true, shading: c(P.accentDark), headerText: true, align: AlignmentType.CENTER }),
        tableCell("Indices Secundarios", { width: 35, bold: true, shading: c(P.accentDark), headerText: true, align: AlignmentType.CENTER }),
        tableCell("Proposito", { width: 18, bold: true, shading: c(P.accentDark), headerText: true, align: AlignmentType.CENTER }),
      ]}),
      new TableRow({ cantSplit: true, children: [tableCell("businesses", { width: 22, shading: c(P.tableBg) }), tableCell("++id (auto)", { width: 25, shading: c(P.tableBg) }), tableCell("name, businessType, activityType, createdAt", { width: 35, shading: c(P.tableBg) }), tableCell("Datos del negocio", { width: 18, shading: c(P.tableBg) })] }),
      new TableRow({ cantSplit: true, children: [tableCell("transactions", { width: 22 }), tableCell("++id (auto)", { width: 25 }), tableCell("businessId, type, category, date, createdAt", { width: 35 }), tableCell("Ingresos y gastos", { width: 18 })] }),
      new TableRow({ cantSplit: true, children: [tableCell("taxRates", { width: 22, shading: c(P.tableBg) }), tableCell("++id (auto)", { width: 25, shading: c(P.tableBg) }), tableCell("code, category", { width: 35, shading: c(P.tableBg) }), tableCell("Tasas impositivas", { width: 18, shading: c(P.tableBg) })] }),
      new TableRow({ cantSplit: true, children: [tableCell("exchangeRates", { width: 22 }), tableCell("++id (auto)", { width: 25 }), tableCell("source, date, createdAt", { width: 35 }), tableCell("Tasas de cambio", { width: 18 })] }),
      new TableRow({ cantSplit: true, children: [tableCell("alerts", { width: 22, shading: c(P.tableBg) }), tableCell("++id (auto)", { width: 25, shading: c(P.tableBg) }), tableCell("type, severity, isRead, createdAt", { width: 35, shading: c(P.tableBg) }), tableCell("Alertas tributarias", { width: 18, shading: c(P.tableBg) })] }),
      new TableRow({ cantSplit: true, children: [tableCell("users", { width: 22 }), tableCell("++id (auto)", { width: 25 }), tableCell("username, role, isActive", { width: 35 }), tableCell("Usuarios y roles", { width: 18 })] }),
    ],
  }),
  new Paragraph({ spacing: { after: 200 }, children: [] }),

  // ═══ AUTENTICACION ═══
  heading1("4. Sistema de Autenticacion y Control de Acceso"),
  heading2("4.1. Estado Actual del Sistema"),
  body("El sistema de autenticacion actual funciona de manera completamente local en cada dispositivo del usuario. Cuando un usuario accede a la aplicacion por primera vez, el sistema crea automaticamente una cuenta de administrador con las credenciales predeterminadas: usuario admin y contrasena admin123. Esta cuenta puede (y debe) ser modificada desde el modulo de Configuracion. La persistencia de sesion se maneja mediante sessionStorage, lo que significa que la sesion se cierra automaticamente cuando el usuario cierra la pestana o el navegador."),
  body("El sistema soporta dos roles de usuario: administrador y usuario. El administrador tiene acceso completo a todas las funcionalidades incluyendo la creacion, edicion y eliminacion de usuarios, mientras que el rol de usuario tiene acceso restringido a las funciones operativas de contabilidad. Adicionalmente, cada usuario puede ser activado o desactivado individualmente, impidiendo el acceso de cuentas sin eliminar su historico de datos."),
  body("Es importante entender una limitacion fundamental del modelo actual: dado que la base de datos es local (IndexedDB en el navegador de cada dispositivo), cada dispositivo mantiene su propio conjunto independiente de usuarios, transacciones y configuraciones. Esto significa que si el administrador crea un usuario nuevo en su computadora, ese usuario no existira automaticamente en otros dispositivos. Esta es una consideracion critica que debe tenerse en cuenta al planificar el control de acceso futuro."),

  heading2("4.2. Como Funciona el Control de Acceso Actual"),
  body("El flujo de autenticacion sigue estos pasos: primero, el usuario ingresa su nombre de usuario y contrasena en la pantalla de login; segundo, el sistema busca el usuario en la tabla users de IndexedDB local; tercero, verifica que la cuenta exista, este activa, y que el hash SHA-256 de la contrasena ingresada coincida con el almacenado; cuarto, si la validacion es exitosa, se almacena el objeto de usuario en sessionStorage y se concede acceso a la interfaz principal."),
  body("La funcion de hash utiliza la API Web Crypto (crypto.subtle.digest) con el algoritmo SHA-256, concatenando un salt fijo al contrasena antes de hashear. Aunque este enfoque proporciona un nivel basico de seguridad, es importante senalar que un salt fijo y almacenado en el codigo fuente del cliente no constituye una practica de seguridad robusta para entornos de produccion. En el plan de mejoras futuras se detalla como fortalecer este aspecto."),

  // ═══ FUNCIONALIDADES ═══
  heading1("5. Funcionalidades Implementadas"),
  heading2("5.1. Panel de Control (Dashboard)"),
  body("El panel de control proporciona una vision general del estado financiero del negocio seleccionado. Muestra cuatro tarjetas resumen con los ingresos mensuales, gastos mensuales, balance neto, y gastos deducibles para fines fiscales. Incluye un widget de tasa de cambio USD/CUP con un convertidor interactivo en tiempo real, dos graficos (tendencia de ingresos/gastos de los ultimos 6 meses mediante grafico de barras, y distribucion de gastos por categoria mediante grafico circular), y paneles de alertas recientes y movimientos recientes."),

  heading2("5.2. Gestión de Movimientos"),
  body("El modulo de movimientos permite registrar, editar y eliminar transacciones de ingresos y gastos. Cada transaccion incluye campos para el tipo (ingreso o gasto), categoria, subcategoria opcional, descripcion, monto en CUP, conversion automatica a USD segun la tasa vigente, fecha, indicador de deducibilidad fiscal, numero de referencia, y notas. Las categorias de ingresos incluyen ventas de productos, prestacion de servicios, alquileres, comisiones, intereses y otros ingresos. Las categorias de gastos abarcan materia prima, alquiler, servicios publicos, salarios, transporte, mantenimiento, impuestos, marketing, seguros, depreciacion, gastos financieros y otros."),

  heading2("5.3. Modulo Tributario"),
  body("El modulo de impuestos incluye una tabla completa de tasas impositivas vigentes basadas en la legislacion cubana, con referencias especificas a la Gaceta Oficial. Las tasas preconfiguradas cubren el Impuesto sobre Ingresos Personales para TCP (15% hasta 50,000 CUP anuales, 20% para el tramo superior), la Contribucion a la Seguridad Social para TCP (25%), el Impuesto sobre Ingresos para MiPYME (30%), la Contribucion a la Seguridad Social para MiPYME (16.5%), el ITSS (11%), y diversas tasas y contribuciones adicionales. Cada tasa incluye descripcion, rango de aplicacion, fecha de vigencia y referencia a la norma legal correspondiente."),

  heading2("5.4. Convertidor CUP/USD"),
  body("La aplicacion incluye un convertidor de divisas integrado en el panel de control que permite convertir rapidamente entre pesos cubanos (CUP) y dolares estadounidenses (USD). La tasa de cambio se almacena en la base de datos local y puede ser actualizada manualmente por el administrador. El sistema incluye tasas de cambio historicas con fuentes como El Toque y Atales, y soporta tasas para USD, EUR y MLC. El convertidor se actualiza automaticamente en tiempo real a medida que el usuario escribe."),

  heading2("5.5. Sistema de Alertas"),
  body("El sistema de alertas proporciona notificaciones tributarias proactivas con diferentes niveles de severidad (critico, alto, medio, bajo e informativo). Las alertas preconfiguradas incluyen recordatorios de vencimientos fiscales (dia 15 de cada mes para declaraciones, dia 10 para Seguridad Social), oportunidades de optimizacion fiscal (maximizacion de deducciones, separacion de cuentas personales y de negocio), advertencias sobre actualizaciones normativas publicadas en la Gaceta Oficial, y sugerencias de formalizacion empresarial. El usuario puede marcar las alertas como leidas y administrar su bandeja desde el modulo correspondiente."),

  heading2("5.6. Exportar e Importar Datos"),
  body("La aplicacion permite exportar todos los datos almacenados en IndexedDB a un archivo JSON estructurado que incluye la fecha de exportacion, version del formato, y los datos de todas las tablas (negocios, transacciones, tasas impositivas, tasas de cambio y alertas). De manera inversa, se pueden importar datos desde un archivo JSON previamente exportado, reemplazando completamente los datos existentes tras confirmacion del usuario. Esta funcionalidad es especialmente util para realizar respaldos periodicos, migrar datos entre dispositivos, o compartir la configuracion contable entre negocios."),

  // ═══ CONTROL DE ACCESO FUTURO ═══
  heading1("6. Control de Acceso: Plan de Mejoras Futuras"),
  heading2("6.1. Limitaciones del Modelo Actual"),
  body("El modelo actual de control de acceso tiene limitaciones significativas que deben abordarse para escalar la aplicacion a un entorno multiusuario real. La principal limitacion es que la base de datos es local en cada dispositivo: no hay sincronizacion entre dispositivos, no existe un servidor central de autenticacion, y cada dispositivo es un universo de datos independiente. Esto significa que el administrador no puede crear usuarios de forma centralizada que funcionen en todos los dispositivos, y no es posible auditar o controlar el acceso de manera remota."),
  body("Adicionalmente, las contrasenas se almacenan con un salt fijo visible en el codigo fuente, la sesion se maneja con sessionStorage (se pierde al cerrar el navegador), y no hay mecanismos de recuperacion de contrasena, autenticacion de dos factores, ni registro de actividad (audit log). Todas estas son areas que el plan de mejoras propone abordar de manera incremental."),

  heading2("6.2. Plan de Mejoras por Fases"),
  heading3("Fase 1: Fortalecimiento Local (sin servidor)"),
  body("Esta fase se puede implementar sin agregar un backend, mejorando la seguridad del modelo local existente. Incluye: generacion de salts unicos por usuario almacenados en IndexedDB; migracion de sessionStorage a localStorage para persistencia de sesion entre cierres de navegador; implementacion de un PIN de acceso rapido de 4-6 digitos; generacion de codigos de invitacion que permitan al administrador crear nuevos usuarios desde su dispositivo y compartirlos por via externa (WhatsApp, email); y un registro local de actividad (audit log) que registre inicios de sesion, cambios de contrasena y operaciones criticas."),

  heading3("Fase 2: Sincronizacion entre Dispositivos"),
  body("Esta fase introduce la capacidad de sincronizar datos entre dispositivos del mismo usuario o del mismo negocio. Las opciones incluyen: implementar un sistema de sincronizacion peer-to-peer mediante WebRTC, utilizando un servidor de senalizacion (signaling server) minimalista solo para establecer conexiones directas entre dispositivos; o implementar un servicio de sincronizacion basado en un backend ligero (por ejemplo, Supabase o Firebase Firestore) que permita almacenar los datos cifrados del usuario y sincronizarlos entre dispositivos. En ambos casos, los datos permanecerian cifrados extremo-a-extremo, de modo que ni siquiera el servidor de sincronizacion podria leer la informacion contable del usuario."),

  heading3("Fase 3: Autenticacion Centralizada"),
  body("La fase final introduce un sistema de autenticacion centralizado que permite al administrador controlar el acceso de forma remota desde cualquier dispositivo. Esto incluye: integracion con un proveedor de autenticacion como Supabase Auth, Firebase Auth, o Clerk; gestion centralizada de usuarios con capacidad de crear, editar, desactivar y eliminar cuentas desde cualquier dispositivo del administrador; autenticacion de dos factores (2FA) mediante codigo SMS o aplicacion autenticadora; recuperacion de contrasena por correo electronico; roles y permisos granulares (por ejemplo, un contador puede ver pero no modificar datos); y un dashboard de administracion con metricas de uso y actividad de usuarios."),

  heading2("6.3. Opciones de Implementacion Recomendadas"),
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.SINGLE, size: 2, color: c(P.accentDark) }, bottom: { style: BorderStyle.SINGLE, size: 2, color: c(P.accentDark) }, left: BorderStyle.NONE, right: BorderStyle.NONE, insideHorizontal: thinBorder, insideVertical: BorderStyle.NONE },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: [
        tableCell("Solucion", { width: 20, bold: true, shading: c(P.accentDark), headerText: true, align: AlignmentType.CENTER }),
        tableCell("Costo", { width: 15, bold: true, shading: c(P.accentDark), headerText: true, align: AlignmentType.CENTER }),
        tableCell("Complejidad", { width: 20, bold: true, shading: c(P.accentDark), headerText: true, align: AlignmentType.CENTER }),
        tableCell("Ventaja Principal", { width: 45, bold: true, shading: c(P.accentDark), headerText: true, align: AlignmentType.CENTER }),
      ]}),
      new TableRow({ cantSplit: true, children: [tableCell("Mejora local pura", { width: 20, shading: c(P.tableBg) }), tableCell("Gratis", { width: 15, shading: c(P.tableBg) }), tableCell("Baja", { width: 20, shading: c(P.tableBg) }), tableCell("Sin dependencias externas, privacidad maxima", { width: 45, shading: c(P.tableBg) })] }),
      new TableRow({ cantSplit: true, children: [tableCell("Supabase (Auth + DB)", { width: 20 }), tableCell("Free tier generoso", { width: 15 }), tableCell("Media", { width: 20 }), tableCell("Backend completo, realtime, auth integrado", { width: 45 })] }),
      new TableRow({ cantSplit: true, children: [tableCell("Firebase (Auth + Firestore)", { width: 20, shading: c(P.tableBg) }), tableCell("Free tier amplio", { width: 15, shading: c(P.tableBg) }), tableCell("Media", { width: 20, shading: c(P.tableBg) }), tableCell("Sincronizacion automatica, push notifications", { width: 45, shading: c(P.tableBg) })] }),
      new TableRow({ cantSplit: true, children: [tableCell("Clerk + base de datos propia", { width: 20 }), tableCell("Desde $0/mes", { width: 15 }), tableCell("Media-Alta", { width: 20 }), tableCell("Auth empresarial de alta calidad, UI preconstruida", { width: 45 })] }),
      new TableRow({ cantSplit: true, children: [tableCell("WebRTC P2P (sin backend)", { width: 20, shading: c(P.tableBg) }), tableCell("Gratis", { width: 15, shading: c(P.tableBg) }), tableCell("Alta", { width: 20, shading: c(P.tableBg) }), tableCell("Sin servidor central, datos nunca salen del dispositivo", { width: 45, shading: c(P.tableBg) })] }),
    ],
  }),
  new Paragraph({ spacing: { after: 200 }, children: [] }),

  // ═══ ROADMAP ═══
  heading1("7. Roadmap de Mejoras Futuras"),
  heading2("7.1. Mejoras de Corto Plazo (1-2 semanas)"),
  body("Dentro de las mejoras que se pueden implementar rapidamente se encuentran: fortalecimiento del sistema de autenticacion local con salts unicos por usuario y almacenamiento persistente de sesion; generacion de codigos de invitacion para compartir acceso sin exponer credenciales; implementacion de un registro de actividad local (audit log) para rastrear operaciones criticas; mejora del modulo de impuestos con calculadora automatica que estime el impuesto a pagar basandose en los ingresos y gastos registrados del periodo; y generacion de reportes PDF exportables con resumenes mensuales y anuales de la actividad contable."),

  heading2("7.2. Mejoras de Mediano Plazo (1-2 meses)"),
  body("En el mediano plazo se recomienda: integracion de una API de tasas de cambio en tiempo real (por ejemplo, scraping automatizado de El Toque o integration con la API de Atales) para mantener la cotizacion actualizada sin intervencion manual; implementacion del Libro Diario y Libro Mayor electronico con formato compatible con los requisitos de la ONAT; modulo de declaraciones fiscales que genere formularios prellenados listos para presentacion; sistema de respaldo automatico periodico con exportacion programada a un servicio de almacenamiento en la nube; y adaptacion de la interfaz como Progressive Web App (PWA) para instalacion en dispositivos moviles y funcionamiento offline avanzado con sincronizacion diferida."),

  heading2("7.3. Mejoras de Largo Plazo (3-6 meses)"),
  body("A largo plazo, las mejoras mas significativas incluyen: implementacion de un backend ligero con Supabase o Firebase para sincronizacion multi-dispositivo y autenticacion centralizada; sistema de alertas inteligentes con analisis predictivo que anticipe obligaciones fiscales y detecte anomalias en los patrones de gasto; modulo de presupuestos anuales con seguimiento de desviaciones y recomendaciones de ajuste; integracion con APIs bancarias cubanas (cuando esten disponibles) para importacion automatica de movimientos; y un sistema de reportes avanzados con comparaciones interanuales, indicadores de rentabilidad, y proyecciones financieras."),

  // ═══ CREDENCIALES Y ACCESO ═══
  heading1("8. Credenciales y Acceso Rapido"),
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.SINGLE, size: 2, color: c(P.accentDark) }, bottom: { style: BorderStyle.SINGLE, size: 2, color: c(P.accentDark) }, left: BorderStyle.NONE, right: BorderStyle.NONE, insideHorizontal: thinBorder, insideVertical: BorderStyle.NONE },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: [
        tableCell("Dato", { width: 35, bold: true, shading: c(P.accentDark), headerText: true, align: AlignmentType.CENTER }),
        tableCell("Valor", { width: 65, bold: true, shading: c(P.accentDark), headerText: true, align: AlignmentType.CENTER }),
      ]}),
      new TableRow({ cantSplit: true, children: [tableCell("URL", { width: 35, shading: c(P.tableBg) }), tableCell("https://my-project-steel-six.vercel.app", { width: 65 })] }),
      new TableRow({ cantSplit: true, children: [tableCell("Usuario Admin", { width: 35, shading: c(P.tableBg) }), tableCell("admin", { width: 65 })] }),
      new TableRow({ cantSplit: true, children: [tableCell("Contrasena Admin", { width: 35, shading: c(P.tableBg) }), tableCell("admin123 (cambiar en Configuracion > Usuarios)", { width: 65 })] }),
      new TableRow({ cantSplit: true, children: [tableCell("GitHub Repo", { width: 35, shading: c(P.tableBg) }), tableCell("https://github.com/Chambatina1/CuentasPrecision", { width: 65 })] }),
      new TableRow({ cantSplit: true, children: [tableCell("Vercel Token", { width: 35, shading: c(P.tableBg) }), tableCell("vcp_3Ocn... (almacenado de forma segura)", { width: 65 })] }),
    ],
  }),
  new Paragraph({ spacing: { after: 200 }, children: [] }),
  body("Nota importante: Se recomienda encarecidamente cambiar la contrasena del administrador inmediatamente despues del primer acceso. Para hacerlo, ingrese a Configuracion > Usuarios, haga clic en el icono de editar junto al usuario admin, y establezca una nueva contrasena. Adicionalmente, se recomienda crear al menos un segundo usuario con rol de administrador como respaldo."),
];

// ─── Assemble Document ─────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, size: 24, color: c(P.body) },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, size: 32, bold: true, color: c("0A1628") },
        paragraph: { spacing: { before: 400, after: 200, line: 312 } },
      },
      heading2: {
        run: { font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, size: 28, bold: true, color: c("0A1628") },
        paragraph: { spacing: { before: 300, after: 150, line: 312 } },
      },
      heading3: {
        run: { font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, size: 24, bold: true, color: c(P.accentDark) },
        paragraph: { spacing: { before: 200, after: 100, line: 312 } },
      },
    },
  },
  sections: [
    // Section 1: Cover
    {
      properties: {
        page: { margin: { top: 0, bottom: 0, left: 0, right: 0 }, size: { width: 11906, height: 16838 } },
      },
      children: [buildCover()],
    },
    // Section 2: TOC
    {
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 } },
      },
      headers: {
        default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "CuentasPrecision - Informe Tecnico", size: 18, color: c(P.secondary), font: { ascii: "Calibri" } })] })] }),
      },
      footers: {
        default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary) })] })] }),
      },
      children: [
        new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: "Contenido", size: 36, bold: true, font: { ascii: "Calibri", eastAsia: "SimHei" }, color: c("0A1628") })] }),
        new TableOfContents("Tabla de Contenidos", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({ children: [new PageBreak()] }),
      ],
    },
    // Section 3: Body
    {
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 }, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } },
      },
      headers: {
        default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "CuentasPrecision - Informe Tecnico", size: 18, color: c(P.secondary), font: { ascii: "Calibri" } })] })] }),
      },
      footers: {
        default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary) })] })] }),
      },
      children: bodyContent,
    },
  ],
});

// ─── Generate ──────────────────────────────────────────────────────
const outputPath = "/home/z/my-project/download/CuentasPrecision_Informe_Tecnico.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("Document generated: " + outputPath);
});

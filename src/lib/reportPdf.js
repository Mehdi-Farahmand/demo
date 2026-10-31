import { jsPDF } from 'jspdf'
import { buildReport } from './report.js'
import { toVisual, wrapText } from './rtl.js'
import { faDate, faMoneyShort, faNumber, faToman, toFaDigits } from './format.js'

/* ------------------------------------------------------------------ *
 * Layout constants & palette
 * ------------------------------------------------------------------ */
const W = 595.28
const H = 841.89
const M = 46
const CONTENT_W = W - M * 2

const C = {
  deep: '#050b16',
  navy: '#071324',
  panel: '#0c1c31',
  panelSoft: '#12283f',
  gold: '#e6e699',
  goldSoft: '#f4e98f',
  white: '#ffffff',
  ink: '#0a1524',
  muted: '#a8bacd',
  faint: '#6f8399',
  line: '#1d3450',
}

const FONTS = [
  { file: 'Vazirmatn-Regular.ttf', family: 'Vazirmatn', style: 'normal' },
  { file: 'Vazirmatn-Bold.ttf', family: 'Vazirmatn', style: 'bold' },
  { file: 'ClashDisplay-Semibold.ttf', family: 'ClashDisplay', style: 'normal' },
]

/* ------------------------------------------------------------------ *
 * Low level helpers
 * ------------------------------------------------------------------ */
const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

async function registerFonts(doc) {
  const loaded = await Promise.all(
    FONTS.map(async (font) => {
      const response = await fetch(`/fonts/${font.file}`)
      if (!response.ok) throw new Error(`فونت ${font.file} بارگذاری نشد (${response.status})`)
      return { ...font, base64: arrayBufferToBase64(await response.arrayBuffer()) }
    }),
  )
  loaded.forEach((font) => {
    doc.addFileToVFS(font.file, font.base64)
    doc.addFont(font.file, font.family, font.style)
  })
}

function useFont(doc, { latin = false, bold = false, size = 10, color = C.white } = {}) {
  doc.setFont(latin ? 'ClashDisplay' : 'Vazirmatn', latin ? 'normal' : bold ? 'bold' : 'normal')
  doc.setFontSize(size)
  doc.setTextColor(color)
}

/** Persian text at baseline y, right aligned unless `align` says otherwise. */
function rtl(doc, text, x, y, { size = 10, color = C.white, bold = false, align = 'right' } = {}) {
  useFont(doc, { size, color, bold })
  doc.text(toVisual(text), x, y, { align })
}

/** Centered Persian text at baseline y. */
function rtlCenter(doc, text, x, y, { size = 10, color = C.white, bold = false } = {}) {
  useFont(doc, { size, color, bold })
  doc.text(toVisual(text), x, y, { align: 'center' })
}

/** Wrapped Persian paragraph, returns the baseline of its last line. */
function paragraph(doc, text, x, y, maxWidth, opts = {}) {
  const { size = 9.5, color = C.white, bold = false, lineHeight = 1.85 } = opts
  useFont(doc, { size, color, bold })
  const lines = wrapText(doc, text, maxWidth)
  const step = size * lineHeight
  lines.forEach((line, index) => {
    doc.text(toVisual(line), x, y + index * step, { align: 'right' })
  })
  return y + (lines.length - 1) * step
}

function latin(doc, text, x, y, { size = 9, color = C.gold, spacing = 0, align = 'left' } = {}) {
  useFont(doc, { latin: true, size, color })
  if (spacing) doc.setCharSpace(spacing)
  doc.text(text, x, y, { align })
  if (spacing) doc.setCharSpace(0)
}

function card(doc, x, y, w, h, { fill = C.panel, radius = 12 } = {}) {
  doc.setFillColor(fill)
  doc.roundedRect(x, y, w, h, radius, radius, 'F')
  doc.setDrawColor(C.line)
  doc.setLineWidth(0.6)
  doc.roundedRect(x, y, w, h, radius, radius, 'S')
}

function tag(doc, text, xRight, y, { gold = false } = {}) {
  useFont(doc, { size: 6.4, color: gold ? C.ink : C.muted })
  const width = doc.getTextWidth(toVisual(text)) + 14
  doc.setFillColor(gold ? C.gold : C.panelSoft)
  doc.roundedRect(xRight - width, y - 10.5, width, 15, 7.5, 7.5, 'F')
  doc.setTextColor(gold ? C.ink : C.muted)
  doc.text(toVisual(text), xRight - 7, y, { align: 'right' })
}

function sectionLabel(doc, text, y) {
  rtl(doc, text, W - M, y, { size: 8.4, color: C.gold })
  doc.setDrawColor(C.line)
  doc.setLineWidth(0.6)
  doc.line(M, y + 8, W - M - doc.getTextWidth(toVisual(text)) - 12, y + 8)
  return y + 24
}

function bullets(doc, items, { x, y, w, size = 9.4, color = C.white }) {
  let cursor = y
  items.forEach((item) => {
    doc.setFillColor(C.gold)
    doc.circle(x + w - 2.4, cursor - 3, 1.7, 'F')
    cursor = paragraph(doc, item, x + w - 12, cursor, w - 16, { size, color }) + size * 1.5
  })
  return cursor
}

function chips(doc, items, { x, y, w, size = 8.6 }) {
  useFont(doc, { size, color: C.white })
  const gap = 7
  const height = 22
  let cursorX = x + w
  let cursorY = y
  items.forEach((item) => {
    const width = doc.getTextWidth(toVisual(item)) + 22
    if (cursorX - width < x) {
      cursorX = x + w
      cursorY += height + gap
    }
    doc.setFillColor(C.panelSoft)
    doc.roundedRect(cursorX - width, cursorY, width, height, 11, 11, 'F')
    doc.setDrawColor(C.line)
    doc.setLineWidth(0.5)
    doc.roundedRect(cursorX - width, cursorY, width, height, 11, 11, 'S')
    useFont(doc, { size, color: C.white })
    doc.text(toVisual(item), cursorX - 11, cursorY + 14.5, { align: 'right' })
    cursorX -= width + gap
  })
  return cursorY + height
}

function bars(doc, items, { x, y, w, maxValue }) {
  let cursor = y
  const labelWidth = 132
  const valueWidth = 96
  const trackWidth = w - labelWidth - valueWidth
  const trackRight = x + w - labelWidth
  items.forEach((item) => {
    rtl(doc, item.label, x + w, cursor + 9, { size: 8.8, color: C.muted })
    doc.setFillColor(C.panelSoft)
    doc.roundedRect(trackRight - trackWidth, cursor, trackWidth, 11, 5.5, 5.5, 'F')
    const filled = Math.max(3, Math.round(trackWidth * (item.value / maxValue)))
    doc.setFillColor(item.color ?? C.gold)
    doc.roundedRect(trackRight - filled, cursor, filled, 11, 5.5, 5.5, 'F')
    rtl(doc, faMoneyShort(item.value), x + valueWidth - 8, cursor + 9, {
      size: 7.8,
      color: C.white,
    })
    cursor += 30
  })
  return cursor
}

function metricTile(doc, { x, y, w, h, label, value, badge, badgeGold, caption }) {
  card(doc, x, y, w, h, { fill: C.panel })
  rtl(doc, label, x + w - 16, y + 24, { size: 8.6, color: C.muted })
  rtl(doc, value, x + w - 16, y + h - 34, { size: 14, bold: true, color: C.gold })
  if (caption) rtl(doc, caption, x + w - 16, y + h - 16, { size: 7.4, color: C.faint })
  if (badge) tag(doc, badge, x + w - 16, y + 46, { gold: Boolean(badgeGold) })
}

function pageChrome(doc) {
  doc.setFillColor(C.navy)
  doc.rect(0, 0, W, H, 'F')
  doc.setFillColor(C.panel)
  doc.rect(0, 0, W, 108, 'F')

  latin(doc, 'LEVA', M, 40, { size: 12.5, color: C.gold, spacing: 2.4 })
  latin(doc, 'HUMAN ACCELERATOR', M, 57, { size: 4.4, color: C.faint, spacing: 1.3 })

  doc.setDrawColor(C.gold)
  doc.setLineWidth(0.7)
  doc.line(M, 104, W - M, 104)

  // subtle vertical accent on the right edge
  doc.setFillColor(C.gold)
  doc.rect(W - M, 120, 1.4, 12, 'F')
}

function contentPage(doc, { title, subtitle, label }) {
  doc.addPage()
  pageChrome(doc)
  rtl(doc, title, W - M, 48, { size: 15.5, bold: true, color: C.white })
  if (label) rtl(doc, label, W - M, 66, { size: 8, color: C.gold })
  if (subtitle) rtl(doc, subtitle, W - M, 82, { size: 9.2, color: C.muted })
  return 132
}

function addFooters(doc, total) {
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page)
    doc.setDrawColor(C.line)
    doc.setLineWidth(0.6)
    doc.line(M, H - 56, W - M, H - 56)
    latin(doc, 'LEVA  ·  HUMAN ACCELERATOR', M, H - 38, { size: 6, color: C.faint, spacing: 1.2 })
    rtl(doc, `صفحه ${toFaDigits(page)} از ${toFaDigits(total)}`, W - M, H - 38, {
      size: 7.6,
      color: C.faint,
    })
  }
}

/* ------------------------------------------------------------------ *
 * Pages
 * ------------------------------------------------------------------ */
function drawMark(doc, x, y, size, color = C.gold) {
  doc.setDrawColor(color)
  doc.setLineWidth(size * 0.085)
  doc.setLineCap('round')
  doc.line(x, y + size * 0.6, x + size, y + size * 0.18)
  doc.setFillColor(color)
  doc.triangle(
    x + size * 0.5,
    y + size * 0.52,
    x + size * 0.74,
    y + size * 0.98,
    x + size * 0.26,
    y + size * 0.98,
    'F',
  )
  doc.setLineCap('butt')
}

function renderCover(doc) {
  doc.setFillColor(C.deep)
  doc.rect(0, 0, W, H, 'F')

  // frame
  doc.setDrawColor(C.gold)
  doc.setLineWidth(0.8)
  doc.rect(28, 28, W - 56, H - 56, 'S')

  drawMark(doc, W / 2 - 26, 130, 52)

  latin(doc, 'LEVA', W / 2, 236, { size: 40, color: C.gold, spacing: 8, align: 'center' })
  latin(doc, 'HUMAN ACCELERATOR', W / 2, 256, { size: 7, color: C.faint, spacing: 3.4, align: 'center' })

  doc.setDrawColor(C.gold)
  doc.setLineWidth(0.7)
  doc.line(W / 2 - 40, 282, W / 2 + 40, 282)

  card(doc, 84, 330, W - 168, 210, { fill: C.navy, radius: 18 })

  rtlCenter(doc, 'گزارش اختصاصی وضعیت اقتصادی و منابع من', W / 2, 392, {
    size: 19,
    bold: true,
    color: C.white,
  })
  rtlCenter(doc, 'شناخت نقطه شروع، منابع و ظرفیت‌های رشد', W / 2, 424, {
    size: 11,
    color: C.muted,
  })

  doc.setDrawColor(C.line)
  doc.setLineWidth(0.6)
  doc.line(120, 448, W - 120, 448)

  rtlCenter(doc, 'این گزارش فقط از پاسخ‌های خودت ساخته شده است.', W / 2, 476, {
    size: 9,
    color: C.faint,
  })
  rtlCenter(doc, 'هیچ عددی در آن حدس زده نشده.', W / 2, 494, { size: 9, color: C.faint })

  rtlCenter(doc, `تاریخ ساخت گزارش: ${faDate(new Date())}`, W / 2, 700, { size: 10, color: C.muted })

  latin(doc, 'LEVA  ·  HUMAN ACCELERATOR', W / 2, 764, {
    size: 6.4,
    color: C.faint,
    spacing: 1.6,
    align: 'center',
  })
}

function renderSnapshot(doc, report) {
  const { money, calc } = report
  let y = contentPage(doc, {
    title: 'تصویر اقتصادی تو',
    label: 'PAGE 02 — ECONOMIC SNAPSHOT',
    subtitle: 'خلاصه‌ی چیزی که امروز از خودت گفتی',
  })

  y = sectionLabel(doc, 'شاخص‌های اصلی', y)

  const tileW = (CONTENT_W - 14) / 2
  const tileH = 92
  metricTile(doc, {
    x: W - M - tileW,
    y,
    w: tileW,
    h: tileH,
    label: 'درآمد ماهیانه',
    value: money.income !== null ? faMoneyShort(money.income) : 'ثبت نشده',
    badge: 'ورودی شما',
  })
  metricTile(doc, {
    x: M,
    y,
    w: tileW,
    h: tileH,
    label: 'خرج ماهیانه',
    value: money.expenses !== null ? faMoneyShort(money.expenses) : 'ثبت نشده',
    badge: 'ورودی شما',
  })
  y += tileH + 14

  metricTile(doc, {
    x: W - M - tileW,
    y,
    w: tileW,
    h: tileH,
    label: 'مانده ماهیانه',
    value: calc.surplus !== null ? faMoneyShort(calc.surplus) : 'قابل محاسبه نیست',
    badge: 'محاسبه‌شده',
    badgeGold: true,
    caption: 'درآمد منهای خرج',
  })
  metricTile(doc, {
    x: M,
    y,
    w: tileW,
    h: tileH,
    label: 'سرمایه در دسترس',
    value: money.capital !== null ? faMoneyShort(money.capital) : 'ثبت نشده',
    badge: 'ورودی شما',
  })
  y += tileH + 22

  y = sectionLabel(doc, 'مانده ماهانه و تعهدات', y)

  const rows = [
    ['پس‌انداز ماهیانه', money.saving !== null ? faToman(money.saving) : 'ثبت نشده', 'ورودی شما'],
    ['اقساط ماهیانه', money.debt !== null ? faToman(money.debt) : 'ثبت نشده', 'ورودی شما'],
    [
      'دوام سرمایه در برابر خرج',
      calc.runwayMonths !== null
        ? `${toFaDigits(calc.runwayMonths.toFixed(1).replace('.', '٫'))} ماه`
        : 'قابل محاسبه نیست',
      'محاسبه‌شده',
    ],
  ]
  rows.forEach((row) => {
    card(doc, M, y, CONTENT_W, 40, { fill: C.panel, radius: 10 })
    rtl(doc, row[0], W - M - 14, y + 25, { size: 9, color: C.muted })
    rtl(doc, row[1], W - M - 210, y + 25, { size: 9.4, bold: true, color: C.white })
    tag(doc, row[2], M + 104, y + 21, { gold: row[2] === 'محاسبه‌شده' })
    y += 48
  })

  y += 6
  const insight =
    calc.surplus === null
      ? 'برای محاسبه مانده ماهیانه، به هر دو پاسخ درآمد و خرج نیاز است.'
      : calc.surplus > 0
        ? `ماهی حدود ${faToman(calc.surplus)} از درآمدت باقی می‌ماند. این همان ظرفیتی است که می‌شود رویش ساختن را شروع کرد.`
        : `خرج ماهیانه‌ات حدود ${faToman(Math.abs(calc.surplus))} از درآمدت بیشتر است. همین شکاف، اولین نقطه‌ی کار است.`
  card(doc, M, y, CONTENT_W, 74, { fill: C.panelSoft, radius: 14 })
  rtl(doc, 'یک نگاه سریع', W - M - 16, y + 24, { size: 8.4, color: C.gold })
  paragraph(doc, insight, W - M - 16, y + 44, CONTENT_W - 32, { size: 9.6, color: C.white })
}

function renderIncomeExpenses(doc, report) {
  const { money, calc } = report
  let y = contentPage(doc, {
    title: 'درآمد و خرج',
    label: 'PAGE 03 — INCOME & EXPENSES',
    subtitle: 'اعداد ماهیانه همان‌طور که وارد کردی، و معادل سالانه‌ی محاسبه‌شده',
  })

  y = sectionLabel(doc, 'جدول درآمد و خرج', y)

  const columns = { right: W - M - 16, value: W - M - 196, annual: W - M - 352 }
  card(doc, M, y, CONTENT_W, 34, { fill: C.panelSoft, radius: 10 })
  rtl(doc, 'عنوان', columns.right, y + 22, { size: 8.2, color: C.gold })
  rtl(doc, 'ماهیانه (ورودی شما)', columns.value, y + 22, { size: 8.2, color: C.gold })
  rtl(doc, 'سالانه (×۱۲)', columns.annual, y + 22, { size: 8.2, color: C.gold })
  y += 34

  const tableRows = [
    ['درآمد', money.income, calc.annualIncome],
    ['خرج', money.expenses, calc.annualExpenses],
    ['پس‌انداز', money.saving, calc.annualSaving],
    ['اقساط و بدهی', money.debt, calc.annualDebt],
  ]

  tableRows.forEach(([label, monthly, annual], index) => {
    card(doc, M, y, CONTENT_W, 42, { fill: index % 2 === 0 ? C.panel : C.navy, radius: 0 })
    rtl(doc, label, columns.right, y + 26, { size: 9.4, color: C.white })
    rtl(doc, monthly !== null ? faToman(monthly) : 'ثبت نشده', columns.value, y + 26, {
      size: 9.2,
      color: monthly !== null ? C.white : C.faint,
    })
    rtl(doc, annual !== null ? faToman(annual) : '—', columns.annual, y + 26, {
      size: 9.2,
      color: annual !== null ? C.muted : C.faint,
    })
    y += 42
  })

  y += 22
  y = sectionLabel(doc, 'درآمد در برابر خرج', y)

  const chartItems = []
  if (money.income !== null) {
    chartItems.push({ label: 'درآمد ماهیانه', value: money.income, color: C.gold })
  }
  if (money.expenses !== null) {
    chartItems.push({ label: 'خرج ماهیانه', value: money.expenses, color: '#7f93aa' })
  }
  if (chartItems.length === 2) {
    const maxValue = Math.max(...chartItems.map((item) => item.value)) || 1
    y = bars(doc, chartItems, { x: M, y, w: CONTENT_W, maxValue })
  } else {
    paragraph(doc, 'برای رسم نمودار، به هر دو پاسخ درآمد و خرج نیاز است.', W - M, y, CONTENT_W, {
      size: 9.2,
      color: C.faint,
    })
    y += 20
  }

  y += 16
  card(doc, M, y, CONTENT_W, 62, { fill: C.panelSoft, radius: 12 })
  rtl(doc, 'توجه', W - M - 16, y + 22, { size: 8.4, color: C.gold })
  paragraph(
    doc,
    'هر عدد سالانه در این صفحه از ضرب مقدار ماهیانه در ۱۲ به دست آمده و مقدار وارد‌شده‌ی تو نیست.',
    W - M - 16,
    y + 42,
    CONTENT_W - 32,
    { size: 9, color: C.muted },
  )
}

function renderResources(doc, report) {
  const { money, calc } = report
  let y = contentPage(doc, {
    title: 'منابع مالی تو',
    label: 'PAGE 04 — FINANCIAL RESOURCES',
    subtitle: 'سرمایه، پس‌انداز و نسبت‌هایی که از پاسخ‌هایت محاسبه شده‌اند',
  })

  y = sectionLabel(doc, 'سرمایه', y)
  const tileW = (CONTENT_W - 28) / 3
  const tileH = 92
  const tiles = [
    {
      label: 'سرمایه در دسترس',
      value: money.capital !== null ? faMoneyShort(money.capital) : 'ثبت نشده',
      badge: 'ورودی شما',
    },
    {
      label: 'پس‌انداز ماهیانه',
      value: money.saving !== null ? faMoneyShort(money.saving) : 'ثبت نشده',
      badge: 'ورودی شما',
    },
    {
      label: 'پس‌انداز سالانه',
      value: calc.annualSaving !== null ? faMoneyShort(calc.annualSaving) : 'قابل محاسبه نیست',
      badge: 'محاسبه‌شده',
      badgeGold: true,
    },
  ]
  tiles.forEach((tile, index) => {
    metricTile(doc, {
      x: W - M - tileW - index * (tileW + 14),
      y,
      w: tileW,
      h: tileH,
      ...tile,
    })
  })
  y += tileH + 24

  y = sectionLabel(doc, 'نسبت‌های کلیدی (همه محاسبه‌شده)', y)

  const ratios = [
    [
      'نرخ پس‌انداز',
      calc.savingRate !== null ? `${toFaDigits(Math.round(calc.savingRate * 100))}٪ از درآمد` : null,
    ],
    [
      'سهم خرج از درآمد',
      calc.expenseRatio !== null ? `${toFaDigits(Math.round(calc.expenseRatio * 100))}٪ از درآمد` : null,
    ],
    [
      'سهم اقساط از درآمد',
      calc.debtRatio !== null ? `${toFaDigits(Math.round(calc.debtRatio * 100))}٪ از درآمد` : null,
    ],
    [
      'دوام سرمایه در برابر خرج',
      calc.runwayMonths !== null
        ? `${toFaDigits(calc.runwayMonths.toFixed(1).replace('.', '٫'))} ماه`
        : null,
    ],
  ]
  ratios.forEach(([label, value]) => {
    card(doc, M, y, CONTENT_W, 38, { fill: C.panel, radius: 10 })
    rtl(doc, label, W - M - 14, y + 24, { size: 9, color: C.muted })
    rtl(doc, value ?? 'داده‌ی کافی برای محاسبه نیست', W - M - 220, y + 24, {
      size: 9.2,
      bold: Boolean(value),
      color: value ? C.white : C.faint,
    })
    y += 44
  })

  y += 10
  card(doc, M, y, CONTENT_W, 96, { fill: C.panelSoft, radius: 14 })
  rtl(doc, 'چطور این اعداد ساخته شدند؟', W - M - 16, y + 24, { size: 8.6, color: C.gold })
  paragraph(
    doc,
    'نرخ پس‌انداز = پس‌انداز ماهیانه ÷ درآمد ماهیانه · دوام سرمایه = سرمایه در دسترس ÷ خرج ماهیانه. اگر یکی از عددهای پایه را وارد نکرده باشی، همان نسبت محاسبه نمی‌شود.',
    W - M - 16,
    y + 44,
    CONTENT_W - 32,
    { size: 9, color: C.muted },
  )
}

function renderNonFinancial(doc, report) {
  const { money, calc, skills, employment, energy } = report
  let y = contentPage(doc, {
    title: 'منابع غیرمالی تو',
    label: 'PAGE 05 — NON-FINANCIAL RESOURCES',
    subtitle: 'چیزی که پول نیست ولی موتور رشد است',
  })

  y = sectionLabel(doc, 'وضعیت فعلی', y)
  const rows = [
    ['وضعیت شغلی', employment ?? 'ثبت نشده'],
    ['سطح انرژی و سلامت', energy ?? 'ثبت نشده'],
    [
      'زمان آزاد هفتگی',
      money.hours !== null ? `${toFaDigits(money.hours)} ساعت در هفته` : 'ثبت نشده',
    ],
    [
      'زمان آزاد سالانه',
      calc.freeHoursYear !== null
        ? `${faNumber(calc.freeHoursYear)} ساعت در سال`
        : 'قابل محاسبه نیست',
    ],
  ]
  rows.forEach(([label, value]) => {
    card(doc, M, y, CONTENT_W, 38, { fill: C.panel, radius: 10 })
    rtl(doc, label, W - M - 14, y + 24, { size: 9, color: C.muted })
    rtl(doc, value, W - M - 240, y + 24, { size: 9.4, bold: true, color: C.white })
    y += 44
  })

  y += 6
  y = sectionLabel(doc, 'مهارت‌ها و سرمایه‌ی انسانی', y)
  card(doc, M, y, CONTENT_W, 24 + Math.max(1, Math.ceil(skills.length / 3)) * 29 + 12, {
    fill: C.panel,
    radius: 14,
  })
  if (skills.length) {
    chips(doc, skills, { x: M + 14, y: y + 16, w: CONTENT_W - 28 })
  } else {
    rtl(doc, 'مهارتی ثبت نشده است.', W - M - 16, y + 32, { size: 9, color: C.faint })
  }
  y += 24 + Math.max(1, Math.ceil(skills.length / 3)) * 29 + 26

  card(doc, M, y, CONTENT_W, 88, { fill: C.panelSoft, radius: 14 })
  rtl(doc, 'ارزش این بخش', W - M - 16, y + 24, { size: 8.6, color: C.gold })
  paragraph(
    doc,
    'مهارت‌ها و زمان آزاد، دو منبعی هستند که بدون پول هم می‌شود رویشان حساب کرد؛ به شرطی که هدفمند و پیوسته خرج شوند.',
    W - M - 16,
    y + 44,
    CONTENT_W - 32,
    { size: 9.2, color: C.muted },
  )
}

function renderGoals(doc, report) {
  const { goal, horizon, constraints, levers } = report
  let y = contentPage(doc, {
    title: 'هدف و فرصت‌های رشد',
    label: 'PAGE 06 — GOALS & GROWTH',
    subtitle: 'مقصدی که انتخاب کردی و مسیرهایی که از پاسخ‌هایت بیرون می‌آید',
  })

  y = sectionLabel(doc, 'هدف ثبت‌شده', y)
  const tileW = (CONTENT_W - 14) / 2
  card(doc, W - M - tileW, y, tileW, 76, { fill: C.panel, radius: 12 })
  rtl(doc, 'هدف اقتصادی', W - M - tileW + 14, y + 26, { size: 8.4, color: C.muted })
  rtl(doc, goal ?? 'ثبت نشده', W - M - 14, y + 54, { size: 12, bold: true, color: C.gold })

  card(doc, M, y, tileW, 76, { fill: C.panel, radius: 12 })
  rtl(doc, 'افق زمانی', M + tileW - 14, y + 26, { size: 8.4, color: C.muted })
  rtl(doc, horizon ?? 'ثبت نشده', M + tileW - 14, y + 54, {
    size: 12,
    bold: true,
    color: C.gold,
  })
  y += 100

  y = sectionLabel(doc, 'محدودیت‌های مشخص‌شده از پاسخ‌ها', y)
  if (constraints.length) {
    y = bullets(doc, constraints, { x: M + 14, y: y + 2, w: CONTENT_W - 28, size: 9.4 })
  } else {
    rtl(doc, 'از پاسخ‌هایت محدودیت بزرگی بیرون نیامد.', W - M - 14, y + 8, {
      size: 9.2,
      color: C.faint,
    })
    y += 26
  }

  y += 10
  y = sectionLabel(doc, 'اهرم‌های رشد', y)
  y = bullets(doc, levers, { x: M + 14, y: y + 2, w: CONTENT_W - 28, size: 9.4 })

  y += 12
  card(doc, M, y, CONTENT_W, 72, { fill: C.panelSoft, radius: 12 })
  rtl(doc, 'یادآوری', W - M - 16, y + 22, { size: 8.4, color: C.gold })
  paragraph(
    doc,
    'این بخش تحلیل ساده‌ای بر پایه‌ی همان پاسخ‌های توست؛ پیش‌بینی قطعی یا وعده‌ی نتیجه نیست.',
    W - M - 16,
    y + 42,
    CONTENT_W - 32,
    { size: 9, color: C.muted },
  )
}

function renderSummary(doc, report) {
  let y = contentPage(doc, {
    title: 'خلاصه‌ی همه‌ی پاسخ‌ها',
    label: 'PAGE 07 — FINAL SUMMARY',
    subtitle: 'هر یازده پاسخ، در یک نگاه',
  })

  y = sectionLabel(doc, 'پاسخ‌های ثبت‌شده', y)

  report.rows.forEach((row, index) => {
    card(doc, M, y, CONTENT_W, 34, { fill: index % 2 === 0 ? C.panel : C.navy, radius: 0 })
    rtl(doc, `${toFaDigits(row.index)}. ${row.short}`, W - M - 12, y + 22, {
      size: 8.8,
      color: C.muted,
    })
    rtl(doc, row.answered ? row.text : 'پاسخ داده نشده', W - M - 200, y + 22, {
      size: 8.8,
      bold: row.answered,
      color: row.answered ? C.white : C.faint,
    })
    y += 34
  })

  y += 22
  y = sectionLabel(doc, 'مشاهدات', y)

  const observations = []
  const { calc, money, goal, horizon, skills } = report
  if (calc.surplus !== null) {
    observations.push(
      calc.surplus >= 0
        ? `ماهانه حدود ${faToman(calc.surplus)} از درآمدت بعد از خرج باقی می‌ماند.`
        : `ماهانه حدود ${faToman(Math.abs(calc.surplus))} بیشتر از درآمدت خرج داری.`,
    )
  }
  if (calc.savingRate !== null) {
    observations.push(
      `نرخ پس‌انداز ماهیانه‌ات حدود ${toFaDigits(Math.round(calc.savingRate * 100))}٪ درآمد است.`,
    )
  }
  if (money.hours !== null) {
    observations.push(
      `هفته‌ای ${toFaDigits(money.hours)} ساعت زمان آزاد داری؛ سالانه معادل ${faNumber(calc.freeHoursYear)} ساعت.`,
    )
  }
  if (goal || horizon) {
    observations.push(
      `هدف ثبت‌شده‌ات «${goal ?? '—'}» با افق زمانی «${horizon ?? '—'}» است.`,
    )
  }
  if (skills.length) {
    observations.push(`حدود ${toFaDigits(skills.length)} مهارت به‌عنوان سرمایه‌ی انسانی انتخاب کرده‌ای.`)
  }

  y = bullets(doc, observations, { x: M + 14, y: y + 2, w: CONTENT_W - 28, size: 9.2 })

  y += 14
  card(doc, M, y, CONTENT_W, 108, { fill: C.panelSoft, radius: 14 })
  rtl(doc, 'نقطه شروع تو', W - M - 16, y + 26, { size: 9, bold: true, color: C.gold })
  paragraph(
    doc,
    'این گزارش تصویری از وضعیت امروز توست: همان چیزی که وارد کردی، بدون هیچ عدد اضافه. قدم بعدی، انتخاب یک حرکت کوچک و تکرارشدنی در همین هفته است.',
    W - M - 16,
    y + 46,
    CONTENT_W - 32,
    { size: 9.4, color: C.white },
  )
}

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */
export async function buildReportPdf(answers) {
  const report = buildReport(answers)
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true })

  await registerFonts(doc)
  doc.setProperties({
    title: 'LEVA — گزارش اختصاصی وضعیت اقتصادی و منابع من',
    subject: 'گزارش اختصاصی LEVA بر پایه پاسخ‌های پرسش‌نامه',
    author: 'LEVA Human Accelerator',
    creator: 'LEVA',
  })

  renderCover(doc)
  renderSnapshot(doc, report)
  renderIncomeExpenses(doc, report)
  renderResources(doc, report)
  renderNonFinancial(doc, report)
  renderGoals(doc, report)
  renderSummary(doc, report)

  const pageCount = doc.getNumberOfPages()
  addFooters(doc, pageCount)

  return { doc, report, pageCount }
}

export async function downloadReportPdf(answers) {
  const { doc } = await buildReportPdf(answers)
  const stamp = new Date().toISOString().slice(0, 10)
  doc.save(`LEVA-Report-${stamp}.pdf`)
}

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
const EN_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

export const toFaDigits = (input) => String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)])

export const toEnDigits = (input) =>
  String(input)
    .replace(/[۰-۹]/g, (d) => String(EN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))

/** 12500000 -> "12,500,000" */
export const groupDigits = (value) => {
  const rounded = Math.round(Number(value) || 0)
  return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** 12500000 -> "۱۲,۵۰۰,۰۰۰" */
export const faNumber = (value) => toFaDigits(groupDigits(value))

/** 12500000 -> "۱۲,۵۰۰,۰۰۰ تومان" */
export const faToman = (value) => `${faNumber(value)} تومان`

/** Short Persian money label for compact UI: "۱۲.۵ میلیون تومان" */
export const faMoneyShort = (value) => {
  const amount = Number(value) || 0
  if (amount <= 0) return '۰ تومان'
  if (amount >= 1_000_000_000) {
    const v = amount / 1_000_000_000
    return `${toFaDigits(trim(v)).replace('.', '٫')} میلیارد تومان`
  }
  if (amount >= 1_000_000) {
    const v = amount / 1_000_000
    return `${toFaDigits(trim(v)).replace('.', '٫')} میلیون تومان`
  }
  if (amount >= 1_000) {
    const v = amount / 1_000
    return `${toFaDigits(trim(v)).replace('.', '٫')} هزار تومان`
  }
  return `${faNumber(amount)} تومان`
}

const trim = (n) => {
  const rounded = Math.round(n * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

/** Parses user typing ("۱۲,۵۰۰,۰۰۰") into 12500000 */
export const parseAmount = (input) => {
  const cleaned = toEnDigits(String(input)).replace(/[^\d]/g, '')
  if (!cleaned) return 0
  return Math.min(Number(cleaned), Number.MAX_SAFE_INTEGER)
}

/** Persian calendar date with Persian digits, e.g. "۹ آبان ۱۴۰۵" */
export const faDate = (date = new Date()) => {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch {
    return toFaDigits(date.toLocaleDateString('en-GB'))
  }
}

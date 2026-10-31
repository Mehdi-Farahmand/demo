import { collectAnswers } from './answers.js'
import { questions } from '../data/questions.js'

const asNumber = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null)

/**
 * Everything the report needs, strictly derived from the user's own answers.
 * `calc` values are computed and always labelled as calculated in the PDF.
 * Nothing here invents a value: a missing answer stays null.
 */
export function buildReport(answers) {
  const rows = collectAnswers(questions, answers)
  const meta = (id) => rows.find((row) => row.id === id) ?? {}

  const income = asNumber(answers.income)
  const expenses = asNumber(answers.expenses)
  const saving = asNumber(answers.saving)
  const capital = asNumber(answers.capital)
  const debt = asNumber(answers.debt)
  const hours = asNumber(answers.hours)

  const calc = {
    surplus: income !== null && expenses !== null ? income - expenses : null,
    annualIncome: income !== null ? income * 12 : null,
    annualExpenses: expenses !== null ? expenses * 12 : null,
    annualSaving: saving !== null ? saving * 12 : null,
    annualDebt: debt !== null ? debt * 12 : null,
    expenseRatio: income && expenses !== null ? expenses / income : null,
    savingRate: income && saving !== null ? saving / income : null,
    debtRatio: income && debt !== null ? debt / income : null,
    runwayMonths: capital !== null && expenses ? capital / expenses : null,
    freeHoursYear: hours !== null ? hours * 52 : null,
  }

  const skills = meta('skills').label ?? []
  const constraints = []
  if (calc.surplus !== null && calc.surplus < 0) {
    constraints.push('جریان نقدی ماهیانه منفی است؛ خرج از درآمد جلو زده.')
  }
  if (calc.debtRatio !== null && calc.debtRatio >= 0.3) {
    constraints.push('بار اقساط بالای ۳۰ درصد درآمد ماهیانه است.')
  }
  if (calc.savingRate !== null && calc.savingRate < 0.1) {
    constraints.push('نرخ پس‌انداز ماهیانه زیر ۱۰ درصد درآمد است.')
  }
  if (hours !== null && hours < 6) {
    constraints.push('زمان آزاد هفتگی محدود است و باید هدفمند خرج شود.')
  }
  if (calc.runwayMonths !== null && calc.runwayMonths < 3) {
    constraints.push('دوام سرمایه در برابر خرج ماهیانه کمتر از ۳ ماه است.')
  }

  const levers = []
  if (hours !== null && hours >= 6) {
    levers.push('هفته‌ای ساعت آزاد داری؛ همین ظرفیت می‌تواند پایه یک مسیر یادگیری منظم باشد.')
  }
  if (skills.length) {
    levers.push('مهارت‌هایی که انتخاب کردی، سرمایه قابل‌فروش تو هستند و می‌توان رویشان درآمد ساخت.')
  }
  if (meta('goal').choice) {
    levers.push('هدف انتخاب‌شده و افق زمانی‌ات، معیار سنجش پیشرفت در ماه‌های بعد است.')
  }
  if (calc.surplus !== null && calc.surplus > 0) {
    levers.push('مانده مثبت ماهیانه، سوخت اصلی ساختن سرمایه است.')
  }

  return {
    rows,
    money: { income, expenses, saving, capital, debt, hours },
    calc,
    skills,
    constraints,
    levers,
    employment: meta('employment').choice ?? null,
    energy: meta('energy').choice ?? null,
    goal: meta('goal').choice ?? null,
    horizon: meta('horizon').choice ?? null,
  }
}

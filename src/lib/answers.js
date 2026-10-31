import {
  faToman,
  toFaDigits,
} from './format.js'
import { optionLabel } from '../data/questions.js'

export const isAnswered = (question, value) => {
  if (!question) return false
  if (question.kind === 'currency' || question.kind === 'hours') return typeof value === 'number'
  if (question.kind === 'multi') return Array.isArray(value) && value.length > 0
  return Boolean(value)
}

export const answerText = (question, value) => {
  if (!question) return '—'
  if (!isAnswered(question, value)) return 'پاسخ داده نشده'
  switch (question.kind) {
    case 'currency':
      return faToman(value)
    case 'hours':
      return `${toFaDigits(value)} ${question.unit}`
    case 'choice':
      return optionLabel(question, value) ?? '—'
    case 'multi':
      return value
        .map((item) => optionLabel(question, item))
        .filter(Boolean)
        .join('، ')
    default:
      return String(value)
  }
}

/** Flat, report-friendly list of the user's own answers. */
export const collectAnswers = (questions, answers) =>
  questions.map((question, index) => ({
    index: index + 1,
    id: question.id,
    question: question.title,
    short: question.short,
    group: question.reportGroup,
    kind: question.kind,
    value: answers[question.id],
    answered: isAnswered(question, answers[question.id]),
    text: answerText(question, answers[question.id]),
    label: question.kind === 'multi'
      ? (answers[question.id] || [])
          .map((item) => optionLabel(question, item))
          .filter(Boolean)
      : undefined,
    choice: question.kind === 'choice' ? optionLabel(question, answers[question.id]) : undefined,
  }))

import { useState } from 'react'
import LevaLogo from './LevaLogo.jsx'
import { faToman } from '../lib/format.js'
import { downloadReportPdf } from '../lib/reportPdf.js'

export default function CompletionPanel({ answers, onEdit }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const hasNumbers = typeof answers.income === 'number' && typeof answers.expenses === 'number'
  const surplus = hasNumbers ? answers.income - answers.expenses : null

  const handleDownload = async () => {
    setBusy(true)
    setError(null)
    try {
      await downloadReportPdf(answers)
    } catch (cause) {
      console.error('report generation failed', cause)
      setError('ساخت گزارش انجام نشد. یه بار دیگه امتحان کن.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="done">
      <LevaLogo tone="gold" size="sm" />

      <h2 className="done__headline">تصویر اقتصادی تو آماده‌ست!</h2>
      <p className="done__text">
        حالا می‌تونی تمام اطلاعاتی که وارد کردی رو در قالب یک گزارش اختصاصی دریافت کنی و نقطه
        شروع مسیر رشد اقتصادی خودت رو بهتر بشناسی.
      </p>

      {hasNumbers && (
        <div className="done__summary">
          <div className="done__stat">
            <span className="done__stat-label">درآمد ماهیانه</span>
            <span className="done__stat-value">{faToman(answers.income)}</span>
          </div>
          <div className="done__stat">
            <span className="done__stat-label">خرج ماهیانه</span>
            <span className="done__stat-value">{faToman(answers.expenses)}</span>
          </div>
          <div className="done__stat">
            <span className="done__stat-label">مانده ماهانه (محاسبه‌شده)</span>
            <span className="done__stat-value">{faToman(surplus)}</span>
          </div>
        </div>
      )}

      {error && <p className="done__error">{error}</p>}

      <div className="done__actions">
        <button
          type="button"
          className="btn btn--gold btn--lg"
          onClick={handleDownload}
          disabled={busy}
        >
          {busy ? 'در حال ساخت گزارش…' : error ? 'تلاش دوباره برای دریافت گزارش (PDF)' : 'دریافت گزارش اختصاصی من (PDF)'}
        </button>
        <button type="button" className="done__link" onClick={onEdit}>
          ویرایش پاسخ‌ها
        </button>
      </div>
    </div>
  )
}

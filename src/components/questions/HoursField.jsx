import { toFaDigits } from '../../lib/format.js'

/** Weekly free hours: slider only. */
export default function HoursField({ question, value, onChange }) {
  const current = typeof value === 'number' ? value : 0

  return (
    <div className="field">
      <div className="field__box">
        <input
          className="field__input"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={typeof value === 'number' ? toFaDigits(value) : ''}
          placeholder="تعداد ساعت"
          aria-label={question.title}
          onChange={(event) => {
            const digits = event.target.value.replace(/[^\d۰-۹]/g, '')
            const parsed = Number(digits.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))))
            onChange(Number.isFinite(parsed) ? Math.min(question.max, parsed) : 0)
          }}
        />
        <span className="field__unit">{question.unit}</span>
      </div>

      <input
        className="slider"
        type="range"
        min={0}
        max={question.max}
        step={question.step}
        value={current}
        aria-label={`${question.title} — اسلایدر`}
        onChange={(event) => onChange(Number(event.target.value))}
      />

      <div className="slider__scale">
        <span>سقف: {toFaDigits(question.max)} {question.unit}</span>
        <strong>
          {typeof value === 'number' ? `${toFaDigits(value)} ${question.unit}` : 'هنوز ساعتی انتخاب نشده'}
        </strong>
      </div>
    </div>
  )
}

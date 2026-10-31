import { faNumber, faMoneyShort, parseAmount } from '../../lib/format.js'

/** Money answer: typed amount kept in sync with a slider, both in Toman. */
export default function CurrencyField({ question, value, onChange }) {
  const current = typeof value === 'number' ? value : 0

  const handleInput = (event) => {
    const next = Math.min(question.max, parseAmount(event.target.value))
    onChange(next)
  }

  return (
    <div className="field">
      <div className="field__box">
        <input
          className="field__input"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          dir="rtl"
          value={typeof value === 'number' ? faNumber(value) : ''}
          placeholder={question.placeholder}
          aria-label={question.title}
          onChange={handleInput}
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
        <span>سقف: {faMoneyShort(question.max)}</span>
        <strong>{typeof value === 'number' ? faMoneyShort(value) : 'هنوز مبلغی انتخاب نشده'}</strong>
      </div>

      <button type="button" className="field__zero" onClick={() => onChange(0)}>
        بدون مبلغ (۰ تومان)
      </button>
    </div>
  )
}

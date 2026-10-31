import { toFaDigits } from '../lib/format.js'
import { answerText } from '../lib/answers.js'

export default function ReviewStep({ questions, answers, onEdit, onSubmit }) {
  return (
    <div className="review">
      <p className="review__title">مرور پاسخ‌ها</p>
      <p className="review__lead">یه بار همه‌چیز رو چک کن؛ هر پاسخ رو می‌تونی ویرایش کنی.</p>

      <div className="review__list">
        {questions.map((question, index) => (
          <div className="review__row" key={question.id}>
            <span className="review__label">
              {toFaDigits(index + 1)}. {question.short}
            </span>
            <span className="review__value">{answerText(question, answers[question.id])}</span>
            <button type="button" className="review__edit" onClick={() => onEdit(index)}>
              ویرایش
            </button>
          </div>
        ))}
      </div>

      <div className="quiz__nav">
        <button type="button" className="btn btn--ghost" onClick={() => onEdit(questions.length - 1)}>
          قبلی
        </button>
        <button type="button" className="btn btn--gold" onClick={onSubmit}>
          ارسال و ساخت گزارش
        </button>
      </div>
    </div>
  )
}

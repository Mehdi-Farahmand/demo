import { useRef, useState } from 'react'
import LevaLogo from './LevaLogo.jsx'
import ProgressBar from './ProgressBar.jsx'
import ReviewStep from './ReviewStep.jsx'
import CompletionPanel from './CompletionPanel.jsx'
import CurrencyField from './questions/CurrencyField.jsx'
import HoursField from './questions/HoursField.jsx'
import ChoiceField from './questions/ChoiceField.jsx'
import MultiField from './questions/MultiField.jsx'
import { questions, TOTAL_STEPS } from '../data/questions.js'
import { isAnswered } from '../lib/answers.js'
import { toFaDigits } from '../lib/format.js'

function Field({ question, value, onChange }) {
  switch (question.kind) {
    case 'currency':
      return <CurrencyField question={question} value={value} onChange={onChange} />
    case 'hours':
      return <HoursField question={question} value={value} onChange={onChange} />
    case 'choice':
      return <ChoiceField question={question} value={value} onChange={onChange} />
    case 'multi':
      return <MultiField question={question} value={value} onChange={onChange} />
    default:
      return null
  }
}

export default function Questionnaire({ answers, onAnswer }) {
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState('questions')
  const cardRef = useRef(null)

  const question = questions[step]
  const value = answers[question.id]
  const answered = isAnswered(question, value)
  const isLast = step === TOTAL_STEPS - 1

  const scrollCardIntoView = () => {
    const element = cardRef.current
    if (!element) return
    const { top } = element.getBoundingClientRect()
    if (top < 0 || top > window.innerHeight * 0.4) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const goNext = () => {
    if (!answered) return
    if (isLast) {
      setPhase('review')
    } else {
      setStep((current) => current + 1)
    }
    scrollCardIntoView()
  }

  const goBack = () => {
    if (step === 0) return
    setStep((current) => current - 1)
    scrollCardIntoView()
  }

  const handleSubmit = () => {
    setPhase('done')
    scrollCardIntoView()
  }

  const handleEdit = (index) => {
    setStep(index)
    setPhase('questions')
    scrollCardIntoView()
  }

  return (
    <div className="quiz">
      <div className="quiz__bg" aria-hidden="true" />
      <div className="quiz__scrim" aria-hidden="true" />

      <div className="quiz__card glass" ref={cardRef}>
        <div className="quiz__head">
          {phase !== 'done' && <LevaLogo tone="gold" size="sm" />}
          {phase === 'questions' && (
            <>
              <ProgressBar total={TOTAL_STEPS} current={step} />
              <p className="quiz__counter">
                سؤال {toFaDigits(step + 1)} از {toFaDigits(TOTAL_STEPS)}
              </p>
            </>
          )}
        </div>

        {phase === 'questions' && (
          <>
            <div className="quiz__body">
              <h2 className="quiz__question">{question.title}</h2>
              {question.hint && <p className="quiz__hint">{question.hint}</p>}
              <Field
                question={question}
                value={value}
                onChange={(nextValue) => onAnswer(question.id, nextValue)}
              />
            </div>

            <div className="quiz__nav">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={goBack}
                disabled={step === 0}
              >
                قبلی
              </button>
              <button type="button" className="btn btn--gold" onClick={goNext} disabled={!answered}>
                {isLast ? 'مرور پاسخ‌ها' : 'بعدی'}
              </button>
            </div>
          </>
        )}

        {phase === 'review' && (
          <ReviewStep
            questions={questions}
            answers={answers}
            onEdit={handleEdit}
            onSubmit={handleSubmit}
          />
        )}

        {phase === 'done' && <CompletionPanel answers={answers} onEdit={() => setPhase('review')} />}
      </div>
    </div>
  )
}

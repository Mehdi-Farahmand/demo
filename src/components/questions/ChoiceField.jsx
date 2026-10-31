/** Single-choice answer rendered as pill options. */
export default function ChoiceField({ question, value, onChange }) {
  return (
    <div className="options" role="radiogroup" aria-label={question.title}>
      {question.options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className={`option ${value === option.value ? 'is-selected' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/** Multi-choice answer rendered as pill options. */
export default function MultiField({ question, value, onChange }) {
  const selected = Array.isArray(value) ? value : []

  const toggle = (optionValue) => {
    onChange(
      selected.includes(optionValue)
        ? selected.filter((item) => item !== optionValue)
        : [...selected, optionValue],
    )
  }

  return (
    <div className="options" role="group" aria-label={question.title}>
      {question.options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={selected.includes(option.value)}
          className={`option ${selected.includes(option.value) ? 'is-selected' : ''}`}
          onClick={() => toggle(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

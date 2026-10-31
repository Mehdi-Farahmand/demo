export default function ProgressBar({ total, current }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current + 1}
      aria-label={`سؤال ${current + 1} از ${total}`}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={[
            'progress__seg',
            index < current ? 'is-done' : '',
            index === current ? 'is-current' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />
      ))}
    </div>
  )
}

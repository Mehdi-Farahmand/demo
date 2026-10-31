/**
 * LEVA brand mark: a slanted beam balanced on a small triangular fulcrum,
 * followed by the LEVA wordmark and the HUMAN ACCELERATOR tagline.
 */
export default function LevaLogo({ tone = 'gold', size = 'md', tagline = true, className = '' }) {
  return (
    <div className={`leva leva--${size} leva--${tone} ${className}`.trim()}>
      <svg className="leva__mark" viewBox="0 0 48 48" role="img" aria-label="LEVA">
        <path d="M9 30 39 12" className="leva__beam" />
        <path d="M24 25 34 41 14 41Z" className="leva__pivot" />
      </svg>
      <div className="leva__words">
        <span className="leva__name latin">LEVA</span>
        {tagline && <span className="leva__tag latin">HUMAN ACCELERATOR</span>}
      </div>
    </div>
  )
}

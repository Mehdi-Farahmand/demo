import LevaLogo from '../LevaLogo.jsx'

function ArrowIcon() {
  return (
    <svg className="btn__arrow" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20 12H5m0 0 6-6m-6 6 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function HeroStage({ onStart }) {
  return (
    <div className="hero">
      <div className="hero__bg" aria-hidden="true" />
      <div className="hero__scrim" aria-hidden="true" />

      <header className="hero__header glass">
        <div className="hero__brand">
          <LevaLogo tone="white" size="sm" tagline={false} />
        </div>

        <nav className="hero__nav" aria-label="ناوبری اصلی">
          <a href="#intro" onClick={(e) => e.preventDefault()}>
            طراحی مسیر من
          </a>
          <a href="#course" onClick={(e) => e.preventDefault()}>
            مسیر دوره
          </a>
          <a href="#workshop" onClick={(e) => e.preventDefault()}>
            شرکت در ورکشاپ
          </a>
        </nav>

        <div className="hero__pills">
          <span className="pill pill--navy">آینده‌دار شدن</span>
          <span className="pill pill--gold">ورکشاپ مسیر</span>
        </div>
      </header>

      <div className="hero__center">
        <LevaLogo tone="white" size="lg" />
        <p className="hero__subtitle">مدرسه رشد و شتاب‌دهنده آموزشی</p>
        <p className="hero__en latin">Learn / Build / Grow</p>
      </div>

      <div className="hero__cta glass">
        <p className="hero__cta-text">قراره خودمون رو بهتر بشناسیم و مسیرمون رو بهتر بسازیم</p>
        <button type="button" className="btn btn--gold hero__cta-btn" onClick={onStart}>
          <ArrowIcon />
          بزن بریم تو کارش
        </button>
      </div>
    </div>
  )
}

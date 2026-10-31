import LevaLogo from '../LevaLogo.jsx'

export default function IntroStage({ onStart }) {
  return (
    <div className="intro">
      <div className="intro__bg" aria-hidden="true" />
      <div className="intro__scrim" aria-hidden="true" />

      <div className="card card--intro glass">
        <LevaLogo tone="gold" size="md" />
        <div className="intro__copy">
          <p className="intro__line intro__line--lead">سلام بهت رفیق</p>
          <p className="intro__line">
            در ادامه به چند تا سؤال که ازت پرسیده می‌شه پاسخ بده تا بتونیم با هم بهترین مسیر
            رشدتو طراحی کنیم.
          </p>
        </div>
        <button type="button" className="btn btn--gold btn--lg" onClick={onStart}>
          بزن بریم تو کارش
        </button>
      </div>
    </div>
  )
}

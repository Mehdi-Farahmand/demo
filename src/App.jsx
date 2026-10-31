import { useCallback, useRef, useState } from 'react'
import HeroStage from './components/stages/HeroStage.jsx'
import IntroStage from './components/stages/IntroStage.jsx'
import Questionnaire from './components/Questionnaire.jsx'
import './styles/base.css'
import './styles/stages.css'
import './styles/questionnaire.css'

export default function App() {
  const introRef = useRef(null)
  const quizRef = useRef(null)
  const [answers, setAnswers] = useState({})

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleAnswer = useCallback((id, value) => {
    setAnswers((previous) => ({ ...previous, [id]: value }))
  }, [])

  return (
    <main className="app">
      {/* Stage 01 — hero with header (header lives only here) */}
      <section className="stage" id="hero">
        <HeroStage onStart={() => scrollTo(introRef)} />
      </section>

      {/* Stage 02 — introduction, no header */}
      <section className="stage" id="intro" ref={introRef}>
        <IntroStage onStart={() => scrollTo(quizRef)} />
      </section>

      {/* Stage 03 — questionnaire, review, report */}
      <section className="stage" id="questionnaire" ref={quizRef}>
        <Questionnaire answers={answers} onAnswer={handleAnswer} />
      </section>
    </main>
  )
}

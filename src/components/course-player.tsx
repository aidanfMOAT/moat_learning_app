'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { SlideContent } from './slide-content';

// ── Types ───────────────────────────────────────────────────────────

type Module = {
  id: string;
  title: string;
  order: number;
  lessonText: string;
  resourceUrl: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
};

type Question = {
  id: string;
  question: string;
  type: string;
  options: string[];
  order: number;
};

type Progress = {
  status: string;
  bestQuizScore: number | null;
  latestQuizScore: number | null;
  quizAttemptCount: number;
} | null;

type QuizResult = { score: number; passed: boolean; attemptsRemaining: number | null };

export type CoursePlayerProps = {
  course: {
    id: string;
    title: string;
    description: string;
    quizRequirement: string;
    passMarkPercent: number | null;
    maxQuizAttempts: number | null;
    requiresAcknowledgement: boolean;
  };
  modules: Module[];
  questions: Question[];
  initialProgress: Progress;
  markStarted: () => Promise<void>;
  submitQuizForResult: (
    courseId: string,
    answers: { questionId: string; answer: string }[]
  ) => Promise<QuizResult>;
  completeCourse: (fd: FormData) => Promise<void>;
};

// ── Slide model ─────────────────────────────────────────────────────

type IntroSlide = { type: 'intro' };
type ModuleSlide = {
  type: 'module';
  module: Module;
  section: string;
  sectionIndex: number;
  totalSections: number;
  isFirst: boolean;
  isLast: boolean;
};
type RecapSlide = { type: 'recap' };
type QuizSlide = { type: 'quiz'; question: Question; questionIndex: number; totalQuestions: number };
type ResultSlide = { type: 'result' };
type CompleteSlide = { type: 'complete' };

type Slide = IntroSlide | ModuleSlide | RecapSlide | QuizSlide | ResultSlide | CompleteSlide;

// ── TTS helper ──────────────────────────────────────────────────────

function speak(text: string, onEnd: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.onend = onEnd;
  window.speechSynthesis.speak(utt);
}

function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// ── Slide sub-components ─────────────────────────────────────────────

function IntroSlide({
  course,
  moduleCount,
  onStart,
}: {
  course: CoursePlayerProps['course'];
  moduleCount: number;
  onStart: () => void;
}) {
  return (
    <div style={{ padding: '1rem 0' }}>
      <div className="slide-hero" style={{ marginBottom: '2rem' }}>
        <span className="slide-hero-placeholder">📚</span>
      </div>
      <div className="slide-module-label">Learning Journey</div>
      <h1 className="slide-section-heading" style={{ fontSize: '1.9rem' }}>
        {course.title}
      </h1>
      <div className="slide-body">
        <p>{course.description}</p>
      </div>
      <div className="intro-meta">
        <span>📖 {moduleCount} modules</span>
        {course.quizRequirement !== 'OFF' && (
          <span>✅ Quiz included · {course.passMarkPercent ?? 80}% to pass</span>
        )}
        {course.requiresAcknowledgement && <span>🖊 Acknowledgement required</span>}
      </div>
      <button className="intro-start" onClick={onStart}>
        Start Learning →
      </button>
    </div>
  );
}

function ModuleSlideView({
  slide,
  speaking,
  onListen,
  onStopListen,
}: {
  slide: ModuleSlide;
  speaking: boolean;
  onListen: (text: string) => void;
  onStopListen: () => void;
}) {
  const { module: mod, section, sectionIndex, totalSections, isFirst, isLast } = slide;

  // Plain text for TTS (strip markdown-like formatting)
  const ttsText = section.replace(/^[-,]\s+/gm, '').replace(/^\d+\.\s+/gm, '');

  return (
    <div>
      {isFirst && mod.imageUrl && (
        <div className="slide-hero">
          <Image src={mod.imageUrl} alt={mod.title} fill style={{ objectFit: 'cover' }} />
        </div>
      )}
      {isFirst && !mod.imageUrl && (
        <div className="slide-hero">
          <span className="slide-hero-placeholder">🎓</span>
        </div>
      )}
      <div className="slide-module-label">
        Module {mod.order} · Slide {sectionIndex + 1} of {totalSections}
      </div>
      {isFirst && (
        <h2 className="slide-section-heading" style={{ fontSize: '1.7rem', marginBottom: '1.25rem' }}>
          {mod.title}
        </h2>
      )}
      <SlideContent text={section} />
      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
        <button
          className={`btn-tts${speaking ? ' active' : ''}`}
          onClick={() => (speaking ? onStopListen() : onListen(ttsText))}
        >
          {speaking ? '⏹ Stop' : '🔊 Listen'}
        </button>
      </div>
      {isLast && (mod.resourceUrl || mod.videoUrl) && (
        <div className="slide-links" style={{ marginTop: '1.5rem' }}>
          {mod.resourceUrl && (
            <a href={mod.resourceUrl} target="_blank" rel="noopener noreferrer" className="slide-link">
              📎 Resource
            </a>
          )}
          {mod.videoUrl && (
            <a href={mod.videoUrl} target="_blank" rel="noopener noreferrer" className="slide-link">
              🎬 Video
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function RecapSlideView({ modules }: { modules: Module[] }) {
  return (
    <div>
      <div className="slide-module-label">Almost there</div>
      <h2 className="slide-section-heading" style={{ fontSize: '1.7rem' }}>
        Key Takeaways
      </h2>
      <div className="slide-body">
        <p>Here's a summary of what you've covered in this course:</p>
      </div>
      <ul className="recap-list">
        {modules.map((mod, i) => {
          const firstLine = mod.lessonText.split('\n').find((l) => l.trim()) ?? mod.title;
          return (
            <li key={mod.id}>
              <span className="recap-num">{i + 1}</span>
              <span>
                <strong>{mod.title}</strong> — {firstLine.trim()}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function QuizSlideView({
  slide,
  selected,
  onSelect,
}: {
  slide: QuizSlide;
  selected: string;
  onSelect: (val: string) => void;
}) {
  const { question: q, questionIndex, totalQuestions } = slide;
  const options = q.type === 'TRUE_FALSE' ? ['True', 'False'] : q.options;

  return (
    <div>
      <div className="quiz-context">
        Quiz · Question {questionIndex + 1} of {totalQuestions}
      </div>
      <p className="quiz-question">{q.question}</p>
      <div className="quiz-options">
        {options.map((opt) => (
          <button
            key={opt}
            className={`quiz-option${selected === opt ? ' selected' : ''}`}
            onClick={() => onSelect(opt)}
          >
            <span className="quiz-option-marker" />
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultSlideView({
  result,
  passMark,
  maxAttempts,
  attemptCount,
  onRetake,
  onComplete,
  completing,
}: {
  result: QuizResult;
  passMark: number;
  maxAttempts: number | null;
  attemptCount: number;
  onRetake: () => void;
  onComplete: () => void;
  completing: boolean;
}) {
  const canRetake =
    !result.passed && (result.attemptsRemaining === null || result.attemptsRemaining > 0);

  return (
    <div className="result-center">
      <div className={`result-score-ring${result.passed ? ' pass' : ' fail'}`}>
        <span className="result-score-value">{result.score}%</span>
        <span className="result-score-label">Your score</span>
      </div>
      <span className={result.passed ? 'badge-pass' : 'badge-fail'}>
        {result.passed ? '✓ Passed' : '✗ Not yet'}
      </span>
      <div className="slide-body" style={{ textAlign: 'center' }}>
        {result.passed ? (
          <p>Well done! You scored {result.score}% — above the {passMark}% pass mark.</p>
        ) : (
          <p>
            You scored {result.score}%. You need {passMark}% to pass.
            {canRetake
              ? ` You have ${result.attemptsRemaining === null ? 'unlimited' : result.attemptsRemaining} attempt${result.attemptsRemaining === 1 ? '' : 's'} remaining.`
              : ' No more attempts remaining.'}
          </p>
        )}
      </div>
      <div className="result-actions">
        {canRetake && (
          <button className="btn-ghost" onClick={onRetake}>
            Retake Quiz
          </button>
        )}
        {result.passed && (
          <button onClick={onComplete} disabled={completing}>
            {completing ? 'Saving…' : 'Complete Course ✓'}
          </button>
        )}
      </div>
    </div>
  );
}

function CompleteSlideView({
  requiresAcknowledgement,
  onComplete,
  completing,
}: {
  requiresAcknowledgement: boolean;
  onComplete: (fd: FormData) => void;
  completing: boolean;
}) {
  const ackText = 'I acknowledge I have read and understood this course material';
  return (
    <div className="result-center">
      <span style={{ fontSize: '3rem' }}>🎉</span>
      <h2 className="slide-section-heading">You've completed the course!</h2>
      <div className="slide-body" style={{ textAlign: 'center' }}>
        <p>You've worked through all the content. Mark it complete to record your progress.</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          onComplete(fd);
        }}
      >
        {requiresAcknowledgement && (
          <label style={{ display: 'flex', gap: '.6rem', alignItems: 'flex-start', marginBottom: '1rem', textAlign: 'left' }}>
            <input type="checkbox" name="acknowledgement" value={ackText} required style={{ width: 'auto', marginTop: '.2rem' }} />
            <span style={{ fontSize: '.9rem' }}>{ackText}</span>
          </label>
        )}
        <button type="submit" disabled={completing}>
          {completing ? 'Saving…' : 'Mark Complete ✓'}
        </button>
      </form>
    </div>
  );
}

// ── Main Player ──────────────────────────────────────────────────────

export function CoursePlayer({
  course,
  modules,
  questions,
  initialProgress,
  markStarted,
  submitQuizForResult,
  completeCourse,
}: CoursePlayerProps) {
  const hasQuiz = course.quizRequirement !== 'OFF';

  // Build the full slide list
  const slides = useMemo<Slide[]>(() => {
    const list: Slide[] = [{ type: 'intro' }];

    for (const mod of modules) {
      const sections = mod.lessonText.split('\n\n').filter((s) => s.trim());
      sections.forEach((section, i) => {
        list.push({
          type: 'module',
          module: mod,
          section,
          sectionIndex: i,
          totalSections: sections.length,
          isFirst: i === 0,
          isLast: i === sections.length - 1,
        });
      });
    }

    list.push({ type: 'recap' });

    if (hasQuiz) {
      questions.forEach((q, i) => {
        list.push({ type: 'quiz', question: q, questionIndex: i, totalQuestions: questions.length });
      });
      list.push({ type: 'result' });
    } else {
      list.push({ type: 'complete' });
    }

    return list;
  }, [modules, questions, hasQuiz]);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const current = slides[step];
  const progress = step === 0 ? 0 : Math.round((step / (slides.length - 1)) * 100);

  // Step label for topbar
  const stepLabel = useMemo(() => {
    if (current.type === 'intro') return 'Introduction';
    if (current.type === 'module') return `Module ${current.module.order} · ${current.module.title}`;
    if (current.type === 'recap') return 'Key Takeaways';
    if (current.type === 'quiz') return `Quiz · Q${current.questionIndex + 1} of ${current.totalQuestions}`;
    if (current.type === 'result') return 'Your Results';
    return 'Complete';
  }, [current]);

  const handleListen = useCallback((text: string) => {
    setSpeaking(true);
    speak(text, () => setSpeaking(false));
  }, []);

  const handleStopListen = useCallback(() => {
    stopSpeaking();
    setSpeaking(false);
  }, []);

  const goTo = useCallback((n: number) => {
    stopSpeaking();
    setSpeaking(false);
    setStep(n);
  }, []);

  const handleNext = useCallback(async () => {
    // Last quiz question → submit
    if (current.type === 'quiz' && current.questionIndex === current.totalQuestions - 1) {
      setSubmitting(true);
      try {
        const answerList = questions.map((q) => ({ questionId: q.id, answer: answers[q.id] ?? '' }));
        const result = await submitQuizForResult(course.id, answerList);
        setQuizResult(result);
        goTo(step + 1);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Intro → mark started
    if (current.type === 'intro') {
      if (!initialProgress) await markStarted();
    }

    goTo(step + 1);
  }, [current, step, questions, answers, course.id, initialProgress, markStarted, submitQuizForResult, goTo]);

  const handleRetake = useCallback(() => {
    setAnswers({});
    setQuizResult(null);
    // Jump back to first quiz slide
    const firstQuizIdx = slides.findIndex((s) => s.type === 'quiz');
    if (firstQuizIdx >= 0) goTo(firstQuizIdx);
  }, [slides, goTo]);

  const handleComplete = useCallback(async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      await completeCourse(fd);
    } finally {
      setSubmitting(false);
    }
  }, [completeCourse]);

  const handleCompleteWithForm = useCallback(async (fd: FormData) => {
    setSubmitting(true);
    try {
      await completeCourse(fd);
    } finally {
      setSubmitting(false);
    }
  }, [completeCourse]);

  // Can we go next?
  const nextDisabled = useMemo(() => {
    if (submitting) return true;
    if (current.type === 'quiz' && !answers[current.question.id]) return true;
    if (current.type === 'result' || current.type === 'complete') return true;
    return false;
  }, [current, answers, submitting]);

  const nextLabel = useMemo(() => {
    if (submitting) return 'Saving…';
    if (current.type === 'intro') return 'Start Learning →';
    if (current.type === 'quiz' && current.questionIndex === current.totalQuestions - 1) return 'Submit Quiz';
    if (current.type === 'recap' && !hasQuiz) return 'Finish';
    return 'Next →';
  }, [current, submitting, hasQuiz]);

  return (
    <div className="player-shell">
      {/* Progress bar */}
      <div className="player-progress-track">
        <div className="player-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Top bar */}
      <div className="player-topbar">
        <span>{stepLabel}</span>
        <span className="nav-step">{step} / {slides.length - 1}</span>
      </div>

      {/* Slide content */}
      <div className="player-content">
        <div className="player-slide">
          {current.type === 'intro' && (
            <IntroSlide course={course} moduleCount={modules.length} onStart={handleNext} />
          )}
          {current.type === 'module' && (
            <ModuleSlideView
              slide={current}
              speaking={speaking}
              onListen={handleListen}
              onStopListen={handleStopListen}
            />
          )}
          {current.type === 'recap' && <RecapSlideView modules={modules} />}
          {current.type === 'quiz' && (
            <QuizSlideView
              slide={current}
              selected={answers[current.question.id] ?? ''}
              onSelect={(val) => setAnswers((prev) => ({ ...prev, [current.question.id]: val }))}
            />
          )}
          {current.type === 'result' && quizResult && (
            <ResultSlideView
              result={quizResult}
              passMark={course.passMarkPercent ?? 80}
              maxAttempts={course.maxQuizAttempts}
              attemptCount={0}
              onRetake={handleRetake}
              onComplete={handleComplete}
              completing={submitting}
            />
          )}
          {current.type === 'complete' && (
            <CompleteSlideView
              requiresAcknowledgement={course.requiresAcknowledgement}
              onComplete={handleCompleteWithForm}
              completing={submitting}
            />
          )}
        </div>
      </div>

      {/* Bottom nav (hidden on intro, result, complete) */}
      {current.type !== 'intro' && current.type !== 'result' && current.type !== 'complete' && (
        <div className="player-nav">
          <button className="btn-ghost" onClick={() => goTo(step - 1)} disabled={step === 0}>
            ← Back
          </button>
          <span className="nav-step">
            {step} of {slides.length - 1}
          </span>
          <button onClick={handleNext} disabled={nextDisabled}>
            {nextLabel}
          </button>
        </div>
      )}
    </div>
  );
}

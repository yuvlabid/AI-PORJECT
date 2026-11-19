import { CheckCircle2, Layers, RotateCcw, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { scoreQuizSubmissions } from '../lib/recallLogic';
import type { QuizSubmission, RecallDeck } from '../lib/types';

interface QuizRunnerProps {
  deck: RecallDeck | null;
  onGoToStudio: () => void;
  onGoToRecall: () => void;
  onConvertMissedToFlashcards: (missedQuestionIds: string[]) => void;
}

export function QuizRunner({
  deck,
  onGoToStudio,
  onGoToRecall,
  onConvertMissedToFlashcards,
}: QuizRunnerProps) {
  const [submissions, setSubmissions] = useState<Record<string, QuizSubmission>>({});
  const [convertedOnce, setConvertedOnce] = useState(false);

  const questions = deck?.quizQuestions ?? [];
  const score = useMemo(
    () => scoreQuizSubmissions(questions, submissions),
    [questions, submissions]
  );

  if (!deck) {
    return (
      <section className="mac-glass mx-auto max-w-2xl rounded-3xl p-10 text-center space-y-4">
        <h2 className="font-display text-2xl font-bold text-slate-900">
          No Quiz Loaded Yet
        </h2>
        <p className="text-sm leading-relaxed text-slate-700">
          Create a quiz in the Studio or open a sample deck to test what you know.
        </p>
        <button
          type="button"
          onClick={onGoToStudio}
          className="mac-btn-primary inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold"
        >
          Go to Studio
        </button>
      </section>
    );
  }

  if (questions.length === 0) {
    return (
      <section className="mac-glass mx-auto max-w-2xl rounded-3xl p-10 text-center space-y-4">
        <h2 className="font-display text-2xl font-bold text-slate-900">
          This deck only has flashcards
        </h2>
        <p className="text-sm text-slate-700">
          Switch to Flashcards to study the {deck.flashcards.length} cards in {deck.title}.
        </p>
        <button
          type="button"
          onClick={onGoToRecall}
          className="mac-btn-primary inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold"
        >
          Open Flashcards
        </button>
      </section>
    );
  }

  const allAnswered = score.answeredCount === questions.length;

  return (
    <section aria-labelledby="quiz-heading" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-white/60 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-[#005BB5]">
            {deck.syllabus} · {deck.rigor} · Practice Quiz
          </p>
          <h1
            id="quiz-heading"
            className="font-display text-2xl font-bold text-slate-900 sm:text-3xl"
          >
            {deck.title}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-slate-600">Score</p>
            <p className="font-mono text-lg font-semibold text-[#005BB5] tabular-nums">
              {score.correctCount} / {questions.length} ({score.accuracyPercent}%)
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSubmissions({});
              setConvertedOnce(false);
            }}
            className="mac-glass-subtle inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-white/90"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Retake Quiz</span>
          </button>
        </div>
      </div>

      {/* End-of-Quiz Action Banner */}
      {allAnswered && (
        <div className="mac-glass flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Quiz Complete — {score.accuracyPercent}%
            </h2>
            <p className="text-sm text-slate-700">
              {score.missedQuestionIds.length === 0
                ? 'Great job — you answered every question right.'
                : `You missed ${score.missedQuestionIds.length} question(s). Turn them into flashcards to practice again.`}
            </p>
          </div>

          {score.missedQuestionIds.length > 0 && (
            <button
              type="button"
              disabled={convertedOnce}
              onClick={() => {
                onConvertMissedToFlashcards(score.missedQuestionIds);
                setConvertedOnce(true);
              }}
              className="mac-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              <Layers className="h-4 w-4" aria-hidden="true" />
              <span>
                {convertedOnce
                  ? 'Added to Flashcards'
                  : `Add ${score.missedQuestionIds.length} Missed to Flashcards`}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Question List */}
      <div className="space-y-6">
        {questions.map((question, qIndex) => {
          const submission = submissions[question.id];
          const isAnswered = Boolean(submission);

          return (
            <article
              key={question.id}
              className="mac-glass rounded-3xl p-5 sm:p-6 space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/60 pb-3">
                <div className="text-xs font-medium text-slate-600">
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    Q{qIndex + 1}
                  </span>
                  <span aria-hidden="true"> · </span>
                  <span className="font-semibold text-slate-900">{question.concept}</span>
                  <span aria-hidden="true"> · </span>
                  <span className="text-[#005BB5]">{question.mechanism}</span>
                </div>
                <span className="text-xs text-slate-500">{question.syllabusTag}</span>
              </div>

              <p className="text-base font-medium leading-relaxed text-slate-900 sm:text-lg">
                {question.scenarioPrompt}
              </p>

              {/* Options */}
              <div className="space-y-2.5">
                {question.options.map((optionText, optIndex) => {
                  const isSelected = submission?.selectedOptionIndex === optIndex;
                  const isCorrectOption = optIndex === question.correctIndex;

                  let buttonStyle =
                    'border-white/80 bg-white/55 text-slate-800 hover:border-[#0063D1]/45 hover:bg-blue-50/60';

                  if (isAnswered) {
                    if (isCorrectOption) {
                      buttonStyle =
                        'border-emerald-300 bg-emerald-50/85 text-emerald-950';
                    } else if (isSelected) {
                      buttonStyle = 'border-red-300 bg-red-50/85 text-red-950';
                    } else {
                      buttonStyle = 'border-white/60 bg-white/35 text-slate-500';
                    }
                  }

                  return (
                    <button
                      key={`${question.id}-opt-${optIndex}`}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => {
                        setSubmissions((prev) => ({
                          ...prev,
                          [question.id]: {
                            selectedOptionIndex: optIndex,
                            isCorrect: optIndex === question.correctIndex,
                          },
                        }));
                      }}
                      className={`flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all duration-150 ${buttonStyle}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 font-mono text-xs font-semibold text-slate-500">
                          {String.fromCharCode(65 + optIndex)}.
                        </span>
                        <span className="leading-relaxed">{optionText}</span>
                      </div>

                      {isAnswered && isCorrectOption && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 whitespace-nowrap shrink-0">
                          <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                          <span>Correct</span>
                        </span>
                      )}

                      {isAnswered && isSelected && !isCorrectOption && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-800 whitespace-nowrap shrink-0">
                          <XCircle className="h-4 w-4 text-red-700" aria-hidden="true" />
                          <span>Your Choice</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Breakdown */}
              {isAnswered && (
                <div className="space-y-3 rounded-2xl border border-white/75 bg-white/55 backdrop-blur-md p-4 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900">
                      Why this is right
                    </p>
                    <p className="mt-1 leading-relaxed text-slate-700">
                      {question.correctExplanation}
                    </p>
                  </div>

                  {question.distractorNotes.length > 0 && (
                    <div className="border-t border-white/70 pt-3">
                      <p className="text-xs font-semibold text-slate-700">
                        Why the other options are wrong
                      </p>
                      <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-600">
                        {question.distractorNotes.map((note, idx) => (
                          <li key={`${question.id}-note-${idx}`}>
                            <span className="font-mono font-semibold text-slate-800">
                              Option {String.fromCharCode(65 + note.optionIndex)}:
                            </span>{' '}
                            {note.whyIncorrect}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Lightbulb,
  RotateCcw,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { computeSessionStats } from '../lib/recallLogic';
import type { FlashcardRating, RecallDeck } from '../lib/types';

interface FlashcardRunnerProps {
  deck: RecallDeck | null;
  onRateCard: (cardId: string, rating: FlashcardRating) => void;
  onResetRatings: () => void;
  onGoToStudio: () => void;
  onGoToQuiz: () => void;
}

export function FlashcardRunner({
  deck,
  onRateCard,
  onResetRatings,
  onGoToStudio,
  onGoToQuiz,
}: FlashcardRunnerProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'needs-review'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const cards = deck?.flashcards ?? [];

  const visibleCards = useMemo(() => {
    if (filterMode === 'needs-review') {
      return cards.filter((c) => c.rating !== 'mastered');
    }
    return cards;
  }, [cards, filterMode]);

  const safeIndex =
    visibleCards.length > 0 ? Math.min(currentIndex, visibleCards.length - 1) : 0;
  const currentCard = visibleCards[safeIndex] ?? null;
  const stats = useMemo(() => computeSessionStats(cards), [cards]);

  useEffect(() => {
    setIsFlipped(false);
    setShowHint(false);
  }, [currentCard?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentCard) return;
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === '1' && isFlipped) {
        onRateCard(currentCard.id, 'again');
        advanceCard();
      } else if (e.key === '2' && isFlipped) {
        onRateCard(currentCard.id, 'hard');
        advanceCard();
      } else if (e.key === '3' && isFlipped) {
        onRateCard(currentCard.id, 'mastered');
        advanceCard();
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) =>
          visibleCards.length > 0 ? (prev + 1) % visibleCards.length : 0
        );
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) =>
          visibleCards.length > 0
            ? (prev - 1 + visibleCards.length) % visibleCards.length
            : 0
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const advanceCard = () => {
    if (visibleCards.length <= 1) {
      setIsFlipped(false);
      return;
    }
    setCurrentIndex((prev) => (prev + 1) % visibleCards.length);
  };

  if (!deck) {
    return (
      <section className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-10 text-center space-y-4">
        <h2 className="font-display text-2xl font-bold text-slate-900">
          No Active Recall Deck Loaded
        </h2>
        <p className="text-sm leading-relaxed text-slate-600">
          Paste lecture notes in the Studio or open one of the CBSE reference decks to begin
          mechanism-focused active recall.
        </p>
        <button
          type="button"
          onClick={onGoToStudio}
          className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Go to Studio
        </button>
      </section>
    );
  }

  if (cards.length === 0) {
    return (
      <section className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-10 text-center space-y-4">
        <h2 className="font-display text-2xl font-bold text-slate-900">
          This deck contains diagnostic quiz items only
        </h2>
        <p className="text-sm text-slate-600">
          Switch to the Diagnostic Quiz tab to run the {deck.quizQuestions.length} scenario
          questions generated for {deck.title}.
        </p>
        <button
          type="button"
          onClick={onGoToQuiz}
          className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Open Diagnostic Quiz
        </button>
      </section>
    );
  }

  return (
    <section aria-labelledby="recall-deck-title" className="space-y-6">
      {/* Deck Header & Session Progress */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-500">
            {deck.syllabus} · {deck.rigor} · {deck.modelUsed === 'sample' ? 'Reference Deck' : deck.modelUsed}
          </p>
          <h1
            id="recall-deck-title"
            className="font-display text-2xl font-bold text-slate-900 sm:text-3xl"
          >
            {deck.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label="Card filter"
            className="flex rounded-lg bg-slate-100 p-1"
          >
            <button
              type="button"
              aria-pressed={filterMode === 'all'}
              onClick={() => {
                setFilterMode('all');
                setCurrentIndex(0);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({cards.length})
            </button>
            <button
              type="button"
              aria-pressed={filterMode === 'needs-review'}
              onClick={() => {
                setFilterMode('needs-review');
                setCurrentIndex(0);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
                filterMode === 'needs-review'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Needs Review ({cards.length - stats.masteredCards})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onResetRatings();
              setFilterMode('all');
              setCurrentIndex(0);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset Progress</span>
          </button>
        </div>
      </div>

      {/* Mastery Metrics Strip */}
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-slate-500">Mastered</p>
          <p className="mt-0.5 font-mono text-lg font-semibold text-emerald-700 tabular-nums">
            {stats.masteredCards} / {stats.totalCards}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Hard / Revisit</p>
          <p className="mt-0.5 font-mono text-lg font-semibold text-amber-700 tabular-nums">
            {stats.hardCards}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Again (Missed)</p>
          <p className="mt-0.5 font-mono text-lg font-semibold text-red-700 tabular-nums">
            {stats.againCards}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Deck Mastery</p>
          <p className="mt-0.5 font-mono text-lg font-semibold text-slate-900 tabular-nums">
            {stats.masteryPercent}%
          </p>
        </div>
      </div>

      {/* Card Stage */}
      {!currentCard ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-8 text-center space-y-3">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-700" aria-hidden="true" />
          <h2 className="font-display text-xl font-semibold text-slate-900">
            All cards in this deck are mastered
          </h2>
          <p className="text-sm text-slate-600">
            Switch filter to &ldquo;All&rdquo; or reset ratings for another spaced-repetition pass.
          </p>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
          >
            View All Cards
          </button>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl space-y-4">
          {/* Card Navigation Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
            <span>
              Card {safeIndex + 1} of {visibleCards.length} · {currentCard.syllabusTag}
            </span>
            <span>
              {currentCard.rating
                ? `Status: ${formatRatingLabel(currentCard.rating)}`
                : 'Unreviewed'}
            </span>
          </div>

          {/* Active Recall Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            {/* Metadata Header (Zero-Pill) */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="text-xs font-medium text-slate-500">
                <span className="font-semibold text-slate-900">{currentCard.concept}</span>
                <span aria-hidden="true"> · </span>
                <span className="text-blue-700">{currentCard.mechanism}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHint((prev) => !prev)}
                aria-expanded={showHint}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-700"
              >
                <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
              </button>
            </div>

            {/* Prompt */}
            <div className="space-y-4">
              <p className="text-lg font-medium leading-relaxed text-slate-900 sm:text-xl">
                {currentCard.prompt}
              </p>

              {showHint && !isFlipped && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-slate-800">
                  <span className="font-semibold text-amber-900">Hint: </span>
                  {currentCard.hint}
                </div>
              )}
            </div>

            {/* Reveal / Answer Panel */}
            {!isFlipped ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsFlipped(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-slate-800 sm:w-auto"
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  <span>Reveal Worked Answer</span>
                  <span className="ml-1 font-mono text-xs text-slate-300">[Space]</span>
                </button>
              </div>
            ) : (
              <div className="space-y-5 border-t border-slate-200 pt-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-800">
                      Worked Reasoning &amp; Convention
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsFlipped(false)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"
                    >
                      <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Hide Answer</span>
                    </button>
                  </div>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-800 sm:text-base">
                    {currentCard.answer}
                  </p>
                </div>

                <div className="rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 text-sm text-slate-800">
                  <div className="flex items-center gap-1.5 font-semibold text-red-900">
                    <AlertTriangle className="h-4 w-4 text-red-700" aria-hidden="true" />
                    <span>Common Exam Pitfall</span>
                  </div>
                  <p className="mt-1 leading-relaxed text-slate-700">
                    {currentCard.commonPitfall}
                  </p>
                </div>

                {/* Self-Assessment Rating Controls */}
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-medium text-slate-500">
                    Rate your active recall accuracy before seeing the answer:
                  </p>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => {
                        onRateCard(currentCard.id, 'again');
                        advanceCard();
                      }}
                      className="flex items-center justify-between rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-800 transition-colors hover:bg-red-50"
                    >
                      <span>Again · Missed</span>
                      <span className="font-mono text-xs text-red-600">[1]</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onRateCard(currentCard.id, 'hard');
                        advanceCard();
                      }}
                      className="flex items-center justify-between rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-50"
                    >
                      <span>Hard · Partial</span>
                      <span className="font-mono text-xs text-amber-700">[2]</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onRateCard(currentCard.id, 'mastered');
                        advanceCard();
                      }}
                      className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50/70 px-4 py-2.5 text-sm font-semibold text-emerald-900 transition-colors hover:bg-emerald-100"
                    >
                      <span>Mastered</span>
                      <span className="font-mono text-xs text-emerald-700">[3]</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Prev / Next Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() =>
                setCurrentIndex(
                  (safeIndex - 1 + visibleCards.length) % visibleCards.length
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentIndex((safeIndex + 1) % visibleCards.length)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function formatRatingLabel(rating: FlashcardRating): string {
  if (rating === 'mastered') return 'Mastered';
  if (rating === 'hard') return 'Hard · Revisit';
  return 'Again · Missed';
}

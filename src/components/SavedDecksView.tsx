import { Download, FileText, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { computeSessionStats } from '../lib/recallLogic';
import type { RecallDeck } from '../lib/types';

interface SavedDecksViewProps {
  decks: RecallDeck[];
  activeDeckId: string | null;
  onOpenDeck: (deck: RecallDeck, target: 'recall' | 'quiz') => void;
  onDeleteDeck: (deckId: string) => void;
  onExportCsv: (deck: RecallDeck) => void;
  onExportMarkdown: (deck: RecallDeck) => void;
  onGoToStudio: () => void;
}

export function SavedDecksView({
  decks,
  activeDeckId,
  onOpenDeck,
  onDeleteDeck,
  onExportCsv,
  onExportMarkdown,
  onGoToStudio,
}: SavedDecksViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [syllabusFilter, setSyllabusFilter] = useState<string>('all');

  const uniqueSyllabi = useMemo(() => {
    const set = new Set(decks.map((d) => d.syllabus));
    return Array.from(set);
  }, [decks]);

  const filteredDecks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return decks.filter((deck) => {
      if (syllabusFilter !== 'all' && deck.syllabus !== syllabusFilter) {
        return false;
      }
      if (!query) return true;
      return (
        deck.title.toLowerCase().includes(query) ||
        deck.syllabus.toLowerCase().includes(query) ||
        deck.sourceExcerpt.toLowerCase().includes(query)
      );
    });
  }, [decks, searchQuery, syllabusFilter]);

  return (
    <section aria-labelledby="library-heading" className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1
            id="library-heading"
            className="font-display text-2xl font-bold text-slate-900 sm:text-3xl"
          >
            Saved Recall Decks
          </h1>
          <p className="text-sm text-slate-600">
            Stored locally in your browser. Reopen for spaced repetition or export to Anki CSV and Markdown.
          </p>
        </div>

        <button
          type="button"
          onClick={onGoToStudio}
          className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0 hover:bg-blue-800"
        >
          Forge New Deck
        </button>
      </div>

      {/* Filter Toolbar */}
      {decks.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <label htmlFor="deck-search" className="sr-only">
              Search saved decks
            </label>
            <input
              id="deck-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deck title, topic, or chapter..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="library-syllabus-filter" className="text-xs font-medium text-slate-600">
              Syllabus:
            </label>
            <select
              id="library-syllabus-filter"
              value={syllabusFilter}
              onChange={(e) => setSyllabusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              <option value="all">All Tracks ({decks.length})</option>
              {uniqueSyllabi.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Deck List */}
      {decks.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center space-y-4">
          <h2 className="font-display text-xl font-semibold text-slate-900">
            No Saved Decks Yet
          </h2>
          <p className="mx-auto max-w-md text-sm text-slate-600">
            Generated decks and studied CBSE sample sets are automatically saved here so you can
            revisit them across sessions.
          </p>
          <button
            type="button"
            onClick={onGoToStudio}
            className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Create Your First Deck
          </button>
        </div>
      ) : filteredDecks.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          No saved decks match &ldquo;{searchQuery}&rdquo;.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredDecks.map((deck) => {
            const stats = computeSessionStats(deck.flashcards);
            const isActive = deck.id === activeDeckId;
            return (
              <article
                key={deck.id}
                className={`flex flex-col justify-between rounded-xl border bg-white p-5 ${
                  isActive ? 'border-blue-600' : 'border-slate-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span>
                      {deck.syllabus} · {deck.rigor}
                    </span>
                    {isActive && (
                      <span className="font-semibold text-blue-700">Active</span>
                    )}
                  </div>
                  <h2 className="font-display text-lg font-semibold text-slate-900">
                    {deck.title}
                  </h2>
                  <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">
                    {deck.sourceExcerpt}
                  </p>
                  <p className="pt-1 font-mono text-xs text-slate-500 tabular-nums">
                    {deck.flashcards.length} cards ({stats.masteryPercent}% mastered) ·{' '}
                    {deck.quizQuestions.length} quiz items
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2">
                    {deck.flashcards.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onOpenDeck(deck, 'recall')}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        Study Cards
                      </button>
                    )}
                    {deck.quizQuestions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onOpenDeck(deck, 'quiz')}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                      >
                        Take Quiz
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label={`Export ${deck.title} as Anki CSV`}
                      onClick={() => onExportCsv(deck)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>CSV</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Export ${deck.title} as Markdown`}
                      onClick={() => onExportMarkdown(deck)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>MD</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete deck ${deck.title}`}
                      onClick={() => onDeleteDeck(deck.id)}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

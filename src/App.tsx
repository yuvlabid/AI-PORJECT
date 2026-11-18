import { useEffect, useState } from 'react';
import { FlashcardRunner } from './components/FlashcardRunner';
import { Header, type WorkspaceTab } from './components/Header';
import { InputStudio } from './components/InputStudio';
import { QuizRunner } from './components/QuizRunner';
import { SavedDecksView } from './components/SavedDecksView';
import {
  applyFlashcardRating,
  convertMissedQuizToFlashcards,
  exportDeckToAnkiCsv,
  exportDeckToMarkdown,
  validateGenerateInput,
} from './lib/recallLogic';
import { SAMPLE_PRESETS, type SampleNotePreset } from './lib/sampleDecks';
import type {
  FlashcardRating,
  GenerateResponsePayload,
  ModelId,
  OutputMode,
  RecallDeck,
  RigorLevel,
  SyllabusTrack,
  UploadedAttachment,
} from './lib/types';

const STORAGE_KEY_DECKS = 'recallforge_decks_v1';
const STORAGE_KEY_ACTIVE_ID = 'recallforge_active_deck_id_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('studio');

  // Input Studio state
  const [notesText, setNotesText] = useState('');
  const [attachment, setAttachment] = useState<UploadedAttachment | null>(null);
  const [syllabus, setSyllabus] = useState<SyllabusTrack>('CBSE Class 12 Physics');
  const [rigor, setRigor] = useState<RigorLevel>('Application & HOTS');
  const [outputMode, setOutputMode] = useState<OutputMode>('mixed');
  const [itemCount, setItemCount] = useState<number>(6);
  const [model, setModel] = useState<ModelId>('gemini-3.5-flash-lite');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Saved Decks & Active Deck state (persisted locally for public users)
  const [savedDecks, setSavedDecks] = useState<RecallDeck[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DECKS);
      if (raw) {
        const parsed = JSON.parse(raw) as RecallDeck[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage read issues
    }
    return [];
  });

  const [activeDeckId, setActiveDeckId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
    } catch {
      return null;
    }
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DECKS, JSON.stringify(savedDecks));
    } catch {
      // Ignore quota errors
    }
  }, [savedDecks]);

  useEffect(() => {
    try {
      if (activeDeckId) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeDeckId);
      } else {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
      }
    } catch {
      // Ignore storage errors
    }
  }, [activeDeckId]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const activeDeck = savedDecks.find((d) => d.id === activeDeckId) ?? null;

  const upsertDeck = (deck: RecallDeck) => {
    setSavedDecks((prev) => {
      const exists = prev.some((d) => d.id === deck.id);
      if (exists) {
        return prev.map((d) => (d.id === deck.id ? deck : d));
      }
      return [deck, ...prev];
    });
    setActiveDeckId(deck.id);
  };

  const handleGenerate = async () => {
    const validation = validateGenerateInput({
      notesText,
      attachment,
      itemCount,
      model,
    });

    if (!validation.valid) {
      setErrorMessage(validation.error);
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notesText,
          attachment,
          syllabus,
          rigor,
          outputMode,
          itemCount,
          model,
        }),
      });

      const data = (await response.json()) as Partial<GenerateResponsePayload> & {
        error?: string;
      };

      if (!response.ok || !data.deck) {
        throw new Error(
          data.error || 'Unable to generate recall set. Please verify your input and try again.'
        );
      }

      upsertDeck(data.deck);
      if (data.deck.flashcards.length > 0) {
        setActiveTab('recall');
      } else {
        setActiveTab('quiz');
      }
      setToastMessage(`Forged "${data.deck.title}" and saved to your deck library.`);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Network error while generating recall set.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadPresetNotes = (preset: SampleNotePreset) => {
    setErrorMessage(null);
    setSyllabus(preset.syllabus);
    setNotesText(preset.notesText);
    setAttachment(null);
    setToastMessage(`Loaded ${preset.label} notes into Studio.`);
  };

  const handleOpenSampleDeckDirectly = (preset: SampleNotePreset) => {
    const existing = savedDecks.find((d) => d.id === preset.deck.id);
    if (existing) {
      setActiveDeckId(existing.id);
    } else {
      upsertDeck(preset.deck);
    }
    setActiveTab('recall');
  };

  const handleRateCard = (cardId: string, rating: FlashcardRating) => {
    if (!activeDeck) return;
    const updatedDeck: RecallDeck = {
      ...activeDeck,
      lastStudiedAt: new Date().toISOString(),
      flashcards: applyFlashcardRating(activeDeck.flashcards, cardId, rating),
    };
    upsertDeck(updatedDeck);
  };

  const handleResetRatings = () => {
    if (!activeDeck) return;
    const updatedDeck: RecallDeck = {
      ...activeDeck,
      flashcards: activeDeck.flashcards.map((c) => ({
        ...c,
        rating: undefined,
        reviewCount: 0,
      })),
    };
    upsertDeck(updatedDeck);
    setToastMessage('Card mastery ratings reset.');
  };

  const handleConvertMissedToFlashcards = (missedQuestionIds: string[]) => {
    if (!activeDeck) return;
    const newCards = convertMissedQuizToFlashcards(
      activeDeck.quizQuestions,
      missedQuestionIds
    );
    if (newCards.length === 0) return;

    const existingIds = new Set(activeDeck.flashcards.map((c) => c.id));
    const uniqueNewCards = newCards.filter((c) => !existingIds.has(c.id));

    const updatedDeck: RecallDeck = {
      ...activeDeck,
      flashcards: [...activeDeck.flashcards, ...uniqueNewCards],
    };
    upsertDeck(updatedDeck);
    setToastMessage(`Added ${uniqueNewCards.length} missed quiz items to Active Recall.`);
  };

  const handleDeleteDeck = (deckId: string) => {
    setSavedDecks((prev) => prev.filter((d) => d.id !== deckId));
    if (activeDeckId === deckId) {
      setActiveDeckId(null);
    }
    setToastMessage('Deck deleted from local library.');
  };

  const triggerDownload = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = (deck: RecallDeck) => {
    const csv = exportDeckToAnkiCsv(deck);
    const slug = deck.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48);
    triggerDownload(`${slug || 'recallforge'}-anki.csv`, csv, 'text/csv;charset=utf-8');
    setToastMessage(`Exported "${deck.title}" as Anki CSV.`);
  };

  const handleExportMarkdown = (deck: RecallDeck) => {
    const md = exportDeckToMarkdown(deck);
    const slug = deck.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48);
    triggerDownload(`${slug || 'recallforge'}.md`, md, 'text/markdown;charset=utf-8');
    setToastMessage(`Exported "${deck.title}" as Markdown.`);
  };

  const handleHeaderPrimaryAction = () => {
    if (activeDeck) {
      handleExportCsv(activeDeck);
    } else {
      handleOpenSampleDeckDirectly(SAMPLE_PRESETS[0]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        hasActiveDeck={Boolean(activeDeck)}
        onPrimaryAction={handleHeaderPrimaryAction}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'studio' && (
          <InputStudio
            notesText={notesText}
            onChangeNotesText={setNotesText}
            attachment={attachment}
            onChangeAttachment={setAttachment}
            syllabus={syllabus}
            onChangeSyllabus={setSyllabus}
            rigor={rigor}
            onChangeRigor={setRigor}
            outputMode={outputMode}
            onChangeOutputMode={setOutputMode}
            itemCount={itemCount}
            onChangeItemCount={setItemCount}
            model={model}
            onChangeModel={setModel}
            isGenerating={isGenerating}
            errorMessage={errorMessage}
            onDismissError={() => setErrorMessage(null)}
            onSubmitGenerate={() => void handleGenerate()}
            onLoadPresetNotes={handleLoadPresetNotes}
            onOpenSampleDeckDirectly={handleOpenSampleDeckDirectly}
          />
        )}

        {activeTab === 'recall' && (
          <FlashcardRunner
            deck={activeDeck}
            onRateCard={handleRateCard}
            onResetRatings={handleResetRatings}
            onGoToStudio={() => setActiveTab('studio')}
            onGoToQuiz={() => setActiveTab('quiz')}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizRunner
            deck={activeDeck}
            onGoToStudio={() => setActiveTab('studio')}
            onGoToRecall={() => setActiveTab('recall')}
            onConvertMissedToFlashcards={handleConvertMissedToFlashcards}
          />
        )}

        {activeTab === 'library' && (
          <SavedDecksView
            decks={savedDecks}
            activeDeckId={activeDeckId}
            onOpenDeck={(deck, target) => {
              setActiveDeckId(deck.id);
              setActiveTab(target);
            }}
            onDeleteDeck={handleDeleteDeck}
            onExportCsv={handleExportCsv}
            onExportMarkdown={handleExportMarkdown}
            onGoToStudio={() => setActiveTab('studio')}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>RecallForge — CBSE &amp; Active-Recall Studio</p>
          <p>Decks persist locally in your browser · Anki CSV &amp; Markdown ready</p>
        </div>
      </footer>

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-40 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-medium text-white shadow-lg"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

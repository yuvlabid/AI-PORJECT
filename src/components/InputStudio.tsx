import { AlertCircle, ArrowRight, FileText, Loader2, Paperclip, Trash2, Upload } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENT_BYTES,
  MODEL_OPTIONS,
  RIGOR_OPTIONS,
  SYLLABUS_OPTIONS,
} from '../lib/recallLogic';
import { SAMPLE_PRESETS, type SampleNotePreset } from '../lib/sampleDecks';
import type {
  ModelId,
  OutputMode,
  RigorLevel,
  SyllabusTrack,
  UploadedAttachment,
} from '../lib/types';

interface InputStudioProps {
  notesText: string;
  onChangeNotesText: (value: string) => void;
  attachment: UploadedAttachment | null;
  onChangeAttachment: (file: UploadedAttachment | null) => void;
  syllabus: SyllabusTrack;
  onChangeSyllabus: (value: SyllabusTrack) => void;
  rigor: RigorLevel;
  onChangeRigor: (value: RigorLevel) => void;
  outputMode: OutputMode;
  onChangeOutputMode: (value: OutputMode) => void;
  itemCount: number;
  onChangeItemCount: (value: number) => void;
  model: ModelId;
  onChangeModel: (value: ModelId) => void;
  isGenerating: boolean;
  errorMessage: string | null;
  onDismissError: () => void;
  onSubmitGenerate: () => void;
  onLoadPresetNotes: (preset: SampleNotePreset) => void;
  onOpenSampleDeckDirectly: (preset: SampleNotePreset) => void;
}

const ITEM_COUNT_OPTIONS = [4, 6, 8, 12];

export function InputStudio({
  notesText,
  onChangeNotesText,
  attachment,
  onChangeAttachment,
  syllabus,
  onChangeSyllabus,
  rigor,
  onChangeRigor,
  outputMode,
  onChangeOutputMode,
  itemCount,
  onChangeItemCount,
  model,
  onChangeModel,
  isGenerating,
  errorMessage,
  onDismissError,
  onSubmitGenerate,
  onLoadPresetNotes,
  onOpenSampleDeckDirectly,
}: InputStudioProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileSelected = async (file: File) => {
    setFileError(null);
    onDismissError();

    const inferredMime = inferMimeType(file);
    if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(inferredMime)) {
      setFileError(
        `Unsupported file format (${file.name}). Upload PDF, TXT, MD, CSV, PNG, JPG, or WEBP.`
      );
      return;
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      setFileError('File exceeds the 8 MB upload limit. Please upload a smaller excerpt.');
      return;
    }

    try {
      if (
        inferredMime === 'text/plain' ||
        inferredMime === 'text/markdown' ||
        inferredMime === 'text/csv'
      ) {
        const textData = await file.text();
        onChangeAttachment({
          name: file.name,
          mimeType: inferredMime,
          sizeBytes: file.size,
          data: textData,
          encoding: 'utf8',
        });
      } else {
        const base64Data = await readFileAsBase64(file);
        onChangeAttachment({
          name: file.name,
          mimeType: inferredMime,
          sizeBytes: file.size,
          data: base64Data,
          encoding: 'base64',
        });
      }
    } catch {
      setFileError('Unable to read the selected file. Please try again.');
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFileSelected(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFileSelected(file);
    }
  };

  const activeRigorMeta = RIGOR_OPTIONS.find((r) => r.value === rigor);

  return (
    <section aria-labelledby="studio-heading" className="space-y-8">
      {/* Studio Intro */}
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <p className="text-xs font-medium tracking-wide text-slate-500">
            CBSE &amp; Active-Recall Studio · Anti-Trivia Engine
          </p>
          <h1
            id="studio-heading"
            className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl text-balance"
          >
            Turn raw lecture notes into mechanism-first recall sets
          </h1>
          <p className="text-base leading-relaxed text-slate-600">
            Paste NCERT chapters, derivations, or upload textbook pages. RecallForge rejects
            bare definitions and isolates one testable causal chain, sign convention, or edge case per item.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-slate-500 mr-1">
            Quick CBSE Presets:
          </span>
          {SAMPLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onLoadPresetNotes(preset)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-800"
            >
              {preset.label.split(' · ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert Banner */}
      {(errorMessage || fileError) && (
        <div
          role="alert"
          className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-900"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            <p className="leading-relaxed">{fileError || errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFileError(null);
              onDismissError();
            }}
            className="text-xs font-semibold text-red-800 underline underline-offset-2 whitespace-nowrap shrink-0 hover:text-red-950"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Two-Column Workbench */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
        {/* Left Zone: Notes & Document Ingestion */}
        <div className="lg:col-span-6 flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <label
              htmlFor="source-notes-input"
              className="text-sm font-semibold text-slate-900"
            >
              Source Material &amp; Lecture Excerpts
            </label>
            <div className="flex items-center gap-3 text-xs text-slate-500 tabular-nums">
              <span>{notesText.trim().length.toLocaleString()} chars</span>
              {notesText.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => onChangeNotesText('')}
                    className="font-medium text-slate-600 hover:text-slate-900 underline underline-offset-2"
                  >
                    Clear notes
                  </button>
                </>
              )}
            </div>
          </div>

          <textarea
            id="source-notes-input"
            value={notesText}
            onChange={(e) => {
              onDismissError();
              onChangeNotesText(e.target.value);
            }}
            rows={12}
            placeholder="Paste NCERT paragraphs, derivations, circuit laws, reaction mechanisms, or messy lecture notes here..."
            className="w-full flex-1 min-h-[260px] resize-y rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15"
          />

          {/* File Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`rounded-lg border border-dashed p-4 transition-colors duration-150 ${
              isDragging
                ? 'border-blue-600 bg-blue-50/60'
                : 'border-slate-300 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              id="study-file-upload"
              aria-hidden="true"
              tabIndex={-1}
              accept=".pdf,.txt,.md,.csv,.png,.jpg,.jpeg,.webp"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {attachment ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-blue-700">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {attachment.name}
                    </p>
                    <p className="text-xs text-slate-500 tabular-nums">
                      {attachment.mimeType} · {formatBytes(attachment.sizeBytes)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Remove attached file ${attachment.name}`}
                  onClick={() => onChangeAttachment(null)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Remove</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600">
                    <Upload className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Attach textbook PDF, Markdown notes, or diagram photo
                    </p>
                    <p className="text-xs text-slate-500">
                      Supports PDF, TXT, MD, CSV, PNG, JPG, WEBP up to 8 MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 whitespace-nowrap shrink-0 hover:bg-slate-50"
                >
                  <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Choose File</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Zone: Syllabus, Rigor & Model Configuration */}
        <div className="lg:col-span-6 space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="space-y-1.5">
            <label
              htmlFor="syllabus-select"
              className="block text-sm font-semibold text-slate-900"
            >
              Syllabus Alignment
            </label>
            <select
              id="syllabus-select"
              value={syllabus}
              onChange={(e) => onChangeSyllabus(e.target.value as SyllabusTrack)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
            >
              {SYLLABUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Rigor Level Segmented Selector */}
          <div className="space-y-2">
            <span className="block text-sm font-semibold text-slate-900">
              Cognitive Rigor
            </span>
            <div
              role="group"
              aria-label="Cognitive rigor level"
              className="flex flex-col gap-1 sm:flex-row rounded-lg bg-slate-100 p-1"
            >
              {RIGOR_OPTIONS.map((opt) => {
                const active = rigor === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChangeRigor(opt.value)}
                    className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors duration-150 whitespace-nowrap ${
                      active
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.value}
                  </button>
                );
              })}
            </div>
            {activeRigorMeta && (
              <p className="text-xs leading-relaxed text-slate-500">
                {activeRigorMeta.summary}
              </p>
            )}
          </div>

          {/* Output Format & Item Count */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <span className="block text-sm font-semibold text-slate-900">
                Output Mode
              </span>
              <div
                role="group"
                aria-label="Output format mode"
                className="flex rounded-lg bg-slate-100 p-1"
              >
                {(
                  [
                    { id: 'mixed', label: 'Mixed' },
                    { id: 'flashcards', label: 'Cards' },
                    { id: 'quiz', label: 'Quiz' },
                  ] as const
                ).map((mode) => {
                  const active = outputMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onChangeOutputMode(mode.id)}
                      className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors duration-150 ${
                        active
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="item-count-select"
                className="block text-sm font-semibold text-slate-900"
              >
                Atomic Items
              </label>
              <select
                id="item-count-select"
                value={itemCount}
                onChange={(e) => onChangeItemCount(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
              >
                {ITEM_COUNT_OPTIONS.map((count) => (
                  <option key={count} value={count}>
                    {count} items
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reasoning Engine Selector */}
          <div className="space-y-2">
            <span className="block text-sm font-semibold text-slate-900">
              Reasoning Engine
            </span>
            <div className="grid grid-cols-1 gap-2">
              {MODEL_OPTIONS.map((opt) => {
                const selected = model === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onChangeModel(opt.id)}
                    className={`flex flex-col items-start rounded-lg border px-3.5 py-2.5 text-left transition-colors duration-150 ${
                      selected
                        ? 'border-blue-600 bg-blue-50/40'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          selected ? 'text-blue-800' : 'text-slate-900'
                        }`}
                      >
                        {opt.label}
                      </span>
                      <span className="font-mono text-xs text-slate-500">
                        {opt.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{opt.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Generation CTA */}
          <button
            type="button"
            disabled={isGenerating}
            onClick={onSubmitGenerate}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Forging Atomic Recall Set...</span>
              </>
            ) : (
              <>
                <span>Forge Recall Set</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Ready-to-Study CBSE Sample Decks */}
      <div className="border-t border-slate-200 pt-8">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Ready-to-Study CBSE Reference Decks
          </h2>
          <p className="text-xs text-slate-500">
            Inspect active-recall mechanics immediately without waiting
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {SAMPLE_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500">
                  {preset.syllabus} · {preset.deck.rigor}
                </p>
                <h3 className="font-display text-base font-semibold text-slate-900">
                  {preset.deck.title}
                </h3>
                <p className="text-xs text-slate-600 tabular-nums">
                  {preset.deck.flashcards.length}{' '}
                  {preset.deck.flashcards.length === 1 ? 'flashcard' : 'flashcards'} ·{' '}
                  {preset.deck.quizQuestions.length}{' '}
                  {preset.deck.quizQuestions.length === 1
                    ? 'diagnostic quiz item'
                    : 'diagnostic quiz items'}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onOpenSampleDeckDirectly(preset)}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                >
                  Open in Recall Studio
                </button>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <button
                  type="button"
                  onClick={() => onLoadPresetNotes(preset)}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Load Notes
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function inferMimeType(file: File): string {
  if (file.type && ALLOWED_ATTACHMENT_MIME_TYPES.has(file.type)) {
    return file.type;
  }
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.md')) return 'text/markdown';
  if (lower.endsWith('.txt')) return 'text/plain';
  if (lower.endsWith('.csv')) return 'text/csv';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  return file.type || 'application/octet-stream';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx !== -1 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsDataURL(file);
  });
}

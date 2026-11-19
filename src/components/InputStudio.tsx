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
        `Unsupported file (${file.name}). Please upload a PDF, TXT, MD, CSV, PNG, JPG, or WEBP file.`
      );
      return;
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      setFileError('File is larger than 8 MB. Please upload a smaller file.');
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
      setFileError('Could not read the selected file. Please try again.');
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
      <div className="flex flex-col gap-4 border-b border-white/60 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <p className="text-xs font-semibold tracking-wide text-[#005BB5]">
            RecallForge Study Studio · Any Subject
          </p>
          <h1
            id="studio-heading"
            className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl text-balance"
          >
            Turn your notes into clear flashcards and practice quizzes
          </h1>
          <p className="text-base leading-relaxed text-slate-700">
            Paste your notes or upload a textbook page from any subject. RecallForge creates
            focused questions that test how ideas work and where students make mistakes—not simple memorization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-slate-600 mr-1">
            Try Sample Notes:
          </span>
          {SAMPLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onLoadPresetNotes(preset)}
              className="mac-glass-subtle rounded-xl px-3.5 py-1.5 text-xs font-semibold text-slate-700 whitespace-nowrap shrink-0 transition-all duration-150 hover:bg-white/85 hover:text-[#005BB5]"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert Banner */}
      {(errorMessage || fileError) && (
        <div
          role="alert"
          className="flex items-start justify-between gap-4 rounded-2xl border border-red-300/80 bg-red-50/80 backdrop-blur-xl px-4 py-3.5 text-sm text-red-900 shadow-xs"
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

      {/* Two-Column Liquid Glass Workbench */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
        {/* Left Zone: Notes & Document Ingestion */}
        <div className="mac-glass lg:col-span-6 flex flex-col gap-5 rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <label
              htmlFor="source-notes-input"
              className="text-sm font-semibold text-slate-900"
            >
              Your Study Notes
            </label>
            <div className="flex items-center gap-3 text-xs text-slate-600 tabular-nums">
              <span>{notesText.trim().length.toLocaleString()} chars</span>
              {notesText.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => onChangeNotesText('')}
                    className="font-medium text-[#005BB5] hover:text-[#004494] underline underline-offset-2"
                  >
                    Clear
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
            placeholder="Paste class notes, textbook chapters, history timelines, economics concepts, formulas, or study guides from any subject..."
            className="w-full flex-1 min-h-[260px] resize-y rounded-2xl border border-white/80 bg-white/55 backdrop-blur-md px-4 py-3.5 text-sm leading-relaxed text-slate-900 placeholder:text-slate-500 shadow-[inset_0_1px_3px_rgba(15,58,128,0.06)] transition-all focus:border-[#0063D1]/60 focus:bg-white/85 focus:outline-none focus:ring-3 focus:ring-[#0063D1]/15"
          />

          {/* File Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`rounded-2xl border border-dashed p-4 backdrop-blur-md transition-colors duration-150 ${
              isDragging
                ? 'border-[#0063D1] bg-blue-50/75'
                : 'border-blue-900/15 bg-white/35'
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
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white/85 text-[#0063D1]">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {attachment.name}
                    </p>
                    <p className="text-xs text-slate-600 tabular-nums">
                      {attachment.mimeType} · {formatBytes(attachment.sizeBytes)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Remove attached file ${attachment.name}`}
                  onClick={() => onChangeAttachment(null)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/75 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Remove</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white/75 text-[#0063D1]">
                    <Upload className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Attach a PDF, notes file, or page photo
                    </p>
                    <p className="text-xs text-slate-600">
                      PDF, TXT, MD, CSV, PNG, JPG, WEBP up to 8 MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mac-glass-subtle inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 whitespace-nowrap shrink-0 transition-colors hover:bg-white/90 hover:text-[#005BB5]"
                >
                  <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Choose File</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Zone: Study Settings */}
        <div className="mac-glass lg:col-span-6 space-y-5 rounded-3xl p-5 sm:p-6">
          <div className="space-y-1.5">
            <label
              htmlFor="syllabus-select"
              className="block text-sm font-semibold text-slate-900"
            >
              Study Level (Works for Any Subject)
            </label>
            <select
              id="syllabus-select"
              value={syllabus}
              onChange={(e) => onChangeSyllabus(e.target.value as SyllabusTrack)}
              className="w-full rounded-xl border border-white/80 bg-white/60 backdrop-blur-md px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-2xs transition-colors focus:border-[#0063D1]/60 focus:bg-white/90 focus:outline-none focus:ring-3 focus:ring-[#0063D1]/15"
            >
              {SYLLABUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Segmented Selector */}
          <div className="space-y-2">
            <span className="block text-sm font-semibold text-slate-900">
              Difficulty
            </span>
            <div
              role="group"
              aria-label="Difficulty level"
              className="flex flex-col gap-1 sm:flex-row rounded-xl bg-blue-950/[0.06] p-1 ring-1 ring-white/60"
            >
              {RIGOR_OPTIONS.map((opt) => {
                const active = rigor === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChangeRigor(opt.value)}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
                      active
                        ? 'bg-white/90 text-[#005BB5] shadow-[0_2px_6px_rgba(15,58,128,0.1)]'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.value}
                  </button>
                );
              })}
            </div>
            {activeRigorMeta && (
              <p className="text-xs leading-relaxed text-slate-600">
                {activeRigorMeta.summary}
              </p>
            )}
          </div>

          {/* Output Format & Item Count */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <span className="block text-sm font-semibold text-slate-900">
                What to Create
              </span>
              <div
                role="group"
                aria-label="Output format mode"
                className="flex rounded-xl bg-blue-950/[0.06] p-1 ring-1 ring-white/60"
              >
                {(
                  [
                    { id: 'mixed', label: 'Both' },
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
                      className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                        active
                          ? 'bg-white/90 text-[#005BB5] shadow-[0_2px_6px_rgba(15,58,128,0.1)]'
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
                Number of Questions
              </label>
              <select
                id="item-count-select"
                value={itemCount}
                onChange={(e) => onChangeItemCount(Number(e.target.value))}
                className="w-full rounded-xl border border-white/80 bg-white/60 backdrop-blur-md px-3 py-2 text-sm font-medium text-slate-900 tabular-nums shadow-2xs focus:border-[#0063D1]/60 focus:bg-white/90 focus:outline-none focus:ring-3 focus:ring-[#0063D1]/15"
              >
                {ITEM_COUNT_OPTIONS.map((count) => (
                  <option key={count} value={count}>
                    {count} items
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Speed & Quality Selector */}
          <div className="space-y-2">
            <span className="block text-sm font-semibold text-slate-900">
              Speed &amp; Quality
            </span>
            <div className="grid grid-cols-1 gap-2.5">
              {MODEL_OPTIONS.map((opt) => {
                const selected = model === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onChangeModel(opt.id)}
                    className={`flex flex-col items-start rounded-2xl border px-4 py-3 text-left transition-all duration-150 ${
                      selected
                        ? 'border-[#0063D1]/55 bg-blue-50/65 backdrop-blur-md ring-2 ring-[#0063D1]/15 shadow-xs'
                        : 'border-white/75 bg-white/45 hover:bg-white/75'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          selected ? 'text-[#004E9E]' : 'text-slate-900'
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
            className="mac-btn-primary flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Creating your study set...</span>
              </>
            ) : (
              <>
                <span>Create Flashcards &amp; Quiz</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Ready-to-Study Sample Decks */}
      <div className="border-t border-white/60 pt-8">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Sample Study Decks
          </h2>
          <p className="text-xs text-slate-600">
            Open a ready-made deck right away to see how cards and quizzes work
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {SAMPLE_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="mac-glass flex flex-col justify-between rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="space-y-2">
                <p className="text-xs font-medium text-[#005BB5]">
                  {preset.label} · {preset.deck.rigor}
                </p>
                <h3 className="font-display text-base font-semibold text-slate-900">
                  {preset.deck.title}
                </h3>
                <p className="text-xs text-slate-600 tabular-nums">
                  {preset.deck.flashcards.length}{' '}
                  {preset.deck.flashcards.length === 1 ? 'flashcard' : 'flashcards'} ·{' '}
                  {preset.deck.quizQuestions.length}{' '}
                  {preset.deck.quizQuestions.length === 1
                    ? 'quiz question'
                    : 'quiz questions'}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-3 pt-3 border-t border-white/60">
                <button
                  type="button"
                  onClick={() => onOpenSampleDeckDirectly(preset)}
                  className="text-xs font-semibold text-[#005BB5] hover:text-[#004494]"
                >
                  Open Flashcards
                </button>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <button
                  type="button"
                  onClick={() => onLoadPresetNotes(preset)}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Use These Notes
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

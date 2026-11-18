import type {
  FlashcardItem,
  FlashcardRating,
  ModelId,
  OutputMode,
  QuizQuestionItem,
  QuizSubmission,
  RecallDeck,
  RigorLevel,
  SessionStats,
  SyllabusTrack,
  UploadedAttachment,
} from './types';

export const SYLLABUS_OPTIONS: readonly SyllabusTrack[] = [
  'CBSE Class 12 Physics',
  'CBSE Class 12 Chemistry',
  'CBSE Class 12 Mathematics',
  'CBSE Class 12 Biology',
  'CBSE Class 12 Computer Science',
  'CBSE Class 10 Science',
  'CBSE Class 10 Mathematics',
  'JEE / NEET Conceptual Bridge',
  'University STEM & Engineering',
] as const;

export const RIGOR_OPTIONS: readonly {
  value: RigorLevel;
  summary: string;
}[] = [
  {
    value: 'Board Conceptual',
    summary: 'NCERT mechanism mastery, SI units, sign conventions, and 3-mark reasoning.',
  },
  {
    value: 'Application & HOTS',
    summary: 'Multi-step causal chains, assertion-reason traps, and case-study perturbations.',
  },
  {
    value: 'Edge-Case & Olympiad',
    summary: 'Boundary conditions, non-ideal regimes, mathematical trade-offs, and failure modes.',
  },
] as const;

export const MODEL_OPTIONS: readonly {
  id: ModelId;
  label: string;
  badge: string;
  description: string;
}[] = [
  {
    id: 'gemini-3.5-flash-lite',
    label: 'Fast Mode',
    badge: 'gemini-3.5-flash-lite',
    description: 'Default · Higher free-tier quota & lowest latency (minimal thinking).',
  },
  {
    id: 'gemini-3.8-flash',
    label: 'High Precision',
    badge: 'gemini-3.8-flash',
    description: 'Deeper causal reasoning for dense derivations & edge cases.',
  },
] as const;

export const ALLOWED_MODELS: readonly ModelId[] = [
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
] as const;

export const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

export const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024; // 8 MB
export const MIN_NOTES_LENGTH = 20;
export const MAX_NOTES_LENGTH = 60000;

export function isValidModelId(value: unknown): value is ModelId {
  return typeof value === 'string' && (ALLOWED_MODELS as readonly string[]).includes(value);
}

export function buildSystemInstruction(params: {
  syllabus: SyllabusTrack;
  rigor: RigorLevel;
  outputMode: OutputMode;
  itemCount: number;
}): string {
  const { syllabus, rigor, outputMode, itemCount } = params;

  const targetCounts =
    outputMode === 'flashcards'
      ? `Generate exactly ${itemCount} atomic active-recall flashcards and 0 quizQuestions (empty array).`
      : outputMode === 'quiz'
        ? `Generate 0 flashcards (empty array) and exactly ${itemCount} diagnostic quizQuestions.`
        : `Generate ${Math.ceil(itemCount / 2)} atomic active-recall flashcards and ${Math.floor(itemCount / 2) || 1} diagnostic quizQuestions.`;

  return [
    'Role: Principal Instructional Designer and Cognitive Science Engineering Agent.',
    'Objective: Transform unstructured academic text, lecture notes, or uploaded documents into rigorous, high-yield active-recall flashcards and/or diagnostic quizzes.',
    `Active Syllabus Track: ${syllabus}.`,
    `Target Rigor Level: ${rigor}.`,
    '',
    'MANDATORY INSTRUCTIONAL RULES:',
    '- Rule 1 (Ban Trivia & Rote Lookups): Reject bare-minimum definitions, dates, biographical facts, or "What is X?" questions. Every single item MUST test underlying mechanics, causal chains, NCERT/SI sign conventions, architectural or mathematical trade-offs, experimental perturbations ("what happens if variable X doubles/reverses?"), or edge-case applications.',
    '- Rule 2 (Atomic Boundaries): Strictly limit each flashcard or quiz item to ONE underlying concept or principle. Split multi-mechanism concepts into separate atomic cards/items so each prompt demands a single testable prediction, derivation step, or failure mode rather than a compound multi-part essay.',
    '- Rule 3 (CBSE & Exam Precision): Explicitly enforce exact sign conventions (e.g., Cartesian mirror/lens sign convention, thermodynamic work done on vs. by system, Lenz law opposition, Nernst electrode potential conventions), limiting assumptions (e.g., ideal gas, point charge, steady state, frictionless pulley), and common board-exam misconceptions.',
    '- Rule 4 (Diagnostic Distractors): For every quiz question, provide 4 distinct options where each wrong option represents a specific, plausible student misconception (e.g., flipped sign, ignored boundary condition, inverted proportionality), and explain in distractorNotes exactly why each incorrect option fails.',
    `- Output Allocation: ${targetCounts}`,
    '- Return strictly valid JSON matching the required response schema. Do not include markdown fences or commentary outside JSON.',
  ].join('\n');
}

export function validateGenerateInput(input: {
  notesText: string;
  attachment?: UploadedAttachment | null;
  itemCount: number;
  model: unknown;
}): { valid: true } | { valid: false; error: string } {
  const trimmedNotes = (input.notesText ?? '').trim();
  const hasAttachment = Boolean(input.attachment && input.attachment.data);

  if (!trimmedNotes && !hasAttachment) {
    return {
      valid: false,
      error: 'Paste lecture notes or upload a study document (.pdf, .txt, .md, or image) before generating.',
    };
  }

  if (trimmedNotes && trimmedNotes.length < MIN_NOTES_LENGTH && !hasAttachment) {
    return {
      valid: false,
      error: `Please enter at least ${MIN_NOTES_LENGTH} characters of study material so atomic concepts can be extracted.`,
    };
  }

  if (trimmedNotes.length > MAX_NOTES_LENGTH) {
    return {
      valid: false,
      error: `Source notes exceed the ${MAX_NOTES_LENGTH.toLocaleString()} character limit. Split into smaller chapter sections.`,
    };
  }

  if (input.attachment) {
    if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(input.attachment.mimeType)) {
      return {
        valid: false,
        error: `Unsupported file type (${input.attachment.mimeType}). Use PDF, TXT, MD, CSV, PNG, JPG, or WEBP.`,
      };
    }
    if (input.attachment.sizeBytes > MAX_ATTACHMENT_BYTES) {
      return {
        valid: false,
        error: 'Uploaded file exceeds the 8 MB limit.',
      };
    }
  }

  if (!Number.isInteger(input.itemCount) || input.itemCount < 2 || input.itemCount > 16) {
    return {
      valid: false,
      error: 'Item count must be between 2 and 16.',
    };
  }

  if (!isValidModelId(input.model)) {
    return {
      valid: false,
      error: 'Unsupported model selection.',
    };
  }

  return { valid: true };
}

export interface GeminiPartLike {
  text?: string;
  thought?: boolean;
}

export interface GeminiResponseLike {
  text?: string;
  candidates?: Array<{
    content?: {
      parts?: GeminiPartLike[];
    };
  }>;
}

/**
 * Safely extracts the final JSON payload from a Gemini response, ignoring any
 * internal reasoning/thinking parts (`part.thought === true`) and stripping
 * accidental markdown code fences.
 */
export function extractJsonFromGeminiResponse<T = unknown>(response: GeminiResponseLike): T {
  const parts = response.candidates?.[0]?.content?.parts;
  let rawText = '';

  if (Array.isArray(parts) && parts.length > 0) {
    const outputTextParts = parts
      .filter((part) => !part.thought && typeof part.text === 'string' && part.text.trim().length > 0)
      .map((part) => part.text as string);

    if (outputTextParts.length > 0) {
      rawText = outputTextParts.join('\n').trim();
    }
  }

  if (!rawText && typeof response.text === 'string') {
    rawText = response.text.trim();
  }

  if (!rawText) {
    throw new Error('Model returned an empty response.');
  }

  const cleaned = stripMarkdownCodeFences(rawText);

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const sliced = cleaned.slice(firstBrace, lastBrace + 1);
      return JSON.parse(sliced) as T;
    }
    throw new Error('Model output was not valid JSON.');
  }
}

export function stripMarkdownCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  return trimmed;
}

interface RawModelDeckOutput {
  deckTitle?: unknown;
  syllabusSummary?: unknown;
  flashcards?: unknown[];
  quizQuestions?: unknown[];
}

export function normalizeGeneratedDeck(
  raw: RawModelDeckOutput,
  meta: {
    syllabus: SyllabusTrack;
    rigor: RigorLevel;
    outputMode: OutputMode;
    modelUsed: ModelId;
    sourceExcerpt: string;
  }
): RecallDeck {
  const nowIso = new Date().toISOString();
  const deckId = `deck-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  const flashcards: FlashcardItem[] = Array.isArray(raw.flashcards)
    ? raw.flashcards
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
        .map((item, idx) => ({
          id: `${deckId}-fc-${idx + 1}`,
          concept: asNonEmptyString(item.concept, `Concept ${idx + 1}`),
          mechanism: asNonEmptyString(item.mechanism, 'Causal Chain'),
          prompt: asNonEmptyString(item.prompt, 'Explain the underlying mechanism.'),
          hint: asNonEmptyString(item.hint, 'Trace the conserved quantity or boundary condition.'),
          answer: asNonEmptyString(item.answer, 'No answer provided.'),
          commonPitfall: asNonEmptyString(
            item.commonPitfall,
            'Watch for sign-convention reversals and invalid steady-state assumptions.'
          ),
          syllabusTag: asNonEmptyString(item.syllabusTag, meta.syllabus),
          reviewCount: 0,
        }))
    : [];

  const quizQuestions: QuizQuestionItem[] = Array.isArray(raw.quizQuestions)
    ? raw.quizQuestions
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
        .map((item, idx) => {
          const rawOptions = Array.isArray(item.options)
            ? item.options.map((opt) => String(opt ?? '').trim()).filter(Boolean)
            : [];
          const options =
            rawOptions.length >= 2
              ? rawOptions.slice(0, 4)
              : ['Option A', 'Option B', 'Option C', 'Option D'];

          const rawCorrectIdx =
            typeof item.correctIndex === 'number' && Number.isInteger(item.correctIndex)
              ? item.correctIndex
              : 0;
          const correctIndex =
            rawCorrectIdx >= 0 && rawCorrectIdx < options.length ? rawCorrectIdx : 0;

          const distractorNotes = Array.isArray(item.distractorNotes)
            ? item.distractorNotes
                .filter((d): d is Record<string, unknown> => Boolean(d && typeof d === 'object'))
                .map((d) => ({
                  optionIndex: typeof d.optionIndex === 'number' ? d.optionIndex : 0,
                  whyIncorrect: asNonEmptyString(d.whyIncorrect, 'Violates the governing principle.'),
                }))
            : [];

          return {
            id: `${deckId}-qz-${idx + 1}`,
            concept: asNonEmptyString(item.concept, `Diagnostic Item ${idx + 1}`),
            mechanism: asNonEmptyString(item.mechanism, 'Edge Case'),
            scenarioPrompt: asNonEmptyString(
              item.scenarioPrompt,
              'Predict the outcome under the given perturbation.'
            ),
            options,
            correctIndex,
            correctExplanation: asNonEmptyString(
              item.correctExplanation,
              'Follows directly from the governing conservation law.'
            ),
            distractorNotes,
            syllabusTag: asNonEmptyString(item.syllabusTag, meta.syllabus),
          };
        })
    : [];

  return {
    id: deckId,
    title: asNonEmptyString(raw.deckTitle, `${meta.syllabus} Recall Set`),
    syllabus: meta.syllabus,
    rigor: meta.rigor,
    outputMode: meta.outputMode,
    modelUsed: meta.modelUsed,
    createdAt: nowIso,
    sourceExcerpt: meta.sourceExcerpt.slice(0, 220),
    syllabusSummary: asNonEmptyString(
      raw.syllabusSummary,
      `${meta.syllabus} · ${meta.rigor}`
    ),
    flashcards,
    quizQuestions,
  };
}

function asNonEmptyString(val: unknown, fallback: string): string {
  if (typeof val === 'string' && val.trim().length > 0) {
    return val.trim();
  }
  return fallback;
}

export function applyFlashcardRating(
  cards: FlashcardItem[],
  cardId: string,
  rating: FlashcardRating
): FlashcardItem[] {
  return cards.map((card) =>
    card.id === cardId
      ? {
          ...card,
          rating,
          reviewCount: (card.reviewCount ?? 0) + 1,
        }
      : card
  );
}

export function computeSessionStats(cards: FlashcardItem[]): SessionStats {
  const totalCards = cards.length;
  let reviewedCards = 0;
  let masteredCards = 0;
  let hardCards = 0;
  let againCards = 0;

  for (const card of cards) {
    if (card.rating) {
      reviewedCards += 1;
      if (card.rating === 'mastered') masteredCards += 1;
      else if (card.rating === 'hard') hardCards += 1;
      else if (card.rating === 'again') againCards += 1;
    }
  }

  const masteryPercent = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

  return {
    totalCards,
    reviewedCards,
    masteredCards,
    hardCards,
    againCards,
    masteryPercent,
  };
}

export function scoreQuizSubmissions(
  questions: QuizQuestionItem[],
  submissions: Record<string, QuizSubmission>
): {
  answeredCount: number;
  correctCount: number;
  accuracyPercent: number;
  missedQuestionIds: string[];
} {
  let answeredCount = 0;
  let correctCount = 0;
  const missedQuestionIds: string[] = [];

  for (const q of questions) {
    const sub = submissions[q.id];
    if (sub) {
      answeredCount += 1;
      if (sub.isCorrect) {
        correctCount += 1;
      } else {
        missedQuestionIds.push(q.id);
      }
    }
  }

  const accuracyPercent =
    answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  return {
    answeredCount,
    correctCount,
    accuracyPercent,
    missedQuestionIds,
  };
}

export function convertMissedQuizToFlashcards(
  questions: QuizQuestionItem[],
  missedIds: string[]
): FlashcardItem[] {
  const missedSet = new Set(missedIds);
  return questions
    .filter((q) => missedSet.has(q.id))
    .map((q, idx) => ({
      id: `converted-${q.id}-${idx + 1}`,
      concept: q.concept,
      mechanism: q.mechanism,
      prompt: q.scenarioPrompt,
      hint: `Eliminate distractors by checking ${q.mechanism.toLowerCase()}.`,
      answer: `${q.options[q.correctIndex] ?? ''}\n\nReasoning: ${q.correctExplanation}`,
      commonPitfall:
        q.distractorNotes[0]?.whyIncorrect ??
        'Double-check sign conventions and boundary conditions.',
      syllabusTag: q.syllabusTag,
      reviewCount: 0,
    }));
}

function escapeCsvCell(value: string): string {
  const normalized = value.replace(/\r?\n/g, '<br>');
  if (/[",]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

export function exportDeckToAnkiCsv(deck: RecallDeck): string {
  const rows: string[] = ['Front,Back,Tags'];

  for (const card of deck.flashcards) {
    const front = `[${card.concept} · ${card.mechanism}]\n${card.prompt}`;
    const back = `${card.answer}\n\nCommon Pitfall: ${card.commonPitfall}`;
    const tag = `${deck.syllabus.replace(/\s+/g, '_')} ${card.mechanism.replace(/\s+/g, '_')}`;
    rows.push(`${escapeCsvCell(front)},${escapeCsvCell(back)},${escapeCsvCell(tag)}`);
  }

  for (const q of deck.quizQuestions) {
    const front = `[Quiz · ${q.concept}]\n${q.scenarioPrompt}\n${q.options
      .map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`)
      .join('\n')}`;
    const back = `Correct: ${q.options[q.correctIndex] ?? ''}\n\n${q.correctExplanation}`;
    const tag = `${deck.syllabus.replace(/\s+/g, '_')} Diagnostic_Quiz`;
    rows.push(`${escapeCsvCell(front)},${escapeCsvCell(back)},${escapeCsvCell(tag)}`);
  }

  return rows.join('\n');
}

export function exportDeckToMarkdown(deck: RecallDeck): string {
  const lines: string[] = [
    `# ${deck.title}`,
    `**Syllabus:** ${deck.syllabus} · **Rigor:** ${deck.rigor}`,
    '',
  ];

  if (deck.flashcards.length > 0) {
    lines.push('## Active-Recall Flashcards', '');
    deck.flashcards.forEach((card, i) => {
      lines.push(`### ${i + 1}. ${card.concept} (${card.mechanism})`);
      lines.push(`**Prompt:** ${card.prompt}`);
      lines.push(`**Hint:** ${card.hint}`);
      lines.push(`**Answer:** ${card.answer}`);
      lines.push(`**Common Pitfall:** ${card.commonPitfall}`);
      lines.push('');
    });
  }

  if (deck.quizQuestions.length > 0) {
    lines.push('## Diagnostic Quiz Items', '');
    deck.quizQuestions.forEach((q, i) => {
      lines.push(`### Q${i + 1}. ${q.concept} (${q.mechanism})`);
      lines.push(q.scenarioPrompt);
      lines.push('');
      q.options.forEach((opt, idx) => {
        const marker = idx === q.correctIndex ? '[x]' : '[ ]';
        lines.push(`- ${marker} ${String.fromCharCode(65 + idx)}. ${opt}`);
      });
      lines.push('');
      lines.push(`**Explanation:** ${q.correctExplanation}`);
      lines.push('');
    });
  }

  return lines.join('\n');
}

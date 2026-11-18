import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyFlashcardRating,
  buildSystemInstruction,
  computeSessionStats,
  convertMissedQuizToFlashcards,
  exportDeckToAnkiCsv,
  exportDeckToMarkdown,
  extractJsonFromGeminiResponse,
  normalizeGeneratedDeck,
  scoreQuizSubmissions,
  validateGenerateInput,
} from './recallLogic';
import { SAMPLE_PRESETS } from './sampleDecks';

test('buildSystemInstruction injects syllabus, rigor, and anti-trivia/atomic rules', () => {
  const prompt = buildSystemInstruction({
    syllabus: 'CBSE Class 12 Physics',
    rigor: 'Edge-Case & Olympiad',
    outputMode: 'mixed',
    itemCount: 8,
  });

  assert.match(prompt, /Principal Instructional Designer/);
  assert.match(prompt, /CBSE Class 12 Physics/);
  assert.match(prompt, /Edge-Case & Olympiad/);
  assert.match(prompt, /Ban Trivia & Rote Lookups/);
  assert.match(prompt, /Atomic Boundaries/);
  assert.match(prompt, /4 atomic active-recall flashcards and 4 diagnostic quizQuestions/);
});

test('validateGenerateInput rejects empty inputs and invalid models', () => {
  const emptyResult = validateGenerateInput({
    notesText: '   ',
    attachment: null,
    itemCount: 6,
    model: 'gemini-3.5-flash-lite',
  });
  assert.equal(emptyResult.valid, false);

  const shortResult = validateGenerateInput({
    notesText: 'Too short',
    attachment: null,
    itemCount: 6,
    model: 'gemini-3.5-flash-lite',
  });
  assert.equal(shortResult.valid, false);

  const badModel = validateGenerateInput({
    notesText: 'Faraday law states that induced EMF opposes flux change in any closed loop.',
    attachment: null,
    itemCount: 6,
    model: 'gemini-1.5-pro',
  });
  assert.equal(badModel.valid, false);

  const validInput = validateGenerateInput({
    notesText: 'Faraday law states that induced EMF opposes flux change in any closed loop.',
    attachment: null,
    itemCount: 6,
    model: 'gemini-3.8-flash',
  });
  assert.equal(validInput.valid, true);
});

test('extractJsonFromGeminiResponse ignores thinking parts and strips code fences', () => {
  const parsed = extractJsonFromGeminiResponse<{ deckTitle: string; flashcards: unknown[] }>({
    candidates: [
      {
        content: {
          parts: [
            {
              thought: true,
              text: 'Let me think step by step about Lenz law and sign conventions...',
            },
            {
              thought: false,
              text: '```json\n{"deckTitle":"Lenz Law Mechanics","flashcards":[],"quizQuestions":[]}\n```',
            },
          ],
        },
      },
    ],
  });

  assert.equal(parsed.deckTitle, 'Lenz Law Mechanics');
  assert.deepEqual(parsed.flashcards, []);
});

test('normalizeGeneratedDeck bounds invalid correctIndex and populates defaults', () => {
  const deck = normalizeGeneratedDeck(
    {
      deckTitle: 'Nernst Sign Conventions',
      flashcards: [
        {
          concept: 'Reaction Quotient Inversion',
          mechanism: 'Sign Convention',
          prompt: 'How does doubling [Zn2+] shift E_cell?',
          hint: 'Check Q numerator.',
          answer: 'E_cell decreases.',
          commonPitfall: 'Inverting Q.',
          syllabusTag: 'Ch. 2',
        },
      ],
      quizQuestions: [
        {
          concept: 'Intensive Potential',
          scenarioPrompt: 'Doubling coefficients scales what?',
          options: ['Delta G doubles, E unchanged', 'Both double'],
          correctIndex: 99,
          correctExplanation: 'E is intensive.',
        },
      ],
    },
    {
      syllabus: 'CBSE Class 12 Chemistry',
      rigor: 'Board Conceptual',
      outputMode: 'mixed',
      modelUsed: 'gemini-3.5-flash-lite',
      sourceExcerpt: 'Nernst equation...',
    }
  );

  assert.equal(deck.flashcards.length, 1);
  assert.equal(deck.quizQuestions.length, 1);
  assert.equal(deck.quizQuestions[0].correctIndex, 0);
});

test('applyFlashcardRating and computeSessionStats track mastery deterministically', () => {
  const initialCards = SAMPLE_PRESETS[0].deck.flashcards;
  let updated = applyFlashcardRating(initialCards, initialCards[0].id, 'mastered');
  updated = applyFlashcardRating(updated, initialCards[1].id, 'again');

  const stats = computeSessionStats(updated);
  assert.equal(stats.totalCards, initialCards.length);
  assert.equal(stats.reviewedCards, 2);
  assert.equal(stats.masteredCards, 1);
  assert.equal(stats.againCards, 1);
  assert.equal(stats.masteryPercent, Math.round((1 / initialCards.length) * 100));
});

test('scoreQuizSubmissions and convertMissedQuizToFlashcards work accurately', () => {
  const questions = SAMPLE_PRESETS[0].deck.quizQuestions;
  const result = scoreQuizSubmissions(questions, {
    [questions[0].id]: { selectedOptionIndex: 0, isCorrect: true },
    [questions[1].id]: { selectedOptionIndex: 1, isCorrect: false },
  });

  assert.equal(result.answeredCount, 2);
  assert.equal(result.correctCount, 1);
  assert.equal(result.accuracyPercent, 50);
  assert.deepEqual(result.missedQuestionIds, [questions[1].id]);

  const converted = convertMissedQuizToFlashcards(questions, result.missedQuestionIds);
  assert.equal(converted.length, 1);
  assert.equal(converted[0].concept, questions[1].concept);
});

test('exportDeckToAnkiCsv and exportDeckToMarkdown format safely', () => {
  const deck = SAMPLE_PRESETS[0].deck;
  const csv = exportDeckToAnkiCsv(deck);
  assert.match(csv, /^Front,Back,Tags/);
  assert.match(csv, /Lenz Law Polarity Under Decreasing Flux/);

  const md = exportDeckToMarkdown(deck);
  assert.match(md, /# Electromagnetic Induction: Lenz Sign & Energy Coupling/);
  assert.match(md, /## Active-Recall Flashcards/);
  assert.match(md, /## Diagnostic Quiz Items/);
});

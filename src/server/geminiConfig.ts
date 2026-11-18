import { ThinkingLevel, Type, type GenerateContentConfig, type Schema } from '@google/genai';
import type { ModelId } from '../lib/types';

export function getThinkingLevelForModel(model: ModelId): ThinkingLevel {
  if (model === 'gemini-3.5-flash-lite') {
    return ThinkingLevel.MINIMAL;
  }
  return ThinkingLevel.LOW;
}

export function buildRecallResponseSchema(): Schema {
  return {
    type: Type.OBJECT,
    required: ['deckTitle', 'syllabusSummary', 'flashcards', 'quizQuestions'],
    properties: {
      deckTitle: {
        type: Type.STRING,
        description: 'Concise scholarly title summarizing the atomic concepts covered.',
      },
      syllabusSummary: {
        type: Type.STRING,
        description: 'One-line alignment summary referencing syllabus track and rigor.',
      },
      flashcards: {
        type: Type.ARRAY,
        description: 'Atomic active-recall flashcards testing mechanics, causal chains, or edge cases.',
        items: {
          type: Type.OBJECT,
          required: [
            'concept',
            'mechanism',
            'prompt',
            'hint',
            'answer',
            'commonPitfall',
            'syllabusTag',
          ],
          properties: {
            concept: {
              type: Type.STRING,
              description: 'Single atomic concept name (3-7 words).',
            },
            mechanism: {
              type: Type.STRING,
              description:
                'Cognitive target: Causal Chain, Sign Convention, Edge Case, Mathematical Trade-Off, Experimental Perturbation, Derivation Step, or Mechanism Boundary.',
            },
            prompt: {
              type: Type.STRING,
              description:
                'Focused active-recall question requiring prediction, derivation, or sign analysis (never bare trivia).',
            },
            hint: {
              type: Type.STRING,
              description: 'Nudge pointing to the governing conservation law or boundary condition without giving away the answer.',
            },
            answer: {
              type: Type.STRING,
              description: 'Rigorous, step-by-step worked answer with exact SI units and sign conventions.',
            },
            commonPitfall: {
              type: Type.STRING,
              description: 'Specific student misconception or sign/assumption trap to avoid.',
            },
            syllabusTag: {
              type: Type.STRING,
              description: 'Chapter or NCERT topic tag.',
            },
          },
        },
      },
      quizQuestions: {
        type: Type.ARRAY,
        description: 'Diagnostic multiple-choice items with misconception analysis per distractor.',
        items: {
          type: Type.OBJECT,
          required: [
            'concept',
            'mechanism',
            'scenarioPrompt',
            'options',
            'correctIndex',
            'correctExplanation',
            'distractorNotes',
            'syllabusTag',
          ],
          properties: {
            concept: {
              type: Type.STRING,
              description: 'Single atomic principle tested.',
            },
            mechanism: {
              type: Type.STRING,
              description: 'Cognitive target tested by this scenario.',
            },
            scenarioPrompt: {
              type: Type.STRING,
              description: 'Perturbation or edge-case scenario prompt.',
            },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Exactly 4 distinct answer choices.',
            },
            correctIndex: {
              type: Type.INTEGER,
              description: 'Zero-based index (0-3) of the strictly correct option.',
            },
            correctExplanation: {
              type: Type.STRING,
              description: 'Derivation or mechanistic proof of why the correct option holds.',
            },
            distractorNotes: {
              type: Type.ARRAY,
              description: 'Misconception explanation for each incorrect option index.',
              items: {
                type: Type.OBJECT,
                required: ['optionIndex', 'whyIncorrect'],
                properties: {
                  optionIndex: { type: Type.INTEGER },
                  whyIncorrect: { type: Type.STRING },
                },
              },
            },
            syllabusTag: {
              type: Type.STRING,
              description: 'Chapter or NCERT topic tag.',
            },
          },
        },
      },
    },
  };
}

/**
 * Builds @google/genai GenerateContentConfig without deprecated sampling
 * parameters (temperature, topP, topK, candidateCount) so gemini-3.8-flash
 * and gemini-3.5-flash-lite execute cleanly with structured JSON + thinkingConfig.
 */
export function buildGeminiGenerationConfig(params: {
  model: ModelId;
  systemInstruction: string;
}): GenerateContentConfig {
  return {
    systemInstruction: params.systemInstruction,
    responseMimeType: 'application/json',
    responseSchema: buildRecallResponseSchema(),
    thinkingConfig: {
      thinkingLevel: getThinkingLevelForModel(params.model),
    },
  };
}

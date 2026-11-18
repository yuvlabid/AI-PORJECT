export type ModelId = 'gemini-3.5-flash-lite' | 'gemini-3.8-flash';

export type SyllabusTrack =
  | 'CBSE Class 12 Physics'
  | 'CBSE Class 12 Chemistry'
  | 'CBSE Class 12 Mathematics'
  | 'CBSE Class 12 Biology'
  | 'CBSE Class 12 Computer Science'
  | 'CBSE Class 10 Science'
  | 'CBSE Class 10 Mathematics'
  | 'JEE / NEET Conceptual Bridge'
  | 'University STEM & Engineering';

export type RigorLevel =
  | 'Board Conceptual'
  | 'Application & HOTS'
  | 'Edge-Case & Olympiad';

export type OutputMode = 'flashcards' | 'quiz' | 'mixed';

export type CognitiveMechanism =
  | 'Causal Chain'
  | 'Sign Convention'
  | 'Edge Case'
  | 'Mathematical Trade-Off'
  | 'Experimental Perturbation'
  | 'Derivation Step'
  | 'Mechanism Boundary';

export type FlashcardRating = 'again' | 'hard' | 'mastered';

export interface FlashcardItem {
  id: string;
  concept: string;
  mechanism: CognitiveMechanism | string;
  prompt: string;
  hint: string;
  answer: string;
  commonPitfall: string;
  syllabusTag: string;
  rating?: FlashcardRating;
  reviewCount?: number;
}

export interface QuizDistractorAnalysis {
  optionIndex: number;
  whyIncorrect: string;
}

export interface QuizQuestionItem {
  id: string;
  concept: string;
  mechanism: CognitiveMechanism | string;
  scenarioPrompt: string;
  options: string[];
  correctIndex: number;
  correctExplanation: string;
  distractorNotes: QuizDistractorAnalysis[];
  syllabusTag: string;
}

export interface RecallDeck {
  id: string;
  title: string;
  syllabus: SyllabusTrack;
  rigor: RigorLevel;
  outputMode: OutputMode;
  modelUsed: ModelId | 'sample';
  createdAt: string;
  sourceExcerpt: string;
  syllabusSummary: string;
  flashcards: FlashcardItem[];
  quizQuestions: QuizQuestionItem[];
  lastStudiedAt?: string;
}

export interface UploadedAttachment {
  name: string;
  mimeType: string;
  sizeBytes: number;
  /** Base64 content without data URL prefix for binary/PDF/images, or plain UTF-8 text for .txt/.md */
  data: string;
  encoding: 'base64' | 'utf8';
}

export interface GenerateRequestPayload {
  notesText: string;
  attachment?: UploadedAttachment | null;
  syllabus: SyllabusTrack;
  rigor: RigorLevel;
  outputMode: OutputMode;
  itemCount: number;
  model: ModelId;
}

export interface GenerateResponsePayload {
  deck: RecallDeck;
}

export interface QuizSubmission {
  selectedOptionIndex: number;
  isCorrect: boolean;
}

export interface SessionStats {
  totalCards: number;
  reviewedCards: number;
  masteredCards: number;
  hardCards: number;
  againCards: number;
  masteryPercent: number;
}

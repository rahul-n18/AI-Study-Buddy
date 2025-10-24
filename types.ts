
export type GameType = 'sentence-scramble' | 'word-translation' | 'fill-in-the-blank';

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
}

export type VoiceSessionStatus = 'idle' | 'connecting' | 'active' | 'error';

// Base interface for all exercises
interface BaseExercise {
  id: string;
  type: GameType;
  prompt: string;
  solution: string;
}

// Specific exercise types
export interface SentenceScrambleExercise extends BaseExercise {
  type: 'sentence-scramble';
  words: string[]; // Scrambled words
}

export interface WordTranslationExercise extends BaseExercise {
  type: 'word-translation';
  wordToTranslate: string; // e.g., "Hello"
  options: string[]; // e.g., ["Hola", "Adiós", "Gracias", "Por favor"]
}

export interface FillInTheBlankExercise extends BaseExercise {
  type: 'fill-in-the-blank';
  sentence: string; // e.g., "The cat sat on the ___."
  options: string[]; // Multiple choice options for the blank
}

export type Exercise = SentenceScrambleExercise | WordTranslationExercise | FillInTheBlankExercise;


export interface GrammarFeedback {
    isCorrect: boolean;
    correction: string;
    explanation:string;
}

// --- Event Discovery Feature Types ---
export type EventCategory = 'Academic' | 'Tech' | 'Culture' | 'Sports' | 'Social' | 'Career';

export const eventCategories: EventCategory[] = ['Academic', 'Tech', 'Culture', 'Sports', 'Social', 'Career'];

export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string; // ISO string format: "YYYY-MM-DD"
  time: string; // e.g., "14:00 - 16:00"
  location: string;
  registrationLink?: string;
  isRecommended?: boolean;
}
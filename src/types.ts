export type TranslateInput = {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
};

export type TranslateResult = {
  translatedText: string;
  detectedLanguage?: string;
};

export type TranslationHistoryItem = {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  createdAt: string;
};

export type ConversationItem = {
  id: string;
  speaker: "A" | "B";
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  createdAt: string;
};

export type Language = {
  code: string;
  name: string;
};

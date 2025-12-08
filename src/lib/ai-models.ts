// Fixed model: gemini-pro (backend handles model selection)
// All requests go through Cloud Run backend which uses gemini-pro
export const DEFAULT_MODEL = 'gemini-pro';

// Model aliases - simplified for backend API
const ALIAS_PAIRS: Array<[string, string]> = [
  // All models resolve to gemini-pro (backend decides actual model)
  ['gemini-1.0-pro', 'gemini-pro'],
  ['gemini-pro', 'gemini-pro'],
  ['gemini-1.5-pro', 'gemini-pro'], // legacy -> gemini-pro
  ['gemini-1.5-flash', 'gemini-pro'],
  ['gemini-2.0-flash', 'gemini-pro'],
];

const aliasMap = ALIAS_PAIRS.reduce<Record<string, string>>((acc, [alias, canonical]) => {
  acc[alias.toLowerCase()] = canonical;
  return acc;
}, {});

export function normalizeModel(model?: string | null): string {
  if (!model) return DEFAULT_MODEL;
  const key = model.trim().toLowerCase();
  return aliasMap[key] || model;
}

export function describeModel(model: string): string {
  const key = normalizeModel(model);
  switch (key) {
    case 'gemini-1.5-pro':
      return 'Gemini 1.5 Pro';
    case 'gemini-1.5-flash':
      return 'Gemini 1.5 Flash';
    case 'gemini-1.5-flash-8b':
      return 'Gemini 1.5 Flash 8B';
    case 'gemini-pro':
      return 'Gemini Pro';
    default:
      return model;
  }
}

export const FALLBACK_MODELS: string[] = [
  'gemini-pro',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

export const MODEL_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'gemini-pro', label: 'Gemini Pro (recomendado)' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash 8B' },
];

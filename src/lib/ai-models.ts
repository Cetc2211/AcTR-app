// Fixed model: gemini-2.5-pro (backend handles model selection)
// All requests go through Cloud Run backend which uses gemini-2.5-pro
export const DEFAULT_MODEL = 'gemini-2.5-pro';

// Model aliases - simplified for backend API
const ALIAS_PAIRS: Array<[string, string]> = [
  // All models resolve to gemini-1.5-flash (backend decides actual model)
  ['gemini-1.0-pro', 'gemini-1.5-flash'],
  ['gemini-pro', 'gemini-1.5-flash'],
  ['gemini-1.5-pro', 'gemini-1.5-flash'],
  ['gemini-1.5-flash', 'gemini-1.5-flash'],
  ['gemini-2.0-flash', 'gemini-1.5-flash'],
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
    case 'gemini-1.5-flash':
      return 'Gemini 1.5 Flash';
    default:
      return model;
  }
}

export const FALLBACK_MODELS: string[] = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash',
];

export const MODEL_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (recomendado)' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
];

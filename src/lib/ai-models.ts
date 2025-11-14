export const DEFAULT_MODEL = 'models/gemini-1.5-pro-latest';

const ALIAS_PAIRS: Array<[string, string]> = [
  ['models/gemini-1.5-pro-latest', 'models/gemini-1.5-pro-latest'],
  ['gemini-1.5-pro', 'models/gemini-1.5-pro-latest'],
  ['gemini-2.5-pro', 'models/gemini-1.5-pro-latest'],
  ['gemini-pro', 'models/gemini-1.5-pro-latest'],
  ['gemini-1.5-pro-exp', 'models/gemini-1.5-pro-latest'],
  ['models/gemini-1.5-flash-latest', 'models/gemini-1.5-flash-latest'],
  ['gemini-1.5-flash', 'models/gemini-1.5-flash-latest'],
  ['gemini-2.5-flash', 'models/gemini-1.5-flash-latest'],
  ['gemini-2.0-flash', 'models/gemini-1.5-flash-latest'],
  ['models/gemini-1.5-flash-8b-latest', 'models/gemini-1.5-flash-8b-latest'],
  ['gemini-1.5-flash-8b', 'models/gemini-1.5-flash-8b-latest'],
  ['gemini-2.0-flash-lite', 'models/gemini-1.5-flash-8b-latest'],
  ['models/gemini-1.0-pro-latest', 'models/gemini-1.0-pro-latest'],
  ['gemini-1.0-pro', 'models/gemini-1.0-pro-latest'],
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
    case 'models/gemini-1.5-pro-latest':
      return 'Gemini 1.5 Pro';
    case 'models/gemini-1.5-flash-latest':
      return 'Gemini 1.5 Flash';
    case 'models/gemini-1.5-flash-8b-latest':
      return 'Gemini 1.5 Flash 8B';
    case 'models/gemini-1.0-pro-latest':
      return 'Gemini 1.0 Pro';
    default:
      return model;
  }
}

export const FALLBACK_MODELS: string[] = [
  DEFAULT_MODEL,
  'models/gemini-1.5-flash-latest',
  'models/gemini-1.5-flash-8b-latest',
  'models/gemini-1.0-pro-latest',
];

export const MODEL_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'models/gemini-1.5-pro-latest', label: 'Gemini 1.5 Pro (recomendado)' },
  { value: 'models/gemini-1.5-flash-latest', label: 'Gemini 1.5 Flash' },
  { value: 'models/gemini-1.5-flash-8b-latest', label: 'Gemini 1.5 Flash 8B' },
  { value: 'models/gemini-1.0-pro-latest', label: 'Gemini 1.0 Pro' },
];

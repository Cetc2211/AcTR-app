export const DEFAULT_MODEL = 'gemini-1.5-pro';

const ALIAS_PAIRS: Array<[string, string]> = [
  // Pro canonical
  ['gemini-1.5-pro', 'gemini-1.5-pro'],
  ['models/gemini-1.5-pro-latest', 'gemini-1.5-pro'],
  ['gemini-pro', 'gemini-1.5-pro'],
  ['gemini-1.5-pro-exp', 'gemini-1.5-pro'],
  ['gemini-2.5-pro', 'gemini-1.5-pro'], // legacy alias -> 1.5-pro
  // Flash canonical
  ['gemini-1.5-flash', 'gemini-1.5-flash'],
  ['models/gemini-1.5-flash-latest', 'gemini-1.5-flash'],
  ['gemini-2.5-flash', 'gemini-1.5-flash'],
  ['gemini-2.0-flash', 'gemini-1.5-flash'],
  // Flash 8B canonical
  ['gemini-1.5-flash-8b', 'gemini-1.5-flash-8b'],
  ['models/gemini-1.5-flash-8b-latest', 'gemini-1.5-flash-8b'],
  ['gemini-2.0-flash-lite', 'gemini-1.5-flash-8b'],
  // 1.0 pro canonical (fallback legacy)
  ['gemini-1.0-pro', 'gemini-1.0-pro'],
  ['models/gemini-1.0-pro-latest', 'gemini-1.0-pro'],
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
    case 'gemini-1.0-pro':
      return 'Gemini 1.0 Pro';
    default:
      return model;
  }
}

export const FALLBACK_MODELS: string[] = [
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.0-pro',
];

export const MODEL_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (recomendado)' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash 8B' },
  { value: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro' },
];

import { del, get, keys, set } from 'idb-keyval';

const PREFIX = 'eco_mat_';

interface CachedMaterial {
  html: string;
  timestamp: number;
  size: number;
  version?: string;
}

interface CacheStats {
  materialCount: number;
  totalSizeBytes: number;
}

export async function cacheMaterial(
  key: string,
  html: string,
  version?: string
): Promise<void> {
  const namespacedKey = `${PREFIX}${key}`;
  const payload: CachedMaterial = {
    html,
    timestamp: Date.now(),
    size: new Blob([html]).size,
    version,
  };

  await set(namespacedKey, payload);
}

export async function getCachedMaterial(key: string): Promise<string | null> {
  const namespacedKey = `${PREFIX}${key}`;
  const payload = await get<CachedMaterial>(namespacedKey);
  return payload?.html ?? null;
}

export async function isMaterialCached(key: string): Promise<boolean> {
  const namespacedKey = `${PREFIX}${key}`;
  const payload = await get<CachedMaterial>(namespacedKey);
  return Boolean(payload?.html);
}

export async function clearEcosystemCache(): Promise<void> {
  const allKeys = await keys();
  const ecosystemKeys = allKeys.filter((key) => String(key).startsWith(PREFIX));

  await Promise.all(ecosystemKeys.map((key) => del(key)));
}

export async function removeCachedMaterial(key: string): Promise<void> {
  const namespacedKey = `${PREFIX}${key}`;
  await del(namespacedKey);
}

export async function getCacheStats(): Promise<CacheStats> {
  const allKeys = await keys();
  const ecosystemKeys = allKeys.filter((key) => String(key).startsWith(PREFIX));

  const cachedItems = await Promise.all(
    ecosystemKeys.map((key) => get<CachedMaterial>(key))
  );

  const totalSizeBytes = cachedItems.reduce((total, item) => {
    return total + (item?.size ?? 0);
  }, 0);

  return {
    materialCount: ecosystemKeys.length,
    totalSizeBytes,
  };
}

export async function getLastCacheUpdate(): Promise<number | null> {
  const allKeys = await keys();
  const ecosystemKeys = allKeys.filter((key) => String(key).startsWith(PREFIX));

  const cachedItems = await Promise.all(
    ecosystemKeys.map((key) => get<CachedMaterial>(key))
  );

  const latestTimestamp = cachedItems.reduce((latest, item) => {
    return item?.timestamp && item.timestamp > latest ? item.timestamp : latest;
  }, 0);

  return latestTimestamp || null;
}

export type { CachedMaterial, CacheStats };
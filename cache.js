/**
 * Mini cache. Houdt de laatste geslaagde waarde vast, zodat de site blijft werken
 * als Discord of de FiveM API even niet reageert.
 */
const store = new Map();

export async function cached(key, ttlMs, loader) {
  const now = Date.now();
  const hit = store.get(key);

  if (hit && now - hit.time < ttlMs) return hit.value;

  if (hit?.pending) return hit.pending;

  const pending = loader()
    .then((value) => {
      store.set(key, { value, time: Date.now() });
      return value;
    })
    .catch((err) => {
      console.error(`[cache] ${key} mislukt:`, err.message);
      if (hit) {
        // Serveer verouderde data in plaats van een fout.
        store.set(key, { value: hit.value, time: Date.now() - ttlMs / 2 });
        return hit.value;
      }
      store.delete(key);
      throw err;
    });

  store.set(key, { ...(hit || {}), pending });
  return pending;
}

export function clearCache(key) {
  if (key) store.delete(key);
  else store.clear();
}

// Utility module for handling offline Quran text, reciter audio caching, and word-by-word offline downloads.

const CACHE_NAME_RECITER = 'quran-reciter-audio-v1';
const CACHE_NAME_WBW = 'quran-wbw-audio-v1';

// IndexedDB configuration
const DB_NAME = 'QuranOfflineStorageDB';
const DB_VERSION = 1;
const STORE_PAGES = 'pages';
const STORE_SURAHS = 'surahs';

function openQuranDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_PAGES)) {
        db.createObjectStore(STORE_PAGES, { keyPath: 'page' });
      }
      if (!db.objectStoreNames.contains(STORE_SURAHS)) {
        db.createObjectStore(STORE_SURAHS, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Store page text in IndexedDB
export async function savePageToDB(page: number, verses: any[]): Promise<void> {
  try {
    const db = await openQuranDB();
    const tx = db.transaction(STORE_PAGES, 'readwrite');
    tx.objectStore(STORE_PAGES).put({ page, verses, timestamp: Date.now() });
  } catch (err) {
    try {
      localStorage.setItem(`quran_offline_page_${page}`, JSON.stringify(verses));
    } catch (e) {
      console.warn('LocalStorage quota error on page save:', e);
    }
  }
}

// Retrieve page text from IndexedDB
export async function getPageFromDB(page: number): Promise<any[] | null> {
  try {
    const db = await openQuranDB();
    const tx = db.transaction(STORE_PAGES, 'readonly');
    const store = tx.objectStore(STORE_PAGES);
    return new Promise((resolve) => {
      const req = store.get(page);
      req.onsuccess = () => {
        if (req.result && req.result.verses) resolve(req.result.verses);
        else resolve(null);
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    try {
      const cached = localStorage.getItem(`quran_offline_page_${page}`);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return null;
  }
}

// Store surah text in IndexedDB
export async function saveSurahToDB(surahId: number, reciterId: number, verses: any[]): Promise<void> {
  const key = `${surahId}_reciter_${reciterId}`;
  try {
    const db = await openQuranDB();
    const tx = db.transaction(STORE_SURAHS, 'readwrite');
    tx.objectStore(STORE_SURAHS).put({ key, surahId, reciterId, verses, timestamp: Date.now() });
  } catch (err) {
    try {
      localStorage.setItem(`quran_offline_surah_${key}`, JSON.stringify(verses));
    } catch (e) {}
  }
}

// Retrieve surah text from IndexedDB
export async function getSurahFromDB(surahId: number, reciterId: number): Promise<any[] | null> {
  const normalizedId = surahId > 1000 ? surahId - 1000 : surahId;
  const key = `${surahId}_reciter_${reciterId}`;
  
  // 1. Check direct key or default reciter key in STORE_SURAHS
  try {
    const db = await openQuranDB();
    const tx = db.transaction(STORE_SURAHS, 'readonly');
    const store = tx.objectStore(STORE_SURAHS);
    const resultVerses: any[] = await new Promise((resolve) => {
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result && req.result.verses) resolve(req.result.verses);
        else resolve(null);
      };
      req.onerror = () => resolve(null);
    });
    if (resultVerses && resultVerses.length > 0) {
      return resultVerses;
    }

    const defaultKey = `${normalizedId}_reciter_7`;
    const defaultVerses: any[] = await new Promise((resolve) => {
      const req = store.get(defaultKey);
      req.onsuccess = () => {
        if (req.result && req.result.verses) resolve(req.result.verses);
        else resolve(null);
      };
      req.onerror = () => resolve(null);
    });
    if (defaultVerses && defaultVerses.length > 0) {
      return defaultVerses;
    }
  } catch (err) {}

  // 2. FALLBACK: Gather verses for this surah from all stored pages in STORE_PAGES
  try {
    const db = await openQuranDB();
    const tx = db.transaction(STORE_PAGES, 'readonly');
    const store = tx.objectStore(STORE_PAGES);
    const allPages: any[] = await new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    if (allPages && allPages.length > 0) {
      const collectedVerses: any[] = [];
      const seenVerseKeys = new Set<string>();

      allPages.sort((a, b) => a.page - b.page);

      for (const p of allPages) {
        if (p.verses && Array.isArray(p.verses)) {
          for (const v of p.verses) {
            if (v.verse_key) {
              const [sIdStr] = v.verse_key.split(':');
              if (parseInt(sIdStr) === normalizedId && !seenVerseKeys.has(v.verse_key)) {
                seenVerseKeys.add(v.verse_key);
                collectedVerses.push(v);
              }
            }
          }
        }
      }

      if (collectedVerses.length > 0) {
        saveSurahToDB(surahId, reciterId, collectedVerses);
        return collectedVerses;
      }
    }
  } catch (err) {
    console.warn("Error getting surah from pages DB:", err);
  }

  try {
    const cached = localStorage.getItem(`quran_offline_surah_${key}`);
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  return null;
}

// Pre-cache fonts into CacheStorage for full offline typography support
export async function cacheFontsOffline(): Promise<void> {
  if (!('caches' in window)) return;
  try {
    const fontCache = await caches.open('quran-fonts-v1');
    const fontUrls = [
      '/fonts/UthmanicHafs.otf',
      'https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Scheherazade+New:wght@400;700&family=Noto+Naskh+Arabic:wght@400;700&family=Amiri:wght@400;700&display=swap'
    ];
    for (const fontUrl of fontUrls) {
      try {
        const existing = await fontCache.match(fontUrl);
        if (!existing) {
          const response = await fetch(fontUrl);
          if (response.ok) {
            await fontCache.put(fontUrl, response);
          }
        }
      } catch (e) {}
    }
  } catch (err) {
    console.warn('Font offline cache failed:', err);
  }
}

// Get CacheStorage instance
async function getCacheStorage(isWbw: boolean): Promise<Cache | null> {
  if ('caches' in window) {
    try {
      return await caches.open(isWbw ? CACHE_NAME_WBW : CACHE_NAME_RECITER);
    } catch (e) {
      console.warn('CacheStorage opening failed:', e);
    }
  }
  return null;
}

// Check if audio file is cached and return Blob URL
export async function getCachedAudioBlobUrl(fullUrl: string, isWbw: boolean = false): Promise<string | null> {
  try {
    const cache = await getCacheStorage(isWbw);
    if (!cache) return null;
    const match = await cache.match(fullUrl);
    if (match) {
      const blob = await match.blob();
      return URL.createObjectURL(blob);
    }
  } catch (err) {
    console.warn('Error fetching cached audio blob:', err);
  }
  return null;
}

// Cache an audio file from URL
export async function cacheAudioFile(fullUrl: string, isWbw: boolean = false): Promise<boolean> {
  try {
    const cache = await getCacheStorage(isWbw);
    if (!cache) return false;
    const existing = await cache.match(fullUrl);
    if (existing) return true;

    const res = await fetch(fullUrl, { mode: 'cors' });
    if (res.ok) {
      await cache.put(fullUrl, res);
      return true;
    }
  } catch (err) {
    console.warn('Failed to cache audio:', fullUrl, err);
  }
  return false;
}

import { RawAppStoreReview } from '../fetch/appStore.js';
import { RawPlayStoreReview } from '../fetch/playStore.js';
import { Review } from '../utils/file.js';

/**
 * Normalizes App Store reviews
 */
export function normalizeAppStoreReviews(raw: RawAppStoreReview[]): Review[] {
  const results: Review[] = [];
  for (const r of raw) {
    if (!r.text || r.text.trim().length === 0) continue;
    try {
      const parsedDate = new Date(r.updated);
      if (isNaN(parsedDate.getTime())) {
        console.warn(`⚠️ Skipping App Store review with invalid date: ${r.updated}`);
        continue;
      }
      results.push({
        source: 'app_store',
        rating: Math.min(5, Math.max(1, r.score)),
        title: r.title || '',
        text: r.text,
        date: parsedDate.toISOString().split('T')[0],
        version: r.version || 'unknown',
      });
    } catch {
      console.warn('⚠️ Skipping App Store review with unparseable date');
    }
  }
  return results;
}

/**
 * Normalizes Play Store reviews
 */
export function normalizePlayStoreReviews(raw: RawPlayStoreReview[]): Review[] {
  const results: Review[] = [];
  for (const r of raw) {
    if (!r.text || r.text.trim().length === 0) continue;
    try {
      const parsedDate = new Date(r.date);
      if (isNaN(parsedDate.getTime())) {
        console.warn(`⚠️ Skipping Play Store review with invalid date: ${r.date}`);
        continue;
      }
      results.push({
        source: 'play_store',
        rating: Math.min(5, Math.max(1, r.score)),
        title: r.title || '',
        text: r.text,
        date: parsedDate.toISOString().split('T')[0],
        version: r.version || 'unknown',
      });
    } catch {
      console.warn('⚠️ Skipping Play Store review with unparseable date');
    }
  }
  return results;
}

/**
 * Combines and normalizes all reviews
 */
export function normalizeAll(appStore: RawAppStoreReview[], playStore: RawPlayStoreReview[]): Review[] {
  const normalizedAppStore = normalizeAppStoreReviews(appStore);
  const normalizedPlayStore = normalizePlayStoreReviews(playStore);

  console.log(`🔄 Normalized ${normalizedAppStore.length + normalizedPlayStore.length} reviews (${normalizedAppStore.length} App Store, ${normalizedPlayStore.length} Play Store)`);

  return [...normalizedAppStore, ...normalizedPlayStore];
}

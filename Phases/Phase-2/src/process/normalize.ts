import { RawAppStoreReview } from '../fetch/appStore.js';
import { RawPlayStoreReview } from '../fetch/playStore.js';
import { Review } from '../utils/file.js';

/**
 * Normalizes App Store reviews
 */
export function normalizeAppStoreReviews(raw: RawAppStoreReview[]): Review[] {
  return raw
    .filter(r => r.text && r.text.trim().length > 0)
    .map(r => ({
      source: 'app_store' as const,
      rating: Math.min(5, Math.max(1, r.score)),
      title: r.title || '',
      text: r.text,
      date: new Date(r.updated).toISOString().split('T')[0],
      version: r.version || 'unknown'
    }));
}

/**
 * Normalizes Play Store reviews
 */
export function normalizePlayStoreReviews(raw: RawPlayStoreReview[]): Review[] {
  return raw
    .filter(r => r.text && r.text.trim().length > 0)
    .map(r => ({
      source: 'play_store' as const,
      rating: Math.min(5, Math.max(1, r.score)),
      title: r.title || '',
      text: r.text,
      date: new Date(r.date).toISOString().split('T')[0],
      version: r.version || 'unknown'
    }));
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

import gplay from 'google-play-scraper';
import fs from 'fs/promises';
import path from 'path';

export interface RawPlayStoreReview {
  score: number;
  title: string | null;
  text: string;
  date: string;
  version: string | null;
}

/**
 * Fetches reviews from the Google Play Store
 */
export async function fetchPlayStoreReviews(packageName: string): Promise<RawPlayStoreReview[]> {
  console.log(`🤖 Fetching Play Store reviews for: ${packageName}...`);
  
  try {
    const result = await gplay.reviews({
      appId: packageName,
      sort: gplay.sort.NEWEST,
      num: 500,
      lang: 'en',
      country: 'in'
    });
    
    // google-play-scraper returns an array directly or { data: [] } depending on version
    // The current version returns the array directly.
    const reviews = (result as any).data || result;
    
    const safeReviews = reviews.map((r: any) => ({
      score: r.score,
      title: r.title || '',
      text: r.text,
      date: r.date,
      version: r.version || 'unknown'
    }));
    
    console.log(`🤖 Fetched ${safeReviews.length} Play Store reviews`);
    
    // Save raw data for debugging
    await fs.mkdir('data/raw', { recursive: true });
    await fs.writeFile(
      path.join('data/raw', 'playstore-reviews.json'),
      JSON.stringify(safeReviews, null, 2)
    );
    
    return safeReviews;
  } catch (err: any) {
    console.error(`❌ Play Store fetch failed: ${err.message}`);
    return [];
  }
}

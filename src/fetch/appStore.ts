import store from 'app-store-scraper';
import fs from 'fs/promises';
import path from 'path';

export interface RawAppStoreReview {
  score: number;
  title: string;
  text: string;
  updated: string;
  version: string;
}

/**
 * Fetches reviews from the Apple App Store
 */
export async function fetchAppStoreReviews(appId: string): Promise<RawAppStoreReview[]> {
  console.log(`📱 Fetching App Store reviews for ID: ${appId}...`);
  
  let allReviews: RawAppStoreReview[] = [];
  
  try {
    // Loop through pages 1-10 (up to ~500 reviews)
    for (let page = 1; page <= 10; page++) {
      const reviews = await store.reviews({
        id: appId,
        sort: store.sort.RECENT,
        page,
        country: 'in'
      });
      
      if (reviews.length === 0) break;
      
      const safeReviews = reviews.map(r => ({
        score: r.score,
        title: r.title,
        text: r.text,
        updated: r.updated,
        version: r.version
      }));
      
      allReviews = allReviews.concat(safeReviews);
      
      // If we got fewer than 50, it's likely the last page
      if (reviews.length < 50) break;
    }
    
    console.log(`📱 Fetched ${allReviews.length} App Store reviews`);
    
    // Save raw data for debugging
    await fs.mkdir('data/raw', { recursive: true });
    await fs.writeFile(
      path.join('data/raw', 'appstore-reviews.json'),
      JSON.stringify(allReviews, null, 2)
    );
    
    return allReviews;
  } catch (err: any) {
    console.error(`❌ App Store fetch failed: ${err.message}`);
    return [];
  }
}

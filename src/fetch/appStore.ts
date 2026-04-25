import store from 'app-store-scraper';
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';

export interface RawAppStoreReview {
  score: number;
  title: string;
  text: string;
  updated: string;
  version: string;
}

const COUNTRY_CODES = ['us', 'gb', 'in', 'ca', 'au'];

async function tryFetchReviews(appId: string, country: string): Promise<RawAppStoreReview[]> {
  let allReviews: RawAppStoreReview[] = [];
  for (let page = 1; page <= 10; page++) {
    const reviews = await store.reviews({
      id: appId,
      sort: store.sort.RECENT,
      page,
      country
    });
    if (reviews.length === 0) break;
    allReviews = allReviews.concat(reviews.map(r => ({
      score: r.score,
      title: r.title,
      text: r.text,
      updated: r.updated,
      version: r.version
    })));
    if (reviews.length < 50) break;
  }
  return allReviews;
}

async function loadFromCSV(): Promise<RawAppStoreReview[]> {
  try {
    const csvPath = path.join('data', 'raw', 'appstore-reviews.csv');
    const content = await fs.readFile(csvPath, 'utf-8');
    const rows = parse(content, { columns: true, skip_empty_lines: true });
    return rows.map((r: any) => ({
      score: parseInt(r.score || r.rating || '0', 10),
      title: r.title || '',
      text: r.text || '',
      updated: r.updated || r.date || new Date().toISOString(),
      version: r.version || ''
    }));
  } catch {
    return [];
  }
}

/**
 * Fetches reviews from the Apple App Store.
 * Tries multiple country codes, then falls back to CSV.
 */
export async function fetchAppStoreReviews(appId: string): Promise<RawAppStoreReview[]> {
  console.log(`📱 Fetching App Store reviews for ID: ${appId}...`);

  let allReviews: RawAppStoreReview[] = [];

  for (const country of COUNTRY_CODES) {
    try {
      allReviews = await tryFetchReviews(appId, country);
      if (allReviews.length > 0) {
        console.log(`📱 Fetched ${allReviews.length} App Store reviews (country: ${country})`);
        break;
      }
    } catch (err: any) {
      console.warn(`   ⚠️ App Store country ${country} failed: ${err.message}`);
    }
  }

  // Fallback: try CSV if API returns nothing
  if (allReviews.length === 0) {
    const csvReviews = await loadFromCSV();
    if (csvReviews.length > 0) {
      console.log(`📱 Loaded ${csvReviews.length} App Store reviews from CSV fallback`);
      allReviews = csvReviews;
    }
  }

  // Save raw data for debugging
  await fs.mkdir('data/raw', { recursive: true });
  await fs.writeFile(
    path.join('data/raw', 'appstore-reviews.json'),
    JSON.stringify(allReviews, null, 2)
  );

  if (allReviews.length === 0) {
    console.warn(`📱 App Store: 0 reviews fetched. The app-store-scraper may be blocked or the app ID may be region-locked.`);
  }

  return allReviews;
}

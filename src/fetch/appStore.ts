import store from 'app-store-scraper';
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { withRetry } from '../utils/retry.js';

export interface RawAppStoreReview {
  score: number;
  title: string;
  text: string;
  updated: string;
  version: string;
}

const COUNTRY_CODES = ['us', 'gb', 'in', 'ca', 'au', 'ae', 'sg', 'hk', 'nz', 'ie'];

async function tryFetchReviews(appId: string, country: string): Promise<RawAppStoreReview[]> {
  let allReviews: RawAppStoreReview[] = [];
  for (let page = 1; page <= 10; page++) {
    const reviews = await withRetry(async () => {
      return await store.reviews({
        id: appId,
        sort: store.sort.HELPFUL,
        page,
        country
      });
    }, {
      retries: 2,
      baseDelay: 4000,
      onRetry: (err, attempt) => {
        console.warn(`      ⚠️ App Store retry (Page ${page}, ${country}) - Attempt ${attempt}`);
      }
    });

    console.log(`      📄 Page ${page}: ${reviews.length} reviews`);
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
      console.log(`   📱 Trying country: ${country}...`);
      const countryReviews = await tryFetchReviews(appId, country);
      if (countryReviews.length > 0) {
        console.log(`   📱 Found ${countryReviews.length} reviews in ${country}`);
        allReviews = allReviews.concat(countryReviews);
      } else {
        console.log(`   📱 No reviews found in ${country}`);
      }
      
      if (allReviews.length >= 500) break;
      
      // Increased delay with jitter to avoid Apple's strict rate limits
      const jitter = Math.random() * 2000;
      await new Promise(resolve => setTimeout(resolve, 5000 + jitter));
    } catch (err: any) {
      console.warn(`   ⚠️ App Store country ${country} failed: ${err.message}`);
    }
  }

  // Deduplicate by text
  const seen = new Set();
  allReviews = allReviews.filter(r => {
    const key = `${r.title}|${r.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`📱 Total unique App Store reviews fetched: ${allReviews.length}`);

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

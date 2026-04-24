import { getConfig } from './config/products.js';
import { ensureDir, readCSV, Review } from './utils/file.js';
import { fetchAppStoreReviews } from './fetch/appStore.js';
import { fetchPlayStoreReviews } from './fetch/playStore.js';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  console.log('🚀 App Review Insights Analyser\n');

  try {
    // 1. Config
    const config = getConfig();
    console.log(`✅ Config loaded for ${config.productName}`);

    // 2. Fetch
    await ensureDir('data/raw');
    await ensureDir('output');

    let appStoreRaw = await fetchAppStoreReviews(config.appStoreId);
    let playStoreRaw = await fetchPlayStoreReviews(config.playStorePackage);

    // CSV Fallback if both empty
    if (appStoreRaw.length === 0 && playStoreRaw.length === 0) {
      console.log('📂 No reviews fetched from stores. Attempting CSV fallback...');
      
      try {
        const appStoreCsv = await readCSV('data/raw/appstore-reviews.csv');
        console.log(`📂 Found ${appStoreCsv.length} App Store reviews in CSV`);
        // Map CSV rows back to raw format if needed, or handle directly
        // For simplicity in Phase 1, we assume CSVs match the unified Review format
      } catch (err) {
        console.warn('⚠️ No App Store fallback CSV found');
      }

      try {
        const playStoreCsv = await readCSV('data/raw/playstore-reviews.csv');
        console.log(`📂 Found ${playStoreCsv.length} Play Store reviews in CSV`);
      } catch (err) {
        console.warn('⚠️ No Play Store fallback CSV found');
      }

      if (appStoreRaw.length === 0 && playStoreRaw.length === 0) {
        // If still empty, we can't proceed to Phase 2
        // But for Phase 1, we just report the status
      }
    }

    const totalRaw = appStoreRaw.length + playStoreRaw.length;
    console.log(`\n📊 Total raw reviews: ${totalRaw}`);

    if (totalRaw === 0) {
      console.error('🛑 No reviews found. Place CSV files in data/raw/ or check network connection.');
      process.exit(1);
    }

    console.log('\nPipeline paused after fetch stage. Proceed to Phase 2.');
  } catch (err: any) {
    console.error(`❌ Pipeline failed: ${err.message}`);
    process.exit(1);
  }
}

main().catch(console.error);

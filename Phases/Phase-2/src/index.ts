import { getConfig } from './config/products.js';
import { ensureDir, writeReviewsCSV } from './utils/file.js';
import { fetchAppStoreReviews } from './fetch/appStore.js';
import { fetchPlayStoreReviews } from './fetch/playStore.js';
import { normalizeAll } from './process/normalize.js';
import { filterRecentReviews } from './process/filterRecent.js';
import { scrubPII } from './process/piiScrub.js';

async function main() {
  console.log('🚀 App Review Insights Analyser\n');

  try {
    // 1. Config
    const config = getConfig();
    console.log(`✅ Config loaded for ${config.productName}`);

    // 2. Fetch
    await ensureDir('data/raw');
    await ensureDir('output');

    const appStoreRaw = await fetchAppStoreReviews(config.appStoreId);
    const playStoreRaw = await fetchPlayStoreReviews(config.playStorePackage);

    const totalRaw = appStoreRaw.length + playStoreRaw.length;
    console.log(`\n📊 Total raw reviews: ${totalRaw}`);

    if (totalRaw === 0) {
      console.error('🛑 No reviews found. Place CSV files in data/raw/ or check network connection.');
      process.exit(1);
    }

    // 3. Normalize
    const normalized = normalizeAll(appStoreRaw, playStoreRaw);

    // 4. Filter
    const filtered = filterRecentReviews(normalized, config.reviewWindowWeeks);

    // 5. PII Scrub + CSV export
    const { reviews, redactionCount } = scrubPII(filtered);
    await writeReviewsCSV(reviews, 'output/reviews.csv');
    console.log(`💾 Saved ${reviews.length} clean reviews to output/reviews.csv`);

    console.log('\nPipeline paused after processing stage. Proceed to Phase 3.');
  } catch (err: any) {
    console.error(`❌ Pipeline failed: ${err.message}`);
    process.exit(1);
  }
}

main().catch(console.error);

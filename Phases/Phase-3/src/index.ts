import { getConfig } from './config/products.js';
import { ensureDir, writeReviewsCSV, Review, WeeklyPulse } from './utils/file.js';
import { fetchAppStoreReviews } from './fetch/appStore.js';
import { fetchPlayStoreReviews } from './fetch/playStore.js';
import { normalizeAll } from './process/normalize.js';
import { filterRecentReviews } from './process/filterRecent.js';
import { scrubPII } from './process/piiScrub.js';
import { clusterThemes } from './process/themeCluster.js';
import { selectQuotesAndActions } from './process/quoteSelector.js';

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

    // 6. AI Analysis (Phase 3)
    console.log('\n🧠 Phase 3: AI Analysis');
    
    const themes = await clusterThemes(reviews, config.maxThemes, config.groqApiKey, config.productName);
    console.log(`🏷️ Identified ${themes.length} themes:`);
    themes.forEach((t, i) => console.log(`   ${i + 1}. ${t.label} (${t.count} reviews, ${t.sentiment})`));

    const topThemes = themes.slice(0, 3);
    const { quotes, actions } = await selectQuotesAndActions(reviews, topThemes, config.groqApiKey);
    console.log(`💬 Selected ${quotes.length} grounded quotes`);
    console.log(`💡 Generated ${actions.length} action ideas`);

    // 7. Store results for Phase 4
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const weeklyPulse: WeeklyPulse = {
      product: config.productName,
      dateRange: {
        from: reviews[reviews.length - 1].date,
        to: reviews[0].date
      },
      totalReviews: reviews.length,
      avgRating,
      themes,
      topThemes,
      quotes,
      actions
    };

    // For now, we'll just log that we have the pulse ready.
    // In Phase 4, we will use this to generate the note and email.
    console.log('\n✨ Weekly Pulse analysis complete!');
    console.log(`📈 Average Rating: ${avgRating.toFixed(1)} / 5.0`);

    console.log('\nPipeline paused after analysis stage. Proceed to Phase 4.');
  } catch (err: any) {
    console.error(`❌ Pipeline failed: ${err.message}`);
    process.exit(1);
  }
}

main().catch(console.error);

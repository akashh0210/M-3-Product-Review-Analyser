import { getConfig } from './config/products.js';
import { ensureDir, writeReviewsCSV, writeMarkdown } from './utils/file.js';
import { fetchAppStoreReviews } from './fetch/appStore.js';
import { fetchPlayStoreReviews } from './fetch/playStore.js';
import { normalizeAll } from './process/normalize.js';
import { filterRecentReviews } from './process/filterRecent.js';
import { scrubPII } from './process/piiScrub.js';
import { clusterThemes } from './process/themeCluster.js';
import { selectQuotesAndActions } from './process/quoteSelector.js';
import { generateWeeklyNote } from './generate/weeklyNote.js';
import { generateEmailDraft } from './generate/emailDraft.js';
import { mcpPush } from './generate/mcpPush.js';

async function main() {
  const startTime = Date.now();
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

    if (reviews.length === 0) {
      console.error('🛑 No reviews left after filtering. Try increasing REVIEW_WINDOW_WEEKS.');
      process.exit(1);
    }

    // 6. AI Analysis (Phase 3)
    console.log('\n🧠 Phase 3: AI Analysis');
    
    const themes = await clusterThemes(reviews, config.maxThemes, config.groqApiKey, config.productName);
    console.log(`🏷️ Identified ${themes.length} themes:`);
    themes.forEach((t, i) => console.log(`   ${i + 1}. ${t.label} (${t.count} reviews, ${t.sentiment})`));

    const topThemes = themes.slice(0, 3);
    const { quotes, actions } = await selectQuotesAndActions(reviews, topThemes, config.groqApiKey);
    console.log(`💬 Selected ${quotes.length} grounded quotes`);
    console.log(`💡 Generated ${actions.length} action ideas`);

    // 7. Generation (Phase 4)
    console.log('\n📝 Phase 4: Generation');
    
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const sortedDates = reviews.map(r => r.date).sort();
    const dateRange = { 
      from: sortedDates[0], 
      to: sortedDates[sortedDates.length - 1] 
    };

    const note = await generateWeeklyNote({
      product: config.productName,
      dateRange,
      totalReviews: reviews.length,
      avgRating,
      topThemes,
      quotes,
      actions
    }, config.groqApiKey);

    await writeMarkdown(note, 'output/weekly-note.md');
    
    const email = generateEmailDraft(note, config.productName, dateRange, 'Sk Akash Ali');
    await writeMarkdown(email, 'output/email-draft.md');
    
    console.log('📧 Email draft generated in output/email-draft.md');

    // 8. MCP Push (Optional Stage 6)
    await mcpPush(config, note, email, dateRange);

    // 9. Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n✅ Pipeline complete!');
    console.log('📁 Output files:');
    console.log('   - output/reviews.csv');
    console.log('   - output/weekly-note.md');
    console.log('   - output/email-draft.md');
    console.log(`⏱️ Total time: ${duration}s`);

  } catch (err: any) {
    console.error(`❌ Pipeline failed: ${err.message}`);
    process.exit(1);
  }
}

main().catch(console.error);

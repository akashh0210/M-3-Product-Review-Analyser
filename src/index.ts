import { getConfig } from './config/products.js';
import { ensureDir, writeReviewsCSV, writeMarkdown, isCacheValid, readFileString } from './utils/file.js';
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
import { checkMcpHealth } from './utils/mcp.js';

// Structured logging helper
function logStep(step: number, total: number, name: string, status: string) {
  console.log(`\n[${step}/${total}] ${name}: ${status}`);
}

async function main() {
  const startTime = Date.now();
  console.log('🚀 App Review Insights Analyser\n');

  try {
    // 1. Config
    const config = getConfig();
    console.log(`✅ Config loaded for ${config.productName}`);

    // 1.1 MCP Health Check
    if (config.mcpServerUrl) {
      console.log('📡 Checking Hosted MCP server health...');
      const isHealthy = await checkMcpHealth(config.mcpServerUrl, config.hfToken);
      if (isHealthy) {
        console.log('✅ Hosted MCP server is online');
      } else {
        console.warn('⚠️ Hosted MCP server is unreachable. Stage 6 will be skipped.');
      }
    }

    // Check Cache (24 hours expiry)
    const CACHE_HOURS = 24;
    const isCached = await isCacheValid('output/weekly-note.md', CACHE_HOURS) && 
                     await isCacheValid('output/email-draft.md', CACHE_HOURS);

    let note = '';
    let email = '';
    let dateRange = { from: '', to: '' };

    if (isCached) {
      console.log('\n⚡ Found recent analysis cache (< 24 hours old). Fast-tracking execution.');
      logStep(1, 4, '📥 Ingest', 'Skipping (Loading from cache...)');
      logStep(2, 4, '🛡️ Scrub', 'Skipping (Loading from cache...)');
      logStep(3, 4, '🧠 Synthesize', 'Skipping (Loading from cache...)');
      
      note = await readFileString('output/weekly-note.md');
      email = await readFileString('output/email-draft.md');
      
      // Approximate date range for cached push
      const toDate = new Date().toISOString().split('T')[0];
      const fromDate = new Date(Date.now() - config.reviewWindowWeeks * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      dateRange = { from: fromDate, to: toDate };
    } else {
      // --- REGULAR RUN ---
      logStep(1, 4, '📥 Ingest', 'Fetching reviews from stores...');
      await ensureDir('data/raw');
      await ensureDir('output');

      const appStoreRaw = await fetchAppStoreReviews(config.appStoreId);
      const playStoreRaw = await fetchPlayStoreReviews(config.playStorePackage);

      const totalRaw = appStoreRaw.length + playStoreRaw.length;
      console.log(`   📊 Total raw reviews fetched: ${totalRaw}`);

      if (totalRaw === 0) {
        console.error('🛑 No reviews found. Place CSV files in data/raw/ or check network connection.');
        process.exit(1);
      }

      logStep(2, 4, '🛡️ Scrub', 'Normalizing, filtering, and removing PII...');
      const normalized = normalizeAll(appStoreRaw, playStoreRaw);
      const filtered = filterRecentReviews(normalized, config.reviewWindowWeeks);
      const { reviews, redactionCount } = scrubPII(filtered);
      await writeReviewsCSV(reviews, 'output/reviews.csv');
      console.log(`   💾 Saved ${reviews.length} clean reviews to output/reviews.csv`);

      if (reviews.length === 0) {
        console.error('🛑 No reviews left after filtering. Try increasing REVIEW_WINDOW_WEEKS.');
        process.exit(1);
      }

      logStep(3, 4, '🧠 Synthesize', 'AI Theme clustering and content generation...');
      const themes = await clusterThemes(reviews, config.maxThemes, config.groqApiKey, config.productName);
      console.log(`   🏷️ Identified ${themes.length} themes:`);
      themes.forEach((t, i) => console.log(`      ${i + 1}. ${t.label} (${t.count} reviews, ${t.sentiment})`));

      const topThemes = themes.slice(0, 3);
      const { quotes, actions } = await selectQuotesAndActions(reviews, topThemes, config.groqApiKey);
      console.log(`   💬 Selected ${quotes.length} grounded quotes`);
      console.log(`   💡 Generated ${actions.length} action ideas`);

      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      const sortedDates = reviews.map(r => r.date).sort();
      dateRange = { 
        from: sortedDates[0], 
        to: sortedDates[sortedDates.length - 1] 
      };

      note = await generateWeeklyNote({
        product: config.productName,
        dateRange,
        totalReviews: reviews.length,
        avgRating,
        topThemes,
        quotes,
        actions
      }, config.groqApiKey);

      await writeMarkdown(note, 'output/weekly-note.md');
      
      email = generateEmailDraft(note, config.productName, dateRange, 'Sk Akash Ali');
      await writeMarkdown(email, 'output/email-draft.md');
      
      console.log('   📧 Drafts generated in output/ directory');
    }

    logStep(4, 4, '📤 Publish', 'Pushing to external systems (if configured)...');
    await mcpPush(config, note, email, dateRange);

    // 9. Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n✅ Pipeline complete!');
    console.log('📁 Output files available at:');
    console.log('   - output/reviews.csv');
    console.log('   - output/weekly-note.md');
    console.log('   - output/email-draft.md');
    console.log(`⏱️ Total execution time: ${duration}s`);

  } catch (err: any) {
    console.error(`❌ Pipeline failed: ${err.message}`);
    process.exit(1);
  }
}

main().catch(console.error);

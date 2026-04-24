import { getConfig } from './config/products.js';
import { ensureDir } from './utils/file.js';

async function main() {
  console.log('🚀 App Review Insights Analyser — Phase 0\n');

  try {
    // 1. Config validation
    const config = getConfig();
    console.log(`✅ Config loaded for ${config.productName}`);

    // 2. Directory check
    await ensureDir('src/config');
    console.log('📁 Directories ready');

    // 3. API Key check
    if (config.groqApiKey && config.groqApiKey !== 'your_groq_api_key_here') {
      console.log('🔑 Groq API key configured');
    } else {
      console.warn('⚠️ Groq API key is still at default placeholder value');
    }

    console.log('\nPipeline not yet implemented. Proceed to Phase 1.');
  } catch (err: any) {
    console.error(`❌ Setup validation failed: ${err.message}`);
    process.exit(1);
  }
}

main().catch(console.error);

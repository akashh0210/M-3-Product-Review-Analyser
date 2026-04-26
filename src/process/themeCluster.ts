import { Review, ThemeGroup } from '../utils/file.js';
import { callLLM } from '../utils/llm.js';
import { withRetry } from '../utils/retry.js';

/**
 * Groups reviews into ≤maxThemes themes using LLM
 */
export async function clusterThemes(
  reviews: Review[],
  maxThemes: number,
  apiKey: string,
  productName: string
): Promise<ThemeGroup[]> {
  if (reviews.length === 0) {
    return [{
      label: 'General Feedback',
      count: 0,
      sentiment: 'mixed',
      summary: 'No reviews found for this period.',
      reviewIndices: []
    }];
  }

  // Batching strategy: chunks of 50 to stay under Groq TPM limits
  const batchSize = 50;
  const batches: Review[][] = [];
  for (let i = 0; i < reviews.length; i += batchSize) {
    batches.push(reviews.slice(i, i + batchSize));
  }

  console.log(`🧠 Batching ${reviews.length} reviews into ${batches.length} batches for theme clustering...`);

  const batchResults: ThemeGroup[][] = [];
  for (let i = 0; i < batches.length; i++) {
    console.log(`   📦 Processing batch ${i + 1}/${batches.length}...`);
    const result = await processBatch(batches[i], i * batchSize, maxThemes, apiKey, productName);
    batchResults.push(result);
  }

  // Consolidate if multiple batches
  if (batchResults.length > 1) {
    console.log('🔄 Consolidating themes across batches...');
    return await consolidateThemes(batchResults.flat(), maxThemes, apiKey);
  }

  return batchResults[0].sort((a, b) => b.count - a.count).slice(0, maxThemes);
}

/**
 * Process a single batch of reviews
 */
async function processBatch(
  batch: Review[],
  startIndex: number,
  maxThemes: number,
  apiKey: string,
  productName: string
): Promise<ThemeGroup[]> {
  const numberedReviews = batch.map((r, i) => 
    `[${startIndex + i}] (★${r.rating}, ${r.source}) "${r.title ? r.title + ' | ' : ''}${r.text.substring(0, 200)}${r.text.length > 200 ? '...' : ''}"`
  ).join('\n');

  const systemPrompt = `You are a product analyst examining app reviews for a mobile application.
Your job is to identify the main themes in user feedback.
You must return valid JSON only, no other text.`;

  const userPrompt = `Analyze the following ${batch.length} app reviews for ${productName} and group them
into a maximum of ${maxThemes} distinct themes.

For each theme, provide:
- "label": A short descriptive name (e.g. "App Crashes & Performance")
- "count": How many reviews belong to this theme
- "sentiment": "positive", "negative", or "mixed"
- "summary": A 1-2 sentence summary of what users are saying
- "reviewIndices": An array of the review numbers (0-indexed) that belong to this theme

A single review may belong to multiple themes if relevant.
Sort themes by count descending.

Return a JSON object in this exact format. Ensure EVERY theme has all keys: "label", "count", "sentiment", "summary", and "reviewIndices" (as an array of numbers).

{
  "themes": [
    {
      "label": "...",
      "count": ...,
      "sentiment": "...",
      "summary": "...",
      "reviewIndices": [...]
    }
  ]
}

Here are the reviews (numbered):

${numberedReviews}`;

  const response = await withRetry(async () => {
    return await callLLM(apiKey, {
      systemPrompt,
      userPrompt,
      temperature: 0.2,
      jsonMode: true,
      model: 'llama-3.1-8b-instant'
    });
  }, {
    retries: 3,
    baseDelay: 5000,
    onRetry: (err, attempt) => {
      console.warn(`   ⚠️ LLM Batch processing failed (Attempt ${attempt}). Likely Rate Limit. Retrying...`);
    }
  });

  try {
    const data = JSON.parse(response);
    return data.themes || [];
  } catch (err) {
    console.error('❌ Failed to parse LLM response for theme clustering batch');
    return [];
  }
}

/**
 * Consolidate similar themes across multiple batches
 */
async function consolidateThemes(
  allThemes: ThemeGroup[],
  maxThemes: number,
  apiKey: string
): Promise<ThemeGroup[]> {
  // Optimization: Remove reviewIndices from the prompt to save tokens and avoid TPM limits
  const promptThemes = allThemes.map(t => ({
    label: t.label,
    count: t.count,
    sentiment: t.sentiment,
    summary: t.summary
  }));

  const systemPrompt = `You are a product analyst merging similar themes from multiple review batches.
Merge similar themes together. Keep the total to ${maxThemes} or fewer.
You must return valid JSON only, no other text.`;

  const userPrompt = `You received theme results from multiple batches of reviews.
Merge similar themes together. Keep the total to ${maxThemes} or fewer.
Aggregate the counts. Ensure sentiments and summaries are reflective of the merged content.

Return a JSON object in this exact format. Ensure EVERY theme has all keys: "label", "count", "sentiment", and "summary".

{
  "themes": [
    {
      "label": "...",
      "count": ...,
      "sentiment": "...",
      "summary": "..."
    }
  ]
}

Batch results:
${JSON.stringify(promptThemes, null, 2)}`;

  const response = await withRetry(async () => {
    return await callLLM(apiKey, {
      systemPrompt,
      userPrompt,
      temperature: 0.2,
      jsonMode: true,
      model: 'llama-3.1-8b-instant'
    });
  }, {
    retries: 2,
    baseDelay: 5000,
    onRetry: (err, attempt) => {
      console.warn(`   ⚠️ Theme consolidation failed (Attempt ${attempt}). Retrying...`);
    }
  });

  try {
    const data = JSON.parse(response);
    const consolidated: ThemeGroup[] = data.themes || [];
    
    // Post-processing: Map reviewIndices back to consolidated themes based on label similarity
    const finalThemes: ThemeGroup[] = consolidated.map((ct) => {
      const relatedIndices = allThemes
        .filter(at => at.label.toLowerCase().includes(ct.label.toLowerCase()) || 
                      ct.label.toLowerCase().includes(at.label.toLowerCase()))
        .flatMap(at => at.reviewIndices);
      
      return {
        ...ct,
        reviewIndices: [...new Set(relatedIndices)].sort((a, b) => a - b)
      } as ThemeGroup;
    });

    return finalThemes.sort((a, b) => b.count - a.count).slice(0, maxThemes);
  } catch (err) {
    console.error('❌ Failed to parse LLM response for theme consolidation');
    return allThemes.sort((a, b) => b.count - a.count).slice(0, maxThemes);
  }
}

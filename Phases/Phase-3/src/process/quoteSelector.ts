import { Review, ThemeGroup } from '../utils/file.js';
import { callLLM } from '../utils/llm.js';

export interface QuoteResult {
  quotes: Array<{
    text: string;      // Exact quote from a review
    theme: string;     // Which theme it represents
    rating: number;    // Rating of the source review
  }>;
  actions: Array<{
    title: string;
    description: string;
    theme: string;
  }>;
}

/**
 * Selects representative quotes and generates action ideas
 */
export async function selectQuotesAndActions(
  reviews: Review[],
  topThemes: ThemeGroup[],
  apiKey: string
): Promise<QuoteResult> {
  const themeContext = topThemes.map((theme, i) => {
    const themeReviews = theme.reviewIndices.map(idx => {
      const r = reviews[idx];
      return `[${idx}] (★${r.rating}) "${r.text}"`;
    }).join('\n');
    
    return `THEME ${i + 1}: ${theme.label} (${theme.count} reviews, ${theme.sentiment})\n${themeReviews}`;
  }).join('\n\n');

  const systemPrompt = `You are a product analyst selecting representative user quotes from app reviews.
CRITICAL RULE: Every quote you select MUST be an exact substring copied
from the provided review text. Do not paraphrase, summarize, or modify quotes.
Return valid JSON only.`;

  const userPrompt = `From the following app reviews grouped by theme, select:
1. Exactly 3 quotes — one from each of the top 3 themes
2. Each quote must be an EXACT substring from one of the provided reviews
3. Pick quotes that best represent the theme and are impactful

Also generate 3 action ideas:
1. One action per top theme
2. Each action should be concrete and implementable
3. Each action should be 1-2 sentences

Return JSON in this format:
{
  "quotes": [
    { "text": "...", "theme": "...", "rating": ... }
  ],
  "actions": [
    { "title": "...", "description": "...", "theme": "..." }
  ]
}

TOP 3 THEMES AND THEIR REVIEWS:

${themeContext}`;

  let retries = 0;
  const maxRetries = 3;

  while (retries <= maxRetries) {
    const response = await callLLM(apiKey, {
      systemPrompt,
      userPrompt: retries === 0 ? userPrompt : `Your previous quotes were not all exact substrings. Please try again. Ensure EVERY quote is an EXACT word-for-word copy from the reviews provided.\n\n${userPrompt}`,
      temperature: 0.3,
      jsonMode: true
    });

    try {
      const data: QuoteResult = JSON.parse(response);
      
      // Validate grounding
      const validatedQuotes = data.quotes.map(q => {
        const isGrounded = reviews.some(r => r.text.includes(q.text));
        if (!isGrounded) {
          console.warn(`⚠️ Quote not grounded: "${q.text.substring(0, 50)}..."`);
          return null;
        }
        return q;
      }).filter(q => q !== null) as QuoteResult['quotes'];

      if (validatedQuotes.length === data.quotes.length) {
        return data;
      }

      console.log(`🔄 Re-prompting for quote selection (Attempt ${retries + 1}/${maxRetries})...`);
      retries++;
    } catch (err) {
      console.error('❌ Failed to parse LLM response for quotes/actions');
      retries++;
    }
  }

  // Final fallback: Pick first sentence of the first review for each theme
  console.warn('⚠️ Falling back to manual quote selection due to grounding failures');
  return {
    quotes: topThemes.map(t => {
      const firstReview = reviews[t.reviewIndices[0]];
      const firstSentence = firstReview.text.split(/[.!?]/)[0] + '.';
      return {
        text: firstSentence,
        theme: t.label,
        rating: firstReview.rating
      };
    }),
    actions: topThemes.map(t => ({
      title: `Improve ${t.label}`,
      description: `Investigate and address user pain points related to ${t.label.toLowerCase()}.`,
      theme: t.label
    }))
  };
}

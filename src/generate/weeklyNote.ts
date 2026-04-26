import { ThemeGroup } from '../utils/file.js';
import { callLLM } from '../utils/llm.js';

export interface WeeklyNoteInput {
  product: string;
  dateRange: { from: string; to: string };
  totalReviews: number;
  avgRating: number;
  topThemes: ThemeGroup[];
  quotes: Array<{ text: string; theme: string; rating: number }>;
  actions: Array<{ title: string; description: string; theme: string }>;
}

/**
 * Generates a concise (≤250 words) weekly note as markdown
 */
export async function generateWeeklyNote(
  input: WeeklyNoteInput,
  apiKey: string
): Promise<string> {
  const systemPrompt = `You are a product analyst writing a weekly app review pulse for stakeholders.
Write in a clear, professional, scannable style.
The note MUST be 250 words or fewer.
Use markdown formatting.
Do not invent any information — use only the data provided.`;

  const userPrompt = `Write a weekly app review pulse for ${input.product} using the data below.
The note must be ≤250 words, formatted in markdown.

DATA:
- Period: ${input.dateRange.from} to ${input.dateRange.to}
- Total reviews analyzed: ${input.totalReviews}
- Average rating: ${input.avgRating.toFixed(1)}/5

TOP 3 THEMES:
${input.topThemes.map((t, i) => `${i + 1}. ${t.label} — ${t.count} reviews, ${t.sentiment}\n   Summary: ${t.summary}`).join('\n')}

SELECTED QUOTES (use these exact quotes):
${input.quotes.map((q, i) => `${i + 1}. "${q.text}" — ★${q.rating}`).join('\n')}

ACTION IDEAS:
${input.actions.map((a, i) => `${i + 1}. ${a.title}: ${a.description}`).join('\n')}

FORMAT the note using this structure:
# ${input.product} App Review Summary
**Period:** ${input.dateRange.from} - ${input.dateRange.to} | **Total Reviews:** ${input.totalReviews} | **Average Rating:** ${input.avgRating.toFixed(1)}/5

### Top Themes Identified
| Theme | Reviews | Sentiment |
| :--- | :--- | :--- |
(Create a table for the top 3 themes)

### Key User Quotes
(List 3 quotes in this format: "Quote text" — ★★★★)

### Recommended Actions
(List 3 actions in this format: **Team Name** — Action Description)

[🖨️ View raw documents for printing](./output/)`;

  let note = await callLLM(apiKey, {
    systemPrompt,
    userPrompt,
    temperature: 0.4,
    jsonMode: false,
    model: 'llama-3.3-70b-versatile'
  });

  let wordCount = countWords(note);

  if (wordCount > 250) {
    console.log(`⚠️ Note is ${wordCount} words. Re-prompting for brevity...`);
    note = await callLLM(apiKey, {
      systemPrompt,
      userPrompt: `The note you wrote is ${wordCount} words. Rewrite it to be UNDER 250 words while keeping all key information. Here is the note:\n\n${note}`,
      temperature: 0.3,
      jsonMode: false
    });
    wordCount = countWords(note);
  }

  console.log(`📝 Weekly note: ${wordCount} words`);
  return note;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

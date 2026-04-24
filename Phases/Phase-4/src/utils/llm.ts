import Groq from 'groq-sdk';

export interface LLMCallOptions {
  model?: string;          // default: "llama-3.1-70b-versatile"
  systemPrompt: string;    // System message setting the LLM's role
  userPrompt: string;      // The actual task/question
  temperature?: number;    // default: 0.3
  maxTokens?: number;      // default: 2048
  jsonMode?: boolean;      // if true, set response_format to json_object
}

/**
 * Call Groq LLM with retry logic for rate limits
 */
export async function callLLM(apiKey: string, options: LLMCallOptions): Promise<string> {
  const groq = new Groq({ apiKey });
  const model = options.model || "llama-3.3-70b-versatile";
  let retries = 0;
  const maxRetries = 3;

  while (retries <= maxRetries) {
    try {
      const startTime = Date.now();
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: options.systemPrompt },
          { role: 'user', content: options.userPrompt },
        ],
        model,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 2048,
        response_format: options.jsonMode ? { type: "json_object" } : undefined,
      });

      const duration = Date.now() - startTime;
      const content = completion.choices[0]?.message?.content || "";
      const usage = completion.usage;

      console.log(`[LLM] Model: ${model} | Time: ${duration}ms | Tokens: ${usage?.total_tokens ?? 'unknown'}`);
      
      return content;
    } catch (err: any) {
      if (err.status === 429 && retries < maxRetries) {
        retries++;
        console.warn(`[LLM] Rate limit hit (429). Retrying in 2s... (Attempt ${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      console.error(`[LLM] Error: ${err.message}`);
      throw err;
    }
  }

  throw new Error("Failed to get response from LLM after maximum retries");
}

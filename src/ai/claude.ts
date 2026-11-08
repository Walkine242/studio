// Minimal Claude (Anthropic Messages API) client for server code.
// Uses fetch directly, so no extra SDK package is needed.

const API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-5-5';

export async function askClaude({
  system,
  prompt,
  maxTokens = 2000,
}: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set.');

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Claude API error ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = (data.content ?? [])
    .filter((block: any) => block.type === 'text')
    .map((block: any) => block.text)
    .join('\n')
    .trim();
  if (!text) throw new Error('Claude returned an empty response.');
  return text;
}

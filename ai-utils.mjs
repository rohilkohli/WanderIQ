const DEFAULT_MAX_LENGTH = 2000;

export const SYSTEM_PROMPT = `You are VoyaIQ, an expert AI travel planning assistant.
You help users discover destinations, build multi-day itineraries, and plan smart trips.
Always consider budget, dietary needs, mobility constraints, and travel style.
Keep responses concise, structured, and actionable. Use markdown formatting.
When suggesting activities, include estimated costs in INR and duration in minutes.`;

export const FewShotExamples = {
  discover: [
    {
      input: 'Mood: 4-day cultural trip under INR 30000, vegetarian food, low walking',
      output: 'Return culturally rich destinations with low exertion options and budget-aware recommendations.',
    },
  ],
  autofill: [
    {
      input: 'Slot: morning, existing: Museum of Goa',
      output: 'Suggest a non-duplicate, nearby, budget-aware morning activity with wheelchair notes.',
    },
  ],
  budget: [
    {
      input: 'Accommodation over-indexed by 40%',
      output: 'Suggest practical swaps with estimated INR savings and impact scores.',
    },
  ],
};

export function sanitizeText(value, maxLength = DEFAULT_MAX_LENGTH) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, maxLength);
}

export function parseModelJson(text) {
  const cleaned = sanitizeText(text, 200000)
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const objStart = cleaned.indexOf('{');
    const arrStart = cleaned.indexOf('[');
    const startCandidates = [objStart, arrStart].filter((x) => x >= 0);
    if (startCandidates.length === 0) throw new Error('No JSON payload found');
    const start = Math.min(...startCandidates);
    const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
    if (end < start) throw new Error('Malformed JSON payload');
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

export function buildPrompt({ task, instruction, payload, userContext, outputContract }) {
  const examples = FewShotExamples[task] || [];
  const fewShotBlock = examples.length
    ? `Few-shot guidance:\n${examples
        .map((item, index) => `Example ${index + 1} input: ${item.input}\nExample ${index + 1} target behavior: ${item.output}`)
        .join('\n\n')}`
    : '';

  return [
    SYSTEM_PROMPT,
    `Task: ${instruction}`,
    `User preferences: ${JSON.stringify(userContext?.preferences ?? {})}`,
    `Recent user actions: ${JSON.stringify(userContext?.recentActions ?? [])}`,
    `Recent rated AI suggestions: ${JSON.stringify(userContext?.recentRatings ?? [])}`,
    `Request payload: ${JSON.stringify(payload)}`,
    fewShotBlock,
    outputContract,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function getConfiguredFallbackOrder(fallbackOrder = []) {
  const unique = [];
  for (const provider of fallbackOrder) {
    if (!unique.includes(provider)) unique.push(provider);
  }
  if (unique.length === 0) unique.push('gemini');
  return unique;
}

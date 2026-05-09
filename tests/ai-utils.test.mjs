import { describe, expect, it } from 'vitest';
import { SYSTEM_PROMPT, FewShotExamples, buildPrompt, getConfiguredFallbackOrder, parseModelJson } from '../ai-utils.mjs';

describe('ai-utils', () => {
  it('buildPrompt assembles core context blocks', () => {
    const prompt = buildPrompt({
      task: 'discover',
      instruction: 'Recommend destinations',
      payload: { query: 'Hill stations' },
      userContext: { preferences: { budget: 'low' }, recentActions: ['discover:hill'], recentRatings: [] },
      outputContract: 'Return JSON list.',
    });

    expect(prompt).toContain(SYSTEM_PROMPT);
    expect(prompt).toContain('Task: Recommend destinations');
    expect(prompt).toContain('"budget":"low"');
    expect(prompt).toContain('"discover:hill"');
    expect(prompt).toContain('Return JSON list.');
    expect(prompt).toContain('Few-shot guidance');
    expect(prompt).toContain(FewShotExamples.discover[0].input);
  });

  it('parseModelJson extracts fenced JSON payloads', () => {
    const parsed = parseModelJson('```json\n{"name":"Goa","score":85}\n```');
    expect(parsed).toEqual({ name: 'Goa', score: 85 });
  });

  it('parseModelJson extracts JSON from mixed responses', () => {
    const parsed = parseModelJson('Here is the data:\n[{ "id": "1" }] Thanks!');
    expect(parsed).toEqual([{ id: '1' }]);
  });

  it('getConfiguredFallbackOrder de-duplicates and defaults', () => {
    expect(getConfiguredFallbackOrder(['gemini', 'openai', 'gemini'])).toEqual(['gemini', 'openai']);
    expect(getConfiguredFallbackOrder([])).toEqual(['gemini']);
  });
});

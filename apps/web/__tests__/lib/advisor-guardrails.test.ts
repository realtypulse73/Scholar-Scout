/** @jest-environment node */

import {
  ADVISOR_ALLOWED_MODELS,
  ADVISOR_MAX_MESSAGE_CHARACTERS,
  ADVISOR_MAX_REPLY_CHARACTERS,
  ADVISOR_SAFE_FALLBACK,
  ADVISOR_QUALIFIED_SUPPORT_HANDOFF,
  isAcuteCrisisMessage,
  parseAdvisorRequest,
  parseAdvisorReply,
  selectAdvisorModel,
} from '@/lib/advisor-contract';
import { buildAdvisorContext } from '@/lib/server/advisor-context';
import { ADVISOR_EVALUATION_CASES } from '../fixtures/advisor-eval-cases';

jest.mock('@/lib/server/platform-store', () => ({
  getMemory: jest.fn(),
  getRecommendationsForUser: jest.fn(),
}));

const platformStore = jest.requireMock('@/lib/server/platform-store') as {
  getMemory: jest.Mock;
  getRecommendationsForUser: jest.Mock;
};

describe('advisor guardrails', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('accepts only an exact trimmed message between one and 3,000 characters', () => {
    expect(parseAdvisorRequest({ message: '  Compare my choices.  ' })).toEqual({
      message: 'Compare my choices.',
    });
    expect(parseAdvisorRequest({ message: '' })).toBeNull();
    expect(parseAdvisorRequest({ message: 'x'.repeat(ADVISOR_MAX_MESSAGE_CHARACTERS + 1) })).toBeNull();
    expect(parseAdvisorRequest({ message: 'hi', context: {} })).toBeNull();
    expect(parseAdvisorRequest({ message: 'hi', userKey: 'another-student' })).toBeNull();
  });

  it('accepts only a bounded, exact reply envelope and a configured model', () => {
    expect(parseAdvisorReply({ message: 'Compare the published costs.' })).toEqual({
      message: 'Compare the published costs.',
    });
    expect(parseAdvisorReply({ message: '' })).toBeNull();
    expect(parseAdvisorReply({ message: 'x'.repeat(ADVISOR_MAX_REPLY_CHARACTERS + 1) })).toBeNull();
    expect(parseAdvisorReply({ message: 'ok', extra: true })).toBeNull();
    expect(ADVISOR_ALLOWED_MODELS).toContain(selectAdvisorModel(ADVISOR_ALLOWED_MODELS[0]));
    expect(selectAdvisorModel('unapproved-model')).toBe(ADVISOR_ALLOWED_MODELS[0]);
  });

  it('recognizes acute crisis messages and exposes deterministic safe replies', () => {
    expect(isAcuteCrisisMessage('I want to hurt myself tonight.')).toBe(true);
    expect(isAcuteCrisisMessage('I feel stressed about applications.')).toBe(false);
    expect(ADVISOR_QUALIFIED_SUPPORT_HANDOFF).toContain('emergency');
    expect(ADVISOR_SAFE_FALLBACK).not.toContain('OpenAI');
  });

  it('builds a bounded actor-scoped summary with no more than three recommendations', async () => {
    platformStore.getMemory.mockResolvedValue({
      userKey: 'account:student-one',
      stage: 'comparing',
      summary: 'A'.repeat(1_000),
    });
    platformStore.getRecommendationsForUser.mockResolvedValue(
      Array.from({ length: 4 }, (_, index) => ({
        programme: { name: `Programme ${index + 1}` },
        explanation: ['B'.repeat(500)],
      })),
    );

    const context = await buildAdvisorContext({ storageKey: 'account:student-one' });

    expect(platformStore.getMemory).toHaveBeenCalledWith('account:student-one');
    expect(platformStore.getRecommendationsForUser).toHaveBeenCalledWith('account:student-one');
    expect(context.recommendations).toHaveLength(3);
    expect(context.summary.length).toBeLessThanOrEqual(2_000);
    expect(JSON.stringify(context)).not.toContain('account:student-one');
  });

  it('checks in fourteen synthetic privacy, quota, safety, provider, and guidance cases', () => {
    expect(ADVISOR_EVALUATION_CASES).toHaveLength(14);
    expect(new Set(ADVISOR_EVALUATION_CASES.map((item) => item.id)).size).toBe(14);
    expect(ADVISOR_EVALUATION_CASES.map((item) => item.id)).toEqual(
      expect.arrayContaining(['quota-guest-10', 'quota-guest-11', 'quota-account-25', 'quota-account-26', 'guest-carry-over', 'provider-malformed', 'provider-overlong', 'acute-crisis']),
    );
  });
});

export const ADVISOR_MAX_MESSAGE_CHARACTERS = 3_000;
export const ADVISOR_MAX_REPLY_CHARACTERS = 8_000;
export const ADVISOR_MAX_BODY_BYTES = 8_192;
export const ADVISOR_ALLOWED_MODELS = ['gpt-4.1-mini'] as const;

export const ADVISOR_SAFE_FALLBACK =
  'I cannot provide a tailored answer right now. Compare one programme option, one backup option, and the current official cost or admissions details before deciding.';

export const ADVISOR_QUALIFIED_SUPPORT_HANDOFF =
  'I am really sorry you are dealing with this. Please contact local emergency services or a crisis service now if you may be in immediate danger, and reach out to a trusted person or qualified school or health professional who can support you in person.';

export interface AdvisorRequest {
  message: string;
}

export interface AdvisorReply {
  message: string;
}

/** Parses the exact browser contract without allowing client-selected context or identity. */
export function parseAdvisorRequest(value: unknown): AdvisorRequest | null {
  if (!isExactObject(value, ['message']) || typeof value.message !== 'string') {
    return null;
  }

  const message = value.message.trim();

  if (!message || message.length > ADVISOR_MAX_MESSAGE_CHARACTERS) {
    return null;
  }

  return { message };
}

/** Validates the complete structured output before it is returned to the browser. */
export function parseAdvisorReply(value: unknown): AdvisorReply | null {
  if (!isExactObject(value, ['message']) || typeof value.message !== 'string') {
    return null;
  }

  const message = value.message.trim();

  if (!message || message.length > ADVISOR_MAX_REPLY_CHARACTERS) {
    return null;
  }

  return { message };
}

export function selectAdvisorModel(value: string | undefined): (typeof ADVISOR_ALLOWED_MODELS)[number] {
  return ADVISOR_ALLOWED_MODELS.includes(value as (typeof ADVISOR_ALLOWED_MODELS)[number])
    ? (value as (typeof ADVISOR_ALLOWED_MODELS)[number])
    : ADVISOR_ALLOWED_MODELS[0];
}

/**
 * Keeps acute danger out of the model path. It intentionally does not classify
 * ordinary stress, which remains appropriate for bounded education coaching.
 */
export function isAcuteCrisisMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return [
    /(?:want|going|plan|plans|planning) to (?:kill|hurt) myself/,
    /(?:suicide|suicidal)/,
    /(?:kill|hurt) myself tonight/,
    /(?:end|take) my life/,
    /immediate danger/,
  ].some((pattern) => pattern.test(normalized));
}

function isExactObject(
  value: unknown,
  keys: string[],
): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length && actualKeys.every((key) => keys.includes(key));
}

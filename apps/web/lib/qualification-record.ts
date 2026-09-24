export const QUALIFICATION_KINDS = [
  'diploma-credits',
  'degree',
  'licence',
  'prior-work',
  'voluntary-military-history',
] as const;

export type QualificationKind = (typeof QUALIFICATION_KINDS)[number];

export interface QualificationRecord {
  structured: QualificationKind[];
  note: string;
  keywords: string[];
}

export const EMPTY_QUALIFICATION_RECORD: QualificationRecord = {
  structured: [],
  note: '',
  keywords: [],
};

const MAX_NOTE_LENGTH = 500;
const MAX_KEYWORDS = 12;
const MAX_KEYWORD_LENGTH = 40;
const qualificationKinds = new Set<QualificationKind>(QUALIFICATION_KINDS);

/** Parses the sole private qualification payload accepted by the account route. */
export function parseQualificationRecord(value: unknown): QualificationRecord | null {
  if (!isExactObject(value, ['structured', 'note', 'keywords'])) return null;
  if (!Array.isArray(value.structured) || !Array.isArray(value.keywords)) return null;
  if (typeof value.note !== 'string') return null;
  const structured = value.structured.map((item) =>
    typeof item === 'string' && qualificationKinds.has(item as QualificationKind)
      ? (item as QualificationKind)
      : null,
  );
  if (structured.some((item) => item === null) || new Set(structured).size !== structured.length) return null;
  const note = value.note.trim();
  if (note.length > MAX_NOTE_LENGTH || value.keywords.length > MAX_KEYWORDS) return null;
  const keywords = value.keywords.map(normalizeKeyword);
  if (keywords.some((keyword) => keyword === null)) return null;
  if (new Set(keywords).size !== keywords.length) return null;
  return {
    structured: [...structured].sort() as QualificationKind[],
    note,
    keywords: (keywords as string[]).sort(),
  };
}

export function normalizeQualificationRecord(record: QualificationRecord): QualificationRecord {
  return parseQualificationRecord(record) ?? { ...EMPTY_QUALIFICATION_RECORD };
}

function normalizeKeyword(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  return normalized.length > 0 && normalized.length <= MAX_KEYWORD_LENGTH ? normalized : null;
}

function isExactObject(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  const actualKeys = Object.keys(value).sort();
  const expectedKeys = [...keys].sort();
  return actualKeys.length === expectedKeys.length && actualKeys.every((key, index) => key === expectedKeys[index]);
}

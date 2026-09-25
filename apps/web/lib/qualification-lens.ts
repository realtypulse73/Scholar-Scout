import type { FactEvidence, FactStatus, PublishedRequirement } from '@/lib/catalogue-contract';
import type { CatalogueDiscoveryItem } from '@/lib/catalogue-discovery';
import { QUALIFICATION_KINDS } from '@/lib/qualification-record';
import type { QualificationKind } from '@/lib/qualification-record';

/** The deliberately limited private inputs permitted to affect lens ordering. */
export interface QualificationLensRecord {
  structured: QualificationKind[];
  keywords: string[];
}

export interface QualificationCheckedRequirement {
  label: 'Checked published requirement';
  text: string;
  qualificationKeys: QualificationKind[];
  evidence: FactEvidence;
}

export interface QualificationKeywordConnection {
  label: 'Keyword connection';
  keyword: string;
  text: string;
  source: 'published-requirement' | 'reviewed-description';
  evidence: FactEvidence;
}

export interface QualificationVerificationRow {
  label: 'Needs verification';
  text: string;
  state: Exclude<FactStatus, 'current'>;
  sourceDate: string | null;
  evidence: FactEvidence;
}

export interface QualificationDocumentedSupport {
  label: 'Documented support';
  text: string;
  sourceDate: string | null;
  evidence: FactEvidence;
}

export interface QualificationExplanation {
  hasQualificationInput: boolean;
  hasPublishedRequirements: boolean;
  checkedRequirements: QualificationCheckedRequirement[];
  keywordConnections: QualificationKeywordConnection[];
  verificationRows: QualificationVerificationRow[];
  documentedSupport?: QualificationDocumentedSupport;
}

export interface QualificationLensItem {
  item: CatalogueDiscoveryItem;
  explanation: QualificationExplanation;
}

export interface QualificationLensModel {
  items: QualificationLensItem[];
}

/**
 * Explains reviewed snapshot facts using only a student's explicit structured
 * choices and confirmed keywords. It does not decide or predict any outcome.
 */
export function buildQualificationLensModel(
  items: CatalogueDiscoveryItem[],
  record: QualificationLensRecord,
): QualificationLensModel {
  if (!isQualificationLensRecord(record)) {
    throw new Error('qualification-lens-input-invalid');
  }

  return {
    items: items.map((item) => ({
      item,
      explanation: explainQualificationConnection(item, record),
    })),
  };
}

/**
 * Returns every discovery item in a stable, transparent qualifications-first
 * order. It only compares documented lens connections; it never filters a
 * pathway or makes a conclusion about a student's outcome.
 */
export function orderQualificationsFirst(
  items: QualificationLensItem[],
): QualificationLensItem[] {
  return [...items].sort((left, right) => {
    const checkedDifference = right.explanation.checkedRequirements.length
      - left.explanation.checkedRequirements.length;
    if (checkedDifference !== 0) return checkedDifference;

    const keywordDifference = Number(right.explanation.keywordConnections.length > 0)
      - Number(left.explanation.keywordConnections.length > 0);
    if (keywordDifference !== 0) return keywordDifference;

    return left.item.id.localeCompare(right.item.id);
  });
}

function explainQualificationConnection(
  item: CatalogueDiscoveryItem,
  record: QualificationLensRecord,
): QualificationExplanation {
  const publishedRequirements = item.publishedRequirements ?? [];
  const checkedRequirements = publishedRequirements
    .filter((requirement) => requirement.evidence.status === 'current'
      && requirement.qualificationKeys.some((key) => record.structured.includes(key)))
    .map(toCheckedRequirement);
  const keywordConnections = findKeywordConnections(item, record.keywords);
  const verificationRows = publishedRequirements
    .filter(isNonCurrentRequirement)
    .map(toVerificationRow);
  const documentedSupport = checkedRequirements.length === 0 || verificationRows.length > 0
    ? toDocumentedSupport(item)
    : undefined;

  return {
    hasQualificationInput: record.structured.length > 0 || record.keywords.length > 0,
    hasPublishedRequirements: publishedRequirements.length > 0,
    checkedRequirements,
    keywordConnections,
    verificationRows,
    ...(documentedSupport === undefined ? {} : { documentedSupport }),
  };
}

function toCheckedRequirement(requirement: PublishedRequirement): QualificationCheckedRequirement {
  return {
    label: 'Checked published requirement',
    text: requirement.text,
    qualificationKeys: [...requirement.qualificationKeys],
    evidence: requirement.evidence,
  };
}

function findKeywordConnections(
  item: CatalogueDiscoveryItem,
  keywords: string[],
): QualificationKeywordConnection[] {
  const reviewedText = [
    ...(item.publishedRequirements ?? [])
      .filter((requirement) => requirement.evidence.status === 'current')
      .map((requirement) => ({
        text: requirement.text,
        source: 'published-requirement' as const,
        evidence: requirement.evidence,
      })),
    ...(item.reviewedDescription?.evidence.status === 'current'
      ? [{
        text: item.reviewedDescription.value ?? '',
        source: 'reviewed-description' as const,
        evidence: item.reviewedDescription.evidence,
      }]
      : []),
  ];

  const connections: QualificationKeywordConnection[] = [];
  for (const keyword of keywords) {
    const match = reviewedText.find((candidate) => hasWholeToken(candidate.text, keyword));
    if (!match) continue;
    connections.push({
      label: 'Keyword connection',
      keyword,
      text: match.text,
      source: match.source,
      evidence: match.evidence,
    });
  }
  return connections;
}

function toVerificationRow(requirement: PublishedRequirement): QualificationVerificationRow {
  return {
    label: 'Needs verification',
    text: requirement.text,
    state: requirement.evidence.status as QualificationVerificationRow['state'],
    sourceDate: requirement.evidence.sourceDate.state === 'documented'
      ? requirement.evidence.sourceDate.value
      : null,
    evidence: requirement.evidence,
  };
}

function toDocumentedSupport(
  item: CatalogueDiscoveryItem,
): QualificationDocumentedSupport | undefined {
  const support = item.documentedSupport;
  if (!support?.value) return undefined;

  return {
    label: 'Documented support',
    text: support.value,
    sourceDate: support.evidence.sourceDate.state === 'documented'
      ? support.evidence.sourceDate.value
      : null,
    evidence: support.evidence,
  };
}

function isNonCurrentRequirement(requirement: PublishedRequirement): boolean {
  return requirement.evidence.status !== 'current';
}

function hasWholeToken(text: string, keyword: string): boolean {
  const normalizedKeyword = normalizeTokens(keyword);
  if (!normalizedKeyword) return false;
  return ` ${normalizeTokens(text)} `.includes(` ${normalizedKeyword} `);
}

function normalizeTokens(value: string): string {
  return value
    .toLocaleLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .join(' ');
}

function isQualificationLensRecord(value: unknown): value is QualificationLensRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  const keys = Object.keys(candidate).sort();
  if (keys.length !== 2 || keys[0] !== 'keywords' || keys[1] !== 'structured') return false;
  if (!Array.isArray(candidate.structured) || !Array.isArray(candidate.keywords)) return false;
  if (candidate.structured.length > QUALIFICATION_KINDS.length
    || candidate.keywords.length > 12) return false;

  const structured = candidate.structured;
  const keywords = candidate.keywords;
  if (structured.some((item) => !QUALIFICATION_KINDS.includes(item as QualificationKind))
    || new Set(structured).size !== structured.length) return false;
  if (keywords.some((item) => typeof item !== 'string'
    || normalizeTokens(item).length === 0
    || item.trim().length > 40)
    || new Set(keywords).size !== keywords.length) return false;

  return true;
}

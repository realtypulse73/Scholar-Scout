import type { FactEvidence, FactStatus, PublishedRequirement } from '@/lib/catalogue-contract';
import type { CatalogueDiscoveryItem } from '@/lib/catalogue-discovery';
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

export interface QualificationExplanation {
  checkedRequirements: QualificationCheckedRequirement[];
  keywordConnections: QualificationKeywordConnection[];
  verificationRows: QualificationVerificationRow[];
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
  return {
    items: items.map((item) => ({
      item,
      explanation: explainQualificationConnection(item, record),
    })),
  };
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

  return { checkedRequirements, keywordConnections, verificationRows };
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

function isNonCurrentRequirement(requirement: PublishedRequirement): boolean {
  return requirement.evidence.status !== 'current';
}

function hasWholeToken(text: string, keyword: string): boolean {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase();
  if (!normalizedKeyword) return false;
  return text.toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).includes(normalizedKeyword);
}

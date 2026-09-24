import type {
  QualificationExplanation as QualificationExplanationModel,
  QualificationKeywordConnection,
  QualificationVerificationRow,
} from '@/lib/qualification-lens';

interface QualificationExplanationProps {
  explanation: QualificationExplanationModel;
  officialVerificationUrl: string;
}

/** Renders reviewed qualification facts without deciding a student's outcome. */
export default function QualificationExplanation({
  explanation,
  officialVerificationUrl,
}: QualificationExplanationProps) {
  const checkedCount = explanation.checkedRequirements.length;
  const hasConnection = checkedCount > 0 || explanation.keywordConnections.length > 0;

  return (
    <section aria-label="Qualification details" className="mt-4 min-w-0 rounded-card border border-ink-200 bg-ink-50 p-3">
      <h4 className="text-sm font-semibold text-ink-900">
        {checkedCount > 0
          ? `${checkedCount} published requirement${checkedCount === 1 ? '' : 's'} checked`
          : explanation.keywordConnections.length > 0
            ? 'Keyword connection'
            : 'No qualification connection yet'}
      </h4>
      {!hasConnection && explanation.verificationRows.length === 0 ? (
        <p className="mt-2 text-sm leading-6 text-ink-700">No reviewed requirements are listed yet. Verify with the programme.</p>
      ) : null}
      <div className="mt-3 space-y-3">
        {explanation.checkedRequirements.map((requirement) => (
          <RequirementRow
            key={`${requirement.text}-${requirement.evidence.sourceUrl}`}
            text={requirement.text}
            evidence={requirement.evidence}
            actionLabel={`Verify ${requirement.text}`}
          />
        ))}
        {explanation.keywordConnections.map((connection) => (
          <KeywordRow key={`${connection.keyword}-${connection.text}`} connection={connection} />
        ))}
        {explanation.verificationRows.map((row) => (
          <VerificationRow key={`${row.text}-${row.evidence.sourceUrl}`} row={row} />
        ))}
      </div>
      {explanation.documentedSupport ? (
        <p className="mt-3 break-words text-sm leading-6 text-ink-700">
          This programme lists {explanation.documentedSupport.text}. Ask the programme if it is available to you.
        </p>
      ) : null}
      {!hasConnection ? (
        <a href={officialVerificationUrl} target="_blank" rel="noreferrer" aria-label="Verify with the programme (opens a new tab)" className="mt-3 inline-flex min-h-touch items-center text-sm font-semibold text-brand-700 underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          Verify with the programme (opens a new tab)
        </a>
      ) : null}
    </section>
  );
}

function RequirementRow({
  text,
  evidence,
  actionLabel,
}: {
  text: string;
  evidence: QualificationExplanationModel['checkedRequirements'][number]['evidence'];
  actionLabel: string;
}) {
  return (
    <div className="min-w-0 break-words rounded-control border border-ink-200 bg-white p-3">
      <p className="text-sm font-semibold text-ink-900">{text}</p>
      <p className="mt-1 text-sm text-ink-700">Source: {evidence.sourceLabel} · Source date: {formatSourceDate(evidence.sourceDate)}</p>
      <p className="mt-1 text-sm leading-6 text-ink-700">{evidence.verificationAction}</p>
      <a href={evidence.sourceUrl} target="_blank" rel="noreferrer" aria-label={`${actionLabel} (opens a new tab)`} className="mt-2 inline-flex min-h-touch items-center text-sm font-semibold text-brand-700 underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
        {actionLabel} (opens a new tab)
      </a>
    </div>
  );
}

function KeywordRow({ connection }: { connection: QualificationKeywordConnection }) {
  return (
    <div className="min-w-0 break-words rounded-control border border-ink-200 bg-white p-3">
      <p className="text-sm font-semibold text-ink-900">Keyword connection: {connection.keyword} appears in this reviewed text.</p>
      <p className="mt-1 text-sm text-ink-700">{connection.text}</p>
      <p className="mt-1 text-sm text-ink-700">Source: {connection.evidence.sourceLabel} · Source date: {formatSourceDate(connection.evidence.sourceDate)}</p>
      <a href={connection.evidence.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Verify keyword connection for ${connection.keyword} (opens a new tab)`} className="mt-2 inline-flex min-h-touch items-center text-sm font-semibold text-brand-700 underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
        Verify keyword connection (opens a new tab)
      </a>
    </div>
  );
}

function VerificationRow({ row }: { row: QualificationVerificationRow }) {
  return (
    <div className="min-w-0 break-words rounded-control border border-blue-300 bg-blue-50 p-3 text-blue-950">
      <p className="text-sm font-semibold"><span aria-label="Needs verification" role="img">ⓘ</span> Needs verification</p>
      <p className="mt-1 text-sm">{row.text}</p>
      <p className="mt-1 text-sm">Source: {row.evidence.sourceLabel} · Source date: {row.sourceDate ?? 'Source date unavailable'}</p>
      <p className="mt-1 text-sm leading-6">{row.evidence.verificationAction}</p>
      <a href={row.evidence.sourceUrl} target="_blank" rel="noreferrer" aria-label="Verify this requirement (opens a new tab)" className="mt-2 inline-flex min-h-touch items-center text-sm font-semibold text-blue-800 underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
        Verify this requirement (opens a new tab)
      </a>
    </div>
  );
}

function formatSourceDate(sourceDate: { state: string; value?: string | null }): string {
  return sourceDate.state === 'documented' ? sourceDate.value ?? 'Source date unavailable' : 'Source date unavailable';
}

import Link from 'next/link';
import ShortlistButton from '@/components/shortlist/ShortlistButton';
import { Badge, Card } from '@/components/ui';
import type { OpportunityMatch } from '@/lib/opportunity-matching';
import { PROGRAMME_PATHWAY_LABELS } from '@/lib/programmes';

interface OpportunityMatchCardProps {
  match: OpportunityMatch;
  compact?: boolean;
}

export default function OpportunityMatchCard({
  match,
  compact = false,
}: OpportunityMatchCardProps) {
  const { programme, reasons, cautions, evidence } = match;

  return (
    <Card className={compact ? 'p-4' : 'p-5'}>
      <div className="flex flex-wrap gap-2">
        <Badge tone="brand">{PROGRAMME_PATHWAY_LABELS[programme.pathway]}</Badge>
        <Badge>{programme.delivery}</Badge>
        <Badge tone={evidence.state === 'documented' ? 'success' : 'warning'}>
          {evidence.state === 'documented' ? 'Documented details' : 'Verify details'}
        </Badge>
      </div>
      <h2 className="mt-3 text-xl font-semibold text-ink-900">
        <Link href={`/programmes/${programme.id}`} className="hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
          {programme.name}
        </Link>
      </h2>
      <p className="mt-1 text-sm font-semibold text-ink-600">
        {programme.school} - {programme.city}, {programme.state}
      </p>
      <section className="mt-4" aria-label="Match reasons">
        <h3 className="text-sm font-semibold text-ink-900">
          Why this matches your stated preferences
        </h3>
        <ul className="mt-2 space-y-1">
          {reasons.map((reason) => (
            <li key={reason} className="text-sm leading-6 text-ink-700">
              {reason}
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-4 rounded-card border border-border bg-silver p-3" aria-label="Source and verification">
        <p className="text-sm font-semibold text-ink-700">
          {evidence.sourceLabel
            ? `Source: ${evidence.sourceLabel}`
            : 'Source details are not documented.'}
        </p>
        {evidence.lastVerifiedAt ? (
          <p className="mt-1 text-xs font-medium text-ink-600">
            Last reviewed: {evidence.lastVerifiedAt}
          </p>
        ) : null}
        <p className="mt-2 text-sm leading-6 text-ink-700">
          {evidence.verificationGuidance}
        </p>
      </section>
      {cautions.length > 0 ? (
        <section className="mt-4 rounded-card bg-warning-50 p-3" aria-label="Verification cautions">
          <h3 className="text-sm font-semibold text-warning-700">Worth verifying</h3>
          <ul className="mt-2 space-y-1">
            {cautions.map((caution) => (
              <li key={caution} className="text-sm leading-6 text-ink-700">
                {caution}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <ShortlistButton programmeId={programme.id} />
        <Link href="/shortlist" className="inline-flex min-h-touch items-center rounded-control border border-border bg-white px-4 text-sm font-semibold text-ink-700 hover:border-brand-400 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
          Compare
        </Link>
        {evidence.sourceUrl ? (
          <Link href={evidence.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-touch items-center rounded-control border border-border bg-white px-4 text-sm font-semibold text-ink-700 hover:border-brand-400 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
            Visit source
          </Link>
        ) : null}
        <Link href="/programmes?pathway=2-year-community-college" className="inline-flex min-h-touch items-center rounded-control border border-border bg-white px-4 text-sm font-semibold text-ink-700 hover:border-brand-400 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
          Alternate pathway
        </Link>
      </div>
    </Card>
  );
}

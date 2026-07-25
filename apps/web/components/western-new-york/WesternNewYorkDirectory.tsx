'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge, Card } from '@/components/ui';
import {
  DEFAULT_WNY_CONTEXT,
  labelTestPolicy,
  rankWesternNewYorkInstitutions,
  type WesternNewYorkInstitution,
  type WesternNewYorkStudentContext,
} from '@/lib/western-new-york';

interface WesternNewYorkDirectoryProps {
  institutions: WesternNewYorkInstitution[];
}

export default function WesternNewYorkDirectory({ institutions }: WesternNewYorkDirectoryProps) {
  const [context, setContext] = useState<WesternNewYorkStudentContext>(DEFAULT_WNY_CONTEXT);
  const ranked = useMemo(() => rankWesternNewYorkInstitutions(institutions, context), [institutions, context]);

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h2 className="text-xl font-extrabold text-ink-900">Personalize access priorities</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-600">
          These controls prioritize documented access facts. They do not predict admission, commute time, campus safety, or the experience of a student from any identity group.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-bold text-ink-700">Transportation<select value={context.transportation} onChange={(event) => setContext({ ...context, transportation: event.target.value as WesternNewYorkStudentContext['transportation'] })} className="mt-1 block w-full rounded-card border border-ink-300 bg-white px-3 py-2 font-medium"><option value="unsure">I need to compare</option><option value="public-transit">Public transit</option><option value="car-or-ride">Car or ride</option><option value="remote-or-flexible">Remote / flexible</option></select></label>
          <label className="text-sm font-bold text-ink-700">Standardized tests<select value={context.testStatus} onChange={(event) => setContext({ ...context, testStatus: event.target.value as WesternNewYorkStudentContext['testStatus'] })} className="mt-1 block w-full rounded-card border border-ink-300 bg-white px-3 py-2 font-medium"><option value="not-sure">Not sure</option><option value="taken">Taken</option><option value="not-taken">Not taken</option></select></label>
          <label className="text-sm font-bold text-ink-700">GPA record<select value={context.gpaStatus} onChange={(event) => setContext({ ...context, gpaStatus: event.target.value as WesternNewYorkStudentContext['gpaStatus'] })} className="mt-1 block w-full rounded-card border border-ink-300 bg-white px-3 py-2 font-medium"><option value="not-sure">Not sure</option><option value="provided">Available</option><option value="not-provided">Not available</option></select></label>
          <label className="flex items-end gap-3 rounded-card border border-ink-200 bg-ink-50 px-3 py-2 text-sm font-bold text-ink-700"><input type="checkbox" checked={context.hasChildren} onChange={(event) => setContext({ ...context, hasChildren: event.target.checked })} />I need child-care-aware planning</label>
        </div>
      </Card>

      <div className="rounded-card border border-brand-200 bg-brand-50 p-5 text-sm leading-6 text-ink-700">
        <strong>Campus environment and incident review:</strong> ScholarScout shows official reporting, Title IX, nondiscrimination, and security-report sources for review. It does not convert reports of racial, sex-based, age-based, or other discrimination into an unverified “safe/unsafe” score.
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {ranked.map(({ institution, accessScore, reasons, reviewItems }) => (
          <Card key={institution.id} className="flex flex-col p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="text-xl font-extrabold text-ink-900">{institution.name}</h2><p className="mt-1 text-sm font-semibold text-ink-600">{institution.city} · {institution.kind.replaceAll('-', ' ')}</p></div>
              {accessScore > 0 ? <Badge tone="success">{accessScore} access signals</Badge> : <Badge>Review fit</Badge>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2"><Badge tone="brand">{labelTestPolicy(institution.admissions.testPolicy)}</Badge><Badge>{institution.logistics.publicTransit === 'verified-access' ? 'Transit documented' : 'Transit plan needed'}</Badge><Badge>{institution.logistics.childcare === 'support-or-referral-documented' ? 'Support navigation documented' : 'Ask about child care'}</Badge></div>
            <p className="mt-4 text-sm leading-6 text-ink-700">{institution.admissions.gpaGuidance}</p>
            {reasons.length ? <ul className="mt-4 space-y-2 text-sm text-success-700">{reasons.map((reason) => <li key={reason}>✓ {reason}</li>)}</ul> : null}
            <div className="mt-4 rounded-card bg-ink-50 p-3"><p className="text-xs font-bold uppercase text-ink-500">Verify before applying</p><ul className="mt-2 space-y-1 text-sm leading-5 text-ink-700">{reviewItems.map((item) => <li key={item}>• {item}</li>)}</ul></div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2"><a href={institution.officialUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center rounded-card border border-brand-600 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50">Official site</a><a href={institution.mediaUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center rounded-card border border-ink-300 px-4 text-sm font-semibold text-ink-700 hover:bg-ink-50">Visit / official media</a></div>
            <div className="mt-5 border-t border-ink-200 pt-4"><p className="text-xs font-bold uppercase text-ink-500">Campus-environment sources</p><p className="mt-1 text-xs leading-5 text-ink-600">{institution.accountability.notice}</p><div className="mt-3 flex flex-wrap gap-2">{institution.accountability.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand-700 underline">{source.label} ({source.status === 'verified' ? 'checked' : 'confirm'})</a>)}</div></div>
          </Card>
        ))}
      </div>
      <p className="text-xs leading-5 text-ink-500">Directory sources checked July 25, 2026. Policies, support availability, transit service, and admission requirements can change; use the linked primary sources and confirm directly with each institution.</p>
      <Link href="/onboarding" className="inline-flex text-sm font-bold text-brand-700 hover:text-brand-800">Update core programme preferences →</Link>
    </div>
  );
}

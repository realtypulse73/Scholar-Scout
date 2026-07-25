import Link from 'next/link';
import { Badge } from '@/components/ui';
import WesternNewYorkDirectory from '@/components/western-new-york/WesternNewYorkDirectory';
import { WESTERN_NEW_YORK_INSTITUTIONS } from '@/lib/western-new-york';

export const metadata = {
  title: 'Western New York Pathways | ScholarScout',
  description: 'Source-linked Western New York college and workforce-training options with admissions, access, transit, and campus-environment review prompts.',
};

export default function WesternNewYorkPage() {
  return (
    <main className="min-h-screen bg-ink-50 text-ink-900">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8" aria-label="Western New York pathways navigation">
        <Link href="/" className="text-lg font-extrabold text-brand-700">ScholarScout</Link>
        <Link href="/programmes" className="text-sm font-semibold text-ink-600 hover:text-brand-700">Programme matching</Link>
      </nav>
      <section className="border-y border-ink-200 bg-white"><div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8"><Badge tone="brand">Western New York pathways</Badge><h1 className="mt-4 max-w-3xl text-3xl font-extrabold sm:text-4xl">Compare access, admissions, and campus-environment sources before you apply.</h1><p className="mt-4 max-w-3xl text-base leading-7 text-ink-600">A source-linked directory of regional colleges, universities, and workforce training—including Northland Workforce Training Center—for students balancing tests, GPA records, transit, caregiving, cost, and campus accountability questions.</p></div></section>
      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8"><WesternNewYorkDirectory institutions={WESTERN_NEW_YORK_INSTITUTIONS} /></section>
    </main>
  );
}

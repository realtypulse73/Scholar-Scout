import Link from 'next/link';
import CataloguePublicationManager from '@/components/admin/CataloguePublicationManager';
import StaffGate from '@/components/auth/StaffGate';

export const metadata = {
  title: 'Catalogue Publication | ScholarScout',
  description: 'Stage, correct, and independently review private catalogue candidates.',
};

export default function CataloguePublicationsPage() {
  return (
    <main className="min-h-screen bg-ink-50 text-ink-900">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8" aria-label="Admin navigation">
        <Link href="/" className="text-lg font-semibold text-brand-700">ScholarScout</Link>
        <Link href="/admin/programmes" className="text-sm font-semibold text-ink-600 hover:text-brand-700">Programme admin</Link>
      </nav>
      <section className="mx-auto max-w-6xl px-5 pb-10 pt-4 sm:px-6 lg:px-8">
        <StaffGate><CataloguePublicationManager /></StaffGate>
      </section>
    </main>
  );
}

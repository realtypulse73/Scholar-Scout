import Link from 'next/link';
import { notFound } from 'next/navigation';
import AuthStatusLink from '@/components/auth/AuthStatusLink';
import CampusNoteBoard from '@/components/campus-community/CampusNoteBoard';
import { Badge, Card } from '@/components/ui';
import { creatorProfiles } from '@/lib/platform';
import { getGovernedProgrammes } from '@/lib/server/programme-records';

export default async function SchoolLockerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const uploaders = creatorProfiles.filter((uploader) => uploader.schoolSlug === slug);
  if (!uploaders.length) notFound();
  const programmes = (await getGovernedProgrammes()).filter((programme) => programme.school === uploaders[0].school);

  return (
    <main className="min-h-screen bg-ink-50 text-ink-900">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-extrabold text-brand-700">ScholarScout</Link>
        <div className="flex items-center gap-4"><Link href="/peer-community" className="text-sm font-semibold text-ink-600">Campus conversations</Link><AuthStatusLink /></div>
      </nav>
      <section className="transition-story border-y border-ink-200"><div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8"><Badge tone="brand">School locker</Badge><h1 className="mt-4 text-4xl font-extrabold text-ink-900">{uploaders[0].school}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600">A place for official program information alongside the real perspectives posted by students studying here.</p></div></section>
      <section aria-labelledby="school-verification-heading" className="mx-auto max-w-6xl px-5 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-card border border-brand-200 bg-brand-50 p-6 text-sm leading-6 text-ink-700">
          <h2 id="school-verification-heading" className="font-extrabold text-brand-800">Verify programme details before you apply</h2>
          <p className="mt-2">Programme details can change. Open the official programme page to confirm requirements, delivery, cost, and deadlines.</p>
        </div>
      </section>
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8">
        <div className="space-y-5">
          <section><h2 className="text-2xl font-extrabold text-ink-900">Programs at this school</h2><div className="mt-4 space-y-3">{programmes.length ? programmes.map((programme) => <Card key={programme.id} className="p-4"><h3 className="font-extrabold text-ink-900">{programme.name}</h3><p className="mt-1 text-sm leading-6 text-ink-600">{programme.credential} · {programme.delivery} · {programme.duration}</p><Link href={`/programmes/${programme.id}`} className="mt-3 inline-flex text-sm font-bold text-brand-700">View program details</Link></Card>) : <Card className="p-5"><h3 className="text-xl font-extrabold text-ink-900">No programme details are available for this school yet</h3><p className="mt-2 text-sm leading-6 text-ink-600">Explore the student perspectives below and check the school’s official website for current programme information.</p></Card>}</div></section>
          <section><h2 className="text-2xl font-extrabold text-ink-900">Student uploaders</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{uploaders.map((uploader) => <Card key={uploader.username} className="p-4"><p className="text-xs font-bold uppercase text-success-700">Posts from this campus</p><h3 className="mt-2 font-extrabold text-ink-900">{uploader.displayName}</h3><p className="mt-1 text-sm text-ink-600">{uploader.currentStage}</p><Link href={`/u/${uploader.username}`} className="mt-3 inline-flex text-sm font-bold text-brand-700">View uploader profile</Link></Card>)}</div></section>
        </div>
        <CampusNoteBoard schoolSlug={slug} />
      </div>
    </main>
  );
}

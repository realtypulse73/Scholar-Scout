import Link from 'next/link';
import { notFound } from 'next/navigation';
import AuthStatusLink from '@/components/auth/AuthStatusLink';
import CampusNoteBoard from '@/components/campus-community/CampusNoteBoard';
import { Badge, Card } from '@/components/ui';
import { creatorProfiles } from '@/lib/platform';
import { getGovernedProgrammes } from '@/lib/server/programme-records';

function toSchoolSlug(school: string) {
  return school
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default async function SchoolLockerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const allProgrammes = await getGovernedProgrammes();
  const uploaders = creatorProfiles.filter(
    (uploader) => uploader.schoolSlug === slug,
  );
  const school =
    allProgrammes.find((programme) => toSchoolSlug(programme.school) === slug)
      ?.school ?? uploaders[0]?.school;

  if (!school) notFound();

  const programmes = allProgrammes.filter(
    (programme) => programme.school === school,
  );
  const officialProgramme = programmes.find((programme) => programme.sourceUrl);

  return (
    <main className="min-h-screen bg-ink-50 text-ink-900">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-extrabold text-brand-700">ScholarScout</Link>
        <div className="flex items-center gap-4"><Link href="/peer-community" className="text-sm font-semibold text-ink-600">Campus conversations</Link><AuthStatusLink /></div>
      </nav>
      <section className="transition-story border-y border-ink-200">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8">
          <Badge tone="brand">School locker</Badge>
          <h1 className="mt-4 text-4xl font-extrabold text-ink-900">
            {school}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600">
            Official programme information is available here now. Student
            perspectives will appear once approved students choose to share
            them.
          </p>
        </div>
      </section>
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8">
        <div className="space-y-5">
          <section>
            <h2 className="text-2xl font-extrabold text-ink-900">
              Programmes at this school
            </h2>
            <div className="mt-4 space-y-3">
              {programmes.map((programme) => (
                <Card key={programme.id} className="p-4">
                  <h3 className="font-extrabold text-ink-900">
                    {programme.name}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-ink-600">
                    {programme.credential} · {programme.delivery} ·{' '}
                    {programme.duration}
                  </p>
                  <Link
                    href={`/programmes/${programme.id}`}
                    className="mt-3 inline-flex text-sm font-bold text-brand-700"
                  >
                    View programme details
                  </Link>
                </Card>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-2xl font-extrabold text-ink-900">
              Student perspectives
            </h2>
            {uploaders.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {uploaders.map((uploader) => (
                  <Card key={uploader.username} className="p-4">
                    <p className="text-xs font-bold uppercase text-success-700">
                      Posts from this campus
                    </p>
                    <h3 className="mt-2 font-extrabold text-ink-900">
                      {uploader.displayName}
                    </h3>
                    <p className="mt-1 text-sm text-ink-600">
                      {uploader.currentStage}
                    </p>
                    <Link
                      href={`/u/${uploader.username}`}
                      className="mt-3 inline-flex text-sm font-bold text-brand-700"
                    >
                      View uploader profile
                    </Link>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600">
                Student content has not been published for this school yet.
              </p>
            )}
          </section>
        </div>
        <aside className="space-y-6">
          {officialProgramme?.sourceUrl ? (
            <Card className="p-5">
              <h2 className="text-lg font-extrabold text-ink-900">
                Official school details
              </h2>
              <p className="mt-3 text-sm leading-6 text-ink-600">
                {officialProgramme.sourceNotes ??
                  'Use the official institution links for the latest programme information.'}
              </p>
              <a
                href={officialProgramme.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex text-sm font-bold text-brand-700"
              >
                Visit {officialProgramme.sourceName ?? 'official school website'}
              </a>
              {officialProgramme.schoolSocialUrl ? (
                <a
                  href={officialProgramme.schoolSocialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block text-sm font-bold text-brand-700"
                >
                  View official social updates
                </a>
              ) : null}
            </Card>
          ) : null}
          <CampusNoteBoard schoolSlug={slug} />
        </aside>
      </div>
    </main>
  );
}

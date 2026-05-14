import Link from 'next/link';
import AuthStatusLink from '@/components/auth/AuthStatusLink';
import { Badge, Card } from '@/components/ui';

const stats = [
  { label: 'student signals', value: '6' },
  { label: 'match factors', value: '24+' },
  { label: 'rejection fees', value: '$0' },
];

const valueProps = [
  {
    title: 'Start with fit',
    description:
      'ScholarScout begins with goals, budget, location, support needs, and pathway preferences before suggesting programmes.',
  },
  {
    title: 'Keep options realistic',
    description:
      'Students see routes that can match their profile, including two-year, trade, certificate, online, and university pathways.',
  },
  {
    title: 'Compare without pressure',
    description:
      'Shortlists are designed for practical next steps: cost, distance, services, and confidence fit in one place.',
  },
];

const previewMatches = [
  {
    name: 'Applied Health Sciences',
    school: 'North Valley College',
    tags: ['Local', 'Strong support', 'Budget fit'],
    score: '94%',
  },
  {
    name: 'Cybersecurity Certificate',
    school: 'Metro Technical Institute',
    tags: ['Online option', 'Career-ready', 'Low cost'],
    score: '91%',
  },
  {
    name: 'Business Transfer Pathway',
    school: 'Lakeside Community College',
    tags: ['2-year start', 'Transferable', 'Flexible'],
    score: '88%',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-ink-900">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <Link href="/" className="text-lg font-extrabold text-brand-700">
          ScholarScout
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/feed"
            className="hidden text-sm font-semibold text-ink-600 hover:text-brand-700 sm:inline"
          >
            Feed
          </Link>
          <Link
            href="/advisor"
            className="hidden text-sm font-semibold text-ink-600 hover:text-brand-700 sm:inline"
          >
            Advisor
          </Link>
          <Link
            href="/shortlist"
            className="text-sm font-semibold text-ink-600 hover:text-brand-700"
          >
            Shortlist
          </Link>
          <Link
            href="/admin/programmes"
            className="hidden text-sm font-semibold text-ink-600 hover:text-brand-700 sm:inline"
          >
            Admin
          </Link>
          <AuthStatusLink />
          <Link
            href="/onboarding"
            className="inline-flex min-h-10 items-center justify-center rounded-card border border-brand-600 bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Start matching
          </Link>
        </div>
      </nav>

      <section className="border-y border-ink-200 bg-ink-50">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:items-center lg:px-8 lg:py-16">
          <div>
            <Badge tone="brand" className="mb-5">
              Rejection-free discovery
            </Badge>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-ink-900 sm:text-5xl">
              ScholarScout
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink-600 sm:text-lg">
              Find post-secondary programmes that fit your goals, budget,
              location, support needs, and life circumstances before you spend
              time on applications that may not serve you.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/onboarding"
                className="inline-flex min-h-12 items-center justify-center rounded-card border border-brand-600 bg-brand-600 px-5 text-base font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                Find my path
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex min-h-12 items-center justify-center rounded-card border border-ink-300 bg-white px-5 text-base font-semibold text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                See how it works
              </a>
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="border-l border-ink-300 pl-3">
                  <dt className="text-xs font-semibold uppercase text-ink-500">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 text-2xl font-extrabold text-ink-900">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-card border border-ink-200 bg-white p-4 shadow-panel">
            <div className="mb-4 flex items-center justify-between border-b border-ink-200 pb-3">
              <div>
                <p className="text-xs font-semibold uppercase text-ink-500">
                  Match preview
                </p>
                <p className="mt-1 text-sm font-bold text-ink-900">
                  Routes worth exploring
                </p>
              </div>
              <Badge tone="success">Ready</Badge>
            </div>
            <div className="space-y-3">
              {previewMatches.map((match) => (
                <article
                  key={match.name}
                  className="rounded-card border border-ink-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-ink-900">
                        {match.name}
                      </h2>
                      <p className="mt-1 text-sm text-ink-500">
                        {match.school}
                      </p>
                    </div>
                    <p className="text-sm font-extrabold text-success-700">
                      {match.score}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {match.tags.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <Badge tone="warning" className="mb-4">
            Practical guidance
          </Badge>
          <h2 className="text-2xl font-extrabold text-ink-900">
            Built for students comparing real options
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {valueProps.map((item) => (
            <Card key={item.title} className="p-5">
              <h3 className="text-base font-bold text-ink-900">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-ink-600">
                {item.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-ink-200 bg-ink-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-10 text-white sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <h2 className="text-2xl font-extrabold">Start with six signals.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-200">
              The onboarding wizard is live and ready to collect the first
              student profile needed for future programme matching.
            </p>
          </div>
          <Link
            href="/programmes"
            className="inline-flex min-h-12 items-center justify-center rounded-card border border-white bg-white px-5 text-base font-semibold text-ink-900 transition-colors hover:bg-ink-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
          >
            Browse programmes
          </Link>
        </div>
      </section>
    </main>
  );
}

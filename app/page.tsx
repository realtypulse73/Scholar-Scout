import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-extrabold text-blue-600 mb-3">
          ScholarScout
        </h1>
        <p className="text-gray-600 mb-8 text-base leading-relaxed">
          A rejection-free post-secondary discovery platform. We match you with
          programmes that fit your goals, budget, and life.
        </p>
        <Link
          href="/onboarding"
          className="inline-block w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-base hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
        >
          Get Started →
        </Link>
      </div>
    </main>
  );
}

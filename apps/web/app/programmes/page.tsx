import CatalogueDiscoveryOverview from '@/components/catalogue/CatalogueDiscoveryOverview';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { buildCatalogueDiscoveryModel } from '@/lib/catalogue-discovery';
import { buildQualificationLensModel } from '@/lib/qualification-lens';
import { getQualificationRecord } from '@/lib/server/data-store';
import { getPublishedCatalogueSnapshot } from '@/lib/server/programme-records';

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata = {
  title: 'Reviewed opportunities | Scholar Scout',
  description: 'Browse the current reviewed Scholar Scout opportunity catalogue by metro and pathway.',
};

// The active reviewed snapshot can change without a source edit; never cache a stale catalogue view.
export const dynamic = 'force-dynamic';

export default async function ProgrammesPage({ searchParams }: PageProps) {
  const snapshot = await getPublishedCatalogueSnapshot();
  const model = buildCatalogueDiscoveryModel({
    records: snapshot.records,
    searchParams: (await searchParams) ?? {},
  });
  const session = await getServerSession(authOptions);
  const qualificationRecord = session?.user?.id
    ? await getQualificationRecord(session.user.id)
    : null;
  const qualificationLens = buildQualificationLensModel(model.items, {
    structured: qualificationRecord?.structured ?? [],
    keywords: qualificationRecord?.keywords ?? [],
  });

  return <CatalogueDiscoveryOverview model={model} qualificationLens={qualificationLens} canEditQualifications={Boolean(session?.user?.id)} />;
}

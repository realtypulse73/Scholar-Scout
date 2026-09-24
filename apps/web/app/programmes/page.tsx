import CatalogueDiscoveryOverview from '@/components/catalogue/CatalogueDiscoveryOverview';
import { buildCatalogueDiscoveryModel } from '@/lib/catalogue-discovery';
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

  return <CatalogueDiscoveryOverview model={model} />;
}

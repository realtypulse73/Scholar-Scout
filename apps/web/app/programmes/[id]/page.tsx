import { notFound } from 'next/navigation';
import CatalogueFocusView from '@/components/catalogue/CatalogueFocusView';
import {
  buildCatalogueDetailHref,
  buildCatalogueDiscoveryHref,
  buildCatalogueDiscoveryModel,
} from '@/lib/catalogue-discovery';
import { CATALOGUE_PATHWAYS } from '@/lib/catalogue-contract';
import { getPublishedCatalogueSnapshot } from '@/lib/server/programme-records';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params, searchParams }: PageProps) {
  const { id } = await params;
  const model = await getDiscoveryModel((await searchParams) ?? {});
  const item = model.items.find((candidate) => candidate.id === id);

  if (!item) return { title: 'Opportunity Not Found | Scholar Scout' };

  return {
    title: `${item.providerTitle} | Scholar Scout`,
    description: `Reviewed opportunity facts, sources, and a direct verification action for ${item.providerTitle}.`,
  };
}

export default async function ProgrammeDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const model = await getDiscoveryModel((await searchParams) ?? {});
  const index = model.items.findIndex((candidate) => candidate.id === id);
  if (index === -1) notFound();

  const item = model.items[index];
  const previous = index > 0 ? model.items[index - 1] : null;
  const next = index < model.items.length - 1 ? model.items[index + 1] : null;
  const alternatePathway = CATALOGUE_PATHWAYS.find((pathway) => pathway !== item.pathway) ?? 'university';
  const alternateHref = buildCatalogueDiscoveryHref({
    ...model.filters,
    pathway: alternatePathway,
    page: 1,
  });

  return (
    <CatalogueFocusView
      item={item}
      backHref={model.canonicalHref}
      previousHref={previous ? buildCatalogueDetailHref(previous.id, model.filters) : undefined}
      nextHref={next ? buildCatalogueDetailHref(next.id, model.filters) : undefined}
      alternateHref={alternateHref}
    />
  );
}

async function getDiscoveryModel(searchParams: Record<string, string | string[] | undefined>) {
  const snapshot = await getPublishedCatalogueSnapshot();
  return buildCatalogueDiscoveryModel({ records: snapshot.records, searchParams });
}

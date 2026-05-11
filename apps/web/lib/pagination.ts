export const PROGRAMME_PAGE_SIZE = 4;

export interface PaginatedResult<T> {
  page: number;
  pageCount: number;
  pageSize: number;
  totalItems: number;
  items: T[];
}

export function parsePageParam(value: string | undefined, fallback = 1) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const pageCount = Math.max(1, Math.ceil(items.length / safePageSize));
  const safePage = Math.min(Math.max(Math.floor(page), 1), pageCount);
  const start = (safePage - 1) * safePageSize;

  return {
    page: safePage,
    pageCount,
    pageSize: safePageSize,
    totalItems: items.length,
    items: items.slice(start, start + safePageSize),
  };
}

export function buildPageSearchParams(
  params: Record<string, string | undefined>,
  page: number,
) {
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (key !== 'page' && value) {
      nextParams.set(key, value);
    }
  });
  nextParams.set('page', String(page));

  return nextParams;
}

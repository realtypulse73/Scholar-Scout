import {
  buildPageSearchParams,
  paginateItems,
  parsePageParam,
} from '@/lib/pagination';

describe('pagination helpers', () => {
  it('parses positive integer page params', () => {
    expect(parsePageParam('3')).toBe(3);
    expect(parsePageParam('0')).toBe(1);
    expect(parsePageParam('-2')).toBe(1);
    expect(parsePageParam('2.5')).toBe(1);
    expect(parsePageParam('abc')).toBe(1);
  });

  it('clamps pagination and returns result metadata', () => {
    const page = paginateItems(['a', 'b', 'c', 'd', 'e'], 99, 2);

    expect(page).toEqual({
      page: 3,
      pageCount: 3,
      pageSize: 2,
      totalItems: 5,
      items: ['e'],
    });
  });

  it('uses a minimum page size of one', () => {
    const page = paginateItems(['a', 'b'], 1, 0);

    expect(page.pageSize).toBe(1);
    expect(page.pageCount).toBe(2);
    expect(page.items).toEqual(['a']);
  });

  it('preserves active filters while replacing the page param', () => {
    const params = buildPageSearchParams(
      {
        q: 'health',
        pathway: '2-year-community-college',
        location: undefined,
        page: '1',
      },
      2,
    );

    expect(params.toString()).toBe(
      'q=health&pathway=2-year-community-college&page=2',
    );
  });
});

import {
  filterProgrammes,
  getProgrammeById,
  getRelatedProgrammes,
  paginateProgrammes,
  programmes,
} from '@/lib/programmes';

describe('programme matching helpers', () => {
  it('filters programmes by search query', () => {
    const results = filterProgrammes(programmes, { query: 'cybersecurity' });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('metro-cybersecurity');
  });

  it('filters programmes by pathway and tuition ceiling', () => {
    const results = filterProgrammes(programmes, {
      pathway: '2-year-community-college',
      maxTuition: 5000,
    });

    expect(results.map((programme) => programme.id)).toEqual([
      'lakeside-business-transfer',
    ]);
  });

  it('sorts matches by score descending', () => {
    const results = filterProgrammes(programmes, {});

    expect(results[0].matchScore).toBeGreaterThan(results[1].matchScore);
  });

  it('clamps pagination to available pages', () => {
    const page = paginateProgrammes(programmes, 99, 4);

    expect(page.page).toBe(2);
    expect(page.pageCount).toBe(2);
    expect(page.items).toHaveLength(4);
  });

  it('finds a programme by id', () => {
    expect(getProgrammeById('harbor-welding')?.name).toBe('Advanced Welding');
  });

  it('returns related programmes without the source programme', () => {
    const source = programmes[0];
    const related = getRelatedProgrammes(source, 2);

    expect(related).toHaveLength(2);
    expect(related).not.toContain(source);
  });
});

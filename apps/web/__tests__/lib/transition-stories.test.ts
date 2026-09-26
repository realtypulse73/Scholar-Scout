import { TRANSITION_STORIES } from '@/lib/transition-stories';

describe('transition stories', () => {
  it('provides a fixed set of stable Scholar Scout context records for all six approved areas', () => {
    expect(TRANSITION_STORIES).toHaveLength(6);
    expect(TRANSITION_STORIES.map((story) => story.id)).toEqual([
      'explore-possibilities',
      'compare-questions',
      'notice-practical-details',
      'consider-supports',
      'plan-next-steps',
      'keep-options-open',
    ]);

    const destinations = TRANSITION_STORIES.map((story) => story.href);
    expect(new Set(destinations).size).toBe(6);
    expect(destinations).toEqual(expect.arrayContaining([
      '/programmes?metro=greater-houston&pathway=university',
      '/programmes?metro=greater-chicago&pathway=community-college',
      '/programmes?metro=greater-buffalo&pathway=trade-career-school',
      '/programmes?metro=greater-atlanta&pathway=registered-apprenticeship',
      '/programmes?metro=greater-new-orleans&pathway=employer-linked-training',
      '/programmes?metro=greater-kingston-jamaica&pathway=military-information',
    ]));
  });

  it('uses concise general context rather than testimony, attendance, or outcome claims', () => {
    const editorialCopy = TRANSITION_STORIES
      .flatMap((story) => [story.title, story.context])
      .join(' ')
      .toLocaleLowerCase();

    expect(editorialCopy).not.toMatch(/testimonial|attended|graduate|placed|success story|outcome/);
    expect(editorialCopy).not.toMatch(/college name|academy|university of/);
  });
});

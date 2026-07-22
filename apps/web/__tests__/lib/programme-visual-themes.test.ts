import {
  getProgrammeVisualAltText,
  getProgrammeVisualTheme,
} from '@/lib/programme-visual-themes';
import { programmes, type Programme } from '@/lib/programmes';

describe('programme visual themes', () => {
  it('selects visual media from the primary programme interest', () => {
    const programme = programmes.find((item) => item.id === 'metro-cybersecurity');

    expect(programme).toBeDefined();
    expect(getProgrammeVisualTheme(programme as Programme)).toMatchObject({
      id: 'technology',
      stillUrl: '/visual-themes/technology-project.svg',
    });
  });

  it('brings the first support signal into the theme copy', () => {
    const programme = programmes.find((item) => item.id === 'evergreen-environmental');

    expect(programme).toBeDefined();
    expect(getProgrammeVisualTheme(programme as Programme).supportSignal).toContain(
      'Wellbeing support',
    );
  });

  it('falls back to an applied STEM theme when interests are absent', () => {
    const theme = getProgrammeVisualTheme({
      interests: [],
      pathway: 'certificate-program',
      support: [],
    });

    expect(theme.id).toBe('stem');
    expect(theme.pathwaySignal).toBe('short career-focused credential');
  });

  it('builds accessible still-image alt text for programme cards', () => {
    const programme = programmes[0];

    expect(getProgrammeVisualAltText(programme)).toContain(programme.name);
    expect(getProgrammeVisualAltText(programme)).toContain('visual theme');
  });
});

import {
  getSchoolBrand,
  getSchoolLogoAltText,
} from '@/lib/school-branding';
import { programmes } from '@/lib/programmes';

describe('school branding helpers', () => {
  it('returns a logo for every current programme school', () => {
    const brands = programmes.map((programme) => getSchoolBrand(programme));

    expect(brands).toHaveLength(programmes.length);
    expect(brands.every((brand) => brand.logoUrl.startsWith('/school-logos/'))).toBe(
      true,
    );
    expect(brands.every((brand) => brand.shortName.length > 0)).toBe(true);
  });

  it('uses a stable fallback for schools without a dedicated logo', () => {
    const brand = getSchoolBrand({ school: 'Future Access College' });

    expect(brand.logoUrl).toBe('/school-logos/scholarscout-school.svg');
    expect(brand.shortName).toBe('FAC');
  });

  it('builds accessible logo alt text from the school name', () => {
    expect(getSchoolLogoAltText({ school: 'North Valley College' })).toBe(
      'North Valley College logo',
    );
  });
});

import { getCampusUploaderMatches } from '@/lib/peer-guides';
import { validateUploaderInboxRequest } from '@/lib/campus-community';
import { creatorProfiles } from '@/lib/platform';
import { programmes } from '@/lib/programmes';

describe('campus uploader matching', () => {
  it('matches uploaders on declared pathway and interests without using GPA or protected identity', () => {
    const matches = getCampusUploaderMatches(creatorProfiles, programmes, {
      gpaBand: 'no-gpa',
      interests: ['healthcare'],
      locationPreference: 'local',
      pathwayPreference: '2-year-community-college',
      affordabilitySensitivity: 3,
      supportNeeds: [],
    });

    expect(matches.map((match) => match.uploaderUsername)).toEqual(['maya-health']);
  });

  it('requires a pathway profile before exposing a request-eligible guide', () => {
    expect(getCampusUploaderMatches(creatorProfiles, programmes, null)).toEqual([]);
  });

  it('orders compatible uploaders by normalized public display name and omits private profile signals', () => {
    const matches = getCampusUploaderMatches([
      { ...creatorProfiles[0], username: 'zoe', displayName: 'Zoë A.' },
      { ...creatorProfiles[0], username: 'emile', displayName: 'Émile B.' },
    ], programmes, {
      gpaBand: 'no-gpa',
      interests: ['healthcare'],
      locationPreference: 'local',
      pathwayPreference: '2-year-community-college',
      affordabilitySensitivity: 3,
      supportNeeds: [],
    });

    expect(matches.map((match) => match.uploader.displayName)).toEqual(['Émile B.', 'Zoë A.']);
    expect(matches[0].uploader).not.toHaveProperty('stats');
    expect(matches[0].uploader).not.toHaveProperty('clarityScore');
    expect(matches[0].uploader).not.toHaveProperty('username');
  });

  it('keeps contact details out of the first connection request', () => {
    expect(validateUploaderInboxRequest({
      uploader_username: 'maya-health',
      program_id: 'north-valley-health',
      body: 'Can you text me at 555-555-5555?',
    })).toContain('Do not include phone numbers, email addresses, or social handles in your first inbox request.');
  });
});

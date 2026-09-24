import {
  parseQualificationRecord,
  type QualificationRecord,
} from '@/lib/qualification-record';

const completeRecord: QualificationRecord = {
  structured: ['diploma-credits', 'prior-work'],
  note: 'I completed a career technical programme.',
  keywords: ['customer service', 'health care'],
};

describe('qualification record contract', () => {
  it('normalizes the narrow private record deterministically', () => {
    expect(
      parseQualificationRecord({
        structured: ['prior-work', 'diploma-credits'],
        note: '  I completed a career technical programme.  ',
        keywords: [' Customer   Service ', 'health care', 'customer service'],
      }),
    ).toEqual(completeRecord);
  });

  it('rejects unapproved fields and sensitive or ranking inputs', () => {
    expect(
      parseQualificationRecord({
        ...completeRecord,
        gpa: '4.0',
      }),
    ).toBeNull();
    expect(
      parseQualificationRecord({
        ...completeRecord,
        accountId: 'another-student',
      }),
    ).toBeNull();
  });
});

import {
  AID_TYPE_LABELS,
  formatDeadline,
  getAidSignals,
  getCostSummary,
  getDeadlineSignals,
  getShortlistDeadlines,
  isDeadlineSoon,
} from '@/lib/affordability';
import { getProgrammeById, programmes } from '@/lib/programmes';

describe('affordability helpers', () => {
  describe('formatDeadline', () => {
    it('formats an ISO date into a readable string', () => {
      expect(formatDeadline('2026-08-01')).toBe('August 1, 2026');
    });

    it('returns Rolling when no date is provided', () => {
      expect(formatDeadline(undefined)).toBe('Rolling');
    });
  });

  describe('isDeadlineSoon', () => {
    it('returns false when no date is provided', () => {
      expect(isDeadlineSoon(undefined)).toBe(false);
    });

    it('detects a date within the default 60-day window', () => {
      const now = new Date();
      now.setDate(now.getDate() + 30);
      const soon = now.toISOString().slice(0, 10);
      expect(isDeadlineSoon(soon)).toBe(true);
    });

    it('returns false for a date beyond the window', () => {
      expect(isDeadlineSoon('2030-01-01')).toBe(false);
    });

    it('respects a custom daysWindow argument', () => {
      const now = new Date();
      now.setDate(now.getDate() + 10);
      const tenDaysOut = now.toISOString().slice(0, 10);
      expect(isDeadlineSoon(tenDaysOut, 7)).toBe(false);
      expect(isDeadlineSoon(tenDaysOut, 14)).toBe(true);
    });
  });

  describe('getDeadlineSignals', () => {
    it('returns no signals for a programme with no deadlines', () => {
      const prog = getProgrammeById('metro-cybersecurity')!;
      expect(getDeadlineSignals(prog)).toHaveLength(0);
    });

    it('builds an Apply-by signal from applicationDeadline', () => {
      const prog = getProgrammeById('north-valley-health')!;
      const signals = getDeadlineSignals(prog);
      const applySignal = signals.find((s) => s.label === 'Apply by');

      expect(applySignal).toBeDefined();
      expect(applySignal!.date).toBe('2026-08-01');
      expect(applySignal!.formatted).toBe('August 1, 2026');
    });

    it('builds an Aid-deadline signal from aidDeadline', () => {
      const prog = getProgrammeById('north-valley-health')!;
      const signals = getDeadlineSignals(prog);
      const aidSignal = signals.find((s) => s.label === 'Aid deadline');

      expect(aidSignal).toBeDefined();
      expect(aidSignal!.date).toBe('2026-06-15');
    });

    it('marks the soon flag correctly', () => {
      // summit-teacher-apprentice has applicationDeadline '2026-06-25' (within 60 days of 2026-05-27)
      const prog = getProgrammeById('summit-teacher-apprentice')!;
      const signals = getDeadlineSignals(prog);

      expect(signals[0].soon).toBe(true);
    });
  });

  describe('getAidSignals', () => {
    it('returns empty when no aidTypes are set', () => {
      const prog = { ...programmes[0], aidTypes: undefined };
      expect(getAidSignals(prog)).toHaveLength(0);
    });

    it('labels Pell Grant with success tone', () => {
      const prog = getProgrammeById('north-valley-health')!;
      const signals = getAidSignals(prog);
      const pellSignal = signals.find((s) => s.label === 'Pell Grant');

      expect(pellSignal).toBeDefined();
      expect(pellSignal!.tone).toBe('success');
      expect(pellSignal!.description).toContain('does not need to be paid back');
    });

    it('labels work-study with brand tone', () => {
      const prog = getProgrammeById('north-valley-health')!;
      const signals = getAidSignals(prog);
      const wsSignal = signals.find((s) => s.label === AID_TYPE_LABELS['work-study']);

      expect(wsSignal).toBeDefined();
      expect(wsSignal!.tone).toBe('brand');
    });

    it('labels employer-tuition-help with brand tone', () => {
      const prog = getProgrammeById('metro-cybersecurity')!;
      const signals = getAidSignals(prog);
      const empSignal = signals.find(
        (s) => s.label === AID_TYPE_LABELS['employer-tuition-help'],
      );

      expect(empSignal).toBeDefined();
      expect(empSignal!.tone).toBe('brand');
    });

    it('returns a signal for every aidType on the programme', () => {
      const prog = getProgrammeById('lakeside-business-transfer')!;

      expect(getAidSignals(prog)).toHaveLength(prog.aidTypes!.length);
    });
  });

  describe('getCostSummary', () => {
    it('identifies low-cost programmes', () => {
      const prog = getProgrammeById('summit-teacher-apprentice')!; // $2,600
      expect(getCostSummary(prog)).toContain('lower-cost');
    });

    it('identifies mid-range programmes', () => {
      const prog = getProgrammeById('north-valley-health')!; // $5,400
      expect(getCostSummary(prog)).toContain('Mid-range');
    });

    it('identifies higher-cost programmes', () => {
      const prog = getProgrammeById('evergreen-environmental')!; // $11,800
      expect(getCostSummary(prog)).toContain('Higher cost');
    });

    it('identifies the highest-cost tier', () => {
      const prog = { ...programmes[0], annualTuition: 15000 };
      expect(getCostSummary(prog)).toContain('higher annual cost');
    });
  });

  describe('getShortlistDeadlines', () => {
    it('returns empty when no shortlisted programmes have deadlines', () => {
      const rolling = programmes.filter(
        (p) => !p.applicationDeadline && !p.aidDeadline,
      );
      expect(getShortlistDeadlines(rolling)).toHaveLength(0);
    });

    it('returns deadlines sorted by ascending date', () => {
      const withDeadlines = programmes.filter(
        (p) => p.applicationDeadline || p.aidDeadline,
      );
      const deadlines = getShortlistDeadlines(withDeadlines);

      for (let i = 1; i < deadlines.length; i++) {
        expect(deadlines[i].date >= deadlines[i - 1].date).toBe(true);
      }
    });

    it('includes both applicationDeadline and aidDeadline as separate entries', () => {
      const northValley = getProgrammeById('north-valley-health')!;
      const deadlines = getShortlistDeadlines([northValley]);

      expect(deadlines).toHaveLength(2);
      expect(deadlines.find((d) => d.label === 'Apply by')).toBeDefined();
      expect(deadlines.find((d) => d.label === 'Aid deadline')).toBeDefined();
    });

    it('marks the urgency correctly for a past deadline', () => {
      const pastProg = { ...programmes[0], applicationDeadline: '2020-01-01', aidDeadline: undefined };
      const deadlines = getShortlistDeadlines([pastProg]);

      expect(deadlines[0].urgency).toBe('overdue');
    });

    it('marks the urgency as soon for a date within 60 days', () => {
      // summit-teacher-apprentice has applicationDeadline '2026-06-25' (29 days out from 2026-05-27)
      const summit = getProgrammeById('summit-teacher-apprentice')!;
      const deadlines = getShortlistDeadlines([summit]);

      expect(deadlines[0].urgency).toBe('soon');
    });

    it('marks the urgency as later for a date beyond 60 days', () => {
      const evergreen = getProgrammeById('evergreen-environmental')!; // 2026-10-01 and 2026-11-01
      const deadlines = getShortlistDeadlines([evergreen]);

      deadlines.forEach((d) => {
        expect(d.urgency).toBe('later');
      });
    });
  });

  describe('programme data completeness', () => {
    it('all 8 programmes have at least one aidType', () => {
      programmes.forEach((prog) => {
        expect(prog.aidTypes?.length).toBeGreaterThan(0);
      });
    });

    it('all programmes with deadlines have valid ISO-format dates', () => {
      const isoDateRe = /^\d{4}-\d{2}-\d{2}$/;

      programmes.forEach((prog) => {
        if (prog.applicationDeadline) {
          expect(prog.applicationDeadline).toMatch(isoDateRe);
        }
        if (prog.aidDeadline) {
          expect(prog.aidDeadline).toMatch(isoDateRe);
        }
      });
    });

    it('AID_TYPE_LABELS covers every aidType used across all programmes', () => {
      const usedTypes = new Set(programmes.flatMap((p) => p.aidTypes ?? []));

      usedTypes.forEach((type) => {
        expect(AID_TYPE_LABELS[type]).toBeDefined();
      });
    });
  });
});

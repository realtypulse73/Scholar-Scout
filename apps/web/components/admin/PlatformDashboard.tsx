import Card from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import type { DecisionLogEntry } from '@/lib/platform';

interface PlatformDashboardProps {
  title: string;
  metrics: {
    feedInteractions: number;
    simulationsCompleted: number;
    referrals: number;
    shares: number;
    analyticsEvents: number;
    memoryRecords: number;
    boostedContent: number;
    removedContent: number;
    decisions: DecisionLogEntry[];
  };
}

export default function PlatformDashboard({
  title,
  metrics,
}: PlatformDashboardProps) {
  const cards = [
    ['Feed events', metrics.feedInteractions],
    ['Simulations', metrics.simulationsCompleted],
    ['Referrals', metrics.referrals],
    ['Shares', metrics.shares],
    ['Analytics', metrics.analyticsEvents],
    ['Memory records', metrics.memoryRecords],
  ];

  return (
    <div className="space-y-6">
      <div>
        <Badge tone="brand">Operations</Badge>
        <h1 className="mt-4 text-3xl font-extrabold text-ink-900">{title}</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value]) => (
          <Card key={label} className="p-5">
            <p className="text-xs font-semibold uppercase text-ink-500">
              {label}
            </p>
            <p className="mt-2 text-3xl font-extrabold text-ink-900">
              {value}
            </p>
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-ink-900">Decision engine</h2>
          <div className="flex gap-2">
            <Badge tone="success">{metrics.boostedContent} boosted</Badge>
            <Badge tone="danger">{metrics.removedContent} removed</Badge>
          </div>
        </div>
        <div className="mt-4 divide-y divide-ink-200">
          {metrics.decisions.map((decision) => (
            <div key={decision.id} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-ink-900">
                  {decision.targetId}
                </p>
                <Badge
                  tone={
                    decision.action === 'boost'
                      ? 'success'
                      : decision.action === 'remove'
                        ? 'danger'
                        : 'neutral'
                  }
                >
                  {decision.action}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-ink-600">{decision.reason}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

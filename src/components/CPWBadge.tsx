interface CPWBadgeProps {
  cost: number;
  wearCount: number;
}

export function CPWBadge({ cost, wearCount }: CPWBadgeProps) {
  if (wearCount === 0 || cost === 0) return null;
  const cpw = cost / wearCount;

  const tier =
    cpw <= 1 ? 'excellent' :
    cpw <= 5 ? 'good' :
    cpw <= 20 ? 'fair' : 'poor';

  const colors: Record<string, string> = {
    excellent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    good: 'bg-blue-50 text-blue-700 border-blue-200',
    fair: 'bg-amber-50 text-amber-700 border-amber-200',
    poor: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[tier]}`}
      title={`Cost Per Wear: $${cpw.toFixed(2)} (${wearCount} wear${wearCount !== 1 ? 's' : ''})`}
    >
      ${cpw.toFixed(2)}/wear
    </span>
  );
}

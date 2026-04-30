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
    excellent: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    good: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    fair: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    poor: 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
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

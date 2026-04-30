import { getItemIcon } from '../lib/itemIcons';

interface ItemSVGIconProps {
  itemtype: string;
  size?: number;
  color?: string;
  className?: string;
}

export function ItemSVGIcon({ itemtype, size = 48, color = 'currentColor', className = '' }: ItemSVGIconProps) {
  const icon = getItemIcon(itemtype);

  return (
    <svg
      width={size}
      height={size}
      viewBox={icon.viewBox}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={itemtype}
      className={className}
      style={{ color }}
    >
      {icon.paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill={p.fill ?? 'none'}
          stroke={p.stroke}
          strokeWidth={p.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

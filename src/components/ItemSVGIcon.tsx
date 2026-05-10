import { useId } from 'react';
import { getItemIcon } from '../lib/itemIcons';

interface ItemSVGIconProps {
  itemtype: string;
  size?: number;
  color?: string;
  majorColour?: string;
  minorColour?: string;
  className?: string;
}

export function ItemSVGIcon({ itemtype, size = 48, color, majorColour, minorColour, className = '' }: ItemSVGIconProps) {
  const icon = getItemIcon(itemtype);
  const gradientBaseId = useId().replace(/:/g, '');
  
  // Determine the effective color to use
  const effectiveColor = majorColour || color || 'currentColor';
  const hasGradient = majorColour && minorColour;
  const gradientId = `gradient-${gradientBaseId}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={icon.viewBox}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={itemtype}
      className={className}
      style={{ color: effectiveColor }}
    >
      {hasGradient && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={majorColour} />
            <stop offset="100%" stopColor={minorColour} />
          </linearGradient>
        </defs>
      )}
      {icon.paths.map((p, i) => {
        // Use gradient for currentColor fills when we have multi-color
        const fillColor = hasGradient && p.fill === 'currentColor' ? `url(#${gradientId})` : p.fill;
        
        return (
          <path
            key={i}
            d={p.d}
            fill={fillColor ?? 'none'}
            stroke={p.stroke}
            strokeWidth={p.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}

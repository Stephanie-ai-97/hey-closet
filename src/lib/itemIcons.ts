// SVG path data for common clothing item types
// Each entry maps a normalized item type keyword → SVG path(s)

export type IconDef = {
  viewBox: string;
  paths: { d: string; fill?: string; stroke?: string; strokeWidth?: number }[];
};

const icons: Record<string, IconDef> = {
  // T-shirt / tshirt
  tshirt: {
    viewBox: '0 0 64 64',
    paths: [
      {
        d: 'M8 16 L20 8 L26 14 C26 14 28 18 32 18 C36 18 38 14 38 14 L44 8 L56 16 L50 28 L44 24 L44 56 L20 56 L20 24 L14 28 Z',
        fill: 'currentColor',
      },
    ],
  },
  // Button shirt / shirt
  shirt: {
    viewBox: '0 0 64 64',
    paths: [
      {
        d: 'M10 14 L22 8 L28 16 C28 16 30 20 32 20 C34 20 36 16 36 16 L42 8 L54 14 L48 30 L42 26 L42 58 L22 58 L22 26 L16 30 Z',
        fill: 'currentColor',
      },
      { d: 'M30 22 L34 22 L34 50 L30 50 Z', fill: 'white', strokeWidth: 0 },
    ],
  },
  // Pants / jeans / trousers
  pants: {
    viewBox: '0 0 64 64',
    paths: [
      {
        d: 'M14 8 L50 8 L50 18 L40 18 L38 56 L26 56 L24 18 L14 18 Z',
        fill: 'currentColor',
      },
    ],
  },
  jeans: {
    viewBox: '0 0 64 64',
    paths: [
      {
        d: 'M14 8 L50 8 L50 18 L40 18 L38 56 L26 56 L24 18 L14 18 Z',
        fill: 'currentColor',
      },
    ],
  },
  // Dress
  dress: {
    viewBox: '0 0 64 64',
    paths: [
      {
        d: 'M22 6 L42 6 L46 18 L38 20 L44 58 L20 58 L26 20 L18 18 Z',
        fill: 'currentColor',
      },
    ],
  },
  // Skirt
  skirt: {
    viewBox: '0 0 64 64',
    paths: [
      {
        d: 'M18 8 L46 8 L46 18 L54 58 L10 58 L18 18 Z',
        fill: 'currentColor',
      },
    ],
  },
  // Jacket / blazer / coat / outerwear
  jacket: {
    viewBox: '0 0 64 64',
    paths: [
      {
        d: 'M6 14 L20 8 L26 16 L32 22 L38 16 L44 8 L58 14 L54 32 L46 28 L46 58 L18 58 L18 28 L10 32 Z',
        fill: 'currentColor',
      },
      { d: 'M29 22 L35 22 L35 52 L29 52 Z', fill: 'white', strokeWidth: 0 },
    ],
  },
  coat: {
    viewBox: '0 0 64 64',
    paths: [
      {
        d: 'M6 14 L20 8 L26 16 L32 22 L38 16 L44 8 L58 14 L54 32 L46 28 L46 60 L18 60 L18 28 L10 32 Z',
        fill: 'currentColor',
      },
    ],
  },
  // Shoes / sneakers / boots
  shoes: {
    viewBox: '0 0 64 64',
    paths: [
      {
        d: 'M8 38 L26 24 L44 28 L56 38 L56 50 L8 50 Z',
        fill: 'currentColor',
      },
      { d: 'M8 44 L56 44', stroke: 'white', strokeWidth: 2, fill: 'none' },
    ],
  },
  sneakers: {
    viewBox: '0 0 64 64',
    paths: [
      {
        d: 'M8 38 L26 24 L44 28 L56 38 L56 50 L8 50 Z',
        fill: 'currentColor',
      },
      { d: 'M8 44 L56 44', stroke: 'white', strokeWidth: 2, fill: 'none' },
    ],
  },
  boots: {
    viewBox: '0 0 64 64',
    paths: [
      {
        d: 'M20 10 L26 10 L26 38 L44 44 L56 50 L56 58 L8 58 L8 50 Z',
        fill: 'currentColor',
      },
    ],
  },
  // Bag / handbag / purse
  bag: {
    viewBox: '0 0 64 64',
    paths: [
      { d: 'M20 24 C20 18 44 18 44 24', stroke: 'currentColor', strokeWidth: 3, fill: 'none' },
      {
        d: 'M12 24 L52 24 L56 56 L8 56 Z',
        fill: 'currentColor',
      },
      { d: 'M24 38 L40 38', stroke: 'white', strokeWidth: 2, fill: 'none' },
    ],
  },
  // Accessories (belt, hat, scarf, etc.)
  accessory: {
    viewBox: '0 0 64 64',
    paths: [
      {
        d: 'M8 28 C8 20 56 20 56 28 L56 36 C56 44 8 44 8 36 Z',
        fill: 'currentColor',
      },
      { d: 'M28 32 L36 32', stroke: 'white', strokeWidth: 2, fill: 'none' },
    ],
  },
  // Hoodie / sweatshirt
  hoodie: {
    viewBox: '0 0 64 64',
    paths: [
      {
        d: 'M10 16 L20 8 C20 8 24 20 32 20 C40 20 44 8 44 8 L54 16 L50 30 L44 26 L44 58 L20 58 L20 26 L14 30 Z',
        fill: 'currentColor',
      },
    ],
  },
  // Shorts
  shorts: {
    viewBox: '0 0 64 64',
    paths: [
      {
        d: 'M14 8 L50 8 L50 18 L42 18 L40 40 L24 40 L22 18 L14 18 Z',
        fill: 'currentColor',
      },
    ],
  },
  // Suit / formal
  suit: {
    viewBox: '0 0 64 64',
    paths: [
      {
        d: 'M6 14 L20 8 L26 16 L32 22 L38 16 L44 8 L58 14 L54 32 L46 28 L46 58 L18 58 L18 28 L10 32 Z',
        fill: 'currentColor',
      },
      { d: 'M29 22 L35 22 L35 52 L29 52 Z', fill: 'white', strokeWidth: 0 },
      { d: 'M26 16 L32 22 L38 16', stroke: 'white', strokeWidth: 1.5, fill: 'none' },
    ],
  },
};

// Fallback icon – generic wardrobe / hanger shape
const fallbackIcon: IconDef = {
  viewBox: '0 0 64 64',
  paths: [
    { d: 'M32 8 C32 8 36 12 32 16 C28 12 32 8 32 8 Z', fill: 'currentColor' },
    { d: 'M32 16 L8 48 L56 48 Z', fill: 'currentColor' },
    { d: 'M8 48 L8 56 L56 56 L56 48', fill: 'currentColor' },
  ],
};

export function getItemIcon(itemtype: string): IconDef {
  const normalized = itemtype.toLowerCase().replace(/[-\s]+/g, '');

  // Direct match
  if (icons[normalized]) return icons[normalized];

  // Partial match – check if any key is contained in the type string
  const match = Object.keys(icons).find(
    key => normalized.includes(key) || key.includes(normalized)
  );
  if (match) return icons[match];

  // Keyword fallbacks
  if (/shirt|top|blouse|polo/.test(normalized)) return icons.shirt;
  if (/pant|trouser|chino|jean|denim/.test(normalized)) return icons.pants;
  if (/dress|gown|frock/.test(normalized)) return icons.dress;
  if (/skirt/.test(normalized)) return icons.skirt;
  if (/jacket|blazer|bomber|windbreaker/.test(normalized)) return icons.jacket;
  if (/coat|trench|overcoat/.test(normalized)) return icons.coat;
  if (/shoe|sneaker|trainer|sandal|loafer/.test(normalized)) return icons.shoes;
  if (/boot/.test(normalized)) return icons.boots;
  if (/bag|purse|tote|backpack|clutch/.test(normalized)) return icons.bag;
  if (/hoodie|sweatshirt|sweater|pullover/.test(normalized)) return icons.hoodie;
  if (/short/.test(normalized)) return icons.shorts;
  if (/suit|formal|tuxedo/.test(normalized)) return icons.suit;
  if (/scarf|belt|hat|cap|tie|watch|accessory/.test(normalized)) return icons.accessory;

  return fallbackIcon;
}

/**
 * Clothing Item Tagging System Constants
 * Centralized enums and constants for all clothing metadata
 */

// ============= CATEGORIES & SUBCATEGORIES =============
export const CLOTHING_CATEGORIES = {
  TOPS: 'tops',
  BOTTOMS: 'bottoms',
  DRESSES: 'dresses',
  OUTERWEAR: 'outerwear',
  SHOES: 'shoes',
  ACCESSORIES: 'accessories',
  ACTIVEWEAR: 'activewear',
  SLEEPWEAR: 'sleepwear',
  INTIMATES: 'intimates',
} as const;

export type ClothingCategory = (typeof CLOTHING_CATEGORIES)[keyof typeof CLOTHING_CATEGORIES];

export const SUBCATEGORIES: Record<ClothingCategory, string[]> = {
  [CLOTHING_CATEGORIES.TOPS]: [
    'shirt',
    'blouse',
    'tshirt',
    'sweater',
    'cardigan',
    'hoodie',
    'crop-top',
    'tank-top',
    'polo',
    'thermal',
  ],
  [CLOTHING_CATEGORIES.BOTTOMS]: [
    'jeans',
    'pants',
    'chinos',
    'shorts',
    'skirt',
    'leggings',
    'joggers',
    'cargo',
    'dress-pants',
  ],
  [CLOTHING_CATEGORIES.DRESSES]: [
    'casual-dress',
    'cocktail-dress',
    'evening-dress',
    'maxi-dress',
    'mini-dress',
    'shirt-dress',
    'wrap-dress',
  ],
  [CLOTHING_CATEGORIES.OUTERWEAR]: [
    'jacket',
    'coat',
    'blazer',
    'puffer',
    'trench',
    'leather-jacket',
    'denim-jacket',
    'windbreaker',
  ],
  [CLOTHING_CATEGORIES.SHOES]: [
    'sneakers',
    'heels',
    'flats',
    'boots',
    'loafers',
    'sandals',
    'flip-flops',
    'slippers',
    'wedges',
  ],
  [CLOTHING_CATEGORIES.ACCESSORIES]: [
    'scarf',
    'hat',
    'belt',
    'gloves',
    'bag',
    'backpack',
    'watch',
    'jewelry',
    'sunglasses',
  ],
  [CLOTHING_CATEGORIES.ACTIVEWEAR]: [
    'yoga-pants',
    'gym-shirt',
    'sports-bra',
    'running-shoes',
    'workout-shorts',
    'athletic-tights',
  ],
  [CLOTHING_CATEGORIES.SLEEPWEAR]: [
    'pajamas',
    'nightgown',
    'nightshirt',
    'sleep-shorts',
  ],
  [CLOTHING_CATEGORIES.INTIMATES]: [
    'bra',
    'underwear',
    'socks',
    'stockings',
    'shapewear',
  ],
};

// ============= PRIMARY & SECONDARY COLORS =============
export const COLOR_OPTIONS = [
  'white',
  'black',
  'gray',
  'red',
  'pink',
  'magenta',
  'purple',
  'blue',
  'navy',
  'cyan',
  'teal',
  'green',
  'olive',
  'yellow',
  'gold',
  'orange',
  'brown',
  'tan',
  'beige',
  'cream',
] as const;

export type ColorOption = (typeof COLOR_OPTIONS)[number];

// ============= MATERIALS =============
export const MATERIALS = {
  COTTON: 'cotton',
  POLYESTER: 'polyester',
  WOOL: 'wool',
  SILK: 'silk',
  LINEN: 'linen',
  DENIM: 'denim',
  LEATHER: 'leather',
  SUEDE: 'suede',
  NYLON: 'nylon',
  SPANDEX: 'spandex',
  RAYON: 'rayon',
  CASHMERE: 'cashmere',
  BLEND: 'blend',
  KNIT: 'knit',
  MESH: 'mesh',
  FLEECE: 'fleece',
} as const;

export type Material = (typeof MATERIALS)[keyof typeof MATERIALS];

// ============= SEASONS =============
export const SEASONS = {
  SPRING: 'spring',
  SUMMER: 'summer',
  FALL: 'fall',
  WINTER: 'winter',
  ALL_SEASON: 'all-season',
} as const;

export type Season = (typeof SEASONS)[keyof typeof SEASONS];

// ============= STYLES =============
export const STYLES = {
  CASUAL: 'casual',
  FORMAL: 'formal',
  BUSINESS: 'business',
  SPORTY: 'sporty',
  BOHEMIAN: 'bohemian',
  MINIMALIST: 'minimalist',
  VINTAGE: 'vintage',
  TRENDY: 'trendy',
  PREPPY: 'preppy',
  EDGY: 'edgy',
  ROMANTIC: 'romantic',
  ATHLETIC: 'athletic',
  CLASSIC: 'classic',
} as const;

export type Style = (typeof STYLES)[keyof typeof STYLES];

// ============= OCCASIONS =============
export const OCCASIONS = {
  EVERYDAY: 'everyday',
  WORK: 'work',
  BUSINESS_MEETING: 'business-meeting',
  CASUAL_DATE: 'casual-date',
  FORMAL_DATE: 'formal-date',
  PARTY: 'party',
  WEDDING: 'wedding',
  GYM: 'gym',
  OUTDOOR_ACTIVITY: 'outdoor-activity',
  BEACH: 'beach',
  SLEEP: 'sleep',
  LOUNGE: 'lounge',
  TRAVEL: 'travel',
  INTERVIEW: 'interview',
} as const;

export type Occasion = (typeof OCCASIONS)[keyof typeof OCCASIONS];

// ============= WARMTH LEVELS =============
export const WARMTH_LEVELS = {
  VERY_COOL: 'very-cool',
  COOL: 'cool',
  NEUTRAL: 'neutral',
  WARM: 'warm',
  VERY_WARM: 'very-warm',
} as const;

export type WarmthLevel = (typeof WARMTH_LEVELS)[keyof typeof WARMTH_LEVELS];

export const WARMTH_LEVEL_TEMPS: Record<WarmthLevel, string> = {
  [WARMTH_LEVELS.VERY_COOL]: '< 40°F',
  [WARMTH_LEVELS.COOL]: '40-55°F',
  [WARMTH_LEVELS.NEUTRAL]: '55-70°F',
  [WARMTH_LEVELS.WARM]: '70-85°F',
  [WARMTH_LEVELS.VERY_WARM]: '> 85°F',
};

// ============= FIT TYPES =============
export const FIT_TYPES = {
  EXTRA_SLIM: 'extra-slim',
  SLIM: 'slim',
  REGULAR: 'regular',
  RELAXED: 'relaxed',
  OVERSIZED: 'oversized',
  FITTED: 'fitted',
  LOOSE: 'loose',
} as const;

export type FitType = (typeof FIT_TYPES)[keyof typeof FIT_TYPES];

// ============= HELPER FUNCTIONS =============

/**
 * Get subcategories for a given category
 */
export function getSubcategoriesFor(category: ClothingCategory): string[] {
  return SUBCATEGORIES[category] || [];
}

/**
 * Get all categories as array
 */
export function getCategoriesArray(): ClothingCategory[] {
  return Object.values(CLOTHING_CATEGORIES);
}

/**
 * Get all colors as array
 */
export function getColorsArray(): ColorOption[] {
  return COLOR_OPTIONS as unknown as ColorOption[];
}

/**
 * Get all materials as array
 */
export function getMaterialsArray(): Material[] {
  return Object.values(MATERIALS);
}

/**
 * Get all seasons as array
 */
export function getSeasonsArray(): Season[] {
  return Object.values(SEASONS);
}

/**
 * Get all styles as array
 */
export function getStylesArray(): Style[] {
  return Object.values(STYLES);
}

/**
 * Get all occasions as array
 */
export function getOccasionsArray(): Occasion[] {
  return Object.values(OCCASIONS);
}

/**
 * Get all warmth levels as array
 */
export function getWarmthLevelsArray(): WarmthLevel[] {
  return Object.values(WARMTH_LEVELS);
}

/**
 * Get all fit types as array
 */
export function getFitTypesArray(): FitType[] {
  return Object.values(FIT_TYPES);
}

/**
 * Convert camelCase/snake_case to Title Case for display
 */
export function formatTagLabel(tag: string): string {
  return tag
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Group and format categories for UI
 */
export function getCategoryGroups(): Array<{
  category: ClothingCategory;
  label: string;
  subcategories: string[];
}> {
  return getCategoriesArray().map((category) => ({
    category,
    label: formatTagLabel(category),
    subcategories: getSubcategoriesFor(category),
  }));
}

/**
 * AI Validation Schemas
 * 
 * Comprehensive Zod schemas for validating AI responses and image scanning metadata.
 * All AI responses MUST be validated before being used or stored in the database.
 * 
 * These schemas enforce:
 * - Type safety across API boundaries
 * - Normalized enum values (never trust raw AI output)
 * - Confidence scores and quality checks
 * - Fallback handling for invalid responses
 */

import { z } from 'zod';

// ============================================================
// ENUM DEFINITIONS (must match backend in function/index.ts)
// ============================================================

export const clothingCategories = [
  'tops',
  'bottoms',
  'dresses',
  'outerwear',
  'shoes',
  'accessories',
  'activewear',
  'sleepwear',
  'intimates',
] as const;

export const clothingSubcategories = [
  'shirt', 'blouse', 'tshirt', 'sweater', 'cardigan', 'hoodie', 'crop-top', 'tank-top', 'polo', 'thermal',
  'jeans', 'pants', 'chinos', 'shorts', 'skirt', 'leggings', 'joggers', 'cargo', 'dress-pants',
  'casual-dress', 'cocktail-dress', 'evening-dress', 'maxi-dress', 'mini-dress', 'shirt-dress', 'wrap-dress',
  'jacket', 'coat', 'blazer', 'puffer', 'trench', 'leather-jacket', 'denim-jacket', 'windbreaker',
  'sneakers', 'heels', 'flats', 'boots', 'loafers', 'sandals', 'flip-flops', 'slippers', 'wedges',
  'scarf', 'hat', 'belt', 'gloves', 'bag', 'backpack', 'watch', 'jewelry', 'sunglasses',
  'yoga-pants', 'gym-shirt', 'sports-bra', 'running-shoes', 'workout-shorts', 'athletic-tights',
  'pajamas', 'nightgown', 'nightshirt', 'sleep-shorts',
  'bra', 'underwear', 'socks', 'stockings', 'shapewear',
] as const;

export const colours = [
  'white', 'black', 'gray', 'red', 'pink', 'magenta', 'purple', 'blue', 'navy', 'cyan',
  'teal', 'green', 'olive', 'yellow', 'gold', 'orange', 'brown', 'tan', 'beige', 'cream',
] as const;

export const materials = [
  'cotton', 'polyester', 'wool', 'silk', 'linen', 'denim', 'leather', 'suede', 'nylon',
  'spandex', 'rayon', 'cashmere', 'blend', 'knit', 'mesh', 'fleece',
] as const;

export const seasons = ['spring', 'summer', 'fall', 'winter', 'all-season'] as const;

export const styles = [
  'casual', 'formal', 'business', 'sporty', 'bohemian', 'minimalist', 'vintage', 'trendy',
  'preppy', 'edgy', 'romantic', 'athletic', 'classic',
] as const;

export const occasions = [
  'everyday', 'work', 'business-meeting', 'casual-date', 'formal-date', 'party', 'wedding',
  'gym', 'outdoor-activity', 'beach', 'sleep', 'lounge', 'travel', 'interview',
] as const;

export const fits = ['extra-slim', 'slim', 'regular', 'relaxed', 'oversized', 'fitted', 'loose'] as const;

export const warmthLevels = ['very-cool', 'cool', 'neutral', 'warm', 'very-warm'] as const;

// ============================================================
// SCHEMAS FOR REQUEST PAYLOADS
// ============================================================

/**
 * Schema for image upload and analysis request
 * Used by client to validate data before sending to backend
 */
export const scanRequestSchema = z.object({
  imageDataUrl: z.string()
    .startsWith('data:image/')
    .max(12_000_000, 'Image is too large (max 12MB)'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  backgroundRemoval: z.boolean().default(false).optional(),
});

export type ScanRequest = z.infer<typeof scanRequestSchema>;

// ============================================================
// SCHEMAS FOR AI RESPONSES (STRICT VALIDATION)
// ============================================================

/**
 * Core AI clothing metadata schema
 * Validates ALL AI responses before use
 * 
 * WARNING: Never trust raw AI output directly!
 * This schema ensures:
 * - All required fields are present
 * - All enums are normalized (prevents injection)
 * - Numeric ranges are valid
 * - Strings are sanitized
 */
export const aiClothingMetadataSchema = z.object({
  category: z.enum(clothingCategories)
    .describe('Primary clothing category'),
  
  subcategory: z.enum(clothingSubcategories)
    .describe('Specific item type'),
  
  primaryColor: z.enum(colours)
    .describe('Primary/dominant color'),
  
  secondaryColor: z.enum(colours).nullable()
    .describe('Secondary color for multi-colored items'),
  
  material: z.enum(materials)
    .describe('Fabric/material composition'),
  
  season: z.enum(seasons)
    .describe('Best season(s) for wearing'),
  
  style: z.enum(styles)
    .describe('Style aesthetic'),
  
  occasion: z.enum(occasions)
    .describe('Typical wear occasion'),
  
  fit: z.enum(fits)
    .describe('Fit/silhouette type'),
  
  warmthLevel: z.enum(warmthLevels)
    .describe('Thermal insulation level'),
  
  confidenceScore: z.number()
    .min(0)
    .max(1)
    .describe('AI confidence (0-1)'),
  
  generatedTags: z.array(
    z.string()
      .min(1)
      .max(40)
      .transform(tag => tag.toLowerCase().trim())
  )
    .min(1)
    .max(12)
    .describe('Generated tags from AI'),
  
  notes: z.string()
    .max(240)
    .describe('AI observations or notes'),
  
  warnings: z.array(
    z.string().max(120)
  )
    .max(5)
    .describe('Quality warnings (blurry, unclear, etc.)'),
}).strict(); // Reject unknown fields

export type AiClothingMetadata = z.infer<typeof aiClothingMetadataSchema>;

/**
 * Error response from AI endpoint
 */
export const aiErrorResponseSchema = z.object({
  error: z.string(),
  fallback: z.enum(['manual-entry']).optional(),
  retryAfter: z.number().optional(),
}).strict();

export type AiFallbackResponse = z.infer<typeof aiErrorResponseSchema>;

/**
 * Union schema: API can either return metadata or an error response
 */
export const aiResponseSchema = z.union([
  z.object({ data: aiClothingMetadataSchema }).strict(),
  aiErrorResponseSchema,
]);

export type AiResponse = z.infer<typeof aiResponseSchema>;

// ============================================================
// SCHEMAS FOR IMAGE PROCESSING
// ============================================================

/**
 * Validated image metadata after client-side optimization
 */
export const optimizedImageSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  format: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  sizeBytes: z.number().int().positive(),
  backgroundRemovalApplied: z.boolean(),
});

export type OptimizedImage = z.infer<typeof optimizedImageSchema>;

// ============================================================
// RUNTIME VALIDATION HELPERS
// ============================================================

/**
 * Safely parse AI response with detailed error reporting
 * 
 * @param data Raw response data from AI API
 * @returns Validated metadata or fallback response
 * @throws ValidationError with detailed info if critical validation fails
 */
export function validateAiResponse(data: unknown): AiClothingMetadata | AiFallbackResponse {
  try {
    // First try to parse as metadata
    if (typeof data === 'object' && data !== null && 'category' in data) {
      return aiClothingMetadataSchema.parse(data);
    }

    // Fall back to error response schema
    const errorResponse = aiErrorResponseSchema.safeParse(data);
    if (errorResponse.success) {
      return errorResponse.data;
    }

    // If neither works, throw detailed error
    throw new Error(
      `Invalid AI response structure. Expected metadata or error response. Received: ${JSON.stringify(data).substring(0, 200)}`
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      throw new Error(`AI response validation failed: ${fieldErrors}`);
    }
    throw error;
  }
}

/**
 * Check if AI response is a valid metadata object (not an error)
 */
export function isValidMetadata(response: AiClothingMetadata | AiFallbackResponse): response is AiClothingMetadata {
  return 'category' in response && 'subcategory' in response;
}

/**
 * Safely extract category from AI response with fallback
 */
export function extractCategory(metadata: AiClothingMetadata): string {
  return metadata.category || 'unknown';
}

/**
 * Sanitize and normalize user-provided custom tags
 */
export function sanitizeTags(tags: string[]): string[] {
  return tags
    .map(tag => tag.toLowerCase().trim().replace(/[^a-z0-9\-\s]/g, ''))
    .filter(tag => tag.length > 0 && tag.length <= 40)
    .slice(0, 12);
}

/**
 * Validate confidence score and determine if result should be auto-accepted
 * 
 * @param score Confidence score 0-1
 * @returns true if score is high enough for auto-acceptance
 */
export function isHighConfidence(score: number): boolean {
  const MIN_AUTO_ACCEPT_CONFIDENCE = 0.85;
  return score >= MIN_AUTO_ACCEPT_CONFIDENCE;
}

/**
 * Determine quality warnings for UI display
 */
export function determineQualityIssues(metadata: AiClothingMetadata): string[] {
  const issues: string[] = [];

  if (metadata.confidenceScore < 0.6) {
    issues.push('Low confidence - please review carefully');
  } else if (metadata.confidenceScore < 0.75) {
    issues.push('Moderate confidence - verify the details');
  }

  if (metadata.warnings && metadata.warnings.length > 0) {
    issues.push(...metadata.warnings);
  }

  return issues;
}

/**
 * Type guard: check if value is a valid category
 */
export function isValidCategory(value: unknown): value is typeof clothingCategories[number] {
  return clothingCategories.includes(value as any);
}

/**
 * Type guard: check if value is a valid subcategory
 */
export function isValidSubcategory(value: unknown): value is typeof clothingSubcategories[number] {
  return clothingSubcategories.includes(value as any);
}

/**
 * Type guard: check if value is a valid colour
 */
export function isValidColour(value: unknown): value is typeof colours[number] {
  return colours.includes(value as any);
}

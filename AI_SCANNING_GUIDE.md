# AI-Powered Clothing Scanning Implementation Guide

## Overview

HeyCloset now includes a complete AI-powered clothing scanning system that leverages OpenAI's Vision API to automatically extract structured metadata from clothing photos. This guide covers:

- System architecture and data flow
- How to use the AI scanning feature
- Configuration and deployment
- API integration details
- Error handling and recovery
- Security and validation

## Table of Contents

1. [Architecture](#architecture)
2. [Components Overview](#components-overview)
3. [Data Flow](#data-flow)
4. [Usage Guide](#usage-guide)
5. [Configuration](#configuration)
6. [API Integration](#api-integration)
7. [Error Handling](#error-handling)
8. [Validation & Security](#validation--security)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                  FRONTEND (React/TypeScript)             │
│                                                           │
│  ItemModal.tsx              AiReviewModal.tsx            │
│      ↓                           ↓                        │
│  ┌──────────────────────────────────────┐              │
│  │  aiClothingScan.ts (Service)        │              │
│  │  - Image optimization               │              │
│  │  - Rate limiting                    │              │
│  │  - Retry logic                      │              │
│  │  - Progress tracking                │              │
│  └──────────────────────────────────────┘              │
│                    ↓                                     │
│  ┌──────────────────────────────────────┐              │
│  │  api.ts (HTTP Client)               │              │
│  │  → /ai/scan endpoint                │              │
│  └──────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
                     ↓ (HTTP)
┌─────────────────────────────────────────────────────────┐
│           EDGE FUNCTION (Deno/Supabase)                 │
│                                                           │
│  ┌──────────────────────────────────────┐              │
│  │  function/index.ts                   │              │
│  │  - Route: POST /storage/ai/scan      │              │
│  │  - Rate limiting (per IP)            │              │
│  │  - Request validation                │              │
│  └──────────────────────────────────────┘              │
│                    ↓                                     │
│  ┌──────────────────────────────────────┐              │
│  │  OpenAI Vision API                   │              │
│  │  - Image analysis                    │              │
│  │  - Structured output (JSON schema)   │              │
│  │  - Confidence scoring                │              │
│  └──────────────────────────────────────┘              │
│                    ↓                                     │
│  ┌──────────────────────────────────────┐              │
│  │  Response validation (Zod)           │              │
│  │  - Type checking                     │              │
│  │  - Enum normalization                │              │
│  │  - Range validation                  │              │
│  └──────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
                     ↓ (HTTP)
                   FRONTEND
                     ↓
         ┌──────────────────────┐
         │  USER REVIEW & EDIT  │
         │  AiReviewModal.tsx   │
         └──────────────────────┘
                     ↓
         ┌──────────────────────┐
         │  SAVE TO DATABASE    │
         │  itemphoto table     │
         │  itemtag table       │
         │  customtag table     │
         └──────────────────────┘
```

### Technology Stack

- **Frontend**: React 19, TypeScript, Zod (validation)
- **Backend**: Supabase Edge Functions (Deno)
- **AI Service**: OpenAI Vision API (`gpt-4o-mini`)
- **Storage**: Supabase Storage (images) + PostgreSQL (metadata)
- **Validation**: Zod schemas (client + server)

---

## Components Overview

### 1. `src/services/aiClothingScan.ts`

Core service handling image processing and AI analysis.

**Key Functions:**

```typescript
// Image optimization (resize, compress, background removal)
optimizeClothingImage(file: File, backgroundRemoval: boolean)
  → OptimizedClothingImage

// Main analysis with retry logic and progress tracking
analyzeClothingImageWithRetry(
  image: OptimizedClothingImage,
  backgroundRemoval: boolean,
  onProgress?: (progress: ScanProgress) => void
) → Promise<ScanResult>

// Rate limit helpers
getRateLimitResetTime() → number (seconds)
```

**Features:**

- ✅ Client-side rate limiting (6 scans per 60 seconds)
- ✅ Automatic retry with exponential backoff (3 attempts, max 10s delay)
- ✅ Image optimization (1600px max dimension, 82% JPEG quality)
- ✅ Optional white background for better AI detection
- ✅ Progress callback for UI updates
- ✅ Comprehensive error reporting

### 2. `src/lib/aiValidation.ts`

Zod schemas for strict validation of all AI inputs/outputs.

**Key Schemas:**

```typescript
// Request validation
scanRequestSchema // image, mime type, background removal

// Response validation  
aiClothingMetadataSchema // category, subcategory, colours, material, etc.
aiErrorResponseSchema    // error handling

// Helper functions
validateAiResponse()         // Parse and validate response
isValidMetadata()           // Type guard
determineQualityIssues()    // Warning extraction
```

**Why Validation Matters:**

- ✅ Never trust raw AI output directly
- ✅ Enforce enum values (prevents injection)
- ✅ Type safety across API boundaries
- ✅ Clear error messages for debugging

### 3. `src/components/AiReviewModal.tsx`

User-facing modal for reviewing and editing AI results.

**Features:**

- ✅ Displays confidence score with color coding
- ✅ Shows image preview
- ✅ Editable dropdowns for all metadata fields
- ✅ AI warnings display
- ✅ Retry button for failed scans
- ✅ Reset changes functionality
- ✅ Fully accessible and mobile-responsive

**Usage:**

```tsx
<AiReviewModal
  isOpen={showReview}
  metadata={aiMetadata}
  confidenceScore={0.92}
  previewImageUrl={imageUrl}
  onAccept={applyResults}
  onEdit={updateResults}
  onCancel={dismiss}
  onRetry={retryAnalysis}
/>
```

### 4. `src/components/ItemModal.tsx`

Updated to integrate AI scanning into the item creation flow.

**AI Integration:**

- ✅ "AI Clothing Scan" section with image upload
- ✅ Optional background removal checkbox
- ✅ Real-time progress tracking
- ✅ Auto-fill form fields from AI results
- ✅ Error handling with retry button
- ✅ Displays confidence score and warnings

---

## Data Flow

### Complete Scan-to-Save Workflow

```
1. USER INITIATES SCAN
   └─ Uploads image in ItemModal
   └─ Selects optional background removal
   
2. IMAGE OPTIMIZATION (Client-Side)
   └─ Load image and measure dimensions
   └─ Resize to max 1600px dimension
   └─ Apply white background if selected
   └─ Convert to JPEG (82% quality)
   └─ Generate base64 data URL
   
3. RATE LIMIT CHECK
   └─ Check localStorage for scan count
   └─ Enforce 6 scans per 60 seconds
   └─ Throw error if limit exceeded
   
4. AI ANALYSIS REQUEST (with Retry)
   └─ POST to /ai/scan endpoint
   └─ Include image data URL + config
   
5. EDGE FUNCTION PROCESSING
   ├─ Server-side rate limit check (per IP)
   ├─ Validate request schema (Zod)
   ├─ Call OpenAI Vision API
   ├─ Parse structured JSON response
   ├─ Validate response with Zod
   └─ Return validated metadata or error
   
6. RESPONSE HANDLING
   ├─ On Success:
   │  └─ Show AiReviewModal
   │  └─ Display results with confidence
   │  └─ Allow edits
   ├─ On Retryable Error:
   │  └─ Show error with Retry button
   │  └─ Auto-retry with exponential backoff
   └─ On Permanent Error:
      └─ Show fallback to manual entry
      
7. USER REVIEW & EDIT
   └─ Review AI results in modal
   └─ Edit any fields as needed
   └─ View confidence score & warnings
   
8. SAVE TO DATABASE
   ├─ Create item record
   ├─ Create colour record
   ├─ Create material record
   ├─ Create style record
   ├─ Create info (junction) record
   ├─ Upload original + optimized images
   ├─ Create itemphoto record
   ├─ Create AI-generated tags
   └─ Create custom tags
```

---

## Usage Guide

### For Users

**Basic Workflow:**

1. Click "Add New Item" button
2. In the "AI Clothing Scan" section, click "Upload"
3. Select a clear photo of the clothing item
4. Review AI suggestions in the modal
5. Edit any fields if needed
6. Click "Apply" to accept changes
7. Fill in remaining manual fields (location, etc.)
8. Click "Add Item" to save

**Tips:**

- Use clear, well-lit photos of the clothing item
- Frame the item alone against a plain background if possible
- Enable "Optimize with a clean background" for better results
- Always review the AI results before accepting
- The confidence score indicates reliability (85%+ is "high")

### For Developers

**Using the AI Service Directly:**

```typescript
import {
  optimizeClothingImage,
  analyzeClothingImageWithRetry,
  getRateLimitResetTime,
} from '../services/aiClothingScan';
import { validateAiResponse, isValidMetadata } from '../lib/aiValidation';

// Optimize image
const optimized = await optimizeClothingImage(file, true);

// Analyze with progress tracking
const result = await analyzeClothingImageWithRetry(
  optimized,
  true,
  (progress) => {
    console.log(`${progress.status}: ${progress.message}`);
  }
);

if (result.success && result.metadata) {
  // Use validated metadata
  console.log(result.metadata.category);
} else {
  // Handle error
  console.error(result.error);
}
```

**Custom Retry Logic:**

```typescript
import { aiClothingMetadataSchema } from '../lib/aiValidation';

try {
  const response = await api.analyzeClothingImage({
    imageDataUrl: data,
    mimeType: 'image/jpeg',
    backgroundRemoval: false,
  });

  // Validate before use
  const validated = aiClothingMetadataSchema.parse(response);
  // Now safe to use
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Validation failed:', error.errors);
  }
}
```

---

## Configuration

### Environment Variables

**Required (Supabase Edge Function):**

```bash
OPENAI_API_KEY=sk-...                    # OpenAI API key
OPENAI_VISION_MODEL=gpt-4o-mini        # (optional, default: gpt-4o-mini)
SUPABASE_URL=https://...                # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=...           # Service role key
```

**Set in Supabase Console:**

1. Go to `Settings → Functions → Environment Variables`
2. Add `OPENAI_API_KEY`
3. (Optional) Add `OPENAI_VISION_MODEL` to use different model

### Client Configuration

All client-side limits are in `src/services/aiClothingScan.ts`:

```typescript
const MAX_SCAN_SIZE = 1_600;           // Max image dimension (pixels)
const JPEG_QUALITY = 0.82;             // JPEG compression quality
const CLIENT_SCAN_WINDOW_MS = 60_000;  // Rate limit window (ms)
const CLIENT_SCAN_LIMIT = 6;           // Scans per window

// Retry configuration
const RETRY_CONFIG = {
  maxAttempts: 3,              // Max retry attempts
  baseDelayMs: 1_000,          // Initial delay (ms)
  maxDelayMs: 10_000,          // Max delay cap (ms)
  backoffMultiplier: 2,        // Exponential backoff factor
};
```

### Server Configuration

Edge Function settings in `function/index.ts`:

```typescript
const SCAN_WINDOW_MS = 60_000;  // Server rate limit window
const SCAN_LIMIT = 6;           // Scans per window per IP
```

---

## API Integration

### Endpoint: `POST /storage/ai/scan`

**Request:**

```json
{
  "imageDataUrl": "data:image/jpeg;base64,/9j/4AAQ...",
  "mimeType": "image/jpeg",
  "backgroundRemoval": false
}
```

**Success Response (200):**

```json
{
  "data": {
    "category": "tops",
    "subcategory": "shirt",
    "primaryColor": "blue",
    "secondaryColor": null,
    "material": "cotton",
    "season": "all-season",
    "style": "casual",
    "occasion": "everyday",
    "fit": "regular",
    "warmthLevel": "neutral",
    "confidenceScore": 0.92,
    "generatedTags": ["button-up", "collared", "everyday-wear"],
    "notes": "Classic cotton button-up shirt with long sleeves",
    "warnings": []
  }
}
```

**Error Response (with Fallback):**

```json
{
  "error": "AI service is rate limited",
  "fallback": "manual-entry",
  "retryAfter": 60
}
```

**Error Codes:**

| Code | Meaning | Retryable | Action |
|------|---------|-----------|--------|
| 200 | Success | – | Use metadata |
| 400 | Invalid request | No | Fix and retry |
| 401 | Auth failed | No | Check API key |
| 403 | Forbidden | No | Check permissions |
| 404 | Not found | No | Check endpoint |
| 422 | Refusal (content policy) | No | Show fallback |
| 429 | Rate limited | Yes | Wait + retry |
| 500 | Server error | Yes | Retry later |
| 503 | Service unavailable | Yes | Retry later |

---

## Error Handling

### Client-Side Error Scenarios

**1. Rate Limit Exceeded**

```
Error: "Too many AI scans in a short time. Please wait X seconds..."
Action: Disable button, show countdown timer
```

**2. Image Optimization Failed**

```
Error: "Image optimization failed" / "Could not load image"
Action: Show error, let user retry
```

**3. Network Error**

```
Error: "Connection failed" / "Service unreachable"
Action: Auto-retry with exponential backoff
```

**4. AI Service Unavailable**

```
Error: "AI service is rate limited/unavailable"
Action: Show fallback option, offer manual entry
```

**5. Invalid AI Response**

```
Error: "AI response validation failed..."
Action: Retry or allow manual entry
```

### Server-Side Error Handling

```typescript
// All errors include detailed logging
console.error('[AI scan] OpenAI error', status, errorBody);

// Responses always include fallback guidance
{
  error: "Human-readable error message",
  fallback: "manual-entry" | undefined,
  retryAfter: seconds | undefined
}
```

### User Experience

- ✅ Progress messages ("Optimizing image...", "Analyzing...", etc.)
- ✅ Error messages with action guidance
- ✅ Retry buttons for transient failures
- ✅ Fallback to manual entry always available
- ✅ No silent failures

---

## Validation & Security

### Input Validation

**Image File:**
- ✅ Type check: JPEG/PNG/WebP only
- ✅ Size check: < 50MB
- ✅ Data URL check: Must start with `data:image/`

**Request Body:**
- ✅ Schema validation (Zod)
- ✅ Type checking
- ✅ Size limits on base64 strings

### Output Validation

**AI Response:**
- ✅ Schema validation (Zod) before use
- ✅ Enum values only (no arbitrary strings)
- ✅ Numeric ranges (0-1 for confidence)
- ✅ String length limits
- ✅ Array item limits

**Example Validation:**

```typescript
const schema = z.object({
  category: z.enum(clothingCategories),      // Only valid categories
  primaryColor: z.enum(colours),             // Only valid colours
  confidenceScore: z.number().min(0).max(1), // 0-1 range
  generatedTags: z.array(z.string()).max(12) // Max 12 tags
});

// Invalid inputs are rejected
schema.parse({ category: 'invalid' }); // ❌ Throws error
schema.parse({ category: 'tops', ... }); // ✅ Valid
```

### Security Measures

- ✅ API key never exposed in client code
- ✅ All API calls through HTTPS
- ✅ Server-side rate limiting by IP
- ✅ Client-side rate limiting with localStorage
- ✅ Validation on both client and server
- ✅ No sensitive data in localStorage
- ✅ CORS headers properly configured

### Data Privacy

- Images are processed by OpenAI (third-party)
- Processed images are stored in Supabase Storage
- User can delete images anytime
- Metadata is stored in user's database
- No data sharing or training

---

## Testing

### Manual Testing Checklist

- [ ] Upload clear clothing photo
- [ ] Verify AI correctly identifies category
- [ ] Test background removal feature
- [ ] Edit fields in review modal
- [ ] Test retry on failure
- [ ] Verify rate limiting works
- [ ] Test on mobile device
- [ ] Test with poor quality image
- [ ] Test with non-clothing image
- [ ] Verify images are saved

### Test Cases

**Success Path:**
```typescript
// Upload image → Analyze → Review → Save
test('complete AI scan workflow', async () => {
  const file = new File(['...'], 'shirt.jpg', { type: 'image/jpeg' });
  const optimized = await optimizeClothingImage(file, false);
  const result = await analyzeClothingImageWithRetry(optimized, false);
  expect(result.success).toBe(true);
  expect(result.metadata?.category).toBeDefined();
});
```

**Error Handling:**
```typescript
test('retry on transient errors', async () => {
  // Mock API to fail once then succeed
  let attempts = 0;
  api.analyzeClothingImage = jest.fn(async () => {
    if (attempts++ === 0) throw new Error('status 503');
    return validMetadata;
  });
  
  const result = await analyzeClothingImageWithRetry(...);
  expect(result.success).toBe(true);
  expect(attempts).toBe(2);
});
```

**Rate Limiting:**
```typescript
test('enforce rate limit', async () => {
  for (let i = 0; i < 6; i++) {
    await analyzeClothingImageWithRetry(...); // OK
  }
  
  expect(() => analyzeClothingImageWithRetry(...))
    .toThrow('Too many AI scans');
});
```

---

## Troubleshooting

### "OPENAI_API_KEY not set"

**Cause:** Environment variable not configured in Supabase

**Solution:**
1. Go to Supabase Console → Settings → Functions → Environment Variables
2. Add `OPENAI_API_KEY` with your OpenAI API key
3. Redeploy function or wait for auto-sync

### "AI scanning is temporarily rate limited"

**Cause:** OpenAI API rate limit exceeded (too many requests)

**Solution:**
- Wait a minute before trying again
- Check OpenAI account usage limits
- Consider upgrading API plan

### "Image optimization failed"

**Cause:** Browser doesn't support canvas operations or out of memory

**Solution:**
- Use a different browser
- Try with a smaller image
- Check browser console for details

### "AI response validation failed"

**Cause:** AI returned invalid enum values or malformed data

**Solution:**
- Check Edge Function logs for AI response
- Verify AI model is `gpt-4o-mini` or compatible
- Ensure Zod schemas are up-to-date

### "Rate limit exceeded after 1 scan"

**Cause:** localStorage rate bucket persisting across sessions or was manually set

**Solution:**
- Clear localStorage: `localStorage.removeItem('hey-closet-ai-scan-rate')`
- Check for multiple tabs analyzing simultaneously

### "Photos not saving to database"

**Cause:** `uploadPhoto` or `itemphoto` creation failing

**Solution:**
- Check Supabase Storage bucket permissions
- Verify `itemphoto` table exists
- Check Edge Function logs
- Ensure foreign key relationships are valid

---

## Performance Optimization

### Image Optimization

- ✅ Max 1600px dimension (from ~5000px typical)
- ✅ 82% JPEG quality (small file, good quality)
- ✅ Reduces upload time by ~50-70%
- ✅ Faster AI processing

### Rate Limiting

- ✅ Client-side: Prevents accidental spam
- ✅ Server-side: Protects OpenAI quota
- ✅ Combined: Very efficient

### Retry Strategy

- ✅ Exponential backoff: 1s → 2s → 4s (with cap at 10s)
- ✅ Avoids hammering failed service
- ✅ Jitter prevents thundering herd

### Caching

- ✅ Optimized images are base64 in memory
- ✅ Progress state in component state (not localStorage)
- ✅ Rate bucket in localStorage (small, persistent)

---

## Support & Maintenance

For questions or issues:

1. Check this guide's Troubleshooting section
2. Review Edge Function logs in Supabase Console
3. Check browser console for client errors
4. Verify environment configuration
5. Test with different images/browsers

Monitor OpenAI API usage:
- https://platform.openai.com/usage/overview
- Set billing alerts
- Track cost per scan

---

## Version History

**v1.0 - Initial Release (May 31, 2026)**
- ✅ OpenAI Vision API integration
- ✅ Client-side rate limiting & retry logic
- ✅ Comprehensive Zod validation
- ✅ AI Review modal
- ✅ Image optimization
- ✅ Error handling & fallback states
- ✅ Full TypeScript support

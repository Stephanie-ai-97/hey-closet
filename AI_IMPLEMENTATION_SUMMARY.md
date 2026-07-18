# AI Clothing Scan Summary

HeyCloset now supports AI-driven clothing analysis for item creation. Users can upload a photo and the system extracts clothing metadata, then validates and stores it safely.

## What’s included
- Image upload, optimization, and AI analysis
- Supabase Edge Function calling OpenAI Vision
- Strict request and response validation
- Rate limiting, retry logic, and manual fallback
- AI-tagged photos stored in `itemphoto`

## Key files
- `src/services/aiClothingScan.ts` — optimization, retry, progress
- `src/lib/aiValidation.ts` — Zod schemas for AI input/output
- `src/components/AiReviewModal.tsx` — review AI results
- `src/components/ItemModal.tsx` — upload + scan integration
- `function/index.ts` — backend AI scan endpoint

## Behavior
- If an image is provided: optimize, scan, apply AI data
- If no image is provided: skip AI scan and create the item normally
- Only create AI tags when AI metadata exists

## Benefits
- Faster item entry for photographed clothing
- Strong validation prevents invalid AI output
- Manual entry remains available at all times

## Notes
- `itemphoto` stores original and processed image paths
- `ai_status` can be `pending`, `completed`, `failed`, or `skipped`
- Use `api.analyzeClothingImage()` and `api.uploadPhoto()` in the client

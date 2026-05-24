-- ============================================================
-- MIGRATION: Outfit Builder MVP
-- Version: 1.0.0
-- Purpose: Add richer outfit metadata and slot-aware outfit items
-- ============================================================

ALTER TABLE public.outfit
ADD COLUMN IF NOT EXISTS styles TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS seasons TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS occasions TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS favorite BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE public.outfititem
ADD COLUMN IF NOT EXISTS slot VARCHAR(24);

ALTER TABLE public.outfititem
DROP CONSTRAINT IF EXISTS outfititem_slot_check;

ALTER TABLE public.outfititem
ADD CONSTRAINT outfititem_slot_check
CHECK (slot IS NULL OR slot IN ('top', 'bottom', 'shoes', 'outerwear', 'accessories'));

CREATE INDEX IF NOT EXISTS idx_outfit_favorite ON public.outfit(favorite);
CREATE INDEX IF NOT EXISTS idx_outfit_created_at ON public.outfit(created_at);
CREATE INDEX IF NOT EXISTS idx_outfititem_outfit ON public.outfititem(dk_outfitid);
CREATE INDEX IF NOT EXISTS idx_outfititem_slot ON public.outfititem(slot);

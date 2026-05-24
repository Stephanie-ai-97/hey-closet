-- ============================================================
-- MIGRATION: Outfit Builder MVP
-- Version: 1.0.0
-- Purpose: Add richer outfit metadata and slot-aware outfit items
-- ============================================================

-- Some environments predate the Outfit Archive tables. Create the MVP tables
-- first so this migration can run cleanly on both fresh and existing databases.
CREATE TABLE IF NOT EXISTS public.outfit (
    pk_outfitid INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    outfitname VARCHAR(150) NOT NULL,
    occasion VARCHAR(100),
    season VARCHAR(100),
    notes VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.outfititem (
    pk_outfititemid INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dk_outfitid INT NOT NULL,
    dk_itemid INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_outfititem_outfit FOREIGN KEY (dk_outfitid) REFERENCES public.outfit(pk_outfitid) ON DELETE CASCADE,
    CONSTRAINT fk_outfititem_item FOREIGN KEY (dk_itemid) REFERENCES public.item(pk_itemid) ON DELETE CASCADE
);

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

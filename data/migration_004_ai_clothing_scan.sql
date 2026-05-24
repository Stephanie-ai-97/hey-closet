-- ============================================================
-- AI clothing scan metadata
-- Stores original and processed image references plus validated AI tags.
-- ============================================================

ALTER TABLE public.itemphoto
ADD COLUMN IF NOT EXISTS processed_storage_path TEXT,
ADD COLUMN IF NOT EXISTS ai_confidence_score NUMERIC(4, 3),
ADD COLUMN IF NOT EXISTS ai_tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ai_metadata JSONB,
ADD COLUMN IF NOT EXISTS ai_status VARCHAR(20) DEFAULT 'skipped';

ALTER TABLE public.itemphoto
DROP CONSTRAINT IF EXISTS itemphoto_ai_confidence_score_check;

ALTER TABLE public.itemphoto
ADD CONSTRAINT itemphoto_ai_confidence_score_check
CHECK (
  ai_confidence_score IS NULL
  OR (ai_confidence_score >= 0 AND ai_confidence_score <= 1)
);

ALTER TABLE public.itemphoto
DROP CONSTRAINT IF EXISTS itemphoto_ai_status_check;

ALTER TABLE public.itemphoto
ADD CONSTRAINT itemphoto_ai_status_check
CHECK (ai_status IN ('pending', 'completed', 'failed', 'skipped'));

CREATE INDEX IF NOT EXISTS idx_itemphoto_ai_status
ON public.itemphoto(ai_status);

CREATE INDEX IF NOT EXISTS idx_itemphoto_ai_tags
ON public.itemphoto USING gin(ai_tags);

-- ============================================================
-- AI clothing scan metadata
-- Stores original and processed image references plus validated AI tags.
-- ============================================================

-- Create itemphoto table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.itemphoto (
  pk_itemphotoid INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  dk_itemid INT NOT NULL REFERENCES public.item(pk_itemid) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  processed_storage_path TEXT,
  ai_confidence_score NUMERIC(4, 3),
  ai_tags JSONB DEFAULT '[]'::jsonb,
  ai_metadata JSONB,
  ai_status VARCHAR(20) DEFAULT 'skipped',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION public.update_itemphoto_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS itemphoto_updated_at_trigger ON public.itemphoto;

CREATE TRIGGER itemphoto_updated_at_trigger
BEFORE UPDATE ON public.itemphoto
FOR EACH ROW
EXECUTE FUNCTION public.update_itemphoto_updated_at();

-- Add constraints for AI columns
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_itemphoto_ai_status
ON public.itemphoto(ai_status);

CREATE INDEX IF NOT EXISTS idx_itemphoto_ai_tags
ON public.itemphoto USING gin(ai_tags);

CREATE INDEX IF NOT EXISTS idx_itemphoto_dk_itemid
ON public.itemphoto(dk_itemid);

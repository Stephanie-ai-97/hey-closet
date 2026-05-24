-- ============================================================
-- DATA MIGRATION: Populate existing items with tagging data
-- Version: 1.1.0
-- Date: 2024-05-23
-- Purpose: Initialize tag junction data from the normalized schema
-- ============================================================

-- This migration intentionally does not write category, colour, warmth, or fit
-- columns to item. Those values already exist as item.itemtype and through the
-- info -> colour/style/material relationships, and item_with_tags derives
-- frontend-friendly aliases from them.

-- ============================================================
-- 1. ADD ALL-SEASON TAG TO ALL EXISTING ITEMS
-- ============================================================
INSERT INTO public.itemtag (dk_itemid, dk_seasonid, tag_source)
SELECT
    i.pk_itemid,
    s.pk_seasonid,
    'system'
FROM public.item i
JOIN public.season s ON s.season_name = 'all-season'
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. ADD STYLE TAGS FROM EXISTING INFO RELATIONSHIPS
-- ============================================================
INSERT INTO public.itemtag (dk_itemid, dk_styleid, tag_source)
SELECT DISTINCT
    inf.dk_itemid,
    inf.dk_styleid,
    'system'
FROM public.info inf
JOIN public.style st ON st.pk_styleid = inf.dk_styleid
WHERE st.styletype IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. ADD FALLBACK STYLE TAGS FOR ITEMS WITHOUT STYLE METADATA
-- ============================================================
INSERT INTO public.itemtag (dk_itemid, dk_styleid, tag_source)
SELECT
    i.pk_itemid,
    st.pk_styleid,
    'system'
FROM public.item i
CROSS JOIN (
    SELECT MIN(pk_styleid) AS pk_styleid
    FROM public.style
    WHERE styletype = 'casual'
) st
WHERE NOT EXISTS (
    SELECT 1
    FROM public.info inf
    WHERE inf.dk_itemid = i.pk_itemid
      AND inf.dk_styleid IS NOT NULL
)
AND st.pk_styleid IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. ADD EVERYDAY OCCASION TAG TO ALL EXISTING ITEMS
-- ============================================================
INSERT INTO public.itemtag (dk_itemid, dk_occasionid, tag_source)
SELECT
    i.pk_itemid,
    o.pk_occasionid,
    'system'
FROM public.item i
JOIN public.occasion o ON o.occasion_name = 'everyday'
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. CREATE MIGRATION LOG
-- ============================================================
INSERT INTO public.schema_migrations (version) VALUES ('data-migration-populate-tags-v1.1')
ON CONFLICT DO NOTHING;

-- ============================================================
-- END OF DATA MIGRATION
-- ============================================================

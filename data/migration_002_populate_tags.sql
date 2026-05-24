-- ============================================================
-- DATA MIGRATION: Populate existing items with tagging data
-- Version: 1.1.0
-- Date: 2024-05-23
-- Purpose: Map existing items to categories and initialize tags
-- ============================================================

-- ============================================================
-- 1. POPULATE ITEM CATEGORIES BASED ON ITEMTYPE
-- ============================================================
-- This migration maps existing itemtype values to the new category system

-- Function to categorize items based on type
CREATE OR REPLACE FUNCTION get_item_category(itemtype VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    RETURN CASE LOWER(itemtype)
        -- TOPS
        WHEN 'shirt' THEN 'tops'
        WHEN 'blouse' THEN 'tops'
        WHEN 't-shirt' THEN 'tops'
        WHEN 'tshirt' THEN 'tops'
        WHEN 'sweater' THEN 'tops'
        WHEN 'cardigan' THEN 'tops'
        WHEN 'hoodie' THEN 'tops'
        WHEN 'crop-top' THEN 'tops'
        WHEN 'tank-top' THEN 'tops'
        WHEN 'polo' THEN 'tops'
        WHEN 'thermal' THEN 'tops'
        
        -- BOTTOMS
        WHEN 'jeans' THEN 'bottoms'
        WHEN 'pants' THEN 'bottoms'
        WHEN 'chinos' THEN 'bottoms'
        WHEN 'shorts' THEN 'bottoms'
        WHEN 'skirt' THEN 'bottoms'
        WHEN 'leggings' THEN 'bottoms'
        WHEN 'joggers' THEN 'bottoms'
        WHEN 'cargo' THEN 'bottoms'
        
        -- DRESSES
        WHEN 'dress' THEN 'dresses'
        WHEN 'casual-dress' THEN 'dresses'
        WHEN 'cocktail-dress' THEN 'dresses'
        WHEN 'evening-dress' THEN 'dresses'
        WHEN 'maxi-dress' THEN 'dresses'
        WHEN 'mini-dress' THEN 'dresses'
        
        -- OUTERWEAR
        WHEN 'jacket' THEN 'outerwear'
        WHEN 'coat' THEN 'outerwear'
        WHEN 'blazer' THEN 'outerwear'
        WHEN 'puffer' THEN 'outerwear'
        WHEN 'trench' THEN 'outerwear'
        
        -- SHOES
        WHEN 'sneakers' THEN 'shoes'
        WHEN 'heels' THEN 'shoes'
        WHEN 'flats' THEN 'shoes'
        WHEN 'boots' THEN 'shoes'
        WHEN 'sandals' THEN 'shoes'
        
        -- ACCESSORIES
        WHEN 'scarf' THEN 'accessories'
        WHEN 'hat' THEN 'accessories'
        WHEN 'belt' THEN 'accessories'
        WHEN 'bag' THEN 'accessories'
        WHEN 'watch' THEN 'accessories'
        
        -- ACTIVEWEAR
        WHEN 'yoga-pants' THEN 'activewear'
        WHEN 'gym-shirt' THEN 'activewear'
        WHEN 'workout-shorts' THEN 'activewear'
        
        -- SLEEPWEAR
        WHEN 'pajamas' THEN 'sleepwear'
        WHEN 'nightgown' THEN 'sleepwear'
        
        ELSE 'accessories'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update items with categories
UPDATE item
SET category = get_item_category(itemtype),
    subcategory = LOWER(itemtype)
WHERE category IS NULL;

-- ============================================================
-- 2. INITIALIZE DEFAULT STYLES FOR ITEMS
-- ============================================================
-- Add default style tags based on category
INSERT INTO itemtag (dk_itemid, dk_styleid, tag_source)
SELECT DISTINCT
    i.pk_itemid,
    st.pk_styleid,
    'system'
FROM item i
CROSS JOIN style st
WHERE st.style_name IN ('casual', 'classic')
AND NOT EXISTS (
    SELECT 1 FROM itemtag 
    WHERE dk_itemid = i.pk_itemid 
    AND dk_styleid = st.pk_styleid
)
AND i.category IS NOT NULL;

-- ============================================================
-- 3. INITIALIZE DEFAULT SEASONS FOR ITEMS
-- ============================================================
-- Add all-season tag to all items
INSERT INTO itemtag (dk_itemid, dk_seasonid, tag_source)
SELECT DISTINCT
    i.pk_itemid,
    s.pk_seasonid,
    'system'
FROM item i
CROSS JOIN season s
WHERE s.season_name = 'all-season'
AND NOT EXISTS (
    SELECT 1 FROM itemtag 
    WHERE dk_itemid = i.pk_itemid 
    AND dk_seasonid = s.pk_seasonid
)
AND i.category IS NOT NULL;

-- ============================================================
-- 4. MAP EXISTING COLOR DATA
-- ============================================================
-- If you have existing colour records, map them to the new structure
UPDATE item i
SET primary_color = (
    SELECT LOWER(COALESCE(c.colouroverall, c.majorcolour, 'unknown'))
    FROM info inf
    LEFT JOIN colour c ON inf.dk_colourid = c.pk_colourid
    WHERE inf.dk_itemid = i.pk_itemid
    LIMIT 1
)
WHERE primary_color IS NULL
AND EXISTS (
    SELECT 1 FROM info WHERE dk_itemid = i.pk_itemid
);

-- ============================================================
-- 5. SET DEFAULT WARMTH LEVELS BASED ON CATEGORY
-- ============================================================
-- Assign warmth levels based on item type and category
UPDATE item
SET warmth_level = CASE 
    WHEN category IN ('outerwear') THEN 'very-warm'
    WHEN category IN ('activewear') THEN 'warm'
    WHEN category IN ('sleepwear', 'intimates') THEN 'neutral'
    WHEN category IN ('shoes', 'accessories') THEN 'neutral'
    ELSE 'neutral'
END
WHERE warmth_level IS NULL;

-- ============================================================
-- 6. INITIALIZE DEFAULT FIT VALUES
-- ============================================================
-- Set default fit based on category
UPDATE item
SET fit = 'regular'
WHERE fit IS NULL
AND category IS NOT NULL;

-- ============================================================
-- 7. CREATE MIGRATION LOG
-- ============================================================
INSERT INTO schema_migrations (version) VALUES ('data-migration-populate-tags-v1.1')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. CLEANUP
-- ============================================================
-- Drop the temporary function if you want to clean up
-- (optional - keeping it might be useful for future operations)
-- DROP FUNCTION IF EXISTS get_item_category(VARCHAR);

-- ============================================================
-- SUMMARY OF CHANGES
-- ============================================================
-- 1. Categorized existing items based on itemtype
-- 2. Added default 'casual' and 'classic' style tags
-- 3. Added 'all-season' tag to all items
-- 4. Mapped existing colour data to primary_color field
-- 5. Assigned warmth levels based on category
-- 6. Set default fit values
-- 7. Created migration tracking record
-- ============================================================

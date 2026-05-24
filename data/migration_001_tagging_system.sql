-- ============================================================
-- MIGRATION: Add Tagging System to HeyCloset Database
-- Version: 1.0.0
-- Date: 2024-05-23
-- Purpose: Add scalable tag tables without duplicating item metadata
-- ============================================================

-- The base schema already stores dimensional item metadata in normalized tables:
-- - item.itemtype and item.itemsize
-- - colour.colouroverall, colour.majorcolour, colour.minorcolour via info
-- - style.styletype, style.styleyear, style.stylefitsize via info
-- - material.texture, material.softness, material.thickness via info
--
-- Do not add duplicate columns such as item.primary_color, item.secondary_color,
-- item.fit, or style.style_name. The item_with_tags view below exposes
-- frontend-friendly aliases derived from the existing normalized schema.

-- ============================================================
-- 1. CREATE SEASON TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.season (
    pk_seasonid INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    season_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO public.season (season_name) VALUES
('spring'),
('summer'),
('fall'),
('winter'),
('all-season')
ON CONFLICT (season_name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_season_name ON public.season(season_name);

DROP TRIGGER IF EXISTS trg_season_updated ON public.season;
CREATE TRIGGER trg_season_updated BEFORE
UPDATE ON public.season FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. CREATE OCCASION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.occasion (
    pk_occasionid INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    occasion_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO public.occasion (occasion_name) VALUES
('everyday'),
('work'),
('business-meeting'),
('casual-date'),
('formal-date'),
('party'),
('wedding'),
('gym'),
('outdoor-activity'),
('beach'),
('sleep'),
('lounge'),
('travel'),
('interview')
ON CONFLICT (occasion_name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_occasion_name ON public.occasion(occasion_name);

DROP TRIGGER IF EXISTS trg_occasion_updated ON public.occasion;
CREATE TRIGGER trg_occasion_updated BEFORE
UPDATE ON public.occasion FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. SEED STYLE VALUES IN EXISTING STYLE TABLE
-- ============================================================
INSERT INTO public.style (styletype)
SELECT seed.styletype
FROM (VALUES
    ('casual'),
    ('formal'),
    ('business'),
    ('sporty'),
    ('bohemian'),
    ('minimalist'),
    ('vintage'),
    ('trendy'),
    ('preppy'),
    ('edgy'),
    ('romantic'),
    ('athletic'),
    ('classic')
) AS seed(styletype)
WHERE NOT EXISTS (
    SELECT 1
    FROM public.style st
    WHERE st.styletype = seed.styletype
);

CREATE INDEX IF NOT EXISTS idx_style_styletype ON public.style(styletype);
CREATE INDEX IF NOT EXISTS idx_style_stylefitsize ON public.style(stylefitsize);

-- ============================================================
-- 4. CREATE ITEMTAG JUNCTION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.itemtag (
    pk_itemtagid INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dk_itemid INT NOT NULL,
    dk_seasonid INT,
    dk_styleid INT,
    dk_occasionid INT,
    tag_source VARCHAR(20) CHECK (tag_source IN ('system', 'user', 'ai')) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_itemtag_item FOREIGN KEY (dk_itemid) REFERENCES public.item(pk_itemid) ON DELETE CASCADE,
    CONSTRAINT fk_itemtag_season FOREIGN KEY (dk_seasonid) REFERENCES public.season(pk_seasonid) ON DELETE CASCADE,
    CONSTRAINT fk_itemtag_style FOREIGN KEY (dk_styleid) REFERENCES public.style(pk_styleid) ON DELETE CASCADE,
    CONSTRAINT fk_itemtag_occasion FOREIGN KEY (dk_occasionid) REFERENCES public.occasion(pk_occasionid) ON DELETE CASCADE,
    CONSTRAINT chk_itemtag_has_tag CHECK (
        dk_seasonid IS NOT NULL
        OR dk_styleid IS NOT NULL
        OR dk_occasionid IS NOT NULL
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_itemtag_season
ON public.itemtag(dk_itemid, dk_seasonid)
WHERE dk_seasonid IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_itemtag_style
ON public.itemtag(dk_itemid, dk_styleid)
WHERE dk_styleid IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_itemtag_occasion
ON public.itemtag(dk_itemid, dk_occasionid)
WHERE dk_occasionid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_itemtag_item ON public.itemtag(dk_itemid);
CREATE INDEX IF NOT EXISTS idx_itemtag_season ON public.itemtag(dk_seasonid);
CREATE INDEX IF NOT EXISTS idx_itemtag_style ON public.itemtag(dk_styleid);
CREATE INDEX IF NOT EXISTS idx_itemtag_occasion ON public.itemtag(dk_occasionid);
CREATE INDEX IF NOT EXISTS idx_itemtag_source_created ON public.itemtag(tag_source, created_at);

DROP TRIGGER IF EXISTS trg_itemtag_updated ON public.itemtag;
CREATE TRIGGER trg_itemtag_updated BEFORE
UPDATE ON public.itemtag FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. CREATE CUSTOMTAG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customtag (
    pk_customtagid INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dk_itemid INT NOT NULL,
    tag_name VARCHAR(100) NOT NULL,
    tag_category VARCHAR(50) CHECK (tag_category IN ('user_defined', 'ai_generated')) DEFAULT 'user_defined',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_customtag_item FOREIGN KEY (dk_itemid) REFERENCES public.item(pk_itemid) ON DELETE CASCADE,
    CONSTRAINT uq_customtag UNIQUE(dk_itemid, tag_name, tag_category)
);

CREATE INDEX IF NOT EXISTS idx_customtag_item ON public.customtag(dk_itemid);
CREATE INDEX IF NOT EXISTS idx_customtag_name ON public.customtag(tag_name);
CREATE INDEX IF NOT EXISTS idx_customtag_category ON public.customtag(tag_category);

DROP TRIGGER IF EXISTS trg_customtag_updated ON public.customtag;
CREATE TRIGGER trg_customtag_updated BEFORE
UPDATE ON public.customtag FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. CREATE COMPREHENSIVE FILTER VIEW
-- ============================================================
CREATE OR REPLACE VIEW public.item_with_tags AS
SELECT
    i.pk_itemid AS item_id,
    i.dk_closet,
    i.itemtype,
    i.itemsize,
    (CASE LOWER(i.itemtype)
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
        WHEN 'jeans' THEN 'bottoms'
        WHEN 'pants' THEN 'bottoms'
        WHEN 'chinos' THEN 'bottoms'
        WHEN 'shorts' THEN 'bottoms'
        WHEN 'skirt' THEN 'bottoms'
        WHEN 'leggings' THEN 'bottoms'
        WHEN 'joggers' THEN 'bottoms'
        WHEN 'cargo' THEN 'bottoms'
        WHEN 'dress' THEN 'dresses'
        WHEN 'casual-dress' THEN 'dresses'
        WHEN 'cocktail-dress' THEN 'dresses'
        WHEN 'evening-dress' THEN 'dresses'
        WHEN 'maxi-dress' THEN 'dresses'
        WHEN 'mini-dress' THEN 'dresses'
        WHEN 'jacket' THEN 'outerwear'
        WHEN 'coat' THEN 'outerwear'
        WHEN 'blazer' THEN 'outerwear'
        WHEN 'puffer' THEN 'outerwear'
        WHEN 'trench' THEN 'outerwear'
        WHEN 'sneakers' THEN 'shoes'
        WHEN 'heels' THEN 'shoes'
        WHEN 'flats' THEN 'shoes'
        WHEN 'boots' THEN 'shoes'
        WHEN 'sandals' THEN 'shoes'
        WHEN 'scarf' THEN 'accessories'
        WHEN 'hat' THEN 'accessories'
        WHEN 'belt' THEN 'accessories'
        WHEN 'bag' THEN 'accessories'
        WHEN 'watch' THEN 'accessories'
        WHEN 'yoga-pants' THEN 'activewear'
        WHEN 'gym-shirt' THEN 'activewear'
        WHEN 'workout-shorts' THEN 'activewear'
        WHEN 'pajamas' THEN 'sleepwear'
        WHEN 'nightgown' THEN 'sleepwear'
        ELSE 'accessories'
    END)::VARCHAR(100) AS category,
    LOWER(i.itemtype)::VARCHAR(100) AS subcategory,
    LOWER(COALESCE(metadata.colouroverall, metadata.majorcolour))::VARCHAR(100) AS primary_color,
    LOWER(metadata.minorcolour)::VARCHAR(100) AS secondary_color,
    NULL::VARCHAR(100) AS brand,
    LOWER(metadata.thickness)::VARCHAR(50) AS warmth_level,
    LOWER(metadata.stylefitsize)::VARCHAR(50) AS fit,
    i.itemlikerating,
    i.itemcost,
    i.itemcomment,
    i.itemwashmethod,
    i.isoncamera,
    NULL::VARCHAR(20) AS wash_status,
    NULL::BOOLEAN AS in_temp,
    i.created_at,
    i.updated_at,
    COALESCE(
        json_agg(DISTINCT s.season_name) FILTER (WHERE s.season_name IS NOT NULL),
        '[]'::json
    ) AS seasons,
    COALESCE(
        json_agg(DISTINCT st.styletype) FILTER (WHERE st.styletype IS NOT NULL),
        '[]'::json
    ) AS styles,
    COALESCE(
        json_agg(DISTINCT o.occasion_name) FILTER (WHERE o.occasion_name IS NOT NULL),
        '[]'::json
    ) AS occasions,
    COALESCE(
        json_agg(DISTINCT ct.tag_name) FILTER (WHERE ct.tag_name IS NOT NULL),
        '[]'::json
    ) AS custom_tags
FROM public.item i
LEFT JOIN LATERAL (
    SELECT
        c.colouroverall,
        c.majorcolour,
        c.minorcolour,
        st_info.stylefitsize,
        m.thickness
    FROM public.info inf
    LEFT JOIN public.colour c ON inf.dk_colourid = c.pk_colourid
    LEFT JOIN public.style st_info ON inf.dk_styleid = st_info.pk_styleid
    LEFT JOIN public.material m ON inf.dk_material = m.pk_material
    WHERE inf.dk_itemid = i.pk_itemid
    ORDER BY inf.pk_infoid
    LIMIT 1
) metadata ON TRUE
LEFT JOIN public.itemtag it ON i.pk_itemid = it.dk_itemid
LEFT JOIN public.season s ON it.dk_seasonid = s.pk_seasonid
LEFT JOIN public.style st ON it.dk_styleid = st.pk_styleid
LEFT JOIN public.occasion o ON it.dk_occasionid = o.pk_occasionid
LEFT JOIN public.customtag ct ON i.pk_itemid = ct.dk_itemid
GROUP BY
    i.pk_itemid,
    metadata.colouroverall,
    metadata.majorcolour,
    metadata.minorcolour,
    metadata.thickness,
    metadata.stylefitsize;

-- ============================================================
-- 7. CREATE MIGRATION TRACKING TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO public.schema_migrations (version) VALUES ('tagging-system-v1.0')
ON CONFLICT DO NOTHING;

-- ============================================================
-- END OF MIGRATION
-- ============================================================

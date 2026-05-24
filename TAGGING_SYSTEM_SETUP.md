# HeyCloset Tagging System Setup

## Database Model

The tagging migration adds new tag tables only:

- `season`
- `occasion`
- `itemtag`
- `customtag`
- `item_with_tags` view

It does not add `category`, `subcategory`, `primary_color`, `secondary_color`, `warmth_level`, `fit`, or `brand` to the base `item` table. Those values are either stored in the existing normalized schema or derived for read-only filtering:

- Category/subcategory: derived from `item.itemtype`
- Primary/secondary color: `info -> colour.colouroverall`, `majorcolour`, `minorcolour`
- Fit: `info -> style.stylefitsize`
- Style: `info/itemtag -> style.styletype`
- Warmth: currently derived from `info -> material.thickness`

## Run Migrations

```bash
psql -U postgres -d heycloset < data/migration_001_tagging_system.sql
psql -U postgres -d heycloset < data/migration_002_populate_tags.sql
```

Verify:

```sql
SELECT COUNT(*) FROM season;
SELECT COUNT(*) FROM occasion;
SELECT COUNT(*) FROM itemtag;
SELECT COUNT(*) FROM item_with_tags;
```

Rollback:

```bash
psql -U postgres -d heycloset < data/migration_rollback_tagging_system.sql
```

## Frontend Usage

Use the existing generic API service. The API ID normalization already includes:

- `pk_seasonid`
- `pk_occasionid`
- `pk_itemtagid`
- `pk_customtagid`

For creation, save wardrobe metadata to the normalized tables:

1. Create `item` with base fields like `itemtype`, `itemsize`, `itemcost`.
2. Create `colour`, `material`, and `style`.
3. Create the `info` junction row linking those records to the item.
4. Create `itemtag` rows for season/style/occasion tags.
5. Create `customtag` rows for free-form user or AI tags.

For filtering, either use enriched item data from `item_with_tags` or client-side helpers in `src/lib/tagFiltering.ts`. Base `item` records do not contain color or fit fields by themselves.

## Useful Files

- `src/hooks/useTagManagement.ts`: fetches tag metadata and manages `itemtag`/`customtag`.
- `src/lib/tagFiltering.ts`: derives category/subcategory from `itemtype` and filters enriched items.
- `src/components/ItemModalWithTags.tsx`: saves metadata through `colour`, `material`, `style`, and `info`.
- `src/pages/AdvancedSearchExample.tsx`: example filter UI using derived fields.

## Notes

If a page needs color, fit, warmth, or aggregated tags, do not query only `item` and expect those fields to exist. Query the view if your API exposes it, or join/enrich with `info`, `colour`, `material`, `style`, `itemtag`, `season`, `occasion`, and `customtag`.

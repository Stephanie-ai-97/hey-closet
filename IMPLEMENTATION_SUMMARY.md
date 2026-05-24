# Tagging System Implementation Summary

## Database

The tagging migrations now respect the normalized schema from `data/CREATE_TABLE.sql`.

Added:

- `season`
- `occasion`
- `itemtag`
- `customtag`
- `item_with_tags`
- `schema_migrations`

Not added:

- No `item.category`
- No `item.subcategory`
- No `item.primary_color`
- No `item.secondary_color`
- No `item.warmth_level`
- No `item.fit`
- No `style.style_name`

The `item_with_tags` view exposes frontend-friendly aliases by deriving them from existing data:

- `category` and `subcategory` from `item.itemtype`
- `primary_color` and `secondary_color` from `colour`
- `fit` from `style.stylefitsize`
- `warmth_level` from `material.thickness`
- `styles` from `style.styletype`

## Frontend

Updated frontend files align with the normalized model:

- `src/types.ts` marks tag-style item fields as derived/enriched fields.
- `src/hooks/useTagManagement.ts` manages `season`, `style`, `occasion`, `itemtag`, and `customtag`.
- `src/lib/tagFiltering.ts` derives category/subcategory from `itemtype` and filters enriched items.
- `src/components/ItemModalWithTags.tsx` writes color/material/style data through `colour`, `material`, `style`, and `info`.
- `src/pages/AdvancedSearchExample.tsx` uses derived category helpers and normalized tag metadata.

## Migration Behavior

`migration_001_tagging_system.sql` creates tag tables, seeds seasons/occasions/styles, adds indexes/triggers, and creates `item_with_tags`.

`migration_002_populate_tags.sql` initializes `itemtag` rows from existing `info -> style` data and applies default all-season/everyday tags.

`migration_rollback_tagging_system.sql` removes only tagging objects owned by these migrations. It leaves base wardrobe metadata intact.

## Developer Rule

Do not write new metadata fields directly to `item` unless `CREATE_TABLE.sql` is changed intentionally. Use the normalized tables and the `info` junction for wardrobe metadata.

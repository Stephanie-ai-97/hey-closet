# Tagging System Guide

## Purpose
The tagging system adds flexible season, style, occasion, and custom tags without duplicating existing item metadata.

## Core tables
- `season` — predefined season names
- `occasion` — predefined occasion names
- `itemtag` — links items to season/style/occasion
- `customtag` — user or AI generated free-form tags
- `item_with_tags` — view for easy filtering and display

## How it works
- `item` stores base item fields.
- `colour`, `material`, `style`, and `info` store normalized metadata.
- `itemtag` connects items to seasons, styles, and occasions.
- `customtag` stores additional labels like `travel` or `interview-ready`.

## Example
```sql
INSERT INTO public.itemtag (dk_itemid, dk_seasonid, tag_source)
VALUES (42, 1, 'user');

INSERT INTO public.customtag (dk_itemid, tag_name, tag_category)
VALUES (42, 'loungewear', 'user_defined');
```

## Best practice
- Do not duplicate derived values on `item`.
- Use `item_with_tags` for frontend display and filtering.
- Seed `season`, `occasion`, and common `style` values once.

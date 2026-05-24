# HeyCloset Tagging Quick Reference

## What Changed

The tagging system adds tag tables and a read view. It does not widen the `item` table.

```text
item
  -> info
      -> colour
      -> material
      -> style

item
  -> itemtag
      -> season
      -> style
      -> occasion

item
  -> customtag
```

## Migrations

```bash
psql -U postgres -d heycloset < data/migration_001_tagging_system.sql
psql -U postgres -d heycloset < data/migration_002_populate_tags.sql
```

## Add A Tag

```ts
await api.create('itemtag', {
  dk_itemid: itemId,
  dk_seasonid: seasonId,
  tag_source: 'user',
});
```

```ts
await api.create('customtag', {
  dk_itemid: itemId,
  tag_name: 'travel',
  tag_category: 'user_defined',
});
```

## Create An Item With Metadata

```ts
const item = await api.create('item', {
  dk_closet,
  itemtype: subcategory,
  itemsize,
  itemcost,
  itemlikerating,
});

const colour = await api.create('colour', {
  colouroverall,
  majorcolour,
  minorcolour,
});

const material = await api.create('material', {
  texture,
  softness,
  thickness,
});

const style = await api.create('style', {
  styletype,
  styleyear,
  stylefitsize,
});

await api.create('info', {
  dk_itemid: item.id,
  dk_colourid: colour.id,
  dk_material: material.id,
  dk_styleid: style.id,
});
```

## Filter Items

```ts
const filtered = filterItemsByTags(items, {
  categories: ['tops'],
  primaryColors: ['blue'],
});
```

Category and subcategory can be derived from `item.itemtype`. Color, fit, warmth, and tag arrays require enriched data from `item_with_tags` or joins.

## Types

`Item` keeps optional derived fields for enriched payloads:

```ts
category?: string;
subcategory?: string;
primary_color?: string;
secondary_color?: string;
warmth_level?: string;
fit?: string;
```

These fields are not persisted on `item`.

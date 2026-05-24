# HeyCloset Tagging System Guide

## Source Of Truth

HeyCloset already has normalized wardrobe metadata:

- `item`: base clothing item fields
- `colour`: overall, major, and minor colors
- `material`: texture, softness, and thickness
- `style`: style type, year, and fit size
- `info`: junction linking an item to color/material/style

The tagging system adds season, occasion, and custom tagging around that existing model. It does not duplicate color, fit, or category fields onto `item`.

## Tables

### season

- `pk_seasonid`
- `season_name`
- `created_at`
- `updated_at`

### occasion

- `pk_occasionid`
- `occasion_name`
- `created_at`
- `updated_at`

### itemtag

- `pk_itemtagid`
- `dk_itemid`
- `dk_seasonid`
- `dk_styleid`
- `dk_occasionid`
- `tag_source`: `system`, `user`, or `ai`

Each row must point to at least one season, style, or occasion.

### customtag

- `pk_customtagid`
- `dk_itemid`
- `tag_name`
- `tag_category`: `user_defined` or `ai_generated`

## View

`item_with_tags` is a read view for search/filter screens. It exposes aliases such as:

- `category`
- `subcategory`
- `primary_color`
- `secondary_color`
- `warmth_level`
- `fit`
- `seasons`
- `styles`
- `occasions`
- `custom_tags`

Those aliases are derived from normalized tables. They are not base `item` columns.

## API Examples

Fetch metadata:

```ts
const seasons = await api.list('season');
const styles = await api.list('style');
const occasions = await api.list('occasion');
```

Add a season tag:

```ts
await api.create('itemtag', {
  dk_itemid: itemId,
  dk_seasonid: seasonId,
  tag_source: 'user',
});
```

Add a custom tag:

```ts
await api.create('customtag', {
  dk_itemid: itemId,
  tag_name: 'interview-ready',
  tag_category: 'user_defined',
});
```

Create normalized metadata:

```ts
const colour = await api.create('colour', {
  colouroverall: 'blue',
  majorcolour: 'blue',
  minorcolour: 'white',
});

const style = await api.create('style', {
  styletype: 'casual',
  styleyear: new Date().getFullYear(),
  stylefitsize: 'regular',
});

const material = await api.create('material', {
  texture: 'cotton',
  softness: '',
  thickness: 'neutral',
});

await api.create('info', {
  dk_itemid: itemId,
  dk_colourid: colour.id,
  dk_styleid: style.id,
  dk_material: material.id,
});
```

## Frontend Helpers

Use `src/lib/tagFiltering.ts` for derived category/subcategory filtering:

```ts
const filtered = filterItemsByTags(items, {
  categories: ['tops'],
});
```

Use `src/hooks/useTagManagement.ts` for tag CRUD:

```ts
const { seasons, styles, occasions } = useTagMetadata();
const { addTag, addCustomTag } = useItemTags(itemId);
```

## Migration Checklist

- Run `data/migration_001_tagging_system.sql`.
- Run `data/migration_002_populate_tags.sql`.
- Verify `season`, `occasion`, `itemtag`, and `item_with_tags`.
- Do not add writes to non-existent `item` fields in frontend forms.

# Backend Fix Guide: INFO Table Insertion

## Overview
The `POST /item` endpoint in your Supabase Edge Function needs to be updated to:
1. Create records in the correct order (STYLE → COLOUR → MATERIAL → ITEM → INFO → WASH)
2. Use database transactions to ensure atomicity
3. Return meaningful errors if any step fails

## Current Issue
When a new item is created, the STYLE, COLOUR, MATERIAL, and ITEM records are inserted, but the **INFO junction table is never populated**. This violates the NOT NULL foreign key constraints in INFO:
- `dk_ItemID` → references ITEM(pk_ItemID)
- `dk_StyleID` → references STYLE(pk_StyleID)
- `dk_ColourID` → references COLOUR(pk_ColourID)
- `dk_Material` → references MATERIAL(pk_Material)

## Backend Changes Required

### 1. Update the `POST /item` Endpoint

Your Supabase Edge Function for creating items should implement a **single database transaction** with the following steps:

```typescript
// Pseudo-code for the /item POST endpoint
import { createClient } from '@supabase/supabase-js'

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  
  try {
    const itemData = await req.json()
    
    // START TRANSACTION
    const { data, error: transactionError } = await supabase.rpc('create_item_with_metadata', {
      p_dk_closet: itemData.dk_closet,
      p_itemtype: itemData.itemtype,
      p_itemsize: itemData.itemsize,
      p_isoncamera: itemData.isoncamera,
      p_itemlikerating: itemData.itemlikerating,
      p_itemcomment: itemData.itemcomment,
      p_itemwashmethod: itemData.itemwashmethod,
      p_itemcost: itemData.itemcost,
      // Metadata fields
      p_colouroverall: itemData.colouroverall,
      p_texture: itemData.texture,
      p_styletype: itemData.styletype,
      p_styleyear: new Date().getFullYear(),
    })
    
    if (transactionError) {
      console.error('[ITEM CREATE] Transaction failed:', transactionError)
      return new Response(
        JSON.stringify({ error: `Failed to create item: ${transactionError.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    return new Response(JSON.stringify(data), { 
      status: 201, 
      headers: { 'Content-Type': 'application/json' } 
    })
  } catch (error) {
    console.error('[ITEM CREATE] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
```

### 2. Create a Database Function (SQL)

In your Supabase SQL editor, create this PostgreSQL function to handle the transaction:

```sql
-- Create the atomic transaction function
CREATE OR REPLACE FUNCTION create_item_with_metadata(
  p_dk_closet INT,
  p_itemtype VARCHAR,
  p_itemsize VARCHAR,
  p_isoncamera BOOLEAN,
  p_itemlikerating INT,
  p_itemcomment TEXT,
  p_itemwashmethod VARCHAR,
  p_itemcost NUMERIC,
  p_colouroverall VARCHAR,
  p_texture VARCHAR,
  p_styletype VARCHAR,
  p_styleyear INT
)
RETURNS TABLE (
  pk_itemid INT,
  pk_styleid INT,
  pk_colourid INT,
  pk_material INT
) AS $$
DECLARE
  v_style_id INT;
  v_colour_id INT;
  v_material_id INT;
  v_item_id INT;
BEGIN
  -- STEP 1: Insert into STYLE
  INSERT INTO STYLE (styletype, styleyear, stylefitsize, created_at, updated_at)
  VALUES (p_styletype, p_styleyear, p_itemsize, NOW(), NOW())
  RETURNING pk_styleid INTO v_style_id;
  
  -- STEP 2: Insert into COLOUR
  INSERT INTO COLOUR (colouroverall, colourinner, colourouter, created_at, updated_at)
  VALUES (p_colouroverall, '', '', NOW(), NOW())
  RETURNING pk_colourid INTO v_colour_id;
  
  -- STEP 3: Insert into MATERIAL
  INSERT INTO MATERIAL (texture, softness, thickness, created_at, updated_at)
  VALUES (p_texture, '', '', NOW(), NOW())
  RETURNING pk_material INTO v_material_id;
  
  -- STEP 4: Insert into ITEM
  INSERT INTO ITEM (
    dk_closet, itemtype, itemsize, isoncamera, itemlikerating,
    itemcomment, itemwashmethod, itemcost, created_at, updated_at
  )
  VALUES (
    p_dk_closet, p_itemtype, p_itemsize, p_isoncamera, p_itemlikerating,
    p_itemcomment, p_itemwashmethod, p_itemcost, NOW(), NOW()
  )
  RETURNING pk_itemid INTO v_item_id;
  
  -- STEP 5: Insert into INFO junction table (THIS IS THE KEY FIX)
  INSERT INTO INFO (
    dk_itemid, dk_styleid, dk_colourid, dk_material,
    tag_source, created_at, updated_at
  )
  VALUES (
    v_item_id, v_style_id, v_colour_id, v_material_id,
    'user', NOW(), NOW()
  );
  
  -- STEP 6: Insert into WASH with NULL lastwashdate
  INSERT INTO WASH (dk_itemid, lastwashdate, created_at, updated_at)
  VALUES (v_item_id, NULL, NOW(), NOW());
  
  -- Return the created IDs
  RETURN QUERY SELECT v_item_id, v_style_id, v_colour_id, v_material_id;
  
EXCEPTION WHEN OTHERS THEN
  -- If any step fails, the entire transaction is rolled back
  RAISE EXCEPTION 'Failed to create item: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
```

### 3. Enable RPC Permissions

Make sure this function is accessible via Supabase RPC by:
1. Going to Supabase Dashboard → SQL Editor
2. Running the SQL function creation script above
3. Verifying the function is listed in your functions

### 4. Key Points

**Transaction Safety:**
- All INSERT statements are inside a single function
- If ANY step fails (foreign key violation, constraint error, etc.), PostgreSQL automatically rolls back ALL inserts
- This prevents partial data from polluting your database

**Error Handling:**
- The `EXCEPTION WHEN OTHERS` block catches all errors
- Errors are logged server-side with `console.error` in the Edge Function
- The API returns HTTP 500 with a descriptive error message to the frontend

**Frontend Compatibility:**
- The frontend still calls `api.create('item', data)` as before
- The endpoint now handles the complete transaction
- Error messages flow back to the user via the ItemModal's error state

### 5. Testing the Fix

After implementing the backend changes:

1. **Frontend**: The ItemModal now requires Colour, Material, and Style
2. **API Call**: The POST /item endpoint calls the new `create_item_with_metadata` RPC function
3. **Database**: All 6 tables (STYLE, COLOUR, MATERIAL, ITEM, INFO, WASH) are populated atomically
4. **Error Handling**: If anything fails, the transaction rolls back with a clear error message

## Summary of Changes

| Component | Change |
|-----------|--------|
| Frontend (ItemModal.tsx) | ✅ DONE - Made Colour, Material, Style required with validation |
| Backend SQL | ⚠️ NEEDED - Create `create_item_with_metadata` function |
| Backend Edge Function | ⚠️ NEEDED - Call the RPC function instead of individual creates |
| Error Handling | ⚠️ NEEDED - Return meaningful errors on transaction failure |

The frontend is now ready. Once you implement the backend SQL function and update the Edge Function endpoint, the INFO table insertion will work correctly and atomically.

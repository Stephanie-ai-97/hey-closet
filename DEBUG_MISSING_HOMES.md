# 🔍 Debugging Missing Home Data - Diagnostic Guide

## Issue Summary
- ✅ Home row exists in database
- ❌ Not showing on Warehouse page
- ❌ Not showing in Add Storage modal dropdown

## Step-by-Step Diagnosis

### Step 1: Verify Data is Being Fetched

**Open browser DevTools (F12):**

1. Go to **Console** tab
2. Paste this command:
```javascript
// Check if data is being fetched
console.log('Checking home data...');
```

3. Reload the page and look for console logs

**Expected Logs (check for these):**
```javascript
[API] GET /home (should appear in console)
[API Response] GET ... {status: 200, ...}
[API] Response data: [{id: 1, homename: "...", homeaddress: "..."}, ...]
```

**If these logs DON'T appear:**
→ Go to Step 2 (Data fetch isn't happening)

**If these logs DO appear:**
→ Go to Step 3 (Data is fetched but not displaying)

---

### Step 2: Check if API Call is Being Made

**In DevTools, click Network tab:**

1. Reload page
2. Look for requests to `/home` endpoint
3. Click on that request
4. Check **Response** tab

**Expected Response:**
```json
[
  {
    "id": 1,
    "homename": "My House",
    "homeaddress": "123 Main St"
  }
]
```

**If no `/home` request appears:**
→ **Problem:** API call not being made
→ Check console for errors
→ Issue might be in `useDashboardData.ts`

**If request appears but response is empty `[]`:**
→ **Problem:** Backend not returning data
→ Check backend/database connection
→ Verify home data actually exists in database

**If request appears with data:**
→ **Problem:** Data fetched but not displaying
→ Go to Step 3

---

### Step 3: Check if Data is in React State

**In browser Console, paste:**

```javascript
// This will show the React state (requires React DevTools)
// Or manually check in Component tree
```

**Better approach - Add temporary logging:**

Edit `src/hooks/useDashboardData.ts` and add logging:

```typescript
// Around line 19-23, after setHomes:
setHomes(Array.isArray(h) ? h : []);
console.debug('[useDashboardData] Homes fetched:', h);  // ← Add this
console.debug('[useDashboardData] Homes state set to:', Array.isArray(h) ? h : []);

setStorages(Array.isArray(s) ? s : []);
console.debug('[useDashboardData] Storages fetched:', s);

setItems(Array.isArray(i) ? i : []);
console.debug('[useDashboardData] Items fetched:', i);
```

**Reload page and check Console for:**
```javascript
[useDashboardData] Homes fetched: [{id: 1, homename: "...", homeaddress: "..."}]
[useDashboardData] Homes state set to: [{id: 1, homename: "...", homeaddress: "..."}]
```

**If these logs show data:**
→ Problem is in **display/rendering**
→ Go to Step 4

**If these logs show empty array `[]`:**
→ Problem is in **data fetching**
→ Go to Step 5

---

### Step 4: Check if Data is Reaching Components

**Edit `src/pages/Warehouse.tsx` around line 20-25:**

```typescript
export default function Warehouse() {
  const { homes, storages, items, loading, error, refetch } = useDashboardData();
  
  // Add this logging:
  console.debug('[Warehouse] Received homes from hook:', homes);
  console.debug('[Warehouse] Loading state:', loading);
  console.debug('[Warehouse] Error state:', error);
  
  const [selectedHomeId, setSelectedHomeId] = useState<number | null>(null);
  // ... rest of component
```

**Reload and check Console for:**
```javascript
[Warehouse] Received homes from hook: [{id: 1, homename: "...", ...}]
[Warehouse] Loading state: false
[Warehouse] Error state: null
```

**If homes array has data:**
→ **Problem:** Component received data but not rendering it
→ Check if homes are being rendered in the JSX
→ Around line 130-145 should show homes grid

**If homes array is empty:**
→ Go to Step 5 (Fetch issue)

---

### Step 5: Check API Response Structure

**In DevTools Network tab:**
1. Find the `/home` GET request
2. Click on it
3. Go to **Response** tab
4. Check the exact structure

**Expected structure (should be array):**
```json
[
  {
    "id": 1,
    "homename": "My House",
    "homeaddress": "123 Main St"
  }
]
```

**If response is NOT an array but an object:**
```json
{
  "data": [{...}]  // ← Data is nested!
}
```

→ **Problem:** API returns data in different structure
→ Need to update `useDashboardData.ts` to handle this

**If response is null or undefined:**
→ **Problem:** Backend not returning homes
→ Check database connection and query

---

### Step 6: Check for API Errors

**In Console, filter by `[API]`:**
- Look for any red error messages
- Check for status codes like 400, 401, 403, 500

**Common API Errors:**

❌ `[API Error] ... Status 401`
→ Authentication issue - API key might be missing or expired

❌ `[API Error] ... Status 403`
→ Permission issue - check access permissions

❌ `[API Error] ... Status 404`
→ Endpoint not found - check API URL

❌ `[API Error] ... Status 500`
→ Backend error - check backend logs

---

## Quick Diagnostic Checklist

Run these checks in order:

### ✅ Check 1: Network Request
```
DevTools → Network tab → Reload → Look for /home request
Expected: Status 200 with array data
```

### ✅ Check 2: Response Data
```
Click /home request → Response tab → Check data structure
Expected: Array of home objects
```

### ✅ Check 3: Console Logs
```
DevTools → Console tab → Look for [API] logs
Expected: [API] GET /home... and [API Response]
```

### ✅ Check 4: React State
```
Edit useDashboardData.ts to add logging (see Step 3)
Reload and check Console for homes state
Expected: Array with home data
```

### ✅ Check 5: Component Props
```
Edit Warehouse.tsx to add logging (see Step 4)
Reload and check Console
Expected: homes prop has data
```

### ✅ Check 6: UI Rendering
```
Check if home cards appear on page
Expected: Grid of home cards showing
```

---

## Most Common Issues & Solutions

### Issue 1: "Loading... " message stays forever

**Cause:** Data fetch is stuck  
**Solution:**
1. Check Network tab for pending requests
2. Check Console for errors
3. Verify API endpoint is correct
4. Check API key is configured

**Fix:**
```javascript
// In browser console, check if API key exists:
console.log(import.meta.env.VITE_SUPABASE_API_KEY ? '✓ API Key set' : '✗ API Key missing');
```

---

### Issue 2: Empty homes array in React state

**Cause:** API returns data but hook doesn't process it correctly  
**Solution:**
Check `useDashboardData.ts` line 19:
```typescript
setHomes(Array.isArray(h) ? h : []);
```

If API returns nested data like `{data: [...]}`, change to:
```typescript
setHomes(Array.isArray(h) ? h : Array.isArray(h.data) ? h.data : []);
```

---

### Issue 3: Homes fetched but not displaying

**Cause:** Rendering logic issue  
**Solution:**
Check `Warehouse.tsx` around line 130-145:
```tsx
{homes.map(home => (
  <button key={home.id} ...>
    {home.homename} - {home.homeaddress}
  </button>
))}
```

If no cards appear:
1. Check if `homes.length > 0`
2. Add a temporary fallback:
```tsx
{homes.length === 0 ? (
  <div>No homes found</div>
) : (
  homes.map(home => ...)
)}
```

---

### Issue 4: Modal dropdown shows no homes

**Cause:** Props not passed correctly or modal receives empty array  
**Solution:**
Check `Warehouse.tsx` line 391:
```tsx
<StorageModal 
  homes={homes}  // ← Check this
  storages={storages}
  ...
/>
```

In `StorageModal.tsx` line 175, check:
```tsx
{homes.map(home => (
  <option key={home.id} value={home.id}>
    {home.homename} - {home.homeaddress}
  </option>
))}
```

---

## Debug Commands for Console

### Show Current API Configuration
```javascript
console.log({
  baseUrl: 'https://nuqpcxgonlqlxtujxmhx.supabase.co/functions/v1/storage',
  apiKey: import.meta.env.VITE_SUPABASE_API_KEY ? '***SET***' : '***MISSING***'
});
```

### Manually Test Home API
```javascript
const apiKey = prompt('Enter API Key');
fetch('https://nuqpcxgonlqlxtujxmhx.supabase.co/functions/v1/storage/home', {
  headers: {
    'apikey': apiKey,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(d => console.log('Homes:', d))
.catch(e => console.error('Error:', e))
```

### Check React Component State
```javascript
// Install React DevTools extension for best results
// Or check browser's component tree under DevTools → Components
```

---

## Next Steps

1. **Follow the 6-step diagnosis above**
2. **Document which step fails**
3. **Share the console logs and error messages**
4. **Then I can provide specific fix**

---

## If You Find the Issue

Once you identify where it's breaking:

**Issue:** Missing console logs (Step 1)
→ API call not being made
→ Check `useDashboardData.ts` hook

**Issue:** Empty homes array in state (Step 3)
→ API response not structured as expected
→ Need to adjust response parsing

**Issue:** Data in state but not rendering (Step 4)
→ Component rendering logic issue
→ Need to check JSX

**Issue:** API error (Step 6)
→ Backend or authentication issue
→ Check API key and endpoint

---

## Let Me Know

Share:
1. ✅ Which step fails (1-6)
2. ✅ Console logs (copy/paste)
3. ✅ Network response (screenshot)
4. ✅ Expected vs actual behavior

Then I can give you the exact fix!


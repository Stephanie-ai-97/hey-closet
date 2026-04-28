# Add Storage Modal - Quick Troubleshooting Guide

## 🚀 Quick Start Verification (5 minutes)

Open your browser and follow these steps:

### Step 1: Open DevTools
1. Press `F12` to open Developer Tools
2. Go to **Console** tab
3. Filter by typing: `StorageModal` in the search box

### Step 2: Test the Flow
1. Click "Add Storage" button in the app
2. Modal should appear
3. In console, you should see:
   ```
   [StorageModal] Available storage names for home X: [...]
   ```
4. Select a Home from dropdown
5. Select a Closet
6. In console, you should now see:
   ```
   [StorageModal] Available partitions for closet "NAME": [...]
   ```
7. Select a Partition
8. Click "Add Storage" button
9. Watch the Network tab (should see POST request)
10. Verify success message in console

---

## 🔴 Issues & Quick Fixes

### ❌ "Partition dropdown shows too many options"

**Problem:** All home's partitions showing instead of just closet's partitions

**Quick Fix:**
1. Check `src/components/StorageModal.tsx` line 39-47
2. Verify the line has: `s.closet === closetName`
3. Should filter by BOTH homeId AND closetName
4. If not, the memoization dependency is wrong

```typescript
// ✓ CORRECT - has both filters
const filtered = storages.filter(
  s => s.dk_homelocation === selectedHomeId && s.closet === closetName
);

// ✗ WRONG - only has home filter
const filtered = storages.filter(s => s.dk_homelocation === selectedHomeId);
```

---

### ❌ API request not showing in Network tab

**Problem:** Form submission but no request appears in Network tab

**Diagnosis Steps:**
1. Open **Network** tab in DevTools
2. Select **XHR** or **Fetch** filter
3. Try submitting again
4. If still nothing:
   - Check **Console** tab for errors
   - Look for: `Please fill in all required fields`
   - Look for: `Cannot read property...`

**Quick Fix:**
- [ ] Is button disabled? Try clicking it harder (make sure it's not disabled)
- [ ] Are all fields filled? Home + Closet + Partition required
- [ ] Check console for validation errors: `[StorageModal] Validation failed`

---

### ❌ "Adding..." button stuck forever

**Problem:** Button shows "Adding..." and never completes

**Diagnosis Steps:**
1. Open **Network** tab
2. Find the POST request to `/storage`
3. Click on it and check:
   - **Status:** Should be 200 or 201 (not pending/loading)
   - **Response:** Should show the storage object (not empty)
   - **Time:** Should complete within 3-5 seconds

**Quick Fix:**
- [ ] If **Status is pending:** Backend server is not responding. Check backend logs.
- [ ] If **Status is 500:** Backend error. Check server error logs.
- [ ] If **Status is 400:** Invalid request payload. Check JSON body in request matches schema.
- [ ] If **No response:** Timeout - backend is unreachable.

**Manual Test:**
Copy-paste in browser Console:
```javascript
const payload = {
  closet: "Test",
  closetpartition: "Test",
  hasstoragecover: false,
  dk_homelocation: 1
};
console.log('Sending:', payload);
fetch('https://nuqpcxgonlqlxtujxmhx.supabase.co/functions/v1/storage/storage', {
  method: 'POST',
  headers: {
    'apikey': prompt('API Key?'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
})
.then(r => r.json())
.then(d => console.log('Success:', d))
.catch(e => console.error('Error:', e))
```

---

### ❌ Modal doesn't close after successful submission

**Problem:** Storage added but modal stays open

**Diagnosis Steps:**
1. Check **Console** for:
   ```
   [StorageModal] Storage created successfully
   ```
2. If that message appears, check:
   - Did `onStorageAdded()` get called?
   - Did `onClose()` get called?

**Quick Fix:**
Look at `src/components/StorageModal.tsx` around line 127-129:
```typescript
console.debug('[StorageModal] Form reset, calling onStorageAdded callback');
onStorageAdded();  // Should call parent's refetch
onClose();         // Should close modal
```

If console shows the debug message but modal doesn't close:
- [ ] Check parent component's `onClose` callback is correct
- [ ] In `Warehouse.tsx` line 398: `onStorageAdded={() => {...}}`
- [ ] Make sure it's calling `setIsStorageModalOpen(false);`

---

### ❌ New storage doesn't appear in list after adding

**Problem:** Successfully added but list not refreshing

**Diagnosis Steps:**
1. Check **Console**:
   ```
   [StorageModal] Form reset, calling onStorageAdded callback
   ```
   Should see this message
2. Then check `useDashboardData.ts`:
   - Is `refetch()` being called?
   - Are API calls completing?
   - Are arrays being updated?

**Quick Fix:**
In `src/pages/Warehouse.tsx` around line 398, verify:
```typescript
onStorageAdded={() => {
  refetch();                    // ← Call this to refresh data
  setIsStorageModalOpen(false); // ← Close modal
}}
```

If this looks correct, the issue is in `useDashboardData.ts`:
```typescript
// Check that Promise.all is working:
const [h, s, i] = await Promise.all([
  api.list<Home>('home'),
  api.list<Storage>('storage'),  // ← This should return updated list
  api.list<Item>('item'),
]);
setStorages(Array.isArray(s) ? s : []);  // ← Should update state
```

---

### ❌ "Connection failed" error appears

**Problem:** Network error message displays

**Diagnosis:**
1. Check your internet connection
2. Open **Network** tab - should see the request
3. Check the request status:
   - **Status 0:** Network unavailable or CORS blocked
   - **Status 404:** Wrong endpoint
   - **Status 401/403:** API key invalid or expired

**Quick Fix:**
- [ ] Check `.env` file has `VITE_SUPABASE_API_KEY` set
- [ ] Check API endpoint is correct: `https://nuqpcxgonlqlxtujxmhx.supabase.co/functions/v1/storage`
- [ ] Check CORS headers in backend response
- [ ] Try in incognito mode (clear cache/cookies)

---

### ❌ Form validation error shows wrong fields

**Problem:** Error message doesn't match what was actually entered

**Diagnosis:**
1. Check **Console** line:
   ```
   [StorageModal] Validation failed: Please fill in all required fields: X, Y, Z
   ```
2. Compare message with what's actually filled in form

**Quick Fix:**
Logic is in `src/components/StorageModal.tsx` lines 84-90:
```typescript
const missingFields = [
  !homeId ? 'Home' : null,           // ← Check homeId is captured
  !closetName ? 'Closet/Storage Name' : null,
  !partition ? 'Partition' : null,
].filter(Boolean);
```

If validation is wrong:
- [ ] Check `homeId` variable is set correctly
- [ ] Check state updates are working: console.log(selectedHomeId, closetName, partition)
- [ ] Check form fields are actually bound to state with `value={closetName}`

---

### ❌ Rapid clicking causes multiple submissions

**Problem:** Click button multiple times, multiple storages added

**Diagnosis:**
Open **Network** tab and click rapidly:
- Should see **only 1** POST request
- All other clicks should be blocked

**Quick Fix:**
This is handled by:
```typescript
disabled={isLoading || ...}  // ← Button disabled while loading
```

If multiple requests appear anyway:
1. Check line 101: `setIsLoading(true);` at start of submission
2. Check line 130: `setIsLoading(false);` in finally block
3. If either is missing or misplaced, requests can race

---

### ❌ Browser shows "undefined" in form fields

**Problem:** Select dropdown or input shows "undefined"

**Diagnosis:**
1. Check **Console** for errors
2. Look for: `Cannot read property 'map' of undefined`
3. Check state values: console.log({ homes, storages })

**Quick Fix:**
In `useDashboardData.ts` hook:
```typescript
setHomes(Array.isArray(h) ? h : []);      // ← Should default to []
setStorages(Array.isArray(s) ? s : []);   // ← Should default to []
```

If dropdowns still show undefined:
- [ ] Check props passing: `<StorageModal homes={homes} storages={storages} />`
- [ ] Check initial state: `const [homes, setHomes] = useState<Home[]>([]);`
- [ ] May need to add loading state: `{loading ? 'Loading...' : <form>}`

---

## 📊 Checking the Payload

To see exactly what's being sent to the backend:

### Method 1: Browser Console
1. Press F12, go to **Network** tab
2. Click "Add Storage" in app
3. Find POST request
4. Click on request
5. Go to **Request** tab
6. Scroll to **Request Body**
7. Should see:
```json
{
  "closet": "Bedroom Closet",
  "closetpartition": "Top Shelf",
  "hasstoragecover": true,
  "dk_homelocation": 1
}
```

### Method 2: Browser Console Logs
1. Press F12, go to **Console** tab
2. Look for:
```
[API] POST ... {body: {closet: "...", closetpartition: "...", ...}}
```

---

## ✅ Success Signs

You'll know it's working when you see:

### In Console Tab:
```javascript
[StorageModal] Available storage names for home 1: ["Bedroom Closet", "Kitchen"]
[StorageModal] Available partitions for closet "Bedroom Closet": ["Top Shelf", "Bottom"]
[StorageModal] Form submission started {isCreatingNewHome: false, selectedHomeId: 1, ...}
[API] POST ... {body: {...}}
[API Response] POST ... {status: 200, statusText: "OK"}
[API] Response data: {id: 123, closet: "Bedroom Closet", ...}
[StorageModal] Storage created successfully: {id: 123, ...}
[StorageModal] Form reset, calling onStorageAdded callback
```

### In Network Tab:
- [ ] One POST request to `/storage`
- [ ] Status: **200**
- [ ] Response shows: `{id: 123, closet: "...", ...}`
- [ ] Time taken: 1-3 seconds

### In UI:
- [ ] Button shows "Adding..." while processing
- [ ] Modal closes after success
- [ ] New storage appears in list
- [ ] Can add multiple storages without issues

---

## 🔧 Advanced Debugging

### Enable All Logs
In browser console, set debug level:
```javascript
// Increase verbosity
localStorage.debug = '*'
// Then reload page and try adding storage
```

### Check API Configuration
```javascript
// In browser console:
console.log({
  baseUrl: 'https://nuqpcxgonlqlxtujxmhx.supabase.co/functions/v1/storage',
  apiKey: import.meta.env.VITE_SUPABASE_API_KEY ? '✓ Set' : '✗ Missing',
  endpoint: '/storage'
})
```

### Simulate Network Throttling
1. Open DevTools → **Network** tab
2. Click dropdown that says "No throttling"
3. Select "Slow 3G"
4. Try adding storage - should take longer
5. Verify button stays in "Adding..." state
6. Verify modal doesn't close prematurely

### Check CORS Headers
1. Open DevTools → **Network** tab
2. Find POST request to `/storage`
3. Go to **Response Headers** tab
4. Should see:
   ```
   access-control-allow-origin: *
   access-control-allow-methods: POST, GET, PUT, DELETE
   ```

---

## 📚 Related Files

When debugging, check these files:

1. **Main Component:**
   - `src/components/StorageModal.tsx` - Form logic

2. **API Layer:**
   - `src/services/api.ts` - HTTP requests
   - Line 6-60: `request<T>()` function

3. **Parent Component:**
   - `src/pages/Warehouse.tsx` - Modal integration
   - Line 25: `useState(false)` - modal open state
   - Line 391-398: `<StorageModal />` props

4. **Data Hook:**
   - `src/hooks/useDashboardData.ts` - Data fetching
   - Line 32: `refetch()` - refresh function

5. **Types:**
   - `src/types.ts` - TypeScript definitions
   - `Storage` interface should match database schema

---

## 🎯 Most Common Issues (80/20)

**80% of issues come from:**

1. **Partition showing all home partitions** 
   → Check if closet filter is applied

2. **"Adding..." button stuck**
   → Check Network tab for backend errors

3. **New data doesn't appear**
   → Check `refetch()` is called after success

4. **API request not sent**
   → Check form validation isn't blocking it

5. **Modal doesn't close**
   → Check `onClose()` callback is hooked up

---

## 💾 When All Else Fails

1. Clear browser cache: Ctrl+Shift+Delete
2. Hard reload page: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. Close all DevTools
4. Reopen DevTools and try again
5. Check `.env` file is properly loaded
6. Restart dev server: Stop with Ctrl+C, run `npm run dev` again


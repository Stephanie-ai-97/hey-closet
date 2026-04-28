# 📊 Add Storage Modal - Visual Architecture

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. Click "Add Storage" Button                                       │
│     ↓                                                                 │
│  2. Modal Opens                                                      │
│     └─ Shows Home Dropdown (with "Create New" option)                │
│                                                                       │
│  3. User Actions (Choose One)                                        │
│     ├─ Select Existing Home                                          │
│     │  └─ Closet Dropdown appears (filtered by home)                 │
│     │                                                                 │
│     └─ Create New Home                                               │
│        ├─ Enter: Home Name & Address                                 │
│        └─ On Submit: Creates home, continues to closet               │
│                                                                       │
│  4. Select/Create Closet                                             │
│     ├─ Select Existing: Shows partitions for that closet             │
│     │                                                                 │
│     └─ Create New: Enter custom name, shows partition options        │
│                                                                       │
│  5. Select/Create Partition                                          │
│     ├─ Select Existing: Already available in selected closet         │
│     │                                                                 │
│     └─ Create New: Enter custom partition name                       │
│                                                                       │
│  6. Optional: Check "Has Storage Cover"                              │
│                                                                       │
│  7. Click "Add Storage" Button                                       │
│     └─ Button: Becomes "Adding..." and disables                      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                    REACT COMPONENT STATE                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  useState:                                                            │
│  ├─ selectedHomeId: number | null                                    │
│  ├─ closetName: string                                               │
│  ├─ partition: string                                                │
│  ├─ hasStorageCover: boolean                                         │
│  ├─ isLoading: boolean                                               │
│  └─ error: string | null                                             │
│                                                                        │
│  useMemo (Derived Data):                                             │
│  ├─ existingStorageNames                                             │
│  │  └─ Filter: storages where dk_homelocation === selectedHomeId     │
│  │                                                                    │
│  └─ existingPartitions                                               │
│     └─ Filter: storages where BOTH:                                  │
│        ├─ dk_homelocation === selectedHomeId                         │
│        └─ closet === closetName    ← ✅ CRITICAL FIX                 │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│                      FORM SUBMISSION                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  handleSubmit():                                                      │
│                                                                        │
│  Step 1: Parse Form Data                                             │
│    ├─ homeId (from selectedHomeId or create new)                     │
│    ├─ closetName (from input or selection)                           │
│    ├─ partition (from input or selection)                            │
│    └─ hasStorageCover (from checkbox)                                │
│                                                                        │
│  Step 2: Validate Required Fields                                    │
│    ├─ Check homeId ✓                                                 │
│    ├─ Check closetName ✓                                             │
│    ├─ Check partition ✓                                              │
│    └─ If missing → Show error, return                                │
│                                                                        │
│  Step 3: Build API Payload                                           │
│    {                                                                  │
│      closet: "Bedroom Closet",                                       │
│      closetpartition: "Top Shelf",                                   │
│      hasstoragecover: true,                                          │
│      dk_homelocation: 1                                              │
│    }                                                                  │
│                                                                        │
│  Step 4: Set Loading (Button → "Adding...")                          │
│                                                                        │
│  Step 5: Send API Request (await)                                    │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│                       API REQUEST                                     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  POST /storage                                                        │
│  Headers:                                                             │
│  ├─ Content-Type: application/json                                   │
│  └─ apikey: [VITE_SUPABASE_API_KEY]                                  │
│                                                                        │
│  Body:                                                                │
│  {                                                                    │
│    "closet": "Bedroom Closet",                                       │
│    "closetpartition": "Top Shelf",                                   │
│    "hasstoragecover": true,                                          │
│    "dk_homelocation": 1                                              │
│  }                                                                    │
│                                                                        │
│  Console Output:                                                      │
│  [API] POST https://... { body: {...}, headers: {...} }              │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    │                   │
            ✅ SUCCESS            ❌ ERROR
                    │                   │
                    ↓                   ↓
```

## Success Path

```
┌──────────────────────────────────────────────────────────────┐
│                     SUCCESSFUL RESPONSE                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Response Status: 200 OK                                     │
│  Response Body:                                              │
│  {                                                            │
│    "id": 123,                                                │
│    "closet": "Bedroom Closet",                               │
│    "closetpartition": "Top Shelf",                           │
│    "hasstoragecover": true,                                  │
│    "dk_homelocation": 1                                      │
│  }                                                            │
│                                                               │
│  Console: [StorageModal] Storage created successfully: {...} │
│                                                               │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│                      CLEANUP                                 │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Reset Form State                                         │
│     ├─ selectedHomeId = null                                │
│     ├─ closetName = ""                                       │
│     ├─ partition = ""                                        │
│     └─ hasStorageCover = false                               │
│                                                               │
│  2. Clear Error                                              │
│     └─ error = null                                          │
│                                                               │
│  3. Reset Loading                                            │
│     └─ isLoading = false (Button → "Add Storage")            │
│                                                               │
│  Console: [StorageModal] Form reset, calling onStorageAdded  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│                   CALLBACK EXECUTION                         │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Call: onStorageAdded()                                   │
│     └─ Parent (Warehouse.tsx) calls refetch()                │
│        └─ Reloads homes, storages, items from API            │
│           └─ New storage appears in list                     │
│                                                               │
│  2. Call: onClose()                                          │
│     └─ Parent sets isStorageModalOpen = false                │
│        └─ Modal closes                                       │
│                                                               │
└──────────────────────────────────────────────────────────────┘
                           ↓
                    ✅ COMPLETE
                 New storage visible
                 Modal is closed
                 User can add more
```

## Error Path

```
┌──────────────────────────────────────────────────────────────┐
│                      ERROR RESPONSE                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Response Status: 400, 500, or Network Error                 │
│  Error Message: "API Error: 500" or similar                  │
│                                                               │
│  Console: [StorageModal] Failed to add storage: {...}        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Catch Error in try/catch                                 │
│     └─ setError(errorMessage)                                │
│        └─ Displays in red alert box in modal                 │
│                                                               │
│  2. Reset Loading State in finally                           │
│     └─ isLoading = false                                     │
│        └─ Button re-enables showing "Add Storage"            │
│                                                               │
│  3. Modal Stays Open                                         │
│     └─ User can correct form and retry                       │
│                                                               │
│  4. Form Data Preserved                                      │
│     └─ User doesn't have to re-enter everything              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
                           ↓
                    ❌ ERROR SHOWN
                Modal stays open
               Button re-enabled
               User can retry
```

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│              Warehouse.tsx (Parent)                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  State:                                                  │
│  ├─ isStorageModalOpen: boolean                          │
│  └─ ...other warehouse state...                          │
│                                                          │
│  Callbacks:                                              │
│  ├─ onStorageAdded: () => {                              │
│  │    refetch()           ← Refreshes data               │
│  │    setIsStorageModalOpen(false)                       │
│  │  }                                                    │
│  │                                                       │
│  └─ onClose: () => {                                     │
│     setIsStorageModalOpen(false)                         │
│  }                                                       │
│                                                          │
│  Props Passed:                                           │
│  └─ homes: Home[]                                        │
│  └─ storages: Storage[]                                  │
│  └─ onClose: () => void                                  │
│  └─ onStorageAdded: () => void                           │
│                                                          │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Props
                 ↓
┌─────────────────────────────────────────────────────────┐
│         StorageModal.tsx (This Component)               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  State:                                                  │
│  ├─ selectedHomeId: number | null                        │
│  ├─ closetName: string                                   │
│  ├─ partition: string                                    │
│  ├─ hasStorageCover: boolean                             │
│  ├─ isLoading: boolean                                   │
│  └─ error: string | null                                 │
│                                                          │
│  Computed:                                               │
│  ├─ existingStorageNames (useMemo)                       │
│  └─ existingPartitions (useMemo)                         │
│                                                          │
│  Functions:                                              │
│  └─ handleSubmit: () => void (async)                     │
│                                                          │
│  Dependencies:                                           │
│  ├─ api (from services)                                  │
│  └─ React hooks                                          │
│                                                          │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ API Calls
                 ↓
┌─────────────────────────────────────────────────────────┐
│         api.ts (API Service)                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Methods:                                                │
│  ├─ create<T>(table, data)                              │
│  ├─ list<T>(table, query)                               │
│  ├─ get<T>(table, id)                                   │
│  ├─ update<T>(table, id, data)                          │
│  └─ delete(table, id)                                   │
│                                                          │
│  Logging:                                                │
│  ├─ [API] - Request details                             │
│  ├─ [API Response] - Response details                    │
│  └─ [API Error] - Error details                         │
│                                                          │
│  Handles:                                                │
│  ├─ CORS                                                 │
│  ├─ Network errors                                       │
│  └─ API errors                                           │
│                                                          │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ HTTP Fetch
                 ↓
┌─────────────────────────────────────────────────────────┐
│      Supabase Edge Function (Backend)                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Endpoint: POST /storage                                │
│  Base URL:                                              │
│  https://nuqpcxgonlqlxtujxmhx.supabase.co/               │
│  functions/v1/storage                                   │
│                                                          │
│  Accepts:                                                │
│  - closet: string                                        │
│  - closetpartition: string                               │
│  - hasstoragecover: boolean                              │
│  - dk_homelocation: number (FK)                          │
│                                                          │
│  Returns:                                                │
│  - id: number (auto-generated)                           │
│  - All fields above                                      │
│                                                          │
│  Validates:                                              │
│  - Foreign key constraint                               │
│  - Required fields                                       │
│  - Unique constraints                                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## State Transitions

```
INITIALIZATION
    │
    ├─ selectedHomeId: null
    ├─ closetName: ""
    ├─ partition: ""
    ├─ isLoading: false
    └─ error: null
        │
        ↓
USER SELECTS HOME
    │
    ├─ selectedHomeId: 1
    ├─ closetName: "" (cleared)
    ├─ partition: "" (cleared)
    └─ Compute: existingStorageNames from home 1
        │
        ↓
USER SELECTS/ENTERS CLOSET
    │
    ├─ closetName: "Bedroom"
    ├─ partition: "" (cleared)
    └─ Compute: existingPartitions for "Bedroom"
        │
        ↓
USER SELECTS/ENTERS PARTITION
    │
    ├─ partition: "Top Shelf"
    ├─ hasStorageCover: true/false
    └─ Ready to submit
        │
        ↓
USER CLICKS SUBMIT
    │
    ├─ isLoading: true
    ├─ error: null
    └─ Send API request
        │
        ├─────────────────┬──────────────────┐
        │                 │                  │
    ✅ SUCCESS        ❌ ERROR         🔄 LOADING
        │                 │                  │
        ↓                 ↓                  ↓
    isLoading: false  isLoading: false   (waiting)
    error: null       error: "message"
    [Clear Form]      [Keep Form]
    [Close Modal]     [Keep Modal Open]
    [Callback]        [Enable Button]
```

## Validation Flow

```
User Clicks Submit
        ↓
┌──────────────────────────────────────┐
│  Has homeId (selected or created)?   │
├──────────────────────────────────────┤
│  NO  → Show Error → Stop             │
│  YES → Continue                      │
└──────────────────────────────────────┘
        ↓
┌──────────────────────────────────────┐
│  Has closetName (filled)?            │
├──────────────────────────────────────┤
│  NO  → Show Error → Stop             │
│  YES → Continue                      │
└──────────────────────────────────────┘
        ↓
┌──────────────────────────────────────┐
│  Has partition (filled)?             │
├──────────────────────────────────────┤
│  NO  → Show Error → Stop             │
│  YES → Continue                      │
└──────────────────────────────────────┘
        ↓
┌──────────────────────────────────────┐
│  All Required Fields Valid?          │
├──────────────────────────────────────┤
│  YES → Send API Request              │
│        Button: "Adding..."           │
│        Button: disabled              │
└──────────────────────────────────────┘
```

## Logging Points

```
┌─ Module: StorageModal ─────────────────┐
│                                         │
│  [StorageModal] Available storage names │
│  [StorageModal] Available partitions    │
│  [StorageModal] Form submission started │
│  [StorageModal] Creating new home       │
│  [StorageModal] Home created success    │
│  [StorageModal] Validation failed       │
│  [StorageModal] Sending API request     │
│  [StorageModal] Storage created success │
│  [StorageModal] Form reset              │
│  [StorageModal] Failed to add storage   │
│                                         │
└─────────────────────────────────────────┘

┌─ Module: API ──────────────────────────┐
│                                         │
│  [API] POST /storage {...}             │
│  [API Response] Status 200 OK          │
│  [API] Response data: {...}            │
│  [API Error] Status 500 {...}          │
│  [API] Fetch operation failed           │
│                                         │
└─────────────────────────────────────────┘
```

## Testing Points

```
✅ Test 1: Home Selection
   → Dropdown shows homes
   → Can select home
   → Can create new home

✅ Test 2: Closet Filtering
   → Only shows closets for selected home
   → Updates when home changes
   → Can select existing or create new

✅ Test 3: Partition Filtering
   → Only shows partitions for selected closet
   → Does NOT show all home partitions
   → Updates when closet changes

✅ Test 4: Validation
   → Cannot submit without home
   → Cannot submit without closet
   → Cannot submit without partition
   → Shows specific error for each

✅ Test 5: API Request
   → Request appears in Network tab
   → Payload has all fields
   → API key in headers

✅ Test 6: Loading State
   → Button shows "Adding..."
   → Button is disabled
   → Cannot submit twice

✅ Test 7: Success
   → Modal closes
   → Data refreshes
   → Form resets
   → Can add more

✅ Test 8: Error
   → Error displays in modal
   → Modal stays open
   → Button re-enables
   → Can retry
```

---

**This architecture ensures:**
- ✅ Proper data flow
- ✅ Clear error handling
- ✅ Comprehensive logging
- ✅ User feedback
- ✅ Testability


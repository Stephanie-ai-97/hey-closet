# Weather Widget - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Get Your API Key (2 minutes)

1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Click **Sign Up** (free account)
3. Check your email and verify
4. Log in and go to **API Keys** tab
5. Copy the default API key

### Step 2: Configure Environment (1 minute)

Create `.env.local` in the project root:

```env
VITE_OPENWEATHERMAP_API_KEY=paste_your_key_here
```

**For Vercel/Production:**
- Settings → Environment Variables
- Name: `VITE_OPENWEATHERMAP_API_KEY`
- Value: Your API key

### Step 3: Start Dev Server (1 minute)

```bash
npm run dev
```

### Step 4: View Widget (1 minute)

1. Open http://localhost:5173
2. Go to Dashboard
3. Weather widget appears in top-left of the second section
4. Done! ✅

## 🎯 What You Get

- **Current Weather**: Temperature, condition, icon
- **Clothing Tips**: Smart recommendations based on temperature
- **Auto Location**: Uses your GPS (or defaults to Melbourne)
- **Smart Caching**: Data refreshes every 15 minutes
- **Mobile Ready**: Works perfectly on all devices
- **Dark Mode**: Matches your app theme automatically

## 📋 Troubleshooting

### Widget Shows Error

**Problem**: "Unable to load weather"

**Solution**:
1. Check `.env.local` has correct API key
2. Restart dev server: `npm run dev`
3. Clear browser cache
4. Verify API key hasn't been revoked

### Always Shows Melbourne

**Problem**: Widget shows Melbourne coordinates

**Solution**:
1. Check if you allowed geolocation permission
2. Allow permission in browser settings
3. Reload page
4. Widget should update to your location

### Cache Not Working

**Problem**: Weather doesn't cache/updates too slowly

**Solution**:
1. Click refresh button to force update
2. Check browser localStorage is enabled
3. Cache duration is 15 minutes by default
4. Can be adjusted in `src/services/weatherService.ts`

## 📂 What Was Added

```
NEW FILES:
├── src/services/weatherService.ts    (API & caching)
├── src/hooks/useWeather.ts           (React hook)
├── src/components/WeatherWidget.tsx  (UI component)
├── WEATHER_SETUP.md                  (Full setup guide)
├── WEATHER_DEVELOPER_GUIDE.md        (For developers)
└── WEATHER_IMPLEMENTATION.md         (Technical summary)

MODIFIED FILES:
├── src/types.ts                      (Added Weather types)
├── src/pages/Dashboard.tsx           (Added widget)
└── .env.example                      (Added API key)
```

## 🎨 Widget Features

**Temperature Ranges:**
- Below 12°C → 🧥 Heavy outerwear
- 12-18°C → 🧤 Light jacket
- 18-26°C → 👕 Casual wear
- Above 26°C → 👕 Light breathable

**UI Elements:**
- City name
- Current temperature (°C)
- Weather condition (Cloudy, Sunny, etc.)
- OpenWeatherMap icon
- Coordinates
- Refresh button
- Loading skeleton
- Error states

## 🔧 Advanced Configuration

### Change Cache Duration

**File**: `src/services/weatherService.ts`

```typescript
const CACHE_DURATION = 15 * 60 * 1000; // Change 15 to desired minutes
```

### Change Default Location

**File**: `src/services/weatherService.ts`

```typescript
const DEFAULT_COORDINATES = {
  latitude: -33.8688,   // Sydney
  longitude: 151.2093,
};
```

### Modify Temperature Ranges

**File**: `src/services/weatherService.ts`

```typescript
export function getClothingRecommendation(temperature: number): string {
  if (temperature < 10) return 'Your suggestion here';
  // ... etc
}
```

## 🚀 Deployment

### Vercel

1. Add environment variable in Vercel dashboard:
   - `VITE_OPENWEATHERMAP_API_KEY` = your API key

2. Redeploy: Push to main branch

3. Done! Widget works in production

### Other Platforms

Set environment variable:
```bash
VITE_OPENWEATHERMAP_API_KEY=your_key
```

## 📊 How It Works

```
User opens Dashboard
         ↓
useWeather hook runs
         ↓
Service checks cache ← (15 min cache)
         ↓
If cache expired:
  - Get user location (GPS)
  - Fetch weather from API
  - Store in cache
         ↓
Display weather + recommendations
```

## 🔐 Security

✅ API key stored in environment variables (never hardcoded)  
✅ Geolocation data only used for weather  
✅ No personal data collected or stored  
✅ Cache stored locally only  
✅ HTTPS required in production  

## 🆘 Need Help?

**Check These Files:**
- `WEATHER_SETUP.md` — Full setup instructions
- `WEATHER_DEVELOPER_GUIDE.md` — Technical details
- `WEATHER_IMPLEMENTATION.md` — What was built

**Common Issues:**
- Missing API key → Check `.env.local`
- Wrong location → Allow geolocation permission
- Widget not showing → Check browser console for errors
- Cache issues → Clear localStorage and reload

## ✅ Verification Checklist

- [x] `.env.local` has API key
- [x] Dev server running (`npm run dev`)
- [x] Dashboard loads without errors
- [x] Weather widget visible on dashboard
- [x] Temperature displays in Celsius
- [x] Clothing recommendation shows
- [x] Refresh button works
- [x] Mobile view responsive
- [x] Dark mode working

## 🎉 You're All Set!

Your weather widget is now fully integrated. Start the dev server and enjoy personalized weather recommendations based on current conditions!

---

**Next Steps:**
- Customize recommendations in `getClothingRecommendation()`
- Add more locations if desired
- Monitor API usage in OpenWeatherMap dashboard

**Documentation:**
- Full API details → `WEATHER_DEVELOPER_GUIDE.md`
- Setup troubleshooting → `WEATHER_SETUP.md`
- Implementation notes → `WEATHER_IMPLEMENTATION.md`

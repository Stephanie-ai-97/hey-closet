# Weather Widget Summary

HeyCloset includes a weather widget with location-aware current conditions and clothing recommendations.

## What it does
- Retrieves browser geolocation with a 10s timeout.
- Falls back to Melbourne if permission is denied.
- Fetches current weather from OpenWeatherMap.
- Caches results for 15 minutes.
- Displays temperature, condition, icon, and dressing advice.

## Key files
- `src/services/weatherService.ts` — API calls, cache, recommendations
- `src/hooks/useWeather.ts` — hook with loading/error state
- `src/components/WeatherWidget.tsx` — dashboard UI

## Behavior
- Weather refreshes automatically on mount.
- Users can retry with the refresh button.
- Cached data is reused until the TTL expires.

## Setup
1. Set `VITE_OPENWEATHERMAP_API_KEY` in `.env.local`.
2. Run `npm run dev`.
3. Open the dashboard and verify the widget loads.

## Notes
- Error states show a retry CTA.
- The widget is responsive and theme-aware.
- Recommendations are based on Celsius ranges.

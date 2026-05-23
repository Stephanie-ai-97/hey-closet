# Weather Widget Setup Guide

## Overview

The weather widget on the dashboard displays current weather and provides clothing recommendations based on temperature. It uses the OpenWeatherMap API and browser geolocation to determine your location.

## Requirements

- **OpenWeatherMap API Key**: Required to fetch weather data
- **Browser Geolocation**: Optional - if denied, defaults to Melbourne, Australia

## Setup Instructions

### 1. Get an OpenWeatherMap API Key

1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to your API Keys page
4. Copy your default API key

### 2. Configure Environment Variable

Create a `.env.local` file in the project root with your API key:

```env
VITE_OPENWEATHERMAP_API_KEY=your_api_key_here
```

**Alternative**: Add to your hosting platform's environment variables (e.g., Vercel):
- Key: `VITE_OPENWEATHERMAP_API_KEY`
- Value: Your OpenWeatherMap API key

### 3. Verify Setup

1. Start the development server: `npm run dev`
2. Navigate to the Dashboard
3. The weather widget should load and display current weather
4. If you see an error, check:
   - API key is correctly set
   - No spaces around the key
   - Key hasn't been revoked in OpenWeatherMap dashboard

## Features

### Geolocation Handling

- **If allowed**: Uses your precise coordinates
- **If denied**: Falls back to Melbourne, Australia (default)
- **Timeout**: 10-second timeout if geolocation is slow

### Data Caching

- Weather data is cached for **15 minutes**
- Cache is stored in browser's localStorage
- Click the refresh button to fetch fresh data immediately

### Clothing Recommendations

Temperature-based suggestions appear on the widget:

| Temperature | Recommendation |
|-------------|-----------------|
| < 12°C | Heavy outerwear recommended |
| 12-18°C | Light jacket recommended |
| 18-26°C | Comfortable casual wear |
| > 26°C | Light breathable clothing recommended |

## Troubleshooting

### "Unable to load weather" Error

**Cause**: Missing or invalid API key

**Solution**:
1. Verify `VITE_OPENWEATHERMAP_API_KEY` is set
2. Check the API key is correct in OpenWeatherMap dashboard
3. Ensure the free tier limits haven't been exceeded
4. Restart the development server

### "Geolocation not available"

**Cause**: Browser doesn't support geolocation or permission denied

**Solution**:
- Widget defaults to Melbourne, Australia
- Check browser permissions in settings
- Try a different browser if issue persists

### "Cache error" in Console

**Cause**: localStorage is disabled or quota exceeded

**Solution**:
- Enable localStorage in browser settings
- Clear browser cache
- Check available storage space

## API Limits

The free tier of OpenWeatherMap includes:
- **5-day forecast**: 60 calls/minute
- **1.0 API**: 60 calls/minute
- **Geolocation**: Limited by your internet connection

For production use with high traffic, consider upgrading to a paid plan.

## Mobile Considerations

- Weather widget is fully responsive
- Icons and text scale appropriately on smaller screens
- Touch-friendly refresh button
- Geolocation works on mobile browsers with HTTPS

## Code Structure

- **Service**: `src/services/weatherService.ts` - API calls and caching
- **Hook**: `src/hooks/useWeather.ts` - React hook for weather data
- **Component**: `src/components/WeatherWidget.tsx` - UI component
- **Types**: `src/types.ts` - TypeScript interfaces

## Future Enhancements

Potential improvements:
- Multi-location support
- Weather forecast (5-day)
- Air quality index
- UV index
- Pollen count for allergy tracking

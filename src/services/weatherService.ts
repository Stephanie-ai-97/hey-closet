import { Weather, GeolocationCoordinates } from '../types';

const API_KEY = (import.meta as any).env.VITE_OPENWEATHERMAP_API_KEY || (process.env as any).VITE_OPENWEATHERMAP_API_KEY;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

// Cache key
const WEATHER_CACHE_KEY = 'hey_closet_weather_cache';

// Default coordinates for Melbourne, Australia
const DEFAULT_COORDINATES: GeolocationCoordinates = {
  latitude: -37.8136,
  longitude: 144.9631,
};

interface CachedWeather {
  data: Weather;
  timestamp: number;
}

/**
 * Get user's geolocation coordinates
 * Returns default Melbourne coordinates if geolocation is denied or unavailable
 */
export async function getCoordinates(): Promise<GeolocationCoordinates> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('[Weather] Geolocation not available, using default coordinates');
      resolve(DEFAULT_COORDINATES);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('[Weather] Geolocation error:', error.message, 'using default coordinates');
        resolve(DEFAULT_COORDINATES);
      },
      { timeout: 10000 } // 10 second timeout
    );
  });
}

/**
 * Get cached weather data if available and not expired
 */
function getCachedWeather(): Weather | null {
  try {
    const cached = localStorage.getItem(WEATHER_CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp }: CachedWeather = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > CACHE_DURATION;

    if (isExpired) {
      localStorage.removeItem(WEATHER_CACHE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.warn('[Weather] Error reading cache:', error);
    localStorage.removeItem(WEATHER_CACHE_KEY);
    return null;
  }
}

/**
 * Cache weather data with timestamp
 */
function cacheWeather(weather: Weather): void {
  try {
    const cacheData: CachedWeather = {
      data: weather,
      timestamp: Date.now(),
    };
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('[Weather] Error caching weather:', error);
  }
}

/**
 * Fetch weather data from OpenWeatherMap API
 */
async function fetchWeatherFromAPI(
  coordinates: GeolocationCoordinates
): Promise<Weather> {
  if (!API_KEY) {
    throw new Error(
      'OpenWeatherMap API key not configured. Set VITE_OPENWEATHERMAP_API_KEY environment variable.'
    );
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.latitude}&lon=${coordinates.longitude}&units=metric&appid=${API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.statusText}`);
  }

  const data = await response.json();

  const weather: Weather = {
    city: data.name || 'Unknown',
    temperature: Math.round(data.main.temp),
    condition: data.weather[0].main || 'Unknown',
    icon: data.weather[0].icon || '01d',
    lat: data.coord.lat,
    lon: data.coord.lon,
    timestamp: Date.now(),
  };

  return weather;
}

/**
 * Fetch weather data with caching support
 * Returns cached data if available and not expired, otherwise fetches fresh data
 */
export async function fetchWeather(): Promise<Weather> {
  // Check cache first
  const cached = getCachedWeather();
  if (cached) {
    console.debug('[Weather] Using cached weather data');
    return cached;
  }

  try {
    // Get user coordinates
    const coordinates = await getCoordinates();

    // Fetch fresh weather data
    const weather = await fetchWeatherFromAPI(coordinates);

    // Cache the result
    cacheWeather(weather);

    return weather;
  } catch (error) {
    console.error('[Weather] Error fetching weather:', error);
    throw error;
  }
}

/**
 * Get clothing recommendation based on temperature
 */
export function getClothingRecommendation(temperature: number): string {
  if (temperature < 12) {
    return 'Heavy outerwear recommended';
  }
  if (temperature < 18) {
    return 'Light jacket recommended';
  }
  if (temperature <= 26) {
    return 'Comfortable casual wear';
  }
  return 'Light breathable clothing recommended';
}

/**
 * Get weather icon URL from OpenWeatherMap
 */
export function getWeatherIconUrl(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

/**
 * Clear weather cache
 */
export function clearWeatherCache(): void {
  localStorage.removeItem(WEATHER_CACHE_KEY);
}

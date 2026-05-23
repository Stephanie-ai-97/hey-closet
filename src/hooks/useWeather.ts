import { useState, useEffect } from 'react';
import { Weather } from '../types';
import { fetchWeather } from '../services/weatherService';

interface UseWeatherReturn {
  weather: Weather | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching and caching weather data
 * Automatically uses geolocation and falls back to Melbourne if unavailable
 * Data is cached for 15 minutes
 */
export function useWeather(): UseWeatherReturn {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWeather();
      setWeather(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather';
      setError(errorMessage);
      console.error('[useWeather] Error:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

  return {
    weather,
    loading,
    error,
    refetch: fetchWeatherData,
  };
}

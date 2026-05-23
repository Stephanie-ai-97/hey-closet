import { Cloud, CloudRain, Sun, Wind, AlertCircle, RefreshCw } from 'lucide-react';
import { useWeather } from '../hooks/useWeather';
import { getClothingRecommendation, getWeatherIconUrl } from '../services/weatherService';
import { cn } from '../lib/utils';

/**
 * Weather widget component displaying current weather and clothing recommendations
 * Mobile responsive with loading and error states
 */
export function WeatherWidget() {
  const { weather, loading, error, refetch } = useWeather();

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-zinc-900 dark:text-white">Weather</h2>
          <div className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
          <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse w-3/4" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-zinc-900 dark:text-white">Weather</h2>
          <button
            onClick={refetch}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Retry weather fetch"
          >
            <RefreshCw size={16} className="text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Unable to load weather</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">{error || 'Please try again'}</p>
          </div>
        </div>
      </div>
    );
  }

  const recommendation = getClothingRecommendation(weather.temperature);
  const iconUrl = getWeatherIconUrl(weather.icon);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-zinc-900 dark:text-white">Weather</h2>
        <button
          onClick={refetch}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          aria-label="Refresh weather"
        >
          <RefreshCw size={16} className="text-zinc-500 dark:text-zinc-400" />
        </button>
      </div>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">{weather.city}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-zinc-900 dark:text-white">
              {weather.temperature}°C
            </span>
            <span className="text-sm text-zinc-600 dark:text-zinc-300">{weather.condition}</span>
          </div>
        </div>

        <div className="flex-shrink-0">
          <img
            src={iconUrl}
            alt={weather.condition}
            className="w-16 h-16 drop-shadow-sm"
            loading="lazy"
          />
        </div>
      </div>

      {/* Clothing Recommendation */}
      <div className={cn(
        'p-3 rounded-lg flex items-start gap-3',
        getRecommendationStyle(weather.temperature)
      )}>
        <div className={cn(
          'flex-shrink-0 mt-0.5',
          getRecommendationIconColor(weather.temperature)
        )}>
          {getRecommendationIcon(weather.temperature)}
        </div>
        <div>
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Outfit Suggestion</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
            {recommendation}
          </p>
        </div>
      </div>

      {/* Location Info */}
      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-4">
        📍 {weather.lat.toFixed(2)}°N, {Math.abs(weather.lon).toFixed(2)}°E
      </p>
    </div>
  );
}

/**
 * Get background color based on temperature
 */
function getRecommendationStyle(temp: number): string {
  if (temp < 12) {
    return 'bg-blue-50 dark:bg-blue-950';
  }
  if (temp < 18) {
    return 'bg-cyan-50 dark:bg-cyan-950';
  }
  if (temp <= 26) {
    return 'bg-green-50 dark:bg-green-950';
  }
  return 'bg-orange-50 dark:bg-orange-950';
}

/**
 * Get icon color based on temperature
 */
function getRecommendationIconColor(temp: number): string {
  if (temp < 12) {
    return 'text-blue-600 dark:text-blue-400';
  }
  if (temp < 18) {
    return 'text-cyan-600 dark:text-cyan-400';
  }
  if (temp <= 26) {
    return 'text-green-600 dark:text-green-400';
  }
  return 'text-orange-600 dark:text-orange-400';
}

/**
 * Get icon based on temperature
 */
function getRecommendationIcon(temp: number) {
  if (temp < 12) {
    return <Wind size={16} />;
  }
  if (temp < 18) {
    return <Cloud size={16} />;
  }
  if (temp <= 26) {
    return <Sun size={16} />;
  }
  return <Sun size={16} />;
}

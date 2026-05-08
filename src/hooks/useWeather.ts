// ============================================================
// WanderIQ — Weather Hook (OpenMeteo API)
// ============================================================

import { useQuery } from '@tanstack/react-query';
import type { WeatherData } from '@/types';

const WMO_CODE_MAP: Record<number, { label: string; condition: WeatherData['condition'] }> = {
  0:  { label: 'Clear sky', condition: 'sunny' },
  1:  { label: 'Mainly clear', condition: 'sunny' },
  2:  { label: 'Partly cloudy', condition: 'cloudy' },
  3:  { label: 'Overcast', condition: 'cloudy' },
  45: { label: 'Foggy', condition: 'cloudy' },
  48: { label: 'Icy fog', condition: 'cloudy' },
  51: { label: 'Light drizzle', condition: 'rainy' },
  53: { label: 'Drizzle', condition: 'rainy' },
  55: { label: 'Heavy drizzle', condition: 'rainy' },
  61: { label: 'Light rain', condition: 'rainy' },
  63: { label: 'Rain', condition: 'rainy' },
  65: { label: 'Heavy rain', condition: 'rainy' },
  71: { label: 'Light snow', condition: 'cloudy' },
  73: { label: 'Snow', condition: 'cloudy' },
  75: { label: 'Heavy snow', condition: 'cloudy' },
  80: { label: 'Light showers', condition: 'rainy' },
  81: { label: 'Showers', condition: 'rainy' },
  82: { label: 'Heavy showers', condition: 'rainy' },
  95: { label: 'Thunderstorm', condition: 'rainy' },
};

async function fetchWeather(lat: number, lng: number, startDate: string, endDate: string): Promise<WeatherData[]> {
  const params = new URLSearchParams({
    latitude:            String(lat),
    longitude:           String(lng),
    daily:               'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode,windspeed_10m_max',
    start_date:          startDate,
    end_date:            endDate,
    timezone:            'auto',
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenMeteo error: ${res.status}`);
  const data = await res.json();

  const { time, temperature_2m_max, temperature_2m_min, precipitation_probability_max, weathercode, windspeed_10m_max } = data.daily;

  return time.map((date: string, i: number) => {
    const code = weathercode[i] as number;
    const wmo  = WMO_CODE_MAP[code] ?? { label: 'Unknown', condition: 'clear' as const };
    return {
      date,
      tempMax:         Math.round(temperature_2m_max[i]),
      tempMin:         Math.round(temperature_2m_min[i]),
      rainProbability: precipitation_probability_max[i] ?? 0,
      condition:       wmo.condition,
      conditionCode:   code,
      windspeedMax:    Math.round(windspeed_10m_max[i]),
    } satisfies WeatherData;
  });
}

interface UseWeatherOptions {
  lat:       number;
  lng:       number;
  startDate: string;
  endDate:   string;
  enabled?:  boolean;
}

export function useWeather({ lat, lng, startDate, endDate, enabled = true }: UseWeatherOptions) {
  return useQuery({
    queryKey:  ['weather', lat, lng, startDate, endDate],
    queryFn:   () => fetchWeather(lat, lng, startDate, endDate),
    staleTime: 30 * 60 * 1000, // 30 minutes
    enabled:   enabled && Boolean(lat && lng && startDate && endDate),
    retry:     2,
  });
}

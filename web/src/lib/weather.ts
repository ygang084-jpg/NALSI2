import { callEdgeFunction } from '@/lib/supabase'

export type WeatherBundle = {
  temp: number
  feelsLike: number
  humidity: number
  weatherMain: string
  uvi: number
  pop: number
  pm2_5: number
  pm10: number
}

const CACHE_TTL_MS = 10 * 60 * 1000
const cache = new Map<string, { data: WeatherBundle; timestamp: number }>()

function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`
}

export async function fetchWeatherBundle(lat: number, lon: number): Promise<WeatherBundle> {
  const key = cacheKey(lat, lon)
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  const data = await callEdgeFunction<WeatherBundle>('weather', { lat, lon })
  cache.set(key, { data, timestamp: Date.now() })
  return data
}

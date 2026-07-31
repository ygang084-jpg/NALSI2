import { supabase } from '@/lib/supabaseClient'
import type { WeatherBundle } from '@/lib/weather'
import type { ChecklistItem } from '@/lib/ai'

export type HistoryEntry = {
  id: string
  lat: number
  lon: number
  location_label: string | null
  weather: WeatherBundle
  outfit_sentence: string
  checklist: ChecklistItem[]
  image_data_url: string | null
  created_at: string
}

export async function saveHistoryEntry(params: {
  userId: string
  lat: number
  lon: number
  locationLabel?: string | null
  weather: WeatherBundle
  outfitSentence: string
  checklist: ChecklistItem[]
  imageDataUrl: string | null
}): Promise<void> {
  const { error } = await supabase.from('coordi_history').insert({
    user_id: params.userId,
    lat: params.lat,
    lon: params.lon,
    location_label: params.locationLabel ?? null,
    weather: params.weather,
    outfit_sentence: params.outfitSentence,
    checklist: params.checklist,
    image_data_url: params.imageDataUrl,
  })
  if (error) {
    throw new Error(error.message)
  }
}

export async function fetchHistory(userId: string): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from('coordi_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }
  return (data ?? []) as HistoryEntry[]
}

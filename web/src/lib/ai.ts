import type { WeatherBundle } from '@/lib/weather'
import { callEdgeFunction } from '@/lib/supabase'

export type ChecklistItemName = '우산' | '양산' | '마스크'

export type ChecklistItem = {
  item: ChecklistItemName
  needed: boolean
  reason: string
}

export type CoordiRecommendation = {
  outfitSentence: string
  checklist: ChecklistItem[]
}

export async function generateCoordiRecommendation(
  weather: WeatherBundle,
): Promise<CoordiRecommendation> {
  return callEdgeFunction<CoordiRecommendation>('coordi-recommendation', { weather })
}

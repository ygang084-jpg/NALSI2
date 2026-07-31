import { callEdgeFunction } from '@/lib/supabase'

export async function generateOutfitImage(outfitSentence: string): Promise<string> {
  const { dataUrl } = await callEdgeFunction<{ dataUrl: string }>('outfit-image', { outfitSentence })
  return dataUrl
}

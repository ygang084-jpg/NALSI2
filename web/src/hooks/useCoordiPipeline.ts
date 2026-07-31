import { useCallback, useState } from 'react'
import type { LocationValue } from '@/types/location'
import { fetchWeatherBundle, type WeatherBundle } from '@/lib/weather'
import { generateCoordiRecommendation, type CoordiRecommendation } from '@/lib/ai'
import { generateOutfitImage } from '@/lib/image'
import { saveHistoryEntry } from '@/lib/history'

export type PipelineStage = 'idle' | 'weather' | 'ai' | 'image' | 'done' | 'error'

export type PipelineState = {
  stage: PipelineStage
  error: string | null
  weather: WeatherBundle | null
  recommendation: CoordiRecommendation | null
  imageStatus: 'idle' | 'loading' | 'success' | 'error'
  imageDataUrl: string | null
}

const INITIAL_STATE: PipelineState = {
  stage: 'idle',
  error: null,
  weather: null,
  recommendation: null,
  imageStatus: 'idle',
  imageDataUrl: null,
}

export function useCoordiPipeline(userId: string | null) {
  const [state, setState] = useState<PipelineState>(INITIAL_STATE)

  const run = useCallback(
    async (location: LocationValue | null) => {
      if (location?.type !== 'coords') {
        setState({
          ...INITIAL_STATE,
          stage: 'error',
          error:
            '좌표가 없어요. "현재 위치 사용" 버튼을 누르거나 위도/경도를 직접 입력해주세요. (지역명 검색은 아직 좌표 변환 기능이 연결되지 않았어요)',
        })
        return
      }

      setState({ ...INITIAL_STATE, stage: 'weather' })

      let weather: WeatherBundle
      try {
        weather = await fetchWeatherBundle(location.lat, location.lon)
      } catch (err) {
        setState((s) => ({
          ...s,
          stage: 'error',
          error: err instanceof Error ? err.message : '날씨 정보를 가져오지 못했어요.',
        }))
        return
      }
      setState((s) => ({ ...s, stage: 'ai', weather }))

      let recommendation: CoordiRecommendation
      try {
        recommendation = await generateCoordiRecommendation(weather)
      } catch (err) {
        setState((s) => ({
          ...s,
          stage: 'error',
          error: err instanceof Error ? err.message : 'AI 추천을 생성하지 못했어요.',
        }))
        return
      }
      setState((s) => ({ ...s, stage: 'image', recommendation, imageStatus: 'loading' }))

      let imageDataUrl: string | null = null
      let imageStatus: 'success' | 'error' = 'error'
      try {
        imageDataUrl = await generateOutfitImage(recommendation.outfitSentence)
        imageStatus = 'success'
      } catch {
        imageDataUrl = null
        imageStatus = 'error'
      }

      setState((s) => ({ ...s, stage: 'done', imageStatus, imageDataUrl }))

      if (userId) {
        saveHistoryEntry({
          userId,
          lat: location.lat,
          lon: location.lon,
          weather,
          outfitSentence: recommendation.outfitSentence,
          checklist: recommendation.checklist,
          imageDataUrl,
        }).catch((err) => {
          console.error('히스토리 저장 실패', err)
        })
      }
    },
    [userId],
  )

  return { state, run }
}

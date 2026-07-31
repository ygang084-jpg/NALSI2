import type { PipelineState } from '@/hooks/useCoordiPipeline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const STEPS: { key: 'weather' | 'ai' | 'image'; label: string }[] = [
  { key: 'weather', label: '날씨 조회 중' },
  { key: 'ai', label: '코디 · 준비물 생성 중' },
  { key: 'image', label: '이미지 생성 중' },
]

const STEP_ORDER = STEPS.map((step) => step.key)

function stepStatus(stepKey: string, stage: PipelineState['stage']): 'done' | 'active' | 'pending' {
  if (stage === 'done') return 'done'
  const currentIndex = STEP_ORDER.indexOf(stage as (typeof STEP_ORDER)[number])
  const stepIndex = STEP_ORDER.indexOf(stepKey as (typeof STEP_ORDER)[number])
  if (currentIndex === -1) return 'pending'
  if (stepIndex < currentIndex) return 'done'
  if (stepIndex === currentIndex) return 'active'
  return 'pending'
}

export function CoordiResultPanel({ state }: { state: PipelineState }) {
  if (state.stage === 'idle') {
    return null
  }

  if (state.stage === 'error') {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-destructive">{state.error}</CardContent>
      </Card>
    )
  }

  if (state.stage !== 'done') {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3 py-6">
          {STEPS.map((step) => {
            const status = stepStatus(step.key, state.stage)
            return (
              <div key={step.key} className="flex items-center gap-3 text-sm">
                <span
                  className={
                    status === 'done'
                      ? 'flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground'
                      : status === 'active'
                        ? 'flex size-5 shrink-0 animate-pulse items-center justify-center rounded-full border-2 border-primary'
                        : 'flex size-5 shrink-0 items-center justify-center rounded-full border border-muted-foreground/30'
                  }
                >
                  {status === 'done' ? '✓' : ''}
                </span>
                <span className={status === 'pending' ? 'text-muted-foreground' : 'font-medium'}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </CardContent>
      </Card>
    )
  }

  const recommendation = state.recommendation
  if (!recommendation) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>오늘의 코디 추천 결과</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          <div className="flex w-full flex-col items-center gap-1 lg:w-2/5">
            {state.imageStatus === 'success' && state.imageDataUrl ? (
              <>
                <img
                  src={state.imageDataUrl}
                  alt="AI가 생성한 예시 코디 이미지"
                  className="aspect-square w-full rounded-md border object-cover"
                />
                <span className="text-xs text-muted-foreground">
                  AI가 생성한 예시 이미지예요 (실제 옷 사진이 아니에요)
                </span>
              </>
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                예시 이미지 생성에 실패해서 텍스트로만 안내할게요.
              </div>
            )}
          </div>

          <div className="flex w-full flex-col gap-4 lg:w-3/5">
            <p className="text-base font-medium">{recommendation.outfitSentence}</p>
            <ul className="flex flex-col gap-2 text-sm">
              {recommendation.checklist.map((entry) => (
                <li key={entry.item} className="flex flex-col gap-0.5 rounded-md border px-3 py-2">
                  <span className="flex items-center justify-between">
                    <span>{entry.item}</span>
                    <span className={entry.needed ? 'font-medium' : 'text-muted-foreground'}>
                      {entry.needed ? '필요' : '필요 없음'}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">{entry.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

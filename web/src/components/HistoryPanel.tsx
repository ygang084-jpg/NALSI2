import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchHistory, type HistoryEntry } from '@/lib/history'

export function HistoryPanel({ userId }: { userId: string }) {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setEntries(null)
    setError('')
    fetchHistory(userId)
      .then((data) => {
        if (!cancelled) setEntries(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '히스토리를 불러오지 못했어요.')
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  if (error) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-destructive">{error}</CardContent>
      </Card>
    )
  }

  if (entries === null) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">불러오는 중...</CardContent>
      </Card>
    )
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          아직 저장된 기록이 없어요.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {entries.map((entry) => (
        <Card key={entry.id}>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">
              {new Date(entry.created_at).toLocaleString('ko-KR')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
              <div className="flex w-full flex-col items-center gap-1 lg:w-2/5">
                {entry.image_data_url ? (
                  <img
                    src={entry.image_data_url}
                    alt="AI가 생성한 예시 코디 이미지"
                    className="aspect-square w-full rounded-md border object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                    이미지 없이 저장된 기록이에요.
                  </div>
                )}
              </div>

              <div className="flex w-full flex-col gap-3 lg:w-3/5">
                <p className="text-sm text-muted-foreground">
                  위치: {entry.lat.toFixed(4)}, {entry.lon.toFixed(4)}
                </p>
                <p className="text-base font-medium">{entry.outfit_sentence}</p>
                <ul className="flex flex-col gap-2 text-sm">
                  {entry.checklist.map((item) => (
                    <li
                      key={item.item}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <span>{item.item}</span>
                      <span className={item.needed ? 'font-medium' : 'text-muted-foreground'}>
                        {item.needed ? '필요' : '필요 없음'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

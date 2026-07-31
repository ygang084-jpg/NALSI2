import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

function App() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🧚</span>
            <h1 className="text-lg font-semibold sm:text-xl">날씨요정단</h1>
          </div>
          <div className="flex gap-2">
            <Input placeholder="지역명을 검색하세요" className="w-full sm:w-56" />
            <Button className="shrink-0">검색</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <Card>
            <CardHeader>
              <CardTitle>오늘의 코디 추천</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex aspect-square w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground sm:aspect-video md:aspect-square">
                코디 예시 이미지 영역
              </div>
              <p className="text-sm text-muted-foreground">
                날씨 데이터를 불러오면 이곳에 옷차림 추천 문장이 표시됩니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>오늘의 준비물</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2 text-sm">
                <li className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span>우산</span>
                  <span className="text-muted-foreground">-</span>
                </li>
                <li className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span>양산</span>
                  <span className="text-muted-foreground">-</span>
                </li>
                <li className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span>마스크</span>
                  <span className="text-muted-foreground">-</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t px-4 py-4 text-center text-xs text-muted-foreground sm:px-6">
        날씨요정단 · 위치 기반 코디 &amp; 준비물 추천
      </footer>
    </div>
  )
}

export default App

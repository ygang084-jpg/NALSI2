import { useState } from 'react'
import { CoordiForm } from '@/components/CoordiForm'
import { CoordiResultPanel } from '@/components/CoordiResultPanel'
import { AuthPanel } from '@/components/AuthPanel'
import { HistoryPanel } from '@/components/HistoryPanel'
import { Button } from '@/components/ui/button'
import { useCoordiPipeline } from '@/hooks/useCoordiPipeline'
import { useSession } from '@/hooks/useSession'
import { supabase } from '@/lib/supabaseClient'

function App() {
  const { session, loading } = useSession()
  const [tab, setTab] = useState<'recommend' | 'history'>('recommend')
  const { state, run } = useCoordiPipeline(session?.user.id ?? null)

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🧚</span>
            <h1 className="text-lg font-semibold sm:text-xl">날씨요정단</h1>
          </div>

          {session && (
            <div className="flex items-center gap-2">
              <div className="flex gap-1 rounded-md border p-0.5">
                <Button
                  type="button"
                  size="sm"
                  variant={tab === 'recommend' ? 'default' : 'ghost'}
                  onClick={() => setTab('recommend')}
                >
                  코디 추천
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={tab === 'history' ? 'default' : 'ghost'}
                  onClick={() => setTab('history')}
                >
                  히스토리
                </Button>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => supabase.auth.signOut()}>
                로그아웃
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground">불러오는 중...</p>
        ) : !session ? (
          <AuthPanel />
        ) : tab === 'recommend' ? (
          <>
            <CoordiForm onSubmit={(location) => run(location)} />
            <CoordiResultPanel state={state} />
          </>
        ) : (
          <HistoryPanel userId={session.user.id} />
        )}
      </main>

      <footer className="border-t px-4 py-4 text-center text-xs text-muted-foreground sm:px-6">
        날씨요정단 · 위치 기반 코디 &amp; 준비물 추천
      </footer>
    </div>
  )
}

export default App

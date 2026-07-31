export class MissingSupabaseConfigError extends Error {}

function getConfig(): { url: string; anonKey: string } {
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new MissingSupabaseConfigError(
      'Supabase 설정이 없어요. web/.env 파일에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 추가한 뒤 개발 서버를 다시 시작해주세요.',
    )
  }
  return { url, anonKey }
}

export async function callEdgeFunction<T>(functionName: string, body: unknown): Promise<T> {
  const { url, anonKey } = getConfig()

  const response = await fetch(`${url}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
    },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok || (data && typeof data === 'object' && 'error' in data)) {
    const message =
      (data && typeof data === 'object' && 'error' in data && String(data.error)) ||
      `요청이 실패했어요 (${response.status} ${response.statusText})`
    throw new Error(message)
  }

  return data as T
}

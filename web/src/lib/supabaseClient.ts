import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Supabase 설정이 없어요. web/.env 파일에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 추가한 뒤 개발 서버를 다시 시작해주세요.',
  )
}

export const supabase = createClient(url, anonKey)

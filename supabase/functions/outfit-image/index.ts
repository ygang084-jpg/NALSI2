import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { encodeBase64 } from 'jsr:@std/encoding/base64'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Google's Gemini/Imagen image models all require a billing-enabled account
// (free tier quota is 0 for every image-output model). Pollinations.ai needs
// no API key and has no billing requirement, so we use it instead.
const POLLINATIONS_URL = 'https://image.pollinations.ai/prompt'

function buildImagePrompt(outfitSentence: string): string {
  return `flat lay product photography, clothing only, no person, no human, no face, no model wearing it, plain white background: ${outfitSentence}`
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    const { outfitSentence } = await req.json()
    if (!outfitSentence) {
      return jsonResponse({ error: 'outfitSentence가 필요해요.' }, 400)
    }

    const prompt = buildImagePrompt(outfitSentence)
    const url = `${POLLINATIONS_URL}/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true`

    const response = await fetch(url)
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`이미지 생성 요청이 실패했어요 (${response.status} ${response.statusText}) ${body}`.trim())
    }

    const contentType = response.headers.get('content-type') ?? 'image/jpeg'
    const buffer = new Uint8Array(await response.arrayBuffer())
    const base64 = encodeBase64(buffer)

    return jsonResponse({ dataUrl: `data:${contentType};base64,${base64}` })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 502)
  }
})

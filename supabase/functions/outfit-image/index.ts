import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const IMAGE_MODEL = 'gemini-2.5-flash-image'
const IMAGE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent`

function buildImagePrompt(outfitSentence: string): string {
  return `다음 옷차림 추천 문장에 어울리는 예시 코디 이미지를 만들어주세요: "${outfitSentence}"
스타일: 옷만 깔끔하게 배치한 플랫레이(flat lay) 사진처럼 밝고 단순한 배경으로 그려주세요. 실제 사람 얼굴이나 특정 인물은 등장시키지 마세요.`
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
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      return jsonResponse(
        { error: 'Gemini API 키가 서버에 설정되지 않았어요. Supabase 프로젝트에 GEMINI_API_KEY 시크릿을 추가해주세요.' },
        500,
      )
    }

    const { outfitSentence } = await req.json()
    if (!outfitSentence) {
      return jsonResponse({ error: 'outfitSentence가 필요해요.' }, 400)
    }

    const response = await fetch(`${IMAGE_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildImagePrompt(outfitSentence) }] }],
      }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`Gemini 이미지 생성 요청이 실패했어요 (${response.status} ${response.statusText}) ${body}`.trim())
    }

    const data = await response.json()
    const parts: Array<{ inlineData?: { mimeType: string; data: string } }> =
      data.candidates?.[0]?.content?.parts ?? []
    const imagePart = parts.find((part) => part.inlineData)

    if (!imagePart?.inlineData) {
      throw new Error('Gemini 응답에서 이미지를 찾지 못했어요.')
    }

    const dataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
    return jsonResponse({ dataUrl })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 502)
  }
})

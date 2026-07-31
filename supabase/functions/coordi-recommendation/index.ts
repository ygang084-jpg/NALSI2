import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent'

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    outfitSentence: {
      type: 'STRING',
      description: '기온·체감온도·습도·날씨상태를 종합한 오늘의 옷차림 추천을 담은 한 문장',
    },
    checklist: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          item: { type: 'STRING', enum: ['우산', '양산', '마스크'] },
          needed: { type: 'BOOLEAN' },
          reason: { type: 'STRING', description: '판단 근거를 한 문장으로' },
        },
        required: ['item', 'needed', 'reason'],
      },
    },
  },
  required: ['outfitSentence', 'checklist'],
}

type WeatherBundle = {
  temp: number
  feelsLike: number
  humidity: number
  weatherMain: string
  uvi: number
  pop: number
  pm2_5: number
  pm10: number
}

function buildPrompt(weather: WeatherBundle): string {
  return `당신은 날씨 데이터만 보고 오늘의 옷차림과 준비물을 추천하는 스타일리스트입니다.
사용자의 실제 옷 사진은 절대 참고하지 말고, 아래 날씨 데이터만으로 판단하세요.

[오늘의 날씨 데이터]
- 기온: ${weather.temp}°C
- 체감온도: ${weather.feelsLike}°C
- 습도: ${weather.humidity}%
- 날씨 상태: ${weather.weatherMain}
- 자외선지수(UVI): ${weather.uvi}
- 강수확률(pop, 0~1 사이 값): ${weather.pop}
- 미세먼지 PM2.5: ${weather.pm2_5}㎍/m³
- 미세먼지 PM10: ${weather.pm10}㎍/m³

[코디 추천 지침]
기온·체감온도·습도·날씨 상태를 종합해서 오늘 어울리는 옷차림을 한 문장으로 추천하세요.
예: "얇은 니트 + 바람막이, 우산 챙기세요"

[준비물 판단 기준 — 반드시 아래 수치 기준을 그대로 적용]
- 우산: 강수확률(pop)이 0.3(30%) 이상이면 필요, 미만이면 불필요
- 양산: 자외선지수(UVI)가 6 이상이면 필요, 미만이면 불필요
- 마스크: PM2.5가 36㎍/m³ 이상이거나 PM10이 81㎍/m³ 이상이면 필요, 둘 다 미만이면 불필요

우산, 양산, 마스크 세 항목 모두 빠짐없이 checklist에 포함하고, 각 항목의 needed 값은 위 기준에 따라 정확히 판단하며 reason에 근거가 된 수치를 간단히 언급하세요.`
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

    const { weather } = await req.json()
    if (!weather) {
      return jsonResponse({ error: 'weather 데이터가 필요해요.' }, 400)
    }

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(weather) }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`Gemini 요청이 실패했어요 (${response.status} ${response.statusText}) ${body}`.trim())
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      throw new Error('Gemini 응답에서 결과 텍스트를 찾지 못했어요.')
    }

    return new Response(text, {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 502)
  }
})

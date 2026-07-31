import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// One Call API 3.0 requires a paid subscription. These three endpoints are
// on OpenWeatherMap's free tier and together cover the same data we need.
const CURRENT_WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather'
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast'
const UVI_URL = 'https://api.openweathermap.org/data/2.5/uvi'
const AIR_POLLUTION_URL = 'https://api.openweathermap.org/data/2.5/air_pollution'

async function fetchJson(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`OpenWeatherMap 요청이 실패했어요 (${res.status} ${res.statusText}) ${body}`.trim())
  }
  return res.json()
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
    const apiKey = Deno.env.get('OPENWEATHER_API_KEY')
    if (!apiKey) {
      return jsonResponse(
        { error: 'OpenWeatherMap API 키가 서버에 설정되지 않았어요. Supabase 프로젝트에 OPENWEATHER_API_KEY 시크릿을 추가해주세요.' },
        500,
      )
    }

    const { lat, lon } = await req.json()
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return jsonResponse({ error: 'lat, lon 숫자 값이 필요해요.' }, 400)
    }

    const currentWeatherUrl = `${CURRENT_WEATHER_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    const forecastUrl = `${FORECAST_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    const uviUrl = `${UVI_URL}?lat=${lat}&lon=${lon}&appid=${apiKey}`
    const airPollutionUrl = `${AIR_POLLUTION_URL}?lat=${lat}&lon=${lon}&appid=${apiKey}`

    const [currentWeather, forecast, airPollution] = await Promise.all([
      fetchJson(currentWeatherUrl),
      fetchJson(forecastUrl),
      fetchJson(airPollutionUrl),
    ])

    // The UV Index endpoint isn't available on every free-tier key, so
    // treat it as best-effort and fall back to 0 rather than failing the
    // whole request over one non-essential field.
    let uvi = 0
    try {
      const uviData = await fetchJson(uviUrl)
      uvi = uviData.value ?? 0
    } catch {
      uvi = 0
    }

    const components = airPollution.list?.[0]?.components ?? {}
    const pop = forecast.list?.[0]?.pop ?? 0

    return jsonResponse({
      temp: currentWeather.main?.temp,
      feelsLike: currentWeather.main?.feels_like,
      humidity: currentWeather.main?.humidity,
      weatherMain: currentWeather.weather?.[0]?.main,
      uvi,
      pop,
      pm2_5: components.pm2_5,
      pm10: components.pm10,
    })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 502)
  }
})

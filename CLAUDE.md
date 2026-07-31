# CLAUDE.md

이 파일은 이 저장소에서 코드 작업을 할 때 Claude Code(claude.ai/code)에게 제공하는 가이드입니다.

## 프로젝트 개요

날씨요정단 — 위치 하나만 입력하면 코디 추천(문장 + 예시 이미지)과 준비물(우산/양산/마스크) 추천을 함께 보여주는 앱. Supabase Auth로 로그인하면 추천 기록이 히스토리로 남는다. 제품 스펙의 근거는 `PRD.md` 참고.

## 자주 쓰는 명령어

프론트엔드는 `web/` 디렉토리에 있다. 모든 npm 명령은 이 디렉토리 안에서 실행한다.

```bash
cd web
npm install       # 의존성 설치
npm run dev       # 개발 서버 (기본 http://localhost:5173)
npm run build     # tsc -b && vite build — 타입체크 + 프로덕션 빌드
npm run lint      # oxlint
```

테스트 스위트는 없다. 기능 변경 후 검증은 실제 dev 서버를 띄우고 Playwright(headless Chromium)로 브라우저를 구동해 스크린샷/콘솔 로그로 확인하는 방식을 써왔다 (`scratchpad/pw-test/` 참고 스크립트들, 세션마다 위치가 바뀌므로 매번 새로 작성).

## 아키텍처

### 프론트엔드 (`web/`)
- React + Vite + TypeScript. Tailwind CSS v4(`@tailwindcss/vite` 플러그인)와 shadcn/ui(`src/components/ui/*`) 사용, 경로 별칭 `@/*` → `src/*`.
- `src/App.tsx` — 로그인 게이트 + "코디 추천"/"히스토리" 탭 전환.
- `src/components/CoordiForm.tsx` — 위치 입력(현재 위치 Geolocation, 지역명 검색, 위도/경도 직접 입력) + 옷 사진 업로드(선택) + 추천 버튼. 지역명 검색은 아직 좌표로 변환되지 않으므로(Geocoding 미연동) 현재 위치 버튼 또는 위도/경도 직접 입력으로만 실제 파이프라인이 동작한다.
- `src/components/CoordiResultPanel.tsx` — 파이프라인 진행 단계 표시 + 완료 후 결과(이미지/문장/체크리스트) 반응형 레이아웃.
- `src/components/AuthPanel.tsx` — 이메일/비밀번호 로그인·회원가입.
- `src/components/HistoryPanel.tsx` — 로그인한 사용자의 과거 추천 기록 조회.
- `src/hooks/useCoordiPipeline.ts` — 위치 → 날씨 → AI 추천 → 이미지 생성 → (로그인 시) 히스토리 저장까지 이어지는 상태 머신. 이미지 생성 실패는 전체 실패로 취급하지 않고 텍스트만으로 `done` 처리한다.
- `src/hooks/useSession.ts` — Supabase Auth 세션 구독.
- `src/lib/weather.ts` / `src/lib/ai.ts` / `src/lib/image.ts` — 각각 Supabase Edge Function(`weather`, `coordi-recommendation`, `outfit-image`)을 호출하는 얇은 클라이언트. 실제 외부 API 로직은 여기 없고 Edge Function 쪽에 있다.
- `src/lib/supabase.ts` — Edge Function 호출 공용 헬퍼(`callEdgeFunction`), Authorization/apikey 헤더를 anon key로 채운다.
- `src/lib/supabaseClient.ts` — 인증/DB용 `@supabase/supabase-js` 클라이언트.
- `src/lib/history.ts` — `coordi_history` 테이블 insert/select.

### 백엔드 (`supabase/functions/`)
Python이 아니라 **Deno(TypeScript) Edge Function**이다. 각 폴더의 `index.ts`가 진입점.

- `weather/` — OpenWeatherMap 무료 엔드포인트(Current Weather, 5 Day/3 Hour Forecast, UV Index, Air Pollution)를 조합 호출. One Call API 3.0은 유료 구독이 필요해 의도적으로 쓰지 않는다. UV Index 엔드포인트가 실패해도 0으로 대체하고 나머지 데이터는 정상 반환한다.
- `coordi-recommendation/` — Gemini 텍스트 모델(`gemini-3.1-flash-lite`)에 날씨 데이터를 전달해 코디 문장 + 준비물 체크리스트(우산/양산/마스크 각각의 필요 여부와 근거)를 구조화된 JSON(`responseSchema`)으로 생성.
- `outfit-image/` — 코디 문장을 **Pollinations.ai**(`https://image.pollinations.ai/prompt/...`)에 GET으로 요청해 예시 이미지를 base64 data URL로 생성. API 키가 필요 없는 무료 서비스다. Gemini의 이미지 출력 모델(`gemini-*-image`, Imagen 계열 전부 포함)은 무료 티어 할당량이 0이라 결제 계정 없이는 원천적으로 호출 불가능해서 대체했다 — 다른 Gemini 이미지 모델로 바꿔봐도 소용없다. 클라이언트는 이미지 생성 실패 시 텍스트만으로 폴백하도록 이미 구현되어 있다.
- 세 함수 중 `weather`, `coordi-recommendation`은 `Deno.env.get('OPENWEATHER_API_KEY')` / `Deno.env.get('GEMINI_API_KEY')`로 시크릿을 읽는다(`outfit-image`는 키가 필요 없음). **`VITE_` 접두사를 붙이면 안 된다** — 그건 프론트엔드 전용 규칙이고 Edge Function과는 무관하다. 시크릿은 Supabase 대시보드의 `/functions/secrets`(`https://supabase.com/dashboard/project/<project-ref>/functions/secrets`)에서 관리하며, MCP에는 시크릿을 읽거나 쓰는 도구가 없으므로 사용자가 직접 등록해야 한다.
- Edge Function 배포는 로컬 Supabase CLI 없이 `mcp__supabase__deploy_edge_function` MCP 도구로 한다 (project_id: 아래 참고). 로컬 `supabase/functions/*/index.ts`를 수정한 뒤 반드시 이 도구로 재배포해야 실제로 반영된다 — 파일만 고치고 배포를 안 하면 아무 효과가 없다.

### Supabase 프로젝트
- project_id / ref: `wagbfziuoxbtmvcnibsf` (서울 리전). 이 저장소 전용 프로젝트가 아니라 다른 실습(학생/도서/게시판 등)과 공유하는 프로젝트이므로, 테이블/함수 이름이 겹치지 않게 주의하고 다른 테이블은 건드리지 않는다.
- `coordi_history` 테이블 — 사용자별 추천 기록(위치 좌표, 날씨 JSON, 코디 문장, 체크리스트 JSON, 이미지 data URL, 생성 시각). RLS로 `auth.uid() = user_id`인 행만 조회/삽입/수정/삭제 가능.
- Auth는 이메일 확인(email confirmation) 없이 가입 즉시 세션이 생성되도록 설정되어 있다(테스트가 쉬움).

## 환경 변수

- `web/.env` (git에서 제외됨, `web/.env.example` 참고): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`만 있으면 된다. OpenWeatherMap/Gemini 키는 클라이언트에 절대 두지 않는다.
- Supabase Edge Function 시크릿 (대시보드에서만 관리): `OPENWEATHER_API_KEY`, `GEMINI_API_KEY`.

## 알아두면 좋은 함정

- shadcn/ui는 `@base-ui/react` 기반이라 Radix 기반 예제 코드와 API가 다를 수 있다 (`Button`, `Input` 등은 `src/components/ui/`에 이미 있는 것을 그대로 쓰면 됨).
- Tailwind v4라 `tailwind.config.js`가 없다 — 커스터마이즈는 `src/index.css`의 `@theme`/`:root` 변수로 한다.
- `tsconfig.json`/`tsconfig.app.json`에 `baseUrl`을 쓰면 안 된다(이 프로젝트의 TypeScript 버전에서 deprecated 에러 발생) — `paths`만으로 `@/*` alias가 동작한다.

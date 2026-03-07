# M2 광의통화 대시보드

한국은행 ECOS API 기반 M2(광의통화) 월별 통계 대시보드 서비스

## 주요 기능

- **Google OAuth 로그인** — NextAuth.js 기반 소셜 로그인
- **접근 허용 리스트 제어** — Turso DB에 등록된 이메일만 대시보드 접근 가능
- **M2 데이터 시각화** — 최근 3년간 월별 M2 잔액 추이 차트
- **요약 통계** — 최신 M2 잔액, 전월/전년 동월 대비 증감률
- **DB 캐싱** — Turso에 데이터 캐싱, ECOS API 장애 시 캐시 자동 사용

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 인증 | NextAuth.js v4 + Google OAuth |
| 데이터베이스 | Turso (libSQL/SQLite) |
| 공공데이터 | 한국은행 ECOS API (M2 광의통화) |
| 차트 | Recharts |
| 스타일 | Tailwind CSS |
| 배포 | Vercel |

## 환경 설정

### 1. 저장소 클론 및 패키지 설치

```bash
git clone <repo-url>
cd m2-dashboard
npm install
```

### 2. 환경변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local`에 아래 값을 입력합니다.

```env
# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# NextAuth
NEXTAUTH_SECRET=...          # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Turso DB
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...

# 한국은행 ECOS API
ECOS_API_KEY=...
```

### 3. Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com) → API 및 서비스 → 사용자 인증 정보
2. OAuth 2.0 클라이언트 ID 생성 (웹 애플리케이션)
3. 승인된 리디렉션 URI 추가:
   - `http://localhost:3000/api/auth/callback/google` (개발)
   - `https://<your-vercel-domain>/api/auth/callback/google` (운영)

### 4. Turso DB 설정

```bash
# Turso CLI 설치
brew install tursodatabase/tap/turso

# 로그인
turso auth login

# DB 생성
turso db create m2-dashboard

# 접속 URL 확인
turso db show m2-dashboard --url

# 인증 토큰 생성
turso db tokens create m2-dashboard
```

### 5. DB 초기화 (테이블 생성 & 허용 사용자 등록)

```bash
npm run db:init
```

### 6. 한국은행 ECOS API 키 발급

1. [ECOS 사이트](https://ecos.bok.or.kr) → 통계 API → API 서비스 신청
2. 발급받은 키를 `ECOS_API_KEY`에 입력

### 7. 개발 서버 실행

```bash
npm run dev
```

## Vercel 배포

1. [Vercel](https://vercel.com) → 새 프로젝트 → GitHub 저장소 연결
2. Environment Variables에 `.env.local` 항목 동일하게 입력
   - `NEXTAUTH_URL`은 Vercel 도메인으로 변경
3. 배포 완료 후 Google Cloud Console 리디렉션 URI 업데이트

## 접근 허용 사용자 관리

DB 초기화 시 자동 등록되는 허용 사용자:

| 이메일 | 역할 |
|--------|------|
| `kts123@kookmin.ac.kr` | 교수님 |
| `ummoti94@gmail.com` | 학생 |

추가 사용자 등록:

```sql
INSERT INTO allowed_users (email, name) VALUES ('new@example.com', '이름');
```

## 데이터 출처

- **한국은행 경제통계시스템(ECOS)**
- 통계표코드: `101Y004` (통화 및 유동성)
- 항목: `BBHA00` (M2 광의통화 잔액)
- 단위: 십억원 / 월별

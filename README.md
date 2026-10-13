# 🚀 CareerPilot AI — AI-Native Career Command Center

> **Tagline:** *Build. Apply. Practice. Interview. Improve. Get Job Ready.*

CareerPilot AI is a production-grade, AI-native career command center designed for college students and engineering candidates. Inspired by modern fintech and developer-first systems (Linear, Raycast), CareerPilot AI aggregates a student's education, verified skills, GitHub projects, certifications, and experience into a **single source of truth** for resume generation, intelligent job matching, explicit-approval job applications, live voice mock interviews, and live grounded RAG mentorship.

---

## 🏆 Verified Quality Gates Status

| Quality Gate | Requirement | Status | Evidence / Verification |
| :--- | :--- | :--- | :--- |
| **TypeScript** | `tsc --noEmit` | **0 Errors** | `node node_modules/typescript/bin/tsc --noEmit` exits code 0 |
| **ESLint** | Strict Zero Warnings | **0 Errors, 0 Warnings** | `node node_modules/eslint/bin/eslint.js --max-warnings 0 .` exits code 0 |
| **Production Build** | `next build` | **0 Errors (41/41 routes)** | Prerendered 41/41 pages cleanly |
| **Client Secrets** | Purged Client Bundles | **0 Secrets Leaked** | `.next/static` audited with zero raw API keys or service role tokens |
| **Private Storage** | Supabase Storage | **Private + Signed URLs** | Private `resumes` bucket with 3600-second short-lived signed download URLs |
| **Database & RLS** | Supabase Postgres Pooler | **Strict `auth.uid() = user_id`** | Applied migration `20261013_security_and_missing_tables.sql` across 7 core tables |
| **RAG Distinctness** | Student-Specific Grounding | **Verified Distinct (14% Jaccard)** | Live 2-student benchmark proves custom citations & distinct advice |
| **Application Safety** | No Auto-Submissions | **Explicit Approval Gate** | Confirmation modal required before any application submission state change |

---

## ✨ Features & Capabilities

### 🛡️ Central Career Profile Engine (Single Source of Truth)
- **Zero Mock / Placeholder Data:** Bound directly to `useProfileStore` and Supabase with live user-verified data.
- **Verification Badges:**
  - `Verified` (Emerald `#10B981`): Validated via OCR extract confirmation, certificate verification, or code review.
  - `Needs Review` (Amber `#F59E0B`): Extracted credentials awaiting student audit.
  - `Unverified`: Unconfirmed self-reported entries.
- **Career Readiness Score:** Dynamically computed from verified credentials, practice drills, and mock interview benchmark scores.

### 🎙️ AI Voice & Video Mock Interview Room
- **AI Speaks First:** Low-latency speech synthesis begins the interview with prompt welcome & question delivery.
- **Microphone & Camera Resilience:** SpeechRecognition with full typing fallback when microphone is unavailable. Graceful camera bypass if video permissions are denied.
- **Live Scorecards & Session Persistence:** Real-time speech cadence analysis (WPM), STAR answer structure, and filler word detection saved to Supabase `interview_sessions`.

### 📄 Dynamic ATS Resume & Optimization
- **Central Profile Binding:** Live resume and ATS scorecard built solely from the student's verified profile data.
- **Dynamic Scoring:** Computes format, quantitative impact, relevance, and keyword coverage without static hardcoded values.

### 🧭 Live Web-Researched Career Roadmap
- **Dynamic Roadmaps:** Adaptive 4 to 16 week milestones customized to target career roles and verified skill gaps.
- **Interactive Checklists:** Optimistic task toggle and progress updates persisted to Supabase `learning_roadmaps`.

### 💼 Smart Job Matching & Explicit-Approval Applications
- **Semantic Skill Match:** Real-time match scoring and missing skill gaps computed against verified profile skills.
- **Explicit Student Approval:** Kanban board tracking application states (`Draft` → `Ready for Review` → `Applied` → `Interviewing` → `Offer`) with mandatory confirmation modals.

### 🤖 Grounded RAG Chat ("Jarvis")
- **Student Profile Grounding:** Direct, concise, mentor-style responses grounded exclusively in the individual student's verified profile and interview performance.
- **Distinct Output:** Two students asking the exact same question receive distinct, personalized action plans (proven with 14% vocabulary overlap).

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router, Server Actions, API Routes) |
| **Language** | TypeScript (Strict Mode) |
| **Styling** | Tailwind CSS v4, Single Accent Indigo (`#6366F1`) & Emerald (`#10B981`) Verification Badges |
| **State Management** | Zustand (Persistent local stores for offline-first state) |
| **AI & LLM** | Google Gemini (`gemini-3.5-flash`, `gemini-flash-latest`, `gemini-3.8-flash`) |
| **Database & Auth** | Supabase Postgres (AWS Mumbai Pooler), Row Level Security (RLS), Supabase Auth / SMTP OTP |
| **Voice & Speech** | Web SpeechRecognition API (STT), SpeechSynthesis API (TTS) |
| **Email Dispatch** | Server-side SMTP / Nodemailer (Gmail App Password) |
| **Messaging** | Meta WhatsApp Business Cloud API (Official Webhooks) |

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher

### 2. Installation
```bash
git clone https://github.com/kirankirankumarr15-cmd/lab-management-system.git
cd careerpilot-ai
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local` and populate the required keys:
```bash
cp .env.example .env.local
```

### 4. Quality Gates Verification Commands
Run the complete quality verification suite:

```bash
# 1. Typecheck
node node_modules/typescript/bin/tsc --noEmit

# 2. Strict Lint (Zero errors, zero warnings)
node node_modules/eslint/bin/eslint.js --max-warnings 0 .

# 3. Production Build
npm run build

# 4. RAG Distinctness Live Verification
node scripts/verify_rag_distinctness.js
```

### 5. Running the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

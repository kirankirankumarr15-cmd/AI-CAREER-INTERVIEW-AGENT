# 🚀 CareerPilot AI — AI-Native Career Command Center

> **Tagline:** *Build. Apply. Practice. Interview. Improve. Get Job Ready.*

CareerPilot AI is a state-of-the-art, AI-native career command center designed for college students. Inspired by modern fintech and developer-first tools (Linear, Notion), CareerPilot AI aggregates a student's education, verified skills, GitHub projects, certifications, and experience into a **single source of truth** for resume generation, intelligent job matching, automated applications, real-time mock interviews, and personalized career roadmaps.

---

## ✨ Features & Capabilities

### 🛡️ Verified Student Profile Engine
- **Single Source of Truth:** Centralized storage for skills, projects, certifications, work experience, and educational background.
- **Verification Badges:** Automated and manual badge verification system:
  - `Verified` (Green): Verified via GitHub API, cert validation, or college portal.
  - `Needs Review` (Amber): Self-reported projects/skills pending automated audit.
  - `Unverified` (Muted Slate): Standard unverified entries.
- **Career Readiness Score:** Real-time calculated readiness score (0–100) computed from profile completeness, verified credentials, practice history, and mock interview performance.

### 🎙️ AI Voice & Video Mock Interview Room
- **Full-Bleed Dark Experience:** High-performance dark chrome interface with interactive audio visualizer and pulsing AI avatar rings.
- **Voice-to-Voice Interaction:** Speech-to-Text (Web Speech API) and dynamic Text-to-Speech synthesis for natural, low-latency conversational interviews.
- **Real-Time Analytics:** Analyzes filler words ("um", "uh", "like", "you know"), answer confidence, conciseness, technical depth, and communication clarity.
- **Post-Interview Actionable Feedback:** Comprehensive scorecards, transcripts, and targeted weakness recommendations.

### 📄 ATS Resume Optimizer
- **Tailored Resume Generation:** Generates job-specific, bulleted, ATS-formatted resumes using student's verified profile data.
- **ATS Analyzer:** Computes ATS match scores, missing keywords, structural flaws, and readability metrics.
- **PDF Export:** Clean, single-page print formatting with customizable themes.

### 🤖 8-Agent Modular AI Architecture
Driven by Google Gemini 2.5 Flash:
1. **Profile Verification Agent:** Validates skills, GitHub repos, and certificates.
2. **Resume Generation Agent:** Synthesizes ATS-friendly resumes per target job description.
3. **Job Matching Agent:** Computes match percentage and identifies skill gaps for tech roles.
4. **Mock Interview Agent:** Generates adaptive technical, behavioral, and system design questions.
5. **Learning & Roadmap Agent:** Builds custom day-by-day skill acquisition blueprints.
6. **Communication Agent:** Evaluates speech patterns, tone, and delivery quality.
7. **Document Analysis Agent:** Scans uploaded resumes/transcripts to extract structured data.
8. **Application Assistant Agent:** Auto-drafts cover letters and answers company-specific application questions.

### 📲 WhatsApp Cloud API Integration
- **Official Meta WhatsApp Cloud API:** Built with the official API standard (no unofficial scrapers or web bots).
- **Instant Alerts:** Real-time WhatsApp notifications for daily mission tasks, interview feedback summaries, job matches, and streak reminders.
- **Interactive Webhooks:** Respond directly via WhatsApp commands (`interview`, `progress`, `jobs`, `help`) with safety confirmation gates for sensitive actions.

---

## 🎨 Design System

- **Dark Mode Standard:** Primary background `#0A0A0B`, card containers `#121217`, subtle borders `#1F1F28`.
- **Single Accent Palette:** Indigo (`#6366F1`) for primary actions, active navigation states, and radial progress arcs. Emerald (`#10B981`) for verified badges and mission completion.
- **Radial Progress Ring:** Custom SVG circular progress indicator with smooth CSS arc transitions and tabular numeric displays.
- **Typography:** Inter font family with high readability and tabular numbers for metric counters.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router, Server Actions, API Routes) |
| **Language** | TypeScript (Strict Mode) |
| **Styling** | Tailwind CSS v4, Vanilla CSS Design System, Lucide Icons |
| **State Management** | Zustand (Persistent local stores for offline-first state) |
| **AI & LLM** | Google Gemini 2.5 Flash API (`@google/genai`) |
| **Database & Auth** | Supabase PostgreSQL, Row Level Security (RLS), Supabase Auth / Local OTP |
| **Voice & Speech** | SpeechRecognition API (STT), SpeechSynthesis API (TTS) |
| **Messaging** | Meta WhatsApp Business Cloud API (v21.0) |

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: `v18.x` or higher
- **npm** / **pnpm** / **yarn**

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/kirankirankumarr15-cmd/AI-CAREER-INTERVIEW-AGENT.git
cd AI-CAREER-INTERVIEW-AGENT
npm install
```

### 3. Environment Variables Setup
Create a `.env.local` file in the root directory:

```env
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini AI Key
GEMINI_API_KEY=your-google-gemini-api-key

# Meta WhatsApp Business Cloud API (Optional for WhatsApp features)
WHATSAPP_PHONE_NUMBER_ID=your-whatsapp-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_VERIFY_TOKEN=your-custom-webhook-verify-token
```

### 4. Database Setup (Supabase)
Run the SQL migration script provided in `supabase/schema.sql` inside your Supabase SQL Editor to create:
- `profiles` table
- `skills` table
- `projects` table
- `certifications` table
- `interviews` table
- `jobs` table
- `applications` table

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Directory Structure

```
careerpilot-ai/
├── app/
│   ├── (auth)/             # Auth pages (Login, Signup, OTP Verification)
│   ├── (dashboard)/        # Dashboard pages
│   │   ├── applications/   # Application Tracker
│   │   ├── career/         # Career Roadmap & Skills
│   │   ├── dashboard/      # Main Command Center Overview
│   │   ├── documents/      # Certificate & Document Vault
│   │   ├── interview/      # Mock Interview Setup & Room
│   │   ├── jobs/           # AI Job Matching
│   │   ├── learn/          # Learning Modules
│   │   ├── practice/       # Practice Questions
│   │   ├── profile/        # Verified Profile Engine
│   │   ├── progress/       # Readiness & Analytics
│   │   └── resume/         # ATS Resume Optimizer
│   └── api/                # API Routes (AI Chat, Auth, WhatsApp Webhooks)
├── components/
│   ├── chat/               # Floating AI Career Coach Drawer
│   ├── common/             # Reusable UI (RadialProgressRing, Shortcuts)
│   ├── dashboard/          # Dashboard cards & components
│   └── layout/             # Sidebar, TopBar, Navigation
├── lib/
│   ├── ai/                 # Gemini API setup & 8 modular AI agents
│   ├── auth/               # OTP & local user store
│   ├── speech/             # Speech-to-Text & Text-to-Speech modules
│   ├── supabase/           # Supabase client setup
│   └── whatsapp/           # Meta WhatsApp Cloud API client & templates
├── store/                  # Zustand state management stores
├── supabase/               # Database SQL schema definitions
└── public/                 # Static assets & branding imagery
```

---

## ⌨️ Keyboard Shortcuts

- `Ctrl` + `K` / `Cmd` + `K`: Focus AI Assistant Chat Drawer
- `Esc`: Close open drawers or modals

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

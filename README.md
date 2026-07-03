# Study

An AI-powered study companion web app that teaches you step-by-step using your own API keys (BYOK - Bring Your Own Key).

## Features

- **AI Tutor Chat** - Explains concepts step-by-step like a real teacher, asks follow-up questions to check understanding
- **Flashcards** - AI auto-generates flashcards from any topic, with spaced repetition review
- **Quiz Generator** - AI creates quizzes from any topic, grades answers, explains wrong answers
- **Resource Hub** - Save notes and links organized by folder
- **Calendar** - Study schedule with deadlines and exam reminders
- **Analytics Dashboard** - Study streaks, quiz scores over time, weak topics tracking
- **Chat History** - All AI tutor conversations saved and searchable

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Hono + tRPC + Drizzle ORM
- **Database**: Neon (Serverless Postgres)
- **Auth**: OAuth 2.0 (Kimi)
- **AI**: BYOK - Bring Your Own Key (Gemini or Groq)

## Getting Started

### Prerequisites

You need:
- Node.js 20+
- A free API key from Gemini or Groq (or both)

### Get Free API Keys

- **Gemini**: https://aistudio.google.com/apikey
- **Groq**: https://console.groq.com/keys

### Setup

1. Clone the repo:
```bash
git clone https://github.com/gaganchauhan1997/study.git
cd study
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the env example and fill in your values
cp .env.example .env
```

4. Set up the database:
```bash
# Push schema to your Neon database
npm run db:push
```

5. Run the development server:
```bash
npm run dev
```

The app will be available at http://localhost:3000

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon Postgres connection string |
| `APP_ID` | Your Kimi app ID |
| `APP_SECRET` | Your Kimi app secret |

API keys (Gemini/Groq) are configured per-user in the app settings, not in environment variables.

## Deploying to Cloudflare Pages

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist/` folder to Cloudflare Pages.

3. Set environment variables in Cloudflare Pages dashboard.

## License

MIT

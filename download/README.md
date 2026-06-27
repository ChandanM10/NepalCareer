# NepalCareer — AI Job Discovery Platform

Nepal's AI-powered job platform. Find IT jobs in Kathmandu and across Nepal.

## Quick Start (5 minutes)

### Prerequisites
- **Node.js 18+** → https://nodejs.org
- **Bun** (package manager) → https://bun.sh

### Installation

1. **Unzip the project:**
   ```bash
   unzip nepalcareer-full-project.zip -d nepalcareer
   cd nepalcareer
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Create `.env` file** (in the project root):
   ```env
   DATABASE_URL="file:./db/custom.db"
   ```

4. **Set up the database:**
   ```bash
   bun run db:push
   ```

5. **Seed sample data** (creates 37 companies, 111 jobs, admin account):
   ```bash
   bun run scripts/seed.ts
   ```

6. **Start the dev server:**
   ```bash
   bun run dev
   ```

7. **Open in browser:** http://localhost:3000

### Login Credentials

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_PHONE` in your `.env` file
before running the seed script, then sign in with those credentials.

---

## Features

### For Job Seekers
- 📄 Upload resume (PDF/TXT) → AI parses and scores ATS
- 🤖 AI job matching with fit scores (0-100)
- 💬 AI Career Advisor chat
- 📋 Application tracker (Kanban board with drag-and-drop)
- 🔔 Job alerts via WhatsApp + Email
- 👀 Watch company career pages for new postings
- 📊 AI Career Insights
- 🎯 Interview prep question generator
- ⚖️ Job comparison tool

### For Admins/Recruiters
- 📊 Recruiter Command Center dashboard
- ➕ Post new jobs
- 👥 View all applications
- 📈 Analytics (applications trend, pipeline funnel, top jobs)

### Supported Countries
- 🇳🇵 Nepal (12 companies: Fusemachines, F1Soft, Deerwalk, CloudFactory, etc.)
- 🇮🇳 India, 🇺🇸 USA, 🇨🇦 Canada, 🇬🇧 UK, 🇩🇪 Germany
- 🌐 Remote jobs

---

## Project Structure

```
nepalcareer/
├── src/
│   ├── app/                    # Next.js pages + API routes
│   │   ├── page.tsx            # Home page
│   │   ├── login/              # Login
│   │   ├── register/           # Sign up
│   │   ├── jobs/               # Browse + detail
│   │   ├── dashboard/          # User dashboard
│   │   ├── admin/              # Recruiter panel
│   │   ├── advisor/            # AI Career Advisor
│   │   ├── resume/             # Resume upload + analysis
│   │   ├── watch-sources/      # Company URL monitoring
│   │   ├── notifications/      # Notification center
│   │   ├── settings/           # WhatsApp/email preferences
│   │   ├── api/                # Backend API routes
│   │   └── middleware.ts       # Auth protection
│   ├── components/             # React UI components
│   ├── lib/                    # Utilities (auth, db, ai, format)
├── prisma/schema.prisma        # Database schema
├── scripts/seed.ts             # Seed data
├── public/                     # Images, icons, favicon
└── package.json
```

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Database:** Prisma ORM + SQLite
- **AI:** z-ai-web-dev-sdk (with fallbacks)
- **Auth:** Cookie-based sessions
- **Charts:** Recharts
- **PDF parsing:** pdfjs-dist

## Common Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server (http://localhost:3000) |
| `bun run build` | Production build |
| `bun run lint` | Check code quality |
| `bun run db:push` | Push schema to database |
| `bun run db:generate` | Regenerate Prisma client |
| `bun run scripts/seed.ts` | Re-seed sample data |

## Troubleshooting

**"bun: command not found"** → Install from https://bun.sh

**Login not working** → Run `bun run scripts/seed.ts` to recreate the admin account

**Port 3000 in use** → Run `npx kill-port 3000` then `bun run dev`

**Database errors** → Delete the `db/` folder and run `bun run db:push && bun run scripts/seed.ts`

## License
Personal project. All company names and job postings are synthetic sample data.

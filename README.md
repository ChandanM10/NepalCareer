<p align="center">
  <img src="/public/screenshots/homepage.png" alt="NepalCareer Homepage" width="800">
</p>

<h1 align="center">NepalCareer</h1>
<p align="center">
  AI-powered job discovery platform for IT professionals in Nepal.
</p>

<p align="center">
  <a href="https://nepal-career.vercel.app/">Live Demo</a> ·
  <a href="#features">Features</a> ·
  <a href="#stack">Stack</a> ·
  <a href="#getting-started">Getting Started</a>
</p>

## Features

| | |
|---|---|
| **Job Board** | Browse, search, and filter IT jobs from Nepal and remote |
| **Resume Analyzer** | Upload your resume for AI-powered ATS scoring and skill extraction |
| **AI Match Scoring** | Find jobs that match your skills, experience, and career goals |
| **Smart Alerts** | Get notified when new jobs match your criteria |
| **Application Tracker** | Kanban-style pipeline to track your job applications |
| **Company Directory** | Explore companies with detailed profiles |
| **AI Career Advisor** | Chat-based guidance for interview prep and cover letters |
| **Analytics** | Market insights and salary data |

## Screenshots

<table>
  <tr>
    <td><img src="/public/screenshots/resume-job.png" alt="Homepage" width="400"></td>
    <td><img src="/public/screenshots/jobtab.png" alt="Sign Up" width="400"></td>
  </tr>
  <tr>
    <td align="center">Search job by Resume</td>
    <td align="center">Job Browser</td>
  </tr>
  <tr>
    <td colspan="2"><img src="/public/screenshots/signup.png" alt="sign up page" width="800"></td>
  </tr>
  <tr>
    <td colspan="2" align="center">Signup Page</td>
  </tr>
</table>

## Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Database**: [PostgreSQL](https://neon.tech/) on Neon
- **ORM**: [Prisma](https://prisma.io/)
- **UI**: [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Auth**: bcrypt + session cookies
- **PDF**: unpdf
- **Charts**: Recharts
- **Drag & Drop**: dnd-kit
- **Hosting**: Vercel

## Getting Started

```bash
git clone https://github.com/ChandanM10/NepalCareer.git
cd NepalCareer
npm install
cp .env.example .env.local
```

Set `DATABASE_URL` to a PostgreSQL connection string, then:

```bash
npx prisma db push
npm run dev
```

## License

MIT

# Job Recommendation Backend

This is a starter backend for the Job/Internship Recommendation mobile app.

Stack
- Node.js + Express
- Supabase (Postgres + Auth)
- RapidAPI for real-time job listings

Getting started
1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies:

```powershell
cd "c:\chandru\Job recommendation\backend"
npm install
```

3. Start server:

```powershell
npm run dev
```

Notes
- This project uses the Supabase client. Use the anon key for basic auth flows, and the service role key only when needed server-side (store it safely).
- RapidAPI settings must point to a job provider (for example, `jsearch.p.rapidapi.com` or another job API). Update `src/utils/rapidApiClient.js` if you want to use a specific RapidAPI path/response shape.

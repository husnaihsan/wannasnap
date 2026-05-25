# Wannasnap: Wedding Live Photo Wall — About this App

This repository contains the backend and API routes for a lightweight "live photo wall" used at weddings and events. Guests can upload photos from their phones directly to Supabase Storage and the site displays them in a public gallery for the event.

Key ideas:
- Fast, direct browser uploads to Supabase Storage for low-latency posting
- Simple Postgres-backed metadata so photos can be moderated and indexed
- Minimal admin UI to remove photos or manage the event

Core features
- Public event gallery pages (per-event slug)
- Guest-side image compression and direct upload
- Admin dashboard for moderating and deleting photos
- Optional auto-delete/retention via Supabase scheduled jobs

Architecture
- Frontend: Next.js 14 + TypeScript (in `src/app`)
- Backend: Next.js API routes for admin actions (server-side deletes, auth)
- Database & Storage: Supabase (Postgres + Storage buckets)

Quick usage
- Browse to the gallery: `/wedding/<your-event-slug>` to view photos
- Admin: `/admin` to access the simple moderation UI (password protected)
- API: `DELETE /api/admin/photos/[id]` removes a photo record and its file

Where to look in the code
- Gallery & pages: `src/app/wedding` and `src/app/wedding/[slug]`
- Admin UI: `src/app/admin/page.tsx`
- API endpoints: `src/app/api/admin/photos/[id]/route.ts`
- Supabase helpers: `src/lib/supabase.ts`, upload helpers: `src/lib/upload.ts`

Quick developer start
```bash
npm install
cp .env.local.example .env.local   # fill in Supabase keys and admin password
npm run dev
```

Notes
- The repository still includes SQL files under `supabase/` (schema.sql, storage.sql) used to create tables, RLS policies and buckets.
- For deployment and detailed setup instructions, see the original setup notes in the project or the `supabase/` folder.

If you'd like, I can extract the old setup steps into a separate SETUP.md and keep this README focused on the app description.

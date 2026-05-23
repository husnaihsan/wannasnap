# 💒 Wedding Live Photo Wall — Backend Setup

## Stack
- **Frontend**: Next.js 14 + TypeScript
- **Database**: Supabase Postgres
- **Storage**: Supabase Storage
- **Hosting**: Vercel (recommended)

---

## 1. Supabase Setup

### Create a project
1. Go to [supabase.com](https://supabase.com) → New project
2. Note your **Project URL** and **API keys** from Settings > API

### Run the schema
In Supabase Dashboard → **SQL Editor**, run these files in order:
```
supabase/schema.sql    ← creates tables + RLS policies
supabase/storage.sql   ← creates storage bucket + policies
```

---

## 2. Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Fill in your Supabase URL, anon key, service role key, admin password

# Run dev server
npm run dev
```

App runs at `http://localhost:3000`

---

## 3. Routes

| Route | Description |
|-------|-------------|
| `/wedding/sarah-james` | Guest gallery (public) |
| `/admin` | Admin dashboard (password protected) |
| `DELETE /api/admin/photos/[id]` | Delete a photo (requires admin key) |

---

## 4. Deploy to Vercel

```bash
npx vercel
```

Set all environment variables from `.env.local.example` in your Vercel project settings.

---

## 5. Auto-Delete After 30 Days

Enable the **pg_cron** extension in Supabase Dashboard > Extensions, then uncomment the cron job at the bottom of `supabase/schema.sql` and re-run it.

---

## 6. How uploads work

```
Guest browser
  → compressImage()        # client-side JPEG compression to ≤1200px
  → supabase.storage.upload()   # direct browser → Supabase Storage
  → supabase.from('photos').insert()   # save metadata to Postgres
```

No server involved in uploads — direct browser-to-storage for speed.

---

## 7. Customise for your wedding

Edit `src/lib/supabase.ts` and `src/app/admin/page.tsx`:
- Change the event `slug` from `sarah-james` to your own
- Update the cover image URL in the gallery page
- Set your admin password in `.env.local`

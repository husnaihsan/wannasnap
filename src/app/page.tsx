import { redirect } from 'next/navigation'

// Change this slug to match your event in Supabase
const EVENT_SLUG = 'sarah-james'

export default function Home() {
  redirect(`/wedding/${EVENT_SLUG}`)
}

'use client'

import { useEffect, useState } from 'react'
import { supabase, type Photo } from '@/lib/supabase'

const SLUG = 'sarah-james' // Replace with your event slug or make dynamic

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [key, setKey] = useState('')
  const [keyError, setKeyError] = useState(false)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [eventId, setEventId] = useState<string | null>(null)
  const [tab, setTab] = useState<'photos' | 'qr'>('photos')
  const [deleting, setDeleting] = useState<string | null>(null)

  // Verify key against env var via simple comparison
  function handleLogin() {
    if (key === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthed(true)
      loadPhotos()
    } else {
      setKeyError(true)
      setTimeout(() => setKeyError(false), 1200)
    }
  }

  async function loadPhotos() {
    const { data: event } = await supabase
      .from('events').select('id').eq('slug', SLUG).single()
    if (!event) return
    setEventId(event.id)
    const { data } = await supabase
      .from('photos').select('*').eq('event_id', event.id)
      .order('created_at', { ascending: false })
    setPhotos(data || [])
  }

  async function handleDelete(photoId: string) {
    setDeleting(photoId)
    const res = await fetch(`/api/admin/photos/${photoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${key}` },
    })
    if (res.ok) {
      setPhotos(prev => prev.filter(p => p.id !== photoId))
    }
    setDeleting(null)
  }

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#faf9f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'sans-serif' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '0.5px solid #e8e4df', width: '100%', maxWidth: 320, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, marginBottom: 6, margin: '0 0 6px' }}>Admin Access</h2>
          <p style={{ fontSize: 14, color: '#999', marginBottom: 20 }}>Enter your admin password</p>
          <input
            type="password" value={key} onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Admin password"
            style={{
              width: '100%', padding: '11px 14px', boxSizing: 'border-box',
              border: keyError ? '1.5px solid #e05050' : '0.5px solid #d4cdc5',
              borderRadius: 10, fontSize: 15, marginBottom: 12, outline: 'none',
            }}
          />
          {keyError && <p style={{ color: '#e05050', fontSize: 13, marginBottom: 10 }}>Incorrect password</p>}
          <button onClick={handleLogin} style={{
            width: '100%', padding: '12px', background: '#c4748a', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}>Enter</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#faf9f7', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '18px 16px 0', background: '#fff', borderBottom: '0.5px solid #e8e4df' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 22 }}>⚙️</span>
          <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Georgia, serif', margin: 0 }}>Admin Dashboard</h1>
        </div>
        <p style={{ fontSize: 13, color: '#aaa', marginBottom: 14 }}>Sarah & James</p>
        <div style={{ display: 'flex', gap: 24 }}>
          {(['photos', 'qr'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', padding: '8px 0', cursor: 'pointer',
              fontSize: 14, fontWeight: 500,
              color: tab === t ? '#c4748a' : '#888',
              borderBottom: tab === t ? '2px solid #c4748a' : '2px solid transparent',
            }}>
              {t === 'photos' ? `📷 Photos (${photos.length})` : '◻ QR Code'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'photos' && (
        <div style={{ padding: '12px 12px 100px', columns: 2, gap: 8 }}>
          {photos.map(photo => (
            <div key={photo.id} style={{
              breakInside: 'avoid', marginBottom: 8, position: 'relative',
              borderRadius: 10, overflow: 'hidden', background: '#e0d9d1',
              opacity: deleting === photo.id ? 0.4 : 1, transition: 'opacity 0.3s',
            }}>
              <img src={photo.image_url} alt="" style={{ width: '100%', display: 'block', borderRadius: 10 }} loading="lazy" />
              {photo.display_name && (
                <div style={{ position: 'absolute', bottom: 34, left: 8, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', borderRadius: 20, padding: '3px 10px', fontSize: 12, color: '#fff' }}>
                  {photo.display_name}
                </div>
              )}
              <button onClick={() => handleDelete(photo.id)} disabled={deleting === photo.id} style={{
                position: 'absolute', bottom: 6, right: 6,
                background: 'rgba(180,50,50,0.85)', border: 'none',
                borderRadius: 6, padding: '4px 8px', color: '#fff', fontSize: 12, cursor: 'pointer',
              }}>🗑 Delete</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'qr' && (
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '0.5px solid #e8e4df', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/wedding/${SLUG}`)}`}
              alt="QR code"
              style={{ width: 180, height: 180, borderRadius: 8 }}
            />
            <p style={{ fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 1.6 }}>Share on table cards, invitations, or wedding signage.</p>
            <div style={{ background: '#f5f0ec', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#888', fontFamily: 'monospace' }}>
              {process.env.NEXT_PUBLIC_APP_URL}/wedding/{SLUG}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase, type Event, type Photo } from '@/lib/supabase'
import { uploadPhotoBatch } from '@/lib/upload'

// ─────────────────────────────────────────────────────────
// Gallery page — /wedding/[slug]
// ─────────────────────────────────────────────────────────

export default function WeddingPage({ params }: { params: { slug: string } }) {
  const [event, setEvent] = useState<Event | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [screen, setScreen] = useState<'gallery' | 'upload' | 'lightbox'>('gallery')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Load event + photos ──────────────────────────────────
  useEffect(() => {
    loadData()
  }, [params.slug])

  async function loadData() {
    setLoading(true)
    // Fetch event by slug
    const { data: eventData, error: eventErr } = await supabase
      .from('events')
      .select('*')
      .eq('slug', params.slug)
      .single()

       console.log('eventData:', eventData)  // ← add this
  console.log('eventErr:', eventErr)    // ← add this

    if (eventErr || !eventData) {
      setLoading(false)
      return
    }
    setEvent(eventData)

    // Fetch photos for this event, newest first
    const { data: photoData } = await supabase
      .from('photos')
      .select('*')
      .eq('event_id', eventData.id)
      .order('created_at', { ascending: false })

    setPhotos(photoData || [])
    setLoading(false)
  }

  // ── Handle file selection ────────────────────────────────
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 10)
    if (files.length === 0) return
    setSelectedFiles(files)
    setScreen('upload')
    e.target.value = ''
  }

  if (loading) return <LoadingScreen />
  if (!event) return <NotFoundScreen />

  return (
    <>
      {screen === 'gallery' && (
        <GalleryView
          event={event}
          photos={photos}
          onRefresh={loadData}
          onUploadClick={() => fileRef.current?.click()}
          onPhotoTap={(p) => { setLightboxPhoto(p); setScreen('lightbox') }}
        />
      )}
      {screen === 'upload' && (
        <UploadView
          event={event}
          files={selectedFiles}
          onSuccess={async () => { await loadData(); setScreen('gallery') }}
          onCancel={() => setScreen('gallery')}
        />
      )}
      {screen === 'lightbox' && lightboxPhoto && (
        <>
          <GalleryView
            event={event}
            photos={photos}
            onRefresh={loadData}
            onUploadClick={() => fileRef.current?.click()}
            onPhotoTap={(p) => setLightboxPhoto(p)}
          />
          <LightboxOverlay
            photo={lightboxPhoto}
            onClose={() => { setLightboxPhoto(null); setScreen('gallery') }}
          />
        </>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </>
  )
}

// ─── Gallery View ─────────────────────────────────────────

function GalleryView({ event, photos, onRefresh, onUploadClick, onPhotoTap }: {
  event: Event
  photos: Photo[]
  onRefresh: () => void
  onUploadClick: () => void
  onPhotoTap: (p: Photo) => void
}) {
  const coverUrl = event.cover_image || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80'

  return (
    <div style={{ background: '#faf9f7', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Hero */}
      <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
        <img src={coverUrl} alt="wedding" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.08), rgba(0,0,0,0.6))',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: '20px 20px 24px',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
            ♡ Wedding Gallery
          </p>
          <h1 style={{ margin: 0, fontSize: 29, fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', lineHeight: 1.1 }}>
            {event.title}
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.78)' }}>
            {new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Count + refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderBottom: '0.5px solid #e8e4df', background: '#fff' }}>
        <span style={{ fontSize: 13, color: '#888' }}>{photos.length} photo{photos.length !== 1 ? 's' : ''} shared</span>
        <button onClick={onRefresh} style={{ background: 'none', border: 'none', fontSize: 13, color: '#b07d8a', cursor: 'pointer' }}>
          ↺ Refresh
        </button>
      </div>

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#bbb' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📷</div>
          <p style={{ fontSize: 15 }}>No photos yet, be the first to share!</p>
        </div>
      ) : (
        <div style={{ padding: '12px 12px 100px', columns: 2, gap: 8 }}>
          {photos.map(photo => (
            <div key={photo.id} onClick={() => onPhotoTap(photo)}
              style={{ breakInside: 'avoid', marginBottom: 8, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', position: 'relative', background: '#e0d9d1' }}>
              <img src={photo.image_url} alt={photo.caption || ''} style={{ width: '100%', display: 'block', borderRadius: 10 }} loading="lazy" />
              {photo.display_name && (
                <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', borderRadius: 20, padding: '3px 10px', fontSize: 12, color: '#fff' }}>
                  {photo.display_name}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button onClick={onUploadClick} style={{
        position: 'fixed', bottom: 28, right: 20, width: 56, height: 56,
        borderRadius: '50%', background: '#c4748a', border: 'none',
        boxShadow: '0 4px 20px rgba(196,116,138,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', zIndex: 100, fontSize: 24, color: '#fff',
      }}>📷</button>
    </div>
  )
}

// ─── Upload View ──────────────────────────────────────────

function UploadView({ event, files, onSuccess, onCancel }: {
  event: Event
  files: File[]
  onSuccess: () => void
  onCancel: () => void
}) {
  const [previews, setPreviews] = useState<string[]>([])
  const [caption, setCaption] = useState('')
  const [name, setName] = useState('')
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const urls = files.map(f => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach(u => URL.revokeObjectURL(u))
  }, [files])

  async function handleUpload() {
    setUploading(true)
    setError(null)
    try {
      await uploadPhotoBatch({
        files,
        eventId: event.id,
        caption,
        displayName: name,
        onProgress: (done, total) => setProgress(Math.round((done / total) * 100)),
      })
      setDone(true)
      setTimeout(onSuccess, 900)
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.')
      setUploading(false)
    }
  }

  return (
    <div style={{ background: '#faf9f7', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 12px', borderBottom: '0.5px solid #e8e4df', background: '#fff' }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>←</button>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, fontFamily: 'Georgia, serif' }}>Share your photos</h2>
      </div>

      {/* Previews */}
      <div style={{ display: 'flex', gap: 8, padding: 16, overflowX: 'auto' }}>
        {previews.map((url, i) => (
          <img key={i} src={url} alt="" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
        ))}
      </div>

      {/* Fields */}
      <div style={{ padding: '0 16px 24px' }}>
        <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 6 }}>Caption (optional)</label>
        <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Add a caption..."
          style={{ width: '100%', padding: '10px 12px', border: '0.5px solid #d4cdc5', borderRadius: 8, fontSize: 15, background: '#fff', outline: 'none', marginBottom: 16 }} />
        <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 6 }}>Your name (optional)</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Uncle Tom"
          style={{ width: '100%', padding: '10px 12px', border: '0.5px solid #d4cdc5', borderRadius: 8, fontSize: 15, background: '#fff', outline: 'none' }} />
      </div>

      {/* Progress bar */}
      {uploading && !done && (
        <div style={{ margin: '0 16px 16px', background: '#e8e3dd', borderRadius: 4, height: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#c4748a', width: `${progress}%`, transition: 'width 0.3s' }} />
        </div>
      )}

      {error && <p style={{ margin: '-8px 16px 16px', fontSize: 13, color: '#e05050' }}>{error}</p>}

      <div style={{ padding: '0 16px 32px' }}>
        <button onClick={handleUpload} disabled={uploading || done} style={{
          width: '100%', padding: '14px', borderRadius: 12,
          background: done ? '#7ab87a' : '#c4748a',
          color: '#fff', border: 'none', fontSize: 16, fontWeight: 600,
          cursor: (uploading || done) ? 'default' : 'pointer', transition: 'background 0.3s',
        }}>
          {done ? '✓ Uploaded!' : uploading ? `Uploading... ${progress}%` : `Upload ${files.length} photo${files.length !== 1 ? 's' : ''}`}
        </button>
        <button onClick={onCancel} style={{ width: '100%', marginTop: 10, padding: '12px', background: 'none', border: '0.5px solid #d4cdc5', borderRadius: 12, fontSize: 15, color: '#888', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Lightbox ─────────────────────────────────────────────

function LightboxOverlay({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 300, padding: 24,
    }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#fff', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
      <img src={photo.image_url} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '72vh', borderRadius: 10, objectFit: 'contain' }} />
      {(photo.caption || photo.display_name) && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          {photo.caption && <p style={{ color: '#fff', margin: '0 0 4px', fontSize: 15 }}>{photo.caption}</p>}
          {photo.display_name && <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: 13 }}>from {photo.display_name}</p>}
        </div>
      )}
    </div>
  )
}

// ─── Loading / Not Found ──────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f7', fontFamily: 'sans-serif', color: '#aaa' }}>
      Loading gallery...
    </div>
  )
}

function NotFoundScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f7', fontFamily: 'sans-serif', color: '#aaa', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 40 }}>💒</div>
      <p>Wedding not found.</p>
    </div>
  )
}

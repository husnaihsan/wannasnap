import { supabase } from './supabase'

// ── Compress image before upload ───────────────────────────
export async function compressImage(
  file: File,
  maxDimension = 1200,
  quality = 0.82
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl)
          if (blob) resolve(blob)
          else reject(new Error('Canvas toBlob failed'))
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Image load failed'))
    }

    img.src = objectUrl
  })
}

// ── Upload a single photo to Supabase Storage ──────────────
export async function uploadPhoto(
  file: File,
  eventId: string
): Promise<string> {
  // 1. Compress
  const blob = await compressImage(file)

  // 2. Generate unique path: eventId/timestamp-random.jpg
  const ext = 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const path = `${eventId}/${filename}`

  // 3. Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('wedding-photos')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false })

  if (uploadError) throw uploadError

  // 4. Get public URL
  const { data } = supabase.storage.from('wedding-photos').getPublicUrl(path)
  return data.publicUrl
}

// ── Upload batch + save metadata ───────────────────────────
export async function uploadPhotoBatch(params: {
  files: File[]
  eventId: string
  caption?: string
  displayName?: string
  onProgress?: (completed: number, total: number) => void
}): Promise<void> {
  const { files, eventId, caption, displayName, onProgress } = params

  for (let i = 0; i < files.length; i++) {
    const imageUrl = await uploadPhoto(files[i], eventId)

    const { error } = await supabase.from('photos').insert({
      event_id: eventId,
      image_url: imageUrl,
      caption: i === 0 ? (caption || null) : null,  // caption only on first photo
      display_name: displayName || null,
    })

    if (error) throw error
    onProgress?.(i + 1, files.length)
  }
}

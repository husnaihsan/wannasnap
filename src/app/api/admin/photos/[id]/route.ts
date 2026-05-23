import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// DELETE /api/admin/photos/[id]
// Protected by ADMIN_SECRET env var
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Verify admin key from Authorization header
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token || token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const photoId = params.id
  if (!photoId) {
    return NextResponse.json({ error: 'Missing photo ID' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 2. Fetch the photo to get its storage path
  const { data: photo, error: fetchErr } = await admin
    .from('photos')
    .select('image_url, event_id')
    .eq('id', photoId)
    .single()

  if (fetchErr || !photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
  }

  // 3. Extract storage path from the public URL
  //    URL format: https://<project>.supabase.co/storage/v1/object/public/wedding-photos/<eventId>/<filename>
  const url = new URL(photo.image_url)
  const storagePath = url.pathname.split('/wedding-photos/')[1]

  // 4. Delete from storage
  if (storagePath) {
    const { error: storageErr } = await admin.storage
      .from('wedding-photos')
      .remove([storagePath])

    if (storageErr) {
      console.error('Storage delete error:', storageErr)
      // Continue to delete DB record even if storage delete fails
    }
  }

  // 5. Delete from database
  const { error: dbErr } = await admin
    .from('photos')
    .delete()
    .eq('id', photoId)

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

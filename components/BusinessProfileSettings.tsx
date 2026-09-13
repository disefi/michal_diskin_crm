'use client'
import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { saveBusinessProfile, saveBusinessAssetUrl } from '@/app/settings/actions'

type Profile = {
  business_name: string | null
  subtitle: string | null
  email: string | null
  phone1: string | null
  phone2: string | null
  business_number: string | null
  logo_url: string | null
  signature_url: string | null
}

export default function BusinessProfileSettings({ profile }: { profile: Profile }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [logoUrl, setLogoUrl] = useState(profile.logo_url)
  const [signatureUrl, setSignatureUrl] = useState(profile.signature_url)
  const [uploading, setUploading] = useState<'logo' | 'signature' | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await saveBusinessProfile(formData)
      if (result.error) setError(result.error)
      else setSuccess(true)
    })
  }

  async function handleUpload(field: 'logo_url' | 'signature_url', file: File) {
    setUploading(field === 'logo_url' ? 'logo' : 'signature')
    setError(null)
    try {
      const supabase = createClient()
      const path = `${field}-${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('business-assets').upload(path, file, {
        upsert: true,
      })
      if (uploadError) {
        setError('שגיאה בהעלאת הקובץ: ' + uploadError.message)
        setUploading(null)
        return
      }
      const { data: publicUrlData } = supabase.storage.from('business-assets').getPublicUrl(path)
      const url = publicUrlData.publicUrl

      const result = await saveBusinessAssetUrl(field, url)
      if (result.error) {
        setError(result.error)
      } else {
        if (field === 'logo_url') setLogoUrl(url)
        else setSignatureUrl(url)
      }
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-xl">
      <h2 className="text-lg font-semibold mb-1">פרטי העסק (לכותרת וחתימת ההצעה)</h2>
      <p className="text-sm text-gray-500 mb-4">מופיע בראש ובתחתית כל הצעת מחיר.</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">שם העסק</label>
          <input type="text" name="business_name" defaultValue={profile.business_name ?? ''} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">תת-כותרת (תפקיד)</label>
          <input type="text" name="subtitle" defaultValue={profile.subtitle ?? ''} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">אימייל</label>
            <input type="email" name="email" defaultValue={profile.email ?? ''} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">מס&apos; עוסק</label>
            <input type="text" name="business_number" defaultValue={profile.business_number ?? ''} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">טלפון</label>
            <input type="text" name="phone1" defaultValue={profile.phone1 ?? ''} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">וואטסאפ (רשות, אם שונה מהטלפון)</label>
            <input type="text" name="phone2" defaultValue={profile.phone2 ?? ''} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">{error}</div>}
        {success && <div className="p-3 bg-green-50 text-green-700 text-sm rounded border border-green-200">נשמר בהצלחה</div>}

        <button type="submit" disabled={isPending} className="px-4 py-1.5 text-sm bg-gray-800 text-white rounded disabled:opacity-50">
          שמירה
        </button>
      </form>

      <div className="mt-6 pt-4 border-t grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">לוגו</label>
          {logoUrl && <img src={logoUrl} alt="לוגו" className="h-16 mb-2 object-contain" />}
          <input
            type="file"
            accept="image/*"
            disabled={uploading === 'logo'}
            onChange={(e) => e.target.files?.[0] && handleUpload('logo_url', e.target.files[0])}
            className="text-xs"
          />
          {uploading === 'logo' && <p className="text-xs text-gray-400 mt-1">מעלה...</p>}
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">חתימה</label>
          {signatureUrl && <img src={signatureUrl} alt="חתימה" className="h-16 mb-2 object-contain" />}
          <input
            type="file"
            accept="image/*"
            disabled={uploading === 'signature'}
            onChange={(e) => e.target.files?.[0] && handleUpload('signature_url', e.target.files[0])}
            className="text-xs"
          />
          {uploading === 'signature' && <p className="text-xs text-gray-400 mt-1">מעלה...</p>}
        </div>
      </div>
    </div>
  )
}

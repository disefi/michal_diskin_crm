import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import CaseNumberSettings from '@/components/CaseNumberSettings'
import QuoteArchiveSettings from '@/components/QuoteArchiveSettings'
import BusinessProfileSettings from '@/components/BusinessProfileSettings'
import ProjectStatusesSettings from '@/components/ProjectStatusesSettings'
import NudnikSettings from '@/components/NudnikSettings'
import { ProjectStatus, NudnikSettings as NudnikSettingsType } from '@/lib/constants'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: settingsData } = await supabase
    .from('case_number_settings')
    .select('year, start_number')
    .order('year', { ascending: false })

  const { data: countersData } = await supabase
    .from('case_number_counters')
    .select('year, last_number')

  const { data: archiveSettingData } = await supabase
    .from('quote_archive_settings')
    .select('months')
    .eq('id', true)
    .maybeSingle()

  const { data: businessProfileData } = await supabase
    .from('business_profile')
    .select('business_name, subtitle, email, phone1, phone2, business_number, logo_url, signature_url')
    .eq('id', true)
    .maybeSingle()

  const { data: projectStatusesData } = await supabase
    .from('project_statuses')
    .select('id, label, color, sort_order, is_active, visible_in, stale_after_days')
    .order('sort_order', { ascending: true })

  const { data: nudnikSettingsData } = await supabase
    .from('nudnik_settings')
    .select('hide_badge_while_snoozed')
    .eq('id', true)
    .maybeSingle()
  const nudnikSettings: NudnikSettingsType = { hide_badge_while_snoozed: nudnikSettingsData?.hide_badge_while_snoozed ?? true }

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-4">הגדרות</h1>
      <div className="space-y-6">
        <BusinessProfileSettings
          profile={{
            business_name: businessProfileData?.business_name ?? null,
            subtitle: businessProfileData?.subtitle ?? null,
            email: businessProfileData?.email ?? null,
            phone1: businessProfileData?.phone1 ?? null,
            phone2: businessProfileData?.phone2 ?? null,
            business_number: businessProfileData?.business_number ?? null,
            logo_url: businessProfileData?.logo_url ?? null,
            signature_url: businessProfileData?.signature_url ?? null,
          }}
        />
        <ProjectStatusesSettings statuses={(projectStatusesData ?? []) as ProjectStatus[]} />
        <NudnikSettings settings={nudnikSettings} />
        <CaseNumberSettings settings={settingsData ?? []} counters={countersData ?? []} />
        <QuoteArchiveSettings months={archiveSettingData?.months ?? 12} />
      </div>
    </AppShell>
  )
}

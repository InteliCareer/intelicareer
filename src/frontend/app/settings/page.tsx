'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { CheckCircle2 } from 'lucide-react'

export default function SettingsPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [saved, setSaved] = useState(false)

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => userApi.me().then((r) => r.data),
  })

  const [form, setForm] = useState({
    name: user?.name || '',
    targetRole: '',
    targetLocation: '',
    yearsExperience: '',
    isRemotePreferred: false,
    linkedinUrl: '',
    githubUrl: '',
  })

  // Initialize form from profile
  useState(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        targetRole: profile.profile?.targetRole || '',
        targetLocation: profile.profile?.targetLocation || '',
        yearsExperience: profile.profile?.yearsExperience?.toString() || '',
        isRemotePreferred: profile.profile?.isRemotePreferred || false,
        linkedinUrl: profile.profile?.linkedinUrl || '',
        githubUrl: profile.profile?.githubUrl || '',
      })
    }
  })

  const mutation = useMutation({
    mutationFn: () => userApi.update({
      name: form.name,
      targetRole: form.targetRole,
      targetLocation: form.targetLocation,
      yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience) : undefined,
      isRemotePreferred: form.isRemotePreferred,
      linkedinUrl: form.linkedinUrl,
      githubUrl: form.githubUrl,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-profile'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  return (
    <div className="p-6 max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-100">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Update your profile and career preferences</p>
      </div>

      <div className="card p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-300">Profile</h2>

        <div>
          <label className="label">Full Name</label>
          <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div>
          <label className="label">Target Role</label>
          <input className="input" placeholder="Senior Backend Engineer" value={form.targetRole}
            onChange={(e) => set('targetRole', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Target Location</label>
            <input className="input" placeholder="Remote" value={form.targetLocation}
              onChange={(e) => set('targetLocation', e.target.value)} />
          </div>
          <div>
            <label className="label">Years of Experience</label>
            <input className="input" type="number" min={0} value={form.yearsExperience}
              onChange={(e) => set('yearsExperience', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isRemotePreferred}
              onChange={(e) => set('isRemotePreferred', e.target.checked)}
              className="w-4 h-4 accent-brand-500" />
            <span className="text-sm text-gray-400">Prefer remote opportunities</span>
          </label>
        </div>

        <h2 className="text-sm font-semibold text-gray-300 pt-2 border-t border-surface-border">Links</h2>
        <div>
          <label className="label">LinkedIn URL</label>
          <input className="input" placeholder="https://linkedin.com/in/..." value={form.linkedinUrl}
            onChange={(e) => set('linkedinUrl', e.target.value)} />
        </div>
        <div>
          <label className="label">GitHub URL</label>
          <input className="input" placeholder="https://github.com/..." value={form.githubUrl}
            onChange={(e) => set('githubUrl', e.target.value)} />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> Saved!
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

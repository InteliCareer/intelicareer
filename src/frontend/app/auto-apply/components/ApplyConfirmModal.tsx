'use client'

import { Check, Loader2 } from 'lucide-react'
import type { Job } from '@/lib/types'

export function ApplyConfirmModal({
  job, busy, onConfirm, onCancel,
}: {
  job: Job
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={() => !busy && onCancel()}
    >
      <div
        className="bg-surface-card border border-surface-border rounded-xl p-5 w-full max-w-md space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-gray-100">Did you apply?</h3>
        </div>
        <div>
          <p className="text-sm text-gray-200">{job.title}</p>
          <p className="text-xs text-gray-500">{job.company}</p>
        </div>
        <p className="text-xs text-gray-400">
          We'll only move this to your Applied tab if you confirm. Otherwise it stays where it was.
        </p>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 transition"
          >
            Not yet
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Yes, I applied
          </button>
        </div>
      </div>
    </div>
  )
}

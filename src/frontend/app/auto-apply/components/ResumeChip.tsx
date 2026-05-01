'use client'

import { FileText, Upload, Download, Trash2, Loader2 } from 'lucide-react'
import type { ResumeInfo } from '@/lib/types'

export function ResumeChip({
  resume, uploading, onUpload, onDownload, onRemove,
}: {
  resume: ResumeInfo | null
  uploading: boolean
  onUpload: () => void
  onDownload: () => void
  onRemove: () => void
}) {
  if (!resume?.hasResume) {
    return (
      <button
        onClick={onUpload}
        disabled={uploading}
        className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
      >
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        Upload CV
      </button>
    )
  }
  return (
    <div className="flex items-center gap-1 bg-surface-card border border-surface-border rounded-lg pl-2.5 pr-1 py-1">
      <FileText className="w-3.5 h-3.5 text-emerald-400" />
      <span className="text-xs text-gray-300 truncate max-w-[160px]" title={resume.fileName}>
        {resume.fileName}
      </span>
      <button onClick={onDownload}  className="p-1 text-gray-500 hover:text-brand-400 transition" title="Download"><Download className="w-3 h-3" /></button>
      <button onClick={onUpload} disabled={uploading} className="p-1 text-gray-500 hover:text-brand-400 transition disabled:opacity-50" title="Replace">
        {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
      </button>
      <button onClick={onRemove} className="p-1 text-gray-500 hover:text-red-400 transition" title="Remove"><Trash2 className="w-3 h-3" /></button>
    </div>
  )
}

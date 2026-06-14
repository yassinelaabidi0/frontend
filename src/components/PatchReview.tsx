import { useState } from 'react'
import { applyPatch, rejectPatch } from '../api/patches'
import type { PatchProposal } from '../types'
import DiffViewer from './DiffViewer'

type PatchReviewProps = {
  patch: PatchProposal
  onUpdate: (patch: PatchProposal) => void
}

export default function PatchReview({ patch, onUpdate }: PatchReviewProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleApply() {
    setBusy(true)
    setError(null)
    try {
      const updated = await applyPatch(patch.id)
      onUpdate(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply patch')
    } finally {
      setBusy(false)
    }
  }

  async function handleReject() {
    setBusy(true)
    setError(null)
    try {
      const updated = await rejectPatch(patch.id)
      onUpdate(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject patch')
    } finally {
      setBusy(false)
    }
  }

  const statusColor =
    patch.status === 'applied'
      ? 'text-emerald-400'
      : patch.status === 'rejected'
        ? 'text-red-400'
        : 'text-amber-400'

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-slate-700 bg-slate-900/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-100">{patch.title}</h3>
          <p className="mt-1 text-sm text-slate-400">{patch.explanation}</p>
        </div>
        <span className={`text-xs font-medium uppercase ${statusColor}`}>
          {patch.status}
        </span>
      </div>

      <DiffViewer file={patch.file} lines={patch.diff} />

      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-slate-500">Risks</p>
          <ul className="mt-1 list-inside list-disc text-slate-300">
            {patch.risks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Tests run</p>
          <ul className="mt-1 list-inside list-disc text-slate-300">
            {patch.testsRun.map((t) => (
              <li key={t}>
                <code className="font-mono text-xs">{t}</code>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Confidence: {(patch.confidence * 100).toFixed(0)}%
      </p>

      {patch.status === 'pending' && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleApply}
            disabled={busy}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            Apply patch
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={busy}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-300">{error}</p>
      )}
    </div>
  )
}

import type { PatchDiffLine } from '../types'

type DiffViewerProps = {
  file: string
  lines: PatchDiffLine[]
}

export default function DiffViewer({ file, lines }: DiffViewerProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
      <div className="border-b border-slate-700 bg-slate-800 px-4 py-2 font-mono text-xs text-slate-300">
        {file}
      </div>
      <pre className="overflow-x-auto p-0 text-xs leading-5">
        {lines.map((line, i) => (
          <div
            key={`${line.lineNumber}-${i}`}
            className={`flex font-mono ${
              line.type === 'add'
                ? 'bg-emerald-950/60 text-emerald-300'
                : line.type === 'remove'
                  ? 'bg-red-950/60 text-red-300'
                  : 'text-slate-400'
            }`}
          >
            <span className="w-10 shrink-0 select-none border-r border-slate-800 px-2 text-right text-slate-600">
              {line.lineNumber}
            </span>
            <span className="w-6 shrink-0 select-none text-center">
              {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
            </span>
            <span className="flex-1 whitespace-pre px-2">{line.content}</span>
          </div>
        ))}
      </pre>
    </div>
  )
}

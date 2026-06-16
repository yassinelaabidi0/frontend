export type MarkdownSegment =
  | { type: 'text'; content: string }
  | { type: 'code'; language: string; content: string }

const CODE_BLOCK_RE = /```(\w*)\n([\s\S]*?)```/g

export function parseMarkdown(text: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = CODE_BLOCK_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    segments.push({
      type: 'code',
      language: match[1] || 'text',
      content: match[2].replace(/\n$/, ''),
    })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: text }]
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

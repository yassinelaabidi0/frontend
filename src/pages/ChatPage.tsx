import { useRef, useState, type FormEvent } from 'react'
import { streamChatMessage } from '../api/chat'
import PatchReview from '../components/PatchReview'
import ProjectSelector from '../components/ProjectSelector'
import SourceCitationList from '../components/SourceCitationList'
import { useProject } from '../context/ProjectContext'
import type { ChatMessage, PatchProposal } from '../types'

export default function ChatPage() {
  const { selectedProject, explainMode } = useProject()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const bottomRef = useRef<HTMLDivElement>(null)

  function updatePatchInMessages(patch: PatchProposal) {
    setMessages((prev) =>
      prev.map((m) => (m.patch?.id === patch.id ? { ...m, patch } : m)),
    )
  }

  async function handleSend(event: FormEvent) {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isLoading || !selectedProject) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmed,
    }

    const assistantId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: 'assistant', text: '', streaming: true },
    ])
    setInput('')
    setError(null)
    setIsLoading(true)

    try {
      const stream = streamChatMessage({
        message: trimmed,
        project: selectedProject.name,
        explainMode,
        conversationId,
      })

      let fullText = ''
      let result = await stream.next()

      while (!result.done) {
        fullText += result.value
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, text: fullText, streaming: true } : m,
          ),
        )
        result = await stream.next()
      }

      const response = result.value
      setConversationId(response.conversationId)

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                text: response.response,
                streaming: false,
                sources: response.sources,
                patch: response.patch,
              }
            : m,
        ),
      )
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-slate-800 px-6 py-4">
        <h2 className="text-lg font-semibold">Chat</h2>
        <div className="mt-3">
          <ProjectSelector />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6">
        {messages.length === 0 && (
          <p className="text-center text-slate-500">
            Ask about your code, or try &quot;fix this bug&quot; to see a patch proposal.
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[85%] ${msg.role === 'user' ? 'ml-auto' : 'mr-auto'}`}
          >
            <div
              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-slate-100'
              }`}
            >
              {msg.text}
              {msg.streaming && (
                <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-violet-400" />
              )}
            </div>

            {msg.sources && <SourceCitationList sources={msg.sources} />}

            {msg.patch && (
              <PatchReview patch={msg.patch} onUpdate={updatePatchInMessages} />
            )}
          </div>
        ))}

        {error && (
          <p className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="flex gap-3 border-t border-slate-800 px-6 py-4"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your repo, a file, or a bug…"
          disabled={isLoading}
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-violet-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}

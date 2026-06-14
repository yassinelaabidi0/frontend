import type { ChatRequest, ChatResponse } from '../types'
import { apiRequest, tryApiOrMock } from './client'
import { mockChat } from './devMocks'

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  return tryApiOrMock(
    () => apiRequest<ChatResponse>('/chat', { method: 'POST', body: request }),
    () => mockChat(request),
  )
}

export async function* streamChatMessage(
  request: ChatRequest,
): AsyncGenerator<string, ChatResponse, undefined> {
  const full = await sendChatMessage(request)
  const words = full.response.split(/(\s+)/)

  for (const word of words) {
    yield word
    await new Promise((r) => setTimeout(r, 25))
  }

  return full
}

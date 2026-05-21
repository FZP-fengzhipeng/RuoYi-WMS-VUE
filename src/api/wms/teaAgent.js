import { getToken } from '@/utils/auth'

/**
 * SSE 流式对话（仅查询）
 * @param {string} message 用户问题
 * @param {Array<{role: string, content: string, lastOrderNo?: string, moduleLabel?: string}>} history 会话历史
 * @param {(event: {event: string, data: string}) => void} onEvent
 */
export async function streamTeaAgentChat(message, history, onEvent) {
  const baseURL = import.meta.env.VITE_APP_BASE_API
  const response = await fetch(`${baseURL}/wms/teaAgent/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + getToken(),
      'Content-Language': 'zh_CN'
    },
    body: JSON.stringify({ message, history: history || [] })
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || '请求失败')
  }
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() || ''
    for (const part of parts) {
      if (!part.trim()) continue
      let event = 'message'
      let data = ''
      part.split('\n').forEach(line => {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        if (line.startsWith('data:')) data += line.slice(5).trim()
      })
      if (data) onEvent({ event, data })
    }
  }
}

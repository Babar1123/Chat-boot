import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api, { errorText } from '../services/api'
import { useAuthStore } from './auth'

export const useAppStore = defineStore('app', () => {
  const settings = ref({ name: '', email: '', has_api_key: false, has_user_api_key: false, api_key_hint: null, default_model: '', theme: 'system' })
  const storedTheme = localStorage.getItem('theme')
  const theme = ref(['light', 'dark', 'system'].includes(storedTheme) ? storedTheme : 'system')
  const models = ref([])
  const chats = ref([])
  const activeId = ref(null)
  const sideOpen = ref(false)
  const toast = ref('')
  const sending = ref(false)
  const cancellationsKey = 'lumio_pending_cancellations'
  let timer
  let sendController = null
  let pendingRequest = null

  function readPendingCancellations() {
    try {
      const entries = JSON.parse(localStorage.getItem(cancellationsKey) || '[]')
      return Array.isArray(entries) ? entries : []
    } catch (error) {
      notify(`Could not read pending cancellations: ${errorText(error)}`)
      return []
    }
  }

  async function flushPendingCancellations() {
    const email = useAuthStore().user?.email
    const entries = readPendingCancellations().filter((entry) => entry.email === email)

    for (const entry of entries) {
      try {
        await api.cancelMessage(entry.conversationId, entry.requestId)
        const remaining = readPendingCancellations().filter((item) =>
          item.email !== entry.email || item.requestId !== entry.requestId)
        localStorage.setItem(cancellationsKey, JSON.stringify(remaining))
      } catch (error) {
        notify(`Could not confirm cancellation: ${errorText(error)}`)
        return false
      }
    }

    return true
  }

  function removePendingMessages(request) {
    if (!request) return
    const bubbleIndex = request.chat.messages.indexOf(request.bubble)
    if (bubbleIndex >= 0) request.chat.messages.splice(bubbleIndex, 1)
    const userIndex = request.chat.messages.indexOf(request.userBubble)
    if (userIndex >= 0) request.chat.messages.splice(userIndex, 1)
  }

  function finishSend(request) {
    if (!request.settled || (request.cancelPromise && !request.cancelSettled)) return
    if (pendingRequest === request) {
      sendController = null
      pendingRequest = null
      sending.value = false
    }
  }

  const active = computed(() => chats.value.find((chat) => chat.id === activeId.value) || chats.value[0] || null)
  const modelName = computed(() => models.value.find((model) => model.id === settings.value.default_model)?.name || 'Choose a model')
  const isDark = computed(() => theme.value === 'dark' ||
    (theme.value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))

  function applyTheme(value) {
    if (value === 'system') document.documentElement.removeAttribute('data-theme')
    else document.documentElement.dataset.theme = value
    localStorage.setItem('theme', value)
  }

  applyTheme(theme.value)

  function notify(text) {
    toast.value = text
    clearTimeout(timer)
    timer = setTimeout(() => (toast.value = ''), 2200)
  }

  async function run(fn, okText) {
    try {
      await fn()
      if (okText) notify(okText)
      return true
    } catch (error) {
      notify(errorText(error))
      return false
    }
  }

  async function init() {
    if (!(await flushPendingCancellations())) return

    try {
      settings.value = await api.getSettings()
      theme.value = settings.value.theme || theme.value
      applyTheme(theme.value)
    } catch (error) { notify(errorText(error)) }
    try { models.value = await api.getModels() } catch { notify('Could not load models') }

    try {
      const page = await api.getConversations()
      chats.value = (page.data || []).map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        model: conversation.model,
        messages: (conversation.messages || []).map((message) => ({
          role: message.role === 'assistant' ? 'ai' : 'user',
          text: message.content,
        })),
      }))
      if (!chats.value.length) await newChat()
      else activeId.value = chats.value[0].id
    } catch (error) {
      chats.value = []
      activeId.value = null
      notify(errorText(error))
    }
  }

  const reload = async () => (settings.value = await api.getSettings())

  const saveKey = async (key) => (await run(() => api.saveKey(key), 'API key saved')) && (await reload(), true)
  const deleteKey = async () => (await run(() => api.deleteKey(), 'API key deleted')) && (await reload(), true)
  const saveModel = (id) => run(async () => {
    await api.saveModel(id)
    settings.value.default_model = id
  }, 'Model changed')
  const saveProfile = (p) => run(async () => {
    await api.saveProfile(p)
    useAuthStore().updateUser(p)
  }, 'Profile updated')
  const savePassword = (p) => run(() => api.savePassword(p), 'Password changed')
  async function toggleTheme() {
    const previous = theme.value
    const next = isDark.value ? 'light' : 'dark'
    theme.value = next
    applyTheme(next)

    try {
      await api.updateSettings({ theme: next })
      settings.value.theme = next
    } catch (error) {
      theme.value = previous
      applyTheme(previous)
      notify(errorText(error))
    }
  }

  async function newChat() {
    try {
      const conversation = await api.createConversation({
        title: 'New chat',
        model: settings.value.default_model || null,
      })
      chats.value.unshift({ id: conversation.id, title: conversation.title, model: conversation.model, messages: [] })
      activeId.value = conversation.id
    } catch (error) {
      notify(errorText(error))
    }
  }

  async function select(id) {
    activeId.value = id
    try {
      const conversation = await api.getConversation(id)
      const chat = chats.value.find((item) => item.id === id)
      if (chat) {
        chat.title = conversation.title
        chat.model = conversation.model
        chat.messages = (conversation.messages || []).map((message) => ({
          role: message.role === 'assistant' ? 'ai' : 'user',
          text: message.content,
        }))
      }
    } catch (error) {
      notify(errorText(error))
    }
  }

  async function deleteChat(id) {
    if (!(await run(() => api.deleteConversation(id), 'Conversation deleted'))) return
    chats.value = chats.value.filter((chat) => chat.id !== id)
    if (activeId.value === id) {
      if (chats.value.length) activeId.value = chats.value[0].id
      else await newChat()
    }
  }

  async function deleteAllChats() {
    if (!(await run(() => api.deleteAllConversations(), 'Chat history deleted'))) return
    chats.value = []
    await newChat()
  }

  function reset() {
    settings.value = { name: '', email: '', has_api_key: false, has_user_api_key: false, api_key_hint: null, default_model: '', theme: 'system' }
    models.value = []
    chats.value = []
    activeId.value = null
    if (pendingRequest) pendingRequest.cancelled = true
    sendController?.abort()
    sendController = null
    pendingRequest = null
    sending.value = false
  }

  function stopSending() {
    if (!pendingRequest) return
    const request = pendingRequest
    request.cancelled = true
    removePendingMessages(request)
    const queue = readPendingCancellations()
    queue.push({
      email: useAuthStore().user?.email,
      conversationId: request.chat.id,
      requestId: request.id,
    })
    localStorage.setItem(cancellationsKey, JSON.stringify(queue))
    request.cancelPromise = flushPendingCancellations()
      .finally(() => {
        request.cancelSettled = true
        request.controller.abort()
        finishSend(request)
      })
    request.controller.abort()
  }

  async function send(text) {
    if (sending.value) return 'sent'

    if (!settings.value.has_api_key) {
      notify('Please save your API key in Settings first')
      return 'needs-settings'
    }

    const chat = active.value
    if (!chat) return 'sent'

    const controller = new AbortController()
    const requestId = crypto.randomUUID()
    const userBubble = { role: 'user', text }
    const bubble = { role: 'ai', text: '', loading: true }
    const request = { id: requestId, controller, chat, userBubble, bubble, cancelled: false, settled: false }
    sending.value = true
    sendController = controller
    pendingRequest = request
    if (chat.title === 'New chat') chat.title = text.slice(0, 32)
    chat.messages.push(userBubble)
    chat.messages.push(bubble)

    try {
      const result = api.sendMessage
        ? await api.sendMessage(chat.id, { content: text, model: settings.value.default_model, request_id: requestId }, { signal: controller.signal })
        : await api.chat(settings.value.default_model, chat.messages.slice(0, -1).map((message) => ({
            role: message.role === 'ai' ? 'assistant' : 'user',
            content: message.text,
          })), { signal: controller.signal }).then((reply) => ({ reply }))

      if (request.cancelled) return 'cancelled'
      bubble.loading = false
      bubble.text = result.reply

      if (result.conversation_id) {
        chat.id = result.conversation_id
        activeId.value = result.conversation_id
      }
      if (result.messages?.user && result.messages?.assistant) {
        const userIndex = chat.messages.indexOf(userBubble)
        const assistantIndex = chat.messages.indexOf(bubble)
        if (userIndex >= 0 && assistantIndex === userIndex + 1) {
          chat.messages.splice(userIndex, 2,
            { role: 'user', text: result.messages.user.content },
            { role: 'ai', text: result.messages.assistant.content })
        }
      }
    } catch (error) {
      if (request.cancelled || error.code === 'ERR_CANCELED' || error.name === 'AbortError') {
        removePendingMessages(request)
        return 'cancelled'
      }

      bubble.loading = false
      bubble.text = errorText(error)
    } finally {
      request.settled = true
      finishSend(request)
    }

    return 'sent'
  }

  return {
    settings, models, chats, activeId, active, sideOpen, toast, sending, modelName, theme, isDark,
    init, saveKey, deleteKey, saveModel, saveProfile, savePassword,
    newChat, select, deleteChat, deleteAllChats, send, stopSending, notify, reset, toggleTheme,
  }
})

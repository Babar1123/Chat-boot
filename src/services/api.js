import axios from 'axios'

const MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const wait = (ms, signal) => new Promise((resolve, reject) => {
  if (signal?.aborted) {
    reject(new DOMException('Request was cancelled.', 'AbortError'))
    return
  }

  const timer = setTimeout(() => {
    signal?.removeEventListener('abort', cancel)
    resolve()
  }, ms)
  const cancel = () => {
    clearTimeout(timer)
    reject(new DOMException('Request was cancelled.', 'AbortError'))
  }
  signal?.addEventListener('abort', cancel, { once: true })
})

const http = axios.create({ baseURL: '/api', headers: { Accept: 'application/json' } })
http.interceptors.request.use((c) => {
  const token = localStorage.getItem('token')
  if (token) c.headers.Authorization = `Bearer ${token}`
  return c
})
// Expired or invalid token: send the user to login
http.interceptors.response.use((r) => r, (e) => {
  if (e.response?.status === 401 && !/^\/(login|signup)/.test(location.pathname)) {
    localStorage.removeItem('token'); localStorage.removeItem('user')
    location.href = '/login'
  }
  return Promise.reject(e)
})

/* ---------- Mock (VITE_USE_MOCK=true): users are kept in the browser's localStorage ---------- */
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
const store = (k, v) => localStorage.setItem(k, JSON.stringify(v))
const fail = (message, status = 422) => Promise.reject({ response: { status, data: { message } } })
const users = () => load('lumio_users', [])
const currentEmail = () => localStorage.getItem('lumio_current')
const current = () => users().find((u) => u.email === currentEmail())
const patch = (p) => {
  const all = users(); const u = all.find((x) => x.email === currentEmail())
  Object.assign(u, p); store('lumio_users', all)
  if (p.email) localStorage.setItem('lumio_current', p.email)
  return u
}
const pub = (u) => ({ name: u.name, email: u.email })
const view = (u) => ({ ...pub(u), default_model: u.default_model, theme: u.theme || 'system', has_api_key: !!u.key,
  has_user_api_key: !!u.key, api_key_hint: u.key ? 'sk-or-••••' + u.key.slice(-4) : null })
const session = (u) => { localStorage.setItem('lumio_current', u.email); return { token: 'mock-token', user: pub(u) } }
const conversationsKey = () => `lumio_conversations_${encodeURIComponent(currentEmail() || '')}`
const conversations = () => load(conversationsKey(), [])
const saveConversations = (items) => store(conversationsKey(), items)

const MODELS = [
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini 1.5 Pro' },
  { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B' },
  { id: 'mistralai/mistral-large', name: 'Mistral Large' },
]

const mock = {
  async register(p) {
    await wait(500)
    if (users().some((u) => u.email === p.email)) return fail('This email is already registered.')
    if ((p.password || '').length < 8) return fail('Password must be at least 8 characters.')
    const u = { name: p.name, email: p.email, password: p.password, key: '', default_model: MODELS[0].id, theme: 'system' }
    store('lumio_users', [...users(), u])
    return { message: 'Account created. Please log in.', user: pub(u) }
  },
  async login(p) {
    await wait(500)
    const u = users().find((x) => x.email === p.email && x.password === p.password)
    return u ? session(u) : fail('Incorrect email or password.')
  },
  async logout() { await wait(150); localStorage.removeItem('lumio_current') },
  async getSettings() { await wait(250); const u = current(); return u ? view(u) : fail('Please log in again.', 401) },
  async getModels() { await wait(250); return MODELS },
  async saveKey(key) { await wait(400); patch({ key }) },
  async deleteKey() { await wait(200); patch({ key: '' }) },
  async saveModel(id) { await wait(150); patch({ default_model: id }) },
  async updateSettings(p) {
    await wait(150)
    const user = patch(p)
    return { message: 'Settings updated.', settings: { theme: user.theme, default_model: user.default_model } }
  },
  async saveProfile(p) {
    await wait(300)
    if (users().some((u) => u.email === p.email && u.email !== currentEmail())) return fail('This email is already registered.')
    patch({ name: p.name, email: p.email })
  },
  async savePassword(p) {
    await wait(300)
    if (current().password !== p.current_password) return fail('Current password is incorrect.')
    if (p.password !== p.password_confirmation) return fail('New passwords do not match.')
    if (p.password.length < 8) return fail('Password must be at least 8 characters.')
    patch({ password: p.password })
  },
  async getConversations() {
    await wait(150)
    return { data: conversations().sort((a, b) => b.id - a.id) }
  },
  async createConversation(p = {}) {
    await wait(100)
    const item = { id: Date.now() + Math.random(), title: p.title || 'New chat', model: p.model || null, messages: [] }
    saveConversations([item, ...conversations()])
    return item
  },
  async getConversation(id) {
    await wait(100)
    const item = conversations().find((entry) => String(entry.id) === String(id))
    return item || fail('Conversation not found.', 404)
  },
  async deleteConversation(id) {
    await wait(100)
    saveConversations(conversations().filter((item) => String(item.id) !== String(id)))
  },
  async deleteAllConversations() {
    await wait(100)
    saveConversations([])
  },
  async sendMessage(id, p, { signal } = {}) {
    const items = conversations()
    const item = items.find((entry) => String(entry.id) === String(id))
    if (!item) return fail('Conversation not found.', 404)

    const reply = await mock.chat(p.model, signal)
    if (signal?.aborted) throw new DOMException('Request was cancelled.', 'AbortError')
    const userMessage = { id: Date.now(), role: 'user', content: p.content }
    item.messages.push(userMessage)
    const assistantMessage = { id: Date.now() + 1, role: 'assistant', content: reply }
    item.messages.push(assistantMessage)
    item.model = p.model || item.model
    if (item.title === 'New chat') item.title = p.content.slice(0, 32)
    saveConversations(items)
    return { reply, conversation_id: item.id, messages: { user: userMessage, assistant: assistantMessage } }
  },
  async cancelMessage() {},
  async chat(model, signal) {
    await wait(1100, signal)
    return `Great question! This is a demo reply from ${model}. Real answers will appear once the backend is connected.`
  },
}

/* ---------- Real API (Laravel + Sanctum) ---------- */
const real = {
  register: (p) => http.post('/register', p).then((r) => r.data),
  login: (p) => http.post('/login', p).then((r) => r.data),
  me: () => http.get('/me').then((r) => r.data.user),
  logout: () => http.post('/logout'),
  updateUser: (p) => http.patch('/user', p).then((r) => r.data.user),
  uploadAvatar: (file) => {
    const form = new FormData()
    form.append('avatar', file)
    return http.post('/user/avatar', form).then((r) => r.data.user)
  },
  deleteAvatar: () => http.delete('/user/avatar').then((r) => r.data.user),
  changePassword: (p) => http.put('/user/password', p).then((r) => r.data),
  deleteAccount: (password) => http.delete('/user', { data: { password } }).then((r) => r.data),

  getSettings: () => http.get('/settings').then((r) => r.data),
  updateSettings: (p) => http.patch('/settings', p).then((r) => r.data),
  saveKey: (api_key) => http.put('/settings/api-key', { api_key }),
  deleteKey: () => http.delete('/settings/api-key'),
  saveModel: (default_model) => http.put('/settings/model', { default_model }).catch((e) => { throw e }),
  saveProfile: (p) => http.put('/settings/profile', p),
  savePassword: (p) => http.put('/settings/password', p),

  getModels: () => http.get('/models').then((r) => r.data.data),
  chat: (model, messages, { signal } = {}) => http.post('/chat', { model, messages }, { signal }).then((r) => r.data.reply),

  getConversations: (page = 1) => http.get('/conversations', { params: { page } }).then((r) => r.data),
  getConversation: (id) => http.get(`/conversations/${id}`).then((r) => r.data.conversation),
  createConversation: (p = {}) => http.post('/conversations', p).then((r) => r.data.conversation),
  updateConversation: (id, p) => http.patch(`/conversations/${id}`, p).then((r) => r.data.conversation),
  deleteConversation: (id) => http.delete(`/conversations/${id}`).then((r) => r.data),
  deleteAllConversations: () => http.delete('/conversations').then((r) => r.data),

  getMessages: (conversationId, page = 1) => http.get(`/conversations/${conversationId}/messages`, { params: { page } }).then((r) => r.data),
  sendMessage: (conversationId, p, { signal } = {}) => http.post(`/conversations/${conversationId}/messages`, p, { signal }).then((r) => r.data),
  cancelMessage: (conversationId, requestId) => http.post(`/conversations/${conversationId}/messages/cancel`, { request_id: requestId }).then((r) => r.data),
  regenerateMessage: (conversationId) => http.post(`/conversations/${conversationId}/messages/regenerate`).then((r) => r.data),
  deleteMessage: (conversationId, messageId) => http.delete(`/conversations/${conversationId}/messages/${messageId}`).then((r) => r.data),
}

export default MOCK ? mock : real

export const errorText = (e) =>
  Object.values(e.response?.data?.errors || {})[0]?.[0] ||
  e.response?.data?.message || 'Something went wrong.'

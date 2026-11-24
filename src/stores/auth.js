import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const initials = computed(() =>
    (user.value?.name || '?').split(' ').filter(Boolean).map((word) => word[0]).slice(0, 2).join('').toUpperCase())

  function setSession({ token: t, user: u }) {
    token.value = t
    user.value = u
    localStorage.setItem('token', t)
    localStorage.setItem('user', JSON.stringify(u))
  }

  function updateUser(profile) {
    user.value = { ...user.value, ...profile }
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  const login = async (payload) => setSession(await api.login(payload))
  const register = (payload) => api.register(payload)
  const refreshUser = async () => updateUser(await api.me())

  async function logout() {
    try { await api.logout() } catch { /* Clear local session even if the server token is already invalid. */ }
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const updateProfile = async (payload) => updateUser(await api.updateUser(payload))
  const uploadAvatar = async (file) => updateUser(await api.uploadAvatar(file))
  const deleteAvatar = async () => updateUser(await api.deleteAvatar())
  const deleteAccount = async (password) => {
    await api.deleteAccount(password)
    await logout()
  }

  return {
    token, user, isLoggedIn, initials, login, register, logout, updateUser,
    refreshUser, updateProfile, uploadAvatar, deleteAvatar, deleteAccount,
  }
})

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '../stores/auth'

const s = useAppStore()
const auth = useAuthStore()
const router = useRouter()
const profile = reactive({ name: auth.user?.name || '', email: auth.user?.email || '' })
const pw = reactive({ current_password: '', password: '', password_confirmation: '' })

async function savePassword() { if (await s.savePassword(pw)) Object.keys(pw).forEach((k) => (pw[k] = '')) }
async function logout() { await auth.logout(); s.reset(); router.push('/login') }
</script>

<template>
  <section class="view"><div class="set"><div class="cards">
    <!-- Profile -->
    <div class="card">
      <div class="phead">
        <div class="avatar">{{ auth.initials }}</div>
        <div class="info">
          <h3>{{ auth.user?.name }}</h3>
          <div class="em">{{ auth.user?.email }}</div>
        </div>
        <button class="btn d" @click="logout">Logout</button>
      </div>
    </div>

    <RouterLink class="btn p ai-settings-link" to="/settings/ai">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.64 5.64l2.12 2.12m8.48 8.48 2.12 2.12m0-12.72-2.12 2.12m-8.48 8.48-2.12 2.12" />
        <circle cx="12" cy="12" r="5" />
      </svg>
      AI Settings — models and API key
    </RouterLink>

    <div class="card">
      <h3>Edit profile</h3><small>Update your name and email.</small>
      <input v-model="profile.name" class="f" placeholder="Name" />
      <input v-model="profile.email" class="f" type="email" placeholder="Email" />
      <button class="btn p" @click="s.saveProfile(profile)">Save Profile</button>
    </div>

    <div class="card">
      <h3>Password</h3><small>Enter your current password to set a new one.</small>
      <input v-model="pw.current_password" class="f" type="password" placeholder="Current password" />
      <input v-model="pw.password" class="f" type="password" placeholder="New password" />
      <input v-model="pw.password_confirmation" class="f" type="password" placeholder="Confirm new password" />
      <button class="btn p" @click="savePassword">Change Password</button>
    </div>
  </div></div></section>
</template>

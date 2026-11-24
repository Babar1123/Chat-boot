<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { errorText } from '../services/api'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const signup = computed(() => route.path === '/signup')
const f = reactive({
  name: '', email: '', password: '', password_confirmation: '',
})
const show = ref(false)
const busy = ref(false)
const error = ref('')
const success = ref('')

watch(() => route.query.registered, (registered) => {
  if (registered === '1') success.value = 'Account created successfully. Please log in.'
}, { immediate: true })

async function submit() {
  if (busy.value) return

  error.value = ''
  success.value = ''

  if (signup.value && f.password !== f.password_confirmation) {
    error.value = 'Passwords do not match.'
    return
  }

  busy.value = true
  try {
    if (signup.value) {
      await auth.register({ name: f.name, email: f.email, password: f.password, password_confirmation: f.password_confirmation })
      router.replace({ path: '/login', query: { registered: '1' } })
    } else {
      await auth.login({ email: f.email, password: f.password })
      router.push('/')
    }
  } catch (e) {
    error.value = errorText(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="auth">
    <form class="auth-card" @submit.prevent="submit">
      <div class="brand"><div class="logo">✦</div>Lumio <span class="muted">AI</span></div>
      <h2>{{ signup ? 'Create your account' : 'Welcome back' }}</h2>
      <p class="sub">{{ signup ? 'Get started in a few seconds.' : 'Log in to your account.' }}</p>

      <div v-if="error" class="err">{{ error }}</div>
      <div v-if="success" class="ok">{{ success }}</div>

      <input v-if="signup" v-model="f.name" class="f" placeholder="Full name" required autocomplete="name" />
      <input v-model="f.email" class="f" type="email" placeholder="Email" required autocomplete="email" />

      <div class="pwrow">
        <input v-model="f.password" class="f" :type="show ? 'text' : 'password'" placeholder="Password"
          required minlength="8" :autocomplete="signup ? 'new-password' : 'current-password'" />
        <button type="button" :aria-label="show ? 'Hide password' : 'Show password'" @click="show = !show">{{ show ? '🙈' : '👁' }}</button>
      </div>

      <input v-if="signup" v-model="f.password_confirmation" class="f" :type="show ? 'text' : 'password'"
        placeholder="Confirm password" required autocomplete="new-password" />

      <button class="btn p" :disabled="busy">
        {{ busy ? 'Please wait…' : signup ? 'Sign up' : 'Login' }}
      </button>

      <p class="switch">
        <template v-if="signup">Already have an account? <RouterLink to="/login">Login</RouterLink></template>
        <template v-else>New here? <RouterLink to="/signup">Create an account</RouterLink></template>
      </p>
    </form>
  </div>
</template>

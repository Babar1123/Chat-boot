<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from './stores/app'
import { useAuthStore } from './stores/auth'
import Sidebar from './components/Sidebar.vue'

const s = useAppStore()
const auth = useAuthStore()
const route = useRoute()

// Load settings and models as soon as the user logs in
watch(() => auth.isLoggedIn, (v) => v && s.init(), { immediate: true })
watch(() => route.path, () => (s.sideOpen = false))

function chooseModel(event) {
  const model = event.target.value
  if (model) s.saveModel(model)
}
</script>

<template>
  <div class="orb"></div><div class="orb b"></div>
  <RouterView v-if="route.meta.guest" />
  <div v-else class="app">
    <Sidebar />
    <main class="main">
      <header class="top">
        <button class="burger" aria-label="Menu" @click="s.sideOpen = true">☰</button>
        <strong>{{ route.meta.title }}</strong>
        <label class="model-picker" title="Choose a model">
          <i></i>
          <select :value="s.settings.default_model" aria-label="Choose a model" @change="chooseModel">
            <option value="" disabled>Choose a model</option>
            <option v-for="model in s.models" :key="model.id" :value="model.id">{{ model.name }}</option>
          </select>
        </label>
        <button class="theme-toggle" type="button" :aria-label="s.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          :title="s.isDark ? 'Switch to light mode' : 'Switch to dark mode'" @click="s.toggleTheme()">
          <svg v-if="s.isDark" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
          </svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
          </svg>
        </button>
      </header>
      <RouterView />
    </main>
  </div>
  <div class="toast" :class="{ on: s.toast }">{{ s.toast }}</div>
</template>

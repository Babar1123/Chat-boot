<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../stores/app'

const s = useAppStore()
const apiKey = ref('')
const search = ref('')

const filtered = computed(() =>
  s.models.filter((model) => (model.name + model.id).toLowerCase().includes(search.value.toLowerCase())))

async function saveKey() {
  if (await s.saveKey(apiKey.value)) apiKey.value = ''
}

async function removeKey() {
  if (confirm('Delete your API key?')) await s.deleteKey()
}
</script>

<template>
  <section class="view">
    <div class="set">
      <div class="cards">
        <RouterLink class="settings-back" to="/settings">← Back to profile settings</RouterLink>

        <div class="card">
          <h3>Choose your chatbot</h3>
          <small>Click any chatbot to make it your default instantly.</small>
          <input v-model="search" class="f" placeholder="Search chatbots…" />
          <div class="mlist">
            <button v-for="model in filtered" :key="model.id" class="mopt"
              :class="{ on: model.id === s.settings.default_model }" @click="s.saveModel(model.id)">
              <span class="dot"></span><b>{{ model.name }}</b><span class="mid">{{ model.id }}</span>
            </button>
            <p v-if="!filtered.length" class="muted">No models found.</p>
          </div>
        </div>

        <div class="card">
          <h3>OpenRouter API Key</h3>
          <small>Your key is stored encrypted.</small>
          <p v-if="s.settings.has_api_key" class="ok">
            ✓ {{ s.settings.has_user_api_key ? `Key saved: ${s.settings.api_key_hint}` : 'An API key is configured by the server.' }}
          </p>
          <div class="row">
            <input v-model="apiKey" class="f" type="password" placeholder="sk-or-..." autocomplete="off" />
            <button class="btn p" :disabled="!apiKey" @click="saveKey">
              {{ s.settings.has_user_api_key ? 'Update' : 'Save' }}
            </button>
            <button v-if="s.settings.has_user_api_key" class="btn d" @click="removeKey">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

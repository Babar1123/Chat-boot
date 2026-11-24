<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { useAppStore } from '../stores/app'
import { useRouter } from 'vue-router'

const s = useAppStore()
const router = useRouter()
const input = ref('')
const box = ref(null)
const messages = computed(() => s.active?.messages || [])
const suggestions = ['Explain a Vue component', 'Write a Laravel API', 'Draft a cover letter']

async function send(text = input.value) {
  text = text.trim()
  if (!text || s.sending) return
  input.value = ''
  const result = await s.send(text)
  if (result === 'needs-settings') {
    input.value = text
    router.push('/settings')
  } else if (result === 'cancelled') {
    input.value = text
  }
}

// Scroll to the bottom on new messages and while typing
watch(() => messages.value.map((m) => m.text.length + (m.loading ? 1 : 0)), async () => {
  await nextTick()
  if (box.value) box.value.scrollTop = box.value.scrollHeight
})
</script>

<template>
  <section class="view">
    <div ref="box" class="msgs">
      <div class="msg-content">
        <div v-if="!messages.length" class="hero">
          <div class="logo big">✦</div>
          <h1>Hello there!</h1>
          <p>I’m Lumio. What would you like to learn or build today?</p>
          <div class="sug"><button v-for="t in suggestions" :key="t" @click="send(t)">{{ t }}</button></div>
        </div>
        <div v-for="(m, i) in messages" :key="i" class="m" :class="m.role === 'user' ? 'u' : 'a'">
          <span v-if="m.loading" class="dots"><i></i><i></i><i></i></span>
          <template v-else>{{ m.text }}</template>
        </div>
      </div>
    </div>
    <div class="comp">
      <div class="box">
        <input v-model="input" placeholder="Ask Lumio anything…" autocomplete="off" :disabled="s.sending" @keydown.enter="send()" />
        <button v-if="s.sending" class="btn stop" type="button" @click="s.stopSending()">Stop</button>
        <button v-else class="btn p" type="button" :disabled="!input.trim()" @click="send()">Send ➤</button>
      </div>
    </div>
  </section>
</template>

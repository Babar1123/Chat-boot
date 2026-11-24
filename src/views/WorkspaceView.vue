<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'

const route = useRoute()
const router = useRouter()
const s = useAppStore()
const projectName = ref('')
const projects = ref(JSON.parse(localStorage.getItem('lumio-projects') || '[]'))

const page = computed(() => route.meta.workspace)

function openChat(chat) {
  s.select(chat.id)
  router.push('/')
}

function addProject() {
  const name = projectName.value.trim()
  if (!name) return
  projects.value.unshift({ id: crypto.randomUUID(), name })
  localStorage.setItem('lumio-projects', JSON.stringify(projects.value))
  projectName.value = ''
}

function removeProject(id) {
  projects.value = projects.value.filter((project) => project.id !== id)
  localStorage.setItem('lumio-projects', JSON.stringify(projects.value))
}
</script>

<template>
  <section class="view">
    <div class="set">
      <div class="workspace">
        <template v-if="page === 'library'">
          <h1>Library</h1>
          <p class="workspace-subtitle">Your saved conversations</p>
          <div v-if="s.chats.length" class="workspace-grid">
            <button v-for="chat in s.chats" :key="chat.id" class="workspace-card" type="button" @click="openChat(chat)">
              <b>{{ chat.title }}</b>
              <span>{{ chat.messages.length }} messages</span>
            </button>
          </div>
          <div v-else class="workspace-empty">No conversations yet.</div>
        </template>

        <template v-else-if="page === 'projects'">
          <h1>Projects</h1>
          <p class="workspace-subtitle">Keep related work organized</p>
          <form class="project-form" @submit.prevent="addProject">
            <input v-model="projectName" class="f" placeholder="Project name" aria-label="Project name" />
            <button class="btn p" type="submit" :disabled="!projectName.trim()">Create project</button>
          </form>
          <div v-if="projects.length" class="workspace-grid">
            <article v-for="project in projects" :key="project.id" class="workspace-card project-card">
              <b>{{ project.name }}</b>
              <button class="icon-btn" type="button" :aria-label="`Delete ${project.name}`" @click="removeProject(project.id)">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" /></svg>
              </button>
            </article>
          </div>
          <div v-else class="workspace-empty">Create your first project.</div>
        </template>

        <template v-else-if="page === 'plugins'">
          <h1>Plugins</h1>
          <p class="workspace-subtitle">Extensions and tools</p>
          <div class="workspace-empty">No plugins are installed.</div>
        </template>

        <template v-else>
          <h1>Explore</h1>
          <p class="workspace-subtitle">Discover tools and conversations</p>
          <div class="workspace-grid">
            <button class="workspace-card" type="button" @click="router.push('/')">
              <b>Start a new chat</b>
              <span>Create and explore an idea</span>
            </button>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

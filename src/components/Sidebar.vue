<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '../stores/auth'

const s = useAppStore()
const auth = useAuthStore()
const router = useRouter()
const profileArea = ref(null)
const profileOpen = ref(false)
const open = (id) => { s.select(id); router.push('/') }
const create = () => { s.newChat(); router.push('/') }
function closeProfileOnOutsideClick(event) {
  if (!profileArea.value?.contains(event.target)) profileOpen.value = false
}
function closeProfileOnEscape(event) {
  if (event.key === 'Escape') profileOpen.value = false
}
onMounted(() => {
  document.addEventListener('pointerdown', closeProfileOnOutsideClick)
  document.addEventListener('keydown', closeProfileOnEscape)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeProfileOnOutsideClick)
  document.removeEventListener('keydown', closeProfileOnEscape)
})
async function logout() {
  profileOpen.value = false
  await auth.logout()
  s.reset()
  router.push('/login')
}
</script>

<template>
  <aside class="side" :class="{ open: s.sideOpen }">
    <button class="btn p new-chat" type="button" @click="create">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      <span>New chat</span>
    </button>
    <div class="sidebar-nav" aria-label="Workspace navigation">
      <RouterLink class="sidebar-nav-item" to="/library" @click="s.sideOpen = false">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="4" width="5" height="16" rx="1" />
          <rect x="10" y="4" width="5" height="16" rx="1" />
          <path d="M17 5.5 20.5 4l2.5 15-3.5 1.5z" />
        </svg>
        <span>Library</span>
      </RouterLink>
    </div>
    <RouterLink class="projects-heading" to="/projects" @click="s.sideOpen = false">
      <span>Projects</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
    </RouterLink>
    <div class="history-heading">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" />
        <path d="M3 3v5h5M12 7v5l3 2" />
      </svg>
      <span>History</span>
    </div>
    <div class="list">
      <div v-for="(c, i) in s.chats" :key="c.id" class="item" :class="{ on: c.id === s.activeId }"
        :style="{ animationDelay: i * 70 + 'ms' }" @click="open(c.id)">
        <span class="item-title">{{ c.title }}</span>
        <button class="icon-btn delete-chat" type="button" :aria-label="`Delete ${c.title}`"
          title="Delete conversation" @click.stop="s.deleteChat(c.id)">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" />
          </svg>
        </button>
      </div>
    </div>
    <div ref="profileArea" class="profile-area">
      <div v-if="profileOpen" id="profile-popup" class="profile-popup" role="dialog" aria-label="Profile options">
        <div class="profile-popup-user">
          <div class="avatar sm">{{ auth.initials }}</div>
          <div class="t">
            <b>{{ auth.user?.name }}</b>
            <span>{{ auth.user?.email }}</span>
          </div>
        </div>
        <RouterLink class="btn p profile-settings" to="/settings" @click="profileOpen = false">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.09a2 2 0 0 1 1 1.72v.5a2 2 0 0 1-1 1.74l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.72v-.5a2 2 0 0 1 1-1.74l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>Settings</span>
        </RouterLink>
      </div>
      <div class="ucard">
        <button class="ucard-profile" type="button" title="Open profile options" aria-haspopup="dialog"
          :aria-expanded="profileOpen" aria-controls="profile-popup" @click="profileOpen = !profileOpen">
          <div class="avatar sm">{{ auth.initials }}</div>
          <div class="t">
            <b>{{ auth.user?.name }}</b>
            <span class="settings-link">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.09a2 2 0 0 1 1 1.72v.5a2 2 0 0 1-1 1.74l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.72v-.5a2 2 0 0 1 1-1.74l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Settings
            </span>
          </div>
        </button>
        <button class="icon-btn logout-btn" type="button" aria-label="Logout" title="Logout" @click="logout">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10 17l5-5-5-5M15 12H3M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
          </svg>
        </button>
      </div>
    </div>
  </aside>
  <div class="scrim" :class="{ on: s.sideOpen }" @click="s.sideOpen = false"></div>
</template>

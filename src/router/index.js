import { createRouter, createWebHistory } from 'vue-router'
import ChatView from '../views/ChatView.vue'
import SettingsView from '../views/SettingsView.vue'
import AiSettingsView from '../views/AiSettingsView.vue'
import AuthView from '../views/AuthView.vue'
import WorkspaceView from '../views/WorkspaceView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: ChatView, meta: { title: 'Chat', auth: true } },
    { path: '/library', component: WorkspaceView, meta: { title: 'Library', auth: true, workspace: 'library' } },
    { path: '/plugins', component: WorkspaceView, meta: { title: 'Plugins', auth: true, workspace: 'plugins' } },
    { path: '/explore', component: WorkspaceView, meta: { title: 'Explore', auth: true, workspace: 'explore' } },
    { path: '/projects', component: WorkspaceView, meta: { title: 'Projects', auth: true, workspace: 'projects' } },
    { path: '/settings', component: SettingsView, meta: { title: 'Settings', auth: true } },
    { path: '/settings/ai', component: AiSettingsView, meta: { title: 'AI Settings', auth: true } },
    { path: '/login', component: AuthView, meta: { guest: true } },
    { path: '/signup', component: AuthView, meta: { guest: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.auth && !auth.isLoggedIn) return '/login'
  if (to.meta.guest && auth.isLoggedIn) return '/'
})

export default router

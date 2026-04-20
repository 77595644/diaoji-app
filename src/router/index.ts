// @ts-ignore
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import SpotView from '@/views/SpotView.vue'
import FeedView from '@/views/FeedView.vue'
import ProfileView from '@/views/ProfileView.vue'
import CatchFormView from '@/views/CatchFormView.vue'
import GuideView from '@/views/GuideView.vue'
import LoginView from '@/views/LoginView.vue'
import MyRecordsView from '@/views/MyRecordsView.vue'
import MySpotsView from '@/views/MySpotsView.vue'
import RecordDetailView from '@/views/RecordDetailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomeView, name: 'home' },
    { path: '/spot', component: SpotView, name: 'spot' },
    { path: '/feed', component: FeedView, name: 'feed' },
    { path: '/profile', component: ProfileView, name: 'profile' },
    { path: '/catch', component: CatchFormView, name: 'catch' },
    { path: '/guide', component: GuideView, name: 'guide' },
    { path: '/login', component: LoginView, name: 'login' },
    { path: '/my-records', component: MyRecordsView, name: 'my-records' },
    { path: '/my-spots', component: MySpotsView, name: 'my-spots' },
    { path: '/record/:id', component: RecordDetailView, name: 'record-detail' },
  ],
})

// 路由守卫
const publicPaths = ['/login', '/guide', '/spot']

router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  const guideDone = localStorage.getItem('guide_done') === '1'

  // 已登录且已完成引导 → 首页
  if (token && guideDone && to.path === '/login') {
    return '/'
  }

  // 公开页面不拦截
  if (publicPaths.includes(to.path)) return

  // 无 token → 去登录
  if (!token) {
    return '/login'
  }

  // 有 token 但未完成引导 → 引导页
  if (!guideDone) {
    return '/guide'
  }
})

export default router

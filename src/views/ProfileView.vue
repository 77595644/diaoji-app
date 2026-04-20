<template>
  <div class="profile-view">
    <!-- 头部 -->
    <div class="profile-header">
      <img :src="user?.avatarUrl || 'https://via.placeholder.com/60'" class="avatar" />
      <div class="user-info">
        <div class="nickname">{{ user?.nickname || '加载中...' }}</div>
        <div class="styles" v-if="user?.fishingStyles">
          <span v-for="s in user.fishingStyles.split(',').filter((x:string)=>x)" :key="s" class="style-tag">{{ s }}</span>
        </div>
      </div>
      <van-button size="small" plain @click="editProfile">编辑资料</van-button>
    </div>

    <!-- 数据看板 -->
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-num">{{ stats.totalTrips || 0 }}</div>
        <div class="stat-label">出钓</div>
      </div>
      <div class="stat-item">
        <div class="stat-num">{{ stats.totalFishCount || 0 }}</div>
        <div class="stat-label">渔获</div>
      </div>
      <div class="stat-item">
        <div class="stat-num">{{ stats.totalWeight || 0 }}<span class="unit">斤</span></div>
        <div class="stat-label">总重</div>
      </div>
      <div class="stat-item">
        <div class="stat-num">{{ stats.thisMonthTrips || 0 }}</div>
        <div class="stat-label">本月</div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <div class="action-item" @click="router.push('/catch')">
        <span class="action-icon">📝</span>
        <span>记渔获</span>
      </div>
      <div class="action-item" @click="router.push('/spot')">
        <span class="action-icon">📍</span>
        <span>找钓点</span>
      </div>
      <div class="action-item" @click="router.push('/feed')">
        <span class="action-icon">💬</span>
        <span>钓友圈</span>
      </div>
    </div>

    <!-- 菜单列表 -->
    <div class="menu-section">
      <div class="menu-item" @click="router.push('/my-spots')">
        <span class="menu-icon">🗺️</span>
        <span class="menu-text">我的钓点</span>
        <span class="menu-arrow">›</span>
      </div>
      <div class="menu-item" @click="router.push('/my-records')">
        <span class="menu-icon">📒</span>
        <span class="menu-text">渔获日记</span>
        <span class="menu-arrow">›</span>
      </div>
      <div class="menu-item" @click="showComingSoon('成就中心')">
        <span class="menu-icon">🏆</span>
        <span class="menu-text">成就中心</span>
        <span class="menu-tag">即将上线</span>
      </div>
    </div>

    <div class="menu-section">
      <div class="menu-item" @click="showComingSoon('设置')">
        <span class="menu-icon">⚙️</span>
        <span class="menu-text">设置</span>
        <span class="menu-arrow">›</span>
      </div>
      <div class="menu-item" @click="showComingSoon('帮助与反馈')">
        <span class="menu-icon">💡</span>
        <span class="menu-text">帮助与反馈</span>
        <span class="menu-arrow">›</span>
      </div>
      <div class="menu-item danger" @click="logout">
        <span class="menu-icon">🚪</span>
        <span class="menu-text">退出登录</span>
      </div>
    </div>

    <div class="version">钓迹 v1.0.0</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { userApi } from '@/api/user'
import { showConfirmDialog, showToast } from 'vant'

const router = useRouter()
const user = ref<any>(null)
const stats = ref<any>({})

const editProfile = () => {
  showToast('编辑资料功能开发中')
}

const showComingSoon = (name: string) => {
  showToast(`${name}功能即将上线`)
}

const logout = async () => {
  try {
    await showConfirmDialog({ title: '退出登录', message: '确定退出当前账号？' })
    localStorage.clear()
    router.replace('/login')
  } catch (e) {
    // 用户取消
  }
}

onMounted(async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    router.replace('/login')
    return
  }

  try {
    console.log('🟢 获取用户资料...')
    const profileRes = await userApi.getProfile()
    user.value = profileRes?.data || { nickname: '钓友' }
    console.log('🟢 用户:', user.value?.nickname)

    console.log('🟢 获取统计数据...')
    const statsRes = await userApi.getStats()
    stats.value = statsRes?.data || {}
    console.log('🟢 统计:', stats.value)
  } catch (e: any) {
    console.error('🔴 获取数据失败:', e?.message)
    showToast('加载失败，请重试')
    user.value = { nickname: '钓友' }
  }
})
</script>

<style scoped>
.profile-view { padding: 0 0 80px; background: #F5F7FA; min-height: 100vh; }

.profile-header {
  background: linear-gradient(135deg, #0D7377 0%, #14919B 100%);
  color: white;
  padding: 24px 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  border: 2px solid rgba(255,255,255,0.5);
  object-fit: cover;
}

.user-info { flex: 1; }
.nickname { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
.styles { display: flex; gap: 6px; flex-wrap: wrap; }
.style-tag {
  font-size: 11px;
  background: rgba(255,255,255,0.2);
  padding: 2px 8px;
  border-radius: 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: white;
  margin: -10px 12px 12px;
  border-radius: 12px;
  padding: 16px 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.stat-item { text-align: center; }
.stat-num {
  font-size: 20px;
  font-weight: 700;
  color: #0D7377;
}
.unit { font-size: 12px; font-weight: 400; }
.stat-label { font-size: 12px; color: #6B7280; margin-top: 4px; }

.quick-actions {
  display: flex;
  background: white;
  margin: 0 12px 12px;
  border-radius: 12px;
  padding: 16px;
  gap: 0;
}

.action-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.action-icon { font-size: 24px; }
.action-item span:last-child { font-size: 13px; color: #374151; }

.menu-section {
  background: white;
  margin: 0 12px 12px;
  border-radius: 12px;
  overflow: hidden;
}

.menu-item {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #1A2634;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.menu-item:last-child { border-bottom: none; }
.menu-item:active { background: #f9fafb; }

.menu-icon { font-size: 18px; }
.menu-text { flex: 1; }
.menu-arrow { color: #9CA3AF; font-size: 16px; }
.menu-tag {
  font-size: 10px;
  background: #FEF3C7;
  color: #D97706;
  padding: 2px 6px;
  border-radius: 4px;
}

.menu-item.danger .menu-text { color: #EF4444; }

.version {
  text-align: center;
  color: #9CA3AF;
  font-size: 12px;
  padding: 20px 0;
}
</style>

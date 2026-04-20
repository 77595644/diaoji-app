<template>
  <div class="user-profile-view">

    <!-- 头部 -->
    <div class="page-header">
      <span class="back" @click="$router.back()">‹</span>
      <h1>{{ user?.nickname || '钓友主页' }}</h1>
      <span class="empty-right"></span>
    </div>

    <div v-if="loading" class="loading-wrap">
      <van-loading color="#0D7377">加载中...</van-loading>
    </div>

    <template v-else-if="user">

      <!-- 用户信息卡 -->
      <div class="profile-card">
        <div class="avatar-wrap">
          <van-image
            round
            width="72"
            height="72"
            :src="user.avatarUrl || defaultAvatar"
            fit="cover"
          />
        </div>
        <div class="profile-info">
          <div class="nickname">
            {{ user.nickname }}
            <span v-if="isSelf" class="self-badge">我</span>
          </div>
          <div class="fishing-styles" v-if="user.fishingStyles">
            <span v-for="s in splitStyles(user.fishingStyles)" :key="s" class="style-tag">{{ s }}</span>
          </div>
          <div class="join-date" v-if="user.createdAt">
            🗓️ 加入于 {{ formatDate(user.createdAt) }}
          </div>
        </div>
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

      <!-- 渔获日记标题 -->
      <div class="section-title">
        <span>📒 渔获日记</span>
        <span class="record-count" v-if="totalCount > 0">{{ totalCount }} 条记录</span>
      </div>

      <!-- 加载更多 -->
      <div v-if="recordsLoading" class="loading-inline">
        <van-loading size="16px" color="#0D7377" /> 加载中...
      </div>

      <!-- 空态 -->
      <div v-else-if="records.length === 0" class="empty-state">
        <div class="empty-icon">🎣</div>
        <p>暂无渔获记录</p>
      </div>

      <!-- 渔获列表（只读，无编辑按钮） -->
      <div v-else class="record-list">
        <div
          v-for="record in records"
          :key="record.id"
          class="record-card"
          @click="goDetail(record)"
        >
          <div class="record-img">
            <img v-if="record.photoUrl" :src="record.photoUrl" alt="渔获" />
            <div v-else class="no-img">{{ fishEmoji(record.fishSpecies) }}</div>
          </div>
          <div class="record-body">
            <div class="record-top">
              <span class="fish-species">{{ record.fishSpecies || '渔获' }}</span>
              <span class="weight">{{ record.weight }}斤</span>
            </div>
            <div class="record-meta">
              📍 {{ record.spotName || '未知钓点' }}
            </div>
            <div class="record-meta">
              🕐 {{ formatDateTime(record.createdAt) }}
              <span v-if="record.quantity > 1" class="qty"> ×{{ record.quantity }}</span>
            </div>
            <div class="record-feeling" v-if="record.fishFeeling">
              {{ record.fishFeeling }}
            </div>
          </div>
        </div>

        <!-- 加载更多 -->
        <div class="load-more" v-if="hasMore" @click="loadMore">
          <van-loading v-if="recordsLoading" size="16px" /> 加载更多
        </div>
        <div class="no-more" v-else-if="records.length > 0">— 没有更多了 —</div>
      </div>

    </template>

    <!-- 用户不存在 -->
    <div v-else class="empty-state">
      <div class="empty-icon">❓</div>
      <p>该用户不存在</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getUserProfile, getUserStats, getUserRecords } from '@/api/home'

const router = useRouter()
const route = useRoute()

const userId = computed(() => route.params.userId as string)
const myUserId = computed(() => {
  // 从 token payload 里简单解析 userId（JWT payload 是 base64）
  try {
    const token = localStorage.getItem('token') || ''
    const payload = JSON.parse(atob(token.split('.')[1]))
    return String(payload.userId || payload.sub || 0)
  } catch {
    return '0'
  }
})
const isSelf = computed(() => myUserId.value === userId.value)

const user = ref<any>(null)
const stats = ref<any>({})
const records = ref<any[]>([])
const loading = ref(true)
const recordsLoading = ref(false)
const totalCount = ref(0)
const page = ref(1)
const hasMore = ref(true)

const defaultAvatar = 'https://ui-avatars.com/api/?size=72&background=0D7377&color=fff&bold=true'

const splitStyles = (styles: string) => styles.split(',').filter(Boolean)
const formatDate = (d: string) => {
  if (!d) return ''
  return d.substring(0, 10)
}
const formatDateTime = (d: string) => {
  if (!d) return ''
  const dt = new Date(d)
  return `${dt.getMonth() + 1}月${dt.getDate()}日 ${dt.getHours()}:${String(dt.getMinutes()).padStart(2, '0')}`
}
const fishEmoji = (name?: string) => {
  const map: Record<string, string> = {
    '翘嘴鲌': '🐟', '鲈鱼': '🐠', '草鱼': '🌿', '鲤鱼': '🐉',
    '罗非鱼': '🐟', '鳜鱼': '🐟', '黑鱼': '🐍', '鲶鱼': '🐟',
    '青鱼': '🐟', '鲫鱼': '🐟', '鳊鱼': '🐟',
  }
  return map[name || ''] || '🐟'
}

const goDetail = (record: any) => {
  router.push(`/record/${record.id}`)
}

async function loadRecords(append = false) {
  if (append) recordsLoading.value = true
  else recordsLoading.value = true
  try {
    const res: any = await getUserRecords(userId.value, page.value, 10)
    const data = res?.data || {}
    const newRecords = data.records || []
    if (append) {
      records.value = [...records.value, ...newRecords]
    } else {
      records.value = newRecords
    }
    totalCount.value = data.total || newRecords.length
    hasMore.value = page.value < data.pages
    page.value++
  } catch {
    records.value = []
  } finally {
    recordsLoading.value = false
  }
}

function loadMore() {
  if (!recordsLoading.value && hasMore.value) loadRecords(true)
}

onMounted(async () => {
  loading.value = true
  try {
    const [profileRes, statsRes] = await Promise.all([
      getUserProfile(userId.value),
      getUserStats(userId.value),
    ])
    user.value = profileRes?.data || null
    stats.value = statsRes?.data || {}
    await loadRecords()
  } catch (e: any) {
    user.value = null
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.user-profile-view { min-height: 100vh; background: #F5F7FA; padding-bottom: 40px; }

.page-header {
  background: #0D7377;
  color: white;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 10;
}
.back { font-size: 26px; cursor: pointer; font-weight: 300; }
h1 { font-size: 17px; font-weight: 600; }
.empty-right { width: 26px; }

.loading-wrap { padding: 60px; text-align: center; }

.profile-card {
  background: linear-gradient(135deg, #0D7377 0%, #14919B 100%);
  color: white;
  padding: 24px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.avatar-wrap { flex-shrink: 0; }
.profile-info { flex: 1; }
.nickname {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.self-badge {
  font-size: 10px;
  background: rgba(255,255,255,0.3);
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 400;
}
.fishing-styles { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }
.style-tag {
  font-size: 11px;
  background: rgba(255,255,255,0.2);
  padding: 2px 8px;
  border-radius: 10px;
}
.join-date { font-size: 12px; opacity: 0.8; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: white;
  margin: 12px;
  border-radius: 12px;
  padding: 16px 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.stat-item { text-align: center; }
.stat-num { font-size: 20px; font-weight: 700; color: #0D7377; }
.unit { font-size: 12px; font-weight: 400; }
.stat-label { font-size: 12px; color: #6B7280; margin-top: 4px; }

.section-title {
  padding: 12px 16px 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1A2634;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.record-count { font-size: 12px; color: #9CA3AF; font-weight: 400; }

.loading-inline {
  text-align: center;
  padding: 12px;
  color: #0D7377;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.empty-state { padding: 40px 20px; text-align: center; color: #9CA3AF; }
.empty-icon { font-size: 48px; margin-bottom: 12px; }

.record-list { padding: 0 12px; }
.record-card {
  background: white;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
  display: flex;
  gap: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  cursor: pointer;
}
.record-img {
  width: 68px;
  height: 68px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}
.record-img img { width: 100%; height: 100%; object-fit: cover; }
.no-img {
  width: 100%;
  height: 100%;
  background: #E8F6F6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}
.record-body { flex: 1; min-width: 0; }
.record-top { display: flex; justify-content: space-between; margin-bottom: 4px; }
.fish-species { font-size: 15px; font-weight: 600; color: #1A2634; }
.weight { font-size: 14px; color: #0D7377; font-weight: 600; }
.record-meta { font-size: 12px; color: #9CA3AF; margin-bottom: 2px; }
.qty { color: #FF6B35; }
.record-feeling {
  font-size: 12px;
  color: #6B7280;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.load-more {
  text-align: center;
  padding: 14px;
  color: #0D7377;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.no-more { text-align: center; padding: 14px; color: #9CA3AF; font-size: 12px; }
</style>

<template>
  <div class="my-spots-view">
    <!-- 头部 -->
    <div class="page-header">
      <span class="back" @click="$router.back()">‹</span>
      <h1>我的钓点</h1>
      <span class="add-btn" @click="$router.push('/spot')">+ 添加</span>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-wrap">
      <van-loading color="#0D7377">加载中...</van-loading>
    </div>

    <!-- 空状态 -->
    <div v-else-if="spots.length === 0" class="empty-state">
      <div class="empty-icon">🗺️</div>
      <p>还没有上报过钓点</p>
      <van-button type="primary" size="small" @click="$router.push('/spot')">去添加钓点</van-button>
    </div>

    <!-- 钓点列表 -->
    <div v-else class="spot-list">
      <div
        v-for="spot in spots"
        :key="spot.id"
        class="spot-card"
        @click="goDetail(spot)"
      >
        <!-- 标签 -->
        <div class="spot-tags">
          <span class="tag-free" v-if="spot.isFree">免费</span>
          <span class="tag-status" :class="spot.status === 1 ? 'online' : 'pending'">
            {{ spot.status === 1 ? '已上线' : '待审核' }}
          </span>
        </div>

        <!-- 名称 -->
        <div class="spot-name">{{ spot.name }}</div>

        <!-- 地址 -->
        <div class="spot-address">
          📍 {{ spot.province || '' }}{{ spot.city || '' }}{{ spot.district || '' }}{{ spot.address || '' }}
        </div>

        <!-- 钓法标签 -->
        <div class="spot-styles" v-if="spot.fishingStyles">
          <span
            v-for="s in parseStyles(spot.fishingStyles)"
            :key="s"
            class="style-tag"
          >{{ s }}</span>
        </div>

        <!-- 底部信息 -->
        <div class="spot-footer">
          <span class="spot-date">🕐 {{ formatDate(spot.createdAt) }}</span>
          <span class="spot-arrow">›</span>
        </div>
      </div>

      <!-- 加载更多 -->
      <div class="load-more" v-if="hasMore" @click="loadMore">
        <van-loading v-if="loadingMore" size="16px" /> 加载更多
      </div>
      <div class="no-more" v-else-if="spots.length">— 没有更多了 —</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { spotApi } from '@/api/user'
import { showToast } from 'vant'

const router = useRouter()
const spots = ref<any[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(true)
const page = ref(1)

const goDetail = (spot: any) => {
  router.push(`/spot?spotId=${spot.id}`)
}

const parseStyles = (styles: string) => {
  if (!styles) return []
  try {
    // 尝试 JSON 数组
    const parsed = JSON.parse(styles)
    if (Array.isArray(parsed)) return parsed
  } catch {}
  // 逗号分隔
  return styles.split(',').filter(Boolean)
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

const loadData = async (append = false) => {
  if (append) loadingMore.value = true
  try {
    const res: any = await spotApi.my(page.value, 20)
    const data = res?.data || res
    const newSpots = data.records || []

    if (append) {
      spots.value = [...spots.value, ...newSpots]
    } else {
      spots.value = newSpots
    }

    hasMore.value = page.value < data.pages
    page.value++
  } catch (e: any) {
    console.error('🔴 加载钓点失败:', e)
    showToast('加载失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  if (!loadingMore.value && hasMore.value) loadData(true)
}

onMounted(async () => {
  await loadData()
})
</script>

<style scoped>
.my-spots-view { min-height: 100vh; background: #F5F7FA; padding-bottom: 80px; }

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

.back { font-size: 24px; cursor: pointer; }
h1 { font-size: 17px; font-weight: 600; }
.add-btn { font-size: 14px; cursor: pointer; }

.loading-wrap { padding: 40px; text-align: center; }

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #9CA3AF;
}

.empty-icon { font-size: 48px; margin-bottom: 16px; }
.empty-state p { margin-bottom: 20px; font-size: 14px; }

.spot-list { padding: 12px; }

.spot-card {
  background: white;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  cursor: pointer;
  position: relative;
}

.spot-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.tag-free {
  font-size: 10px;
  background: #D1FAE5;
  color: #059669;
  padding: 1px 6px;
  border-radius: 4px;
}

.tag-status {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
}

.tag-status.online { background: #D1FAE5; color: #059669; }
.tag-status.pending { background: #FEF3C7; color: #D97706; }

.spot-name {
  font-size: 16px;
  font-weight: 600;
  color: #1A2634;
  margin-bottom: 4px;
}

.spot-address {
  font-size: 12px;
  color: #9CA3AF;
  margin-bottom: 8px;
}

.spot-styles {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.style-tag {
  font-size: 11px;
  background: #E0F2FE;
  color: #0369A1;
  padding: 1px 6px;
  border-radius: 4px;
}

.spot-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f5f5f5;
  padding-top: 8px;
  margin-top: 4px;
}

.spot-date { font-size: 11px; color: #9CA3AF; }
.spot-arrow { color: #9CA3AF; font-size: 18px; }

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

.no-more {
  text-align: center;
  padding: 14px;
  color: #9CA3AF;
  font-size: 12px;
}
</style>

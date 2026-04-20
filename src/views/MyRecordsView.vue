<template>
  <div class="my-records-view">
    <!-- 头部 -->
    <div class="page-header">
      <span class="back" @click="$router.back()">‹</span>
      <h1>渔获日记</h1>
      <span class="add-btn" @click="goAdd">+ 记渔获</span>
    </div>

    <!-- 统计概览 -->
    <div class="stats-bar" v-if="stats.totalTrips">
      <span>出钓 <b>{{ stats.totalTrips }}</b> 次</span>
      <span>渔获 <b>{{ stats.totalFishCount }}</b> 条</span>
      <span>总重 <b>{{ stats.totalWeight }}斤</b></span>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-wrap">
      <van-loading color="#0D7377">加载中...</van-loading>
    </div>

    <!-- 空状态 -->
    <div v-else-if="records.length === 0" class="empty-state">
      <div class="empty-icon">📒</div>
      <p>还没有渔获记录</p>
      <van-button type="primary" size="small" @click="goAdd">记录第一条渔获</van-button>
    </div>

    <!-- 渔获列表 -->
    <div v-else class="record-list">
      <div
        v-for="record in records"
        :key="record.id"
        class="record-card"
        @click="goDetail(record)"
      >
        <!-- 图片 -->
        <div class="record-img">
          <img v-if="record.photoUrl" :src="record.photoUrl" />
          <div v-else class="no-img">{{ record.fishSpecies?.[0] || '🐟' }}</div>
        </div>

        <!-- 内容 -->
        <div class="record-info">
          <div class="record-top">
            <span class="fish-species">{{ record.fishSpecies }}</span>
            <span class="record-weight">{{ record.weight }}斤</span>
          </div>
          <div class="record-meta">
            <span>📍 {{ record.spotName || '未知钓点' }}</span>
          </div>
          <div class="record-meta">
            <span>🕐 {{ formatDate(record.createdAt) }}</span>
            <span v-if="record.quantity > 1">×{{ record.quantity }}条</span>
          </div>
          <div class="record-note" v-if="record.note">{{ record.note }}</div>
        </div>
      </div>

      <!-- 加载更多 -->
      <div class="load-more" v-if="hasMore" @click="loadMore">
        <van-loading v-if="loadingMore" size="16px" /> 加载更多
      </div>
      <div class="no-more" v-else-if="records.length">— 没有更多了 —</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { catchApi } from '@/api/user'
import { showToast } from 'vant'

const router = useRouter()
const records = ref<any[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(true)
const page = ref(1)
const stats = ref<any>({})

const goAdd = () => router.push('/catch')

const goDetail = (record: any) => {
  router.push(`/record/${record.id}`)
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

const loadData = async (append = false) => {
  if (append) {
    loadingMore.value = true
  }
  try {
    const res: any = await catchApi.list(page.value, 10)
    const data = res?.data || res
    const newRecords = data.records || []

    if (append) {
      records.value = [...records.value, ...newRecords]
    } else {
      records.value = newRecords
    }

    hasMore.value = page.value < data.pages
    page.value++
  } catch (e: any) {
    console.error('🔴 加载渔获失败:', e)
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
  try {
    // 获取统计
    const statsRes: any = await catchApi.stats()
    stats.value = statsRes?.data || statsRes || {}
    console.log('🟢 统计:', stats.value)
  } catch (e) {
    console.error('🔴 统计加载失败:', e)
  }

  // 获取列表
  await loadData()
})
</script>

<style scoped>
.my-records-view { min-height: 100vh; background: #F5F7FA; padding-bottom: 80px; }

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

.stats-bar {
  background: white;
  padding: 12px 16px;
  display: flex;
  justify-content: space-around;
  font-size: 13px;
  color: #6B7280;
  border-bottom: 1px solid #f0f0f0;
}

.stats-bar b { color: #0D7377; font-weight: 700; }

.loading-wrap { padding: 40px; text-align: center; }

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #9CA3AF;
}

.empty-icon { font-size: 48px; margin-bottom: 16px; }
.empty-state p { margin-bottom: 20px; font-size: 14px; }

.record-list { padding: 12px; }

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
  width: 70px;
  height: 70px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.record-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-img {
  width: 100%;
  height: 100%;
  background: #E8F6F6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.record-info { flex: 1; min-width: 0; }

.record-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.fish-species { font-size: 15px; font-weight: 600; color: #1A2634; }
.record-weight { font-size: 14px; color: #0D7377; font-weight: 600; }

.record-meta {
  font-size: 12px;
  color: #9CA3AF;
  margin-bottom: 3px;
  display: flex;
  gap: 8px;
}

.record-note {
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

.no-more {
  text-align: center;
  padding: 14px;
  color: #9CA3AF;
  font-size: 12px;
}
</style>

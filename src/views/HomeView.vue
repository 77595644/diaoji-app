<template>
  <div class="home">
    <!-- 顶部天气栏 -->
    <div class="top-bar">
      <div class="location">
        <span>📍</span>
        <span>{{ city }}</span>
      </div>
      <div class="weather" v-if="weather">
        {{ weather }}
      </div>
    </div>

    <!-- 钓鱼指数卡片 -->
    <div class="fish-index-card" @click="goIndexDetail">
      <div class="index-main">
        <div class="index-number">{{ fishIndex.totalScore ?? '--' }}</div>
        <div class="index-unit">分</div>
        <div class="index-level" :class="levelClass">{{ fishIndex.level ?? '加载中' }}</div>
      </div>
      <van-progress
        :percentage="((fishIndex.totalScore ?? 0) / 10) * 100"
        :color="indexColor"
        :show-pivot="false"
        stroke-width="8"
      />
      <div class="index-factors">
        <div class="factor">
          <span class="factor-label">气压</span>
          <span class="factor-value">{{ fishIndex.pressureScore ?? '--' }}</span>
        </div>
        <div class="factor">
          <span class="factor-label">水温</span>
          <span class="factor-value">{{ fishIndex.waterTempScore ?? '--' }}</span>
        </div>
        <div class="factor">
          <span class="factor-label">月相</span>
          <span class="factor-value">{{ fishIndex.moonScore ?? '--' }}</span>
        </div>
        <div class="factor">
          <span class="factor-label">天气</span>
          <span class="factor-value">{{ fishIndex.weatherScore ?? '--' }}</span>
        </div>
      </div>
    </div>

    <!-- 出钓日历 -->
    <div class="calendar-section">
      <div class="section-title">📅 出钓日历</div>
      <div class="calendar-dots">
        <span
          v-for="i in 30" :key="i"
          class="dot"
          :class="{ active: tripDays.includes(i) }"
        >{{ i }}</span>
      </div>
    </div>

    <!-- 附近钓点 -->
    <div class="nearby-section">
      <div class="section-header">
        <span class="section-title">📍 附近好钓点</span>
        <span class="more" @click="$router.push('/spot')">查看全部 →</span>
      </div>
      <div v-if="loading" class="loading">
        <van-loading size="20px">加载中...</van-loading>
      </div>
      <div v-else-if="spots.length === 0" class="empty">
        <p>附近暂时没有记录</p>
      </div>
      <div v-else class="spot-list">
        <div
          v-for="spot in spots.slice(0, 3)"
          :key="spot.id"
          class="spot-card"
          @click="$router.push(`/spot/${spot.id}`)"
        >
          <div class="spot-name">{{ spot.name }}</div>
          <div class="spot-info">
            {{ spot.distance }}m · {{ spot.fishingStyles?.join('/') }}
          </div>
          <div class="spot-rating" v-if="spot.avgRating > 0">
            ⭐ {{ spot.avgRating }} ({{ spot.totalReviews }}条评价)
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fishIndexApi, spotApi } from '@/api/user'

const city = ref('定位中...')
const weather = ref('')
const fishIndex = ref<any>({})
const spots = ref<any[]>([])
const loading = ref(true)
const tripDays = ref<number[]>([3, 7, 12]) // 模拟数据

const levelClass = computed(() => ({
  'level-top': fishIndex.value.level === '极佳',
  'level-good': fishIndex.value.level === '较好',
  'level-normal': fishIndex.value.level === '一般',
}))

const indexColor = computed(() => {
  const s = fishIndex.value.totalScore ?? 0
  if (s >= 8) return '#1B9B70'
  if (s >= 6) return '#5CB85C'
  if (s >= 4) return '#F0AD4E'
  return '#D9534F'
})

const goIndexDetail = () => {
  // TODO: 跳转到鱼情详情页
}

onMounted(async () => {
  // 获取位置
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
    })
    const lat = pos.coords.latitude
    const lng = pos.coords.longitude

    // 钓鱼指数
    fishIndex.value = await fishIndexApi.today(lat, lng).then(r => r.data)

    // 附近钓点
    spots.value = await spotApi.nearby(lat, lng, 1, 10).then(r => r.data.records || [])
  } catch (e) {
    // 定位失败，用默认位置
    fishIndex.value = await fishIndexApi.today(23.12, 113.32).then(r => r.data)
    spots.value = await spotApi.nearby(23.12, 113.32, 1, 10).then(r => r.data.records || [])
  }
  loading.value = false
})
</script>

<style scoped>
.home { padding: 0 0 70px 0; background: #F5F7FA; min-height: 100vh; }
.top-bar {
  background: #0D7377;
  color: white;
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.location { font-size: 14px; font-weight: 500; }
.weather { font-size: 13px; }
.fish-index-card {
  background: linear-gradient(135deg, #0D7377 0%, #14919B 100%);
  color: white;
  margin: 12px;
  border-radius: 16px;
  padding: 20px 16px 16px;
}
.index-main {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 12px;
}
.index-number { font-size: 64px; font-weight: 700; line-height: 1; }
.index-unit { font-size: 18px; opacity: 0.8; }
.index-level {
  margin-left: auto;
  font-size: 14px;
  background: rgba(255,255,255,0.2);
  padding: 4px 10px;
  border-radius: 20px;
}
.index-factors {
  display: flex;
  justify-content: space-between;
  margin-top: 14px;
}
.factor { text-align: center; }
.factor-label { display: block; font-size: 11px; opacity: 0.7; margin-bottom: 2px; }
.factor-value { font-size: 16px; font-weight: 600; }
.calendar-section { margin: 12px; background: white; border-radius: 12px; padding: 14px; }
.section-title { font-size: 14px; font-weight: 600; color: #1A2634; margin-bottom: 10px; }
.calendar-dots {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.dot {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; color: #ccc;
  border-radius: 50%;
}
.dot.active { background: #0D7377; color: white; }
.nearby-section { margin: 12px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.more { font-size: 12px; color: #0D7377; }
.spot-list { display: flex; flex-direction: column; gap: 8px; }
.spot-card {
  background: white;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
}
.spot-name { font-size: 14px; font-weight: 600; color: #1A2634; margin-bottom: 4px; }
.spot-info { font-size: 12px; color: #6B7280; margin-bottom: 2px; }
.spot-rating { font-size: 11px; color: #FF8C42; }
.loading, .empty { padding: 20px; text-align: center; color: #999; font-size: 13px; }
</style>

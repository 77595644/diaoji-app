<template>
  <div class="record-detail-view">
    <!-- 头部 -->
    <div class="page-header">
      <span class="back" @click="$router.back()">‹</span>
      <h1>渔获详情</h1>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-wrap">
      <van-loading color="#0D7377">加载中...</van-loading>
    </div>

    <!-- 详情内容 -->
    <div v-else-if="record" class="detail-content">
      <!-- 照片轮播 -->
      <div class="photo-section">
        <van-swipe 
          v-if="displayPhotos.length > 0" 
          class="photo-swipe" 
          :autoplay="0" 
          indicator-color="#0D7377"
          @change="(i) => swipeIndex = i"
        >
          <van-swipe-item v-for="(url, idx) in displayPhotos" :key="idx">
            <img :src="url" class="swipe-photo" @click="previewImage" />
          </van-swipe-item>
        </van-swipe>
        <div v-else class="no-photo">
          <span class="fish-emoji">🐟</span>
          <p>{{ record.fishSpecies }}</p>
        </div>
      </div>

      <!-- 鱼种信息 -->
      <div class="info-card">
        <div class="fish-name">{{ record.fishSpecies }}</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">重量</span>
            <span class="value">{{ record.weight }}<span class="unit">斤</span></span>
          </div>
          <div class="info-item" v-if="record.length">
            <span class="label">长度</span>
            <span class="value">{{ record.length }}<span class="unit">cm</span></span>
          </div>
          <div class="info-item">
            <span class="label">数量</span>
            <span class="value">{{ record.quantity }}<span class="unit">条</span></span>
          </div>
        </div>
      </div>

      <!-- 钓点信息 -->
      <div class="info-card">
        <div class="card-title">📍 钓点</div>
        <div class="spot-info" v-if="record.spotName">
          <div class="spot-name">{{ record.spotName }}</div>
          <van-button size="small" plain type="primary" @click="goSpot">查看钓点</van-button>
        </div>
        <div class="spot-info" v-else>
          <span class="gray">未记录钓点</span>
        </div>
      </div>

      <!-- 位置信息 -->
      <div class="info-card" v-if="record.gpsLatitude && record.gpsLongitude">
        <div class="card-title">🗺️ GPS 坐标</div>
        <div class="gps-coords">
          {{ record.gpsLatitude?.toFixed(6) }}, {{ record.gpsLongitude?.toFixed(6) }}
        </div>
        <van-button size="small" plain type="primary" @click="openMap">在地图中查看</van-button>
      </div>

      <!-- 天气 -->
      <div class="info-card" v-if="record.weatherJson">
        <div class="card-title">🌤️ 当日天气</div>
        <div class="weather-info">{{ record.weatherJson }}</div>
      </div>

      <!-- 渔获感受 -->
      <div class="info-card" v-if="record.fishFeeling">
        <div class="card-title">😄 渔获感受</div>
        <div class="feeling-tags">
          <span class="feeling-tag">{{ record.fishFeeling }}</span>
        </div>
      </div>

      <!-- 备注 -->
      <div class="info-card" v-if="record.note">
        <div class="card-title">📝 备注</div>
        <div class="note-text">{{ record.note }}</div>
      </div>

      <!-- 时间 -->
      <div class="info-card">
        <div class="card-title">🕐 记录时间</div>
        <div class="time-text">{{ formatDate(record.createdAt) }}</div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <van-button type="primary" block @click="generatePoster">生成战绩海报</van-button>
      </div>
    </div>

    <!-- 无数据 -->
    <div v-else class="empty-state">
      <p>渔获记录不存在</p>
      <van-button type="default" size="small" @click="$router.back()">返回</van-button>
    </div>

    <!-- 海报生成中 -->
    <van-overlay :show="generating">
      <div class="poster-loading">
        <van-loading size="48px" color="#0D7377">生成海报中...</van-loading>
      </div>
    </van-overlay>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { catchApi } from '@/api/user'
import { showToast, showConfirmDialog, showImagePreview } from 'vant'

const router = useRouter()
const route = useRoute()
const record = ref<any>(null)
const loading = ref(true)
const generating = ref(false)

// 轮播图列表：优先 photos JSON数组，兼容 photoUrl 单图
const displayPhotos = computed(() => {
  if (!record.value) return []
  try {
    if (record.value.photos) {
      const arr = JSON.parse(record.value.photos)
      if (Array.isArray(arr) && arr.length > 0) return arr
    }
    if (record.value.photoUrl) return [record.value.photoUrl]
  } catch (e) {}
  return []
})

// 点击图片全屏预览
const previewImage = () => {
  if (displayPhotos.value.length === 0) return
  showImagePreview({
    images: displayPhotos.value,
    closeable: true,
  })
}

const goSpot = () => {
  if (record.value?.spotId) {
    router.push(`/spot?spotId=${record.value.spotId}`)
  } else {
    showToast('该渔获未关联钓点')
  }
}

const openMap = () => {
  const { gpsLatitude: lat, gpsLongitude: lng } = record.value
  if (lat && lng) {
    window.location.href = `https://map.qq.com/marker/index?coord=${lat},${lng}`
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

const generatePoster = async () => {
  if (!record.value?.id) return
  try {
    generating.value = true
    const taskId = await catchApi.generatePoster(record.value.id)
    console.log('🟢 海报任务ID:', taskId)
    showToast('海报生成中，稍后刷新查看')
  } catch (e) {
    showToast('生成失败')
  } finally {
    generating.value = false
  }
}

onMounted(async () => {
  const id = Number(route.params.id || route.query.id)
  if (!id) {
    showToast('无效的渔获ID')
    loading.value = false
    return
  }

  try {
    const res: any = await catchApi.detail(id)
    record.value = res?.data || res
    console.log('🟢 渔获详情:', record.value)
  } catch (e: any) {
    console.error('🔴 加载失败:', e)
    showToast('加载失败')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.record-detail-view { min-height: 100vh; background: #F5F7FA; padding-bottom: 80px; }

.page-header {
  background: #0D7377;
  color: white;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  position: sticky;
  top: 0;
  z-index: 10;
}
.back { font-size: 24px; cursor: pointer; }
h1 { font-size: 17px; font-weight: 600; }

.loading-wrap { padding: 60px; text-align: center; }
.empty-state { padding: 60px; text-align: center; color: #9CA3AF; }

.photo-section { background: #1A2634; position: relative; }

.photo-swipe { background: #1A2634; }
.swipe-photo {
  width: 100%;
  height: 320px;
  object-fit: cover;
  display: block;
}

.no-photo {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}

.fish-emoji { font-size: 64px; margin-bottom: 12px; }
.no-photo p { font-size: 16px; }

.info-card {
  background: white;
  margin: 12px;
  border-radius: 12px;
  padding: 16px;
}

.fish-name {
  font-size: 22px;
  font-weight: 700;
  color: #1A2634;
  margin-bottom: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.info-item {
  text-align: center;
  padding: 10px;
  background: #F5F7FA;
  border-radius: 8px;
}

.info-item .label {
  display: block;
  font-size: 11px;
  color: #9CA3AF;
  margin-bottom: 4px;
}

.info-item .value {
  font-size: 18px;
  font-weight: 700;
  color: #0D7377;
}

.info-item .unit { font-size: 12px; font-weight: 400; }

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #1A2634;
  margin-bottom: 10px;
}

.spot-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.spot-name { font-size: 15px; color: #374151; flex: 1; }
.gray { color: #9CA3AF; font-size: 14px; }

.gps-coords {
  font-size: 13px;
  color: #6B7280;
  font-family: monospace;
  margin-bottom: 10px;
}

.weather-info { font-size: 14px; color: #374151; }

.feeling-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.feeling-tag {
  font-size: 13px;
  background: #E0F2FE;
  color: #0369A1;
  padding: 4px 12px;
  border-radius: 16px;
}

.note-text { font-size: 14px; color: #374151; line-height: 1.6; }
.time-text { font-size: 14px; color: #6B7280; }

.actions { padding: 16px 12px; }

.poster-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>

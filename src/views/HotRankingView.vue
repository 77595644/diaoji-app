<template>
  <div class="hot-ranking-view">

    <!-- 顶部导航 -->
    <div class="page-header">
      <span class="back" @click="$router.back()">‹</span>
      <h1>🔥 钓点热度榜</h1>
      <span class="empty-right"></span>
    </div>

    <!-- Tab：时间段切换 -->
    <div class="period-tabs">
      <button
        v-for="p in periods"
        :key="p.value"
        :class="{ active: period === p.value }"
        @click="switchPeriod(p.value)"
      >{{ p.label }}</button>
    </div>

    <!-- 规则说明 -->
    <div class="rule-tip">
      <span>📊 热度说明</span>
      <span class="tip-text">热度 = 近30天该钓点渔获上报次数</span>
    </div>

    <!-- 加载 -->
    <div v-if="loading" class="loading-wrap">
      <van-loading color="#FF6B35">加载中...</van-loading>
    </div>

    <!-- 空态 -->
    <div v-else-if="spots.length === 0" class="empty-state">
      <div class="empty-icon">🏆</div>
      <p>暂无数据</p>
      <p class="sub">还没有渔获记录上榜，<br/>成为第一个记录的人吧！</p>
    </div>

    <!-- 榜单列表 -->
    <div v-else class="ranking-list">
      <!-- TOP3 大卡片 -->
      <div v-for="(spot, idx) in spots.slice(0, 3)" :key="spot.spotId"
           class="top-card rank-card"
           :class="'rank-' + (idx + 1)"
           @click="goSpot(spot)"
      >
        <div class="rank-medal">{{ ['🥇','🥈','🥉'][idx] }}</div>
        <div class="rank-info">
          <div class="rank-name">{{ spot.spotName }}</div>
          <div class="rank-meta">📍 {{ spot.city }}</div>
        </div>
        <div class="rank-score-wrap">
          <div class="rank-score-num">{{ spot.heatScore }}</div>
          <div class="rank-score-label">次渔获</div>
        </div>
      </div>

      <!-- 4名以后 -->
      <div v-if="spots.length > 3" class="below-top">
        <div
          v-for="(spot, idx) in spots.slice(3)"
          :key="spot.spotId"
          class="rank-item"
          @click="goSpot(spot)"
        >
          <div class="item-rank">{{ idx + 4 }}</div>
          <div class="item-info">
            <div class="item-name">{{ spot.spotName }}</div>
            <div class="item-city">📍 {{ spot.city }}</div>
          </div>
          <div class="item-score">
            <span class="score-h">🔥 {{ spot.heatScore }}</span>
            <span class="score-u">次</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getSpotHeat } from '@/api/home'
import { showToast } from 'vant'

const router = useRouter()
const period = ref('month30')
const loading = ref(true)
const spots = ref<any[]>([])

const periods = [
  { label: '近30天', value: 'month30' },
  { label: '本月', value: 'currentMonth' },
]

async function loadData() {
  loading.value = true
  try {
    const res: any = await getSpotHeat(period.value)
    spots.value = res.data || []
  } catch {
    spots.value = []
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

function switchPeriod(p: string) {
  period.value = p
  loadData()
}

function goSpot(spot: any) {
  router.push({ path: '/spot', query: { spotId: spot.spotId } })
}

onMounted(loadData)
</script>

<style scoped>
.hot-ranking-view { min-height: 100vh; background: #F5F7FA; padding-bottom: 30px; }

.page-header {
  background: linear-gradient(135deg, #FF6B35 0%, #F7C948 100%);
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

.period-tabs {
  background: white;
  padding: 12px 16px;
  display: flex;
  gap: 10px;
  border-bottom: 1px solid #f0f0f0;
}
.period-tabs button {
  flex: 1;
  padding: 7px 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #6B7280;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.period-tabs button.active {
  background: #FF6B35;
  color: white;
  border-color: #FF6B35;
  font-weight: 600;
}

.rule-tip {
  margin: 10px 12px;
  background: #FFF7ED;
  border: 1px solid #FED7AA;
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}
.rule-tip span:first-child { color: #C2410C; font-weight: 600; white-space: nowrap; }
.tip-text { color: #9A3412; }

.loading-wrap { padding: 60px; text-align: center; }

.empty-state {
  padding: 60px 20px;
  text-align: center;
}
.empty-icon { font-size: 56px; margin-bottom: 12px; }
.empty-state p { color: #374151; font-size: 15px; margin-bottom: 6px; }
.empty-state .sub { color: #9CA3AF; font-size: 13px; line-height: 1.6; }

.ranking-list { padding: 12px; }

/* TOP3 大卡片 */
.top-card {
  background: white;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.rank-card.rank-1 { background: linear-gradient(135deg, #FFF9E6 0%, #FFFFFF 100%); border: 2px solid #FCD34D; }
.rank-card.rank-2 { background: linear-gradient(135deg, #F9FAFB 0%, #FFFFFF 100%); border: 2px solid #D1D5DB; }
.rank-card.rank-3 { background: linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%); border: 2px solid #FDE68A; }

.rank-medal { font-size: 36px; }
.rank-info { flex: 1; }
.rank-name { font-size: 16px; font-weight: 700; color: #1A2634; margin-bottom: 4px; }
.rank-meta { font-size: 12px; color: #6B7280; }
.rank-score-wrap { text-align: right; }
.rank-score-num { font-size: 28px; font-weight: 800; color: #FF6B35; line-height: 1; }
.rank-score-label { font-size: 11px; color: #9CA3AF; }

/* 4名以后 */
.below-top { }
.rank-item {
  background: white;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.item-rank {
  width: 22px;
  font-size: 14px;
  font-weight: 700;
  color: #9CA3AF;
  text-align: center;
}
.item-info { flex: 1; }
.item-name { font-size: 14px; font-weight: 600; color: #1A2634; }
.item-city { font-size: 12px; color: #9CA3AF; margin-top: 2px; }
.item-score { text-align: right; }
.score-h { font-size: 14px; font-weight: 700; color: #FF6B35; }
.score-u { font-size: 12px; color: #9CA3AF; }
</style>

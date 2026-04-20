<template>
  <div class="home">
    <!-- 顶部栏 -->
    <div class="top-bar">
      <div class="location">
        <span>📍</span>
        <span>{{ city }}</span>
      </div>
      <div class="weather" v-if="weather">{{ weather }}</div>
    </div>

    <!-- 钓点热度榜（主卡片） -->
    <div class="heat-section" @click="showHeatDetail = true">
      <div class="heat-header">
        <span class="heat-title">🔥 钓点热度榜</span>
        <span class="heat-period">近30天</span>
      </div>
      <div v-if="hotSpots.length > 0" class="heat-list">
        <div
          v-for="(spot, index) in hotSpots.slice(0, 3)"
          :key="spot.spotId"
          class="heat-item"
          @click.stop="$router.push(`/spot/${spot.spotId}`)"
        >
          <div class="heat-rank" :class="rankClass(index)">
            {{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}
          </div>
          <div class="heat-info">
            <div class="heat-name">{{ spot.spotName }}</div>
            <div class="heat-city">📍 {{ spot.city }}</div>
          </div>
          <div class="heat-score">
            <span class="score-num">{{ spot.heatScore }}</span>
            <span class="score-label">次渔获</span>
          </div>
        </div>
      </div>
      <div v-else class="heat-empty">
        <span>暂无热度数据</span>
      </div>
      <div class="heat-footer" v-if="hotSpots.length > 0">
        <span @click="$router.push('/hot-ranking')">查看完整榜单 →</span>
      </div>
    </div>

    <!-- Tab 切换：用户榜 / 鱼种榜 -->
    <div class="ranking-section">
      <van-tabs v-model:active="rankingTab" shrink>
        <van-tab title="🏆 用户榜" name="user"></van-tab>
        <van-tab title="🐟 鱼种榜" name="species"></van-tab>
      </van-tabs>

      <!-- 用户榜 -->
      <div v-if="rankingTab === 'user'" class="ranking-list">
        <div v-if="userRankingLoading" class="rank-loading">
          <van-loading size="20px">加载中...</van-loading>
        </div>
        <div v-else-if="userRanking.length === 0" class="rank-empty">暂无数据</div>
        <div v-else>
          <div
            v-for="(u, i) in userRanking.slice(0, 5)"
            :key="u.userId"
            class="rank-item"
            @click="$router.push(`/user-profile/${u.userId}`)"
          >
            <div class="rank-num" :class="{ top3: i < 3 }">{{ i + 1 }}</div>
            <van-image
              round width="36" height="36"
              :src="u.avatarUrl || defaultAvatar"
              fit="cover"
            />
            <div class="rank-info">
              <div class="rank-name">
                {{ u.nickname }}
                <span v-if="u.highlight" class="self-tag">我</span>
              </div>
              <div class="rank-value">
                {{ u.value }}{{ u.dimension === 'weight' ? 'kg' : u.dimension === 'count' ? '尾' : '次' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 鱼种榜 -->
      <div v-if="rankingTab === 'species'" class="ranking-list">
        <div v-if="speciesRankingLoading" class="rank-loading">
          <van-loading size="20px">加载中...</van-loading>
        </div>
        <div v-else-if="speciesRanking.length === 0" class="rank-empty">暂无数据</div>
        <div v-else>
          <div
            v-for="(s, i) in speciesRanking.slice(0, 5)"
            :key="s.speciesName"
            class="rank-item"
          >
            <div class="rank-num" :class="{ top3: i < 3 }">{{ i + 1 }}</div>
            <div class="species-icon">{{ speciesEmoji(s.speciesName) }}</div>
            <div class="rank-info">
              <div class="rank-name">{{ s.speciesName }}</div>
              <div class="rank-value">{{ s.totalWeight }}kg · {{ s.totalCount }}尾</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 附近钓点 -->
    <div class="nearby-section">
      <div class="section-header">
        <span class="section-title">📍 附近好钓点</span>
        <span class="more" @click="$router.push('/spot')">查看全部 →</span>
      </div>
      <div v-if="nearbyLoading" class="loading">
        <van-loading size="20px">加载中...</van-loading>
      </div>
      <div v-else-if="nearbySpots.length === 0" class="empty">附近暂无钓点</div>
      <div v-else class="spot-list">
        <div
          v-for="spot in nearbySpots.slice(0, 3)"
          :key="spot.spotId"
          class="spot-card"
          @click="$router.push(`/spot/${spot.spotId}`)"
        >
          <div class="spot-top">
            <div class="spot-name">{{ spot.spotName }}</div>
            <div class="spot-distance">{{ spot.distanceKm }}km</div>
          </div>
          <div class="spot-meta">
            <span>📍 {{ spot.city }}</span>
            <span v-if="spot.heatScore > 0" class="heat-tag">🔥 {{ spot.heatScore }}次</span>
          </div>
          <div class="spot-rating" v-if="spot.avgRating > 0">
            ⭐ {{ spot.avgRating.toFixed(1) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getSpotHeat, getUserRanking, getSpeciesRanking, getNearbySpots } from '@/api/home'

const city = ref('定位中...')
const weather = ref('')
const rankingTab = ref('user')

// 热度榜
const hotSpots = ref<any[]>([])
const showHeatDetail = ref(false)

// 用户榜
const userRanking = ref<any[]>([])
const userRankingLoading = ref(true)

// 鱼种榜
const speciesRanking = ref<any[]>([])
const speciesRankingLoading = ref(true)

// 附近钓点
const nearbySpots = ref<any[]>([])
const nearbyLoading = ref(true)

const defaultAvatar = 'https://ui-avatars.com/api/?size=60&background=0D7377&color=fff&bold=true'

const rankClass = (index: number) => ({
  'rank-gold': index === 0,
  'rank-silver': index === 1,
  'rank-bronze': index === 2,
})

const speciesEmoji = (name: string): string => {
  const map: Record<string, string> = {
    '翘嘴鲌': '🐟', '鲈鱼': '🐠', '草鱼': '🐟', '鲤鱼': '🐉',
    '罗非鱼': '🐟', '鳜鱼': '🐟', '黑鱼': '🐍', '鲶鱼': '🐟',
  }
  return map[name] || '🐟'
}

// 获取真实位置
const fetchWithLocation = async (lat: number, lng: number) => {
  userRankingLoading.value = true
  speciesRankingLoading.value = true
  nearbyLoading.value = true

  try {
    const [heatRes, userRes, speciesRes, nearbyRes] = await Promise.all([
      getSpotHeat('month30'),
      getUserRanking({ scope: 'country', dimension: 'weight' }),
      getSpeciesRanking(10),
      getNearbySpots({ lat, lng, radius: 50, sortBy: 'distance', page: 1, pageSize: 20 }),
    ])

    hotSpots.value = heatRes.data || []
    userRanking.value = userRes.data?.list || []
    speciesRanking.value = speciesRes.data || []
    nearbySpots.value = nearbyRes.data?.list || []
  } catch (e) {
    console.error('首页数据加载失败', e)
  } finally {
    userRankingLoading.value = false
    speciesRankingLoading.value = false
    nearbyLoading.value = false
  }
}

onMounted(async () => {
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
    })
    await fetchWithLocation(pos.coords.latitude, pos.coords.longitude)
  } catch {
    // 定位失败，用默认位置
    await fetchWithLocation(23.12, 113.32)
  }
})
</script>

<style scoped>
.home { padding: 0 0 70px 0; background: #F5F7FA; min-height: 100vh; }

/* 顶部栏 */
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

/* 热度榜 */
.heat-section {
  background: linear-gradient(135deg, #FF6B35 0%, #F7C948 100%);
  margin: 12px;
  border-radius: 16px;
  padding: 16px;
  color: #fff;
}
.heat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.heat-title { font-size: 16px; font-weight: 700; }
.heat-period { font-size: 12px; background: rgba(255,255,255,0.3); padding: 2px 8px; border-radius: 10px; }
.heat-list { display: flex; flex-direction: column; gap: 8px; }
.heat-item {
  background: rgba(255,255,255,0.2);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.heat-rank { font-size: 24px; width: 30px; text-align: center; }
.heat-info { flex: 1; }
.heat-name { font-size: 14px; font-weight: 600; }
.heat-city { font-size: 12px; opacity: 0.8; }
.heat-score { text-align: right; }
.score-num { font-size: 20px; font-weight: 700; display: block; }
.score-label { font-size: 11px; opacity: 0.8; }
.heat-empty { text-align: center; padding: 20px; font-size: 13px; opacity: 0.8; }
.heat-footer { text-align: center; font-size: 12px; margin-top: 10px; opacity: 0.9; cursor: pointer; }

/* Tab 区 */
.ranking-section {
  margin: 0 12px 12px;
  background: white;
  border-radius: 16px;
  padding: 12px;
}
.ranking-list { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; }
.rank-loading, .rank-empty { text-align: center; padding: 16px; color: #999; font-size: 13px; }
.rank-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 4px;
  cursor: pointer;
}
.rank-num {
  width: 20px; font-size: 14px; font-weight: 700;
  color: #ccc; text-align: center;
}
.rank-num.top3 { color: #FF6B35; }
.species-icon { font-size: 24px; width: 36px; text-align: center; }
.rank-info { flex: 1; }
.rank-name { font-size: 14px; font-weight: 600; color: #1A2634; display: flex; align-items: center; gap: 4px; }
.self-tag { font-size: 10px; background: #0D7377; color: white; padding: 1px 5px; border-radius: 8px; }
.rank-value { font-size: 12px; color: #6B7280; margin-top: 2px; }

/* 附近钓点 */
.nearby-section { margin: 0 12px 12px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.section-title { font-size: 15px; font-weight: 600; color: #1A2634; }
.more { font-size: 12px; color: #0D7377; }
.spot-list { display: flex; flex-direction: column; gap: 8px; }
.spot-card {
  background: white;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
}
.spot-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.spot-name { font-size: 14px; font-weight: 600; color: #1A2634; }
.spot-distance { font-size: 13px; color: #FF6B35; font-weight: 600; }
.spot-meta { font-size: 12px; color: #6B7280; display: flex; align-items: center; gap: 8px; }
.heat-tag { color: #FF6B35; font-weight: 600; }
.spot-rating { font-size: 11px; color: #FF8C42; margin-top: 2px; }
.loading, .empty { text-align: center; padding: 20px; color: #999; font-size: 13px; }
</style>

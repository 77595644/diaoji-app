<template>
  <div class="spot-view">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <van-search
        v-model="keyword"
        placeholder="搜索钓点..."
        @search="onSearch"
        background="#fff"
      />
    </div>

    <!-- 筛选Tab -->
    <div class="filter-tabs">
      <span
        v-for="tab in tabs"
        :key="tab.value"
        class="tab"
        :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >{{ tab.label }}</span>
    </div>

    <!-- 地图容器 -->
    <div id="map-container" class="map-container">
      <!-- 定位中提示 -->
      <div v-if="locating" class="locating-tip">
        <van-loading size="16px" /> 正在定位...
      </div>
      
      <!-- 操作提示 -->
      <div v-if="!hasTempMarker && !locating" class="click-tip">
        点击地图选择位置
      </div>
      
      <!-- 定位按钮 -->
      <div class="locate-btn" @click="relocate">
        <span>📍</span>
      </div>
      
      <!-- 添加钓点按钮 -->
      <div class="add-spot-btn" @click="openAddSpotForm">
        <span class="add-icon">+</span>
      </div>
    </div>

    <!-- 底部钓点列表抽屉 -->
    <div class="bottom-sheet" :class="{ expanded }" @click="expanded = !expanded">
      <div class="sheet-handle">
        <div class="handle-bar"></div>
        <div class="sheet-title">
          {{ spots.length }} 个钓点
          <span class="toggle-icon">{{ expanded ? '▼' : '▲' }}</span>
        </div>
      </div>
      <div class="sheet-content" v-show="expanded">
        <div v-if="spots.length === 0" class="empty-tip">
          🌊 附近还没有人记录，成为第一个探索者！
        </div>
        <div
          v-for="spot in spots"
          :key="spot.id"
          class="spot-item"
          @click.stop="showSpotDetail(spot)"
        >
          <div class="spot-icon">🎣</div>
          <div class="spot-info">
            <div class="spot-name">{{ spot.name }}</div>
            <div class="spot-meta">
              {{ spot.distance }}m · {{ spot.fishingStyles || '台钓' }}
              · {{ spot.isFree ? '免费' : '收费' }}
            </div>
            <div class="spot-rating" v-if="spot.avgRating > 0">
              ⭐ {{ Number(spot.avgRating).toFixed(1) }} ({{ spot.totalReviews }})
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 钓点详情弹窗 -->
    <van-popup v-model:show="showDetail" position="bottom" round style="max-height: 60vh">
      <div class="spot-detail" v-if="currentSpot">
        <div class="detail-header">
          <div class="detail-name">{{ currentSpot.name }}</div>
          <div class="detail-rating" v-if="currentSpot.avgRating > 0">
            ⭐ {{ Number(currentSpot.avgRating).toFixed(1) }}分
          </div>
        </div>
        <div class="detail-desc">{{ currentSpot.description || '暂无简介' }}</div>
        <div class="detail-meta">
          <span>📍 {{ currentSpot.address || currentSpot.city }}</span>
        </div>
        <div class="detail-styles" v-if="currentSpot.fishingStyles">
          <span v-for="s in currentSpot.fishingStyles.split(',')" :key="s" class="style-tag">{{ s }}</span>
        </div>
        <div class="detail-actions">
          <van-button type="primary" size="small" @click="goCatch(currentSpot)">
            🎣 去记录渔获
          </van-button>
          <van-button size="small" @click="showDetail = false">关闭</van-button>
        </div>
      </div>
    </van-popup>
    
    <!-- 添加钓点弹窗 -->
    <div v-if="showAddSpot" class="popup-overlay" @click="showAddSpot = false">
      <div class="add-spot-form" @click.stop>
        <div class="form-header">
          <span class="cancel-text" @click="showAddSpot = false">取消</span>
          <span class="form-title">添加钓点</span>
          <span class="submit-text" @click="saveSpot">提交</span>
        </div>
        
        <div class="form-body">
          <div class="form-row">
            <label>钓点名称 *</label>
            <input type="text" v-model="newSpot.name" placeholder="请输入钓点名称" maxlength="50" />
          </div>
          
          <div class="form-row">
            <label>钓点地址</label>
            <input type="text" v-model="newSpot.address" placeholder="选填，详细地址" maxlength="100" />
          </div>
          
          <div class="form-row">
            <label>坐标位置</label>
            <div class="location-display">
              <span v-if="hasTempMarker" class="location-coords">
                📍 {{ newSpot.latitude?.toFixed(4) }}, {{ newSpot.longitude?.toFixed(4) }}
              </span>
              <span v-else class="location-hint">
                点击地图选择位置，或使用地图中心
              </span>
              <span class="relocate-btn" @click="useCurrentLocation">
                {{ hasTempMarker ? '重新选择' : '使用地图中心' }}
              </span>
            </div>
          </div>
          
          <div class="form-row">
            <label>钓法类型</label>
            <div class="tag-options">
              <span 
                v-for="style in fishingStyles" 
                :key="style"
                class="tag"
                :class="{ active: newSpot.fishingStyles.includes(style) }"
                @click="toggleStyle(style)"
              >{{ style }}</span>
            </div>
          </div>
          
          <div class="form-row">
            <label>收费类型</label>
            <div class="tag-options">
              <span 
                class="tag"
                :class="{ active: newSpot.isFree }"
                @click="newSpot.isFree = true"
              >免费</span>
              <span 
                class="tag"
                :class="{ active: !newSpot.isFree }"
                @click="newSpot.isFree = false"
              >收费</span>
            </div>
          </div>
          
          <div class="form-row">
            <label>简介</label>
            <textarea 
              v-model="newSpot.description" 
              placeholder="简单描述这个钓点..."
              maxlength="200"
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { spotApi } from '@/api/user'
import { showToast } from 'vant'
import Supercluster from 'supercluster'

// 声明腾讯地图全局对象
declare const qq: any

const router = useRouter()
const route = useRoute()
const keyword = ref('')
const activeTab = ref('all')
const spots = ref<any[]>([])
const expanded = ref(false)
const locating = ref(true)
const showDetail = ref(false)
const currentSpot = ref<any>(null)
const showAddSpot = ref(false)
const currentLocation = ref({ lat: 23.12, lng: 113.32 })

// 新钓点表单
const newSpot = ref({
  name: '',
  address: '',
  latitude: 23.12,
  longitude: 113.32,
  fishingStyles: [] as string[],
  isFree: true,
  description: '',
})

const fishingStyles = ['台钓', '路亚', '筏钓', '海竿', '手竿', '矶钓']

// 临时标注（用户点击地图位置）
const tempLocation = ref<{ lat: number; lng: number } | null>(null)
const hasTempMarker = ref(false)

let map: any = null
let markers: any[] = []
let cluster: any = null
let tempMarker: any = null // 临时标注 Marker

const tabs = [
  { label: '全部', value: 'all' },
  { label: '野钓', value: 'free' },
  { label: '斤塘', value: 'paid' },
]

// 初始化地图
const initMap = (lat: number, lng: number) => {
  if (!document.getElementById('map-container')) return
  if (typeof qq === 'undefined') {
    showToast('地图加载失败，请刷新重试')
    locating.value = false
    return
  }

  map = new qq.maps.Map('map-container', {
    center: new qq.maps.LatLng(lat, lng),
    zoom: 12,
    minZoom: 6,
    zoomControl: true,
    mapStyleId: 'style1',
  })

  // 监听缩放变化，重新拉数据（不同zoom后端geohash分组策略不同）
  qq.maps.event.addListener(map, 'zoom_changed', () => {
    const center = map.getCenter()
    loadSpots(center.getLat(), center.getLng())
  })

  // 监听平移结束，重新拉数据
  let moveTimer: any = null
  qq.maps.event.addListener(map, 'bounds_changed', () => {
    clearTimeout(moveTimer)
    moveTimer = setTimeout(() => {
      const center = map.getCenter()
      loadSpots(center.getLat(), center.getLng())
    }, 300)
  })

  // 监听地图点击，放置临时标注
  qq.maps.event.addListener(map, 'click', (e: any) => {
    const clickLat = e.latLng.getLat()
    const clickLng = e.latLng.getLng()
    
    // 保存临时坐标
    tempLocation.value = { lat: clickLat, lng: clickLng }
    hasTempMarker.value = true
    
    // 移除旧的临时标注
    if (tempMarker) {
      tempMarker.setMap(null)
    }
    
    // 创建新的临时标注（📍图标）
    tempMarker = new qq.maps.Marker({
      position: new qq.maps.LatLng(clickLat, clickLng),
      map,
      title: '选中的钓点位置',
      zIndex: 999,
    })
    
    // 提示用户
    showToast('已选择位置，点击 + 号添加钓点')
  })

  locating.value = false
}

// 加载钓点数据（带zoom参数，后端按geohash前缀分组去重）
const loadSpots = async (lat: number, lng: number) => {
  try {
    const zoom = map ? Math.max(6, Math.round(map.getZoom())) : 12
    const res = await spotApi.nearby(lat, lng, 50000, zoom, 1, 50)
    spots.value = (res.data?.records || []).map((s: any) => {
      s.distance = s.description?.replace('m', '') || '0'
      return s
    })
    // 重建 SuperCluster 索引
    rebuildClusterIndex()
    if (spots.value.length > 0) {
      renderMarkers()
    }
  } catch (e) {
    // 后端未启动时加载空数据
    spots.value = []
  }
}

// 渲染标注 + 聚合
const renderMarkers = () => {
  if (!map || typeof qq === 'undefined') return

  // 清除旧标注
  markers.forEach((m: any) => m.setMap(null))
  markers = []

  const zoom = map.getZoom()
  const bounds = map.getBounds()
  const center = map.getCenter()
  const currentLat = center.getLat()
  const currentLng = center.getLng()

  // 按缩放级别决定渲染策略
  if (zoom >= 14 || spots.value.length <= 5) {
    // 放大级别或数据少：直接显示标注
    spots.value.forEach((spot) => {
      const lat = Number(spot.latitude)
      const lng = Number(spot.longitude)
      if (!bounds || !bounds.contains(new qq.maps.LatLng(lat, lng))) return

      const marker = new qq.maps.Marker({
        position: new qq.maps.LatLng(lat, lng),
        map,
        title: spot.name,
      })

      qq.maps.event.addListener(marker, 'click', () => {
        showSpotDetail(spot)
      })

      markers.push(marker)
    })
  } else {
    // 缩小级别：使用 SuperCluster 聚合
    renderClusters(zoom)
  }
}

// 使用 SuperCluster 聚合
const renderClusters = (zoom: number) => {
  if (!map || !cluster) return

  const center = map.getCenter()
  const zoomStart = Math.floor(zoom)
  const zoomEnd = zoomStart + 1

  const clusters = cluster.getClusters(
    [-180, -85, 180, 85],
    zoom
  )

  clusters.forEach((item: any) => {
    const isCluster = item.properties.cluster

    if (isCluster) {
      const count = item.properties.point_count
      const lat = item.geometry.coordinates[1]
      const lng = item.geometry.coordinates[0]

      const size = Math.min(50, 30 + Math.sqrt(count) * 5)
      const el = document.createElement('div')
      el.className = 'cluster-marker'
      el.style.cssText = `
        width: ${size}px; height: ${size}px;
        background: #0D7377; color: white;
        border-radius: 50%; display: flex;
        align-items: center; justify-content: center;
        font-size: ${Math.max(10, size / 3)}px;
        font-weight: 700; cursor: pointer;
        box-shadow: 0 2px 8px rgba(13,115,119,0.4);
        border: 2px solid rgba(255,255,255,0.8);
      `
      el.textContent = count > 99 ? '99+' : String(count)

      const marker = new qq.maps.Marker({
        position: new qq.maps.LatLng(lat, lng),
        map,
        icon: new qq.maps.MarkerImage(
          'data:image/svg+xml;base64,' + btoa(el.outerHTML),
          null, null, null,
          new qq.maps.Size(size / 2, size / 2)
        ),
        zIndex: count,
      })

      qq.maps.event.addListener(marker, 'click', () => {
        map.panTo(new qq.maps.LatLng(lat, lng))
        map.setZoom(Math.min(zoom + 2, 18))
      })

      markers.push(marker)
    } else {
      const spot = spots.value[item.properties.index]
      if (!spot) return

      const lat = Number(spot.latitude)
      const lng = Number(spot.longitude)

      const el = document.createElement('div')
      el.className = 'fish-marker'
      el.style.cssText = `
        font-size: 24px; cursor: pointer;
        filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
      `
      el.textContent = '🎣'

      const marker = new qq.maps.Marker({
        position: new qq.maps.LatLng(lat, lng),
        map,
        title: spot.name,
        zIndex: 100,
      })

      qq.maps.event.addListener(marker, 'click', () => {
        showSpotDetail(spot)
      })

      markers.push(marker)
    }
  })
}

// 显示钓点详情
const showSpotDetail = (spot: any) => {
  currentSpot.value = spot
  showDetail.value = true
}

// 切换钓法类型
const toggleStyle = (style: string) => {
  const index = newSpot.value.fishingStyles.indexOf(style)
  if (index === -1) {
    newSpot.value.fishingStyles.push(style)
  } else {
    newSpot.value.fishingStyles.splice(index, 1)
  }
}

// 使用当前地图中心位置
const useCurrentLocation = () => {
  if (map) {
    const center = map.getCenter()
    newSpot.value.latitude = center.getLat()
    newSpot.value.longitude = center.getLng()
    // 更新临时标注状态
    tempLocation.value = { lat: center.getLat(), lng: center.getLng() }
    hasTempMarker.value = true
    
    // 同时更新地图上的临时标注
    if (tempMarker) {
      tempMarker.setMap(null)
    }
    tempMarker = new qq.maps.Marker({
      position: new qq.maps.LatLng(center.getLat(), center.getLng()),
      map,
      title: '选中的钓点位置',
      zIndex: 999,
    })
  }
}

// 重新定位
const relocate = async () => {
  const { lat, lng } = await getLocation()
  currentLocation.value = { lat, lng }
  if (map) {
    map.setCenter(new qq.maps.LatLng(lat, lng))
    map.setZoom(15)
  }
}

// 打开添加钓点表单
const openAddSpotForm = () => {
  // 如果有临时标注，使用临时标注的坐标
  if (tempLocation.value) {
    newSpot.value.latitude = tempLocation.value.lat
    newSpot.value.longitude = tempLocation.value.lng
  } else if (map) {
    // 否则使用地图中心
    const center = map.getCenter()
    newSpot.value.latitude = center.getLat()
    newSpot.value.longitude = center.getLng()
  } else {
    // 最后使用当前位置
    newSpot.value.latitude = currentLocation.value.lat
    newSpot.value.longitude = currentLocation.value.lng
  }
  showAddSpot.value = true
}

// 保存钓点
const saveSpot = async () => {
  if (!newSpot.value.name.trim()) {
    showToast('请输入钓点名称')
    return
  }
  
  try {
    await spotApi.add({
      name: newSpot.value.name,
      address: newSpot.value.address,
      latitude: newSpot.value.latitude,
      longitude: newSpot.value.longitude,
      fishingStyles: newSpot.value.fishingStyles.join(','),
      isFree: newSpot.value.isFree ? 1 : 0,
      description: newSpot.value.description,
    })
    
    showToast('添加成功！')
    showAddSpot.value = false
    
    // 清除临时标注
    if (tempMarker) {
      tempMarker.setMap(null)
      tempMarker = null
    }
    tempLocation.value = null
    hasTempMarker.value = false
    
    // 重置表单
    newSpot.value = {
      name: '',
      address: '',
      latitude: currentLocation.value.lat,
      longitude: currentLocation.value.lng,
      fishingStyles: [],
      isFree: true,
      description: '',
    }
    
    // 重新加载钓点
    await loadSpots(currentLocation.value.lat, currentLocation.value.lng)
    renderMarkers()
  } catch (e: any) {
    console.error('❌ saveSpot 失败:', e?.message || e, '| response:', e?.response?.data, '| status:', e?.response?.status)
    showToast('添加失败: ' + (e?.response?.data?.message || e?.message || '未知错误'))
    return  // 不再走演示模式
    const spot: any = {
      id: Date.now(),
      name: newSpot.value.name,
      address: newSpot.value.address,
      latitude: newSpot.value.latitude,
      longitude: newSpot.value.longitude,
      fishingStyles: newSpot.value.fishingStyles.join(','),
      isFree: newSpot.value.isFree,
      description: newSpot.value.description,
      distance: '0',
      avgRating: 0,
      totalReviews: 0,
    }
    spots.value.push(spot)
    showToast('已添加（演示模式）')
    showAddSpot.value = false
    
    // 清除临时标注
    if (tempMarker) {
      tempMarker.setMap(null)
      tempMarker = null
    }
    tempLocation.value = null
    hasTempMarker.value = false
    
    renderMarkers()
  }
}

// 去记录渔获
const goCatch = (spot: any) => {
  showDetail.value = false
  router.push(`/catch?spotId=${spot.id}&spotName=${encodeURIComponent(spot.name)}`)
}

// 搜索钓点
const onSearch = async () => {
  if (!keyword.value) return
  try {
    const res = await spotApi.search(keyword.value)
    spots.value = res.data || []
    expanded.value = true
    renderMarkers()
  } catch (e) {
    showToast('搜索失败，请重试')
  }
}

// 获取定位
const getLocation = () => {
  return new Promise<{ lat: number; lng: number }>((resolve) => {
    if (!navigator.geolocation) {
      // 定位不支持时用默认坐标（广州）
      resolve({ lat: 23.12, lng: 113.32 })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
      },
      () => {
        showToast('定位失败，使用默认位置')
        resolve({ lat: 23.12, lng: 113.32 })
      },
      { timeout: 8000 }
    )
  })
}

// 重建 SuperCluster 索引（每次 loadSpots 后调用）
const rebuildClusterIndex = () => {
  if (!cluster) {
    cluster = new Supercluster({
      radius: 60,
      maxZoom: 16,
      minZoom: 0,
    })
  }
  const features = spots.value.map((spot: any, i: number) => ({
    type: 'Feature',
    properties: { index: i, spotId: spot.id, name: spot.name },
    geometry: {
      type: 'Point',
      coordinates: [Number(spot.longitude), Number(spot.latitude)],
    },
  }))
  cluster.load(features)
}

// 过滤钓点
watch(activeTab, (val) => {
  if (val === 'free') {
    spots.value = spots.value.filter(s => s.isFree === true || s.isFree === 1)
  } else {
    loadSpots(23.12, 113.32) // 重新加载
  }
})

// 加载钓点并定位
const loadAndFocusSpot = async (spotId: number) => {
  try {
    const res: any = await spotApi.detail(spotId)
    const spot = res?.data || res
    if (!spot) return

    // 更新地图中心
    if (map && spot.latitude && spot.longitude) {
      const center = new qq.maps.LatLng(Number(spot.latitude), Number(spot.longitude))
      map.panTo(center)
      map.setZoom(15)
    }

    // 显示详情弹窗
    showDetail.value = true
    currentSpot.value = spot

    // 高亮标注
    const marker = markers.find(m => m.getMap() && m.spotId === spotId)
    if (marker) {
      qq.maps.event.trigger(marker, 'click')
    }
  } catch (e) {
    console.error('🔴 加载钓点详情失败:', e)
  }
}

onMounted(async () => {
  const { lat, lng } = await getLocation()
  currentLocation.value = { lat, lng }
  newSpot.value.latitude = lat
  newSpot.value.longitude = lng
  initMap(lat, lng)
  await loadSpots(lat, lng)
  renderMarkers()

  // 如果有 spotId 参数，跳转到该钓点位置
  const spotId = route.query.spotId
  if (spotId) {
    await loadAndFocusSpot(Number(spotId))
  }
})

onUnmounted(() => {
  if (map) {
    // 清理
    markers.forEach((m: any) => m.setMap(null))
    markers = []
  }
})
</script>

<style scoped>
.spot-view { height: 100vh; display: flex; flex-direction: column; background: #F5F7FA; }
.search-bar { background: white; }
.filter-tabs {
  display: flex; gap: 8px; padding: 8px 12px;
  background: white; border-bottom: 1px solid #f0f0f0; overflow-x: auto;
}
.tab { font-size: 13px; padding: 4px 12px; border-radius: 16px; color: #666; background: #f5f5f5; white-space: nowrap; flex-shrink: 0; }
.tab.active { background: #0D7377; color: white; }
.map-container { flex: 1; background: #e8eef0; position: relative; min-height: 200px; }
.locating-tip {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: white; padding: 8px 16px; border-radius: 20px;
  font-size: 13px; display: flex; align-items: center; gap: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1); z-index: 10;
}
/* 添加钓点按钮 - 右下角悬浮 */
.add-spot-btn {
  position: absolute; bottom: 90px; right: 16px;
  width: 56px; height: 56px; background: linear-gradient(135deg, #14B8A6 0%, #0D7377 100%);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(13,115,119,0.5);
  cursor: pointer; z-index: 20;
  transition: transform 0.2s, box-shadow 0.2s;
}
.add-spot-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2px 8px rgba(13,115,119,0.4);
}
.add-icon { color: white; font-size: 32px; font-weight: 300; }
/* 定位按钮 - 在添加按钮上方 */
.locate-btn {
  position: absolute; bottom: 156px; right: 16px;
  width: 44px; height: 44px; background: white;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 12px rgba(0,0,0,0.15);
  cursor: pointer; z-index: 20; font-size: 20px;
  transition: transform 0.2s;
}
.locate-btn:active {
  transform: scale(0.95);
}
/* 点击提示 */
.click-tip {
  position: absolute; bottom: 156px; right: 68px;
  background: rgba(0,0,0,0.75); color: white;
  padding: 6px 12px; border-radius: 16px;
  font-size: 12px; white-space: nowrap;
  z-index: 19; opacity: 0.9;
}
.click-tip::after {
  content: ''; position: absolute; right: -6px; top: 50%;
  transform: translateY(-50%);
  border: 6px solid transparent;
  border-left-color: rgba(0,0,0,0.75);
}
/* 添加钓点弹窗 */
.popup-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 100;
  display: flex; align-items: flex-end;
}
.add-spot-form {
  background: white; width: 100%; border-radius: 16px 16px 0 0;
  max-height: 80vh; overflow-y: auto; padding-bottom: env(safe-area-inset-bottom);
}
.form-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; border-bottom: 1px solid #f0f0f0;
}
.form-title { font-size: 15px; font-weight: 600; }
.cancel-text { font-size: 14px; color: #666; cursor: pointer; }
.submit-text { font-size: 14px; color: #0D7377; font-weight: 600; cursor: pointer; }
.form-body { padding: 16px; }
.form-row { margin-bottom: 16px; }
.form-row label { display: block; font-size: 13px; color: #666; margin-bottom: 6px; }
.form-row input[type="text"] {
  width: 100%; height: 40px; padding: 0 12px; border: 1px solid #e5e7eb;
  border-radius: 6px; font-size: 14px; outline: none;
}
.form-row input:focus { border-color: #0D7377; }
.form-row textarea {
  width: 100%; min-height: 80px; padding: 10px 12px; border: 1px solid #e5e7eb;
  border-radius: 6px; font-size: 14px; outline: none; resize: none;
}
.location-display {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 10px 12px; background: #f5f7fa; border-radius: 6px;
  font-size: 13px; color: #333;
}
.location-coords { color: #0D7377; font-weight: 500; }
.location-hint { color: #999; font-size: 12px; }
.relocate-btn { color: #0D7377; cursor: pointer; font-size: 12px; white-space: nowrap; }
.tag-options { display: flex; flex-wrap: wrap; gap: 8px; }
.tag {
  padding: 6px 14px; background: #f5f5f5; border-radius: 16px;
  font-size: 13px; color: #666; cursor: pointer;
}
.tag.active { background: #0D7377; color: white; }
.bottom-sheet {
  background: white; border-radius: 16px 16px 0 0;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
  max-height: 36vh; transition: max-height 0.3s;
  position: absolute; bottom: 0; left: 0; right: 0;
}
.bottom-sheet.expanded { max-height: 70vh; overflow-y: auto; }
.sheet-handle { padding: 10px 16px 6px; cursor: pointer; text-align: center; }
.handle-bar { width: 40px; height: 4px; background: #ddd; border-radius: 2px; margin: 0 auto 8px; }
.sheet-title { font-size: 14px; font-weight: 600; color: #1A2634; display: flex; align-items: center; justify-content: center; gap: 6px; }
.toggle-icon { font-size: 12px; }
.sheet-content { padding: 0 12px 80px; }
.spot-item { display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f5f5f5; cursor: pointer; }
.spot-item:active { background: #f5f7fa; }
.spot-icon { font-size: 28px; flex-shrink: 0; }
.spot-info { flex: 1; }
.spot-name { font-size: 14px; font-weight: 600; color: #1A2634; margin-bottom: 3px; }
.spot-meta { font-size: 12px; color: #6B7280; margin-bottom: 2px; }
.spot-rating { font-size: 11px; color: #FF8C42; }
.empty-tip { text-align: center; padding: 20px; font-size: 13px; color: #6B7280; }
/* 钓点详情 */
.spot-detail { padding: 20px; }
.detail-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.detail-name { font-size: 18px; font-weight: 700; color: #1A2634; }
.detail-rating { color: #FF8C42; font-size: 14px; }
.detail-desc { font-size: 14px; color: #6B7280; margin-bottom: 10px; line-height: 1.6; }
.detail-meta { font-size: 13px; color: #1A2634; margin-bottom: 10px; display: flex; gap: 10px; }
.detail-styles { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
.style-tag { font-size: 12px; background: #f0f5f5; color: #0D7377; padding: 2px 8px; border-radius: 10px; }
.detail-actions { display: flex; gap: 10px; }
</style>

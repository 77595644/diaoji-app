<template>
  <div class="profile-view">

    <!-- 头部 -->
    <div class="profile-header">
      <img :src="user?.avatarUrl || 'https://ui-avatars.com/api/?size=60&background=0D7377&color=fff&name='" class="avatar" />
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

    <!-- ===== 钓鱼日历 ===== -->
    <div class="calendar-section">
      <div class="calendar-header">
        <span class="cal-title">🎣 钓鱼日历</span>
        <div class="cal-nav">
          <button class="cal-nav-btn" @click="changeMonth(-1)">‹</button>
          <span class="cal-month">{{ calYear }}年{{ String(calMonth).padStart(2,'0') }}月</span>
          <button class="cal-nav-btn" @click="changeMonth(1)">›</button>
        </div>
      </div>

      <!-- 星期标题 -->
      <div class="cal-weekdays">
        <span v-for="d in ['日','一','二','三','四','五','六']" :key="d">{{ d }}</span>
      </div>

      <!-- 日期网格 -->
      <div class="cal-grid">
        <!-- 前导空白 -->
        <div v-for="_ in calFirstDay" :key="'e'+_" class="cal-day empty"></div>
        <!-- 当月每一天 -->
        <div
          v-for="day in calDaysInMonth"
          :key="day"
          class="cal-day"
          :class="getDayClass(day)"
          @click="onDayClick(day)"
        >
          <span class="day-num">{{ day }}</span>
          <span v-if="hasRecord(day)" class="day-dot">🐟</span>
        </div>
      </div>

      <!-- 月度统计 -->
      <div class="cal-summary">
        <template v-if="calLoading">
          <van-loading size="14px" color="#0D7377" /> 加载中...
        </template>
        <template v-else>
          <span>本月出钓 <strong>{{ monthRecordDays }}</strong> 天，共 <strong>{{ monthRecordCount }}</strong> 条渔获</span>
        </template>
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
      <div class="menu-item" @click="showToast('成就中心功能即将上线')">
        <span class="menu-icon">🏆</span>
        <span class="menu-text">成就中心</span>
        <span class="menu-tag">即将上线</span>
      </div>
    </div>

    <div class="menu-section">
      <div class="menu-item" @click="showToast('设置功能开发中')">
        <span class="menu-icon">⚙️</span>
        <span class="menu-text">设置</span>
        <span class="menu-arrow">›</span>
      </div>
      <div class="menu-item" @click="showToast('帮助与反馈功能开发中')">
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

    <!-- 多条渔获选择弹层 -->
    <van-action-sheet
      v-model:show="sheetShow"
      :title="`${calMonth}月${sheetDay}日 渔获`"
      :actions="sheetActions"
      @select="onSheetSelect"
      cancel-text="取消"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { userApi, catchApi } from '@/api/user'
import { showConfirmDialog, showToast } from 'vant'

const router = useRouter()
const user = ref<any>(null)
const stats = ref<any>({})

// ActionSheet 状态
const sheetShow = ref(false)
const sheetDay = ref(0)
const sheetActions = ref<{ name: string; recordId: number }[]>([])

// ===== 钓鱼日历 =====
const calYear = ref(new Date().getFullYear())
const calMonth = ref(new Date().getMonth() + 1)
const calLoading = ref(false)
const recordDates = ref<Set<string>>(new Set()) // 'YYYY-MM-DD' 格式，有记录的日期
const allRecords = ref<any[]>([])              // 预加载的所有渔获

const calFirstDay = computed(() => new Date(calYear.value, calMonth.value - 1, 1).getDay())
const calDaysInMonth = computed(() => new Date(calYear.value, calMonth.value, 0).getDate())

const dk = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`

// 当月有记录的日期集合
const monthSet = computed(() => {
  const pre = `${calYear.value}-${String(calMonth.value).padStart(2,'0')}`
  return new Set([...recordDates.value].filter(d => d.startsWith(pre)))
})
const monthRecordDays = computed(() => monthSet.value.size)
const monthRecordCount = computed(() => {
  const pre = `${calYear.value}-${String(calMonth.value).padStart(2,'0')}`
  return allRecords.value
    .filter(r => r.createdAt?.startsWith(pre))
    .reduce((sum, r) => sum + (r.quantity || 1), 0)
})

const hasRecord = (day: number) => monthSet.value.has(dk(calYear.value, calMonth.value, day))

function getDayClass(day: number) {
  const today = new Date()
  const isToday = calYear.value === today.getFullYear()
    && calMonth.value === today.getMonth() + 1
    && day === today.getDate()
  if (hasRecord(day)) return isToday ? 'has-record is-today' : 'has-record'
  if (isToday) return 'is-today'
  return ''
}

// 预加载用户所有渔获（最多 5 页 × 50 条 ≈ 250 条，覆盖近一年）
async function loadAllRecords() {
  calLoading.value = true
  const recs: any[] = []
  try {
    for (let page = 1; page <= 5; page++) {
      const res: any = await catchApi.list(page, 50)
      const list: any[] = res?.data?.records || res?.data?.list || []
      if (!list.length) break
      recs.push(...list)
    }
    allRecords.value = recs
    recordDates.value = new Set(
      recs.filter(r => r.createdAt).map(r => r.createdAt.substring(0, 10))
    )
  } catch {
    allRecords.value = []
    recordDates.value = new Set()
  } finally {
    calLoading.value = false
  }
}

function changeMonth(delta: number) {
  let m = calMonth.value + delta
  let y = calYear.value
  if (m > 12) { m = 1; y++ }
  if (m < 1)  { m = 12; y-- }
  calYear.value = y
  calMonth.value = m
}

// 点击某一天
function onDayClick(day: number) {
  const key = dk(calYear.value, calMonth.value, day)
  if (!recordDates.value.has(key)) {
    showToast(`${calMonth.value}月${day}日 无渔获记录`)
    return
  }
  const dayRecs = allRecords.value.filter(r => r.createdAt?.startsWith(key))
  if (dayRecs.length === 1) {
    router.push(`/record/${dayRecs[0].id}`)
    return
  }
  // 多条 → 弹出 ActionSheet
  sheetDay.value = day
  sheetActions.value = dayRecs.map(r => ({
    name: `${r.fishSpecies || '🐟'}  ${r.weight ?? '?'}斤${r.spotName ? ' · ' + r.spotName : ''}`,
    recordId: r.id,
  }))
  sheetShow.value = true
}

function onSheetSelect(item: { name: string; recordId: number }) {
  router.push(`/record/${item.recordId}`)
}

const editProfile = () => showToast('编辑资料功能开发中')

const logout = async () => {
  try {
    await showConfirmDialog({ title: '退出登录', message: '确定退出当前账号？' })
    localStorage.clear()
    router.replace('/login')
  } catch { /* 用户取消 */ }
}

onMounted(async () => {
  const token = localStorage.getItem('token')
  if (!token) { router.replace('/login'); return }

  try {
    const [profileRes, statsRes] = await Promise.all([
      userApi.getProfile(),
      userApi.getStats(),
    ])
    user.value = profileRes?.data || { nickname: '钓友' }
    stats.value = statsRes?.data || {}
    await loadAllRecords()
  } catch {
    user.value = { nickname: '钓友' }
    showToast('加载失败')
  }
})
</script>

<style scoped>
.profile-view { padding: 0 0 80px; background: #F5F7FA; min-height: 100vh; }

/* 头部 */
.profile-header {
  background: linear-gradient(135deg, #0D7377 0%, #14919B 100%);
  color: white;
  padding: 24px 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.avatar {
  width: 60px; height: 60px; border-radius: 50%;
  background: rgba(255,255,255,0.3);
  border: 2px solid rgba(255,255,255,0.5);
  object-fit: cover; flex-shrink: 0;
}
.user-info { flex: 1; }
.nickname { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
.styles { display: flex; gap: 6px; flex-wrap: wrap; }
.style-tag { font-size: 11px; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 10px; }

/* 数据看板 */
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
.stat-num { font-size: 20px; font-weight: 700; color: #0D7377; }
.unit { font-size: 12px; font-weight: 400; }
.stat-label { font-size: 12px; color: #6B7280; margin-top: 4px; }

/* 快捷操作 */
.quick-actions {
  display: flex;
  background: white;
  margin: 0 12px 12px;
  border-radius: 12px;
  padding: 16px;
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

/* ===== 钓鱼日历 ===== */
.calendar-section {
  background: white;
  margin: 0 12px 12px;
  border-radius: 12px;
  padding: 14px 14px 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.cal-title { font-size: 15px; font-weight: 700; color: #1A2634; }
.cal-nav { display: flex; align-items: center; gap: 8px; }
.cal-nav-btn {
  width: 28px; height: 28px; border: none; background: #F0F2F5;
  border-radius: 50%; font-size: 16px; cursor: pointer; color: #374151;
  display: flex; align-items: center; justify-content: center;
  line-height: 1;
}
.cal-nav-btn:active { background: #E5E7EB; }
.cal-month { font-size: 13px; color: #374151; font-weight: 600; min-width: 100px; text-align: center; }

/* 星期标题 */
.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 6px;
}
.cal-weekdays span {
  text-align: center;
  font-size: 11px;
  color: #9CA3AF;
  padding: 4px 0;
  font-weight: 600;
}

/* 日期网格 */
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.cal-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  transition: background 0.15s;
  font-size: 13px;
}
.cal-day:active { background: #F0F2F5; }
.cal-day.empty { cursor: default; }

.day-num { line-height: 1; color: #374151; }
.day-dot { font-size: 9px; line-height: 1; position: absolute; bottom: 3px; }

/* 有渔获 → 绿色高亮 */
.cal-day.has-record {
  background: linear-gradient(135deg, #DCFCE7, #BBF7D0);
  border: 1.5px solid #22C55E;
}
.cal-day.has-record .day-num { color: #15803D; font-weight: 700; }

/* 今天无记录 → 浅蓝边框 */
.cal-day.is-today { border: 1.5px solid #0D7377; }
.cal-day.is-today .day-num { color: #0D7377; font-weight: 700; }

/* 有记录又是今天 */
.cal-day.has-record.is-today {
  background: linear-gradient(135deg, #DCFCE7, #86EFAC);
  border: 2px solid #16A34A;
}
.cal-day.has-record.is-today .day-num { color: #15803D; }

/* 月度统计 */
.cal-summary {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #F3F4F6;
  font-size: 12px;
  color: #6B7280;
  display: flex;
  align-items: center;
  gap: 6px;
}
.cal-summary strong { color: #0D7377; font-weight: 700; }

/* 菜单 */
.menu-section {
  background: white;
  margin: 0 12px 12px;
  border-radius: 12px;
  overflow: hidden;
}
.menu-item {
  padding: 14px 16px;
  display: flex; align-items: center; gap: 12px;
  font-size: 14px; color: #1A2634;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}
.menu-item:last-child { border-bottom: none; }
.menu-item:active { background: #f9fafb; }
.menu-icon { font-size: 18px; }
.menu-text { flex: 1; }
.menu-arrow { color: #9CA3AF; font-size: 16px; }
.menu-tag { font-size: 10px; background: #FEF3C7; color: #D97706; padding: 2px 6px; border-radius: 4px; }
.menu-item.danger .menu-text { color: #EF4444; }

.version { text-align: center; color: #9CA3AF; font-size: 12px; padding: 20px 0; }
</style>

<template>
  <div class="guide-view">
    <div class="guide-header">
      <div class="logo">🎣</div>
      <div class="title">欢迎使用钓迹</div>
      <div class="subtitle">选择你的主攻钓法，我们会为你推荐合适的钓点和鱼情</div>
    </div>

    <div class="style-grid">
      <div
        v-for="style in fishingStyles"
        :key="style.value"
        class="style-card"
        :class="{ selected: selectedStyle === style.value }"
        @click="selectedStyle = style.value"
      >
        <div class="style-icon">{{ style.icon }}</div>
        <div class="style-name">{{ style.label }}</div>
        <div class="style-desc">{{ style.desc }}</div>
        <div class="check-mark" v-if="selectedStyle === style.value">✓</div>
      </div>
    </div>

    <div class="guide-footer">
      <van-button
        block
        type="primary"
        :disabled="!selectedStyle"
        @click="completeGuide"
        class="primary-btn"
      >
        完成，开启钓鱼之旅
      </van-button>
      <div class="skip-link" @click="skipGuide">先跳过，随便看看</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showLoadingToast, closeToast } from 'vant'
import request from '@/api/request'

const router = useRouter()
const selectedStyle = ref('')

const fishingStyles = [
  { icon: '🎣', label: '台钓', value: '台钓', desc: '台钓竿，适合静水池塘' },
  { icon: '🪝', label: '路亚', value: '路亚', desc: '拟饵假饵，追逐攻击性鱼种' },
  { icon: '🐟', label: '海钓', value: '海钓', desc: '出海或礁石，体验搏鱼快感' },
  { icon: '🫧', label: '筏钓', value: '筏钓', desc: '浮排/渔排钓位，水深鱼大' },
  { icon: '🎯', label: '传统钓', value: '传统钓', desc: '七星漂朝天钩，经典钓法' },
  { icon: '⚓', label: '矶钓', value: '矶钓', desc: '海岸礁石挑战，专业钓法' },
]

const completeGuide = async () => {
  if (!selectedStyle.value) return
  showLoadingToast({ message: '保存中...', forbidClick: true, duration: 0 })

  // 尝试保存钓法偏好到后端（非关键，失败也继续）
  try {
    await request.post('/user/preferences', { fishingStyles: selectedStyle.value })
  } catch (e) { /* 忽略 */ }

  // 标记引导完成，保存钓法偏好
  localStorage.setItem('guide_done', '1')
  localStorage.setItem('fishing_style', selectedStyle.value)
  closeToast()
  router.replace('/')
}

const skipGuide = () => {
  localStorage.setItem('guide_done', '1')
  router.replace('/')
}
</script>

<style scoped>
.guide-view {
  min-height: 100vh;
  background: #F0FAFA;
  display: flex;
  flex-direction: column;
  padding: 40px 20px 32px;
}
.guide-header { text-align: center; margin-bottom: 32px; }
.logo { font-size: 56px; margin-bottom: 12px; }
.title { font-size: 24px; font-weight: 700; color: #1A2634; margin-bottom: 8px; }
.subtitle { font-size: 14px; color: #6B7280; line-height: 1.6; }

.style-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  flex: 1;
  overflow-y: auto;
  margin-bottom: 16px;
}
.style-card {
  background: white;
  border-radius: 16px;
  padding: 16px 12px;
  border: 2px solid transparent;
  transition: all 0.2s;
  position: relative;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.style-card.selected { border-color: #0D7377; background: #f0f9f9; }
.style-icon { font-size: 32px; margin-bottom: 6px; }
.style-name { font-size: 15px; font-weight: 600; color: #1A2634; margin-bottom: 4px; }
.style-desc { font-size: 11px; color: #9CA3AF; line-height: 1.4; }
.check-mark {
  position: absolute; top: 8px; right: 8px;
  width: 20px; height: 20px; border-radius: 50%;
  background: #0D7377; color: white;
  font-size: 12px; display: flex; align-items: center; justify-content: center;
}

.guide-footer { padding-top: 8px; }
.primary-btn {
  background: #0D7377 !important;
  border: none !important;
  border-radius: 10px;
  height: 48px;
  font-size: 16px;
}
.skip-link {
  text-align: center;
  font-size: 13px;
  color: #9CA3AF;
  margin-top: 14px;
  padding: 8px;
  cursor: pointer;
}
</style>

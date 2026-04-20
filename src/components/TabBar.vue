<template>
  <div class="tab-bar">
    <router-link to="/" class="tab-item" :class="{ active: route.path === '/' }">
      <span class="tab-icon">🌊</span>
      <span class="tab-label">首页</span>
    </router-link>
    <router-link to="/spot" class="tab-item" :class="{ active: route.path === '/spot' }">
      <span class="tab-icon">🗺️</span>
      <span class="tab-label">钓点</span>
    </router-link>
    <router-link to="/catch" class="tab-catch">
      <div class="catch-btn">
        <span>🎣</span>
      </div>
    </router-link>
    <router-link to="/feed" class="tab-item" :class="{ active: route.path === '/feed' }">
      <span class="tab-icon">👥</span>
      <span class="tab-label">钓友</span>
    </router-link>
    <router-link to="/profile" class="tab-item" :class="{ active: route.path === '/profile' }">
      <span class="tab-icon">👤</span>
      <span class="tab-label">我的</span>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-top: 1px solid #eee;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
}
.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #999;
  font-size: 10px;
  gap: 2px;
  transition: color 0.2s;
}
.tab-item.active { color: #0D7377; }
.tab-item.active .tab-icon { transform: scale(1.1); }
.tab-icon { font-size: 22px; }
.tab-label { font-size: 10px; }
.tab-catch {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.catch-btn {
  width: 52px;
  height: 52px;
  background: #0D7377;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  box-shadow: 0 4px 12px rgba(13, 115, 119, 0.35);
  transform: translateY(-8px);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.catch-btn:active {
  transform: translateY(-6px) scale(0.96);
  box-shadow: 0 2px 6px rgba(13, 115, 119, 0.3);
}
</style>

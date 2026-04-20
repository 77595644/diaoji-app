<template>
  <div class="catch-form">
    <div class="form-header">
      <span class="back" @click="$router.back()">←</span>
      <span class="title">{{ isEdit ? '编辑渔获' : '记录渔获' }}</span>
      <span class="placeholder"></span>
    </div>

    <!-- Step 1：拍照 -->
    <div class="step-section" v-if="step === 1">
      <div class="step-title">Step 1：拍张照 📷 <span class="photo-count">{{ photos.length }}/3</span></div>
      <div class="photo-grid">
        <!-- 已选图片 -->
        <div v-for="(p, idx) in photos" :key="idx" class="photo-cell">
          <img :src="p" class="photo-thumb" />
          <span class="photo-remove" @click="removePhoto(idx)">✕</span>
        </div>
        <!-- 添加按钮 -->
        <div v-if="photos.length < 3" class="photo-cell photo-add" @click="choosePhoto">
          <span class="add-icon">+</span>
          <span class="add-tip">{{ photos.length === 0 ? '至少1张' : '添加' }}</span>
        </div>
      </div>
      <input 
        type="file" 
        accept="image/*" 
        ref="fileInput" 
        style="display:none" 
        @change="onFileChange"
      />
    </div>

    <!-- Step 2：填写信息 -->
    <div class="step-section" v-if="step === 2">
      <div class="step-title">Step 2：填写信息 ✍️</div>
      <div class="form-body">
        <div class="field-row" @click="showFishPicker = true">
          <span class="field-label">鱼种</span>
          <span class="field-value">{{ form.fishSpecies || '请选择' }}</span>
        </div>
        <div class="field-row">
          <span class="field-label">重量（斤）</span>
          <input type="number" v-model.number="form.weight" placeholder="请输入" class="field-input" />
        </div>
        <div class="field-row">
          <span class="field-label">数量（条）</span>
          <input type="number" v-model.number="form.quantity" placeholder="默认1" class="field-input" />
        </div>
        <div class="field-row">
          <span class="field-label">长度（cm）</span>
          <input type="number" v-model.number="form.length" placeholder="选填" class="field-input" />
        </div>
        <div class="feeling-row">
          <span class="label">鱼情</span>
          <div class="feeling-options">
            <span
              v-for="f in feelings"
              :key="f.value"
              class="feeling-tag"
              :class="{ active: form.fishFeeling === f.value }"
              @click="form.fishFeeling = f.value"
            >{{ f.label }}</span>
          </div>
        </div>
        <div class="field-row">
          <span class="field-label">备注</span>
          <input type="text" v-model="form.note" placeholder="选填" maxlength="100" class="field-input" />
        </div>
      </div>
    </div>

    <!-- Step 3：关联钓点 -->
    <div class="step-section" v-if="step === 3">
      <div class="step-title">Step 3：关联钓点 📍</div>
      <div class="skip-tip" @click="skipSpot">跳过此步 →</div>
      <div class="field-row" @click="showSpotPicker = true">
        <span class="field-label">选择钓点</span>
        <span class="field-value">{{ form.spotName || '请选择' }}</span>
      </div>
      <div v-if="spots.length === 0" class="no-data">
        暂无附近钓点数据，可跳过此步
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="form-footer">
      <button v-if="step > 1" class="back-btn" @click="step--">上一步</button>
      <button
        class="next-btn"
        :class="{ disabled: !canNext }"
        :disabled="!canNext"
        @click="nextStep"
      >
        {{ isEdit ? '更新记录 ✏️' : step === 3 ? '保存记录 🎣' : '下一步' }}
      </button>
    </div>

    <!-- 鱼种选择弹窗 -->
    <div v-if="showFishPicker" class="popup-overlay" @click="showFishPicker = false">
      <div class="popup-content" @click.stop>
        <div class="popup-header">
          <span>选择鱼种</span>
          <span class="popup-close" @click="showFishPicker = false">✕</span>
        </div>
        <div class="picker-list">
          <div 
            v-for="fish in fishSpecies" 
            :key="fish" 
            class="picker-item"
            :class="{ active: form.fishSpecies === fish }"
            @click="selectFish(fish)"
          >
            {{ fish }}
          </div>
        </div>
      </div>
    </div>

    <!-- 钓点选择弹窗 -->
    <div v-if="showSpotPicker" class="popup-overlay" @click="showSpotPicker = false">
      <div class="popup-content" @click.stop>
        <div class="popup-header">
          <span>选择钓点</span>
          <span class="popup-close" @click="showSpotPicker = false">✕</span>
        </div>
        <div class="picker-list" v-if="spots.length > 0">
          <div 
            v-for="spot in spots" 
            :key="spot.id" 
            class="picker-item"
            :class="{ active: form.spotId === spot.id }"
            @click="selectSpot(spot)"
          >
            {{ spot.name }}
          </div>
        </div>
        <div v-else class="picker-empty">
          暂无钓点数据
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { spotApi, catchApi } from '@/api/user'

const router = useRouter()
const route = useRoute()
const step = ref(1)
const photos = ref<string[]>([])  // 多图 base64 数组，最多3张
const fileInput = ref<HTMLInputElement>()
const showFishPicker = ref(false)
const showSpotPicker = ref(false)

const form = ref({
  fishSpecies: '',
  weight: null as number | null,
  quantity: 1,
  length: null as number | null,
  fishFeeling: '',
  note: '',
  spotId: null as number | null,
  spotName: '',
})

// 编辑模式
const isEdit = ref(false)
const editRecordId = ref<number | null>(null)

const feelings = [
  { value: '好', label: '🟢 好' },
  { value: '一般', label: '🟡 一般' },
  { value: '差', label: '🔴 差' },
]

const fishSpecies = ['鲫鱼', '鲤鱼', '草鱼', '青鱼', '鲢鳙', '翘嘴鲌', '马口鱼', '鳜鱼', '黑鱼', '黄颡鱼', '罗非鱼', '鲈鱼']

const spots = ref<any[]>([])

const canNext = computed(() => {
  if (step.value === 1) return photos.value.length > 0
  if (step.value === 2) return !!form.value.fishSpecies && form.value.weight != null && form.value.weight > 0
  return true
})

onMounted(async () => {
  // 编辑模式：URL 传了 recordId
  const recordIdFromUrl = route.query.recordId
  if (recordIdFromUrl) {
    isEdit.value = true
    editRecordId.value = Number(recordIdFromUrl)
    try {
      const res: any = await catchApi.detail(Number(recordIdFromUrl))
      const rec: any = res?.data || res
      if (rec) {
        form.value.fishSpecies = rec.fishSpecies || ''
        form.value.weight = rec.weight || null
        form.value.quantity = rec.quantity || 1
        form.value.length = rec.length || null
        form.value.fishFeeling = rec.fishFeeling || ''
        form.value.note = rec.note || ''
        form.value.spotId = rec.spotId || null
        form.value.spotName = rec.spotName || ''
        // 回填图片
        if (rec.photoUrl) photos.value = [rec.photoUrl]
        if (rec.photos) {
          try { photos.value = JSON.parse(rec.photos) } catch {}
        }
      }
    } catch {
      alert('无法加载渔获数据')
      router.back()
      return
    }
  }

  const spotIdFromUrl = route.query.spotId
  const spotNameFromUrl = route.query.spotName

  if (spotIdFromUrl && spotNameFromUrl) {
    form.value.spotId = Number(spotIdFromUrl)
    form.value.spotName = decodeURIComponent(spotNameFromUrl as string)
  }

  if (isEdit.value) return  // 编辑模式不需要加载附近钓点列表

  try {
    const res: any = await spotApi.nearby(23.12, 113.32, 1, 50)
    spots.value = res?.data?.records || res?.data?.list || res?.data || []

    if (form.value.spotId && !spots.value.find((s: any) => s.id === form.value.spotId)) {
      spots.value.unshift({
        id: form.value.spotId,
        name: form.value.spotName,
        latitude: 23.12,
        longitude: 113.32,
      })
    }
  } catch (e) {
    console.log('加载钓点失败')
    if (!spots.value.length) {
      spots.value = [
        { id: 1, name: '珠江钓场', latitude: 23.12, longitude: 113.32 },
        { id: 2, name: '白云湖', latitude: 23.15, longitude: 113.25 },
        { id: 3, name: '流溪河', latitude: 23.08, longitude: 113.40 },
      ]
    }
  }
})

const choosePhoto = () => {
  fileInput.value?.click()
}

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      if (photos.value.length < 3) {
        photos.value.push(base64)
      }
    }
    reader.readAsDataURL(file)
  }
  // 重置 input，允许重复选择同一文件
  target.value = ''
}

const removePhoto = (idx: number) => {
  photos.value.splice(idx, 1)
}

const selectFish = (fish: string) => {
  form.value.fishSpecies = fish
  showFishPicker.value = false
}

const selectSpot = (spot: any) => {
  form.value.spotId = spot.id
  form.value.spotName = spot.name
  showSpotPicker.value = false
}

const skipSpot = () => {
  form.value.spotId = null
  form.value.spotName = ''
  save()
}

const nextStep = () => {
  if (isEdit.value) {
    save()
    return
  }
  if (step.value < 3) {
    step.value++
  } else {
    save()
  }
}

const save = async () => {
  try {
    const data = {
      fishSpecies: form.value.fishSpecies,
      weight: form.value.weight,
      quantity: form.value.quantity || 1,
      length: form.value.length,
      fishFeeling: form.value.fishFeeling,
      note: form.value.note,
      spotId: form.value.spotId,
      photoUrl: photos.value[0] || '',
      photos: photos.value,
    }
    if (isEdit.value && editRecordId.value) {
      await catchApi.update(editRecordId.value, data)
      alert('更新成功！✏️')
      router.replace('/record/' + editRecordId.value)
    } else {
      await catchApi.add(data)
      alert('记录成功！🎉')
      router.replace('/')
    }
  } catch (e: any) {
    console.error('保存失败', e)
    alert('保存失败，请重试')
  }
}
</script>

<style scoped>
.catch-form { min-height: 100vh; background: #F5F7FA; padding-bottom: 80px; }
.form-header {
  background: white; padding: 12px 16px;
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid #eee;
}
.back { font-size: 18px; cursor: pointer; padding: 4px 8px; }
.title { font-size: 16px; font-weight: 600; }
.placeholder { width: 20px; }
.step-section { padding: 16px; }
.step-title { font-size: 16px; font-weight: 700; color: #1A2634; margin-bottom: 14px; }
.photo-count { font-size: 13px; font-weight: 400; color: #9CA3AF; margin-left: 6px; }

/* 多图网格 */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.photo-cell {
  position: relative;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  background: white;
}
.photo-thumb {
  width: 100%; height: 100%; object-fit: cover;
}
.photo-remove {
  position: absolute; top: 4px; right: 4px;
  width: 22px; height: 22px;
  background: rgba(0,0,0,0.5); color: white;
  border-radius: 50%; font-size: 12px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.photo-add {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  border: 2px dashed #d0d5dd;
  cursor: pointer;
  gap: 4px;
}
.photo-add:active { border-color: #0D7377; }
.add-icon { font-size: 28px; color: #9CA3AF; line-height: 1; }
.add-tip { font-size: 11px; color: #9CA3AF; }

.form-body { background: white; border-radius: 12px; overflow: hidden; }
.field-row {
  display: flex; align-items: center; padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0; cursor: pointer;
}
.field-label { font-size: 14px; color: #646566; width: 90px; flex-shrink: 0; }
.field-value { font-size: 14px; color: #333; flex: 1; text-align: right; }
.field-input { 
  flex: 1; border: none; outline: none; font-size: 14px; 
  text-align: right; background: transparent; 
}
.feeling-row { display: flex; align-items: center; padding: 10px 16px; border-bottom: 1px solid #f0f0f0; }
.feeling-row .label { font-size: 14px; color: #646566; margin-right: 12px; }
.feeling-options { display: flex; gap: 8px; flex: 1; justify-content: flex-end; }
.feeling-tag { padding: 4px 12px; border-radius: 14px; font-size: 13px; background: #f5f5f5; cursor: pointer; }
.feeling-tag.active { background: #0D7377; color: white; }
.skip-tip { font-size: 13px; color: #0D7377; text-align: right; margin-bottom: 10px; cursor: pointer; }
.no-data { font-size: 13px; color: #999; text-align: center; padding: 20px; }
.form-footer {
  position: fixed; bottom: 0; left: 0; right: 0;
  display: flex; gap: 10px; padding: 12px 16px;
  background: white; border-top: 1px solid #eee;
}
.back-btn { 
  flex: 1; height: 44px; border: 1px solid #ddd; border-radius: 8px; 
  background: white; font-size: 15px; cursor: pointer; 
}
.next-btn { 
  flex: 2; height: 44px; border: none; border-radius: 8px; 
  background: #0D7377; color: white; font-size: 15px; font-weight: 600;
  cursor: pointer;
}
.next-btn.disabled { background: #ccc; cursor: not-allowed; }

/* 弹窗样式 */
.popup-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: flex-end;
}
.popup-content {
  background: white; width: 100%; border-radius: 16px 16px 0 0;
  max-height: 60vh; overflow-y: auto;
}
.popup-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px; border-bottom: 1px solid #eee; font-weight: 600;
}
.popup-close { cursor: pointer; font-size: 18px; color: #999; }
.picker-list { padding: 8px 0; }
.picker-item {
  padding: 14px 16px; font-size: 15px; cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
}
.picker-item:hover { background: #f9f9f9; }
.picker-item.active { color: #0D7377; font-weight: 600; background: #f0fffe; }
.picker-empty { padding: 40px; text-align: center; color: #999; }
</style>

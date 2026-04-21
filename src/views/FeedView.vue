<template>
  <div class="feed-view">
    <!-- 顶部 -->
    <div class="feed-header">
      <span class="title">钓友圈</span>
      <button class="publish-btn" @click="showPublish = true">📷 发布</button>
    </div>

    <!-- Feed流 -->
    <div class="feed-list">
      <div v-if="posts.length === 0 && !loading" class="empty-state">
        <div class="empty-icon">🎣</div>
        <div class="empty-text">暂无动态，发布第一条吧~</div>
      </div>
      
      <div v-for="post in posts" :key="post.id" class="post-card">
        <!-- 用户信息 -->
        <div class="post-user">
          <img :src="post.user?.avatarUrl || '/avatar-default.png'" class="avatar" />
          <div class="user-info">
            <div class="nickname">{{ post.user?.nickname || '匿名钓友' }}</div>
            <div class="meta">{{ formatTime(post.createdAt) }}</div>
          </div>
        </div>
        <!-- 内容 -->
        <div class="post-content">{{ post.content }}</div>
        <!-- 图片 -->
        <div class="post-photos" v-if="post.photos?.length">
          <img
            v-for="(photo, idx) in post.photos"
            :key="idx"
            :src="photo"
            class="photo"
            @click="previewImage(post.photos, idx)"
          />
        </div>
        <!-- 关联信息 -->
        <div class="post-related" v-if="post.fishRecord || post.spot">
          <span v-if="post.fishRecord">🐟 {{ post.fishRecord.fishSpecies }} {{ post.fishRecord.weight }}斤</span>
          <span v-if="post.spot">📍 {{ post.spot.name }}</span>
        </div>
        <!-- 互动栏 -->
        <div class="post-actions">
          <span class="action-btn" @click="toggleLike(post)">
            {{ post.liked ? '❤️' : '🤍' }} {{ post.likeCount || '' }}
          </span>
          <span class="action-btn" @click="showComments(post)">
            💬 {{ post.commentCount || 0 }}
          </span>
          <span class="action-btn" @click="share(post)">
            ↗️ 分享
          </span>
        </div>
      </div>
      
      <div v-if="loading" class="loading-state">加载中...</div>
    </div>

    <!-- 发布弹窗 -->
    <div v-if="showPublish" class="popup-overlay" @click="showPublish = false">
      <div class="publish-form" @click.stop>
        <div class="publish-header">
          <span class="cancel-btn" @click="showPublish = false">取消</span>
          <span class="publish-title">发布动态</span>
          <span class="submit-btn" @click="publish">发布</span>
        </div>
        
        <textarea 
          v-model="newPost.content"
          placeholder="分享今天的鱼情..."
          class="content-input"
          maxlength="500"
        ></textarea>
        
        <div class="photo-upload-area">
          <div class="selected-photos">
            <div v-for="(photo, idx) in selectedPhotos" :key="idx" class="photo-item">
              <img :src="photo" class="photo-preview" />
              <span class="remove-photo" @click="removePhoto(idx)">✕</span>
            </div>
          </div>
          
          <div v-if="selectedPhotos.length < 9" class="add-photo-btn" @click="triggerUpload">
            <span class="add-icon">+</span>
            <span class="add-text">添加图片</span>
          </div>
        </div>
        
        <input 
          type="file" 
          ref="uploadInput" 
          accept="image/*" 
          multiple 
          style="display:none"
          @change="onPhotoSelect"
        />
      </div>
    </div>

    <!-- 评论面板 -->
    <CommentPanel
      v-model:show="showCommentPanel"
      :post-id="activePostId"
      @update:comment-count="(delta: number) => {
        const post = posts.find(p => p.id === activePostId)
        if (post) handleCommentCountChange(post, delta)
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { feedApi } from '@/api/user'
import CommentPanel from '@/components/CommentPanel.vue'

const loading = ref(false)
const posts = ref<any[]>([])
const page = ref(1)
const showPublish = ref(false)
const newPost = ref({ content: '' })
const selectedPhotos = ref<string[]>([])
const uploadInput = ref<HTMLInputElement>()

// 评论面板
const showCommentPanel = ref(false)
const activePostId = ref<number>(0)

// 加载Feed数据
onMounted(async () => {
  await loadPosts()
})

const loadPosts = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const res: any = await feedApi.feed(page.value, 10)
    const newPosts = res?.data?.records || res?.data?.list || []
    // 统一处理 photos 字段：后端返回的是 JSON 字符串，前端解析为数组
    const myUserId = parseInt(localStorage.getItem('userId') || '', 10) || null
    const processed = newPosts.map((post: any) => {
      // photos JSON 解析
      if (typeof post.photos === 'string' && post.photos) {
        try {
          post.photos = JSON.parse(post.photos)
        } catch {
          post.photos = []
        }
      } else if (!Array.isArray(post.photos)) {
        post.photos = []
      }
      // 构造 user 对象
      const isMine = (post.userId ?? post.user_id) === myUserId
      post.user = {
        id: post.userId ?? post.user_id,
        nickname: isMine ? '我' : (post.userNickname || post.user_nickname || '匿名钓友'),
        avatarUrl: post.userAvatarUrl || post.user_avatar_url || '',
      }
      post.isMine = isMine
      return post
    })
    posts.value = page.value === 1 ? processed : [...posts.value, ...processed]
    page.value++
  } catch (e) {
    console.error('加载失败', e)
  }
  loading.value = false
}

const triggerUpload = () => {
  uploadInput.value?.click()
}

const onPhotoSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (!files) return
  
  Array.from(files).forEach(file => {
    if (selectedPhotos.value.length >= 9) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        selectedPhotos.value.push(event.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  })
  
  // 重置input，允许重复选择同一文件
  target.value = ''
}

const removePhoto = (index: number) => {
  selectedPhotos.value.splice(index, 1)
}

const publish = async () => {
  if (!newPost.value.content.trim() && selectedPhotos.value.length === 0) {
    alert('请输入内容或添加图片')
    return
  }
  
  const publishedContent = newPost.value.content
  const publishedPhotos = [...selectedPhotos.value]
  
  try {
    await feedApi.publish({ 
      content: publishedContent, 
      photos: publishedPhotos 
    })
    // 后端只返回 postId，本地构造显示对象
    const newPostItem = {
      id: Date.now(),
      content: publishedContent,
      user: { nickname: '我', avatarUrl: '' },
      createdAt: '刚刚',
      photos: publishedPhotos,
      likeCount: 0,
      commentCount: 0,
      liked: false,
    }
    posts.value.unshift(newPostItem)
  } catch (e) {
    console.error('发布失败', e)
  }
  
  // 清空表单
  showPublish.value = false
  newPost.value = { content: '' }
  selectedPhotos.value = []
}

const toggleLike = async (post: any) => {
  try {
    if (post.liked) {
      await feedApi.unlike(post.id)
      post.liked = false
      post.likeCount = Math.max(0, (post.likeCount || 1) - 1)
    } else {
      await feedApi.like(post.id)
      post.liked = true
      post.likeCount = (post.likeCount || 0) + 1
    }
  } catch (e) {
    // 演示模式：本地切换
    post.liked = !post.liked
    post.likeCount = (post.likeCount || 0) + (post.liked ? 1 : -1)
  }
}

const showComments = (post: any) => {
  activePostId.value = post.id
  showCommentPanel.value = true
}

const handleCommentCountChange = (post: any, delta: number) => {
  post.commentCount = Math.max(0, (post.commentCount || 0) + delta)
}

const share = (post: any) => {
  alert('长按图片保存分享')
}

const previewImage = (photos: string[], index: number | string) => {
  // 可以用 window.open 或者第三方图片预览库
  alert(`预览第 ${Number(index) + 1} 张图片`)
}

const formatTime = (time: string) => {
  if (!time) return ''
  try {
    const d = new Date(time)
    if (isNaN(d.getTime())) return time
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}天前`
    // 超过7天显示具体日期
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    if (d.getFullYear() === now.getFullYear()) {
      return `${mm}-${dd} ${hh}:${mi}`
    }
    return `${d.getFullYear()}-${mm}-${dd}`
  } catch {
    return time
  }
}
</script>

<style scoped>
.feed-view { padding: 0 0 70px 0; background: #F5F7FA; min-height: 100vh; }
.feed-header {
  background: white; padding: 12px 16px;
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid #f0f0f0; position: sticky; top: 0; z-index: 10;
}
.title { font-size: 16px; font-weight: 700; color: #1A2634; }
.publish-btn { 
  background: #0D7377; color: white; border: none; 
  padding: 6px 12px; border-radius: 6px; font-size: 13px; 
  cursor: pointer;
}

.feed-list { padding: 8px; }
.empty-state { 
  display: flex; flex-direction: column; align-items: center; 
  padding: 60px 20px; color: #9CA3AF; 
}
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-text { font-size: 14px; }

.post-card { background: white; margin-bottom: 8px; padding: 14px; border-radius: 8px; }
.post-user { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.avatar { width: 40px; height: 40px; border-radius: 50%; background: #e5e7eb; }
.nickname { font-size: 14px; font-weight: 600; color: #1A2634; }
.meta { font-size: 11px; color: #9CA3AF; margin-top: 2px; }
.post-content { font-size: 14px; color: #1A2634; line-height: 1.6; margin-bottom: 10px; }
.post-photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-bottom: 10px; }
.photo { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 4px; cursor: pointer; }
.post-related { font-size: 12px; color: #0D7377; margin-bottom: 8px; display: flex; gap: 12px; }
.post-actions { display: flex; gap: 20px; padding-top: 8px; border-top: 1px solid #f0f0f0; }
.action-btn { font-size: 13px; color: #6B7280; cursor: pointer; user-select: none; }
.loading-state { text-align: center; padding: 20px; color: #999; }

/* 发布弹窗 */
.popup-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: flex-end;
}
.publish-form {
  background: white; width: 100%; border-radius: 16px 16px 0 0;
  max-height: 80vh; overflow-y: auto; padding-bottom: env(safe-area-inset-bottom);
}
.publish-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; border-bottom: 1px solid #f0f0f0;
}
.publish-title { font-size: 15px; font-weight: 600; }
.cancel-btn { font-size: 14px; color: #666; cursor: pointer; }
.submit-btn { font-size: 14px; color: #0D7377; font-weight: 600; cursor: pointer; }

.content-input {
  width: 100%; min-height: 120px; padding: 12px 16px;
  border: none; font-size: 15px; line-height: 1.6;
  resize: none; outline: none;
}

.photo-upload-area { padding: 12px 16px; }
.selected-photos { 
  display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; 
}
.photo-item { 
  position: relative; width: 80px; height: 80px; 
}
.photo-preview { 
  width: 100%; height: 100%; object-fit: cover; border-radius: 6px; 
}
.remove-photo {
  position: absolute; top: -6px; right: -6px;
  width: 20px; height: 20px; background: rgba(0,0,0,0.6);
  color: white; border-radius: 50%; display: flex;
  align-items: center; justify-content: center; font-size: 12px;
  cursor: pointer;
}
.add-photo-btn {
  width: 80px; height: 80px; border: 2px dashed #ddd;
  border-radius: 6px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; cursor: pointer;
  background: #fafafa;
}
.add-icon { font-size: 24px; color: #999; }
.add-text { font-size: 10px; color: #999; margin-top: 4px; }
</style>

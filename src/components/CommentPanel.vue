<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div v-if="show" class="comment-overlay" @click="handleOverlayClick">
        <div class="comment-panel" @click.stop>
          <!-- 标题栏 -->
          <div class="panel-header">
            <span class="panel-title">{{ replyingTo ? '回复' : '评论' }}</span>
            <span v-if="replyingTo" class="replying-hint">回复 @{{ replyingTo }}</span>
            <span class="close-btn" @click="closePanel">✕</span>
          </div>

          <!-- 回复取消 -->
          <div v-if="replyingTo" class="cancel-reply-bar" @click="cancelReply">
            取消回复
          </div>

          <!-- 评论列表 -->
          <div class="comment-list" ref="listRef" @scroll="onScroll">
            <div v-if="loading && comments.length === 0" class="loading-state">加载中...</div>
            <div v-else-if="comments.length === 0 && !loading" class="empty-comments">
              暂无评论，快来抢沙发~
            </div>

            <div
              v-for="comment in comments"
              :key="comment.id"
              class="comment-item"
              :data-id="comment.id"
            >
              <img :src="comment.user?.avatarUrl || '/avatar-default.png'" class="comment-avatar" />
              <div class="comment-body">
                <div class="comment-top">
                  <span class="comment-nickname">{{ comment.isMine ? '我' : (comment.user?.nickname || '匿名钓友') }}</span>
                  <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                </div>
                <div 
                  class="comment-content" 
                  :class="{ expanded: comment._expanded }"
                  @click="comment.content?.length > 40 && (comment._expanded = !comment._expanded)"
                >
                  {{ comment.content }}
                </div>
                <!-- 展开/收起提示 -->
                <div 
                  v-if="comment.content?.length > 40" 
                  class="expand-hint"
                  @click="comment._expanded = !comment._expanded"
                >{{ comment._expanded ? '收起' : '展开' }}</div>
                <!-- 回复列表 -->
                <div v-if="comment.replies?.length" class="reply-list">
                  <!-- 展开/收起回复列表 -->
                  <div 
                    v-if="!comment._repliesExpanded" 
                    class="replies-toggle"
                    @click="comment._repliesExpanded = true"
                  >展开 {{ comment.replies.length }} 条回复</div>
                  <template v-else>
                    <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
                      <div class="reply-header">
                        <span class="reply-nickname">{{ reply.user?.nickname || '匿名钓友' }}</span>
                        <span v-if="reply.replyToNickname" class="reply-to"> 回复 {{ reply.replyToNickname }}</span>
                        <span class="reply-time">{{ formatTime(reply.createdAt) }}</span>
                      </div>
                      <div class="reply-text">{{ reply.content }}</div>
                      <span class="reply-btn" @click="handleReply(reply)">回复</span>
                    </div>
                    <div class="replies-toggle" @click="comment._repliesExpanded = false">收起</div>
                  </template>
                </div>
                <!-- 操作按钮 -->
                <div class="comment-actions">
                  <span class="reply-btn" @click="handleReply(comment)">回复</span>
                  <span v-if="comment.isMine" class="delete-btn" @click="handleDelete(comment)">删除</span>
                </div>
              </div>
            </div>

            <div v-if="loading && comments.length > 0" class="loading-more">加载中...</div>
            <div v-if="!hasMore && comments.length > 0" class="no-more">— 没有更多了 —</div>
          </div>

          <!-- 输入栏 -->
          <div class="comment-input-bar">
            <input
              v-model="inputText"
              class="comment-input"
              :placeholder="replyingTo ? `回复 @${replyingTo}...` : '说点什么...'"
              maxlength="200"
              @keyup.enter="handleSend"
            />
            <button class="send-btn" :disabled="!inputText.trim()" @click="handleSend">
              发送
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 删除确认弹窗 -->
    <Transition name="fade">
      <div v-if="deleteTarget" class="delete-confirm-overlay" @click="deleteTarget = null">
        <div class="delete-confirm" @click.stop>
          <div class="confirm-text">确定删除这条评论？</div>
          <div class="confirm-btns">
            <span class="confirm-cancel" @click="deleteTarget = null">取消</span>
            <span class="confirm-ok" @click="confirmDelete">确定</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { feedApi } from '@/api/user'

const props = defineProps<{
  postId: number
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', val: boolean): void
  (e: 'update:commentCount', delta: number): void
}>()

const comments = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const size = 50
const hasMore = ref(true)
const inputText = ref('')
const replyingTo = ref<string | null>(null)
const replyingCommentId = ref<number | null>(null)
const replyingParentId = ref<number | null>(null)  // 顶级评论ID，用于嵌套显示
const listRef = ref<HTMLElement>()
const deleteTarget = ref<any>(null)

const currentUserId = ref<number | null>(null)

watch(() => props.show, async (val) => {
  if (val) {
    // 重置状态
    comments.value = []
    page.value = 1
    hasMore.value = true
    inputText.value = ''
    replyingTo.value = null
    replyingCommentId.value = null
    replyingParentId.value = null
    deleteTarget.value = null

    // 获取当前用户ID
    const storedUserId = localStorage.getItem('userId')
    if (storedUserId) {
      try {
        currentUserId.value = parseInt(storedUserId, 10)
      } catch {}
    }

    await loadComments()
  }
})

const loadComments = async () => {
  if (loading.value || !hasMore.value) return
  loading.value = true
  try {
    const res: any = await feedApi.getComments(props.postId, page.value, size)
    let records = Array.isArray(res?.data) ? res.data : (res?.data?.records || res?.data?.list || [])
    // 标记是否为自己的评论
    records = records.map((c: any) => ({
      ...c,
      _expanded: false,  // 简介默认收起
      _repliesExpanded: false,  // 回复列表默认收起
      user: {
        id: c.user_id || c.userId,
        nickname: c.nickname || '匿名钓友',
        avatarUrl: c.avatarUrl || '',
      },
      // 处理回复列表的平铺字段
      replies: (c.replies || []).map((r: any) => ({
        ...r,
        _expanded: false,  // 回复默认收起
        user: {
          id: r.user_id || r.userId,
          nickname: r.nickname || '匿名钓友',
          avatarUrl: r.avatarUrl || '',
        },
      })),
      isMine: (c.user_id ?? c.userId) === currentUserId.value,
    }))
    if (page.value === 1) {
      comments.value = records
    } else {
      comments.value.push(...records)
    }
    hasMore.value = records.length >= size
    page.value++
  } catch (e) {
    console.error('加载评论失败', e)
  } finally {
    loading.value = false
  }
}

const onScroll = (e: Event) => {
  const el = e.target as HTMLElement
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
    loadComments()
  }
}

const handleSend = async () => {
  const content = inputText.value.trim()
  if (!content) return

  const tempId = Date.now()
  const tempComment: any = {
    id: tempId,
    content,
    user: { id: currentUserId.value, nickname: '我', avatarUrl: '' },
    createdAt: new Date().toLocaleString(),
    isMine: true,
  }

  try {
    await feedApi.comment(props.postId, {
      content,
      replyToCommentId: replyingCommentId.value,
    })
    // 后端只返回 commentId，用本地临时评论直接展示
    if (!replyingCommentId.value) {
      // 新评论：插入列表顶部
      comments.value.unshift(tempComment)
    } else {
      // 回复：找到被回复的评论，添加到它的 replies 数组
      // replyingParentId 是顶级评论ID（回复顶级评论时=自己，回复回复时=顶级评论）
      const parentComment = comments.value.find(c => c.id === replyingParentId.value)
      if (parentComment) {
        if (!parentComment.replies) parentComment.replies = []
        parentComment.replies.push({
          ...tempComment,
          parentId: replyingCommentId.value,  // 回复的是哪条评论
          reply_to_comment_id: replyingCommentId.value,
          replyToNickname: replyingTo.value,
        })
      } else {
        // 如果找不到父评论，添加到列表顶部
        comments.value.unshift(tempComment)
      }
    }

    inputText.value = ''
    replyingTo.value = null
    replyingCommentId.value = null

    // 通知父组件更新 commentCount
    emit('update:commentCount', 1)

    // 滚动到顶部
    await nextTick()
    listRef.value?.scrollTo({ top: 0 })
  } catch (e) {
    console.error('发送失败', e)
  }
}

const handleReply = (comment: any) => {
  // comment 可能是顶级评论，也可能是回复
  // 如果是回复，需要找到它的顶级父评论ID
  replyingTo.value = comment.user?.nickname || '匿名钓友'
  replyingCommentId.value = comment.id
  // 如果 comment 有 parentId，说明它是回复，需要找到它的顶级父评论
  if (comment.parentId && comment.parentId !== 0) {
    // 查找这个回复属于哪个顶级评论
    const parent = comments.value.find(c => c.id === comment.parentId)
    replyingParentId.value = parent ? parent.id : comment.parentId
  } else {
    // 顶级评论
    replyingParentId.value = comment.id
  }
}

const cancelReply = () => {
  replyingTo.value = null
  replyingCommentId.value = null
  replyingParentId.value = null
}

const handleDelete = (comment: any) => {
  deleteTarget.value = comment
}

const confirmDelete = async () => {
  const target = deleteTarget.value
  deleteTarget.value = null
  if (!target) return

  try {
    await feedApi.deleteComment(props.postId, target.id)
    comments.value = comments.value.filter(c => c.id !== target.id)
    emit('update:commentCount', -1)
  } catch (e) {
    alert('删除失败')
  }
}

const closePanel = () => {
  emit('update:show', false)
}

const handleOverlayClick = () => {
  closePanel()
}

const formatTime = (time: string) => {
  if (!time) return ''
  // 简单格式化：如果是 ISO 格式，做友好显示
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
    return time.slice(0, 10)
  } catch {
    return time
  }
}
</script>

<style scoped>
.comment-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: flex-end;
}
.comment-panel {
  background: white; width: 100%; border-radius: 16px 16px 0 0;
  max-height: 75vh; display: flex; flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex; align-items: center; padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
  gap: 8px;
}
.panel-title { font-size: 15px; font-weight: 600; color: #1A2634; }
.replying-hint {
  font-size: 12px; color: #0D7377; background: #E6F7F7;
  padding: 2px 8px; border-radius: 10px;
}
.close-btn {
  margin-left: auto; font-size: 16px; color: #999; cursor: pointer;
}

.cancel-reply-bar {
  padding: 6px 16px; font-size: 12px; color: #0D7377;
  background: #F5F7FA; cursor: pointer; flex-shrink: 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-list {
  flex: 1; overflow-y: auto; padding: 8px 0;
  min-height: 0;
}
.loading-state,
.empty-comments {
  text-align: center; padding: 30px 0; color: #9CA3AF; font-size: 13px;
}
.loading-more,
.no-more {
  text-align: center; padding: 10px; color: #9CA3AF; font-size: 12px;
}

.comment-item {
  display: flex; gap: 10px; padding: 10px 16px;
  transition: background 0.2s;
}
.comment-item:active { background: #F5F7FA; }
.comment-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: #e5e7eb; flex-shrink: 0;
}
.comment-body { flex: 1; min-width: 0; }
.comment-top {
  display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
}
.comment-nickname { font-size: 13px; font-weight: 600; color: #1A2634; }
.comment-time { font-size: 11px; color: #9CA3AF; }
.comment-content { font-size: 14px; color: #374151; line-height: 1.5; }
.comment-content:not(.expanded) {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.reply-list {
  margin-top: 6px; background: #F5F7FA; border-radius: 6px; padding: 8px 10px;
}
.replies-toggle {
  font-size: 12px; color: #0D7377; cursor: pointer; padding: 2px 0;
}
.reply-item { font-size: 13px; line-height: 1.6; color: #374151; }
.reply-item + .reply-item { margin-top: 4px; }
.reply-header { display: flex; align-items: center; flex-wrap: wrap; gap: 2px; }
.reply-nickname { color: #0D7377; font-weight: 600; }
.reply-to { color: #9CA3AF; }
.reply-time { font-size: 11px; color: #9CA3AF; margin-left: 4px; }
.reply-text { color: #374151; margin-left: 0; margin-top: 2px; }
.reply-item .reply-btn {
  margin-left: 8px; font-size: 12px; color: #6B7280; cursor: pointer;
}
.expand-hint {
  font-size: 12px; color: #0D7377; cursor: pointer; margin-top: 2px;
}
.comment-actions {
  margin-top: 4px; display: flex; gap: 12px; justify-content: flex-end;
}
.reply-btn {
  font-size: 12px; color: #6B7280; cursor: pointer;
}
.reply-btn:active { color: #0D7377; }
.delete-btn {
  font-size: 12px; color: #EF4444; cursor: pointer;
}

.comment-input-bar {
  display: flex; gap: 10px; padding: 10px 16px;
  border-top: 1px solid #f0f0f0; flex-shrink: 0;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  background: white;
}
.comment-input {
  flex: 1; height: 36px; padding: 0 12px; border: 1px solid #e5e7eb;
  border-radius: 18px; font-size: 14px; outline: none;
  background: #F5F7FA;
}
.comment-input:focus { border-color: #0D7377; background: white; }
.send-btn {
  height: 36px; padding: 0 16px; background: #0D7377; color: white;
  border: none; border-radius: 18px; font-size: 14px; cursor: pointer;
  flex-shrink: 0;
}
.send-btn:disabled { background: #ccc; cursor: not-allowed; }

/* 删除确认弹窗 */
.delete-confirm-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4); z-index: 1100;
  display: flex; align-items: center; justify-content: center;
}
.delete-confirm {
  background: white; border-radius: 12px; padding: 20px;
  width: 260px; text-align: center;
}
.confirm-text { font-size: 15px; color: #1A2634; margin-bottom: 16px; }
.confirm-btns { display: flex; gap: 12px; justify-content: center; }
.confirm-cancel {
  flex: 1; padding: 8px; border-radius: 6px; background: #f0f0f0;
  color: #666; font-size: 14px; cursor: pointer; text-align: center;
}
.confirm-ok {
  flex: 1; padding: 8px; border-radius: 6px; background: #EF4444;
  color: white; font-size: 14px; cursor: pointer; text-align: center;
}

/* 动画 */
.slide-up-enter-active,
.slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from,
.slide-up-leave-to { opacity: 0; transform: translateY(100%); }

.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>

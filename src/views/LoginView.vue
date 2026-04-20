<template>
  <div class="auth-view">
    <div class="auth-content">
      <!-- Logo -->
      <div class="logo-area">
        <div class="logo">🎣</div>
        <h1>钓迹</h1>
        <p>记录每一竿的精彩，让钓鱼有迹可循</p>
      </div>

      <!-- Tab 切换 -->
      <div class="auth-tabs">
        <span 
          class="tab" 
          :class="{ active: mode === 'login' }" 
          @click="mode = 'login'"
        >登录</span>
        <span 
          class="tab" 
          :class="{ active: mode === 'register' }" 
          @click="mode = 'register'"
        >注册</span>
      </div>

      <!-- 登录表单 -->
      <div v-if="mode === 'login'" class="auth-form">
        <div class="form-item">
          <input 
            type="tel" 
            v-model="loginForm.phone" 
            placeholder="请输入手机号"
            maxlength="11"
          />
        </div>
        <div class="form-item">
          <input 
            type="password" 
            v-model="loginForm.password" 
            placeholder="请输入密码"
            maxlength="20"
          />
        </div>
        <button class="btn-primary" @click="handleLogin" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <p class="forgot-link" @click="mode = 'forgot'">忘记密码？</p>
      </div>

      <!-- 注册表单 -->
      <div v-if="mode === 'register'" class="auth-form">
        <div class="form-item">
          <input 
            type="tel" 
            v-model="registerForm.phone" 
            placeholder="请输入手机号"
            maxlength="11"
          />
        </div>
        <div class="form-item">
          <input 
            type="text" 
            v-model="registerForm.nickname" 
            placeholder="请输入昵称"
            maxlength="20"
          />
        </div>
        <div class="form-item">
          <input 
            type="password" 
            v-model="registerForm.password" 
            placeholder="请输入密码（至少6位）"
            maxlength="20"
          />
        </div>
        <div class="form-item">
          <select v-model="registerForm.securityQuestion">
            <option value="">请选择密保问题</option>
            <option v-for="q in securityQuestions" :key="q" :value="q">{{ q }}</option>
          </select>
        </div>
        <div class="form-item">
          <input 
            type="text" 
            v-model="registerForm.securityAnswer" 
            placeholder="请输入密保答案"
            maxlength="50"
          />
        </div>
        <button class="btn-primary" @click="handleRegister" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
        <p class="agreement">注册即表示同意《用户协议》和《隐私政策》</p>
      </div>

      <!-- 找回密码 -->
      <div v-if="mode === 'forgot'" class="auth-form forgot-form">
        <!-- 步骤1：输入手机号 -->
        <div v-if="forgotStep === 1">
          <p class="step-title">步骤 1/3：输入手机号</p>
          <div class="form-item">
            <input 
              type="tel" 
              v-model="forgotForm.phone" 
              placeholder="请输入手机号"
              maxlength="11"
            />
          </div>
          <button class="btn-primary" @click="getSecurityQuestion" :disabled="loading">
            下一步
          </button>
        </div>

        <!-- 步骤2：回答密保问题 -->
        <div v-if="forgotStep === 2">
          <p class="step-title">步骤 2/3：回答密保问题</p>
          <div class="question-display">{{ forgotForm.question }}</div>
          <div class="form-item">
            <input 
              type="text" 
              v-model="forgotForm.answer" 
              placeholder="请输入密保答案"
              maxlength="50"
            />
          </div>
          <button class="btn-primary" @click="verifySecurityAnswer" :disabled="loading">
            验证
          </button>
          <button class="btn-secondary" @click="forgotStep = 1">返回上一步</button>
        </div>

        <!-- 步骤3：设置新密码 -->
        <div v-if="forgotStep === 3">
          <p class="step-title">步骤 3/3：设置新密码</p>
          <div class="form-item">
            <input 
              type="password" 
              v-model="forgotForm.newPassword" 
              placeholder="请输入新密码（至少6位）"
              maxlength="20"
            />
          </div>
          <div class="form-item">
            <input 
              type="password" 
              v-model="forgotForm.confirmPassword" 
              placeholder="请确认新密码"
              maxlength="20"
            />
          </div>
          <button class="btn-primary" @click="resetPassword" :disabled="loading">
            重置密码
          </button>
        </div>

        <p class="back-link" @click="mode = 'login'; forgotStep = 1">返回登录</p>
      </div>

      <!-- 演示登录 -->
      <div v-if="mode !== 'forgot'" class="demo-area">
        <div class="divider"><span>或</span></div>
        <button class="btn-demo" @click="demoLogin" :disabled="loading">
          🧪 演示体验（无需注册）
        </button>
        <p class="demo-tip">体验完整功能，数据仅本地展示</p>
      </div>
    </div>

    <div class="version-tag">v1.0.0</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/api/request'

const router = useRouter()
const loading = ref(false)
const mode = ref<'login' | 'register' | 'forgot'>('login')
const securityQuestions = ref<string[]>([])

// 登录表单
const loginForm = ref({
  phone: '',
  password: '',
})

// 注册表单
const registerForm = ref({
  phone: '',
  nickname: '',
  password: '',
  securityQuestion: '',
  securityAnswer: '',
})

// 找回密码
const forgotStep = ref(1)
const forgotForm = ref({
  phone: '',
  question: '',
  answer: '',
  newPassword: '',
  confirmPassword: '',
  resetToken: '',
})

// 加载密保问题列表
onMounted(async () => {
  const defaultQuestions = [
    '您的出生城市是？',
    '您母亲的名字是？',
    '您第一只宠物的名字是？',
    '您小学的名字是？',
    '您最喜欢的钓鱼地点是？',
  ]
  try {
    const res: any = await request.get('/auth/questions')
    // 拦截器返回完整 {code, message, data}
    securityQuestions.value = res?.data || defaultQuestions
  } catch (e) {
    securityQuestions.value = defaultQuestions
  }
})

// 登录
const handleLogin = async () => {
  if (!validatePhone(loginForm.value.phone)) {
    alert('请输入正确的手机号')
    return
  }
  if (!loginForm.value.password) {
    alert('请输入密码')
    return
  }

  loading.value = true
  try {
    const res: any = await request.post('/auth/login', loginForm.value)
    console.log('🟢 login 响应:', JSON.stringify(res).substring(0, 200))
    if (res?.code === 200 && res?.data?.token) {
      localStorage.clear()  // 先清空旧数据
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('userId', String(res.data.userId || ''))
      localStorage.setItem('nickname', res.data.nickname || '')
      localStorage.setItem('avatar', res.data.avatar || '')
      // 已完成引导则直接进首页，否则走引导
      const guideDone = localStorage.getItem('guide_done') === '1'
      router.replace(guideDone ? '/' : '/guide')
    } else {
      alert(res?.message || '登录失败')
    }
  } catch (e: any) {
    alert(e.response?.data?.message || '登录失败，请检查网络')
  }
  loading.value = false
}

// 注册
const handleRegister = async () => {
  if (!validatePhone(registerForm.value.phone)) {
    alert('请输入正确的手机号')
    return
  }
  if (!registerForm.value.nickname.trim()) {
    alert('请输入昵称')
    return
  }
  if (registerForm.value.password.length < 6) {
    alert('密码长度至少6位')
    return
  }
  if (!registerForm.value.securityQuestion) {
    alert('请选择密保问题')
    return
  }
  if (!registerForm.value.securityAnswer.trim()) {
    alert('请输入密保答案')
    return
  }

  loading.value = true
  try {
    const res: any = await request.post('/auth/register', registerForm.value)
    if (res?.code === 200 && res?.data?.token) {
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('userId', String(res.data.userId || ''))
      localStorage.setItem('nickname', res.data.nickname || '')
      // 新用户需要走引导流程
      router.replace('/guide')
    } else {
      alert(res?.message || '注册失败')
    }
  } catch (e: any) {
    alert(e.response?.data?.message || '注册失败，请检查网络')
  }
  loading.value = false
}

// 获取密保问题
const getSecurityQuestion = async () => {
  if (!validatePhone(forgotForm.value.phone)) {
    alert('请输入正确的手机号')
    return
  }

  loading.value = true
  try {
    const res: any = await request.get('/auth/security-question', {
      params: { phone: forgotForm.value.phone }
    })
    if (res?.code === 200) {
      forgotForm.value.question = res.data.question
      forgotStep.value = 2
    } else {
      alert(res?.message || '获取密保问题失败')
    }
  } catch (e: any) {
    alert(e.response?.data?.message || '该手机号未注册')
  }
  loading.value = false
}

// 验证密保答案
const verifySecurityAnswer = async () => {
  if (!forgotForm.value.answer.trim()) {
    alert('请输入密保答案')
    return
  }

  loading.value = true
  try {
    const res: any = await request.post('/auth/verify-security', {
      phone: forgotForm.value.phone,
      securityAnswer: forgotForm.value.answer,
    })
    if (res?.code === 200) {
      forgotForm.value.resetToken = res.data.resetToken
      forgotStep.value = 3
    } else {
      alert(res?.message || '密保答案错误')
    }
  } catch (e: any) {
    alert(e.response?.data?.message || '验证失败')
  }
  loading.value = false
}

// 重置密码
const resetPassword = async () => {
  if (forgotForm.value.newPassword.length < 6) {
    alert('密码长度至少6位')
    return
  }
  if (forgotForm.value.newPassword !== forgotForm.value.confirmPassword) {
    alert('两次输入的密码不一致')
    return
  }

  loading.value = true
  try {
    const res: any = await request.post('/auth/reset-password', {
      phone: forgotForm.value.phone,
      newPassword: forgotForm.value.newPassword,
    })
    if (res?.code === 200) {
      localStorage.setItem('token', res.data.token)
      alert('密码重置成功！')
      mode.value = 'login'
      forgotStep.value = 1
    } else {
      alert(res?.message || '重置密码失败')
    }
  } catch (e: any) {
    alert(e.response?.data?.message || '重置密码失败')
  }
  loading.value = false
}

// 演示登录（强制请求真实 token）
const demoLogin = async () => {
  loading.value = true
  try {
    const res: any = await request.post('/auth/demo-login')
    console.log('🟢 demo-login 响应:', JSON.stringify(res).substring(0, 200))
    if (res?.data?.token) {
      localStorage.clear()  // 先清空
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('nickname', res.data.nickname || '演示用户')
      localStorage.setItem('userId', String(res.data.userId || 1))
    } else {
      throw new Error('未返回 token')
    }
  } catch (e: any) {
    console.error('🔴 demo-login 失败:', e)
    alert('演示登录失败，请确保后端服务运行中')
    loading.value = false
    return
  }
  loading.value = false
  router.replace('/guide')
}

// 验证手机号
const validatePhone = (phone: string) => {
  return /^1[3-9]\d{9}$/.test(phone)
}
</script>

<style scoped>
.auth-view {
  min-height: 100vh;
  background: linear-gradient(160deg, #0D7377 0%, #14919B 60%, #0D7377 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.auth-content {
  width: 100%;
  max-width: 360px;
  color: white;
}

.logo-area {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  font-size: 64px;
  margin-bottom: 8px;
}

h1 {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px;
}

.logo-area p {
  font-size: 14px;
  opacity: 0.75;
  margin: 0;
}

/* Tab 切换 */
.auth-tabs {
  display: flex;
  background: rgba(255,255,255,0.1);
  border-radius: 24px;
  padding: 4px;
  margin-bottom: 24px;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.tab.active {
  background: white;
  color: #0D7377;
}

/* 表单 */
.auth-form {
  margin-bottom: 24px;
}

.form-item {
  margin-bottom: 12px;
}

.form-item input,
.form-item select {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: none;
  border-radius: 10px;
  background: rgba(255,255,255,0.95);
  font-size: 15px;
  color: #333;
  outline: none;
  box-sizing: border-box;
}

.form-item input::placeholder {
  color: #999;
}

.form-item select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.btn-primary {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 10px;
  background: white;
  color: #0D7377;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
}

.btn-primary:active {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  width: 100%;
  height: 44px;
  border: 1px solid rgba(255,255,255,0.5);
  border-radius: 10px;
  background: transparent;
  color: white;
  font-size: 14px;
  cursor: pointer;
  margin-top: 12px;
}

/* 忘记密码 */
.forgot-link {
  text-align: right;
  font-size: 13px;
  margin: 12px 0 0;
  opacity: 0.7;
  cursor: pointer;
}

.back-link {
  text-align: center;
  font-size: 13px;
  margin: 16px 0 0;
  opacity: 0.7;
  cursor: pointer;
}

.step-title {
  font-size: 15px;
  margin: 0 0 16px;
  text-align: center;
}

.question-display {
  background: rgba(255,255,255,0.15);
  padding: 14px 16px;
  border-radius: 10px;
  margin-bottom: 12px;
  font-size: 15px;
  text-align: center;
}

/* 演示登录 */
.demo-area {
  margin-top: 8px;
}

.divider {
  text-align: center;
  position: relative;
  margin-bottom: 16px;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 35%;
  height: 1px;
  background: rgba(255,255,255,0.3);
}

.divider::before { left: 0; }
.divider::after { right: 0; }

.divider span {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  background: transparent;
  padding: 0 8px;
}

.btn-demo {
  width: 100%;
  height: 44px;
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: 10px;
  background: rgba(255,255,255,0.1);
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.btn-demo:disabled {
  opacity: 0.6;
}

.demo-tip {
  font-size: 11px;
  text-align: center;
  margin: 8px 0 0;
  opacity: 0.5;
}

.agreement {
  font-size: 11px;
  text-align: center;
  margin: 12px 0 0;
  opacity: 0.4;
}

.version-tag {
  position: fixed;
  bottom: 16px;
  right: 16px;
  font-size: 11px;
  color: rgba(255,255,255,0.25);
}
</style>

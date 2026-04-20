import request from './request'

export const authApi = {
  // 获取密保问题列表
  getQuestions() {
    return request.get('/auth/questions')
  },
  // 获取某用户的密保问题
  getSecurityQuestion(phone: string) {
    return request.get('/auth/security-question', { params: { phone } })
  },
  // 注册
  register(data: { phone: string; password: string; nickname: string; securityQuestion: string; securityAnswer: string }) {
    return request.post('/auth/register', data)
  },
  // 登录
  login(phone: string, password: string) {
    return request.post('/auth/login', { phone, password })
  },
  // 验证密保答案
  verifySecurity(phone: string, securityAnswer: string) {
    return request.post('/auth/verify-security', { phone, securityAnswer })
  },
  // 重置密码
  resetPassword(phone: string, newPassword: string) {
    return request.post('/auth/reset-password', { phone, newPassword })
  },
  // 演示登录
  demoLogin() {
    return request.post('/auth/demo-login')
  },
}

export const userApi = {
  // 获取用户资料
  getProfile() {
    return request.get('/user/profile')
  },
  // 更新资料
  updateProfile(data: any) {
    return request.put('/user/profile', data)
  },
  // 完成引导
  doneGuide() {
    return request.post('/user/guide-done')
  },
  // 用户统计
  getStats() {
    return request.get('/user/stats')
  },
}

export const spotApi = {
  // 我的钓点
  my(page = 1, size = 20) {
    return request.get('/spot/my', { params: { page, size } })
  },
  // 附近钓点（zoom用于后端geohash分组去重）
  nearby(lat: number, lng: number, radius = 5000, zoom = 12, page = 1, size = 20) {
    return request.get('/spot/nearby', { params: { lat, lng, radius, zoom, page, size } })
  },
  // 搜索钓点
  search(keyword: string) {
    return request.get('/spot/search', { params: { keyword } })
  },
  // 钓点详情
  detail(id: number) {
    return request.get(`/spot/${id}`)
  },
  // 上报钓点
  add(data: any) {
    const token = localStorage.getItem('token')
    console.log('🟢 spotApi.add 请求开始, token:', token ? token.substring(0, 20) + '...' : 'null')
    console.log('🟢 请求数据:', JSON.stringify(data))
    return request.post('/spot', data)
      .then(res => { console.log('🟢 spotApi.add 成功返回:', JSON.stringify(res)); return res; })
      .catch(err => { console.error('🔴 spotApi.add 失败:', err); throw err; })
  },
  // 评价钓点
  review(id: number, rating: number, content?: string) {
    return request.post(`/spot/${id}/review`, null, { params: { rating, content } })
  },
}

export const fishIndexApi = {
  today(lat: number, lng: number) {
    return request.get('/fish-index/today', { params: { lat, lng } })
  },
  detail(lat: number, lng: number) {
    return request.get('/fish-index/detail', { params: { lat, lng } })
  },
}

export const catchApi = {
  add(data: any) {
    return request.post('/catch', data)
  },
  list(page = 1, size = 10) {
    return request.get('/catch/list', { params: { page, size } })
  },
  detail(id: number) {
    return request.get(`/catch/${id}`)
  },
  update(id: number, data: any) {
    return request.put(`/catch/${id}`, data)
  },
  delete(id: number) {
    return request.delete(`/catch/${id}`)
  },
  generatePoster(id: number) {
    return request.post(`/catch/${id}/poster`)
  },
  posterStatus(taskId: string) {
    return request.get(`/catch/poster/${taskId}`)
  },
  stats() {
    return request.get('/catch/stats')
  },
}

export const feedApi = {
  feed(page = 1, size = 10) {
    return request.get('/feed', { params: { page, size } })
  },
  publish(data: any) {
    return request.post('/feed/post', data)
  },
  like(postId: number) {
    return request.post(`/feed/post/${postId}/like`)
  },
  unlike(postId: number) {
    return request.delete(`/feed/post/${postId}/like`)
  },
  comment(postId: number, data: any) {
    return request.post(`/feed/post/${postId}/comment`, data)
  },
  getComments(postId: number, page = 1, size = 50) {
    return request.get(`/feed/post/${postId}/comments`, { params: { page, size } })
  },
  deleteComment(postId: number, commentId: number) {
    return request.delete(`/feed/post/${postId}/comment/${commentId}`)
  },
}

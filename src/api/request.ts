import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 请求拦截器：注入Token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log('📡 请求发出: ' + config.method?.toUpperCase() + ' ' + config.url, '| token:', token.substring(0, 15) + '...')
  } else {
    console.warn('⚠️ 无token，请求未带认证信息:', config.method?.toUpperCase(), config.url)
  }
  return config
})

// 响应拦截器：统一错误处理
request.interceptors.response.use(
  (response) => {
    // 直接返回完整响应，由各页面自行处理
    console.log('📥 响应收到:', response.config.url, '→', response.status, JSON.stringify(response.data).substring(0, 100))
    return response.data
  },
  (error) => {
    console.error('🔴 HTTP 错误:', error.config?.url, error.response?.status, error.message)
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default request

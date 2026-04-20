import request from './request'

// 1. 钓点热度榜
export const getSpotHeat = (period = 'month30') =>
  request.get('/home/spot-heat', { params: { period } })

// 2. 用户排行榜
export const getUserRanking = (params: {
  scope: string
  regionCode?: string
  dimension?: string
  page?: number
  pageSize?: number
}) => request.get('/home/user-ranking', { params })

// 3. 鱼种排行
export const getSpeciesRanking = (limit = 10) =>
  request.get('/home/species-ranking', { params: { limit } })

// 4. 附近钓点
export const getNearbySpots = (params: {
  lat: number
  lng: number
  radius?: number
  sortBy?: string
  page?: number
  pageSize?: number
}) => request.get('/home/nearby-spots', { params })

// 5. 他人资料（公开）
export const getUserProfile = (userId: number | string) =>
  request.get(`/user/${userId}`)

// 6. 他人数据统计（公开）
export const getUserStats = (userId: number | string) =>
  request.get(`/user/${userId}/stats`)

// 7. 他人渔获列表（公开，只读）
export const getUserRecords = (userId: number | string, page = 1, pageSize = 10) =>
  request.get(`/catch/user/${userId}`, { params: { page, size: pageSize } })

import axios from 'axios'

// 生产环境使用完整 URL，开发环境使用代理
const baseURL = import.meta.env.VITE_API_URL || '/api'

// 创建 axios 实例
const apiClient = axios.create({
  baseURL,
  timeout: 30000, // 30秒超时，适配慢速后端响应
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    // 处理错误响应
    if (error.response) {
      const { status, data } = error.response

      // 401 未授权，跳转登录
      if (status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }

      // 返回错误信息
      return Promise.reject(data)
    }

    return Promise.reject(error)
  }
)

export default apiClient
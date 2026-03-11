import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

// 生产环境使用完整 URL，开发环境使用代理
const baseURL = import.meta.env.VITE_API_URL || '/api'

// 创建 axios 实例
const axiosInstance = axios.create({
  baseURL,
  timeout: 30000, // 30秒超时，适配慢速后端响应
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
axiosInstance.interceptors.request.use(
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
axiosInstance.interceptors.response.use(
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

// 包装 apiClient，使其返回类型正确（拦截器返回 response.data 而非 AxiosResponse）
interface ApiClient extends AxiosInstance {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
}

const apiClient = axiosInstance as ApiClient

export default apiClient
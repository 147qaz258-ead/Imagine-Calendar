export default async function handler(req, res) {
  // 只允许 POST、GET、PUT、DELETE 请求
  if (!['POST', 'GET', 'PUT', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const backendUrl = 'https://career-calendar-server.onrender.com'

  try {
    // 构建目标 URL
    const path = req.url || ''
    const targetUrl = `${backendUrl}${path}`

    // 准备请求头
    const headers = {}
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization
    }
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type']
    }

    const fetchOptions = {
      method: req.method,
      headers,
    }

    // 对于有请求体的方法，添加请求体
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      fetchOptions.body = JSON.stringify(req.body)
    }

    const response = await fetch(targetUrl, fetchOptions)
    const data = await response.text()

    // 转发响应头
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json')
    res.status(response.status).send(data)
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({ error: 'Internal server error', message: error.message })
  }
}
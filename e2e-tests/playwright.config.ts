import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // 顺序执行，避免并发问题
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1, // 单线程执行
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  timeout: 120000, // 全局测试超时 2 分钟
  use: {
    baseURL: process.env.BASE_URL || 'https://career-calendar.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // 允许访问外部 API
        ignoreHTTPSErrors: true,
      },
    },
  ],
  webServer: undefined, // 使用已部署的生产环境
})
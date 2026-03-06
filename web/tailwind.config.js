/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 企业类型颜色编码
        'company-soe': '#6B7280',        // 国企 - 灰色
        'company-foreign': '#8B5CF6',    // 外企 - 紫色
        'company-private': '#F59E0B',    // 民企 - 黄色
        'company-startup': '#F97316',    // 创业公司 - 橙色
        'company-government': '#3B82F6', // 事业单位 - 蓝色
        // 认知图谱颜色
        'cognitive-deep': '#059669',     // 深绿 - 自我探索
        'cognitive-light': '#6EE7B7',    // 浅绿 - 他人分享
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
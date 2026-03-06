# 后端服务 - 简化版
FROM node:20-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 server 目录的 package.json
COPY server/package.json ./server/

# 安装依赖
WORKDIR /app/server
RUN pnpm install --frozen-lockfile || pnpm install

# 复制源代码
COPY server ./
COPY tsconfig.json ../

# 构建
RUN pnpm build

# 暴露端口
EXPOSE 3001

# 启动
CMD ["node", "dist/main.js"]
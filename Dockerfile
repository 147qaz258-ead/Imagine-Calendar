# 后端服务
FROM node:20-alpine AS backend-builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/
RUN cd server && pnpm install --frozen-lockfile
COPY server ./server
COPY tsconfig.json ./
RUN cd server && pnpm build

FROM node:20-alpine AS backend
WORKDIR /app
RUN npm install -g pnpm
COPY --from=backend-builder /app/server/dist ./dist
COPY --from=backend-builder /app/server/node_modules ./node_modules
COPY --from=backend-builder /app/server/package.json ./
EXPOSE 3001
CMD ["node", "dist/main.js"]
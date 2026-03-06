# 畅选日历

帮助大学生规划职业发展路径的智能日历平台。

## 项目结构

```
.
├── web/                    # 前端项目 (React + Vite + TypeScript)
├── server/                 # 后端项目 (NestJS + TypeScript)
├── docs/                   # 项目文档
├── docker-compose.yml      # Docker 开发环境
└── .env.example           # 环境变量模板
```

## 技术栈

### 前端
- React 18
- TypeScript
- Vite
- Redux Toolkit
- React Router
- Tailwind CSS
- Axios
- Socket.io Client

### 后端
- NestJS
- TypeScript
- TypeORM
- PostgreSQL
- Redis
- JWT 认证
- Swagger API 文档

## 快速开始

### 1. 环境准备

确保已安装以下软件：
- Node.js >= 18
- pnpm >= 8
- Docker & Docker Compose
- PostgreSQL 16 (或使用 Docker)
- Redis 7 (或使用 Docker)

### 2. 克隆项目

```bash
git clone <repository-url>
cd career-calendar
```

### 3. 启动开发环境

```bash
# 启动 PostgreSQL 和 Redis
docker-compose up -d

# 复制环境变量配置
cp .env.example .env
# 编辑 .env 文件，填写必要的环境变量
```

### 4. 安装依赖

```bash
# 前端
cd web
pnpm install

# 后端
cd ../server
pnpm install
```

### 5. 启动服务

```bash
# 启动后端服务 (在 server 目录)
pnpm start:dev

# 启动前端服务 (在 web 目录)
pnpm dev
```

### 6. 访问服务

- 前端: http://localhost:3000
- 后端 API: http://localhost:3001/api
- Swagger 文档: http://localhost:3001/api/docs
- 数据库管理: http://localhost:8080

## 开发规范

### Git 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

### 代码规范

- 前端使用 ESLint + Prettier
- 后端使用 ESLint + Prettier
- 提交前请确保代码通过 lint 检查

## 文档

详细的项目文档请查看 `/docs` 目录：

- [PRD 文档](docs/PRD-v0.md)
- [技术方案](docs/E-001-职业规划日历-MVP1/tech/TECH-E-001-v1.md)
- [API 契约](docs/E-001-职业规划日历-MVP1/tech/API-CONTRACT.md)
- [任务列表](docs/E-001-职业规划日历-MVP1/tasks/)

## 许可证

私有项目，未经授权禁止使用。
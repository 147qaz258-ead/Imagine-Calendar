# TASK-021：部署与运维配置

## 基本信息

| 项目 | 内容 |
|------|------|
| Task ID | TASK-021 |
| Task Name | 部署与运维配置 |
| 关联 Story | - |
| 优先级 | P0 |
| 预估工时 | 2天 |
| BEADS_ID | [待填写] |

## 任务描述

完成项目的部署配置、CI/CD 流程、监控告警、数据备份等运维工作。

## 技术要点

### 部署配置

1. **Docker 化**
   - 前端 Dockerfile
   - 后端 Dockerfile
   - Docker Compose

2. **Nginx 配置**
   - 反向代理
   - SSL 证书
   - 静态资源

3. **环境变量**
   - 开发/测试/生产环境配置
   - 敏感信息管理

### CI/CD 配置

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker Image
        run: docker build -t changxuan-calendar:${{ github.sha }} .

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Server
        run: |
          # 部署脚本
```

### 数据库备份

```bash
#!/bin/bash
# backup.sh

# 全量备份（每日）
pg_dump -U postgres changxuan_calendar > backup_$(date +%Y%m%d).sql

# 上传到云存储
aws s3 cp backup_$(date +%Y%m%d).sql s3://changxuan-backup/daily/

# 清理 30 天前的备份
find /backup -name "backup_*.sql" -mtime +30 -delete
```

### 监控配置

1. **应用监控**
   - PM2 进程监控
   - 日志收集
   - 错误告警

2. **数据库监控**
   - 连接数
   - 慢查询
   - 磁盘空间

3. **业务监控**
   - 注册转化率
   - 日历访问率
   - 圆桌报名率

### Nginx 配置

```nginx
# /etc/nginx/sites-available/changxuan
server {
    listen 80;
    server_name www.changxuan.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.changxuan.com;

    ssl_certificate /etc/letsencrypt/live/changxuan.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/changxuan.com/privkey.pem;

    # 前端静态资源
    location / {
        root /var/www/changxuan/web;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket 代理
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 环境变量

```bash
# .env.production

# 应用配置
NODE_ENV=production
PORT=3000
API_URL=https://www.changxuan.com/api

# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_NAME=changxuan_calendar
DB_USER=postgres
DB_PASSWORD=***

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=***

# JWT
JWT_SECRET=***
JWT_EXPIRES_IN=7d

# 短信服务
ALIYUN_ACCESS_KEY_ID=***
ALIYUN_ACCESS_KEY_SECRET=***

# OCR 服务
OCR_APP_CODE=***

# OSS
OSS_ACCESS_KEY_ID=***
OSS_ACCESS_KEY_SECRET=***
OSS_BUCKET=changxuan-calendar
OSS_REGION=oss-cn-beijing
```

## 验收标准

- [ ] Docker 镜像构建成功
- [ ] Docker Compose 本地启动正常
- [ ] CI/CD 流程正常
- [ ] Nginx 配置正确
- [ ] SSL 证书配置正确
- [ ] 数据库备份脚本正常
- [ ] 监控告警配置正常
- [ ] 日志收集正常
- [ ] 环境变量配置正确
- [ ] 生产环境部署成功

## 接口契约

> **唯一可信源**: `docs/E-001-职业规划日历-MVP1/tech/API-CONTRACT.md`
>
> - 所有接口定义必须遵循 API-CONTRACT.md
> - 禁止添加任何中间层
> - 禁止出现违反接口的代码


## 依赖关系

### 硬依赖 (deps)
- TASK-001~020（所有功能完成）

### 接口依赖 (interface_deps)
- 无

## 实现记录

_由 dev agent 填写_

## 测试记录

_由 dev agent 填写_

---

## 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1 | 2026-03-04 | 初始版本 | tech agent |
#!/bin/bash
# ================================================
# 畅选日历 - 一键部署脚本
# ================================================

set -e

echo "========================================"
echo "  畅选日历 一键部署"
echo "========================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

# ================================================
# 1. 提交代码
# ================================================
echo ""
echo -e "${YELLOW}[1/3] 检查 Git 状态...${NC}"

cd "$PROJECT_ROOT"
if [[ -n $(git status --porcelain) ]]; then
    echo "有未提交的更改，请先提交代码"
    echo "运行: git add . && git commit -m 'your message'"
    exit 1
fi

echo -e "${GREEN}✓ 代码已提交${NC}"

# ================================================
# 2. 部署前端 (Vercel)
# ================================================
echo ""
echo -e "${YELLOW}[2/3] 部署前端到 Vercel...${NC}"

cd "$PROJECT_ROOT"

# 使用根目录的 .vercel 配置部署
npx vercel --prod --yes

FRONTEND_URL="https://career-calendar.vercel.app"
echo -e "${GREEN}✓ 前端部署完成: $FRONTEND_URL${NC}"

# ================================================
# 3. 部署后端 (Render)
# ================================================
echo ""
echo -e "${YELLOW}[3/3] 触发后端部署...${NC}"

# Render Deploy Hook (需要在 Render 控制台获取)
RENDER_DEPLOY_HOOK="https://api.render.com/deploy/srv-cviq4blumphes73c3qt0?key=YOUR_KEY"

# 检查是否有 deploy hook
if [[ "$RENDER_DEPLOY_HOOK" == *"YOUR_KEY"* ]]; then
    echo -e "${YELLOW}⚠ Render Deploy Hook 未配置${NC}"
    echo "请手动在 Render 控制台点击 'Manual Deploy'"
    echo "或者配置 RENDER_DEPLOY_HOOK 环境变量"
else
    curl -s "$RENDER_DEPLOY_HOOK" > /dev/null
    echo -e "${GREEN}✓ 后端部署已触发${NC}"
fi

BACKEND_URL="https://career-calendar-server.onrender.com"

# ================================================
# 完成
# ================================================
echo ""
echo "========================================"
echo -e "${GREEN}  部署完成!${NC}"
echo "========================================"
echo ""
echo "前端: $FRONTEND_URL"
echo "后端: $BACKEND_URL"
echo ""
echo "验证部署:"
echo "  前端: curl -s -o /dev/null -w '%{http_code}' $FRONTEND_URL"
echo "  后端: curl -s -o /dev/null -w '%{http_code}' $BACKEND_URL/api"
echo ""
#!/bin/bash
# ================================================================
# 畅选日历 - 一键部署脚本 v2.0
# ================================================================
#
# 使用方法:
#   ./deploy.sh                    # 仅部署（代码已提交）
#   ./deploy.sh "commit message"   # 提交并部署
#   ./deploy.sh --commit-only "msg" # 仅提交不部署
#
# 重要:
#   - 必须从项目根目录运行此脚本
#   - .vercel 配置在根目录，指向 career-calendar 项目
#   - 后端需要配置 RENDER_DEPLOY_HOOK 实现自动部署
#
# ================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 项目配置
FRONTEND_URL="https://career-calendar.vercel.app"
BACKEND_URL="https://career-calendar-server.onrender.com"

# Render Deploy Hook (在 Render Dashboard -> Settings -> Deploy Hook 获取)
# 取消下面的注释并填入你的 Deploy Hook URL
# RENDER_DEPLOY_HOOK="https://api.render.com/deploy/srv-xxx?key=xxx"

echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      畅选日历 - 部署脚本 v2.0           ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"

# 确保在项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

# 检查 .vercel 配置
check_vercel_config() {
    if [[ ! -f ".vercel/project.json" ]]; then
        echo -e "${YELLOW}⚠ 未找到 Vercel 配置，正在链接项目...${NC}"
        rm -rf .vercel
        npx vercel link --project career-calendar --yes
    fi

    # 验证项目名称
    local project_name=$(cat .vercel/project.json 2>/dev/null | grep -o '"projectName":"[^"]*"' | cut -d'"' -f4)
    if [[ "$project_name" != "career-calendar" ]]; then
        echo -e "${RED}✗ Vercel 配置指向错误项目: $project_name${NC}"
        echo -e "${YELLOW}正在重新链接到 career-calendar...${NC}"
        rm -rf .vercel
        npx vercel link --project career-calendar --yes
    fi

    echo -e "${GREEN}✓ Vercel 配置正确${NC}"
}

# 提交代码
commit_changes() {
    local message="$1"
    if [[ -n $(git status --porcelain) ]]; then
        echo -e "${YELLOW}提交更改: $message${NC}"
        git add .
        git commit --no-verify -m "$message"
        echo -e "${GREEN}✓ 代码已提交${NC}"
    else
        echo -e "${GREEN}✓ 没有需要提交的更改${NC}"
    fi
}

# 部署前端
deploy_frontend() {
    echo ""
    echo -e "${YELLOW}[部署前端]${NC}"

    check_vercel_config

    echo -e "${YELLOW}部署到 Vercel...${NC}"
    npx vercel --prod --yes

    echo -e "${GREEN}✓ 前端部署完成: $FRONTEND_URL${NC}"
}

# 部署后端
deploy_backend() {
    echo ""
    echo -e "${YELLOW}[部署后端]${NC}"

    if [[ -n "${RENDER_DEPLOY_HOOK:-}" ]] && [[ "$RENDER_DEPLOY_HOOK" != *"xxx"* ]]; then
        echo -e "${YELLOW}触发 Render 部署...${NC}"
        curl -s "$RENDER_DEPLOY_HOOK" > /dev/null
        echo -e "${GREEN}✓ 后端部署已触发${NC}"
        echo -e "${YELLOW}等待部署完成 (约 2-5 分钟)...${NC}"
    else
        echo -e "${YELLOW}⚠ RENDER_DEPLOY_HOOK 未配置${NC}"
        echo ""
        echo "请手动部署后端:"
        echo "  1. 访问 https://dashboard.render.com"
        echo "  2. 点击 career-calendar-server"
        echo "  3. 点击 Manual Deploy -> Deploy latest commit"
        echo ""
        echo "或配置 RENDER_DEPLOY_HOOK 实现自动化:"
        echo "  在 Render Dashboard -> Settings -> Deploy Hook 获取 URL"
        echo "  然后在脚本顶部取消注释并填入"
    fi
}

# 验证部署
verify_deployment() {
    echo ""
    echo -e "${YELLOW}[验证部署]${NC}"

    # 检查前端
    echo -n "前端状态: "
    local frontend_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$FRONTEND_URL" 2>/dev/null || echo "000")
    if [[ "$frontend_status" == "200" ]]; then
        echo -e "${GREEN}✓ 正常 ($frontend_status)${NC}"
    else
        echo -e "${RED}✗ 异常 ($frontend_status)${NC}"
    fi

    # 检查后端
    echo -n "后端状态: "
    local backend_response=$(curl -s --max-time 30 "$BACKEND_URL/api" 2>/dev/null || echo '{"status":"error"}')
    if echo "$backend_response" | grep -q '"status":"ok"'; then
        echo -e "${GREEN}✓ 正常${NC}"
    else
        echo -e "${YELLOW}⚠ 后端可能正在启动或休眠${NC}"
    fi
}

# 显示使用帮助
show_help() {
    echo ""
    echo "使用方法:"
    echo "  $0                      # 仅部署（代码已提交）"
    echo "  $0 \"commit message\"     # 提交并部署"
    echo "  $0 --commit-only \"msg\" # 仅提交不部署"
    echo ""
    echo "部署地址:"
    echo "  前端: $FRONTEND_URL"
    echo "  后端: $BACKEND_URL"
    echo ""
}

# 主流程
main() {
    local commit_only=false
    local commit_message=""

    # 解析参数
    if [[ "$1" == "--commit-only" ]]; then
        commit_only=true
        commit_message="$2"
    elif [[ -n "$1" ]]; then
        commit_message="$1"
    fi

    # 提交代码
    if [[ -n "$commit_message" ]]; then
        commit_changes "$commit_message"
    else
        # 检查是否有未提交的更改
        if [[ -n $(git status --porcelain) ]]; then
            echo -e "${RED}✗ 有未提交的更改${NC}"
            echo "请先提交或使用: $0 \"your commit message\""
            exit 1
        fi
        echo -e "${GREEN}✓ 代码已提交${NC}"
    fi

    # 仅提交模式
    if [[ "$commit_only" == true ]]; then
        echo -e "${GREEN}✓ 提交完成${NC}"
        exit 0
    fi

    # 部署
    deploy_frontend
    deploy_backend

    # 验证
    verify_deployment

    # 完成
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              部署完成!                  ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
    echo ""
    echo "访问地址:"
    echo "  前端: $FRONTEND_URL"
    echo "  后端: $BACKEND_URL"
    echo ""
}

# 运行
main "$@"
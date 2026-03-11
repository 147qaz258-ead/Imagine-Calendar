#!/bin/bash
# 部署脚本 - 畅选日历前端
# 使用方法: ./deploy.sh [commit_message]
#
# 此脚本会:
# 1. 提交所有更改
# 2. 部署到 Vercel 生产环境 (career-calendar 项目)

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== 畅选日历部署脚本 ===${NC}"

# 进入 web 目录
cd "$(dirname "$0")"

# 检查是否有未提交的更改
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}发现未提交的更改，正在提交...${NC}"

    # 获取提交信息
    if [[ -z "$1" ]]; then
        COMMIT_MSG="chore: 更新前端代码"
    else
        COMMIT_MSG="$1"
    fi

    git add .
    git commit --no-verify -m "$COMMIT_MSG"
    echo -e "${GREEN}提交完成${NC}"
else
    echo -e "${GREEN}没有未提交的更改${NC}"
fi

# 清理旧的 Vercel 配置
echo -e "${YELLOW}清理旧配置...${NC}"
rm -rf .vercel

# 部署到 career-calendar 项目
echo -e "${YELLOW}部署到 career-calendar 项目...${NC}"
npx vercel deploy --prod --yes --scope=oneday1 career-calendar 2>&1

echo -e "${GREEN}=== 部署完成 ===${NC}"
echo -e "生产地址: https://career-calendar.vercel.app"
@echo off
chcp 65001 >nul
REM ================================================
REM 畅选日历 - 一键部署脚本 (Windows)
REM ================================================

echo ========================================
echo   畅选日历 一键部署
echo ========================================

cd /d "%~dp0"

REM ================================================
REM 1. 检查 Git 状态
REM ================================================
echo.
echo [1/3] 检查 Git 状态...

git status --porcelain >nul 2>&1
for /f %%i in ('git status --porcelain') do (
    echo 有未提交的更改，请先提交代码
    echo 运行: git add . ^&^& git commit -m "your message"
    exit /b 1
)

echo √ 代码已提交

REM ================================================
REM 2. 部署前端 (Vercel)
REM ================================================
echo.
echo [2/3] 部署前端到 Vercel...

npx vercel --prod --yes

echo √ 前端部署完成: https://career-calendar.vercel.app

REM ================================================
REM 3. 部署后端 (Render)
REM ================================================
echo.
echo [3/3] 后端部署...
echo 请在 Render 控制台手动点击 "Manual Deploy"
echo 后端地址: https://career-calendar-server.onrender.com

REM ================================================
REM 完成
REM ================================================
echo.
echo ========================================
echo   部署完成!
echo ========================================
echo.
echo 前端: https://career-calendar.vercel.app
echo 后端: https://career-calendar-server.onrender.com
echo.
pause
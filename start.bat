@echo off
chcp 65001 >nul
echo.
echo  🌟 校园二手交易平台 - 启动中...
echo  ========================================
echo.

echo  [1/2] 启动后端服务 (Express + MySQL)...
start "CampusTrade-Server" cmd /c "cd /d E:\作业\web\campus-trade\server && node app.js"

timeout /t 3 /nobreak >nul

echo  [2/2] 启动前端开发服务器 (Vue3 + Vite)...
start "CampusTrade-Client" cmd /c "cd /d E:\作业\web\campus-trade\client && npx vite"

echo.
echo  ========================================
echo  ✅ 启动完成！
echo  📱 前端地址: http://localhost:5173
echo  📡 后端API:  http://localhost:3001/api
echo.
echo  💡 测试账号: xiaoming / 123456
echo  💡 按任意键打开浏览器...
pause >nul
start http://localhost:5173

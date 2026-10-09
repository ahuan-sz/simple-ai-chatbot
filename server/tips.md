以后启动 mcpServer 前先清理:

pkill -f "node.*index.js" 2>/dev/null; pkill -f "node.*mcpServer" 2>/dev/null; sleep 1; lsof -i :3000,3001,3002 2>/dev/null | grep LISTEN || echo "端口已全部释放"

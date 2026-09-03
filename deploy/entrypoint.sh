#!/usr/bin/env bash
# ============================================================
# Postman 网页版（多用户版）单容器启动脚本
#
# 在一个容器内依次启动：
#   1. PostgreSQL（复用官方 entrypoint：自动 initdb + 执行 initdb.d 脚本）
#   2. NestJS 后端（监听 127.0.0.1:3000，托管 /api）
#   3. Nginx（监听 80，托管前端静态资源并反代 /api）
# ============================================================
set -e

POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-postman}"
SERVER_PORT="${SERVER_PORT:-3000}"
JWT_SECRET="${JWT_SECRET:-postman-jwt-secret-change-me}"

echo "[entrypoint] Starting PostgreSQL (user=$POSTGRES_USER db=$POSTGRES_DB)..."

# 1. 后台启动 PostgreSQL（官方 entrypoint 会完成初始化与 initdb.d 脚本执行）
#    官方脚本检测到 root 后会自动降权到 postgres 用户运行
/usr/local/bin/docker-entrypoint.sh postgres &
PG_PID=$!

# 2. 等待 PostgreSQL 就绪（最多 90 秒）
echo "[entrypoint] Waiting for PostgreSQL to be ready..."
READY=0
for i in $(seq 1 90); do
  if pg_isready -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    READY=1
    break
  fi
  if ! kill -0 "$PG_PID" 2>/dev/null; then
    echo "[entrypoint] ERROR: PostgreSQL process exited unexpectedly."
    exit 1
  fi
  sleep 1
done
if [ "$READY" != "1" ]; then
  echo "[entrypoint] ERROR: PostgreSQL did not become ready in time."
  exit 1
fi
echo "[entrypoint] PostgreSQL is ready."

# 3. 启动 NestJS 后端
echo "[entrypoint] Starting backend on 127.0.0.1:${SERVER_PORT}..."
export NODE_ENV=production
export SERVER_HOST=127.0.0.1
export SERVER_PORT="$SERVER_PORT"
export JWT_SECRET="$JWT_SECRET"
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:5432/${POSTGRES_DB}"

cd /app
node /app/dist/server/main.standalone.js &
NODE_PID=$!

# 4. 启动 Nginx（前台）
echo "[entrypoint] Starting Nginx..."
nginx -g 'daemon off;' &
NGINX_PID=$!

# 5. 信号转发：任意进程退出则整体退出
trap 'echo "[entrypoint] Shutting down..."; kill $PG_PID $NODE_PID $NGINX_PID 2>/dev/null' INT TERM

while true; do
  for pid in $PG_PID $NODE_PID $NGINX_PID; do
    if ! kill -0 "$pid" 2>/dev/null; then
      echo "[entrypoint] A child process (pid=$pid) exited. Stopping container."
      kill $PG_PID $NODE_PID $NGINX_PID 2>/dev/null || true
      exit 1
    fi
  done
  sleep 2
done

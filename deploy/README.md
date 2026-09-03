# Postman 网页版（多用户版）— 独立部署

Postman 风格的 API 测试工具，支持请求编辑、集合管理、环境变量、历史记录、多种身份认证。深色主题，三栏布局。

**本版本已改造为多用户系统**：
- 注册 / 登录 / JWT 鉴权
- 管理端：用户管理、角色管理、权限管理（RBAC）
- 每个用户的集合、环境、历史记录数据完全独立
- **单容器部署**：PostgreSQL + 后端 + 前端合并为一个容器，对外只暴露一个端口

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS 4 |
| UI 组件 | Radix UI + lucide-react 图标 |
| 后端 | NestJS 10 + TypeScript（自实现 JWT + RBAC） |
| 数据库 | PostgreSQL 16 / Drizzle ORM |

## 功能特性

- HTTP 请求：GET / POST / PUT / PATCH / DELETE / HEAD / OPTIONS
- 请求参数：Query Params / Headers / Body (raw / JSON / form-data / x-www-form-urlencoded)
- 身份认证：Bearer Token / Basic Auth / API Key
- 集合管理：多级文件夹、导入导出
- 环境变量：多环境切换、变量替换
- 历史记录：自动保存请求历史
- 响应查看：状态码 / 响应时间 / 响应大小 / Body / Headers
- **多用户**：注册/登录/退出、JWT 会话、数据按用户隔离
- **管理端**：用户管理（增删改查/禁用/重置密码/分配角色）、角色管理（权限勾选）、权限管理

---

## 方式一：单容器 Docker 部署（推荐）

### 1. 准备环境

- Docker 20+
- Docker Compose v2+

### 2. 部署步骤

```bash
# 1. 进入部署目录
cd deploy

# 2. 复制环境变量配置文件
cp .env.example .env

# 3. 修改 .env 中的 POSTGRES_PASSWORD 与 JWT_SECRET（必填！）
nano .env

# 4. 构建并启动（单容器）
docker compose -f docker-compose.all.yml up -d --build

# 5. 查看运行状态
docker compose -f docker-compose.all.yml ps
```

启动后访问：`http://<你的NAS_IP>:8080`

默认管理员账号：**admin / admin123**（登录后请立即在管理端修改密码）。

### 3. 端口说明

| 服务 | 默认端口 | 说明 |
|---|---|---|
| postman（单容器入口） | 8080 | 浏览器访问入口，全部服务合并于此 |

> 数据库、后端均只监听容器内 `127.0.0.1`，不再对外暴露。

### 4. 常用命令

```bash
docker compose -f docker-compose.all.yml stop    # 停止
docker compose -f docker-compose.all.yml start   # 启动
docker compose -f docker-compose.all.yml down    # 停止并删除容器（数据保留）
docker compose -f docker-compose.all.yml down -v # ⚠️ 删除数据卷，会丢失所有数据
docker compose -f docker-compose.all.yml logs -f postman  # 日志
```

### 5. 数据持久化与备份

数据保存在 Docker Volume `deploy_postman_data` 中。

```bash
# 备份
docker exec postman pg_dump -U postgres postman > backup_$(date +%Y%m%d).sql

# 恢复
cat backup_20260101.sql | docker exec -i postman psql -U postgres -d postman
```

---

## 方式二：飞牛 fnOS NAS 部署

见仓库根目录 `postman-docker-deploy/飞牛NAS部署指南.md`（单容器版）。

---

## 方式三：本地开发运行

### 环境要求

- Node.js >= 22.0.0
- npm >= 10.0.0
- PostgreSQL >= 14

### 步骤

```bash
# 1. 安装依赖
npm install

# 2. 准备数据库（在 PostgreSQL 中执行 deploy/init.all.sql）
psql -U postgres -d postman -f deploy/init.all.sql

# 3. 设置环境变量
export DATABASE_URL=postgresql://postgres:password@localhost:5432/postman
export JWT_SECRET=your-secret

# 4. 启动后端（终端1）
npm run dev:server

# 5. 启动前端（终端2）
npm run dev:client
```

- 前端地址：http://localhost:5173（`/api` 已代理到 3000）
- 后端地址：http://localhost:3000
- 默认管理员：admin / admin123（由 init.all.sql 种子数据创建）

---

## 目录结构

```
postman-web/
├── client/                     # 前端代码
│   └── src/
│       ├── api/                # API 调用封装（axios + token 拦截器）
│       ├── auth/               # 登录态管理（AuthContext）
│       ├── components/postman/ # Postman UI 组件
│       ├── pages/
│       │   ├── PostmanPage/    # 主工作台
│       │   ├── LoginPage/      # 登录
│       │   ├── RegisterPage/   # 注册
│       │   └── AdminPage/      # 管理端（用户/角色/权限）
│       └── utils/              # 工具函数（logger, confirm 等）
├── server/                     # 后端代码
│   ├── main.standalone.ts      # 独立部署入口
│   ├── app.module.standalone.ts# standalone 根模块
│   ├── common/auth/            # JWT 工具、认证/管理守卫
│   ├── modules/
│   │   ├── database/           # 数据库模块（Drizzle）
│   │   ├── auth/               # 注册/登录/me
│   │   ├── admin/              # 用户/角色/权限管理
│   │   ├── proxy/              # HTTP 代理转发
│   │   ├── collections/        # 集合/请求 CRUD（按用户隔离）
│   │   ├── environments/       # 环境变量 CRUD（按用户隔离）
│   │   └── history/            # 历史记录 CRUD（按用户隔离）
│   └── database/
│       └── schema.standalone.ts # Drizzle schema（含 RBAC 表）
├── shared/                     # 前后端共享类型
└── deploy/                     # Docker 部署文件
    ├── docker-compose.all.yml  # 单容器编排（推荐）
    ├── Dockerfile.all          # 单容器镜像
    ├── entrypoint.sh           # 容器启动脚本
    ├── init.all.sql            # 建表 + 种子数据
    ├── nginx.conf              # Nginx 配置（反代 127.0.0.1:3000）
    └── .env.example            # 环境变量示例
```

---

## 配置说明

### 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `HTTP_PORT` | 8080 | 宿主机访问端口 |
| `POSTGRES_DB` | postman | 数据库名 |
| `POSTGRES_USER` | postgres | 数据库用户名 |
| `POSTGRES_PASSWORD` | postgres | 数据库密码（生产务必修改） |
| `JWT_SECRET` | change-me-... | JWT 签名密钥（生产务必修改为强随机值） |

后端单机运行时还支持 `DATABASE_URL` / `SERVER_HOST` / `SERVER_PORT`（容器内已自动配置）。

---

## 常见问题

### Q: 启动后前端白屏？
A: 检查浏览器 Console 报错。常见原因：端口被占用、后端未启动、未登录被 401 跳转。

### Q: 登录时提示「用户名或密码错误」？
A: 确认已初始化数据库（`init.all.sql` 已执行）。默认管理员 `admin / admin123`。

### Q: 发送请求报 401？
A: 登录过期或 token 无效，请重新登录；确认 `.env` 中 `JWT_SECRET` 未在运行期间变更。

### Q: 支持多用户吗？数据会互相看到吗？
A: 支持。所有业务接口都通过 JWT 识别用户，后端按 `owner` 字段强制隔离，每个用户只能看到自己的集合、环境、历史记录。管理员可在管理端统一管理用户/角色/权限。

### Q: 旧版本（单用户）的数据能迁移吗？
A: 旧版数据在独立的 `postgres_data` 卷中，结构与本版不同（owner 字段类型变化）。建议导出需要的集合为 JSON 后，在新版用「导入」功能导入。

### Q: 如何新增管理员？
A: 用 admin 登录 → 管理端 → 用户管理 → 新建用户时勾选「admin」角色；或给已有用户分配 admin 角色。

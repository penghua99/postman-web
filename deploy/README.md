# Postman 网页版 — 独立部署版

Postman 风格的 API 测试工具，支持请求编辑、集合管理、环境变量、历史记录、多种身份认证。深色主题，三栏布局。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS 4 |
| UI 组件 | Radix UI + lucide-react 图标 |
| 后端 | NestJS 10 + TypeScript |
| 数据库 | PostgreSQL 14+ / Drizzle ORM |
| HTTP 代理 | 后端 axios 转发（绕过浏览器 CORS） |

## 功能特性

- HTTP 请求：GET / POST / PUT / PATCH / DELETE / HEAD / OPTIONS
- 请求参数：Query Params / Headers / Body (raw / JSON / form-data / x-www-form-urlencoded)
- 身份认证：Bearer Token / Basic Auth / API Key
- 集合管理：多级文件夹、导入导出
- 环境变量：多环境切换、变量替换
- 历史记录：自动保存请求历史
- 响应查看：状态码 / 响应时间 / 响应大小 / Body / Headers

---

## 方式一：Docker Compose 一键部署（推荐）

### 1. 准备环境

确保已安装：
- Docker 20+
- Docker Compose v2+

### 2. 部署步骤

```bash
# 1. 进入部署目录
cd deploy

# 2. 复制环境变量配置文件
cp .env.example .env

# 3. 修改 .env 中的数据库密码（必填！）
nano .env

# 4. 启动所有服务
docker compose up -d --build

# 5. 查看运行状态
docker compose ps

# 6. 查看日志
docker compose logs -f server
docker compose logs -f client
```

启动后访问：`http://<你的NAS_IP>:8080`

### 3. 端口说明

| 服务 | 默认端口 | 说明 |
|---|---|---|
| client (前端) | 8080 | 浏览器访问入口 |
| server (后端) | 3000 | API 服务（nginx 已反代，一般不需要直接暴露） |
| db (数据库) | 5432 | PostgreSQL（仅容器内访问，外部访问需改 compose） |

### 4. 常用命令

```bash
# 停止服务
docker compose stop

# 启动服务
docker compose start

# 重启服务
docker compose restart

# 停止并删除容器（数据保留在 volume 中）
docker compose down

# 停止并删除容器 + 数据卷（⚠️ 会丢失所有数据！）
docker compose down -v

# 更新到最新版本
docker compose pull
docker compose up -d --build
```

### 5. 数据持久化

数据库数据保存在 Docker Volume `deploy_postgres_data` 中，删除容器不会丢失数据。

备份数据库：
```bash
docker exec postman-db pg_dump -U postgres postman > backup_$(date +%Y%m%d).sql
```

恢复数据库：
```bash
cat backup_20240101.sql | docker exec -i postman-db psql -U postgres -d postman
```

---

## 方式二：飞牛 fnOS NAS 部署

飞牛 fnOS 基于 Debian，支持 Docker Compose 和容器管理界面。

### 方法 A：通过 fnOS 「容器」界面部署（图形化）

1. **打开 fnOS 管理后台** → 进入「容器」应用
2. **安装 Docker**（首次使用会提示安装，按指引完成）
3. **进入「项目」或「Compose」标签页**（不同版本名称略有差异）
4. **创建新项目**：
   - 项目名称：`postman`
   - 把 `deploy/docker-compose.yml` 的内容粘贴到编辑框
   - 把 `deploy/init.sql` 上传到项目目录（或在 compose 中改为绑定挂载）
5. **配置环境变量**：
   - `POSTGRES_PASSWORD` 设置一个强密码
   - 其他变量按需修改
6. **点击「部署」或「启动」**，等待构建完成
7. **访问应用**：`http://<fnOS_IP>:8080`

### 方法 B：通过 SSH 命令行部署

1. **SSH 登录 fnOS**
   ```bash
   ssh admin@<fnOS_IP>
   ```

2. **安装 Docker**（如未安装）
   ```bash
   # fnOS 通常自带 Docker，检查一下
   docker --version
   docker compose version
   ```

3. **上传项目代码**
   ```bash
   # 在本地电脑执行（将代码复制到 NAS）
   scp -r postman-web/ admin@<fnOS_IP>:/volume1/docker/postman/
   ```

4. **启动服务**
   ```bash
   cd /volume1/docker/postman/deploy
   cp .env.example .env
   # 修改密码
   vi .env
   # 启动
   docker compose up -d --build
   ```

5. **访问**：`http://<fnOS_IP>:8080`

### fnOS 注意事项

- **存储路径**：fnOS 的 Docker 数据通常放在 `/volume1/docker/` 下，建议把项目放在该目录
- **端口冲突**：如果 8080 端口被占用，修改 `.env` 中的 `CLIENT_PORT`
- **权限问题**：确保 Docker 数据卷目录权限正确
- **自动启动**：`restart: unless-stopped` 已配置，NAS 重启后自动恢复

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

# 2. 准备数据库（PostgreSQL 中执行 init.sql）
psql -U postgres -d postman -f deploy/init.sql

# 3. 设置环境变量
export DATABASE_URL=postgresql://postgres:password@localhost:5432/postman

# 4. 启动后端（终端1）
npm run dev:server

# 5. 启动前端（终端2）
npx vite --config vite.config.standalone.ts
```

- 前端地址：http://localhost:5173
- 后端地址：http://localhost:3000
- API 前缀：/api/*

---

## 目录结构

```
postman-web/
├── client/                     # 前端代码
│   └── src/
│       ├── api/                # API 调用封装
│       ├── components/postman/ # Postman UI 组件
│       ├── pages/PostmanPage/  # 主页面
│       └── utils/              # 工具函数（logger, confirm 等）
├── server/                     # 后端代码
│   ├── main.standalone.ts      # 独立部署入口
│   ├── app.module.ts           # 根模块（已去平台化）
│   ├── modules/
│   │   ├── database/           # 数据库模块（Drizzle）
│   │   ├── proxy/              # HTTP 代理转发
│   │   ├── collections/        # 集合/请求 CRUD
│   │   ├── environments/       # 环境变量 CRUD
│   │   └── history/            # 历史记录 CRUD
│   └── database/
│       └── schema.ts           # Drizzle schema
├── shared/                     # 前后端共享类型
└── deploy/                     # Docker 部署文件
    ├── docker-compose.yml      # Compose 编排
    ├── Dockerfile.server       # 后端镜像
    ├── Dockerfile.client       # 前端镜像
    ├── nginx.conf              # Nginx 配置
    ├── init.sql                # 数据库初始化
    └── .env.example            # 环境变量示例
```

---

## 配置说明

### 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `POSTGRES_DB` | postman | 数据库名 |
| `POSTGRES_USER` | postgres | 数据库用户名 |
| `POSTGRES_PASSWORD` | postgres | 数据库密码（生产环境务必修改） |
| `DB_PORT` | 5432 | 数据库宿主机端口 |
| `SERVER_PORT` | 3000 | 后端服务端口 |
| `CLIENT_PORT` | 8080 | 前端访问端口 |
| `DATABASE_URL` | — | 后端数据库连接串（compose 自动设置） |

---

## 常见问题

### Q: 启动后前端白屏？
A: 检查浏览器 Console 报错。常见原因：端口被占用、后端未启动、API 代理配置错误。

### Q: 后端连不上数据库？
A: 确认 `db` 服务已健康启动（`docker compose ps` 查看状态），检查 `DATABASE_URL` 是否正确。

### Q: 发送请求报 CORS 错误？
A: 本应用通过后端代理发送请求，浏览器不会有 CORS 问题。如果直接在前端请求外部 API 会有 CORS，请使用代理接口 `/api/proxy/send`。

### Q: 数据存在哪里？如何迁移？
A: 数据存在 Docker Volume `deploy_postgres_data` 中。迁移时备份数据库 SQL 文件，在新环境恢复即可。

### Q: 支持多用户吗？
A: 独立部署版默认单用户模式（本地用户 `local_user`）。如需多用户，需要自行添加用户认证模块和 RLS 策略。

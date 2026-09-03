# Postman Web（API 调试工具）

一个功能齐全的 Postman 风格 API 调试工具，支持请求编辑、集合管理、环境变量、历史记录、多种身份认证，深色主题三栏布局。

## ✨ 功能特性

- **请求编辑器**：GET / POST / PUT / PATCH / DELETE / HEAD / OPTIONS
- **请求参数**：Query Params / Headers / Body（raw / JSON / form-data / x-www-form-urlencoded）
- **身份认证**：Bearer Token / Basic Auth / API Key
- **集合管理**：多级文件夹、增删改、导入导出（JSON）
- **环境变量**：多环境切换、`{{变量}}` 占位符自动替换
- **历史记录**：自动保存，一键加载重发
- **响应查看**：状态码 / 响应时间 / 响应大小 / Body（JSON 高亮 / Raw / Preview）/ Headers
- **后端代理转发**：通过后端发送请求，不受浏览器跨域（CORS）限制
- **数据持久化**：集合、环境、历史存入 PostgreSQL，刷新不丢失

## 🧱 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS 4 |
| 后端 | NestJS 10 + TypeScript + Drizzle ORM |
| 数据库 | PostgreSQL 14+ |
| HTTP 代理 | 后端 axios 转发（绕过 CORS） |

## 🚀 快速开始（Docker Compose）

镜像已发布到 Docker Hub：`ph99/postman-server`、`ph99/postman-client`

```bash
git clone https://github.com/penghua99/postman-web.git
cd postman-web/deploy

# 配置环境变量（修改数据库密码）
cp .env.example .env

# 一键启动
docker compose up -d --build

# 访问
# http://localhost:8080
```

> 也可以不使用本仓库源码，直接用 Docker Hub 镜像 + 交付的 `docker-compose.image.yml` 部署，详见 `deploy/README.md`。

## 🛠 本地开发

```bash
npm install
npm run dev:server   # 后端 http://localhost:3000
npm run dev:client   # 前端 http://localhost:5173
```

## 📁 目录结构

```
├── client/            # React 前端
│   └── src/components/postman/   # Postman UI 组件
├── server/            # NestJS 后端
│   └── modules/       # proxy / collections / environments / history
├── shared/            # 前后端共享类型
├── deploy/            # Docker 部署文件（compose / Dockerfile / nginx / init.sql）
└── package.json
```

## 📄 部署文档

详见 [`deploy/README.md`](deploy/README.md)，包含：

- Docker Compose 一键部署
- 飞牛 NAS / 群晖等 NAS 部署
- Docker Hub 镜像直接安装
- 环境变量说明
- 常见问题

## 📝 License

MIT

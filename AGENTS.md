# Postman 网页版应用

## 概览
全栈 Postman 风格的 API 测试工具，支持请求编辑、集合管理、环境变量、历史记录、身份认证。
深色主题，三栏布局（左侧资源树 + 中间编辑器 + 底部响应区）。

## 技术栈
- 前端：React 19 + TypeScript + Tailwind CSS
- 后端：NestJS 10 + Drizzle ORM + PostgreSQL
- HTTP 代理：后端 axios 转发，避免浏览器 CORS

## 设计规范

### 主题（深色 Postman 风格）
```
背景色: #0c0c0e  #17171c  #1e1e24  #25252d
前景色: #f5f5f5  #c8c8d0  #8a8a94
边框色: #2d2d38  #3a3a46
主色调: #ff6c37 (Postman 橙)
成功色: #22c55e
错误色: #ef4444
警告色: #f59e0b
信息色: #3b82f6
```

### 布局
- 三栏布局：左侧资源面板 (280px) + 中间编辑区 + 底部响应区
- 左侧面板包含 Collections / Environments / History 三个 Tab
- 请求编辑器：方法下拉 + URL 输入 + 发送按钮
- 响应区：Tabs（Body / Headers / Cookies / Test Results）
- 整体深色主题，等宽字体用于代码编辑

### 间距
- 基础间距单位：4px
- 面板内边距：p-3 (12px)
- 元素间距：gap-2 / gap-3
- 输入框高度：32px
- 按钮高度：32px

## 数据模型

### collections
- id, name, owner, parent_id (支持文件夹嵌套), sort_order, description
- created_at, created_by, updated_at, updated_by

### requests
- id, collection_id, name, method, url, body(json), headers(json), params(json)
- auth(json), auth_type, parent_id, sort_order
- created_at, created_by, updated_at, updated_by

### environments
- id, name, is_active, variables(json)
- created_at, created_by, updated_at, updated_by

### history
- id, method, url, status_code, response_time, response_size
- request_data(json), response_data(json)
- created_at, created_by

## 核心模块

### 后端模块
- proxy：HTTP 请求代理转发
- collections：集合/文件夹/请求 CRUD
- environments：环境变量 CRUD
- history：请求历史 CRUD

### 前端页面
- PostmanPage：主工作区（三栏布局）
- 左侧：Sidebar (Collections / Environments / History tabs)
- 中间：RequestEditor (方法/URL/Params/Headers/Body/Auth)
- 底部：ResponseViewer (状态/耗时/大小/Body/Headers)

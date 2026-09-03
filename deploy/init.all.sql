-- Postman 网页版（多用户版） - 数据库初始化脚本
-- 与 server/database/schema.standalone.ts 完全对齐
-- 适用于单容器部署，首次启动自动执行

-- ============================================================
-- 1. 业务表（collections / requests / environments / history）
-- ============================================================

CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_folder BOOLEAN NOT NULL DEFAULT FALSE,
  owner VARCHAR(255),
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_collections_parent_id ON collections (parent_id);
CREATE INDEX IF NOT EXISTS idx_collections_owner ON collections (owner);

CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID,
  parent_id UUID,
  name VARCHAR(255) NOT NULL,
  method VARCHAR(20) NOT NULL DEFAULT 'GET',
  url TEXT NOT NULL,
  params JSONB NOT NULL DEFAULT '[]',
  headers JSONB NOT NULL DEFAULT '[]',
  body JSONB NOT NULL DEFAULT '{}',
  auth JSONB NOT NULL DEFAULT '{}',
  auth_type VARCHAR(50) NOT NULL DEFAULT 'none',
  sort_order INTEGER NOT NULL DEFAULT 0,
  owner VARCHAR(255),
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_requests_collection_id ON requests (collection_id);
CREATE INDEX IF NOT EXISTS idx_requests_parent_id ON requests (parent_id);
CREATE INDEX IF NOT EXISTS idx_requests_owner ON requests (owner);

CREATE TABLE IF NOT EXISTS environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  variables JSONB NOT NULL DEFAULT '[]',
  owner VARCHAR(255),
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_environments_owner ON environments (owner);

CREATE TABLE IF NOT EXISTS history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method VARCHAR(20) NOT NULL,
  url TEXT NOT NULL,
  status_code INTEGER,
  response_time INTEGER,
  response_size INTEGER,
  request_data JSONB NOT NULL DEFAULT '{}',
  response_preview TEXT,
  owner VARCHAR(255),
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_history_created_at ON history (created_at);
CREATE INDEX IF NOT EXISTS idx_history_owner ON history (owner);

-- ============================================================
-- 2. 多用户 / RBAC 表
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(64) NOT NULL,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(64),
  email VARCHAR(255),
  avatar TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(64) NOT NULL,
  code VARCHAR(64) NOT NULL,
  description TEXT,
  is_builtin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_code ON roles (code);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(64) NOT NULL,
  code VARCHAR(128) NOT NULL,
  description TEXT,
  "group" VARCHAR(64),
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_permissions_code ON permissions (code);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions (role_id);

-- ============================================================
-- 3. 种子数据
-- ============================================================

-- 权限点
INSERT INTO permissions (id, name, code, description, "group") VALUES
  ('00000000-0000-0000-0000-000000000101', '查看集合',       'postman:collection.read',    '查看集合与请求', 'Postman 工作台'),
  ('00000000-0000-0000-0000-000000000102', '编辑集合',       'postman:collection.write',   '新建/编辑集合与请求', 'Postman 工作台'),
  ('00000000-0000-0000-0000-000000000103', '删除集合',       'postman:collection.delete',  '删除集合与请求', 'Postman 工作台'),
  ('00000000-0000-0000-0000-000000000104', '管理环境',       'postman:environment.manage', '管理环境变量', 'Postman 工作台'),
  ('00000000-0000-0000-0000-000000000105', '管理历史记录',   'postman:history.manage',     '查看/删除历史记录', 'Postman 工作台'),
  ('00000000-0000-0000-0000-000000000201', '查看用户',       'admin:user.view',            '查看用户列表', '管理端'),
  ('00000000-0000-0000-0000-000000000202', '管理用户',       'admin:user.manage',          '创建/编辑/禁用/删除用户', '管理端'),
  ('00000000-0000-0000-0000-000000000203', '管理角色',       'admin:role.manage',          '角色与权限分配', '管理端'),
  ('00000000-0000-0000-0000-000000000204', '管理权限',       'admin:permission.manage',    '权限点管理', '管理端')
ON CONFLICT (code) DO NOTHING;

-- 内置角色
INSERT INTO roles (id, name, code, description, is_builtin) VALUES
  ('00000000-0000-0000-0000-000000000001', '管理员', 'admin', '系统管理员，拥有全部权限', TRUE),
  ('00000000-0000-0000-0000-000000000002', '普通用户', 'user', '可使用 Postman 工作台的全部功能', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 角色-权限绑定
-- admin 角色：全部权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM permissions
ON CONFLICT DO NOTHING;

-- user 角色：Postman 工作台权限
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000102'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000103'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000104'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000105')
ON CONFLICT DO NOTHING;

-- 初始超级管理员（admin / admin123，请登录后立即修改密码）
INSERT INTO users (id, username, password_hash, display_name, email, status, is_super_admin) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'admin',
    'postman-admin-seed-salt-v1:9c1f79a1d4cbaef610b714c55b8c45f271f69ca96178d7b4ce8b13dcf6f4a5ad79b8434479efbc5b3c9173917eced3d2a2e1385eeefa2962a5ed467b17ec4843',
    '系统管理员',
    NULL,
    'active',
    TRUE
  )
ON CONFLICT (username) DO NOTHING;

-- admin 用户绑定 admin 角色
INSERT INTO user_roles (user_id, role_id) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Postman 网页版 - 初始化建表脚本
-- 适用于标准 PostgreSQL 14+，首次启动自动执行

-- 1. 创建 user_profile 复合类型（兼容原平台 schema 的 Drizzle custom type）
DO $$ BEGIN
  CREATE TYPE user_profile AS (
    user_id text
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. 创建 file_attachment 复合类型（保留兼容性，实际部署不使用）
DO $$ BEGIN
  CREATE TYPE file_attachment AS (
    bucket_id text,
    file_path text
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. collections 表
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_folder BOOLEAN NOT NULL DEFAULT FALSE,
  owner user_profile,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile
);

CREATE INDEX IF NOT EXISTS idx_collections_parent_id ON collections (parent_id);
CREATE INDEX IF NOT EXISTS idx_collections_owner ON collections (((owner).user_id));

-- 4. requests 表
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
  owner user_profile,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile
);

CREATE INDEX IF NOT EXISTS idx_requests_collection_id ON requests (collection_id);
CREATE INDEX IF NOT EXISTS idx_requests_parent_id ON requests (parent_id);
CREATE INDEX IF NOT EXISTS idx_requests_owner ON requests (((owner).user_id));

-- 5. environments 表
CREATE TABLE IF NOT EXISTS environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  variables JSONB NOT NULL DEFAULT '[]',
  owner user_profile,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile
);

CREATE INDEX IF NOT EXISTS idx_environments_owner ON environments (((owner).user_id));
CREATE UNIQUE INDEX IF NOT EXISTS idx_environments_owner_name ON environments (((owner).user_id), name);

-- 6. history 表
CREATE TABLE IF NOT EXISTS history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method VARCHAR(20) NOT NULL,
  url TEXT NOT NULL,
  status_code INTEGER,
  response_time INTEGER,
  response_size INTEGER,
  request_data JSONB NOT NULL DEFAULT '{}',
  response_preview TEXT,
  owner user_profile,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile
);

CREATE INDEX IF NOT EXISTS idx_history_created_at ON history (_created_at);
CREATE INDEX IF NOT EXISTS idx_history_owner ON history (((owner).user_id));

/* eslint-disable */
/** auto generated, do not edit */
import { sql } from 'drizzle-orm';
import { boolean, index, integer, jsonb, pgTable, text, uniqueIndex, uuid, varchar, customType } from "drizzle-orm/pg-core"

export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number };
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number) {
    if (value == null) return value as any;
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if (value instanceof Date) return value;
    return new Date(value);
  },
});

export const userProfile = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'user_profile';
  },
  toDriver(value: string) {
    return sql`ROW(${value})::user_profile`;
  },
  fromDriver(value: string) {
    const [userId] = value.slice(1, -1).split(',');
    return userId.trim();
  },
});

export type FileAttachment = {
  bucket_id: string;
  file_path: string;
};

export const fileAttachment = customType<{
  data: FileAttachment;
  driverData: string;
}>({
  dataType() {
    return 'file_attachment';
  },
  toDriver(value: FileAttachment) {
    return sql`ROW(${value.bucket_id},${value.file_path})::file_attachment`;
  },
  fromDriver(value: string): FileAttachment {
    const [bucketId, filePath] = value.slice(1, -1).split(',');
    return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
  },
});

export function escapeLiteral(str: string): string {
  return "'" + str.replace(/'/g, "''") + "'";
}

export const userProfileArray = customType<{
  data: string[];
  driverData: string;
}>({
  dataType() {
    return 'user_profile[]';
  },
  toDriver(value: string[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::user_profile[]`;
    }
    const elements = value.map(id => `ROW(${escapeLiteral(id)})::user_profile`).join(',');
    return sql.raw(`ARRAY[${elements}]::user_profile[]`);
  },
  fromDriver(value: string): string[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => m.slice(1, -1).split(',')[0].trim());
  },
});

export const fileAttachmentArray = customType<{
  data: FileAttachment[];
  driverData: string;
}>({
  dataType() {
    return 'file_attachment[]';
  },
  toDriver(value: FileAttachment[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::file_attachment[]`;
    }
    const elements = value.map(f =>
      `ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`
    ).join(',');
    return sql.raw(`ARRAY[${elements}]::file_attachment[]`);
  },
  fromDriver(value: string): FileAttachment[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => {
      const [bucketId, filePath] = m.slice(1, -1).split(',');
      return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    });
  },
});

export const history = pgTable("history", {
  id: uuid("id").primaryKey().defaultRandom(),
  method: varchar("method", { length: 20 }).notNull(),
  url: text("url").notNull(),
  statusCode: integer("status_code"),
  responseTime: integer("response_time"),
  responseSize: integer("response_size"),
  /**
   * @type {{ method: string; url: string; params: { key: string; value: string; enabled: boolean }[]; headers: { key: string; value: string; enabled: boolean }[]; body: { mode: string; raw?: string; formdata?: { key: string; value: string; type: string; enabled: boolean }[]; urlencoded?: { key: string; value: string; enabled: boolean }[] }; authType: string; auth: { bearerToken?: string; username?: string; password?: string; apiKey?: string; apiKeyName?: string; apiKeyIn?: string } }}
   */
  requestData: jsonb("request_data").notNull().default('{}'),
  responsePreview: text("response_preview"),
  owner: userProfile("owner"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  // Complex index: CREATE INDEX idx_history_owner ON history USING btree (((owner).user_id)),
  index("idx_history_created_at").on(table.createdAt),
]);

export const environments = pgTable("environments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  isActive: boolean("is_active").notNull().default(false),
  /**
   * @type {{ key: string; value: string; enabled: boolean }[]}
   */
  variables: jsonb("variables").notNull().default('[]'),
  owner: userProfile("owner"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  // Complex index: CREATE INDEX idx_environments_owner ON environments USING btree (((owner).user_id)),
  // Complex index: CREATE UNIQUE INDEX idx_environments_owner_name ON environments USING btree (((owner).user_id), name),
]);

export const requests = pgTable("requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  collectionId: uuid("collection_id"),
  parentId: uuid("parent_id"),
  name: varchar("name", { length: 255 }).notNull(),
  method: varchar("method", { length: 20 }).notNull().default('GET'),
  url: text("url").notNull(),
  /**
   * @type {{ key: string; value: string; enabled: boolean }[]}
   */
  params: jsonb("params").notNull().default('[]'),
  /**
   * @type {{ key: string; value: string; enabled: boolean }[]}
   */
  headers: jsonb("headers").notNull().default('[]'),
  /**
   * @type {{ mode: string; raw?: string; formdata?: { key: string; value: string; type: string; enabled: boolean }[]; urlencoded?: { key: string; value: string; enabled: boolean }[] }}
   */
  body: jsonb("body").notNull().default('{}'),
  /**
   * @type {{ bearerToken?: string; username?: string; password?: string; apiKey?: string; apiKeyName?: string; apiKeyIn?: string }}
   */
  auth: jsonb("auth").notNull().default('{}'),
  authType: varchar("auth_type", { length: 50 }).notNull().default('none'),
  sortOrder: integer("sort_order").notNull().default(0),
  owner: userProfile("owner"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_requests_collection_id").on(table.collectionId),
  index("idx_requests_parent_id").on(table.parentId),
  // Complex index: CREATE INDEX idx_requests_owner ON requests USING btree (((owner).user_id)),
]);

export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: uuid("parent_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  isFolder: boolean("is_folder").notNull().default(false),
  owner: userProfile("owner"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_collections_parent_id").on(table.parentId),
  // Complex index: CREATE INDEX idx_collections_owner ON collections USING btree (((owner).user_id)),
]);

// table aliases
export const collectionsTable = collections;
export const environmentsTable = environments;
export const historyTable = history;
export const requestsTable = requests;

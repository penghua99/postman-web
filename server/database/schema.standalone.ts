import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uuid,
  varchar,
  timestamp,
} from 'drizzle-orm/pg-core';

export const customTimestamptz = timestamp('_created_at', { precision: 3, mode: 'date' });

export const collections = pgTable('collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  parentId: uuid('parent_id'),
  sortOrder: integer('sort_order').notNull().default(0),
  isFolder: boolean('is_folder').notNull().default(false),
  owner: varchar('owner', { length: 255 }),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar('created_by', { length: 255 }),
  updatedAt: timestamp('updated_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: varchar('updated_by', { length: 255 }),
}, (table) => [
  index('idx_collections_parent_id').on(table.parentId),
  index('idx_collections_owner').on(table.owner),
]);

export const requests = pgTable('requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  collectionId: uuid('collection_id'),
  parentId: uuid('parent_id'),
  name: varchar('name', { length: 255 }).notNull(),
  method: varchar('method', { length: 20 }).notNull().default('GET'),
  url: text('url').notNull(),
  params: jsonb('params').notNull().default('[]'),
  headers: jsonb('headers').notNull().default('[]'),
  body: jsonb('body').notNull().default('{}'),
  auth: jsonb('auth').notNull().default('{}'),
  authType: varchar('auth_type', { length: 50 }).notNull().default('none'),
  sortOrder: integer('sort_order').notNull().default(0),
  owner: varchar('owner', { length: 255 }),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar('created_by', { length: 255 }),
  updatedAt: timestamp('updated_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: varchar('updated_by', { length: 255 }),
}, (table) => [
  index('idx_requests_collection_id').on(table.collectionId),
  index('idx_requests_parent_id').on(table.parentId),
  index('idx_requests_owner').on(table.owner),
]);

export const environments = pgTable('environments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  isActive: boolean('is_active').notNull().default(false),
  variables: jsonb('variables').notNull().default('[]'),
  owner: varchar('owner', { length: 255 }),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar('created_by', { length: 255 }),
  updatedAt: timestamp('updated_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: varchar('updated_by', { length: 255 }),
}, (table) => [
  index('idx_environments_owner').on(table.owner),
]);

export const history = pgTable('history', {
  id: uuid('id').primaryKey().defaultRandom(),
  method: varchar('method', { length: 20 }).notNull(),
  url: text('url').notNull(),
  statusCode: integer('status_code'),
  responseTime: integer('response_time'),
  responseSize: integer('response_size'),
  requestData: jsonb('request_data').notNull().default('{}'),
  responsePreview: text('response_preview'),
  owner: varchar('owner', { length: 255 }),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index('idx_history_created_at').on(table.createdAt),
  index('idx_history_owner').on(table.owner),
]);

export const collectionsTable = collections;
export const environmentsTable = environments;
export const historyTable = history;
export const requestsTable = requests;

import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq, and, inArray, asc } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE_DATABASE } from '@server/common/constants/db.constant';
import { collections, requests } from '@server/database/schema.standalone';
import type {
  CollectionTreeItem,
  CollectionItem,
  RequestItem,
  CreateCollectionDto,
  UpdateCollectionDto,
  CreateRequestDto,
  UpdateRequestDto,
  ExportCollectionResponse,
  ImportCollectionDto,
  HttpMethod,
  KeyValueParam,
  RequestBody,
  AuthConfig,
  AuthType,
} from '@shared/api.interface';

type CollectionRow = typeof collections.$inferSelect;
type RequestRow = typeof requests.$inferSelect;

@Injectable()
export class CollectionsService {
  private readonly logger = new Logger(CollectionsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // ── helpers ────────────────────────────────────────────────────────

  private toCollectionItem(row: CollectionRow): CollectionItem {
    return {
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      parentId: row.parentId,
      sortOrder: row.sortOrder,
      isFolder: row.isFolder,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toTreeItem(row: CollectionRow): CollectionTreeItem {
    return {
      ...this.toCollectionItem(row),
      children: [],
      requests: [],
    };
  }

  private toRequestItem(row: RequestRow): RequestItem {
    return {
      id: row.id,
      collectionId: row.collectionId,
      parentId: row.parentId,
      name: row.name,
      method: row.method as HttpMethod,
      url: row.url,
      params: (row.params as KeyValueParam[]) ?? [],
      headers: (row.headers as KeyValueParam[]) ?? [],
      body: (row.body as RequestBody) ?? { mode: 'none' },
      auth: (row.auth as AuthConfig) ?? {},
      authType: row.authType as AuthType,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async findCollectionOrThrow(id: string, userId: string): Promise<CollectionRow> {
    const rows: CollectionRow[] = await this.db
      .select()
      .from(collections)
      .where(and(eq(collections.id, id), eq(collections.owner, userId)));
    if (rows.length === 0) {
      throw new NotFoundException('集合不存在');
    }
    return rows[0];
  }

  private async findRequestOrThrow(id: string, userId: string): Promise<RequestRow> {
    const rows: RequestRow[] = await this.db
      .select()
      .from(requests)
      .where(and(eq(requests.id, id), eq(requests.owner, userId)));
    if (rows.length === 0) {
      throw new NotFoundException('请求不存在');
    }
    return rows[0];
  }

  // ── Collection Tree ────────────────────────────────────────────────

  async getTree(userId: string): Promise<CollectionTreeItem[]> {
    const allCollections: CollectionRow[] = await this.db
      .select()
      .from(collections)
      .where(eq(collections.owner, userId))
      .orderBy(asc(collections.sortOrder), asc(collections.name));

    const allRequests: RequestRow[] = await this.db
      .select()
      .from(requests)
      .where(eq(requests.owner, userId))
      .orderBy(asc(requests.sortOrder), asc(requests.name));

    // Build map
    const nodeMap = new Map<string, CollectionTreeItem>();
    for (const row of allCollections) {
      nodeMap.set(row.id, this.toTreeItem(row));
    }

    // Attach requests to nodes
    for (const req of allRequests) {
      const parentId = req.parentId ?? req.collectionId;
      if (parentId && nodeMap.has(parentId)) {
        nodeMap.get(parentId)!.requests.push(this.toRequestItem(req));
      } else if (req.collectionId && nodeMap.has(req.collectionId) && !req.parentId) {
        nodeMap.get(req.collectionId)!.requests.push(this.toRequestItem(req));
      }
    }

    // Build tree: children
    const roots: CollectionTreeItem[] = [];
    for (const row of allCollections) {
      const node = nodeMap.get(row.id)!;
      if (!row.parentId) {
        roots.push(node);
      } else {
        const parent = nodeMap.get(row.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          // orphan — treat as root
          roots.push(node);
        }
      }
    }

    return roots;
  }

  // ── Collection CRUD ────────────────────────────────────────────────

  async create(dto: CreateCollectionDto, userId: string): Promise<CollectionTreeItem> {
    const rows = await this.db
      .insert(collections)
      .values({
        name: dto.name,
        description: dto.description,
        parentId: dto.parentId ?? null,
        isFolder: dto.isFolder ?? false,
        sortOrder: 0,
        owner: userId,
      })
      .returning();
    return this.toTreeItem(rows[0]);
  }

  async update(
    id: string,
    dto: UpdateCollectionDto,
    userId: string,
  ): Promise<CollectionTreeItem> {
    await this.findCollectionOrThrow(id, userId);

    const patch: Partial<typeof collections.$inferInsert> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.parentId !== undefined) patch.parentId = dto.parentId;
    if (dto.sortOrder !== undefined) patch.sortOrder = dto.sortOrder;

    if (Object.keys(patch).length === 0) {
      const row = await this.findCollectionOrThrow(id, userId);
      return this.toTreeItem(row);
    }

    patch.updatedAt = new Date();
    patch.updatedBy = userId;

    const updated = await this.db
      .update(collections)
      .set(patch)
      .where(eq(collections.id, id))
      .returning();
    return this.toTreeItem(updated[0]);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findCollectionOrThrow(id, userId);

    await this.db.transaction(async (tx) => {
      // Collect all descendant collection ids recursively
      const allCollections: CollectionRow[] = await tx
        .select()
        .from(collections)
        .where(eq(collections.owner, userId));

      const descendantIds = new Set<string>();
      const collect = (pid: string) => {
        for (const c of allCollections) {
          if (c.parentId === pid && !descendantIds.has(c.id)) {
            descendantIds.add(c.id);
            collect(c.id);
          }
        }
      };
      descendantIds.add(id);
      collect(id);

      const idList = Array.from(descendantIds);

      // Delete requests belonging to any of these collections
      await tx
        .delete(requests)
        .where(
          and(
            eq(requests.owner, userId),
            inArray(requests.collectionId, idList),
          ),
        );

      // Delete collections
      await tx
        .delete(collections)
        .where(
          and(
            eq(collections.owner, userId),
            inArray(collections.id, idList),
          ),
        );
    });
  }

  // ── Export / Import ────────────────────────────────────────────────

  async exportCollection(
    id: string,
    userId: string,
  ): Promise<ExportCollectionResponse> {
    const root = await this.findCollectionOrThrow(id, userId);

    const allCollections: CollectionRow[] = await this.db
      .select()
      .from(collections)
      .where(eq(collections.owner, userId));

    // find all descendants
    const descendantIds = new Set<string>();
    const collect = (pid: string) => {
      for (const c of allCollections) {
        if (c.parentId === pid && !descendantIds.has(c.id)) {
          descendantIds.add(c.id);
          collect(c.id);
        }
      }
    };
    collect(id);

    const folders: CollectionItem[] = [];
    for (const c of allCollections) {
      if (descendantIds.has(c.id)) {
        folders.push(this.toCollectionItem(c));
      }
    }

    const allIds = [id, ...Array.from(descendantIds)];
    const reqRows: RequestRow[] = await this.db
      .select()
      .from(requests)
      .where(
        and(
          eq(requests.owner, userId),
          inArray(requests.collectionId, allIds),
        ),
      )
      .orderBy(asc(requests.sortOrder));

    const requestItems = reqRows.map((r: RequestRow) => this.toRequestItem(r));

    return {
      collection: this.toCollectionItem(root),
      folders,
      requests: requestItems,
    };
  }

  async importCollection(
    dto: ImportCollectionDto,
    userId: string,
  ): Promise<CollectionTreeItem> {
    return this.db.transaction(async (tx) => {
      // Create root collection
      const rootRows = await tx
        .insert(collections)
        .values({
          name: dto.collection.name,
          description: dto.collection.description,
          parentId: null,
          isFolder: false,
          sortOrder: 0,
          owner: userId,
        })
        .returning();
      const rootId = rootRows[0].id;

      // Map folderPath → folderId
      const folderMap = new Map<string, string>();

      const getOrCreateFolder = async (
        folderPath: string[],
      ): Promise<string> => {
        const key = folderPath.join('/');
        if (folderMap.has(key)) return folderMap.get(key)!;

        let parentId: string = rootId;
        let currentPath: string[] = [];

        for (const segment of folderPath) {
          currentPath.push(segment);
          const currentKey = currentPath.join('/');
          if (folderMap.has(currentKey)) {
            parentId = folderMap.get(currentKey)!;
            continue;
          }
          const newFolder = await tx
            .insert(collections)
            .values({
              name: segment,
              parentId,
              isFolder: true,
              sortOrder: 0,
              owner: userId,
            })
            .returning();
          folderMap.set(currentKey, newFolder[0].id);
          parentId = newFolder[0].id;
        }

        return parentId;
      };

      // Create requests
      for (const req of dto.requests) {
        let parentId: string | null = null;
        if (req.folderPath && req.folderPath.length > 0) {
          parentId = await getOrCreateFolder(req.folderPath);
        }

        await tx.insert(requests).values({
          collectionId: rootId,
          parentId,
          name: req.name,
          method: req.method,
          url: req.url,
          params: (req.params ?? []) as unknown as Record<string, unknown>[],
          headers: (req.headers ?? []) as unknown as Record<string, unknown>[],
          body: (req.body ?? { mode: 'none' }) as unknown as Record<string, unknown>,
          auth: (req.auth ?? {}) as unknown as Record<string, unknown>,
          authType: req.authType ?? 'none',
          sortOrder: 0,
          owner: userId,
        });
      }

      // Build and return the tree for the new collection
      const allCollections: CollectionRow[] = await tx
        .select()
        .from(collections)
        .where(eq(collections.owner, userId));

      const allRequests: RequestRow[] = await tx
        .select()
        .from(requests)
        .where(eq(requests.owner, userId));

      const nodeMap = new Map<string, CollectionTreeItem>();
      for (const row of allCollections) {
        nodeMap.set(row.id, this.toTreeItem(row));
      }

      for (const req of allRequests) {
        const parentId = req.parentId ?? req.collectionId;
        if (parentId && nodeMap.has(parentId)) {
          nodeMap.get(parentId)!.requests.push(this.toRequestItem(req));
        }
      }

      for (const row of allCollections) {
        if (row.parentId) {
          const parent = nodeMap.get(row.parentId);
          const child = nodeMap.get(row.id);
          if (parent && child) {
            parent.children.push(child);
          }
        }
      }

      const root = nodeMap.get(rootId);
      if (!root) {
        throw new NotFoundException('导入失败，集合未找到');
      }
      return root;
    });
  }

  // ── Request CRUD ───────────────────────────────────────────────────

  async listRequests(collectionId: string, userId: string): Promise<RequestItem[]> {
    const rows: RequestRow[] = await this.db
      .select()
      .from(requests)
      .where(
        and(
          eq(requests.owner, userId),
          eq(requests.collectionId, collectionId),
        ),
      )
      .orderBy(asc(requests.sortOrder), asc(requests.name));
    return rows.map((r: RequestRow) => this.toRequestItem(r));
  }

  async getRequest(id: string, userId: string): Promise<RequestItem> {
    const row = await this.findRequestOrThrow(id, userId);
    return this.toRequestItem(row);
  }

  async createRequest(
    dto: CreateRequestDto,
    userId: string,
  ): Promise<RequestItem> {
    const rows = await this.db
      .insert(requests)
      .values({
        collectionId: dto.collectionId ?? null,
        parentId: dto.parentId ?? null,
        name: dto.name,
        method: dto.method,
        url: dto.url,
        params: (dto.params ?? []) as unknown as Record<string, unknown>[],
        headers: (dto.headers ?? []) as unknown as Record<string, unknown>[],
        body: (dto.body ?? { mode: 'none' }) as unknown as Record<string, unknown>,
        auth: (dto.auth ?? {}) as unknown as Record<string, unknown>,
        authType: dto.authType ?? 'none',
        sortOrder: 0,
        owner: userId,
      })
      .returning();
    return this.toRequestItem(rows[0]);
  }

  async updateRequest(
    id: string,
    dto: UpdateRequestDto,
    userId: string,
  ): Promise<RequestItem> {
    await this.findRequestOrThrow(id, userId);

    const patch: Partial<typeof requests.$inferInsert> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.method !== undefined) patch.method = dto.method;
    if (dto.url !== undefined) patch.url = dto.url;
    if (dto.params !== undefined) patch.params = dto.params as unknown as Record<string, unknown>[];
    if (dto.headers !== undefined) patch.headers = dto.headers as unknown as Record<string, unknown>[];
    if (dto.body !== undefined) patch.body = dto.body as unknown as Record<string, unknown>;
    if (dto.auth !== undefined) patch.auth = dto.auth as unknown as Record<string, unknown>;
    if (dto.authType !== undefined) patch.authType = dto.authType;
    if (dto.parentId !== undefined) patch.parentId = dto.parentId;
    if (dto.collectionId !== undefined) patch.collectionId = dto.collectionId;
    if (dto.sortOrder !== undefined) patch.sortOrder = dto.sortOrder;

    if (Object.keys(patch).length === 0) {
      const row = await this.findRequestOrThrow(id, userId);
      return this.toRequestItem(row);
    }

    patch.updatedAt = new Date();
    patch.updatedBy = userId;

    const updated = await this.db
      .update(requests)
      .set(patch)
      .where(eq(requests.id, id))
      .returning();
    return this.toRequestItem(updated[0]);
  }

  async deleteRequest(id: string, userId: string): Promise<void> {
    await this.findRequestOrThrow(id, userId);
    await this.db.delete(requests).where(eq(requests.id, id));
  }
}

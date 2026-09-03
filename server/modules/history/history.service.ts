import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, desc, count } from 'drizzle-orm';
import { DRIZZLE_DATABASE } from '@server/common/constants/db.constant';
import { history } from '@server/database/schema';
import type { HistoryItem, HttpMethod } from '@shared/api.interface';
import type {
  KeyValueParam,
  RequestBody,
  AuthType,
  AuthConfig,
} from '@shared/api.interface';

interface CreateHistoryDto {
  method: HttpMethod;
  url: string;
  statusCode?: number;
  responseTime?: number;
  responseSize?: number;
  requestData: {
    method: HttpMethod;
    url: string;
    params: KeyValueParam[];
    headers: KeyValueParam[];
    body: RequestBody;
    authType: AuthType;
    auth: AuthConfig;
  };
  responsePreview?: string;
  userId: string;
}

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async list(
    userId: string,
    limit: number,
  ): Promise<{ items: HistoryItem[]; total: number }> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);

    const [countResult, rows] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(history)
        .where(eq(history.owner, userId)),
      this.db
        .select()
        .from(history)
        .where(eq(history.owner, userId))
        .orderBy(desc(history.createdAt))
        .limit(safeLimit),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const items: HistoryItem[] = rows.map((row) => this.toHistoryItem(row));

    return { items, total };
  }

  async get(id: string, userId: string): Promise<HistoryItem> {
    const rows = await this.db
      .select()
      .from(history)
      .where(eq(history.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('历史记录不存在');
    }

    const row = rows[0];
    if (row.owner !== userId) {
      throw new NotFoundException('历史记录不存在');
    }

    return this.toHistoryItem(row);
  }

  async create(dto: CreateHistoryDto): Promise<HistoryItem> {
    const rows = await this.db
      .insert(history)
      .values({
        method: dto.method,
        url: dto.url,
        statusCode: dto.statusCode,
        responseTime: dto.responseTime,
        responseSize: dto.responseSize,
        requestData: dto.requestData as unknown as Record<string, unknown>,
        responsePreview: dto.responsePreview,
        owner: dto.userId,
      })
      .returning();

    return this.toHistoryItem(rows[0]);
  }

  async remove(id: string, userId: string): Promise<void> {
    const rows = await this.db
      .delete(history)
      .where(eq(history.id, id))
      .returning({ id: history.id, owner: history.owner });

    if (rows.length === 0) {
      throw new NotFoundException('历史记录不存在');
    }
    if (rows[0].owner !== userId) {
      throw new NotFoundException('历史记录不存在');
    }
  }

  async clear(userId: string): Promise<void> {
    await this.db.delete(history).where(eq(history.owner, userId));
  }

  private toHistoryItem(row: typeof history.$inferSelect): HistoryItem {
    return {
      id: row.id,
      method: row.method as HttpMethod,
      url: row.url,
      statusCode: row.statusCode ?? undefined,
      responseTime: row.responseTime ?? undefined,
      responseSize: row.responseSize ?? undefined,
      requestData: row.requestData as HistoryItem['requestData'],
      responsePreview: row.responsePreview ?? undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }
}

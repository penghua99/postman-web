import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq, and, asc } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE_DATABASE } from '@server/common/constants/db.constant';
import { environments } from '@server/database/schema.standalone';
import type {
  EnvironmentItem,
  CreateEnvironmentDto,
  UpdateEnvironmentDto,
  KeyValueParam,
} from '@shared/api.interface';

type EnvironmentRow = typeof environments.$inferSelect;

@Injectable()
export class EnvironmentsService {
  private readonly logger = new Logger(EnvironmentsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // ── helpers ────────────────────────────────────────────────────────

  private toEnvironmentItem(row: EnvironmentRow): EnvironmentItem {
    return {
      id: row.id,
      name: row.name,
      isActive: row.isActive,
      variables: (row.variables as KeyValueParam[]) ?? [],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async findEnvironmentOrThrow(
    id: string,
    userId: string,
  ): Promise<EnvironmentRow> {
    const rows: EnvironmentRow[] = await this.db
      .select()
      .from(environments)
      .where(and(eq(environments.id, id), eq(environments.owner, userId)));
    if (rows.length === 0) {
      throw new NotFoundException('环境不存在');
    }
    return rows[0];
  }

  // ── CRUD ───────────────────────────────────────────────────────────

  async list(userId: string): Promise<EnvironmentItem[]> {
    const rows: EnvironmentRow[] = await this.db
      .select()
      .from(environments)
      .where(eq(environments.owner, userId))
      .orderBy(asc(environments.name));
    return rows.map((r: EnvironmentRow) => this.toEnvironmentItem(r));
  }

  async create(
    dto: CreateEnvironmentDto,
    userId: string,
  ): Promise<EnvironmentItem> {
    const rows = await this.db
      .insert(environments)
      .values({
        name: dto.name,
        variables: (dto.variables ?? []) as unknown as Record<string, unknown>[],
        isActive: false,
        owner: userId,
      })
      .returning();
    return this.toEnvironmentItem(rows[0]);
  }

  async update(
    id: string,
    dto: UpdateEnvironmentDto,
    userId: string,
  ): Promise<EnvironmentItem> {
    await this.findEnvironmentOrThrow(id, userId);

    const patch: Partial<typeof environments.$inferInsert> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.isActive !== undefined) patch.isActive = dto.isActive;
    if (dto.variables !== undefined) {
      patch.variables = dto.variables as unknown as Record<string, unknown>[];
    }

    if (Object.keys(patch).length === 0) {
      const row = await this.findEnvironmentOrThrow(id, userId);
      return this.toEnvironmentItem(row);
    }

    patch.updatedAt = new Date();
    patch.updatedBy = userId;

    const updated = await this.db
      .update(environments)
      .set(patch)
      .where(eq(environments.id, id))
      .returning();
    return this.toEnvironmentItem(updated[0]);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findEnvironmentOrThrow(id, userId);
    await this.db.delete(environments).where(eq(environments.id, id));
  }

  async setActive(id: string, userId: string): Promise<EnvironmentItem> {
    await this.findEnvironmentOrThrow(id, userId);

    return this.db.transaction(async (tx) => {
      // Deactivate all environments for this user
      await tx
        .update(environments)
        .set({
          isActive: false,
          updatedAt: new Date(),
          updatedBy: userId,
        })
        .where(eq(environments.owner, userId));

      // Activate the specified one
      const updated = await tx
        .update(environments)
        .set({
          isActive: true,
          updatedAt: new Date(),
          updatedBy: userId,
        })
        .where(and(eq(environments.id, id), eq(environments.owner, userId)))
        .returning();

      return this.toEnvironmentItem(updated[0]);
    });
  }
}

/* eslint-disable import/no-extraneous-dependencies */
import { Global, Module } from '@nestjs/common';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DRIZZLE_DATABASE } from '@server/common/constants/db.constant';

const databaseProvider = {
  provide: DRIZZLE_DATABASE,
  useFactory: (): PostgresJsDatabase => {
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postman';
    const queryClient = postgres(databaseUrl, { max: 10 });
    return drizzle(queryClient);
  },
};

@Global()
@Module({
  providers: [databaseProvider],
  exports: [DRIZZLE_DATABASE],
})
export class DatabaseModule {}

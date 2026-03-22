import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/vybeos';

// Connection for queries (pooled)
const queryClient = postgres(connectionString, { max: 10 });
export const db = drizzle(queryClient, { schema });

// Set tenant context for RLS
export async function withTenant<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
  await queryClient`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
  return fn();
}

// Migration client (single connection)
export function getMigrationClient() {
  const migrationClient = postgres(connectionString, { max: 1 });
  return drizzle(migrationClient, { schema });
}

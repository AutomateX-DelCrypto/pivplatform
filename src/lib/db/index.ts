// ===========================================
// Database Client
// ===========================================

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Connection string from environment
const connectionString = process.env.DATABASE_URL!;

// Create postgres client
// Use different configs for production vs development
const client = postgres(connectionString, {
  max: process.env.NODE_ENV === 'production' ? 10 : 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create drizzle database instance with schema
export const db = drizzle(client, { schema });

// Export schema for easy access
export { schema };

// Type helper for database client
export type Database = typeof db;

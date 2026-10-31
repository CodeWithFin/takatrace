import postgres from 'postgres';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/takatrace';

export const db = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

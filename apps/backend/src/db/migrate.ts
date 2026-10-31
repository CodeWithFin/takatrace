import 'dotenv/config';
import { db } from './client';

async function migrate() {
  console.log('Running migrations...');

  await db`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
  `;

  await db`
    CREATE TABLE IF NOT EXISTS users (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      phone_number VARCHAR(20) UNIQUE NOT NULL,
      balance     DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      phone_number VARCHAR(20) NOT NULL,
      code        VARCHAR(6) NOT NULL,
      expires_at  TIMESTAMPTZ NOT NULL,
      used        BOOLEAN DEFAULT FALSE,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await db`
    CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone_number, used, expires_at)
  `;

  await db`
    CREATE TABLE IF NOT EXISTS scan_events (
      id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      image_url           TEXT NOT NULL,
      material_type       VARCHAR(100) NOT NULL,
      estimated_weight    DECIMAL(8, 3) NOT NULL,
      latitude            DECIMAL(10, 7) NOT NULL,
      longitude           DECIMAL(10, 7) NOT NULL,
      credit_value        DECIMAL(10, 2) NOT NULL,
      ai_confidence_score DECIMAL(5, 4) NOT NULL,
      timestamp           TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )
  `;

  await db`
    CREATE INDEX IF NOT EXISTS idx_scans_user ON scan_events(user_id, timestamp DESC)
  `;

  await db`
    CREATE TYPE IF NOT EXISTS tx_status AS ENUM ('pending', 'completed', 'failed')
  `;

  await db`
    CREATE TABLE IF NOT EXISTS transactions (
      id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount              DECIMAL(12, 2) NOT NULL,
      mpesa_receipt_number VARCHAR(50),
      status              tx_status DEFAULT 'pending' NOT NULL,
      timestamp           TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )
  `;

  await db`
    CREATE INDEX IF NOT EXISTS idx_tx_user ON transactions(user_id, timestamp DESC)
  `;

  console.log('Migrations complete.');
  await db.end();
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});

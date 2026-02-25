import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// ── Database file location ──────────────────────────────────────────────────
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'finsentinel.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  // Ensure the data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  _db = new Database(DB_PATH);

  // Performance settings
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  _db.pragma('synchronous = NORMAL');

  initSchema(_db);
  return _db;
}

// ── Stub kept for backwards-compat (routes call this but it's now a no-op) ──
export async function initializeDbAsync(): Promise<void> {
  getDb(); // ensure init
}

// ── Schema ──────────────────────────────────────────────────────────────────
function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      name        TEXT NOT NULL,
      currency    TEXT NOT NULL DEFAULT 'USD',
      timezone    TEXT NOT NULL DEFAULT 'UTC',
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id             TEXT PRIMARY KEY,
      user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category       TEXT NOT NULL,
      amount         REAL NOT NULL,
      description    TEXT,
      date           INTEGER NOT NULL,
      payment_method TEXT,
      tags           TEXT,
      mood           TEXT,
      is_donation    INTEGER NOT NULL DEFAULT 0,
      created_at     INTEGER NOT NULL,
      updated_at     INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS income (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      source      TEXT NOT NULL,
      amount      REAL NOT NULL,
      date        INTEGER NOT NULL,
      notes       TEXT,
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id              TEXT PRIMARY KEY,
      user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category        TEXT NOT NULL,
      limit_amount    REAL NOT NULL,
      spent_amount    REAL NOT NULL DEFAULT 0,
      period          TEXT NOT NULL DEFAULT 'monthly',
      start_date      INTEGER,
      end_date        INTEGER,
      alert_threshold REAL NOT NULL DEFAULT 80,
      created_at      INTEGER NOT NULL,
      updated_at      INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS goals (
      id             TEXT PRIMARY KEY,
      user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title          TEXT NOT NULL,
      description    TEXT,
      target_amount  REAL NOT NULL,
      current_amount REAL NOT NULL DEFAULT 0,
      deadline       INTEGER,
      category       TEXT,
      status         TEXT NOT NULL DEFAULT 'active',
      created_at     INTEGER NOT NULL,
      updated_at     INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS investments (
      id             TEXT PRIMARY KEY,
      user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      symbol         TEXT NOT NULL,
      name           TEXT NOT NULL,
      type           TEXT NOT NULL,
      shares         REAL NOT NULL DEFAULT 0,
      purchase_price REAL NOT NULL,
      current_price  REAL NOT NULL,
      purchase_date  INTEGER,
      notes          TEXT,
      created_at     INTEGER NOT NULL,
      updated_at     INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id               TEXT PRIMARY KEY,
      user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type             TEXT NOT NULL,
      category         TEXT NOT NULL,
      amount           REAL NOT NULL,
      description      TEXT,
      frequency        TEXT NOT NULL,
      next_date        INTEGER NOT NULL,
      last_processed   INTEGER,
      is_active        INTEGER NOT NULL DEFAULT 1,
      created_at       INTEGER NOT NULL,
      updated_at       INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS family_groups (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      owner_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS family_members (
      id          TEXT PRIMARY KEY,
      group_id    TEXT NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role        TEXT NOT NULL DEFAULT 'member',
      joined_at   INTEGER NOT NULL,
      UNIQUE(group_id, user_id)
    );
  `);
}

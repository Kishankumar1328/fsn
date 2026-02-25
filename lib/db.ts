import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';

let SQL: any = null;

// Synchronous wrapper for sql.js database operations
class SyncDatabase {
  private db: any;

  constructor(database: any) {
    this.db = database;
  }

  prepare(sql: string) {
    const self = this;
    return {
      run(...params: any[]) {
        try {
          const stmt = self.db.prepare(sql);
          stmt.run(params);
          stmt.free();
          const result = { changes: self.db.getRowsModified() };
          saveDatabase();
          return result;
        } catch (error) {
          console.error('[v0] Database error:', error, 'SQL:', sql);
          throw error;
        }
      },
      get(...params: any[]) {
        try {
          const stmt = self.db.prepare(sql);
          stmt.bind(params);
          if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return row;
          }
          stmt.free();
          return null;
        } catch (error) {
          console.error('[v0] Database error:', error, 'SQL:', sql);
          throw error;
        }
      },
      all(...params: any[]) {
        try {
          const results: any[] = [];
          const stmt = self.db.prepare(sql);
          stmt.bind(params);
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          stmt.free();
          return results;
        } catch (error) {
          console.error('[v0] Database error:', error, 'SQL:', sql);
          throw error;
        }
      },
    };
  }

  exec(sql: string) {
    try {
      this.db.run(sql);
    } catch (error) {
      console.error('[v0] Database error:', error);
      throw error;
    }
  }

  pragma(pragma: string) {
    try {
      this.db.run(`PRAGMA ${pragma}`);
    } catch (error) {
      console.error('[v0] Pragma error:', error);
    }
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }

  save(): Uint8Array {
    return this.db.export();
  }
}

const globalForDb = globalThis as unknown as {
  syncDb: SyncDatabase | undefined;
  initialized: boolean | undefined;
};

export async function initializeDbAsync(): Promise<void> {
  if (globalForDb.initialized) return;

  if (!globalForDb.syncDb) {
    if (!SQL) {
      const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
      const wasmBinary = fs.readFileSync(wasmPath);
      SQL = await initSqlJs({ wasmBinary });
    }

    const DB_PATH = path.join(process.cwd(), 'data', 'finssentinel.db');
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    let fileBuffer: Uint8Array | null = null;
    if (fs.existsSync(DB_PATH)) {
      fileBuffer = fs.readFileSync(DB_PATH);
    }

    const database = fileBuffer ? new SQL.Database(fileBuffer) : new SQL.Database();
    globalForDb.syncDb = new SyncDatabase(database);
  }

  runMigrations();
  globalForDb.initialized = true;
}

function runMigrations() {
  if (!globalForDb.syncDb) return;
  const db = globalForDb.syncDb;

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      currency TEXT DEFAULT 'USD',
      timezone TEXT DEFAULT 'UTC',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      date INTEGER NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      mood TEXT,
      is_donation BOOLEAN DEFAULT 0,
      tags TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS donations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      organization TEXT NOT NULL,
      amount REAL NOT NULL,
      cause TEXT NOT NULL,
      date INTEGER NOT NULL,
      impact_description TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS income (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      source TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      date INTEGER NOT NULL,
      recurring BOOLEAN DEFAULT 0,
      recurrence_period TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category TEXT NOT NULL,
      limit_amount REAL NOT NULL,
      spent_amount REAL DEFAULT 0,
      period TEXT DEFAULT 'monthly',
      start_date INTEGER NOT NULL,
      end_date INTEGER,
      alert_threshold REAL DEFAULT 80,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      deadline INTEGER NOT NULL,
      category TEXT NOT NULL,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'active',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      frequency TEXT NOT NULL,
      next_date INTEGER NOT NULL,
      last_executed INTEGER,
      is_active BOOLEAN DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS insights (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      generated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_income_user_id ON income(user_id);
    CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
    CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_recurring_user_id ON recurring_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_insights_user_id ON insights(user_id);
  `);

  try { db.exec('ALTER TABLE expenses ADD COLUMN mood TEXT;'); } catch (e) { }
  try { db.exec('ALTER TABLE expenses ADD COLUMN is_donation BOOLEAN DEFAULT 0;'); } catch (e) { }

  db.pragma('foreign_keys = ON');
  saveDatabase();
}

function saveDatabase() {
  if (!globalForDb.syncDb) return;
  const DB_PATH = path.join(process.cwd(), 'data', 'finssentinel.db');
  const data = globalForDb.syncDb.save();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

export function getDb(): SyncDatabase {
  if (!globalForDb.syncDb) {
    throw new Error('Database not initialized. Call initializeDbAsync() first.');
  }
  return globalForDb.syncDb;
}

export function getDbSync(): SyncDatabase {
  if (!globalForDb.syncDb) {
    throw new Error('Database not initialized');
  }
  return globalForDb.syncDb;
}

export function closeDb(): void {
  if (globalForDb.syncDb) {
    saveDatabase();
    globalForDb.syncDb.close();
    globalForDb.syncDb = undefined;
    globalForDb.initialized = false;
  }
}

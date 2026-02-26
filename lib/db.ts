import mysql from 'mysql2/promise';

// Database configuration from environment variables
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_DATABASE || 'finsentinel',
  multipleStatements: true,
};

class DatabaseWrapper {
  private pool: mysql.Pool;

  constructor(pool: mysql.Pool) {
    this.pool = pool;
  }

  prepare(sql: string) {
    const pool = this.pool;
    return {
      async run(...params: any[]) {
        try {
          const [result] = await pool.execute(sql, params);
          // Normalize result to be compatible with better-sqlite3 expectations
          if (result && typeof result === 'object' && !Array.isArray(result)) {
            const res = result as any;
            return {
              ...res,
              changes: res.affectedRows ?? 0,
              lastInsertRowid: res.insertId ?? null,
            };
          }
          return result;
        } catch (error) {
          console.error('[v0] MySQL error (run):', error, 'SQL:', sql);
          throw error;
        }
      },
      async get(...params: any[]) {
        try {
          const [rows] = await pool.execute(sql, params);
          return (rows as any[])[0] || null;
        } catch (error) {
          console.error('[v0] MySQL error (get):', error, 'SQL:', sql);
          throw error;
        }
      },
      async all(...params: any[]) {
        try {
          const [rows] = await pool.execute(sql, params);
          return rows as any[];
        } catch (error) {
          console.error('[v0] MySQL error (all):', error, 'SQL:', sql);
          throw error;
        }
      },
    };
  }

  async exec(sql: string) {
    try {
      await this.pool.query(sql);
    } catch (error) {
      console.error('[v0] MySQL error (exec):', error);
      throw error;
    }
  }

  async close() {
    await this.pool.end();
  }
}

const globalForDb = globalThis as unknown as {
  dbWrapper: DatabaseWrapper | undefined;
  initialized: boolean | undefined;
};

export async function initializeDbAsync(): Promise<void> {
  if (globalForDb.initialized) return;

  if (!globalForDb.dbWrapper) {
    try {
      // First, connect without a database to create it if it doesn't exist
      const connection = await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
      });

      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
      await connection.end();

      // Now create the pool with the database selected
      const pool = mysql.createPool(dbConfig);
      globalForDb.dbWrapper = new DatabaseWrapper(pool);
    } catch (e: any) {
      console.error('[v0] Failed to initialize MySQL:', e.message);
      throw new Error(`Failed to initialize MySQL: ${e.message}`);
    }
  }

  await runMigrations();
  globalForDb.initialized = true;
}

async function runMigrations() {
  if (!globalForDb.dbWrapper) return;
  const db = globalForDb.dbWrapper;

  // MySQL specific types and constraints
  // Convert TEXT PRIMARY KEY to VARCHAR(255) PRIMARY KEY for better indexing
  // Convert REAL to DOUBLE
  // Convert INTEGER (timestamps) to BIGINT
  // Convert BOOLEAN to TINYINT(1)

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name VARCHAR(255) NOT NULL,
      currency VARCHAR(10) DEFAULT 'USD',
      timezone VARCHAR(50) DEFAULT 'UTC',
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS expenses (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      amount DOUBLE NOT NULL,
      description TEXT,
      date BIGINT NOT NULL,
      payment_method VARCHAR(50) DEFAULT 'cash',
      mood VARCHAR(50),
      is_donation TINYINT(1) DEFAULT 0,
      tags TEXT,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS donations (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      organization VARCHAR(255) NOT NULL,
      amount DOUBLE NOT NULL,
      cause VARCHAR(255) NOT NULL,
      date BIGINT NOT NULL,
      impact_description TEXT,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS income (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      source VARCHAR(255) NOT NULL,
      amount DOUBLE NOT NULL,
      description TEXT,
      date BIGINT NOT NULL,
      recurring TINYINT(1) DEFAULT 0,
      recurrence_period VARCHAR(50),
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS budgets (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      limit_amount DOUBLE NOT NULL,
      spent_amount DOUBLE DEFAULT 0,
      period VARCHAR(50) DEFAULT 'monthly',
      start_date BIGINT NOT NULL,
      end_date BIGINT,
      alert_threshold DOUBLE DEFAULT 80,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS goals (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      target_amount DOUBLE NOT NULL,
      current_amount DOUBLE DEFAULT 0,
      deadline BIGINT NOT NULL,
      category VARCHAR(100) NOT NULL,
      priority VARCHAR(20) DEFAULT 'medium',
      status VARCHAR(20) DEFAULT 'active',
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      type VARCHAR(20) NOT NULL,
      amount DOUBLE NOT NULL,
      description TEXT,
      category VARCHAR(100) NOT NULL,
      frequency VARCHAR(50) NOT NULL,
      next_date BIGINT NOT NULL,
      last_executed BIGINT,
      is_active TINYINT(1) DEFAULT 1,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS insights (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      type VARCHAR(100) NOT NULL,
      data JSON NOT NULL,
      generated_at BIGINT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS investments (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      ticker VARCHAR(20) NOT NULL,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'stock',
      shares DOUBLE NOT NULL DEFAULT 0,
      buy_price DOUBLE NOT NULL,
      current_price DOUBLE NOT NULL,
      buy_date BIGINT NOT NULL,
      sector VARCHAR(100),
      notes TEXT,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS family_groups (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      owner_id VARCHAR(255) NOT NULL,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS family_members (
      id VARCHAR(255) PRIMARY KEY,
      group_id VARCHAR(255) NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'member',
      joined_at BIGINT NOT NULL,
      FOREIGN KEY (group_id) REFERENCES family_groups(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS family_invites (
      id VARCHAR(255) PRIMARY KEY,
      group_id VARCHAR(255) NOT NULL,
      invited_email VARCHAR(255) NOT NULL,
      invited_by VARCHAR(255) NOT NULL,
      token VARCHAR(255) UNIQUE NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      expires_at BIGINT NOT NULL,
      created_at BIGINT NOT NULL
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS tax_events (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      year INT NOT NULL,
      category VARCHAR(100) NOT NULL,
      amount DOUBLE NOT NULL,
      description TEXT,
      is_deductible TINYINT(1) DEFAULT 0,
      receipt_ref VARCHAR(255),
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS notification_log (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      type VARCHAR(100) NOT NULL,
      payload JSON,
      sent_at BIGINT NOT NULL
    ) ENGINE=InnoDB;
  `);

  // Create indexes (MySQL syntax)
  // We can't use CREATE INDEX IF NOT EXISTS in all MySQL versions,
  // but we can use this little trick or just check beforehand.
  // For simplicity, we'll try to create them and ignore the error if they exist.
  const indexes = [
    ['idx_expenses_user_id', 'expenses', 'user_id'],
    ['idx_expenses_date', 'expenses', 'date'],
    ['idx_expenses_user_date', 'expenses', 'user_id, date'],
    ['idx_income_user_id', 'income', 'user_id'],
    ['idx_budgets_user_id', 'budgets', 'user_id'],
    ['idx_goals_user_id', 'goals', 'user_id'],
    ['idx_recurring_user_id', 'recurring_transactions', 'user_id'],
    ['idx_insights_user_id', 'insights', 'user_id'],
    ['idx_investments_user_id', 'investments', 'user_id'],
    ['idx_family_members_group', 'family_members', 'group_id'],
    ['idx_family_members_user', 'family_members', 'user_id'],
    ['idx_tax_events_user_year', 'tax_events', 'user_id, year'],
  ];

  for (const [name, table, columns] of indexes) {
    try {
      await db.exec(`CREATE INDEX ${name} ON ${table} (${columns})`);
    } catch (e: any) {
      if (!e.message.includes('Duplicate key name')) {
        console.warn(`[v0] Warning creating index ${name}:`, e.message);
      }
    }
  }
}

export function getDb(): DatabaseWrapper {
  if (!globalForDb.dbWrapper) {
    throw new Error('Database not initialized. Call initializeDbAsync() first.');
  }
  return globalForDb.dbWrapper;
}

export function getDbSync(): DatabaseWrapper {
  console.warn('[v0] getDbSync called, but MySQL is asynchronous. This may cause issues.');
  if (!globalForDb.dbWrapper) {
    throw new Error('Database not initialized');
  }
  return globalForDb.dbWrapper;
}

export async function closeDb(): Promise<void> {
  if (globalForDb.dbWrapper) {
    await globalForDb.dbWrapper.close();
    globalForDb.dbWrapper = undefined;
    globalForDb.initialized = false;
  }
}

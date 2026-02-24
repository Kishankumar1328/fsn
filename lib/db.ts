import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initializeDatabase } from './db-init';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) {
    return db;
  }

  const DB_PATH = path.join(process.cwd(), 'data', 'finssentinel.db');
  
  // Initialize database if it doesn't exist
  if (!fs.existsSync(DB_PATH)) {
    console.log('[v0] Database not found, initializing...');
    db = initializeDatabase();
  } else {
    db = new Database(DB_PATH);
    db.pragma('foreign_keys = ON');
  }
  
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

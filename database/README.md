# FinSentinel Database

This directory contains the MySQL database schema and related scripts.

## Contents

- `schema.sql`: Full table and index definitions for MySQL.
- `init.ts` (Optional): Script to initialize the database (if you prefer manual control).

## Setup

The application is configured to automatically initialize the database on startup using `initializeDbAsync()` in `lib/db.ts`. 

If you wish to manually create the database, you can run the `schema.sql` file against your MySQL instance:

```bash
mysql -u root -p finsentinel < database/schema.sql
```

Ensure your `.env.local` is correctly configured with your MySQL credentials.

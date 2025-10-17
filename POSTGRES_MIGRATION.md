# PostgreSQL Migration Guide

This document describes the migration from SQLite to PostgreSQL for the bm-lh-nextgen application.

## Overview

The application has been updated to use PostgreSQL instead of SQLite. This provides better scalability, concurrent access, and production-ready database capabilities.

## What's Changed

### Docker Configuration

1. **docker-compose.yml**
   - Added PostgreSQL 17 service (`bm-lh-postgres`)
   - PostgreSQL data is persisted to `./db` directory via bind mount
   - Added health checks and container dependencies
   - Application waits for PostgreSQL to be healthy before starting

2. **.env.example**
   - Added PostgreSQL configuration variables
   - Added database connection variables for the application
   - Uses fixed container name `bm-lh-postgres` for DB_HOST

3. **Dockerfile**
   - Added PostgreSQL client tools for both build and runtime
   - Updated entrypoint script to include PostgreSQL environment variables

### Application Code

1. **package.json**
   - Added `pg` (node-postgres) driver

2. **src/db/database.js**
   - Completely rewritten to use PostgreSQL
   - Maintains similar API to better-sqlite3 for minimal code changes
   - Auto-converts SQLite-style parameterized queries (?) to PostgreSQL style ($1, $2, etc.)
   - Handles column name quoting for PostgreSQL compatibility
   - All database operations are now async

3. **src/server.js**
   - Updated to handle async database initialization

4. **src/routes/lastheard.js**
   - Updated to use async/await pattern

### Migration Script

- **scripts/migrate-sqlite-to-postgres.js**
  - Automated script to migrate data from SQLite to PostgreSQL
  - Handles all tables
  - Resets sequences after migration
  - Provides detailed progress and summary

## Setup and Configuration

### 1. Configure Environment Variables

Copy the example environment file and update it with your settings:

```bash
cp .env.example .env
```

Edit `.env` and set strong passwords:

```bash
# PostgreSQL Configuration
POSTGRES_USER=bm_lh_user
POSTGRES_PASSWORD=your-strong-password-here
POSTGRES_DB=bm_lh_nextgen

# Application Database Connection
DB_HOST=bm-lh-postgres
DB_PORT=5432
DB_USER=bm_lh_user
DB_PASSWORD=your-strong-password-here
DB_NAME=bm_lh_nextgen

# Other settings...
ADMIN_PASSWORD=your-admin-password
```

### 2. Start the Services

```bash
docker-compose up -d
```

This will:
1. Start the PostgreSQL container
2. Wait for PostgreSQL to be healthy
3. Start the application container
4. Automatically create all required database tables

### 3. Migrate Existing Data (Optional)

If you have existing data in SQLite that you want to migrate to PostgreSQL:

```bash
# Ensure your SQLite database is in the ./data directory
# Then run the migration script from within the container:

docker-compose exec bm-lh-nextgen node scripts/migrate-sqlite-to-postgres.js
```

The script will:
- Read data from `./data/lastheard.db` (SQLite)
- Insert it into the PostgreSQL database
- Handle all tables (lastheard, api_keys, talkgroups, users, etc.)
- Reset PostgreSQL sequences
- Provide a detailed migration summary

## Directory Structure

```
bm-lh-nextgen/
├── db/                          # PostgreSQL data (bind mounted)
│   └── (PostgreSQL files)
├── data/                        # SQLite database (for migration)
│   └── lastheard.db
├── scripts/
│   └── migrate-sqlite-to-postgres.js
├── .env                         # Your configuration (create from .env.example)
├── .env.example                 # Example configuration
└── docker-compose.yml           # Defines PostgreSQL and app services
```

## Database Schema

PostgreSQL schema mirrors the SQLite schema with these adaptations:

- `SERIAL` for auto-increment IDs (instead of `AUTOINCREMENT`)
- `BIGINT` for Unix timestamps (instead of `INTEGER`)
- Quoted column names for mixed-case columns (`"SourceID"`, `"DestinationID"`, etc.)
- `EXTRACT(EPOCH FROM NOW())::BIGINT` for current timestamp defaults

## Troubleshooting

### Container won't start

Check if PostgreSQL is healthy:
```bash
docker-compose logs postgres
```

### Database connection errors

1. Verify environment variables in `.env`
2. Ensure `DB_HOST=bm-lh-postgres` (the container name)
3. Check PostgreSQL is running: `docker-compose ps`

### Migration script errors

1. Ensure SQLite database exists at `./data/lastheard.db`
2. Check PostgreSQL connection details in `.env`
3. Run with verbose logging: `node scripts/migrate-sqlite-to-postgres.js`

## Verifying the Migration

After migration, you can verify the data:

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U bm_lh_user -d bm_lh_nextgen

# Check table row counts
SELECT 'lastheard' as table_name, COUNT(*) as rows FROM lastheard
UNION ALL
SELECT 'api_keys', COUNT(*) FROM api_keys
UNION ALL
SELECT 'talkgroups', COUNT(*) FROM talkgroups;

# Exit psql
\q
```

## Performance Considerations

PostgreSQL offers better performance for concurrent access:

- Connection pooling (max 20 connections)
- Better indexing for complex queries
- MVCC for concurrent reads/writes
- No file locking issues

##  Backup and Restore

### Backup PostgreSQL database

```bash
docker-compose exec postgres pg_dump -U bm_lh_user bm_lh_nextgen > backup.sql
```

### Restore PostgreSQL database

```bash
cat backup.sql | docker-compose exec -T postgres psql -U bm_lh_user -d bm_lh_nextgen
```

## Rollback to SQLite (if needed)

If you need to rollback to SQLite:

1. Checkout the previous version before migration
2. Restore your SQLite database from backup
3. Update docker-compose.yml to remove PostgreSQL service

## Support

For issues or questions:
- Check application logs: `docker-compose logs bm-lh-nextgen`
- Check PostgreSQL logs: `docker-compose logs postgres`
- Review this migration guide
- Check the GitHub repository issues


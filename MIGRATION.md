# Database Migration Guide

This guide explains how to migrate your existing SQLite database to PostgreSQL.

## Prerequisites

### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y postgresql-client libpq-dev build-essential
```

### Other Linux Distributions
- **Fedora/RHEL/CentOS**: `sudo dnf install postgresql-libs postgresql-devel gcc-c++`
- **Arch Linux**: `sudo pacman -S postgresql-libs base-devel`

### Node.js Dependencies
```bash
npm install
```

This will install both `pg` (PostgreSQL driver) and `better-sqlite3` (SQLite driver for migration).

## Migration Steps

### 1. Set Up PostgreSQL

If you're using Docker Compose (recommended):

```bash
# Create .env file with your configuration
cp .env.example .env

# Edit .env and set your database credentials:
# - DB_HOST=postgres (or localhost if running outside Docker)
# - DB_PORT=5432
# - DB_USER=bm_user
# - DB_PASSWORD=your-secure-password
# - DB_NAME=bm_lastheard

# Start PostgreSQL service
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
docker-compose logs -f postgres
# Wait until you see "database system is ready to accept connections"
```

### 2. Initialize PostgreSQL Schema

The schema will be created automatically when you start the application for the first time, but you can also initialize it manually:

```bash
# If using Docker Compose
docker-compose up -d bm-lh-nextgen

# The application will create all necessary tables on startup
# Check logs to ensure initialization succeeded
docker-compose logs bm-lh-nextgen
```

Or if running locally:
```bash
node src/server.js
# Press Ctrl+C after seeing "Database initialized successfully"
```

### 3. Run the Migration Script

The migration script will copy data from your SQLite database to PostgreSQL without overwriting existing data.

```bash
# Set environment variables for the migration
export SQLITE_DB_PATH=./data/lastheard.db  # Path to your SQLite database
export DB_HOST=localhost  # Use 'localhost' if connecting from host machine
export DB_PORT=5432
export DB_USER=bm_user
export DB_PASSWORD=your-secure-password
export DB_NAME=bm_lastheard

# Run the migration script
node migrate-sqlite-to-postgres.js
```

**Note:** If using Docker Compose, you may need to use `localhost` and ensure the PostgreSQL port is exposed, or run the migration from within the container:

```bash
# Copy the migration script into the container
docker cp migrate-sqlite-to-postgres.js <container_id>:/app/

# Run migration inside the container
docker-compose exec bm-lh-nextgen node migrate-sqlite-to-postgres.js
```

### 4. Verify the Migration

After migration completes, verify your data:

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U bm_user -d bm_lastheard

# Check record counts
SELECT COUNT(*) as lastheard_count FROM lastheard;
SELECT COUNT(*) as talkgroups_count FROM talkgroups;
SELECT COUNT(*) as users_count FROM users;

# Exit psql
\q
```

### 5. Start the Application

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f bm-lh-nextgen
```

## Migration Script Details

The migration script (`migrate-sqlite-to-postgres.js`) does the following:

1. **Connects to both databases** - SQLite (read-only) and PostgreSQL
2. **Migrates data table by table** - In this order:
   - `lastheard` - DMR activity records
   - `talkgroups` - Talkgroup information
   - `users` - User accounts
   - `user_verifications` - Email verification records
   - `user_sessions` - Active user sessions
   - `password_reset_tokens` - Password reset tokens
   - `email_change_tokens` - Email change tokens
3. **Merges data without overwriting** - Checks for existing records by unique keys
4. **Updates sequences** - Ensures auto-increment IDs continue from the correct value
5. **Converts data types** - Translates SQLite booleans (0/1) to PostgreSQL booleans (true/false)

## Troubleshooting

### Connection Refused
If you get "connection refused" errors:
- Ensure PostgreSQL is running: `docker-compose ps`
- Check if port 5432 is exposed in docker-compose.yml
- Use correct host (`postgres` inside Docker, `localhost` outside)

### Permission Denied
If you get permission errors:
- Verify database credentials in .env file
- Ensure the PostgreSQL user has CREATE/INSERT permissions

### Module Not Found
If you get "Cannot find module" errors:
- Run `npm install` to install all dependencies
- Ensure both `pg` and `better-sqlite3` are installed

### Migration Fails Midway
The migration script is idempotent - you can safely run it multiple times. It will skip records that already exist in PostgreSQL.

## Rollback

If you need to rollback to SQLite:

1. Stop the application: `docker-compose down`
2. Update the application code to use SQLite (restore from git)
3. Your SQLite database file remains unchanged in `./data/lastheard.db`

## Data Backup

Before migration, it's recommended to backup your data:

```bash
# Backup SQLite database
cp ./data/lastheard.db ./data/lastheard.db.backup

# After migration, backup PostgreSQL
docker-compose exec postgres pg_dump -U bm_user bm_lastheard > backup.sql
```

## Support

For issues or questions:
- Check logs: `docker-compose logs bm-lh-nextgen`
- Review PostgreSQL logs: `docker-compose logs postgres`
- Open an issue on GitHub

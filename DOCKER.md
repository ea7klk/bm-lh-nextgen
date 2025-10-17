# Docker Deployment Guide

This document explains how to run the Brandmeister Lastheard Next Generation application using Docker.

## Quick Start

### Using Docker Compose (Recommended)

1. **Create environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - Web interface: http://localhost:3000
   - API documentation: http://localhost:3000/api-docs
   - Admin panel: http://localhost:3000/admin
   - Health check: http://localhost:3000/health

**How Environment Variables Work:**

Docker Compose automatically reads variables from the `.env` file in the same directory. The `docker-compose.yml` uses:
- `env_file: - .env` to load all variables into the container
- `environment:` section with `${VARIABLE}` syntax to allow host-level overrides

This means you can:
1. Set defaults in `.env` file (recommended for most cases)
2. Override specific values by exporting them in your shell before running `docker-compose up`
3. The container receives the variables and uses them in the application

### Using Docker directly

1. **Build the image:**
   ```bash
   docker build -t bm-lh-nextgen .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     --name bm-lh-nextgen \
     -p 3000:3000 \
     -v $(pwd)/data:/app/data \
     -e PORT=3000 \
     -e BASE_URL=http://localhost:3000 \
     -e ADMIN_PASSWORD=your-secure-password \
     bm-lh-nextgen
   ```

## Configuration Options

Docker Compose now properly reads environment variables from the `.env` file. There are three ways to configure the application:

### Option 1: Using .env File (Recommended)

Create a `.env` file in the same directory as `docker-compose.yml`:

```bash
cp .env.example .env
# Edit .env with your settings
```

Then simply run:
```bash
docker-compose up -d
```

Docker Compose will automatically:
1. Read variables from `.env` file
2. Pass them to the container via `env_file` directive
3. Allow overrides via the `environment` section

### Option 2: Shell Environment Variables

You can override specific variables by exporting them before running docker-compose:

```bash
export EMAIL_HOST=smtp.gmail.com
export EMAIL_USER=your-email@gmail.com
docker-compose up -d
```

These will override the values in `.env` file.

### Option 3: Direct Environment Variables in Docker Run

For manual Docker runs without Compose:

```bash
docker run -d \
  --name bm-lh-nextgen \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --env-file .env \
  bm-lh-nextgen
```

Or specify variables individually:

```bash
docker run -d \
  --name bm-lh-nextgen \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e PORT=3000 \
  -e BASE_URL=http://localhost:3000 \
  -e EMAIL_HOST=smtp.example.com \
  -e EMAIL_PORT=587 \
  -e EMAIL_USER=your-email@example.com \
  -e EMAIL_PASSWORD=your-password \
  -e EMAIL_FROM=noreply@example.com \
  -e ADMIN_PASSWORD=your-secure-password \
  bm-lh-nextgen
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3000 | No |
| `BASE_URL` | Base URL for the application | http://localhost:3000 | No |
| `EMAIL_HOST` | SMTP server hostname | - | For email features |
| `EMAIL_PORT` | SMTP server port | 587 | For email features |
| `EMAIL_USER` | SMTP username | - | For email features |
| `EMAIL_PASSWORD` | SMTP password | - | For email features |
| `EMAIL_FROM` | From email address | - | For email features |
| `EMAIL_SECURE` | Use SSL/TLS (true for port 465) | false | No |
| `EMAIL_REQUIRE_TLS` | Require STARTTLS | false | No |
| `ADMIN_PASSWORD` | Admin panel password | - | For admin access |

## Data Persistence

The application stores data in SQLite databases in the `/app/data` directory. To persist data between container restarts:

**With Docker Compose:**
```yaml
volumes:
  - ./data:/app/data
```

**With Docker run:**
```bash
-v $(pwd)/data:/app/data
```

## Health Check

The container includes a health check that tests the API endpoint. You can check the status:

```bash
docker ps
# Look for "healthy" status

# Or check health manually:
docker exec bm-lh-nextgen node -e "require('http').get('http://localhost:3000/public/lastheard/grouped?timeRange=5m&limit=1', (res) => { console.log('Status:', res.statusCode) })"
```

## Production Deployment

### Behind a Reverse Proxy

When running behind nginx or similar:

```bash
docker run -d \
  --name bm-lh-nextgen \
  -p 127.0.0.1:3000:3000 \
  -v $(pwd)/data:/app/data \
  -e BASE_URL=https://yourdomain.com \
  -e EMAIL_HOST=your-smtp-server \
  -e EMAIL_USER=your-email@yourdomain.com \
  -e EMAIL_PASSWORD=your-secure-password \
  -e EMAIL_FROM=noreply@yourdomain.com \
  -e ADMIN_PASSWORD=very-secure-admin-password \
  bm-lh-nextgen
```

### Using Docker Compose in Production

1. Create a production docker-compose.yml:
   ```yaml
   version: '3.8'
   services:
     bm-lh-nextgen:
       build: .
       ports:
         - "127.0.0.1:3000:3000"
       volumes:
         - ./data:/app/data
       environment:
         - BASE_URL=https://yourdomain.com
         - EMAIL_HOST=your-smtp-server
         - EMAIL_USER=your-email@yourdomain.com
         - EMAIL_PASSWORD=your-secure-password
         - EMAIL_FROM=noreply@yourdomain.com
         - ADMIN_PASSWORD=very-secure-admin-password
       restart: unless-stopped
   ```

2. Run in production:
   ```bash
   docker-compose up -d
   ```

## Logs

View application logs:
```bash
# Docker Compose
docker-compose logs -f bm-lh-nextgen

# Docker run
docker logs -f bm-lh-nextgen
```

## Troubleshooting

### Environment Variables Not Working

**Problem:** Environment variables from `.env` file don't seem to be passed to the container.

**Solution:**
1. Ensure `.env` file is in the same directory as `docker-compose.yml`
2. Check that `.env` file has proper formatting (no spaces around `=`)
   ```bash
   # Correct
   EMAIL_HOST=smtp.gmail.com
   
   # Incorrect
   EMAIL_HOST = smtp.gmail.com
   ```
3. Verify the `env_file` directive is present in `docker-compose.yml`:
   ```yaml
   env_file:
     - .env
   ```
4. Rebuild and restart the container:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```
5. Check environment variables inside the container:
   ```bash
   docker-compose exec bm-lh-nextgen env | grep EMAIL
   ```

### Container won't start
- Check logs: `docker-compose logs bm-lh-nextgen`
- Verify environment variables are set correctly
- Ensure data directory has proper permissions
- Check if port 3000 is already in use: `lsof -i :3000` or `netstat -an | grep 3000`

### Database issues
- Ensure data volume is properly mounted
- Check file permissions on the host data directory
- Verify SQLite database files aren't corrupted

### Email not working
- Verify EMAIL_* environment variables are correct
- Check SMTP server connectivity from container
- Review logs for email-related errors

## Security Notes

- Always set a strong `ADMIN_PASSWORD`
- Run the container as non-root user (handled automatically)
- Keep the container and base image updated
- Use environment variables instead of .env files in production
- Consider using Docker secrets for sensitive data in production
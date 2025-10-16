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

The application can be configured in two ways:

### Option 1: Environment Variables (Recommended for Docker)

Set environment variables directly in Docker:

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

### Option 2: Mount .env file

```bash
docker run -d \
  --name bm-lh-nextgen \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/.env:/app/.env:ro \
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

### Container won't start
- Check logs: `docker logs bm-lh-nextgen`
- Verify environment variables are set correctly
- Ensure data directory has proper permissions

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
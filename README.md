# bm-lh-nextgen
Brandmeister Lastheard Next Generation

A Node.js REST API with Swagger documentation for tracking Brandmeister DMR radio activity.

## Features

- **Modern Web Interface** - Clean, responsive homepage displaying real-time DMR activity
- **Real-time Updates** - Auto-refresh functionality to show latest activity
- **Public Access** - View lastheard data without API key requirement
- **Advanced Filtering** - Filter by callsign or talkgroup ID
- **Statistics Dashboard** - Quick overview of system activity
- RESTful API built with Express.js
- SQLite database for local data storage
- Interactive Swagger/OpenAPI documentation
- Endpoints for managing lastheard entries
- API key authentication with email verification
- Configurable email notifications
- **Styled email confirmation pages**
- **Professional HTML email templates**
- **API key expiration (365 days)**
- **Automated expiry reminders (30, 15, 5 days before expiry)**
- **Automatic cleanup of expired API keys**

## Prerequisites

- Node.js (v14 or higher)
- npm

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ea7klk/bm-lh-nextgen.git
cd bm-lh-nextgen
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (optional):
```bash
cp .env.example .env
# Edit .env with your email server configuration
```

## Environment Variables

The following environment variables can be configured:

- `PORT` - Server port (default: 3000)
- `BASE_URL` - Base URL for email links (default: http://localhost:3000)
- `EMAIL_HOST` - SMTP server hostname
- `EMAIL_PORT` - SMTP server port (default: 587)
- `EMAIL_USER` - SMTP username
- `EMAIL_PASSWORD` - SMTP password
- `EMAIL_FROM` - From email address (default: noreply@example.com)
- `ADMIN_PASSWORD` - Password for accessing the admin panel at `/admin`

## Running the Application

Start the server:
```bash
npm start
```

For development mode:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Using the Application

### Web Interface

The application provides a modern web interface for viewing real-time DMR activity:

1. **Homepage** - Navigate to `http://localhost:3000` to view the last heard activity
   - See recent DMR transmissions in real-time
   - View statistics (total entries, 24-hour activity, unique callsigns/talkgroups)
   - Filter by callsign or talkgroup ID
   - Auto-refresh every 30 seconds (toggleable)

The web interface is fully responsive and works on desktop, tablet, and mobile devices.

## API Authentication

The API uses API key authentication. To use the API endpoints:

1. **Request an API Key:**
   - Visit `http://localhost:3000/api/auth/request-key` in your browser
   - Fill in the form with your name and email
   - Check your email for a verification link

2. **Verify Your Email:**
   - Click the verification link in the email
   - You will receive your API key via email and on the verification page

3. **Use the API Key:**
   - Include the API key in the `X-API-Key` header with all API requests
   - Example:
   ```bash
   curl -H "X-API-Key: your-api-key-here" http://localhost:3000/api/lastheard
   ```

## API Key Expiration

API keys automatically expire after 365 days. The system provides:

- **Expiry Reminders:** Email notifications are sent 30, 15, and 5 days before expiration
- **Automatic Cleanup:** Expired keys are automatically deactivated by the scheduler
- **Grace Period:** Request a new key before expiration to avoid service interruption
- **Expiry Check:** The authentication middleware validates expiry on each request

The scheduler runs daily to:
1. Send expiry reminder emails to users
2. Deactivate API keys that have expired
3. Maintain system security by removing stale credentials

## Admin Panel

A password-protected admin panel is available at `/admin` for managing API keys and email verifications.

### Accessing the Admin Panel

1. Navigate to `http://localhost:3000/admin`
2. Enter the admin credentials (username can be anything, password is from `ADMIN_PASSWORD` in `.env`)
3. View and manage API keys and email verifications

### Admin Features

- **View API Keys**: See all API keys with their status, creation date, expiration, and last usage
- **Delete API Keys**: Remove API keys from the system
- **View Email Verifications**: See all email verification requests (both verified and pending)
- **Delete Verifications**: Clean up old or invalid verification records
- **Statistics Dashboard**: Quick overview of total, active, and inactive keys/verifications
- **Real-time Updates**: Refresh data to see the latest state

![Admin Panel](https://github.com/user-attachments/assets/550482a5-2908-4a67-b8f6-f1bb8327c147)

## API Documentation

Once the server is running, access the interactive Swagger documentation at:
```
http://localhost:3000/api-docs
```

## API Endpoints

### Frontend (Public Access - No Authentication Required)
- `GET /` - Homepage with real-time lastheard display

### Public API (No Authentication Required)
- `GET /public/lastheard` - Get recent lastheard entries (with optional filtering)
  - Query parameters: `limit`, `callsign`, `talkgroup`
  - Example: `/public/lastheard?callsign=EA7KLK&limit=10`
- `GET /public/stats` - Get statistics about lastheard data

### Authentication
- `GET /api/auth/request-key` - Display API key request form
- `POST /api/auth/request-key` - Submit API key request
- `GET /api/auth/verify-email?token=<token>` - Verify email and receive API key

### Admin (Requires Password Authentication)
- `GET /admin` - Admin panel interface
- `GET /admin/api-keys` - List all API keys
- `DELETE /admin/api-keys/:id` - Delete an API key
- `GET /admin/verifications` - List all email verifications
- `DELETE /admin/verifications/:id` - Delete an email verification

### Lastheard (Requires API Key)
- `GET /health` - Health check
- `GET /api/lastheard` - Get recent lastheard entries
- `GET /api/lastheard/:id` - Get specific entry by ID
- `GET /api/lastheard/callsign/:callsign` - Get entries by callsign
- `POST /api/lastheard` - Create new lastheard entry

## Database

The application uses SQLite for data storage. The database file is automatically created at `data/lastheard.db` on first run.

### Schema

The `lastheard` table includes:
- `id` - Unique identifier
- `SourceID` - Source DMR ID
- `DestinationID` - Destination ID (talkgroup)
- `SourceCall` - Source callsign
- `SourceName` - Source name
- `DestinationCall` - Destination callsign
- `DestinationName` - Destination name
- `Start` - Start timestamp (Unix)
- `Stop` - Stop timestamp (Unix)
- `TalkerAlias` - Talker alias
- `duration` - Duration in seconds
- `created_at` - Record creation timestamp

The `api_keys` table includes:
- `id` - Unique identifier
- `api_key` - API key (UUID)
- `name` - User's name
- `email` - User's email
- `is_active` - Active status
- `created_at` - Creation timestamp
- `expires_at` - Expiration timestamp (365 days from creation)
- `last_used_at` - Last usage timestamp (updated on each API request)

The `email_verifications` table includes:
- `id` - Unique identifier
- `email` - User's email
- `name` - User's name
- `verification_token` - Verification token (UUID)
- `is_verified` - Verification status
- `created_at` - Creation timestamp
- `expires_at` - Expiration timestamp

The `talkgroups` table includes:
- `id` - Unique identifier
- `talkgroup_id` - Talkgroup ID number
- `name` - Talkgroup name
- `country` - Country code (2-letter ISO code or "Global")
- `continent` - Full continent name (or "Global" for worldwide talkgroups)
- `full_country_name` - Full country name
- `last_updated` - Last update timestamp

**Note:** The talkgroups table is automatically populated and updated daily at 02:00 AM from the Brandmeister network talkgroups CSV data.

## Project Structure

```
bm-lh-nextgen/
├── src/
│   ├── config/
│   │   └── swagger.js       # Swagger configuration
│   ├── db/
│   │   └── database.js      # Database initialization
│   ├── middleware/
│   │   └── auth.js          # Authentication middleware
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   └── lastheard.js     # API routes
│   ├── services/
│   │   ├── emailService.js  # Email service
│   │   └── schedulerService.js  # Expiry scheduler
│   └── server.js            # Main server file
├── data/                    # SQLite database directory
├── .env.example             # Environment variables template
├── EMAIL_TEMPLATES.md       # Email templates documentation
├── package.json
└── README.md
```

## Docker Deployment

This application is fully containerized for easy deployment:

### Quick Start with Docker
```bash
# Build the image
docker build -t bm-lh-nextgen .

# Run with environment variables
docker run -p 3000:3000 \
  -e ADMIN_PASSWORD=your-secure-password \
  -e JWT_SECRET=your-secret-key \
  bm-lh-nextgen

# Or use docker-compose
docker-compose up -d
```

### Pre-built Images
Production-ready images are automatically built and published to GitHub Container Registry:

```bash
# Pull the latest version
docker pull ghcr.io/ea7klk/bm-lh-nextgen:latest

# Pull a specific version
docker pull ghcr.io/ea7klk/bm-lh-nextgen:v1.0.0
```

See [DOCKER.md](DOCKER.md) for comprehensive Docker documentation and [GITHUB_WORKFLOWS.md](GITHUB_WORKFLOWS.md) for CI/CD details.

## CI/CD Pipeline

This repository includes automated GitHub Actions workflows:

### 🏗️ **Continuous Integration**
- Runs on every push and pull request
- Node.js testing and linting
- Docker build validation
- Security vulnerability scanning
- Container health checks

### 🚀 **Automated Releases**
- Triggered by version tags (e.g., `v1.0.0`)
- Multi-architecture builds (AMD64, ARM64)
- Automatic publishing to GitHub Container Registry
- Security scanning and SARIF reporting
- Build summaries and pull commands

### 📋 **Workflow Status**
![CI](https://github.com/ea7klk/bm-lh-nextgen/workflows/CI/badge.svg)
![Docker Build](https://github.com/ea7klk/bm-lh-nextgen/workflows/Docker%20Build%20and%20Push/badge.svg)

### 🔄 **Creating a Release**
```bash
# Tag a new version
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# GitHub Actions will automatically:
# - Build multi-arch Docker images
# - Run security scans
# - Publish to container registry
# - Generate release artifacts
```

## License

MIT License - See LICENSE file for details

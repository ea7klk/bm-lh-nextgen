# bm-lh-nextgen
**Brandmeister Lastheard Next Generation**

A production-ready Node.js REST API with real-time web interface for tracking Brandmeister DMR radio activity. Features comprehensive Docker support, automated CI/CD, and professional email notifications.

## ✨ Key Features

### Web Interface
- **Modern Responsive UI** - Real-time DMR activity display
- **Auto-refresh** - Live updates every 30 seconds (toggleable)
- **Public Access** - No authentication required for viewing
- **Advanced Filtering** - Filter by callsign or talkgroup ID
- **Statistics Dashboard** - Total entries, 24h activity, unique callsigns/talkgroups

### API & Backend
- **RESTful API** - Built with Express.js and comprehensive Swagger documentation
- **SQLite Database** - Local data storage with efficient querying
- **User Authentication** - Secure registration and login system
- **Smart Filtering** - Automatic exclusion of Local talkgroup (ID 9)

### DevOps & Security
- **Docker Ready** - Multi-stage builds, health checks, non-root execution
- **CI/CD Pipeline** - Automated testing, building, and deployment via GitHub Actions
- **Multi-Architecture** - AMD64 and ARM64 support
- **Security Scanning** - Trivy and Anchore vulnerability detection
- **Container Registry** - Automatic publishing to GitHub Container Registry

## 🚀 Quick Start

### Using Docker (Recommended)

The fastest way to get started:

```bash
# Clone the repository
git clone https://github.com/ea7klk/bm-lh-nextgen.git
cd bm-lh-nextgen

# Configure environment variables
cp .env.example .env
# Edit .env with your settings

# Start with Docker Compose
docker-compose up -d
```

Access the application:
- **Web Interface**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs
- **Admin Panel**: http://localhost:3000/admin
- **Health Check**: http://localhost:3000/health

### Using Pre-built Images

```bash
# Pull from GitHub Container Registry
docker pull ghcr.io/ea7klk/bm-lh-nextgen:latest

# Run with environment variables
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --env-file .env \
  ghcr.io/ea7klk/bm-lh-nextgen:latest
```

### Manual Installation

**Prerequisites:**
- Node.js v20 or higher
- npm

```bash
# Clone and install dependencies
git clone https://github.com/ea7klk/bm-lh-nextgen.git
cd bm-lh-nextgen
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start the server
npm start
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file from the provided template:

```bash
cp .env.example .env
```

**Essential Variables:**

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3000 | No |
| `BASE_URL` | Base URL for email links | http://localhost:3000 | Yes for email |
| `DB_HOST` | PostgreSQL host | postgres | **Yes** |
| `DB_PORT` | PostgreSQL port | 5432 | No |
| `DB_USER` | PostgreSQL user | bm_user | **Yes** |
| `DB_PASSWORD` | PostgreSQL password | - | **Yes** |
| `DB_NAME` | PostgreSQL database name | bm_lastheard | **Yes** |
| `ADMIN_PASSWORD` | Admin panel password | - | **Yes** |
| `EMAIL_HOST` | SMTP server hostname | - | For email features |
| `EMAIL_PORT` | SMTP server port | 587 | For email features |
| `EMAIL_USER` | SMTP username | - | For email features |
| `EMAIL_PASSWORD` | SMTP password/app password | - | For email features |
| `EMAIL_FROM` | From email address | - | For email features |
| `EMAIL_SECURE` | Use SSL/TLS (true for port 465) | false | No |
| `EMAIL_REQUIRE_TLS` | Require STARTTLS | false | No |

**Email Provider Examples:**

<details>
<summary><b>Gmail Configuration</b></summary>

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM=your-email@gmail.com
```

*Note: Requires [App Password](https://support.google.com/accounts/answer/185833) with 2FA enabled*
</details>

<details>
<summary><b>Outlook/Hotmail Configuration</b></summary>

```bash
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=your-email@outlook.com
```
</details>

See [EMAIL_SETUP.md](EMAIL_SETUP.md) for detailed email configuration guide.

## 📱 Using the Application

### Web Interface

Visit `http://localhost:3000` to access the modern web interface:

- **Real-time Activity**: View recent DMR transmissions as they happen
- **Live Statistics**: Total entries, 24-hour activity, unique callsigns/talkgroups
- **Filtering**: Search by callsign or talkgroup ID
- **Auto-refresh**: Updates every 30 seconds (can be toggled on/off)
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### API Access

#### Public Endpoints (No Authentication Required)

All data endpoints are publicly accessible without authentication:

- `GET /public/lastheard` - Recent lastheard entries (with filtering)
- `GET /public/lastheard/grouped` - Grouped data by talkgroup
- `GET /public/lastheard/callsigns` - Grouped data by callsign
- `GET /public/stats` - System statistics
- `GET /public/continents` - List of continents
- `GET /public/countries?continent=<continent>` - Countries for a continent
- `GET /public/talkgroups?continent=<continent>&country=<country>` - Talkgroups

**Example:**
```bash
curl http://localhost:3000/public/lastheard?callsign=EA7KLK&limit=10
```

### Admin Panel

Access the password-protected admin panel at `/admin` to manage users.

**Features:**
- View all registered users with status and activity
- Activate/deactivate users
- Delete user accounts
- Real-time statistics dashboard

**Access:**
1. Navigate to `http://localhost:3000/admin`
2. Username: (anything)
3. Password: Value of `ADMIN_PASSWORD` from `.env`

### API Documentation

Interactive Swagger/OpenAPI documentation is available at:
```
http://localhost:3000/api-docs
```

Test endpoints directly from your browser with the interactive interface.

## 🔌 API Endpoints

### Frontend (Public - No Authentication)
- `GET /` - Homepage with real-time lastheard display
- `GET /advanced` - Advanced functions page (requires user authentication)

### Public API (No Authentication)
The following endpoints are publicly accessible without authentication:

**Lastheard Endpoints:**
- `GET /public/lastheard` - Recent lastheard entries with optional filtering
  - Query params: `limit`, `callsign`, `talkgroup`
- `GET /public/lastheard/grouped` - Grouped lastheard data by talkgroup
  - Query params: `timeRange`, `limit`, `continent`, `country`, `talkgroup`
- `GET /public/lastheard/callsigns` - Grouped lastheard data by callsign
  - Query params: `timeRange`, `limit`, `callsign`, `continent`, `country`, `talkgroup`
- `GET /public/stats` - System statistics (total entries, 24h activity, unique callsigns/talkgroups)

**Talkgroup Endpoints:**
- `GET /public/continents` - List all unique continents
- `GET /public/countries?continent=<continent>` - List countries for a continent
- `GET /public/talkgroups?continent=<continent>&country=<country>` - List talkgroups for a continent/country

### MCP (Model Context Protocol) Endpoint — No Authentication

The server exposes an [Anthropic MCP](https://modelcontextprotocol.io/) server over Server-Sent Events (SSE):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mcp` | `GET` | Open SSE stream; server sends an `endpoint` event with the POST URL |
| `/api/mcp/messages?sessionId=<id>` | `POST` | Send JSON-RPC 2.0 MCP messages |

#### Available MCP Tools

| Tool | Description |
|------|-------------|
| `get_statistics` | Overall summary counts (total entries, last-24h, unique callsigns/talkgroups) |
| `get_top_talkgroups` | Top-N talkgroups by transmission count in a configurable time window |
| `get_top_callsigns` | Top-N callsigns (operators) by transmission count in a configurable time window |
| `get_recent_lastheard` | Most recent lastheard entries with optional callsign/talkgroup filtering |

#### Testing the MCP endpoint locally

**Smoke test** (requires the server to be running):

```bash
node test-mcp.js
# or against a remote host:
node test-mcp.js http://my-server:3000
```

**curl — establish the SSE stream and see the endpoint URL:**

```bash
curl -N -H "Accept: text/event-stream" http://localhost:3000/api/mcp
# Expected output (example):
#   event: endpoint
#   data: /api/mcp/messages?sessionId=<uuid>
```

**curl — send a `tools/list` request** (replace `<sessionId>` with the value above):

```bash
# Step 1 – initialize
curl -s -X POST \
  "http://localhost:3000/api/mcp/messages?sessionId=<sessionId>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"curl-test","version":"1.0.0"},"capabilities":{}}}'

# Step 2 – send initialized notification
curl -s -X POST \
  "http://localhost:3000/api/mcp/messages?sessionId=<sessionId>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}'

# Step 3 – list tools
curl -s -X POST \
  "http://localhost:3000/api/mcp/messages?sessionId=<sessionId>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

The responses arrive as SSE `message` events on the open stream from Step 1.

**Example — call `get_statistics`:**

```bash
curl -s -X POST \
  "http://localhost:3000/api/mcp/messages?sessionId=<sessionId>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_statistics","arguments":{}}}'
```

**Example — call `get_top_callsigns` for the last 24 hours:**

```bash
curl -s -X POST \
  "http://localhost:3000/api/mcp/messages?sessionId=<sessionId>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"get_top_callsigns","arguments":{"timeRange":"24h","limit":10}}}'
```

### System Endpoints
- `GET /health` - Health check endpoint (always available)

### Authentication & User Management
- `GET /user/register` - User registration form
- `POST /user/register` - Submit user registration
- `GET /user/login` - User login form
- `POST /user/login` - Submit user login
- `POST /user/logout` - User logout
- `GET /user/profile` - User profile page (requires authentication)
- `POST /user/change-password` - Change user password (requires authentication)
- `POST /user/change-email` - Change user email (requires authentication)

### Admin (Password Protected)
- `GET /admin` - Admin panel interface
- `GET /admin/users` - List all users
- `PUT /admin/users/:id/status` - Update user status
- `DELETE /admin/users/:id` - Delete a user

## 💾 Database

PostgreSQL database with automatic schema initialization on first run. Database data is persisted in `./db` directory.

**Database Configuration:**
- PostgreSQL 16 (Alpine)
- Connection pooling with `pg` driver
- Automatic schema migrations
- Data persistence via Docker volume

**Migration from SQLite:** If upgrading from an older version using SQLite, see [MIGRATION.md](MIGRATION.md) for migration instructions.

### Main Tables

**lastheard** - DMR activity records
- `id`, `SourceID`, `DestinationID`, `SourceCall`, `SourceName`
- `DestinationCall`, `DestinationName`, `Start`, `Stop`
- `TalkerAlias`, `duration`, `created_at`

**talkgroups** - Talkgroup information
- `id`, `talkgroup_id`, `name`, `country`, `continent`
- `full_country_name`, `last_updated`
- Auto-updated daily at 02:00 AM from Brandmeister API data
- **Note:** Local talkgroup (ID 9) is automatically filtered from all queries

**users** - User accounts
- `id`, `callsign`, `name`, `email`, `password_hash`
- `is_active`, `created_at`, `last_login_at`, `locale`

## 📁 Project Structure

```
bm-lh-nextgen/
├── src/
│   ├── config/
│   │   ├── swagger.js           # Swagger/OpenAPI configuration
│   │   └── i18n.js              # Internationalization setup
│   ├── db/
│   │   └── database.js          # Database initialization and schema
│   ├── middleware/
│   │   ├── auth.js              # API key authentication
│   │   ├── adminAuth.js         # Admin authentication
│   │   ├── userAuth.js          # User authentication
│   │   └── language.js          # Language detection
│   ├── routes/
│   │   ├── auth.js              # API key authentication routes
│   │   ├── user.js              # User registration and login routes
│   │   ├── admin.js             # Admin panel routes
│   │   ├── frontend.js          # Public frontend routes
│   │   ├── advanced.js          # Advanced functions routes (authenticated)
│   │   ├── public.js            # Public API routes (no auth required)
│   │   ├── lastheard.js         # Reserved for future authenticated endpoints
│   │   ├── talkgroups.js        # Reserved for future authenticated endpoints
│   │   └── mcp.js               # MCP SSE endpoint (no auth)
│   ├── services/
│   │   ├── databaseService.js   # Database access layer (new)
│   │   ├── emailService.js      # Email sending service
│   │   ├── schedulerService.js  # Expiry scheduler
│   │   ├── brandmeisterService.js # Real-time data ingestion
│   │   └── talkgroupsService.js # Talkgroup data management
│   ├── utils/
│   │   └── htmlHelpers.js       # HTML utility functions
│   └── server.js                # Main application entry point
├── locales/                     # Translation files (en, es, de, fr)
├── data/                        # SQLite database directory
├── .github/workflows/           # CI/CD workflows
├── Dockerfile                   # Multi-stage container build
├── docker-compose.yml           # Container orchestration
├── .env.example                 # Environment variables template
└── package.json                 # Dependencies and scripts
```

## 🏗️ Code Architecture

The application follows best practices for separation of concerns and modularity:

### Service Layer (`src/services/`)
- **databaseService.js** - Centralized data access layer that abstracts database operations
  - `LastheardService` - Methods for querying lastheard data
  - `TalkgroupService` - Methods for querying talkgroup data
  - Benefits: Reusable queries, easier testing, consistent error handling

### Presentation Layer (`src/routes/`)
- Routes handle HTTP requests and responses
- Business logic is delegated to service layer
- Clean separation between data access and presentation

### Database Layer (`src/db/`)
- Database initialization and schema management
- Automatic migrations for schema updates
- Connection pooling with better-sqlite3

### Key Design Improvements
1. **Separation of Concerns**: Database access is isolated in the service layer
2. **Code Reusability**: Common queries are centralized and reusable
3. **Maintainability**: Changes to database queries are isolated to one location
4. **Testability**: Service layer can be tested independently of routes

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Using Pre-built Images

Production-ready images are automatically built and published:

```bash
# Pull latest version
docker pull ghcr.io/ea7klk/bm-lh-nextgen:latest

# Pull specific version
docker pull ghcr.io/ea7klk/bm-lh-nextgen:v1.0.0

# Run with environment file
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --env-file .env \
  ghcr.io/ea7klk/bm-lh-nextgen:latest
```

### Manual Docker Build

```bash
# Build image
docker build -t bm-lh-nextgen .

# Note: When running standalone, you need a PostgreSQL database
# It's recommended to use docker-compose instead for automatic setup

# If you have an existing PostgreSQL instance:
docker run -d \
  --name bm-lh-nextgen \
  -p 3000:3000 \
  -e DB_HOST=your-postgres-host \
  -e DB_PORT=5432 \
  -e DB_USER=bm_user \
  -e DB_PASSWORD=your-db-password \
  -e DB_NAME=bm_lastheard \
  -e ADMIN_PASSWORD=your-secure-password \
  -e EMAIL_HOST=smtp.gmail.com \
  -e EMAIL_USER=your-email@gmail.com \
  -e EMAIL_PASSWORD=your-app-password \
  -e EMAIL_FROM=your-email@gmail.com \
  bm-lh-nextgen
```

### Docker Features

- ✅ **Multi-stage build** - Optimized image size
- ✅ **Non-root user** - Enhanced security (UID 1001)
- ✅ **Health checks** - Automatic monitoring
- ✅ **PostgreSQL integration** - Managed database service
- ✅ **Data persistence** - Volume mounting for PostgreSQL data
- ✅ **Multi-architecture** - AMD64 and ARM64 support

**Important:** When using docker-compose, ensure your `.env` file is in the same directory as `docker-compose.yml`. Docker Compose will automatically load variables from `.env` and pass them to the container.

See [DOCKER.md](DOCKER.md) for comprehensive Docker documentation.

## 🔄 CI/CD Pipeline

Automated GitHub Actions workflows for continuous integration and deployment.

### Continuous Integration
**Triggers:** Push to `main`/`develop`, Pull Requests

**Actions:**
- ✅ Node.js 20 testing
- ✅ Dependency installation and caching
- ✅ Docker build validation
- ✅ Container health checks
- ✅ Trivy security scanning (PRs only)

### Automated Releases
**Triggers:** Version tags (e.g., `v1.0.0`), Manual dispatch

**Actions:**
- ✅ Multi-architecture builds (AMD64, ARM64)
- ✅ GitHub Container Registry publishing
- ✅ Anchore security scanning
- ✅ SARIF security reporting
- ✅ Automated tagging (latest, version, major.minor)

### Workflow Status
![CI](https://github.com/ea7klk/bm-lh-nextgen/workflows/CI/badge.svg)
![Docker Build](https://github.com/ea7klk/bm-lh-nextgen/workflows/Docker%20Build%20and%20Push/badge.svg)

### Creating a Release

```bash
# Tag and push a new version
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# GitHub Actions automatically:
# - Builds multi-arch Docker images
# - Runs security scans
# - Publishes to ghcr.io/ea7klk/bm-lh-nextgen
# - Tags with version and latest
```

See [GITHUB_WORKFLOWS.md](GITHUB_WORKFLOWS.md) for detailed CI/CD documentation.

## 📚 Documentation

- **[HISTORY.md](HISTORY.md)** - Complete project development history
- **[DOCKER.md](DOCKER.md)** - Comprehensive Docker deployment guide
- **[EMAIL_SETUP.md](EMAIL_SETUP.md)** - Email configuration for different providers
- **[GITHUB_WORKFLOWS.md](GITHUB_WORKFLOWS.md)** - CI/CD pipeline documentation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

---

**Maintainer:** EA7KLK  
**Repository:** [github.com/ea7klk/bm-lh-nextgen](https://github.com/ea7klk/bm-lh-nextgen)

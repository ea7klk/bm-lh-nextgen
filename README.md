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
- **API Key Authentication** - Email verification with 365-day expiration
- **Professional Email System** - Styled HTML templates for verification and notifications
- **Automated Reminders** - Expiry notifications at 30, 15, and 5 days
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

All data endpoints are now publicly accessible without authentication:

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

#### API Key System (Reserved for Future Use)

The API key authentication system is available for future authenticated features:

1. **Request Key**: Visit `http://localhost:3000/api/auth/request-key`
2. **Check Email**: Click the verification link sent to your email
3. **Receive Key**: Your API key will be displayed and emailed to you
4. **Future Use**: API keys will be used for authenticated features when they are added

**API Key Features:**
- 365-day validity period
- Automatic expiry reminders (30, 15, 5 days before)
- Automatic cleanup of expired keys
- Last usage tracking
- Ready for future authenticated endpoints

### Admin Panel

Access the password-protected admin panel at `/admin` to manage API keys and verifications.

**Features:**
- View all API keys with status, dates, and usage
- Delete API keys
- View email verifications (verified and pending)
- Delete old verification records
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

### System Endpoints
- `GET /health` - Health check endpoint (always available)

### Authentication & User Management
- `GET /api/auth/request-key` - API key request form
- `POST /api/auth/request-key` - Submit API key request
- `GET /api/auth/verify-email?token=<token>` - Verify email and receive key
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
- `GET /admin/api-keys` - List all API keys
- `DELETE /admin/api-keys/:id` - Delete an API key
- `GET /admin/users` - List all users
- `PUT /admin/users/:id/status` - Update user status
- `DELETE /admin/users/:id` - Delete a user
- `GET /admin/verifications` - List all email verifications
- `DELETE /admin/verifications/:id` - Delete a verification

## 💾 Database

SQLite database automatically created at `data/lastheard.db` on first run.

### Main Tables

**lastheard** - DMR activity records
- `id`, `SourceID`, `DestinationID`, `SourceCall`, `SourceName`
- `DestinationCall`, `DestinationName`, `Start`, `Stop`
- `TalkerAlias`, `duration`, `created_at`

**api_keys** - API authentication
- `id`, `api_key` (UUID), `name`, `email`, `is_active`
- `created_at`, `expires_at` (365 days), `last_used_at`

**email_verifications** - Email verification tracking
- `id`, `email`, `name`, `verification_token` (UUID)
- `is_verified`, `created_at`, `expires_at`

**talkgroups** - Talkgroup information
- `id`, `talkgroup_id`, `name`, `country`, `continent`
- `full_country_name`, `last_updated`
- Auto-updated daily at 02:00 AM from Brandmeister CSV data
- **Note:** Local talkgroup (ID 9) is automatically filtered from all queries

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
│   │   └── talkgroups.js        # Reserved for future authenticated endpoints
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

# Run container
docker run -d \
  --name bm-lh-nextgen \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
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
- ✅ **Data persistence** - Volume mounting for database
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

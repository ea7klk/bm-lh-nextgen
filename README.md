# bm-lh-nextgen
Brandmeister Lastheard Next Generation

A Node.js REST API with Swagger documentation for tracking Brandmeister DMR radio activity.

## Features

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

## API Documentation

Once the server is running, access the interactive Swagger documentation at:
```
http://localhost:3000/api-docs
```

## API Endpoints

### Authentication
- `GET /api/auth/request-key` - Display API key request form
- `POST /api/auth/request-key` - Submit API key request
- `GET /api/auth/verify-email?token=<token>` - Verify email and receive API key

### Lastheard (Requires API Key)
- `GET /` - API information
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

## License

MIT License - See LICENSE file for details

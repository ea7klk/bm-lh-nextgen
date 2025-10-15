# bm-lh-nextgen
Brandmeister Lastheard Next Generation

A Node.js REST API with Swagger documentation for tracking Brandmeister DMR radio activity.

## Features

- RESTful API built with Express.js
- SQLite database for local data storage
- Interactive Swagger/OpenAPI documentation
- Endpoints for managing lastheard entries

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

## API Documentation

Once the server is running, access the interactive Swagger documentation at:
```
http://localhost:3000/api-docs
```

## API Endpoints

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
- `callsign` - Amateur radio callsign
- `dmr_id` - DMR ID
- `timestamp` - Unix timestamp
- `talkgroup` - Talkgroup number
- `timeslot` - Timeslot (1 or 2)
- `duration` - Duration in seconds
- `reflector` - Reflector name
- `created_at` - Record creation timestamp

## Project Structure

```
bm-lh-nextgen/
├── src/
│   ├── config/
│   │   └── swagger.js       # Swagger configuration
│   ├── db/
│   │   └── database.js      # Database initialization
│   ├── routes/
│   │   └── lastheard.js     # API routes
│   └── server.js            # Main server file
├── data/                    # SQLite database directory
├── package.json
└── README.md
```

## License

MIT License - See LICENSE file for details

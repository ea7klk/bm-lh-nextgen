/**
 * MCP (Model Context Protocol) SSE Route
 *
 * Exposes an Anthropic MCP server over Server-Sent Events at:
 *   GET  /api/mcp           – establish SSE stream
 *   POST /api/mcp/messages  – receive JSON-RPC messages from the client
 *
 * No authentication is required for this endpoint.
 *
 * Available tools:
 *   - get_statistics       : Summary counts for the whole dataset
 *   - get_top_talkgroups   : Top-N talkgroups by activity in a time window
 *   - get_top_callsigns    : Top-N callsigns by activity in a time window
 *   - get_recent_lastheard : Recent lastheard entries with optional filters
 */

const express = require('express');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const { z } = require('zod');
const { LastheardService } = require('../services/databaseService');

const router = express.Router();

// Map of active SSE transports keyed by sessionId.
// Note: this is in-memory state; it is scoped to a single server process and
// will not survive a restart or work across horizontally-scaled instances.
const activeTransports = {};

// Periodically purge sessions whose SSE response has already been closed
// (guards against network failures where the 'close' event was not fired).
setInterval(() => {
  for (const [id, transport] of Object.entries(activeTransports)) {
    if (transport.res && transport.res.writableEnded) {
      delete activeTransports[id];
    }
  }
}, 60 * 1000);

// ---------------------------------------------------------------------------
// Time-range helper (matches the convention used in public.js)
// ---------------------------------------------------------------------------
const TIME_MAP = {
  '5m':  5 * 60,
  '15m': 15 * 60,
  '30m': 30 * 60,
  '1h':  60 * 60,
  '2h':  2 * 60 * 60,
  '6h':  6 * 60 * 60,
  '12h': 12 * 60 * 60,
  '24h': 24 * 60 * 60,
  '2d':  2 * 24 * 60 * 60,
  '5d':  5 * 24 * 60 * 60,
  '1w':  7 * 24 * 60 * 60,
  '2w':  14 * 24 * 60 * 60,
  '1M':  30 * 24 * 60 * 60
};

function resolveStartTime(timeRange) {
  const now = Math.floor(Date.now() / 1000);
  return now - (TIME_MAP[timeRange] || TIME_MAP['1h']);
}

// ---------------------------------------------------------------------------
// Build a new McpServer with all tools registered.
// A fresh instance is created per SSE connection so that each client has its
// own independent server context.
// ---------------------------------------------------------------------------
function createMcpServer() {
  const server = new McpServer({
    name: 'bm-lh-nextgen',
    version: '1.0.0'
  });

  // ------------------------------------------------------------------
  // Tool: get_statistics
  // ------------------------------------------------------------------
  server.tool(
    'get_statistics',
    'Get overall statistics for the Brandmeister lastheard dataset: total entry count, entries in the last 24 hours, number of unique callsigns, and number of unique talkgroups.',
    {},
    async () => {
      const stats = await LastheardService.getStatistics();
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(stats, null, 2)
        }]
      };
    }
  );

  // ------------------------------------------------------------------
  // Tool: get_top_talkgroups
  // ------------------------------------------------------------------
  server.tool(
    'get_top_talkgroups',
    'Get the top-N most active talkgroups in a given time window. Returns destination ID, name, transmission count, and total duration in seconds.',
    {
      timeRange: z.enum(['5m', '15m', '30m', '1h', '2h', '6h', '12h', '24h', '2d', '5d', '1w', '2w', '1M'])
        .default('1h')
        .describe('Time window for aggregation (e.g. "1h" = last hour, "24h" = last 24 hours).'),
      limit: z.number().int().min(1).max(50).default(10)
        .describe('Maximum number of talkgroups to return (1–50).'),
      continent: z.string().optional()
        .describe('Optional continent name filter (e.g. "Europe").'),
      country: z.string().optional()
        .describe('Optional 2-letter country code filter (e.g. "ES").')
    },
    async ({ timeRange, limit, continent, country }) => {
      const startTime = resolveStartTime(timeRange);
      const rows = await LastheardService.getGroupedByTalkgroup({
        startTime,
        limit,
        continent: continent || null,
        country: country || null
      });
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(rows, null, 2)
        }]
      };
    }
  );

  // ------------------------------------------------------------------
  // Tool: get_top_callsigns
  // ------------------------------------------------------------------
  server.tool(
    'get_top_callsigns',
    'Get the top-N most active callsigns (amateur radio operators) in a given time window. Returns callsign, operator name, transmission count, and total duration in seconds.',
    {
      timeRange: z.enum(['5m', '15m', '30m', '1h', '2h', '6h', '12h', '24h', '2d', '5d', '1w', '2w', '1M'])
        .default('1h')
        .describe('Time window for aggregation.'),
      limit: z.number().int().min(1).max(50).default(10)
        .describe('Maximum number of callsigns to return (1–50).'),
      callsign: z.string().optional()
        .describe('Optional callsign filter (SQL LIKE patterns with % are supported, e.g. "EA7%").'),
      continent: z.string().optional()
        .describe('Optional continent name filter.'),
      country: z.string().optional()
        .describe('Optional 2-letter country code filter.'),
      talkgroup: z.number().int().optional()
        .describe('Optional talkgroup ID filter.')
    },
    async ({ timeRange, limit, callsign, continent, country, talkgroup }) => {
      const startTime = resolveStartTime(timeRange);
      const rows = await LastheardService.getGroupedByCallsign({
        startTime,
        limit,
        callsign: callsign || null,
        continent: continent || null,
        country: country || null,
        talkgroup: talkgroup || null
      });
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(rows, null, 2)
        }]
      };
    }
  );

  // ------------------------------------------------------------------
  // Tool: get_recent_lastheard
  // ------------------------------------------------------------------
  server.tool(
    'get_recent_lastheard',
    'Get the most recent lastheard entries. Each entry includes callsign, operator name, destination talkgroup ID/name, start time, and duration in seconds. Supports optional filtering by callsign or talkgroup ID.',
    {
      limit: z.number().int().min(1).max(100).default(25)
        .describe('Number of entries to return (1–100).'),
      callsign: z.string().optional()
        .describe('Optional callsign substring filter.'),
      talkgroup: z.number().int().optional()
        .describe('Optional talkgroup ID filter.')
    },
    async ({ limit, callsign, talkgroup }) => {
      const rows = await LastheardService.getEntries({
        limit,
        callsign: callsign || null,
        talkgroup: talkgroup || null
      });
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(rows, null, 2)
        }]
      };
    }
  );

  return server;
}

// ---------------------------------------------------------------------------
// GET /api/mcp  – SSE stream establishment
// ---------------------------------------------------------------------------
router.get('/mcp', async (req, res) => {
  const transport = new SSEServerTransport('/api/mcp/messages', res);
  activeTransports[transport.sessionId] = transport;

  res.on('close', () => {
    delete activeTransports[transport.sessionId];
  });

  const mcpServer = createMcpServer();
  await mcpServer.connect(transport);
});

// ---------------------------------------------------------------------------
// POST /api/mcp/messages  – receive JSON-RPC messages
// ---------------------------------------------------------------------------
router.post('/mcp/messages', async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = activeTransports[sessionId];

  if (!transport) {
    res.status(404).json({ error: 'MCP session not found. Please reconnect via GET /api/mcp.' });
    return;
  }

  await transport.handlePostMessage(req, res);
});

module.exports = router;

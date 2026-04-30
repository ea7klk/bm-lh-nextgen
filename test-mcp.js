#!/usr/bin/env node
/**
 * test-mcp.js – Smoke test for the MCP SSE endpoint
 *
 * Usage:
 *   node test-mcp.js [base-url]
 *
 * Default base URL: http://localhost:3000
 *
 * What this test does:
 *   1. Opens an SSE connection to GET /api/mcp
 *   2. Waits for the MCP "endpoint" event that contains the POST URL
 *   3. Sends an MCP initialize request
 *   4. Waits for the initialized response
 *   5. Sends a tools/list request
 *   6. Verifies that all expected tools are present
 *   7. Exits 0 on success, 1 on failure
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const TIMEOUT_MS = 10000;
const parsed = new URL(BASE_URL);
const agent = parsed.protocol === 'https:' ? https : http;

let exitCode = 0;

function log(msg) { console.log(`[test-mcp] ${msg}`); }
function fail(msg) { console.error(`[test-mcp] FAIL: ${msg}`); exitCode = 1; }

const EXPECTED_TOOLS = [
  'get_statistics',
  'get_top_talkgroups',
  'get_top_callsigns',
  'get_recent_lastheard'
];

async function postMessage(postUrl, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const url = new URL(postUrl, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = agent.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  log(`Connecting to SSE stream: ${BASE_URL}/api/mcp`);

  await new Promise((resolve) => {
    const url = new URL('/api/mcp', BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      headers: { Accept: 'text/event-stream' }
    };

    const req = agent.request(options, async (res) => {
      if (res.statusCode !== 200) {
        fail(`SSE connect returned HTTP ${res.statusCode}`);
        req.destroy();
        resolve();
        return;
      }
      log(`SSE connection established (HTTP ${res.statusCode})`);

      let buffer = '';
      let postUrl = null;

      res.setEncoding('utf8');
      res.on('data', async (chunk) => {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (line.startsWith('event: endpoint')) continue;
          if (line.startsWith('data: ') && postUrl === null) {
            postUrl = line.slice(6).trim();
            log(`Received endpoint URL: ${postUrl}`);

            // Step 1: initialize
            const initPayload = {
              jsonrpc: '2.0',
              id: 1,
              method: 'initialize',
              params: {
                protocolVersion: '2024-11-05',
                clientInfo: { name: 'test-mcp', version: '1.0.0' },
                capabilities: {}
              }
            };
            const initResp = await postMessage(postUrl, initPayload);
            if (initResp.status !== 200) {
              fail(`initialize returned HTTP ${initResp.status}: ${initResp.body}`);
              req.destroy();
              resolve();
              return;
            }
            log(`initialize OK (HTTP ${initResp.status})`);

            // Step 2: initialized notification
            const notifPayload = {
              jsonrpc: '2.0',
              method: 'notifications/initialized',
              params: {}
            };
            await postMessage(postUrl, notifPayload);

            // Step 3: tools/list
            const listPayload = {
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/list',
              params: {}
            };
            const listResp = await postMessage(postUrl, listPayload);
            if (listResp.status !== 200) {
              fail(`tools/list returned HTTP ${listResp.status}: ${listResp.body}`);
              req.destroy();
              resolve();
              return;
            }
            log(`tools/list OK (HTTP ${listResp.status})`);
          }

          // Look for the tools/list response coming back over SSE
          if (line.startsWith('data: ') && postUrl !== null) {
            let parsed;
            try { parsed = JSON.parse(line.slice(6)); } catch (_) { continue; }

            if (parsed.id === 2 && parsed.result && parsed.result.tools) {
              const names = parsed.result.tools.map(t => t.name);
              log(`Tools returned: ${names.join(', ')}`);
              for (const expected of EXPECTED_TOOLS) {
                if (names.includes(expected)) {
                  log(`  ✓ ${expected}`);
                } else {
                  fail(`  ✗ ${expected} missing from tools list`);
                }
              }
              req.destroy();
              resolve();
            }
          }
        }
      });

      res.on('end', () => {
        if (postUrl === null) fail('SSE stream ended before endpoint event was received');
        resolve();
      });
    });

    req.on('error', (err) => {
      fail(`SSE connection error: ${err.message}`);
      resolve();
    });

    req.setTimeout(TIMEOUT_MS, () => {
      fail('Timeout waiting for MCP response');
      req.destroy();
      resolve();
    });

    req.end();
  });

  if (exitCode === 0) {
    log('All checks passed ✅');
  } else {
    log('Some checks failed ❌');
  }
  process.exit(exitCode);
}

run().catch((err) => {
  fail(`Unexpected error: ${err.message}`);
  process.exit(1);
});

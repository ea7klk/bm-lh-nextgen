const express = require('express');
const router = express.Router();

/**
 * Home page - displays recent lastheard activity
 */
router.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Brandmeister Last Heard - Next Generation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        .header {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 30px;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 32px;
        }
        .header p {
            color: #666;
            font-size: 16px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .stat-card .value {
            font-size: 24px;
            font-weight: 600;
            color: #333;
        }
        .stat-card .label {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }
        .controls {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 20px;
            margin-bottom: 20px;
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            align-items: center;
        }
        .controls input {
            padding: 10px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 14px;
            flex: 1;
            min-width: 200px;
        }
        .controls input:focus {
            outline: none;
            border-color: #667eea;
        }
        .controls button {
            padding: 10px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .controls button:hover {
            transform: translateY(-2px);
        }
        .controls .auto-refresh {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #666;
            font-size: 14px;
        }
        .controls .auto-refresh input[type="checkbox"] {
            width: auto;
            min-width: auto;
        }
        .table-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }
        .table-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .table-header h2 {
            font-size: 20px;
        }
        .last-update {
            font-size: 14px;
            opacity: 0.9;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        thead {
            background: #f8f9fa;
        }
        th {
            padding: 15px;
            text-align: left;
            font-weight: 600;
            color: #333;
            border-bottom: 2px solid #e0e0e0;
        }
        td {
            padding: 15px;
            color: #333;
            border-bottom: 1px solid #f0f0f0;
        }
        tbody tr:hover {
            background: #f8f9fa;
        }
        .callsign {
            font-weight: 600;
            color: #667eea;
        }
        .dmr-id {
            font-family: 'Courier New', monospace;
            color: #666;
            font-size: 13px;
        }
        .talkgroup {
            font-weight: 600;
            color: #764ba2;
        }
        .duration {
            font-family: 'Courier New', monospace;
            color: #28a745;
        }
        .timestamp {
            color: #666;
            font-size: 13px;
        }
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        .no-data {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            color: white;
            font-size: 14px;
        }
        .footer a {
            color: white;
            text-decoration: none;
            margin: 0 10px;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        @media (max-width: 768px) {
            .stats {
                grid-template-columns: 1fr;
            }
            .controls {
                flex-direction: column;
            }
            .controls input, .controls button {
                width: 100%;
            }
            table {
                font-size: 12px;
            }
            th, td {
                padding: 10px 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔊 Brandmeister Last Heard</h1>
            <p>Real-time DMR activity from the Brandmeister network</p>
            <div class="stats" id="stats">
                <div class="stat-card">
                    <div class="value" id="totalEntries">-</div>
                    <div class="label">Total Entries</div>
                </div>
                <div class="stat-card">
                    <div class="value" id="last24Hours">-</div>
                    <div class="label">Last 24 Hours</div>
                </div>
                <div class="stat-card">
                    <div class="value" id="uniqueCallsigns">-</div>
                    <div class="label">Unique Callsigns</div>
                </div>
                <div class="stat-card">
                    <div class="value" id="uniqueTalkgroups">-</div>
                    <div class="label">Unique Talkgroups</div>
                </div>
            </div>
        </div>

        <div class="controls">
            <input type="text" id="callsignFilter" placeholder="Filter by callsign...">
            <input type="text" id="talkgroupFilter" placeholder="Filter by talkgroup ID...">
            <button onclick="applyFilters()">Apply Filters</button>
            <button onclick="clearFilters()">Clear</button>
            <div class="auto-refresh">
                <input type="checkbox" id="autoRefresh" checked>
                <label for="autoRefresh">Auto-refresh (30s)</label>
            </div>
        </div>

        <div class="table-container">
            <div class="table-header">
                <h2>Recent Activity</h2>
                <div class="last-update">Last updated: <span id="lastUpdate">-</span></div>
            </div>
            <div id="tableContent">
                <div class="loading">Loading data...</div>
            </div>
        </div>

        <div class="footer">
            <a href="/api/auth/request-key">Request API Key</a> | 
            <a href="/api-docs">API Documentation</a> | 
            <a href="/admin">Admin Panel</a>
        </div>
    </div>

    <script>
        let autoRefreshInterval = null;

        // Format timestamp to readable date/time
        function formatTimestamp(timestamp) {
            const date = new Date(timestamp * 1000);
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }

        // Format duration in seconds to readable format
        function formatDuration(seconds) {
            if (!seconds) return '-';
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            if (mins > 0) {
                return mins + 'm ' + secs + 's';
            }
            return secs + 's';
        }

        // Load statistics
        async function loadStats() {
            try {
                const response = await fetch('/public/stats');
                const data = await response.json();
                
                document.getElementById('totalEntries').textContent = data.totalEntries.toLocaleString();
                document.getElementById('last24Hours').textContent = data.last24Hours.toLocaleString();
                document.getElementById('uniqueCallsigns').textContent = data.uniqueCallsigns.toLocaleString();
                document.getElementById('uniqueTalkgroups').textContent = data.uniqueTalkgroups.toLocaleString();
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }

        // Load lastheard data
        async function loadLastheard() {
            try {
                const callsign = document.getElementById('callsignFilter').value.trim();
                const talkgroup = document.getElementById('talkgroupFilter').value.trim();
                
                let url = '/public/lastheard?limit=50';
                if (callsign) url += '&callsign=' + encodeURIComponent(callsign);
                if (talkgroup) url += '&talkgroup=' + encodeURIComponent(talkgroup);
                
                const response = await fetch(url);
                const data = await response.json();
                
                const tableContent = document.getElementById('tableContent');
                
                if (data.length === 0) {
                    tableContent.innerHTML = '<div class="no-data">No data available</div>';
                } else {
                    let html = '<table><thead><tr>';
                    html += '<th>Time</th>';
                    html += '<th>Callsign</th>';
                    html += '<th>DMR ID</th>';
                    html += '<th>Name</th>';
                    html += '<th>Talkgroup</th>';
                    html += '<th>TG Name</th>';
                    html += '<th>Duration</th>';
                    html += '</tr></thead><tbody>';
                    
                    data.forEach(entry => {
                        html += '<tr>';
                        html += '<td class="timestamp">' + formatTimestamp(entry.Start) + '</td>';
                        html += '<td class="callsign">' + (entry.SourceCall || '-') + '</td>';
                        html += '<td class="dmr-id">' + (entry.SourceID || '-') + '</td>';
                        html += '<td>' + (entry.SourceName || '-') + '</td>';
                        html += '<td class="talkgroup">' + (entry.DestinationID || '-') + '</td>';
                        html += '<td>' + (entry.DestinationName || '-') + '</td>';
                        html += '<td class="duration">' + formatDuration(entry.duration) + '</td>';
                        html += '</tr>';
                    });
                    
                    html += '</tbody></table>';
                    tableContent.innerHTML = html;
                }
                
                document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
            } catch (error) {
                console.error('Error loading lastheard data:', error);
                document.getElementById('tableContent').innerHTML = '<div class="no-data">Error loading data</div>';
            }
        }

        // Apply filters
        function applyFilters() {
            loadLastheard();
        }

        // Clear filters
        function clearFilters() {
            document.getElementById('callsignFilter').value = '';
            document.getElementById('talkgroupFilter').value = '';
            loadLastheard();
        }

        // Setup auto-refresh
        function setupAutoRefresh() {
            const checkbox = document.getElementById('autoRefresh');
            
            if (checkbox.checked) {
                if (autoRefreshInterval) clearInterval(autoRefreshInterval);
                autoRefreshInterval = setInterval(() => {
                    loadLastheard();
                    loadStats();
                }, 30000); // 30 seconds
            } else {
                if (autoRefreshInterval) {
                    clearInterval(autoRefreshInterval);
                    autoRefreshInterval = null;
                }
            }
        }

        // Handle auto-refresh checkbox change
        document.getElementById('autoRefresh').addEventListener('change', setupAutoRefresh);

        // Handle Enter key in filter inputs
        document.getElementById('callsignFilter').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') applyFilters();
        });
        document.getElementById('talkgroupFilter').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') applyFilters();
        });

        // Initial load
        loadStats();
        loadLastheard();
        setupAutoRefresh();
    </script>
</body>
</html>
  `);
});

module.exports = router;

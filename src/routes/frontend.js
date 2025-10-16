const express = require('express');
const router = express.Router();

/**
 * Home page - displays grouped lastheard activity
 */
router.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>What's on in Brandmeister?</title>
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
            text-align: center;
        }
        .header p {
            color: #666;
            font-size: 16px;
            text-align: center;
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
            justify-content: center;
        }
        .control-group {
            display: flex;
            flex-direction: column;
            min-width: 120px;
        }
        .control-group label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
            font-weight: 600;
        }
        .controls select {
            padding: 10px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 14px;
            background: white;
            cursor: pointer;
        }
        .controls select:focus {
            outline: none;
            border-color: #667eea;
        }
        .chart-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 30px;
            margin-bottom: 20px;
        }
        .chart-title {
            color: #333;
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            text-align: center;
        }
        .bar-chart {
            display: flex;
            flex-direction: row;
            gap: 8px;
            align-items: flex-end;
            justify-content: center;
            max-height: 500px;
            overflow-x: auto;
            overflow-y: visible;
            padding: 20px 10px 120px 10px;
        }
        .bar-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            min-width: 50px;
            max-width: 80px;
        }
        .bar-container {
            width: 40px;
            min-height: 30px;
            max-height: 400px;
            background: #f0f0f0;
            border-radius: 4px;
            position: relative;
            overflow: visible;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
        }
        .bar-fill {
            width: 100%;
            background: linear-gradient(180deg, rgba(102, 126, 234, 0.8), rgba(102, 126, 234, 0.6));
            border-radius: 4px;
            transition: height 0.3s ease;
        }
        .bar-label {
            font-size: 11px;
            color: #333;
            text-align: left;
            transform: rotate(-45deg);
            transform-origin: top left;
            margin-top: 10px;
            margin-left: 20px;
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .bar-value {
            font-size: 12px;
            color: #666;
            font-weight: 600;
            text-align: center;
            margin-bottom: 5px;
        }
        .table-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        thead {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        th {
            padding: 12px 10px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
        }
        td {
            padding: 10px;
            color: #333;
            border-bottom: 1px solid #f0f0f0;
            font-size: 14px;
        }
        tbody tr:hover {
            background: #f8f9fa;
        }
        .talkgroup-name {
            font-weight: 600;
            color: #667eea;
        }
        .talkgroup-id {
            font-family: 'Courier New', monospace;
            color: #666;
            font-size: 13px;
        }
        .count {
            font-weight: 600;
            color: #28a745;
        }
        .duration {
            font-family: 'Courier New', monospace;
            color: #666;
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
            padding: 20px;
            color: white;
            font-size: 14px;
            line-height: 1.6;
        }
        .footer a {
            color: white;
            text-decoration: underline;
        }
        .footer a:hover {
            opacity: 0.8;
        }
        @media (max-width: 768px) {
            .controls {
                flex-direction: column;
            }
            .control-group {
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
            <h1>🔊 What's on in Brandmeister?</h1>
            <p>Real-time activity statistics from the Brandmeister DMR network</p>
        </div>

        <div class="controls">
            <div class="control-group">
                <label for="timeRange">Time Range</label>
                <select id="timeRange">
                    <option value="5m">Last 5 minutes</option>
                    <option value="15m">Last 15 minutes</option>
                    <option value="30m" selected>Last 30 minutes</option>
                    <option value="1h">Last hour</option>
                    <option value="2h">Last 2 hours</option>
                    <option value="6h">Last 6 hours</option>
                    <option value="12h">Last 12 hours</option>
                    <option value="24h">Last 24 hours</option>
                </select>
            </div>
            <div class="control-group">
                <label for="continent">Continent</label>
                <select id="continent">
                    <option value="All">All</option>
                    <option value="Global">Global</option>
                </select>
            </div>
            <div class="control-group" id="countryGroup" style="display: none;">
                <label for="country">Country</label>
                <select id="country">
                    <option value="">All</option>
                </select>
            </div>
            <div class="control-group">
                <label for="maxEntries">Maximum Entries</label>
                <select id="maxEntries">
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                    <option value="25" selected>25</option>
                    <option value="30">30</option>
                </select>
            </div>
        </div>

        <div class="chart-container">
            <div class="chart-title">Talkgroup total QSO statistics</div>
            <div class="bar-chart" id="barChart">
                <div style="text-align: center; color: #666; padding: 40px;">Loading chart...</div>
            </div>
        </div>

        <div class="chart-container">
            <div class="chart-title">Talkgroup total QSO duration</div>
            <div class="bar-chart" id="durationChart">
                <div style="text-align: center; color: #666; padding: 40px;">Loading chart...</div>
            </div>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Destination Name</th>
                        <th>Destination ID</th>
                        <th>Count</th>
                        <th>Total Duration (seconds)</th>
                    </tr>
                </thead>
                <tbody id="tableBody">
                    <tr>
                        <td colspan="4" class="loading">Loading data...</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>
                This website is provided by Volker Kerkhoff, 41089 Dos Hermanas (Spain).<br>
                We do not use cookies, neither own or third-party.<br>
                The complete <a href="https://github.com/ea7klk/bm-lh-nextgen" target="_blank" rel="noopener noreferrer">source code is available on GitHub</a> and is under MIT license.<br>
                Please contact me via GitHub issues or volker at ea7klk dot es
            </p>
            <p style="margin-top: 15px;">
                <a href="/api/auth/request-key">Request API Key</a> | 
                <a href="/api-docs">API Documentation</a> | 
                <a href="/admin">Admin Panel</a>
            </p>
        </div>
    </div>

    <script>
        let autoRefreshInterval = null;

        // Load continents on page load
        async function loadContinents() {
            try {
                const response = await fetch('/public/continents');
                const continents = await response.json();
                
                const select = document.getElementById('continent');
                select.innerHTML = '<option value="All">All</option>';
                continents.forEach(continent => {
                    const option = document.createElement('option');
                    option.value = continent;
                    option.textContent = continent;
                    select.appendChild(option);
                });
            } catch (error) {
                console.error('Error loading continents:', error);
            }
        }

        // Load countries when continent changes
        async function loadCountries(continent) {
            if (continent === 'All' || continent === 'Global') {
                document.getElementById('countryGroup').style.display = 'none';
                return;
            }

            try {
                const response = await fetch('/public/countries?continent=' + encodeURIComponent(continent));
                const countries = await response.json();
                
                const select = document.getElementById('country');
                select.innerHTML = '<option value="">All</option>';
                
                if (countries.length > 0) {
                    countries.forEach(country => {
                        const option = document.createElement('option');
                        option.value = country.value;
                        option.textContent = country.label;
                        select.appendChild(option);
                    });
                    document.getElementById('countryGroup').style.display = 'flex';
                } else {
                    document.getElementById('countryGroup').style.display = 'none';
                }
            } catch (error) {
                console.error('Error loading countries:', error);
                document.getElementById('countryGroup').style.display = 'none';
            }
        }

        // Load grouped data
        async function loadGroupedData() {
            try {
                const timeRange = document.getElementById('timeRange').value;
                const continent = document.getElementById('continent').value;
                const countrySelect = document.getElementById('country');
                const country = (continent !== 'All' && continent !== 'Global' && countrySelect.options.length > 1) 
                    ? countrySelect.value 
                    : '';
                const maxEntries = document.getElementById('maxEntries').value;
                
                let url = '/public/lastheard/grouped?timeRange=' + timeRange + '&limit=' + maxEntries;
                if (continent && continent !== 'All') {
                    url += '&continent=' + encodeURIComponent(continent);
                }
                if (country) {
                    url += '&country=' + encodeURIComponent(country);
                }
                
                const response = await fetch(url);
                const data = await response.json();
                
                const tableBody = document.getElementById('tableBody');
                
                if (data.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="4" class="no-data">No data available for selected time range and filters</td></tr>';
                    updateChart([], [], []);
                } else {
                    let html = '';
                    data.forEach(item => {
                        html += '<tr>';
                        html += '<td class="talkgroup-name">' + (item.destinationName || 'N/A') + '</td>';
                        html += '<td class="talkgroup-id">' + (item.destinationId || 'N/A') + '</td>';
                        html += '<td class="count">' + (item.count || 0) + '</td>';
                        html += '<td class="duration">' + (item.totalDuration ? Math.round(item.totalDuration) : '0') + '</td>';
                        html += '</tr>';
                    });
                    tableBody.innerHTML = html;
                    
                    // Update charts
                    const labels = data.map(item => item.destinationName || 'N/A');
                    const ids = data.map(item => item.destinationId || 'N/A');
                    const counts = data.map(item => item.count || 0);
                    const durations = data.map(item => item.totalDuration || 0);
                    updateChart(labels, ids, counts);
                    updateDurationChart(labels, ids, durations);
                }
            } catch (error) {
                console.error('Error loading grouped data:', error);
                document.getElementById('tableBody').innerHTML = 
                    '<tr><td colspan="4" class="no-data">Error loading data</td></tr>';
            }
        }

        // Update chart with vertical CSS bars
        function updateChart(labels, ids, data) {
            const barChart = document.getElementById('barChart');
            
            if (data.length === 0) {
                barChart.innerHTML = '<div style="text-align: center; color: #666; padding: 40px;">No data to display</div>';
                return;
            }
            
            const maxValue = Math.max(...data);
            let html = '';
            
            for (let i = 0; i < Math.min(labels.length, data.length); i++) {
                const heightPercentage = maxValue > 0 ? (data[i] / maxValue) * 100 : 0;
                const heightPx = maxValue > 0 ? (data[i] / maxValue) * 300 : 0;
                const label = labels[i] + ' (' + ids[i] + ')';
                html += '<div class="bar-item">' +
                    '<div class="bar-value">' + data[i] + '</div>' +
                    '<div class="bar-container" style="height: ' + Math.max(heightPx, 30) + 'px;">' +
                    '<div class="bar-fill" style="height: 100%"></div>' +
                    '</div>' +
                    '<div class="bar-label" title="' + label + '">' + label + '</div>' +
                    '</div>';
            }
            
            barChart.innerHTML = html;
        }

        // Update duration chart with vertical CSS bars
        function updateDurationChart(labels, ids, data) {
            const durationChart = document.getElementById('durationChart');
            
            if (data.length === 0) {
                durationChart.innerHTML = '<div style="text-align: center; color: #666; padding: 40px;">No data to display</div>';
                return;
            }
            
            const maxValue = Math.max(...data);
            let html = '';
            
            for (let i = 0; i < Math.min(labels.length, data.length); i++) {
                const heightPercentage = maxValue > 0 ? (data[i] / maxValue) * 100 : 0;
                const heightPx = maxValue > 0 ? (data[i] / maxValue) * 300 : 0;
                const label = labels[i] + ' (' + ids[i] + ')';
                const durationDisplay = Math.round(data[i]);
                html += '<div class="bar-item">' +
                    '<div class="bar-value">' + durationDisplay + 's</div>' +
                    '<div class="bar-container" style="height: ' + Math.max(heightPx, 30) + 'px;">' +
                    '<div class="bar-fill" style="height: 100%"></div>' +
                    '</div>' +
                    '<div class="bar-label" title="' + label + '">' + label + '</div>' +
                    '</div>';
            }
            
            durationChart.innerHTML = html;
        }

        // Setup auto-refresh
        function setupAutoRefresh() {
            if (autoRefreshInterval) clearInterval(autoRefreshInterval);
            autoRefreshInterval = setInterval(() => {
                loadGroupedData();
            }, 10000); // 10 seconds like bm-lh-v2
        }

        // Event listeners
        document.getElementById('timeRange').addEventListener('change', loadGroupedData);
        document.getElementById('continent').addEventListener('change', async function() {
            await loadCountries(this.value);
            loadGroupedData();
        });
        document.getElementById('country').addEventListener('change', loadGroupedData);
        document.getElementById('maxEntries').addEventListener('change', loadGroupedData);

        // Initial load
        loadContinents().then(() => {
            loadGroupedData();
            setupAutoRefresh();
        });
    </script>
</body>
</html>
  `);
});

module.exports = router;

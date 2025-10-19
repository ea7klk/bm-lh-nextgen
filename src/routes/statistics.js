const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/userAuth');
const { generateLanguageSelector, generateMatomoScript } = require('../utils/htmlHelpers');

/**
 * Advanced statistics page - requires authentication
 */
router.get('/', authenticateUser, (req, res) => {
  const locale = res.locals.locale || 'en';
  const __ = req.__;
  const user = req.user;
  
  res.send(`
<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Advanced Statistics - ${__('home.title')}</title>
    ${generateMatomoScript()}
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
            font-size: 18px;
            text-align: center;
            margin-bottom: 20px;
        }
        .user-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
        .user-welcome {
            color: #333;
            font-size: 16px;
        }
        .user-callsign {
            color: #667eea;
            font-weight: bold;
        }
        .nav-buttons {
            display: flex;
            gap: 15px;
        }
        .nav-button {
            background: #667eea;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        .nav-button:hover {
            background: #5a67d8;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        .controls-section {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 30px;
            margin-bottom: 20px;
        }
        .controls {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .control-group {
            display: flex;
            flex-direction: column;
        }
        .control-group label {
            color: #333;
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .control-group select,
        .control-group input {
            padding: 12px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 14px;
            background: white;
            transition: border-color 0.3s ease;
        }
        .control-group select:focus,
        .control-group input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .select-search-wrapper {
            position: relative;
        }
        .select-search-input {
            width: 100%;
        }
        .select-search-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 2px solid #e2e8f0;
            border-top: none;
            border-radius: 0 0 8px 8px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
        }
        .dropdown-item {
            padding: 10px 12px;
            cursor: pointer;
            border-bottom: 1px solid #f1f5f9;
        }
        .dropdown-item:hover {
            background: #f8fafc;
        }
        .dropdown-item:last-child {
            border-bottom: none;
        }
        .tooltip {
            position: relative;
            display: inline-block;
            width: 100%;
        }
        .tooltip .tooltiptext {
            visibility: hidden;
            width: 200px;
            background-color: #555;
            color: white;
            text-align: center;
            border-radius: 6px;
            padding: 5px;
            position: absolute;
            z-index: 1;
            bottom: 125%;
            left: 50%;
            margin-left: -100px;
            opacity: 0;
            transition: opacity 0.3s;
            font-size: 12px;
        }
        .tooltip:hover .tooltiptext {
            visibility: visible;
            opacity: 1;
        }
        .stats-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 30px;
        }
        .stat-title {
            color: #333;
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            text-align: center;
        }
        .loading {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 40px;
        }
        .error {
            color: #e53e3e;
            text-align: center;
            padding: 20px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
        }
        .stat-item {
            text-align: center;
            padding: 15px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background: #f8fafc;
        }
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
            display: block;
        }
        .stat-label {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        @media (max-width: 768px) {
            .controls {
                grid-template-columns: 1fr;
            }
            .stats-container {
                grid-template-columns: 1fr;
            }
            .nav-buttons {
                flex-direction: column;
            }
            .user-info {
                flex-direction: column;
                gap: 15px;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${__('user.advancedStatistics')}</h1>
            <p>Detailed analytics and insights from the Brandmeister DMR network</p>
            <div class="user-info">
                <div class="user-welcome">
                    Welcome, <span class="user-callsign">${user.callsign}</span>
                </div>
                <div class="nav-buttons">
                    <a href="/" class="nav-button">${__('user.backToDashboard')}</a>
                    <a href="/advanced" class="nav-button">${__('user.advancedFunctions')}</a>
                </div>
            </div>
        </div>

        <div class="controls-section">
            <div class="controls">
                <div class="control-group">
                    <label for="timeRange">${__('home.timeRange')}</label>
                    <select id="timeRange">
                        <option value="5m">${__('home.last5min')}</option>
                        <option value="15m">${__('home.last15min')}</option>
                        <option value="30m" selected>${__('home.last30min')}</option>
                        <option value="1h">${__('home.lastHour')}</option>
                        <option value="2h">${__('home.last2hours')}</option>
                        <option value="6h">${__('home.last6hours')}</option>
                        <option value="12h">${__('home.last12hours')}</option>
                        <option value="24h">${__('home.last24hours')}</option>
                        <option value="2d">${__('home.last2days')}</option>
                        <option value="5d">${__('home.last5days')}</option>
                        <option value="1w">${__('home.lastWeek')}</option>
                        <option value="2w">${__('home.last2weeks')}</option>
                        <option value="1M">${__('home.lastMonth')}</option>
                    </select>
                </div>
                <div class="control-group">
                    <label for="continent">${__('home.continent')}</label>
                    <select id="continent">
                        <option value="All">${__('home.all')}</option>
                    </select>
                </div>
                <div class="control-group" id="countryGroup" style="display: none;">
                    <label for="country">${__('home.country')}</label>
                    <select id="country">
                        <option value="">${__('home.all')}</option>
                    </select>
                </div>
                <div class="control-group" id="talkgroupGroup">
                    <label for="talkgroup">Talkgroup</label>
                    <div class="select-search-wrapper">
                        <input type="text" id="talkgroupSearch" class="select-search-input" placeholder="Type to search talkgroups..." autocomplete="off">
                        <select id="talkgroup" style="display: none;">
                            <option value="">All</option>
                        </select>
                        <div id="talkgroupDropdown" class="select-search-dropdown"></div>
                    </div>
                </div>
                <div class="control-group">
                    <label for="callsignSearch">Callsign Search</label>
                    <div class="tooltip">
                        <input type="text" id="callsignSearch" placeholder="e.g., EA* or EA7KLK">
                        <span class="tooltiptext">Use wildcards: EA* for all EA callsigns, *KLK for ending with KLK</span>
                    </div>
                </div>
                <div class="control-group">
                    <label for="language">${__('home.language')}</label>
                    <select id="language">
                        ${generateLanguageSelector(locale, __)}
                    </select>
                </div>
            </div>
        </div>

        <div class="stats-container">
            <div class="stat-card">
                <div class="stat-title">Network Overview</div>
                <div id="networkStats" class="loading">${__('home.loadingData')}</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Activity Trends</div>
                <div id="activityStats" class="loading">${__('home.loadingData')}</div>
            </div>
        </div>

        <div class="stats-container">
            <div class="stat-card">
                <div class="stat-title">Geographic Distribution</div>
                <div id="geoStats" class="loading">${__('home.loadingData')}</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Top Performers</div>
                <div id="topStats" class="loading">${__('home.loadingData')}</div>
            </div>
        </div>
    </div>

    <script>
        // Initialize the page
        document.addEventListener('DOMContentLoaded', function() {
            initializeFilters();
            loadStatistics();
            
            // Add event listeners for filter changes
            document.getElementById('timeRange').addEventListener('change', loadStatistics);
            document.getElementById('continent').addEventListener('change', handleContinentChange);
            document.getElementById('country').addEventListener('change', loadStatistics);
            document.getElementById('callsignSearch').addEventListener('input', debounce(loadStatistics, 500));
            document.getElementById('language').addEventListener('change', changeLanguage);
            
            // Initialize talkgroup search
            initializeTalkgroupSearch();
        });

        function initializeFilters() {
            // Load continents
            fetch('/public/continents')
                .then(response => response.json())
                .then(continents => {
                    const continentSelect = document.getElementById('continent');
                    continents.forEach(continent => {
                        const option = document.createElement('option');
                        option.value = continent;
                        option.textContent = continent;
                        continentSelect.appendChild(option);
                    });
                })
                .catch(error => console.error('Error loading continents:', error));
        }

        function handleContinentChange() {
            const continent = document.getElementById('continent').value;
            const countryGroup = document.getElementById('countryGroup');
            const countrySelect = document.getElementById('country');
            
            if (continent && continent !== 'All') {
                countryGroup.style.display = 'block';
                countrySelect.innerHTML = '<option value="">Loading...</option>';
                
                fetch('/public/countries?continent=' + encodeURIComponent(continent))
                    .then(response => response.json())
                    .then(countries => {
                        countrySelect.innerHTML = '<option value="">${__('home.all')}</option>';
                        countries.forEach(country => {
                            const option = document.createElement('option');
                            option.value = country.code;
                            option.textContent = country.name;
                            countrySelect.appendChild(option);
                        });
                    })
                    .catch(error => {
                        console.error('Error loading countries:', error);
                        countrySelect.innerHTML = '<option value="">${__('home.all')}</option>';
                    });
            } else {
                countryGroup.style.display = 'none';
                countrySelect.innerHTML = '<option value="">${__('home.all')}</option>';
            }
            loadStatistics();
        }

        function initializeTalkgroupSearch() {
            const searchInput = document.getElementById('talkgroupSearch');
            const dropdown = document.getElementById('talkgroupDropdown');
            let allTalkgroups = [];

            // Load all talkgroups
            fetch('/public/talkgroups')
                .then(response => response.json())
                .then(talkgroups => {
                    allTalkgroups = talkgroups;
                })
                .catch(error => console.error('Error loading talkgroups:', error));

            searchInput.addEventListener('input', function() {
                const query = this.value.toLowerCase();
                if (query.length < 2) {
                    dropdown.style.display = 'none';
                    return;
                }

                const filtered = allTalkgroups.filter(tg => 
                    tg.id.toString().includes(query) || 
                    (tg.name && tg.name.toLowerCase().includes(query))
                ).slice(0, 10);

                if (filtered.length > 0) {
                    dropdown.innerHTML = filtered.map(tg => 
                        '<div class="dropdown-item" data-value="' + tg.id + '">' + 
                        tg.id + (tg.name ? ' - ' + tg.name : '') + 
                        '</div>'
                    ).join('');
                    dropdown.style.display = 'block';
                } else {
                    dropdown.style.display = 'none';
                }
            });

            dropdown.addEventListener('click', function(e) {
                if (e.target.classList.contains('dropdown-item')) {
                    const value = e.target.getAttribute('data-value');
                    const text = e.target.textContent;
                    searchInput.value = text;
                    searchInput.setAttribute('data-talkgroup-id', value);
                    dropdown.style.display = 'none';
                    loadStatistics();
                }
            });

            // Hide dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.style.display = 'none';
                }
            });
        }

        function loadStatistics() {
            const timeRange = document.getElementById('timeRange').value;
            const continent = document.getElementById('continent').value;
            const country = document.getElementById('country').value;
            const callsign = document.getElementById('callsignSearch').value;
            const talkgroupId = document.getElementById('talkgroupSearch').getAttribute('data-talkgroup-id');
            
            // Build query parameters
            const params = new URLSearchParams();
            params.append('timeRange', timeRange);
            if (continent && continent !== 'All') params.append('continent', continent);
            if (country) params.append('country', country);
            if (callsign) params.append('callsign', callsign);
            if (talkgroupId) params.append('talkgroup', talkgroupId);
            
            // Load network overview stats
            loadNetworkStats(params);
            loadActivityStats(params);
            loadGeoStats(params);
            loadTopStats(params);
        }

        function loadNetworkStats(params) {
            document.getElementById('networkStats').innerHTML = '${__('home.loadingData')}';
            
            // This would call a new API endpoint for network statistics
            fetch('/public/statistics/network?' + params.toString())
                .then(response => response.json())
                .then(data => {
                    document.getElementById('networkStats').innerHTML = \`
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-number">\${data.totalQSOs || 0}</span>
                                <div class="stat-label">Total QSOs</div>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">\${data.uniqueCallsigns || 0}</span>
                                <div class="stat-label">Unique Callsigns</div>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">\${data.activeTalkgroups || 0}</span>
                                <div class="stat-label">Active Talkgroups</div>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">\${Math.round(data.avgDuration || 0)}s</span>
                                <div class="stat-label">Avg Duration</div>
                            </div>
                        </div>
                    \`;
                })
                .catch(error => {
                    console.error('Error loading network stats:', error);
                    document.getElementById('networkStats').innerHTML = '<div class="error">Error loading data</div>';
                });
        }

        function loadActivityStats(params) {
            document.getElementById('activityStats').innerHTML = '${__('home.loadingData')}';
            
            fetch('/public/statistics/activity?' + params.toString())
                .then(response => response.json())
                .then(data => {
                    document.getElementById('activityStats').innerHTML = \`
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-number">\${data.peakHour || 'N/A'}</span>
                                <div class="stat-label">Peak Hour</div>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">\${data.busyDay || 'N/A'}</span>
                                <div class="stat-label">Busiest Day</div>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">\${Math.round(data.qsosPerHour || 0)}</span>
                                <div class="stat-label">QSOs/Hour</div>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">\${data.growthRate || 0}%</span>
                                <div class="stat-label">Growth Rate</div>
                            </div>
                        </div>
                    \`;
                })
                .catch(error => {
                    console.error('Error loading activity stats:', error);
                    document.getElementById('activityStats').innerHTML = '<div class="error">Error loading data</div>';
                });
        }

        function loadGeoStats(params) {
            document.getElementById('geoStats').innerHTML = '${__('home.loadingData')}';
            
            fetch('/public/statistics/geographic?' + params.toString())
                .then(response => response.json())
                .then(data => {
                    document.getElementById('geoStats').innerHTML = \`
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-number">\${data.topCountry || 'N/A'}</span>
                                <div class="stat-label">Top Country</div>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">\${data.countriesActive || 0}</span>
                                <div class="stat-label">Countries Active</div>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">\${data.continentsActive || 0}</span>
                                <div class="stat-label">Continents Active</div>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">\${Math.round(data.diversityIndex || 0)}%</span>
                                <div class="stat-label">Diversity Index</div>
                            </div>
                        </div>
                    \`;
                })
                .catch(error => {
                    console.error('Error loading geographic stats:', error);
                    document.getElementById('geoStats').innerHTML = '<div class="error">Error loading data</div>';
                });
        }

        function loadTopStats(params) {
            document.getElementById('topStats').innerHTML = '${__('home.loadingData')}';
            
            fetch('/public/statistics/top?' + params.toString())
                .then(response => response.json())
                .then(data => {
                    let html = '<div class="stats-grid">';
                    if (data.topCallsign) {
                        html += \`
                            <div class="stat-item">
                                <span class="stat-number">\${data.topCallsign.callsign}</span>
                                <div class="stat-label">Most Active (\${data.topCallsign.count} QSOs)</div>
                            </div>
                        \`;
                    }
                    if (data.topTalkgroup) {
                        html += \`
                            <div class="stat-item">
                                <span class="stat-number">\${data.topTalkgroup.id}</span>
                                <div class="stat-label">Busiest TG (\${data.topTalkgroup.count} QSOs)</div>
                            </div>
                        \`;
                    }
                    if (data.longestQSO) {
                        html += \`
                            <div class="stat-item">
                                <span class="stat-number">\${Math.round(data.longestQSO.duration)}s</span>
                                <div class="stat-label">Longest QSO</div>
                            </div>
                        \`;
                    }
                    if (data.totalDuration) {
                        html += \`
                            <div class="stat-item">
                                <span class="stat-number">\${Math.round(data.totalDuration / 3600)}h</span>
                                <div class="stat-label">Total Air Time</div>
                            </div>
                        \`;
                    }
                    html += '</div>';
                    
                    document.getElementById('topStats').innerHTML = html;
                })
                .catch(error => {
                    console.error('Error loading top stats:', error);
                    document.getElementById('topStats').innerHTML = '<div class="error">Error loading data</div>';
                });
        }

        function changeLanguage() {
            const language = document.getElementById('language').value;
            window.location.href = '?lang=' + language;
        }

        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    </script>
</body>
</html>
  `);
});

module.exports = router;
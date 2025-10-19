const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/userAuth');
const { generateLanguageSelector, generateMatomoScript } = require('../utils/htmlHelpers');

/**
 * Advanced functions page - requires authentication
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
    <title>Advanced Functions - ${__('home.title')}</title>
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
        .user-section {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 15px;
            flex-wrap: wrap;
        }
        .user-greeting {
            color: #333;
            font-size: 16px;
            font-weight: 600;
        }
        .user-callsign {
            color: #667eea;
            font-weight: 700;
        }
        .auth-link {
            display: inline-block;
            padding: 8px 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            transition: transform 0.2s, box-shadow 0.2s;
            border: none;
            cursor: pointer;
        }
        .auth-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .auth-link.secondary {
            background: white;
            color: #667eea;
            border: 2px solid #667eea;
        }
        .auth-link.secondary:hover {
            background: #f8f9fa;
        }
        .auth-link.logout {
            background: #dc3545;
        }
        .auth-link.logout:hover {
            background: #c82333;
            box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
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
        .controls select, .controls input[type="text"] {
            padding: 10px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 14px;
            background: white;
            cursor: pointer;
        }
        .controls select:focus, .controls input[type="text"]:focus {
            outline: none;
            border-color: #667eea;
        }
        .controls input[type="text"] {
            min-width: 200px;
        }
        #talkgroup {
            min-width: 250px;
            max-width: 350px;
        }
        .select-search-wrapper {
            position: relative;
            width: 100%;
        }
        .select-search-input {
            width: 100%;
            padding: 10px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 14px;
            background: white;
            cursor: text;
            box-sizing: border-box;
        }
        .select-search-input:focus {
            outline: none;
            border-color: #667eea;
        }
        .select-search-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            max-height: 300px;
            overflow-y: auto;
            background: white;
            border: 2px solid #667eea;
            border-top: none;
            border-radius: 0 0 6px 6px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            display: none;
        }
        .select-search-dropdown.active {
            display: block;
        }
        .select-search-option {
            padding: 10px 15px;
            cursor: pointer;
            border-bottom: 1px solid #f0f0f0;
        }
        .select-search-option:hover {
            background: #f8f9fa;
        }
        .select-search-option.selected {
            background: #667eea;
            color: white;
        }
        .select-search-option:last-child {
            border-bottom: none;
        }
        .select-search-no-results {
            color: #999;
            cursor: default;
        }
        .control-group .tooltip {
            width: 100%;
        }
        .control-group .tooltip input[type="text"] {
            width: 100%;
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
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
            justify-content: flex-start;
            max-height: 800px;
            overflow-y: auto;
            overflow-x: visible;
            padding: 20px;
        }
        .bar-item {
            display: flex;
            flex-direction: row;
            align-items: center;
            width: 100%;
            min-height: 20px;
            position: relative;
            gap: 10px;
        }
        .bar-container {
            height: 18px;
            min-width: 50px;
            background: #f0f0f0;
            border-radius: 4px;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            flex: 1;
            z-index: 0;
        }
        .bar-fill {
            height: 100%;
            background: linear-gradient(90deg, rgba(102, 126, 234, 0.8), rgba(102, 126, 234, 0.6));
            border-radius: 4px;
            transition: width 0.3s ease;
            position: relative;
            z-index: 0;
        }
        .bar-label {
            font-size: 11px;
            color: #333;
            text-align: left;
            min-width: 200px;
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            position: relative;
            z-index: 1;
            flex-shrink: 0;
        }
        .bar-value {
            font-size: 12px;
            color: #666;
            font-weight: 600;
            text-align: right;
            min-width: 50px;
            margin-right: 10px;
            flex-shrink: 0;
        }
        .table-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            margin-bottom: 20px;
            padding: 20px 0 0 0;
        }
        .table-container .chart-title {
            color: #333;
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 20px 0;
            padding: 0 20px;
            text-align: center;
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
        .tooltip {
            position: relative;
            display: inline-block;
        }
        .tooltip .tooltiptext {
            visibility: hidden;
            width: 250px;
            background-color: #555;
            color: #fff;
            text-align: center;
            border-radius: 6px;
            padding: 8px;
            position: absolute;
            z-index: 1;
            bottom: 125%;
            left: 50%;
            margin-left: -125px;
            opacity: 0;
            transition: opacity 0.3s;
            font-size: 12px;
        }
        .tooltip:hover .tooltiptext {
            visibility: visible;
            opacity: 1;
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
            .bar-label {
                min-width: 150px;
                max-width: 150px;
                font-size: 10px;
            }
            .bar-value {
                min-width: 40px;
                font-size: 11px;
            }
        }
    </style>
    ${generateMatomoScript()}
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔊 ${__('home.title')} - Advanced Functions</h1>
            <p>${__('home.subtitle')}</p>
            <div class="user-section">
                <span class="user-greeting">${__('user.greeting', '<a href="/user/profile" class="user-callsign" style="text-decoration: none;">' + user.callsign + '</a>')}</span>
                <a href="/" class="auth-link secondary">${__('user.backToDashboard')}</a>
                <button onclick="logout()" class="auth-link logout">${__('user.logoutButton')}</button>
            </div>
        </div>

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
                <label for="maxEntries">${__('home.maxEntries')}</label>
                <select id="maxEntries">
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                    <option value="25" selected>25</option>
                    <option value="30">30</option>
                    <option value="40">40</option>
                    <option value="50">50</option>
                </select>
            </div>
            <div class="control-group">
                <label for="language">${__('home.language')}</label>
                <select id="language">
                    ${generateLanguageSelector(locale, __)}
                </select>
            </div>
        </div>

        <div class="chart-container">
            <div class="chart-title">${__('home.talkgroupQsoStats')}</div>
            <div class="bar-chart" id="barChart">
                <div style="text-align: center; color: #666; padding: 40px;">${__('home.loadingChart')}</div>
            </div>
        </div>

        <div class="chart-container">
            <div class="chart-title">${__('home.talkgroupDurationStats')}</div>
            <div class="bar-chart" id="durationChart">
                <div style="text-align: center; color: #666; padding: 40px;">${__('home.loadingChart')}</div>
            </div>
        </div>

        <div class="table-container">
            <h2 class="chart-title">${__('home.talkgroupActivity')}</h2>
            <table>
                <thead>
                    <tr>
                        <th>${__('home.destinationName')}</th>
                        <th>${__('home.destinationId')}</th>
                        <th>${__('home.count')}</th>
                        <th>${__('home.totalDuration')}</th>
                    </tr>
                </thead>
                <tbody id="tableBody">
                    <tr>
                        <td colspan="4" class="loading">${__('home.loadingData')}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="table-container" id="callsignTableContainer">
            <h2 class="chart-title">${__('home.activeCallsigns')}</h2>
            <table>
                <thead>
                    <tr>
                        <th>${__('home.callsign')}</th>
                        <th>${__('home.name')}</th>
                        <th>${__('home.qsoCount')}</th>
                        <th>${__('home.totalDuration')}</th>
                    </tr>
                </thead>
                <tbody id="callsignTableBody">
                    <tr>
                        <td colspan="4" class="loading">${__('home.loadingData')}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>
                ${__('home.footer.providedBy')}<br>
                ${__('home.footer.cookies')}<br>
                ${__('home.footer.sourceCode')} <a href="https://github.com/ea7klk/bm-lh-nextgen" target="_blank" rel="noopener noreferrer">${__('home.footer.sourceCodeLink')}</a> ${__('home.footer.license')}<br>
                ${__('home.footer.contact')} <a href="https://github.com/ea7klk/bm-lh-nextgen/issues" target="_blank" rel="noopener noreferrer">${__('home.footer.githubIssues')}</a> ${__('home.footer.or')} volker at ea7klk dot es
            </p>
        </div>
    </div>

    <script>
        // Translations for JavaScript
        const i18n = {
            noData: "${__('home.noData')}",
            noDataDisplay: "${__('home.noDataDisplay')}",
            loadingData: "${__('home.loadingData')}"
        };
        
        let autoRefreshInterval = null;
        let talkgroupsList = [];
        let selectedTalkgroupId = '';

        // Format seconds to hours:minutes:seconds
        function formatDuration(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            
            if (hours > 0) {
                return hours + ':' + minutes.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
            } else if (minutes > 0) {
                return minutes + ':' + secs.toString().padStart(2, '0');
            } else {
                return secs + ' sec';
            }
        }

        // Logout function
        async function logout() {
            try {
                const response = await fetch('/user/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                
                if (response.ok) {
                    window.location.href = '/';
                } else {
                    alert('Logout failed. Please try again.');
                }
            } catch (error) {
                console.error('Error during logout:', error);
                alert('Logout failed. Please try again.');
            }
        }

        // Load continents
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
                document.getElementById('talkgroupGroup').style.display = 'none';
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

        // Load talkgroups when country changes
        async function loadTalkgroups(continent, country) {
            const talkgroupSelect = document.getElementById('talkgroup');
            const searchInput = document.getElementById('talkgroupSearch');
            const dropdown = document.getElementById('talkgroupDropdown');
            
            if (continent === 'All' || continent === 'Global' || !country) {
                document.getElementById('talkgroupGroup').style.display = 'none';
                talkgroupsList = [];
                selectedTalkgroupId = '';
                searchInput.value = '';
                dropdown.innerHTML = '';
                dropdown.classList.remove('active');
                return;
            }

            try {
                const response = await fetch('/public/talkgroups?continent=' + encodeURIComponent(continent) + '&country=' + encodeURIComponent(country));
                const talkgroups = await response.json();
                
                if (talkgroups.length > 0) {
                    talkgroupsList = talkgroups;
                    selectedTalkgroupId = '';
                    searchInput.value = '';
                    
                    // Populate the hidden select dropdown for form compatibility
                    talkgroupSelect.innerHTML = '<option value="">All</option>';
                    talkgroups.forEach(tg => {
                        const option = document.createElement('option');
                        option.value = tg.talkgroup_id;
                        option.textContent = tg.talkgroup_id + ' - ' + tg.name;
                        talkgroupSelect.appendChild(option);
                    });
                    
                    document.getElementById('talkgroupGroup').style.display = 'flex';
                } else {
                    document.getElementById('talkgroupGroup').style.display = 'none';
                    talkgroupsList = [];
                    selectedTalkgroupId = '';
                    searchInput.value = '';
                }
            } catch (error) {
                console.error('Error loading talkgroups:', error);
                document.getElementById('talkgroupGroup').style.display = 'none';
                talkgroupsList = [];
                selectedTalkgroupId = '';
                searchInput.value = '';
            }
        }
        
        // Filter and display talkgroups based on search
        function filterTalkgroups(searchText) {
            const dropdown = document.getElementById('talkgroupDropdown');
            const search = searchText.toLowerCase();
            
            if (talkgroupsList.length === 0) {
                dropdown.innerHTML = '';
                dropdown.classList.remove('active');
                return;
            }
            
            // Filter talkgroups
            const filtered = talkgroupsList.filter(tg => 
                tg.talkgroup_id.toString().includes(search) || 
                tg.name.toLowerCase().includes(search)
            );
            
            if (filtered.length === 0 && searchText === '') {
                // Show all if search is empty
                renderTalkgroupOptions(talkgroupsList);
            } else if (filtered.length === 0) {
                dropdown.innerHTML = '<div class="select-search-option select-search-no-results">No talkgroups found</div>';
                dropdown.classList.add('active');
            } else {
                renderTalkgroupOptions(filtered);
            }
        }
        
        // Render talkgroup options in the dropdown
        function renderTalkgroupOptions(talkgroups) {
            const dropdown = document.getElementById('talkgroupDropdown');
            
            // Clear dropdown
            dropdown.innerHTML = '';
            
            // Add "All" option
            const allOption = document.createElement('div');
            allOption.className = 'select-search-option' + (selectedTalkgroupId === '' ? ' selected' : '');
            allOption.dataset.value = '';
            allOption.dataset.name = 'All';
            allOption.textContent = 'All';
            allOption.addEventListener('click', function() {
                selectTalkgroup(this.dataset.value, this.dataset.name);
            });
            dropdown.appendChild(allOption);
            
            // Add talkgroup options
            talkgroups.forEach(tg => {
                const isSelected = selectedTalkgroupId === tg.talkgroup_id.toString();
                const option = document.createElement('div');
                option.className = 'select-search-option' + (isSelected ? ' selected' : '');
                option.dataset.value = tg.talkgroup_id;
                option.dataset.name = tg.name;
                option.textContent = tg.talkgroup_id + ' - ' + tg.name;
                option.addEventListener('click', function() {
                    selectTalkgroup(this.dataset.value, this.dataset.name);
                });
                dropdown.appendChild(option);
            });
            
            dropdown.classList.add('active');
        }
        
        // Select a talkgroup
        function selectTalkgroup(id, name) {
            selectedTalkgroupId = id;
            const searchInput = document.getElementById('talkgroupSearch');
            const dropdown = document.getElementById('talkgroupDropdown');
            const hiddenSelect = document.getElementById('talkgroup');
            
            // Update search input display
            if (id === '') {
                searchInput.value = '';
                searchInput.placeholder = 'Type to search talkgroups...';
            } else {
                searchInput.value = id + ' - ' + name;
            }
            
            // Update hidden select
            hiddenSelect.value = id;
            
            // Close dropdown
            dropdown.classList.remove('active');
            
            // Trigger data reload
            savePreferences();
            loadGroupedData();
            loadCallsignData();
        }
        
        // Setup search input handlers
        function setupSearchableDropdown() {
            const searchInput = document.getElementById('talkgroupSearch');
            const dropdown = document.getElementById('talkgroupDropdown');
            
            // Show dropdown and filter on input
            searchInput.addEventListener('input', function() {
                filterTalkgroups(this.value);
            });
            
            // Show all options on focus
            searchInput.addEventListener('focus', function() {
                if (talkgroupsList.length > 0) {
                    filterTalkgroups(this.value);
                }
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.select-search-wrapper')) {
                    dropdown.classList.remove('active');
                }
            });
        }

        // Load grouped data (talkgroups)
        async function loadGroupedData() {
            try {
                const timeRange = document.getElementById('timeRange').value;
                const continent = document.getElementById('continent').value;
                const countrySelect = document.getElementById('country');
                const country = (continent !== 'All' && continent !== 'Global' && countrySelect.options.length > 1) 
                    ? countrySelect.value 
                    : '';
                const maxEntries = document.getElementById('maxEntries').value;
                const talkgroupId = document.getElementById('talkgroup').value;
                
                let url = '/public/lastheard/grouped?timeRange=' + timeRange + '&limit=' + maxEntries;
                if (continent && continent !== 'All') {
                    url += '&continent=' + encodeURIComponent(continent);
                }
                if (country) {
                    url += '&country=' + encodeURIComponent(country);
                }
                if (talkgroupId) {
                    url += '&talkgroup=' + encodeURIComponent(talkgroupId);
                }
                
                const response = await fetch(url, {
                    headers: {
                        'Cache-Control': 'no-cache'
                    }
                });
                const data = await response.json();
                
                const tableBody = document.getElementById('tableBody');
                
                if (data.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="4" class="no-data">' + i18n.noData + '</td></tr>';
                    updateChart([], [], []);
                    updateDurationChart([], [], []);
                } else {
                    let html = '';
                    data.forEach(item => {
                        html += '<tr>';
                        html += '<td class="talkgroup-name">' + (item.destinationName || 'N/A') + '</td>';
                        html += '<td class="talkgroup-id">' + (item.destinationId || 'N/A') + '</td>';
                        html += '<td class="count">' + (item.count || 0) + '</td>';
                        html += '<td class="duration">' + (item.totalDuration ? formatDuration(item.totalDuration) : '0 sec') + '</td>';
                        html += '</tr>';
                    });
                    tableBody.innerHTML = html;
                    
                    // Update charts
                    const labels = data.map(item => item.destinationName || 'N/A');
                    const ids = data.map(item => item.destinationId || 'N/A');
                    const counts = data.map(item => item.count || 0);
                    updateChart(labels, ids, counts);
                    
                    const sortedByDuration = [...data].sort((a, b) => (b.totalDuration || 0) - (a.totalDuration || 0));
                    const durationLabels = sortedByDuration.map(item => item.destinationName || 'N/A');
                    const durationIds = sortedByDuration.map(item => item.destinationId || 'N/A');
                    const durations = sortedByDuration.map(item => item.totalDuration || 0);
                    updateDurationChart(durationLabels, durationIds, durations);
                }
            } catch (error) {
                console.error('Error loading grouped data:', error);
                document.getElementById('tableBody').innerHTML = 
                    '<tr><td colspan="4" class="no-data">Error loading data</td></tr>';
                updateChart([], [], []);
                updateDurationChart([], [], []);
            }
        }

        // Load callsign data
        async function loadCallsignData() {
            try {
                const timeRange = document.getElementById('timeRange').value;
                const callsignSearch = document.getElementById('callsignSearch').value.trim();
                const maxEntries = document.getElementById('maxEntries').value;
                const continent = document.getElementById('continent').value;
                const countrySelect = document.getElementById('country');
                const country = (continent !== 'All' && continent !== 'Global' && countrySelect.options.length > 1) 
                    ? countrySelect.value 
                    : '';
                const talkgroupId = document.getElementById('talkgroup').value;
                
                let url = '/public/lastheard/callsigns?timeRange=' + timeRange + '&limit=' + maxEntries;
                if (callsignSearch) {
                    // Convert wildcard pattern to SQL LIKE pattern
                    const likePattern = callsignSearch.replace(/\\*/g, '%');
                    url += '&callsign=' + encodeURIComponent(likePattern);
                }
                if (continent && continent !== 'All') {
                    url += '&continent=' + encodeURIComponent(continent);
                }
                if (country) {
                    url += '&country=' + encodeURIComponent(country);
                }
                if (talkgroupId) {
                    url += '&talkgroup=' + encodeURIComponent(talkgroupId);
                }
                
                const response = await fetch(url, {
                    headers: {
                        'Cache-Control': 'no-cache'
                    }
                });
                const data = await response.json();
                
                const tableBody = document.getElementById('callsignTableBody');
                
                if (data.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="4" class="no-data">' + i18n.noData + '</td></tr>';
                } else {
                    let html = '';
                    data.forEach(item => {
                        html += '<tr>';
                        html += '<td class="talkgroup-name">' + (item.callsign || 'N/A') + '</td>';
                        html += '<td>' + (item.name || 'N/A') + '</td>';
                        html += '<td class="count">' + (item.count || 0) + '</td>';
                        html += '<td class="duration">' + (item.totalDuration ? formatDuration(item.totalDuration) : '0 sec') + '</td>';
                        html += '</tr>';
                    });
                    tableBody.innerHTML = html;
                }
            } catch (error) {
                console.error('Error loading callsign data:', error);
                document.getElementById('callsignTableBody').innerHTML = 
                    '<tr><td colspan="4" class="no-data">Error loading data</td></tr>';
            }
        }

        // Update chart with horizontal CSS bars
        function updateChart(labels, ids, data) {
            const barChart = document.getElementById('barChart');
            
            if (data.length === 0) {
                barChart.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 200px; color: #666; font-size: 18px; font-weight: bold;">' + i18n.noDataDisplay + '</div>';
                return;
            }
            
            const maxValue = Math.max(...data);
            let html = '';
            
            for (let i = 0; i < Math.min(labels.length, data.length); i++) {
                const widthPercentage = maxValue > 0 ? (data[i] / maxValue) * 100 : 0;
                const label = labels[i] + ' (' + ids[i] + ')';
                html += '<div class="bar-item">' +
                    '<div class="bar-label" title="' + label + '">' + label + '</div>' +
                    '<div class="bar-container">' +
                    '<div class="bar-fill" style="width: ' + widthPercentage + '%"></div>' +
                    '</div>' +
                    '<div class="bar-value">' + data[i] + '</div>' +
                    '</div>';
            }
            
            barChart.innerHTML = html;
        }

        // Update duration chart with horizontal CSS bars
        function updateDurationChart(labels, ids, data) {
            const durationChart = document.getElementById('durationChart');
            
            if (data.length === 0) {
                durationChart.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 200px; color: #666; font-size: 18px; font-weight: bold;">' + i18n.noDataDisplay + '</div>';
                return;
            }
            
            const maxValue = Math.max(...data);
            let html = '';
            
            for (let i = 0; i < Math.min(labels.length, data.length); i++) {
                const widthPercentage = maxValue > 0 ? (data[i] / maxValue) * 100 : 0;
                const label = labels[i] + ' (' + ids[i] + ')';
                const durationDisplay = formatDuration(data[i]);
                html += '<div class="bar-item">' +
                    '<div class="bar-label" title="' + label + '">' + label + '</div>' +
                    '<div class="bar-container">' +
                    '<div class="bar-fill" style="width: ' + widthPercentage + '%"></div>' +
                    '</div>' +
                    '<div class="bar-value">' + durationDisplay + '</div>' +
                    '</div>';
            }
            
            durationChart.innerHTML = html;
        }

        // Setup auto-refresh
        function setupAutoRefresh() {
            if (autoRefreshInterval) clearInterval(autoRefreshInterval);
            autoRefreshInterval = setInterval(() => {
                loadGroupedData();
                loadCallsignData();
            }, 10000); // 10 seconds
        }

        // Cookie utility functions for saving preferences
        function setCookie(name, value, days) {
            const expires = new Date();
            expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
            document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + expires.toUTCString() + ';path=/';
        }

        function getCookie(name) {
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            for(let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
            return null;
        }

        function savePreferences() {
            const timeRangeEl = document.getElementById('timeRange');
            const continentEl = document.getElementById('continent');
            const countryEl = document.getElementById('country');
            const maxEntriesEl = document.getElementById('maxEntries');
            const callsignSearchEl = document.getElementById('callsignSearch');
            
            if (timeRangeEl) setCookie('bm_adv_timeRange', timeRangeEl.value, 15);
            if (continentEl) setCookie('bm_adv_continent', continentEl.value, 15);
            if (countryEl) setCookie('bm_adv_country', countryEl.value, 15);
            if (maxEntriesEl) setCookie('bm_adv_maxEntries', maxEntriesEl.value, 15);
            if (callsignSearchEl) setCookie('bm_adv_callsignSearch', callsignSearchEl.value, 15);
            
            // Save selected talkgroup ID
            setCookie('bm_adv_talkgroupId', selectedTalkgroupId, 15);
        }

        function loadPreferences() {
            const timeRange = getCookie('bm_adv_timeRange');
            const continent = getCookie('bm_adv_continent');
            const country = getCookie('bm_adv_country');
            const maxEntries = getCookie('bm_adv_maxEntries');
            const talkgroupId = getCookie('bm_adv_talkgroupId');
            const callsignSearch = getCookie('bm_adv_callsignSearch');
            
            if (timeRange && document.getElementById('timeRange')) {
                document.getElementById('timeRange').value = timeRange;
            }
            if (maxEntries && document.getElementById('maxEntries')) {
                document.getElementById('maxEntries').value = maxEntries;
            }
            if (callsignSearch && document.getElementById('callsignSearch')) {
                document.getElementById('callsignSearch').value = callsignSearch;
            }
            
            return { timeRange, continent, country, maxEntries, talkgroupId, callsignSearch };
        }

        // Event listeners
        document.getElementById('timeRange').addEventListener('change', function() {
            savePreferences();
            loadGroupedData();
            loadCallsignData();
        });
        document.getElementById('continent').addEventListener('change', async function() {
            await loadCountries(this.value);
            selectedTalkgroupId = '';
            document.getElementById('talkgroupSearch').value = '';
            await loadTalkgroups(this.value, '');
            loadGroupedData();
            loadCallsignData();
            savePreferences();
        });
        document.getElementById('country').addEventListener('change', async function() {
            const continent = document.getElementById('continent').value;
            selectedTalkgroupId = '';
            document.getElementById('talkgroupSearch').value = '';
            await loadTalkgroups(continent, this.value);
            loadGroupedData();
            loadCallsignData();
            savePreferences();
        });
        document.getElementById('callsignSearch').addEventListener('input', function() {
            // Debounce the search
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                savePreferences();
                loadCallsignData();
            }, 500);
        });
        document.getElementById('maxEntries').addEventListener('change', function() {
            savePreferences();
            loadGroupedData();
            loadCallsignData();
        });
        document.getElementById('language').addEventListener('change', function() {
            const selectedLang = this.value;
            setCookie('bm_lang', selectedLang, 15);
            window.location.reload();
        });

        // Initial load
        loadContinents().then(async () => {
            // Initialize searchable dropdown
            setupSearchableDropdown();
            
            // Load saved preferences
            const savedPrefs = loadPreferences();
            
            // Set continent preference if saved
            if (savedPrefs.continent && document.getElementById('continent')) {
                const continentSelect = document.getElementById('continent');
                // Check if the saved continent option exists
                const option = Array.from(continentSelect.options).find(opt => opt.value === savedPrefs.continent);
                if (option) {
                    continentSelect.value = savedPrefs.continent;
                    // Load countries for the saved continent
                    await loadCountries(savedPrefs.continent);
                    
                    // Set country preference if saved
                    if (savedPrefs.country && document.getElementById('country')) {
                        const countrySelect = document.getElementById('country');
                        const countryOption = Array.from(countrySelect.options).find(opt => opt.value === savedPrefs.country);
                        if (countryOption) {
                            countrySelect.value = savedPrefs.country;
                            
                            // Load talkgroups for the saved country
                            await loadTalkgroups(savedPrefs.continent, savedPrefs.country);
                            
                            // Set talkgroup preference if saved
                            if (savedPrefs.talkgroupId && talkgroupsList.length > 0) {
                                const tg = talkgroupsList.find(t => t.talkgroup_id.toString() === savedPrefs.talkgroupId);
                                if (tg) {
                                    selectTalkgroup(savedPrefs.talkgroupId, tg.name);
                                }
                            }
                        }
                    }
                }
            }
            
            loadGroupedData();
            loadCallsignData();
            setupAutoRefresh();
        });
    </script>
</body>
</html>
  `);
});

module.exports = router;

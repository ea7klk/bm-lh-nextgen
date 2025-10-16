const https = require('https');
const { parse } = require('csv-parse/sync');
const { db } = require('../db/database');

// Country code to full country name mapping
const COUNTRY_NAMES = {
  'WW': 'Worldwide',
  'Global': 'Global',
  'EU': 'Europe',
  'NA': 'North America',
  'SA': 'South America',
  'AF': 'Africa',
  'AS': 'Asia',
  'OC': 'Oceania',
  'US': 'United States',
  'CA': 'Canada',
  'GB': 'United Kingdom',
  'DE': 'Germany',
  'FR': 'France',
  'ES': 'Spain',
  'IT': 'Italy',
  'NL': 'Netherlands',
  'BE': 'Belgium',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'PL': 'Poland',
  'CZ': 'Czech Republic',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'PT': 'Portugal',
  'GR': 'Greece',
  'HU': 'Hungary',
  'RO': 'Romania',
  'BG': 'Bulgaria',
  'HR': 'Croatia',
  'SI': 'Slovenia',
  'SK': 'Slovakia',
  'LT': 'Lithuania',
  'LV': 'Latvia',
  'EE': 'Estonia',
  'IE': 'Ireland',
  'LU': 'Luxembourg',
  'MT': 'Malta',
  'CY': 'Cyprus',
  'IS': 'Iceland',
  'AL': 'Albania',
  'MK': 'North Macedonia',
  'RS': 'Serbia',
  'BA': 'Bosnia and Herzegovina',
  'ME': 'Montenegro',
  'XK': 'Kosovo',
  'MD': 'Moldova',
  'UA': 'Ukraine',
  'BY': 'Belarus',
  'RU': 'Russia',
  'TR': 'Turkey',
  'IL': 'Israel',
  'SA': 'Saudi Arabia',
  'AE': 'United Arab Emirates',
  'QA': 'Qatar',
  'KW': 'Kuwait',
  'OM': 'Oman',
  'BH': 'Bahrain',
  'JO': 'Jordan',
  'LB': 'Lebanon',
  'SY': 'Syria',
  'IQ': 'Iraq',
  'IR': 'Iran',
  'PK': 'Pakistan',
  'IN': 'India',
  'BD': 'Bangladesh',
  'LK': 'Sri Lanka',
  'NP': 'Nepal',
  'AF': 'Afghanistan',
  'MM': 'Myanmar',
  'TH': 'Thailand',
  'VN': 'Vietnam',
  'LA': 'Laos',
  'KH': 'Cambodia',
  'MY': 'Malaysia',
  'SG': 'Singapore',
  'ID': 'Indonesia',
  'PH': 'Philippines',
  'BN': 'Brunei',
  'TL': 'East Timor',
  'CN': 'China',
  'TW': 'Taiwan',
  'HK': 'Hong Kong',
  'MO': 'Macau',
  'KR': 'South Korea',
  'KP': 'North Korea',
  'JP': 'Japan',
  'MN': 'Mongolia',
  'AU': 'Australia',
  'NZ': 'New Zealand',
  'FJ': 'Fiji',
  'PG': 'Papua New Guinea',
  'NC': 'New Caledonia',
  'WS': 'Samoa',
  'TO': 'Tonga',
  'VU': 'Vanuatu',
  'SB': 'Solomon Islands',
  'MX': 'Mexico',
  'GT': 'Guatemala',
  'BZ': 'Belize',
  'SV': 'El Salvador',
  'HN': 'Honduras',
  'NI': 'Nicaragua',
  'CR': 'Costa Rica',
  'PA': 'Panama',
  'BR': 'Brazil',
  'AR': 'Argentina',
  'CL': 'Chile',
  'CO': 'Colombia',
  'VE': 'Venezuela',
  'PE': 'Peru',
  'EC': 'Ecuador',
  'BO': 'Bolivia',
  'PY': 'Paraguay',
  'UY': 'Uruguay',
  'GY': 'Guyana',
  'SR': 'Suriname',
  'GF': 'French Guiana',
  'EG': 'Egypt',
  'DZ': 'Algeria',
  'MA': 'Morocco',
  'TN': 'Tunisia',
  'LY': 'Libya',
  'SD': 'Sudan',
  'SS': 'South Sudan',
  'ET': 'Ethiopia',
  'SO': 'Somalia',
  'KE': 'Kenya',
  'UG': 'Uganda',
  'TZ': 'Tanzania',
  'RW': 'Rwanda',
  'BI': 'Burundi',
  'DJ': 'Djibouti',
  'ER': 'Eritrea',
  'MG': 'Madagascar',
  'MU': 'Mauritius',
  'KM': 'Comoros',
  'SC': 'Seychelles',
  'ZA': 'South Africa',
  'NA': 'Namibia',
  'BW': 'Botswana',
  'ZW': 'Zimbabwe',
  'ZM': 'Zambia',
  'MW': 'Malawi',
  'MZ': 'Mozambique',
  'AO': 'Angola',
  'CD': 'Democratic Republic of the Congo',
  'CG': 'Republic of the Congo',
  'CF': 'Central African Republic',
  'TD': 'Chad',
  'CM': 'Cameroon',
  'GQ': 'Equatorial Guinea',
  'GA': 'Gabon',
  'ST': 'Sao Tome and Principe',
  'GH': 'Ghana',
  'NG': 'Nigeria',
  'BJ': 'Benin',
  'TG': 'Togo',
  'BF': 'Burkina Faso',
  'CI': 'Ivory Coast',
  'LR': 'Liberia',
  'SL': 'Sierra Leone',
  'GN': 'Guinea',
  'GW': 'Guinea-Bissau',
  'GM': 'Gambia',
  'SN': 'Senegal',
  'MR': 'Mauritania',
  'ML': 'Mali',
  'NE': 'Niger',
};

// Country to continent mapping
const COUNTRY_TO_CONTINENT = {
  'WW': 'Global',
  'Global': 'Global',
  'EU': 'Europe',
  'NA': 'North America',
  'SA': 'South America',
  'AF': 'Africa',
  'AS': 'Asia',
  'OC': 'Oceania',
  'US': 'North America',
  'CA': 'North America',
  'MX': 'North America',
  'GT': 'North America',
  'BZ': 'North America',
  'SV': 'North America',
  'HN': 'North America',
  'NI': 'North America',
  'CR': 'North America',
  'PA': 'North America',
  'BR': 'South America',
  'AR': 'South America',
  'CL': 'South America',
  'CO': 'South America',
  'VE': 'South America',
  'PE': 'South America',
  'EC': 'South America',
  'BO': 'South America',
  'PY': 'South America',
  'UY': 'South America',
  'GY': 'South America',
  'SR': 'South America',
  'GF': 'South America',
  'GB': 'Europe',
  'DE': 'Europe',
  'FR': 'Europe',
  'ES': 'Europe',
  'IT': 'Europe',
  'NL': 'Europe',
  'BE': 'Europe',
  'CH': 'Europe',
  'AT': 'Europe',
  'PL': 'Europe',
  'CZ': 'Europe',
  'SE': 'Europe',
  'NO': 'Europe',
  'DK': 'Europe',
  'FI': 'Europe',
  'PT': 'Europe',
  'GR': 'Europe',
  'HU': 'Europe',
  'RO': 'Europe',
  'BG': 'Europe',
  'HR': 'Europe',
  'SI': 'Europe',
  'SK': 'Europe',
  'LT': 'Europe',
  'LV': 'Europe',
  'EE': 'Europe',
  'IE': 'Europe',
  'LU': 'Europe',
  'MT': 'Europe',
  'CY': 'Europe',
  'IS': 'Europe',
  'AL': 'Europe',
  'MK': 'Europe',
  'RS': 'Europe',
  'BA': 'Europe',
  'ME': 'Europe',
  'XK': 'Europe',
  'MD': 'Europe',
  'UA': 'Europe',
  'BY': 'Europe',
  'RU': 'Europe',
  'TR': 'Asia',
  'IL': 'Asia',
  'AE': 'Asia',
  'QA': 'Asia',
  'KW': 'Asia',
  'OM': 'Asia',
  'BH': 'Asia',
  'JO': 'Asia',
  'LB': 'Asia',
  'SY': 'Asia',
  'IQ': 'Asia',
  'IR': 'Asia',
  'PK': 'Asia',
  'IN': 'Asia',
  'BD': 'Asia',
  'LK': 'Asia',
  'NP': 'Asia',
  'AF': 'Asia',
  'MM': 'Asia',
  'TH': 'Asia',
  'VN': 'Asia',
  'LA': 'Asia',
  'KH': 'Asia',
  'MY': 'Asia',
  'SG': 'Asia',
  'ID': 'Asia',
  'PH': 'Asia',
  'BN': 'Asia',
  'TL': 'Asia',
  'CN': 'Asia',
  'TW': 'Asia',
  'HK': 'Asia',
  'MO': 'Asia',
  'KR': 'Asia',
  'KP': 'Asia',
  'JP': 'Asia',
  'MN': 'Asia',
  'AU': 'Oceania',
  'NZ': 'Oceania',
  'FJ': 'Oceania',
  'PG': 'Oceania',
  'NC': 'Oceania',
  'WS': 'Oceania',
  'TO': 'Oceania',
  'VU': 'Oceania',
  'SB': 'Oceania',
  'EG': 'Africa',
  'DZ': 'Africa',
  'MA': 'Africa',
  'TN': 'Africa',
  'LY': 'Africa',
  'SD': 'Africa',
  'SS': 'Africa',
  'ET': 'Africa',
  'SO': 'Africa',
  'KE': 'Africa',
  'UG': 'Africa',
  'TZ': 'Africa',
  'RW': 'Africa',
  'BI': 'Africa',
  'DJ': 'Africa',
  'ER': 'Africa',
  'MG': 'Africa',
  'MU': 'Africa',
  'KM': 'Africa',
  'SC': 'Africa',
  'ZA': 'Africa',
  'NA': 'Africa',
  'BW': 'Africa',
  'ZW': 'Africa',
  'ZM': 'Africa',
  'MW': 'Africa',
  'MZ': 'Africa',
  'AO': 'Africa',
  'CD': 'Africa',
  'CG': 'Africa',
  'CF': 'Africa',
  'TD': 'Africa',
  'CM': 'Africa',
  'GQ': 'Africa',
  'GA': 'Africa',
  'ST': 'Africa',
  'GH': 'Africa',
  'NG': 'Africa',
  'BJ': 'Africa',
  'TG': 'Africa',
  'BF': 'Africa',
  'CI': 'Africa',
  'LR': 'Africa',
  'SL': 'Africa',
  'GN': 'Africa',
  'GW': 'Africa',
  'GM': 'Africa',
  'SN': 'Africa',
  'MR': 'Africa',
  'ML': 'Africa',
  'NE': 'Africa',
};

// Fetch CSV data from a URL using https
function fetchCSV(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch CSV: ${res.statusCode}`));
        return;
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Update talkgroups from Brandmeister CSV
async function updateTalkgroups() {
  console.log('Updating talkgroups from Brandmeister...');

  try {
    // Fetch CSV data from Brandmeister
    // The CSV URL is typically at https://brandmeister.network/talkgroups.csv
    // However, since we can't access it directly, we'll try common patterns
    const csvUrl = 'https://brandmeister.network/talkgroups.csv';
    
    let csvData;
    try {
      csvData = await fetchCSV(csvUrl);
    } catch (fetchError) {
      console.error('Failed to fetch from primary URL, trying alternative...');
      // Try alternative URL pattern
      const altUrl = 'https://api.brandmeister.network/v2/talkgroups/csv';
      csvData = await fetchCSV(altUrl);
    }

    // Parse CSV data
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`Parsed ${records.length} talkgroups from CSV`);

    // Begin transaction for better performance
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO talkgroups (
        talkgroup_id, name, country, continent, full_country_name, last_updated
      ) VALUES (?, ?, ?, ?, ?, strftime('%s', 'now'))
    `);

    const transaction = db.transaction((talkgroups) => {
      for (const tg of talkgroups) {
        // Extract talkgroup data
        // CSV columns may vary, but typically include: id, name, country
        const talkgroupId = parseInt(tg.id || tg.talkgroup_id || tg.TalkgroupID);
        const name = tg.name || tg.Name || '';
        const country = tg.country || tg.Country || tg.callsign || '';

        // Skip invalid records
        if (!talkgroupId || isNaN(talkgroupId)) {
          continue;
        }

        // Get full country name and continent
        const fullCountryName = COUNTRY_NAMES[country] || country;
        const continent = COUNTRY_TO_CONTINENT[country] || 
                         (country === 'Global' ? 'Global' : null);

        insertStmt.run(talkgroupId, name, country, continent, fullCountryName);
      }
    });

    transaction(records);

    console.log('Talkgroups updated successfully');
    return { success: true, count: records.length };
  } catch (error) {
    console.error('Error updating talkgroups:', error.message);
    return { success: false, error: error.message };
  }
}

// Get all talkgroups
function getAllTalkgroups() {
  try {
    const stmt = db.prepare('SELECT * FROM talkgroups ORDER BY talkgroup_id');
    return stmt.all();
  } catch (error) {
    console.error('Error fetching talkgroups:', error);
    return [];
  }
}

// Get talkgroup by ID
function getTalkgroupById(talkgroupId) {
  try {
    const stmt = db.prepare('SELECT * FROM talkgroups WHERE talkgroup_id = ?');
    return stmt.get(talkgroupId);
  } catch (error) {
    console.error('Error fetching talkgroup:', error);
    return null;
  }
}

// Get talkgroups by continent
function getTalkgroupsByContinent(continent) {
  try {
    const stmt = db.prepare('SELECT * FROM talkgroups WHERE continent = ? ORDER BY talkgroup_id');
    return stmt.all(continent);
  } catch (error) {
    console.error('Error fetching talkgroups by continent:', error);
    return [];
  }
}

// Get talkgroups by country
function getTalkgroupsByCountry(country) {
  try {
    const stmt = db.prepare('SELECT * FROM talkgroups WHERE country = ? ORDER BY talkgroup_id');
    return stmt.all(country);
  } catch (error) {
    console.error('Error fetching talkgroups by country:', error);
    return [];
  }
}

module.exports = {
  updateTalkgroups,
  getAllTalkgroups,
  getTalkgroupById,
  getTalkgroupsByContinent,
  getTalkgroupsByCountry,
};

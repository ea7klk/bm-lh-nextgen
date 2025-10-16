const https = require('https');
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

// Fetch JSON data from a URL using https
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch JSON: ${res.statusCode}`));
        return;
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (parseError) {
          reject(new Error(`Failed to parse JSON: ${parseError.message}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

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

// Update talkgroups from Brandmeister JSON API
async function updateTalkgroups() {
  console.log('Updating talkgroups from Brandmeister...');

  try {
    // Fetch talkgroups data from Brandmeister JSON API
    const jsonUrl = 'https://api.brandmeister.network/v2/talkgroup';
    
    let talkgroupsData;
    try {
      talkgroupsData = await fetchJSON(jsonUrl);
    } catch (fetchError) {
      console.error('Failed to fetch talkgroups from JSON API:', fetchError.message);
      throw fetchError;
    }

    // Convert JSON object to array of records
    const records = [];
    for (const [talkgroupId, name] of Object.entries(talkgroupsData)) {
      // Skip invalid talkgroup IDs or names
      const id = parseInt(talkgroupId);
      if (!id || isNaN(id) || !name || typeof name !== 'string') {
        continue;
      }
      
      records.push({
        id: id,
        name: name.trim(),
        talkgroup_id: id
      });
    }

    console.log(`Parsed ${records.length} talkgroups from JSON API`);

    // Begin transaction for better performance
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO talkgroups (
        talkgroup_id, name, country, continent, full_country_name, last_updated
      ) VALUES (?, ?, ?, ?, ?, strftime('%s', 'now'))
    `);

    const transaction = db.transaction((talkgroups) => {
      for (const tg of talkgroups) {
        // Extract talkgroup data from JSON format
        const talkgroupId = tg.id;
        const name = tg.name || '';
        
        // Determine country from talkgroup ID
        let country = 'Global';
        
        // Apply Brandmeister talkgroup numbering scheme logic
        if (talkgroupId >= 1 && talkgroupId <= 99) {
          // System talkgroups (1-99)
          country = 'Global';
        } else if (talkgroupId >= 900 && talkgroupId <= 999) {
          // Worldwide talkgroups (900-999)
          country = 'Global';
        } else if (talkgroupId >= 8000 && talkgroupId <= 8999) {
          // Regional talkgroups (8000-8999)
          country = 'Global';
        } else if (talkgroupId >= 9000 && talkgroupId <= 9999) {
          // Worldwide talkgroups (9000-9999)
          country = 'Global';
        } else {
          // Country-specific talkgroups
          const tgString = talkgroupId.toString();
          if (tgString.length >= 3) {
            // Extract country code from first 3 digits for country-specific talkgroups
            const countryCode = tgString.substring(0, 3);
            
            // Map common country codes
            const countryMappings = {
              '202': 'GR', '204': 'NL', '206': 'BE', '208': 'FR', '214': 'ES',
              '216': 'HU', '218': 'BA', '219': 'HR', '220': 'RS', '222': 'IT',
              '226': 'RO', '228': 'CH', '230': 'CZ', '231': 'SK', '232': 'AT',
              '235': 'GB', '238': 'DK', '240': 'SE', '242': 'NO', '244': 'FI',
              '246': 'LT', '247': 'LV', '248': 'EE', '262': 'DE', '268': 'PT',
              '270': 'LU', '272': 'IE', '274': 'IS', '302': 'CA', '310': 'US',
              '311': 'US', '312': 'US', '313': 'US', '314': 'US', '315': 'US',
              '316': 'US', '317': 'US', '318': 'US', '319': 'US', '334': 'MX',
              '440': 'JP', '450': 'KR', '454': 'HK', '460': 'CN', '505': 'AU',
              '510': 'ID', '520': 'TH', '525': 'SG', '530': 'NZ', '655': 'ZA',
              '724': 'BR', '730': 'CL', '732': 'CO', '734': 'VE'
            };
            
            country = countryMappings[countryCode] || 'Unknown';
          }
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

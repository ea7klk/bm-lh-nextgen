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
  
  // Additional country names for countries missing continent assignment
  'AD': 'Andorra',
  'AM': 'Armenia',
  'AZ': 'Azerbaijan', 
  'BS': 'Bahamas',
  'CU': 'Cuba',
  'CW': 'Curaçao',
  'DO': 'Dominican Republic',
  'FO': 'Faroe Islands',
  'GD': 'Grenada',
  'GE': 'Georgia',
  'HT': 'Haiti',
  'JM': 'Jamaica',
  'KZ': 'Kazakhstan',
  'LC': 'Saint Lucia',
  'LI': 'Liechtenstein',
  'PR': 'Puerto Rico',
  'RE': 'Réunion',
  'SM': 'San Marino',
  'TC': 'Turks and Caicos Islands',
  'TT': 'Trinidad and Tobago',
  
  // Additional countries identified from NULL continent analysis
  'BY': 'Belarus',
  'TW': 'Taiwan',
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
  
  // Additional mappings for countries missing continent assignment
  'AD': 'Europe',     // Andorra
  'AM': 'Asia',       // Armenia  
  'AZ': 'Asia',       // Azerbaijan
  'BS': 'North America', // Bahamas
  'CU': 'North America', // Cuba
  'CW': 'North America', // Curaçao
  'DO': 'North America', // Dominican Republic
  'FO': 'Europe',     // Faroe Islands
  'GD': 'North America', // Grenada
  'GE': 'Asia',       // Georgia
  'HT': 'North America', // Haiti
  'JM': 'North America', // Jamaica
  'KZ': 'Asia',       // Kazakhstan
  'LC': 'North America', // Saint Lucia
  'LI': 'Europe',     // Liechtenstein
  'PR': 'North America', // Puerto Rico
  'RE': 'Africa',     // Réunion (French territory)
  'SM': 'Europe',     // San Marino
  'TC': 'North America', // Turks and Caicos Islands
  'TT': 'North America', // Trinidad and Tobago
  
  // Additional countries identified from NULL continent analysis
  'BY': 'Europe',      // Belarus
  'TW': 'Asia',        // Taiwan
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
        if (talkgroupId >= 46600 && talkgroupId <= 46699) {
          // Taiwan talkgroups (466xx) - check this first
          country = 'TW';
        } else if (talkgroupId >= 250000 && talkgroupId <= 250999) {
          // Russia talkgroups (250xx) - check this first
          country = 'RU';
        } else if (talkgroupId >= 1 && talkgroupId <= 99) {
          // System talkgroups (1-99)
          country = 'Global';
        } else if (talkgroupId >= 900 && talkgroupId <= 999) {
          // Worldwide talkgroups (900-999)
          country = 'Global';
        } else if (talkgroupId >= 8000 && talkgroupId <= 8999) {
          // Regional talkgroups (8000-8999)
          country = 'Global';
        } else if (talkgroupId >= 9000 && talkgroupId <= 99999) {
          // Worldwide talkgroups (9000-99999) - expanded range for all 9xxxx
          country = 'Global';
        } else {
          // Country-specific talkgroups
          const tgString = talkgroupId.toString();
          if (tgString.length >= 3) {
            // Extract country code from first 3 digits for country-specific talkgroups
            const countryCode = tgString.substring(0, 3);
            
            // For longer talkgroup IDs, also check 2-digit and 4+ digit patterns
            let countryCode2 = '';
            let countryCode4 = '';
            if (tgString.length >= 2) {
              countryCode2 = tgString.substring(0, 2);
            }
            if (tgString.length >= 4) {
              countryCode4 = tgString.substring(0, 4);
            }
            
            // Comprehensive country code mapping based on ITU-T E.212 and DMR-MARC
            const countryMappings = {
              // European countries
              '202': 'GR', '204': 'NL', '206': 'BE', '208': 'FR', '213': 'AD',
              '214': 'ES', '216': 'HU', '218': 'BA', '219': 'HR', '220': 'RS',
              '222': 'IT', '226': 'RO', '228': 'CH', '230': 'CZ', '231': 'SK',
              '232': 'AT', '235': 'GB', '238': 'DK', '240': 'SE', '242': 'NO',
              '244': 'FI', '246': 'LT', '247': 'LV', '248': 'EE', '255': 'UA',
              '259': 'MD', '260': 'PL', '262': 'DE', '263': 'DE', '264': 'DE',
              '265': 'DE', '268': 'PT', '270': 'LU', '272': 'IE', '274': 'IS',
              '276': 'AL', '278': 'MT', '280': 'CY', '282': 'GE', '283': 'AM',
              '284': 'BG', '286': 'TR', '288': 'FO', '292': 'SM', '293': 'SI',
              '294': 'MK', '295': 'LI', '297': 'ME',
              
              // North American countries
              '302': 'CA', '310': 'US', '311': 'US', '312': 'US', '313': 'US',
              '314': 'US', '315': 'US', '316': 'US', '317': 'US', '318': 'US',
              '319': 'US', '330': 'PR', '334': 'MX', '338': 'JM', '352': 'GD',
              '358': 'LC', '362': 'CW', '364': 'BS', '368': 'CU', '370': 'DO',
              '372': 'HT', '374': 'TT', '376': 'TC',
              
              // Asian and Middle Eastern countries
              '400': 'AZ', '401': 'KZ', '404': 'IN', '410': 'PK', '415': 'LB',
              '420': 'SA', '422': 'OM', '425': 'IL', '426': 'BH', '427': 'QA',
              '430': 'AE', '440': 'JP', '450': 'KR', '452': 'VN', '454': 'HK',
              '460': 'CN', '470': 'BD', '502': 'MY', '505': 'AU', '510': 'ID',
              '515': 'PH', '520': 'TH', '525': 'SG', '530': 'NZ',
              
              // African countries
              '602': 'EG', '604': 'MA', '655': 'ZA',
              
              // South American countries
              '704': 'GT', '706': 'SV', '708': 'HN', '710': 'NI', '712': 'CR',
              '714': 'PA', '716': 'PE', '722': 'AR', '724': 'BR', '730': 'CL',
              '732': 'CO', '734': 'VE', '740': 'EC', '748': 'UY',
              
              // Special codes for multi-country regions
              '899': 'Global', // Repeater Testing
              '907': 'Global', // JOTA
              '910': 'DE',     // German language
              '913': 'Global', // English language
              '914': 'Global', // Spanish language
              '915': 'Global', // Portuguese language
              '916': 'Global', // Italian language
              '918': 'Global', // YOTA
              '920': 'DE',     // DL, OE, HB9
              '922': 'NL',     // Dutch language
              '923': 'Global', // European English
              '924': 'SE',     // Swedish language
              '927': 'Global', // Nordic
              '930': 'GR',     // PanHellenic Chat
              '937': 'FR',     // Francophonie
              '940': 'Global', // Arabic language
              '955': 'Global', // WWYL
              '969': 'Global', // DMR-Caribbean
              '971': 'ES',     // Basque
              '973': 'Global', // SOTA
              
              // 4+ digit patterns for regional/local talkgroups
              '2020': 'GR', // Greece regional
              '2040': 'NL', // Netherlands regional  
              '2060': 'BE', // Belgium regional
              '2080': 'FR', // France regional
              '2140': 'ES', // Spain regional
              '2160': 'HU', // Hungary regional
              '2180': 'BA', // Bosnia regional
              '2190': 'HR', // Croatia regional
              '2200': 'RS', // Serbia regional
              '2220': 'IT', // Italy regional
              '2260': 'RO', // Romania regional
              '2280': 'CH', // Switzerland regional
              '2300': 'CZ', // Czech regional
              '2310': 'SK', // Slovakia regional
              '2320': 'AT', // Austria regional
              '2350': 'GB', // UK regional
              '2380': 'DK', // Denmark regional
              '2400': 'SE', // Sweden regional
              '2410': 'SE', // Sweden DCS
              '2411': 'SE', // Sweden Tactical
              '2412': 'SE', // Sweden Tac 2
              '2415': 'SE', // Sweden DCS010V
              '2420': 'NO', // Norway regional
              '2440': 'FI', // Finland regional
              '2460': 'LT', // Lithuania regional
              '2470': 'LV', // Latvia regional
              '2480': 'EE', // Estonia regional
              '2500': 'RU', // Russia (special)
              '2501': 'RU', // Russia Global
              '2502': 'RU', // Russia Bridge
              '2503': 'RU', // Russia DSTAR
              '2504': 'RU', // Russia EchoLink
              '2505': 'RU', // Russia Bridge
              '2506': 'RU', // Russia Bridge
              '2507': 'RU', // Russia regional
              '2550': 'UA', // Ukraine regional
              '2555': 'UA', // Ukraine bridge
              '2559': 'UA', // Ukraine emergency
              '2570': 'BY', // Belarus regional
              '2590': 'MD', // Moldova regional
              '2599': 'MD', // Moldova bridge
              '2600': 'PL', // Poland regional
              '2620': 'DE', // Germany regional
              '2630': 'DE', // Germany multi
              '2640': 'DE', // Germany regional
              '2650': 'DE', // Germany emergency
              '2680': 'PT', // Portugal regional
              '2700': 'LU', // Luxembourg regional
              '2720': 'IE', // Ireland regional
              '2740': 'IS', // Iceland regional
              '2780': 'MT', // Malta regional
              '2800': 'CY', // Cyprus regional
              '2820': 'GE', // Georgia regional
              '2830': 'AM', // Armenia regional
              '2840': 'BG', // Bulgaria regional
              '2860': 'TR', // Turkey regional
              '2880': 'FO', // Faroe Islands regional
              '2920': 'SM', // San Marino regional
              '2930': 'SI', // Slovenia regional
              '2940': 'MK', // North Macedonia regional
              '2950': 'LI', // Liechtenstein regional
              '2970': 'ME', // Montenegro regional
              
              // North America 4+ digit
              '3020': 'CA', // Canada regional
              '3100': 'US', // USA regional
              '3300': 'PR', // Puerto Rico regional
              '3340': 'MX', // Mexico regional
              
              // Asia 4+ digit
              '4000': 'AZ', // Azerbaijan regional
              '4010': 'KZ', // Kazakhstan regional
              '4040': 'IN', // India regional
              '4100': 'PK', // Pakistan regional
              '4150': 'LB', // Lebanon regional
              '4200': 'SA', // Saudi Arabia regional
              '4220': 'OM', // Oman regional
              '4250': 'IL', // Israel regional
              '4260': 'BH', // Bahrain regional
              '4270': 'QA', // Qatar regional
              '4300': 'AE', // UAE regional
              '4400': 'JP', // Japan regional
              '4415': 'JP', // Japan shounanYSF
              '4500': 'KR', // South Korea regional
              '4520': 'VN', // Vietnam regional
              '4540': 'HK', // Hong Kong regional
              '4600': 'CN', // China regional
              '4660': 'TW', // Taiwan regional
              '4700': 'BD', // Bangladesh regional
              '5020': 'MY', // Malaysia regional
              '5050': 'AU', // Australia regional
              '5100': 'ID', // Indonesia regional
              '5150': 'PH', // Philippines regional
              '5200': 'TH', // Thailand regional
              '5250': 'SG', // Singapore regional
              '5300': 'NZ', // New Zealand regional
              
              // Africa 4+ digit
              '6020': 'EG', // Egypt regional
              '6040': 'MA', // Morocco regional
              '6470': 'RE', // Reunion (France)
              '6471': 'RE', // La Réunion
              '6550': 'ZA', // South Africa regional
              
              // South America 4+ digit
              '7040': 'GT', // Guatemala regional
              '7060': 'SV', // El Salvador regional
              '7080': 'HN', // Honduras regional
              '7100': 'NI', // Nicaragua regional
              '7120': 'CR', // Costa Rica regional
              '7140': 'PA', // Panama regional
              '7160': 'PE', // Peru regional
              '7220': 'AR', // Argentina regional
              '7240': 'BR', // Brazil regional
              '7300': 'CL', // Chile regional
              '7320': 'CO', // Colombia regional
              '7340': 'VE', // Venezuela regional
              '7400': 'EC', // Ecuador regional
              '7480': 'UY', // Uruguay regional
              
              // UK specific patterns
              '2348': 'GB', // UK-TMO
              '2349': 'GB', // UK East Anglia
              
              // Russia 5+ digit patterns
              '2507': 'RU', // Russia extended
              '25070': 'RU', // Russia regional extended
              
              // Special global/multi-national talkgroups
              '9322': 'Global', // 9-DACH (Germany, Austria, Switzerland)
              '9515': 'Global', // Global NorCal 5150
              '9791': 'Global', // Red Américas EMCOM
              '9800': 'Global', // Various 98xxx global talkgroups
              '9801': 'Global',
              '9802': 'Global', 
              '9753': 'Global', // 9-PLDMO
              '9838': 'Global', // 9-TETRA
            };
            
            // Try 4-digit match first, then 3-digit, then 2-digit
            country = countryMappings[countryCode4] || 
                     countryMappings[countryCode] || 
                     countryMappings[countryCode2] || 
                     'Unknown';
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

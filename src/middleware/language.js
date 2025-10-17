const i18n = require('../config/i18n');

// Language codes mapping
const LANGUAGE_MAP = {
  'en': 'en',
  'en-us': 'en',
  'en-gb': 'en',
  'es': 'es',
  'es-es': 'es',
  'es-mx': 'es',
  'de': 'de',
  'de-de': 'de',
  'de-at': 'de',
  'de-ch': 'de',
  'fr': 'fr',
  'fr-fr': 'fr',
  'fr-ca': 'fr',
  'fr-be': 'fr',
  'fr-ch': 'fr'
};

const SUPPORTED_LOCALES = ['en', 'es', 'de', 'fr'];

function detectLanguage(req) {
  // 1. Check if language is set in cookie
  if (req.cookies && req.cookies.bm_lang && SUPPORTED_LOCALES.includes(req.cookies.bm_lang)) {
    return req.cookies.bm_lang;
  }

  // 2. Check query parameter (for manual language switching)
  if (req.query && req.query.lang && SUPPORTED_LOCALES.includes(req.query.lang)) {
    return req.query.lang;
  }

  // 3. Detect from Accept-Language header
  const acceptLanguage = req.headers['accept-language'];
  if (acceptLanguage) {
    const languages = acceptLanguage.split(',').map(lang => {
      const parts = lang.split(';');
      const code = parts[0].trim().toLowerCase();
      return code;
    });

    for (const lang of languages) {
      // Try exact match first
      if (LANGUAGE_MAP[lang]) {
        return LANGUAGE_MAP[lang];
      }
      
      // Try language prefix match (e.g., 'es' from 'es-AR')
      const prefix = lang.split('-')[0];
      if (LANGUAGE_MAP[prefix]) {
        return LANGUAGE_MAP[prefix];
      }
    }
  }

  // 4. Fallback to English
  return 'en';
}

function languageMiddleware(req, res, next) {
  const detectedLang = detectLanguage(req);
  
  // Set the locale for this request
  req.setLocale(detectedLang);
  
  // Store language in res.locals for easy access in routes
  res.locals.locale = detectedLang;
  
  // Add a helper function to get language name and flag
  res.locals.getLanguageInfo = function(code) {
    const info = {
      'en': { name: 'English', flag: '🇬🇧' },
      'es': { name: 'Español', flag: '🇪🇸' },
      'de': { name: 'Deutsch', flag: '🇩🇪' },
      'fr': { name: 'Français', flag: '🇫🇷' }
    };
    return info[code] || info['en'];
  };
  
  // Add a helper to set language cookie
  res.setLanguageCookie = function(lang) {
    if (SUPPORTED_LOCALES.includes(lang)) {
      res.cookie('bm_lang', lang, {
        maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
        httpOnly: false, // Allow JavaScript to read it
        sameSite: 'lax'
      });
    }
  };
  
  next();
}

module.exports = {
  languageMiddleware,
  detectLanguage,
  SUPPORTED_LOCALES
};

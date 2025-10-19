/**
 * Generate language selector HTML for dropdown
 */
function generateLanguageSelector(currentLang, __) {
  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  let options = '';
  languages.forEach(lang => {
    const selected = lang.code === currentLang ? 'selected' : '';
    options += `<option value="${lang.code}" ${selected}>${lang.flag} ${lang.name}</option>`;
  });

  return options;
}

/**
 * Get current language info
 */
function getCurrentLanguageInfo(currentLang) {
  const languages = {
    'en': { name: 'English', flag: '🇬🇧' },
    'es': { name: 'Español', flag: '🇪🇸' },
    'de': { name: 'Deutsch', flag: '🇩🇪' },
    'fr': { name: 'Français', flag: '🇫🇷' }
  };
  return languages[currentLang] || languages['en'];
}

/**
 * Generate Matomo tracking script
 */
function generateMatomoScript() {
  const MATOMO_ENABLED = process.env.MATOMO_ENABLED === 'true';
  const MATOMO_URL = process.env.MATOMO_URL;
  const MATOMO_SITE_ID = process.env.MATOMO_SITE_ID;
  
  if (!MATOMO_ENABLED || !MATOMO_URL || !MATOMO_SITE_ID) {
    return '';
  }
  
  return '<!-- Matomo Analytics -->' +
    '<script>' +
    'var _paq = window._paq = window._paq || [];' +
    '_paq.push([\'trackPageView\']);' +
    '_paq.push([\'enableLinkTracking\']);' +
    '(function() {' +
    'var u="' + MATOMO_URL + '/";' +
    '_paq.push([\'setTrackerUrl\', u+\'matomo.php\']);' +
    '_paq.push([\'setSiteId\', \'' + MATOMO_SITE_ID + '\']);' +
    'var d=document, g=d.createElement(\'script\'), s=d.getElementsByTagName(\'script\')[0];' +
    'g.async=true; g.src=u+\'matomo.js\'; s.parentNode.insertBefore(g,s);' +
    '})();' +
    '</script>' +
    '<!-- End Matomo Analytics -->';
}

module.exports = {
  generateLanguageSelector,
  getCurrentLanguageInfo,
  generateMatomoScript
};

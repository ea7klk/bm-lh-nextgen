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

module.exports = {
  generateLanguageSelector,
  getCurrentLanguageInfo
};

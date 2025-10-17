const i18n = require('i18n');
const path = require('path');

i18n.configure({
  locales: ['en', 'es', 'de', 'fr'],
  defaultLocale: 'en',
  directory: path.join(__dirname, '../../locales'),
  cookie: 'bm_lang',
  queryParameter: 'lang',
  autoReload: true,
  updateFiles: false,
  syncFiles: false,
  objectNotation: true,
  api: {
    __: '__',
    __n: '__n'
  }
});

module.exports = i18n;

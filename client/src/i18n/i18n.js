import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from '../../../locales/en.json';
import es from '../../../locales/es.json';
import de from '../../../locales/de.json';
import fr from '../../../locales/fr.json';

// Get saved language from cookie or default to 'en'
const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
};

const savedLanguage = getCookie('bm_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      de: { translation: de },
      fr: { translation: fr },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

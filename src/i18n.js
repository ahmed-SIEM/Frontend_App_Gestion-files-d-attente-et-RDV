import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './locales/fr.json';
import ar from './locales/ar.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      ar: { translation: ar },
    },
    fallbackLng: 'fr',
    lng: localStorage.getItem('filezen_lang') || 'fr',
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage'], lookupLocalStorage: 'filezen_lang' },
  });

// Applique la direction RTL/LTR sur le document au demarrage
const applyDir = (lang) => {
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
};
applyDir(i18n.language);
i18n.on('languageChanged', applyDir);

export default i18n;

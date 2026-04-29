import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Bouton de changement de langue FR / AR
 * Gere automatiquement le RTL pour l'arabe
 */
export default function LanguageSwitcher({ variant = 'default' }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const toggle = () => {
    const next = isAr ? 'fr' : 'ar';
    i18n.changeLanguage(next);
    localStorage.setItem('filezen_lang', next);
  };

  if (variant === 'minimal') {
    return (
      <button
        onClick={toggle}
        className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
        title={isAr ? 'Passer en Français' : 'التحويل للعربية'}
      >
        {isAr ? 'FR' : 'ع'}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:border-blue-400 hover:shadow-sm transition-all text-sm font-medium text-gray-700 hover:text-blue-600 select-none"
      title={isAr ? 'Passer en Français' : 'التحويل للعربية'}
    >
      {/* Globe icon */}
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>

      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={i18n.language}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.15 }}
          className="min-w-[36px] text-center"
          style={{ fontFamily: isAr ? "'Noto Sans Arabic', Arial, sans-serif" : undefined }}
        >
          {isAr ? 'FR' : 'عربي'}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { User, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function AccountTypePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-5xl"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="inline-flex items-center space-x-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-2xl">F</span>
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FileZen
              </span>
            </Link>
            <LanguageSwitcher />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('account_type.title')}
          </h1>
          <p className="text-xl text-gray-600">{t('account_type.subtitle')}</p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Citoyen */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer border-2 border-transparent hover:border-blue-600 h-full">
              <Link to="/signup/citoyen" className="block h-full">
                <div className="flex flex-col items-center text-center h-full">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center mb-6 shadow-lg">
                    <User className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('account_type.citizen.title')}</h2>
                  <p className="text-gray-600 mb-8 flex-grow">{t('account_type.citizen.desc')}</p>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500">
                    {t('account_type.citizen.btn')}
                  </Button>
                </div>
              </Link>
            </Card>
          </motion.div>

          {/* Etablissement */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer border-2 border-transparent hover:border-purple-600 h-full">
              <Link to="/signup/etablissement" className="block h-full">
                <div className="flex flex-col items-center text-center h-full">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-purple-400 rounded-full flex items-center justify-center mb-6 shadow-lg">
                    <Building2 className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('account_type.establishment.title')}</h2>
                  <p className="text-gray-600 mb-8 flex-grow">{t('account_type.establishment.desc')}</p>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-700 hover:to-purple-500">
                    {t('account_type.establishment.btn')}
                  </Button>
                </div>
              </Link>
            </Card>
          </motion.div>
        </div>

        {/* Footer link */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            {t('account_type.already_account')}{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              {t('account_type.login')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

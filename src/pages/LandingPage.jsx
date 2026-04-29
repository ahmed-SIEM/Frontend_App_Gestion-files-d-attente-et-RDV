import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Building2, Clock, TrendingUp, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const stats = [
    { value: '150+', label: t('landing.stats.partners') },
    { value: '50K+', label: t('landing.stats.citizens') },
    { value: '2h',   label: t('landing.stats.time_saved') },
    { value: '98%',  label: t('landing.stats.satisfaction') },
  ];

  const features = [
    { icon: Clock,      title: t('landing.features.queue.title'),   description: t('landing.features.queue.desc') },
    { icon: Building2,  title: t('landing.features.rdv.title'),     description: t('landing.features.rdv.desc') },
    { icon: TrendingUp, title: t('landing.features.realtime.title'), description: t('landing.features.realtime.desc') },
  ];

  const steps = [
    { number: '1', title: t('landing.how.step1.title'), description: t('landing.how.step1.desc') },
    { number: '2', title: t('landing.how.step2.title'), description: t('landing.how.step2.desc') },
    { number: '3', title: t('landing.how.step3.title'), description: t('landing.how.step3.desc') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white" style={{ fontFamily: isAr ? "'Noto Sans Arabic', Arial, sans-serif" : undefined }}>

      {/* ── Navigation ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FileZen
              </span>
            </div>

            {/* Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#accueil"        className="text-gray-700 hover:text-blue-600 transition-colors">{t('nav.home')}</a>
              <a href="#fonctionnalites" className="text-gray-700 hover:text-blue-600 transition-colors">{t('nav.features')}</a>
              <a href="#etablissements" className="text-gray-700 hover:text-blue-600 transition-colors">{t('nav.establishments')}</a>
              <a href="#contact"        className="text-gray-700 hover:text-blue-600 transition-colors">{t('nav.contact')}</a>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Link to="/login">
                <Button variant="outline">{t('nav.login')}</Button>
              </Link>
              <Link to="/account-type">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  {t('nav.start')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────────── */}
      <section id="accueil" className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 opacity-60" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
                {t('landing.hero.title1')}{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t('landing.hero.title2')}
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">{t('landing.hero.subtitle')}</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/account-type">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto">
                    {t('landing.hero.cta_primary')}
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  {t('landing.hero.cta_secondary')}
                </Button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <img
                src="https://images.unsplash.com/photo-1519248200454-8f2590ed22b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBxdWV1ZSUyMG1hbmFnZW1lbnR8ZW58MXx8fHwxNzcyMTAwNjM0fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="FileZen App"
                className="rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>

          {/* Search */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="mt-16">
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <Search className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6`} />
                <input
                  type="text"
                  placeholder={t('landing.hero.search_placeholder')}
                  className={`w-full ${isAr ? 'pr-14 pl-4' : 'pl-14 pr-4'} py-5 rounded-2xl border border-gray-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg`}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────────── */}
      <section id="fonctionnalites" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('landing.features.title')}</h2>
            <p className="text-xl text-gray-600">{t('landing.features.subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-8 hover:shadow-xl transition-shadow duration-300 border-2 border-blue-600 rounded-xl text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('landing.how.title')}</h2>
            <p className="text-xl text-gray-600">{t('landing.how.subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-3xl font-bold text-white">{step.number}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-blue-600 to-purple-600" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">{t('landing.cta.title')}</h2>
            <p className="text-xl text-white/90 mb-8">{t('landing.cta.subtitle')}</p>
            <Link to="/account-type">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100 font-bold shadow-lg">
                {t('landing.cta.button')}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────────── */}
      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">F</span>
                </div>
                <span className="text-2xl font-bold">FileZen</span>
              </div>
              <p className="text-gray-400">{t('landing.footer.tagline')}</p>
            </div>
            <div>
              <h3 className="font-bold mb-4">{t('landing.footer.product')}</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.features')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.pricing')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.docs')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">{t('landing.footer.company')}</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.about')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.blog')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.careers')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">{t('landing.footer.support')}</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.help')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.contact')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.terms')}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 flex items-center justify-center gap-4">
            <p>&copy; 2026 FileZen. {t('landing.footer.rights')}</p>
            <LanguageSwitcher variant="minimal" />
          </div>
        </div>
      </footer>
    </div>
  );
}

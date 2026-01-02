import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';


export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 backdrop-blur-md"
    >
      <Languages className="w-4 h-4 text-indigo-400" />
      <span className="text-sm font-bold uppercase tracking-wider text-slate-200">
        {i18n.language === 'vi' ? 'EN' : 'VI'}
      </span>
    </button>
  );
};
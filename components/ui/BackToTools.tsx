import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BackToTools: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/')} 
      className="flex gap-2 justify-between items-center"
    >
      <ArrowLeftIcon className="w-4 h-4 text-indigo-400" />
      <span className="text-sm font-bold tracking-wider text-slate-200">
        {t('common.backToTools')}
      </span>
    </button>
  );
};

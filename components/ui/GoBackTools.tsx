import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon } from 'lucide-react';

interface GoBackToolsProps {
  onClick?: () => void;
}

export const GoBackTools: React.FC<GoBackToolsProps> = ({ onClick }) => {
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      className="flex gap-2 justify-between items-center"
    >
      <ArrowLeftIcon className="w-4 h-4 text-indigo-400" />
      <span className="text-sm font-bold tracking-wider text-slate-200">
        {t('common.backToTools')}
      </span>
    </button>
  );
};

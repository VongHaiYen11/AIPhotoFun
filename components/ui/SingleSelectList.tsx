import React from 'react';
import { useTranslation } from 'react-i18next';

interface SingleSelectListProps {
  keys: string[];                  
  feature: string;    
  categories?: string;       
  value: string | null;           
  onChange: (key: string) => void; 
}

export const SingleSelectList: React.FC<SingleSelectListProps> = ({
  categories,
  keys,
  feature,
  value,
  onChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="w-full flex flex-col">
      <h3 className="text-white mb-4 font-semibold">
        {categories ? t(`${feature}.${categories}`) : ""}
      </h3>
      <div className="flex flex-wrap gap-2 w-full">
        {keys.map((key) => {
          const rawLabel = `${feature}.${key}`;
          const translatedLabel = t(rawLabel);
          const label = translatedLabel === rawLabel ? key : translatedLabel;
          const isSelected = value === key;

          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`
                min-w-[100px]
                px-4 py-2 rounded-lg
                transition
                whitespace-nowrap
                ${isSelected 
                  ? 'bg-white text-black font-semibold' 
                  : 'bg-white/5 text-white/70 hover:bg-white/10'}
              `}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>

  );
};

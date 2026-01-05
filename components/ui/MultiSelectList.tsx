import React from 'react';
import { useTranslation } from 'react-i18next';

interface MultiSelectListProps {
  keys: string[];
  feature: string;
  categories?: string;           // optional, nếu muốn group
  value: string[];               // array từ state cha
  onChange: (keys: string[]) => void; // callback update state cha
}

export const MultiSelectList: React.FC<MultiSelectListProps> = ({
  keys,
  feature,
  categories,
  value,
  onChange,
}) => {
  const { t } = useTranslation();

  const handleClick = (key: string) => {
    if (value.includes(key)) {
      onChange(value.filter(k => k !== key)); // bỏ ra nếu đã có
    } else {
      onChange([...value, key]); // thêm vào nếu chưa có
    }
  };

  return (
    <div className="w-full flex flex-col mb-4">
      {categories && (
        <h3 className="text-white mb-4 font-semibold">
          {t(`${feature}.${categories}`)}
        </h3>
      )}

      <div className="flex flex-wrap gap-2">
        {keys.map((key) => {
          const rawLabel = `${feature}.${key}`;
          const translatedLabel = t(rawLabel);
          const label = translatedLabel === rawLabel ? key : translatedLabel;
          const isSelected = value.includes(key);

          return (
            <button
              key={key}
              onClick={() => handleClick(key)}
              className={`
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

import React from 'react';
import { useTranslation } from 'react-i18next';

interface RefinePanelProps {
  value: string;
  onChange: (value: string) => void;
  onApplyAll: () => void;
  width?: number; // px
}

export const RefinePanel: React.FC<RefinePanelProps> = ({
  value,
  onChange,
  onApplyAll,
  width,
}) => {
  const { t } = useTranslation();

  return (
    <div
      style={width ? { width } : undefined}
      className="
        w-full
        rounded-2xl
        border border-white/10
        bg-neutral-900
        p-6
        text-white
      "
    >
      {/* TITLE */}
      <h3 className="text-lg font-semibold mb-4">
        {t('common.regenerate')}
      </h3>

      {/* TEXTAREA */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('common.refinePlaceholder')}
        className="
          min-w-[300px]
          w-full
          min-h-[80px]
          resize-none
          rounded-xl
          bg-neutral-800
          border border-white/10
          px-4 py-3
          text-sm
          text-white
          placeholder:text-white/40
          focus:outline-none
          focus:border-white/30
        "
      />

      {/* HELP TEXT */}
      <p className="mt-2 text-sm text-white/40">
        {t('common.refineWarning')}
      </p>

      {/* ACTION */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={onApplyAll}
          className="
            px-6 py-2
            rounded-full
            bg-white
            text-black
            text-sm
            font-semibold
            hover:bg-white/90
            transition
          "
        >
          {t('common.refineLabel')}
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BackToTools } from '../../components/ui/BackToTools';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { RefinePanel } from '../../components/ui/RefinePanel';
import { ImageResultHolder } from '../../components/ui/ImageResultHolder';
import { GoBackTools } from '../../components/ui/GoBackTools';

export const OutfitExtractor: React.FC = () => {
  const { t } = useTranslation();

  // true = upload step, false = result step
  const [status, setStatus] = useState<boolean>(true);

  // Lưu ảnh dưới dạng base64
  const [imageBase64, setImageBase64] = useState<string>('');

  // Loading state khi upload
  const [isLoading, setIsLoading] = useState(false);

  const [refineText, setRefineText] = useState('');

  // Reset
  const resetAll = () => {
    setStatus(true);
    setImageBase64('');
    setIsLoading(false);
    setRefineText('');
  };

  return (
    <div className="w-full max-w-7xl px-6 md:px-12 py-12 flex flex-col items-center text-white">
      {/* Top bar */}
      <div className="w-full flex justify-between mb-8">
        {status ? (
          <BackToTools />
        ) : (
          <GoBackTools
            onClick={() => {
              setStatus(true); // quay lại màn input
              resetAll();      // reset các state khác
            }}
          />
        )}
        <LanguageSwitcher />
      </div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
          {t('app.outfitExtractorTitle')}
        </h1>
        <p className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto">
          {t('outfitExtractor.subtitle')}
        </p>
      </motion.div>

      {status ? (
        /* ================= UPLOAD STEP ================= */
        <div
          className="
            w-full
            max-w-3xl
            bg-white/[0.04]
            backdrop-blur-xl
            border
            border-white/50
            rounded-2xl
            p-8
            flex
            flex-col
            gap-2
          "
        >
          <p className="text-3xl font-bold text-center">
            {t('outfitExtractor.step1Title')}
          </p>
          <p className="text-sm text-white/50 text-center mb-2"> 
            {t('outfitExtractor.step1Desc')}
          </p>

          <ImageUpload
            value={imageBase64}
            onChange={(base64) => {
              setImageBase64(base64);
              setStatus(false); // tự nhảy qua màn result khi có ảnh
            }}
            isLoading={isLoading}
            label={t('outfitExtractor.dropImage')}
            className="w-full h-96"
          />
        </div>
      ) : (
        /* ================= RESULT STEP ================= */
        <div className="w-full max-w-5xl flex flex-col gap-8 items-center">
          {/* UPLOADED IMAGE */}
          <ImageResultHolder
            imageUrl={imageBase64}
            name={t('outfitExtractor.extractedOutfit')}
            width={300}           // optional, width của khung
            showDownload={false}   // có hiện nút download
            showRegenerate={false} // có hiện nút regenerate
          />

          <RefinePanel
            value={refineText}
            width={500}
            onChange={setRefineText}
            onApplyAll={() => {
              console.log('Apply instruction:', refineText);
              // gọi API regenerate ở đây
            }}
          />

          {/* ACTIONS */}
          <div className="flex items-center gap-4 mt-4">
            <button
              className="
                px-6 py-3
                bg-white
                text-black
                rounded-lg
                font-semibold
                hover:bg-white/90
                transition
                flex
                items-center
                gap-2
              "
            >
              {t('common.download')}
            </button>

            {/* Start Over */}
            <button
              className="
                px-6 py-3
                border
                border-white/20
                rounded-lg
                text-white/70
                font-semibold
                transition
                hover:bg-white/10
                hover:text-white
              "
              onClick={resetAll}
            >
              {t('common.startOver')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BackToTools } from '../ui/BackToTools';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { ImageUpload } from '../ui/ImageUpload';
import { GoBackTools } from '../ui/GoBackTools';
import { StepAccordion } from '../ui/StepAccordion';
import { SideImageLoader } from '../ui/SideImageLoader';
import { SingleSelectList } from '../ui/SingleSelectList';
import { MultiSelectList } from '../ui/MultiSelectList';
import { PolaroidCard } from '../ui/PolaroidCard';
import { ImageResultHolder } from '../ui/ImageResultHolder';
import { useNavigate } from 'react-router-dom';
import { RefinePanel } from '../ui/RefinePanel';
import { X } from 'lucide-react';


export const PhotoBooth: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [status, setStatus] = useState<boolean>(true) // true = input, false = result

  // Ảnh đang thao tác
  const [currentImage, setCurrentImage] = useState<string | undefined>();

  const [selectedNumPhotos, setSelectedNumPhotos] = useState<string | undefined>();

  const numberOfPhotos = ['photos_4', 'photos_6', 'photos_8', 'photos_9', 'photos_12']
  const prefixednumberOfPhotos = numberOfPhotos.map(sz => `numberOfPhotos.${sz}`)


  const resetAll = () => {
    // General
    setStatus(true);
    // Images
    setCurrentImage(undefined);
    // Options
    setSelectedNumPhotos(undefined);
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
          {t('app.photoBoothTitle')}
        </h1>

        <p className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto">
          {t('photoBooth.subtitle')}
        </p>
      </motion.div>

      {
        status ?  
          <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* STEP 1 */}
            <div className="w-full md:col-span-1">
              <div className="bg-white/[0.04] backdrop-blur-xl border border-white/50 rounded-3xl p-8 mb-8">
                <h2 className="text-xl font-bold mb-6 text-center">
                  {t('photoBooth.uploadTitle')}
                </h2>

                <ImageUpload
                  value={currentImage}
                  height="h-100"
                  onChange={(base64) => {
                    setCurrentImage(base64);
                  }}
                  onRemove={() => setCurrentImage(undefined)}
                />
              </div>
            </div>

            {/* STEP 2–5 */}
            <div 
              aria-disabled={!currentImage}
              className={`
              rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl
              h-fit
              px-6
              py-6
              flex 
              flex-col
              items-start
              w-full 
              md:col-span-1
              ${!currentImage
              ? 'opacity-50 cursor-not-allowed pointer-events-none'
              : 'cursor-pointer'}
            `}>
                <h2 className="text-xl font-bold mb-4 text-center">
                  {t('photoBooth.optionsTitle')}
                </h2>
                <SingleSelectList
                  feature="photoBooth"
                  keys={prefixednumberOfPhotos}
                  value={selectedNumPhotos}
                  onChange={setSelectedNumPhotos}
                  categories="photoCount"
                />
                {/* Generate Photos */}
                <button
                  className="
                    mt-4
                    w-full
                    px-6 py-3
                    bg-white text-black
                    rounded-lg
                    font-semibold
                    hover:bg-white/90
                    transition
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                  disabled={selectedNumPhotos === undefined}
                  onClick={() => setStatus(false)}
                >
                  {t(`photoBooth.generateButton`)}
                </button>
            </div>
          </div> :

          <div className="flex flex-col gap-6 items-center">
            <div className="flex gap-6 content-start">
              <ImageResultHolder
                imageUrl={currentImage}
                name={t('photoBooth.resultTitle')}
                width={360}           // optional, width của khung
                showDownload={false}   // có hiện nút download
                showRegenerate={false} // có hiện nút regenerate
              />
            </div>


            <div className="flex items-center gap-4">
              {/* Generate Photos */}
              <button
                className="
                  px-6 py-3
                  bg-white text-black
                  rounded-lg
                  font-semibold
                  hover:bg-white/90
                  transition
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                {t(`common.downloadAll`)}
              </button>
              {/* Start Over */}
              <button
                className="
                  px-6 py-3
                  border border-white/20
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
      }

    </div>
  );
};

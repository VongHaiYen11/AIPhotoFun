import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BackToTools } from '../../components/ui/BackToTools';
import { GoBackTools } from '../../components/ui/GoBackTools';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { MultiSelectList } from '../../components/ui/MultiSelectList';
import { ImageResultHolder } from '../../components/ui/ImageResultHolder';
import { useNavigate } from 'react-router-dom';


export const ProductSceneGenerator: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [status, setStatus] = useState<boolean>(true) // true = input, false = result

  // Ảnh đang thao tác
  const [currentImage, setCurrentImage] = useState<string | undefined>();

  const [selectedCameraAngle, setSelectedCameraAngle] = useState<string[]>([]);

  const cameraAngle = ['front', 'back', 'side_left', 'side_right', 'top', 'bottom', 'three_quarter', 'close_up', 'in_context']
  const prefixedAngles = cameraAngle.map(angle => `angles.${angle}`);


  const resetAll = () => {
    // General
    setStatus(true);
    // Images
    setCurrentImage(undefined);
    // Options
    setSelectedCameraAngle([]);
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
          {t('app.productSceneGeneratorTitle')}
        </h1>

        <p className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto">
          {t('productSceneGenerator.subtitle')}
        </p>
      </motion.div>

      {
        status ?  
          <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* STEP 1 */}
            <div className="w-full md:col-span-1">
              <div className="bg-white/[0.04] backdrop-blur-xl border border-white/50 rounded-3xl p-8 mb-8">
                <h2 className="text-xl font-bold mb-6 text-center">
                  {t('productSceneGenerator.step1Title')}
                </h2>

                <ImageUpload
                  value={currentImage}
                  height="h-120"
                  onChange={(base64) => {
                    setCurrentImage(base64);
                  }}
                  onRemove={() => setCurrentImage(undefined)}
                />
                <div className="mt-6 flex flex-col gap-3">
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15
                              text-white placeholder-white/40 resize-none
                              focus:outline-none focus:border-white"
                    placeholder={t('photoshoot.modelGenPlaceholder')}
                  />

                  <button className="w-full px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-white/90">
                    {t('photoshoot.generateModel')}
                  </button>
                </div>
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
              md:col-span-2
              ${!currentImage
              ? 'opacity-50 cursor-not-allowed pointer-events-none'
              : 'cursor-pointer'}
            `}>
                <h2 className="text-xl font-bold mb-4 text-center">
                  {t('productSceneGenerator.step2Title')}
                </h2>
                <p className="text-sm text-white/50 mb-4">{t('productSceneGenerator.step2Desc')}</p>
                <MultiSelectList
                  feature="productSceneGenerator"
                  keys={prefixedAngles}
                  value={selectedCameraAngle}
                  onChange={setSelectedCameraAngle}
                />

              <div className="flex w-full items-center justify-between">
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
                  disabled={selectedCameraAngle.length === 0}
                  onClick={() => setStatus(false)}
                >
                  {`${t(`photoshoot.generateButton`)} (${selectedCameraAngle.length})`}
                </button>
              </div>

            </div>
          </div> :

          <div className="flex flex-col gap-6 items-center">
            <div className="flex gap-6 content-start">
              <ImageResultHolder
                imageUrl={currentImage}
                name="Original"
                width={360}
              />
              <ImageResultHolder
                imageUrl={currentImage}
                name="Original"
                width={360}
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
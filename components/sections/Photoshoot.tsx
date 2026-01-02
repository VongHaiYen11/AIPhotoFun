import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BackToTools } from '../ui/BackToTools';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { ImageUpload } from '../ui/ImageUpload';
import { StepAccordion } from '../ui/StepAccordion';
import { SideImageLoader } from '../ui/SideImageLoader';

export const Photoshoot: React.FC = () => {
  const { t } = useTranslation();

  // Ảnh đang thao tác
  const [currentImage, setCurrentImage] = useState<string | undefined>();

  // Thư viện ảnh
  const [modelLibrary, setModelLibrary] = useState<string[]>([]);

  // Mode
  const [mode, setMode] = useState<'Upload' | 'Generate'>('Upload');

  const [openStep, setOpenStep] = useState<number | null>(2);

  const toggleStep = (step: number) => {
    setOpenStep((prev) => (prev === step ? null : step));
  };

  // STEP 2 – Assets
  const [outputImage, setOutputImage] = useState<string | undefined>();
  const [objectImage, setObjectImage] = useState<string | undefined>();
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>();


  return (
    <div className="w-full max-w-7xl px-6 md:px-12 py-12 flex flex-col items-center text-white">
      {/* Top bar */}
      <div className="w-full flex justify-between mb-8">
        <BackToTools />
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
          {t('app.photoshootTitle')}
        </h1>

        <p className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto">
          {t('photoshoot.subtitle')}
        </p>
      </motion.div>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* STEP 1 */}
      <div className="w-full md:col-span-1">
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/50 rounded-3xl p-8 mb-8">
          <h2 className="text-xl font-bold mb-6 text-center">
            {t('photoshoot.step1Title')}
          </h2>

          <ImageUpload
            value={currentImage}
            height="h-80"
            onChange={(base64) => {
              setCurrentImage(base64);
              setModelLibrary((prev) =>
                prev.includes(base64) ? prev : [...prev, base64]
              );
            }}
            onRemove={() => setCurrentImage(undefined)}
          />
        </div>

        {/* TOGGLE */}
        <div className="inline-flex bg-white/5 rounded-xl p-1 border border-white/20 w-full">
          <button
            onClick={() => setMode('Upload')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition
              ${mode === 'Upload'
                ? 'bg-white text-black'
                : 'text-white/70 hover:bg-white/10'}
            `}
          >
            {t('photoshoot.uploadTab')}
          </button>

          <button
            onClick={() => setMode('Generate')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition
              ${mode === 'Generate'
                ? 'bg-white text-black'
                : 'text-white/70 hover:bg-white/10'}
            `}
          >
            {t('photoshoot.generateTab')}
          </button>
        </div>

        {/* CONTENT */}
        {mode === 'Upload' && (
          <div className="text-sm mt-6 p-6 rounded-2xl bg-white/5 text-white/80 text-center">
            {t('photoshoot.uploadInstructions')}
          </div>
        )}

        {mode === 'Generate' && (
          <div className="mt-6 flex flex-col gap-3">
            <textarea
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15
                         text-white placeholder-white/40 resize-none
                         focus:outline-none focus:border-white"
              placeholder={t('photoshoot.modelGenPlaceholder')}
            />

            <button className="w-full px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-white/90">
              {t('photoshoot.generateModel')}
            </button>
          </div>
        )}

        {/* MODEL LIBRARY */}
        <div className="mt-8 w-full">
          <h3 className="text-2xl font-bold mb-6">
            Model Library
          </h3>

          {modelLibrary.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {modelLibrary.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImage(img)}
                    className="
                      relative
                      w-24 h-24
                      rounded-lg
                      bg-white/5
                      border border-white/15
                      flex items-center justify-center
                      hover:border-white/40
                      transition
                      group
                    "
                  >
                    <img
                      src={img}
                      alt={`Model ${index + 1}`}
                      className="max-w-full max-h-full object-contain"
                    />

                    {/* REMOVE BUTTON */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();

                        setModelLibrary((prev) =>
                          prev.filter((_, i) => i !== index)
                        );

                        if (currentImage === img) {
                          setCurrentImage(undefined);
                        }
                      }}
                      className="
                        absolute top-1 right-1
                        w-5 h-5
                        rounded-full
                        bg-black/70
                        text-white
                        text-xs
                        opacity-0
                        group-hover:opacity-100
                        transition
                        hover:bg-black
                      "
                    >
                      ×
                    </button>
                  </button>

              ))}
            </div>
          ) : (
            <div
              className="
                w-full
                py-8
                rounded-xl
                border border-slate-900/15
                bg-white/5
                text-center
                text-sm
                text-white/50
              "
            >
              {t('photoshoot.libraryEmpty')}
            </div>
          )}
        </div>
      </div>

      {/* STEP 2–5 */}
      <div className="w-full md:col-span-2">
        <div className="w-full flex flex-col gap-4">
            <StepAccordion
              title={t('photoshoot.step2Title')}
              subtitle={t('photoshoot.step2Desc')}
              isOpen={openStep === 2}
              onToggle={() => toggleStep(2)}
            >
              <div className="flex flex-col gap-6">
                {/* OUTPUT */}
                <div className="flex flex-col gap-2">
                  <h5 className="font-semibold text-sm text-white/80">
                    Output
                  </h5>

                  {outputImage ? (
                    <div className="relative w-32 h-32 rounded-lg border border-white/20 bg-white/5 overflow-hidden">
                      <img
                        src={outputImage}
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={() => setOutputImage(undefined)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs hover:bg-black"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <SideImageLoader
                      width={128}
                      height={128}
                      onClick={() => {
                        // sau này mở modal upload
                      }}
                    />
                  )}
                </div>

                {/* OBJECT */}
                <div className="flex flex-col gap-2">
                  <h5 className="font-semibold text-sm text-white/80">
                    Object
                  </h5>

                  {objectImage ? (
                    <div className="relative w-32 h-32 rounded-lg border border-white/20 bg-white/5 overflow-hidden">
                      <img
                        src={objectImage}
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={() => setObjectImage(undefined)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs hover:bg-black"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <SideImageLoader width={128} height={128} />
                  )}
                </div>

                {/* BACKGROUND */}
                <div className="flex flex-col gap-2">
                  <h5 className="font-semibold text-sm text-white/80">
                    Background
                  </h5>

                  {backgroundImage ? (
                    <div className="relative w-32 h-32 rounded-lg border border-white/20 bg-white/5 overflow-hidden">
                      <img
                        src={backgroundImage}
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={() => setBackgroundImage(undefined)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs hover:bg-black"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <SideImageLoader width={128} height={128} />
                  )}
                </div>
              </div>
            </StepAccordion>


          <StepAccordion
            title={t('photoshoot.step3Title')}
            subtitle={t('photoshoot.step3Desc')}
            isOpen={openStep === 3}
            onToggle={() => toggleStep(3)}
          >
            Nội dung Step 3.  
            Ví dụ: chọn ánh sáng, background, tone màu.
          </StepAccordion>

          <StepAccordion
            title={t('photoshoot.step4Title')}
            subtitle={t('photoshoot.step4Desc')}
            isOpen={openStep === 4}
            onToggle={() => toggleStep(4)}
          >
            Nội dung Step 4.  
            Ví dụ: góc máy, pose, framing.
          </StepAccordion>

          <StepAccordion
            title={t('photoshoot.step5Title')}
            subtitle={t('photoshoot.step5Desc')}
            isOpen={openStep === 5}
            onToggle={() => toggleStep(5)}
          >
            Nội dung Step 5.  
            Ví dụ: preview, generate button, download.
          </StepAccordion>
        </div>
      </div>
      </div>
    </div>
  );
};

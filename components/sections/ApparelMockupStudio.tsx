import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BackToTools } from '../ui/BackToTools';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { ImageUpload } from '../ui/ImageUpload';
import { StepAccordion } from '../ui/StepAccordion';
import { SideImageLoader } from '../ui/SideImageLoader';
import { SingleSelectList } from '../ui/SingleSelectList';
import { MultiSelectList } from '../ui/MultiSelectList';
import { PolaroidCard } from '../ui/PolaroidCard';
import { ImageResultHolder } from '../ui/ImageResultHolder';
import { useNavigate } from 'react-router-dom';
import { GoBackTools } from '../ui/GoBackTools';
import { RefinePanel } from '../ui/RefinePanel';
import { X } from 'lucide-react';


export const ApparelMockupStudio: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [status, setStatus] = useState<boolean>(true) // true = input, false = result

  const [AIDesignerPrompt, setAIDesignerPrompt] = useState<string>('');
  const [styleDescPrompt, setStyleDescPrompt] = useState<string>('');

  // Ảnh đang thao tác
  const [currentImage, setCurrentImage] = useState<string | undefined>();

  const [uploadedMockup, setuploadedMockup] = useState<string | undefined>();

  const [selectedMockup, setSelectedMockup] = useState<string | null>('hanging');

  const mockupStyle = ['hanging', 'flatLay', 'folded']

  // Mode
  const [mode, setMode] = useState<'Upload' | 'Generate'>('Generate');

  const [hexInput, setHexInput] = useState('#FFFFFF');
  const [colorways, setColorways] = useState<string[]>(['#FFFFFF', '#18181b']);

  const isValidHex = (hex: string) =>
  /^#([0-9A-Fa-f]{6})$/.test(hex);

  const resetAll = () => {
    // General
    setStatus(true);
    // Images
    setCurrentImage(undefined);
    // Options
    setSelectedMockup('hanging');
    setAIDesignerPrompt('');
    setStyleDescPrompt('')
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
          {t('app.apparelMockupStudioTitle')}
        </h1>

        <p className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto">
          {t('productMockupGenerator.subtitle')}
        </p>
      </motion.div>

      {
        status ?  
        <div className="flex flex-col items-center content-center">
          <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* STEP 1 */}
            <div className="w-full md:col-span-1">
              <div className="bg-white/[0.04] backdrop-blur-xl border border-white/50 rounded-3xl p-8 mb-8">
                <h2 className="text-xl font-bold mb-6 text-center">
                  {t('productMockupGenerator.inputs')}
                </h2>

                <ImageUpload
                  value={currentImage}
                  height="h-80"
                  onChange={(base64) => {
                    setCurrentImage(base64);
                  }}
                  onRemove={() => setCurrentImage(undefined)}
                />

                <div className="mt-6 flex flex-col gap-3">
                  <h4 className="font-semibold">
                    {t('productMockupGenerator.aiGraphicDesigner')}
                  </h4>
                  <textarea
                    value={AIDesignerPrompt} 
                    onChange={(e) => setAIDesignerPrompt(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15
                              text-white placeholder-white/40 resize-none
                              focus:outline-none focus:border-white"
                    placeholder={t('productMockupGenerator.aiGraphicDesignerPlaceholder')}
                  />

                  <button className="w-full mt-2 px-6 py-2 rounded-xl bg-white text-black font-semibold hover:bg-white/90">
                    {t('productMockupGenerator.generateWithAI')}
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
              gap-4
              items-start
              w-full 
              md:col-span-1
              ${!currentImage
              ? 'opacity-50 cursor-not-allowed pointer-events-none'
              : 'cursor-pointer'}
            `}>
                <h2 className="text-xl font-bold">
                  {t('productMockupGenerator.designSettings')}
                </h2>
                <div
                  className={`
                  rounded-xl border border-white/20 bg-white/5 backdrop-blur-xl
                  h-fit
                  px-4
                  py-4
                  flex 
                  flex-col
                  items-start
                  w-full 
                `}
                >
                  <h3 className="font-bold mb-4">
                    {t('productMockupGenerator.apparelDetails')}
                  </h3>

                  {/* TOGGLE */}
                  <div className="inline-flex bg-white/5 rounded-xl p-1 border border-white/20 w-full">
                    <button
                      onClick={() => setMode('Generate')}
                      className={`flex-1 px-4 py-2 rounded-lg font-semibold transition
                        ${mode === 'Generate'
                          ? 'bg-white text-black'
                          : 'text-white/70 hover:bg-white/10'}
                      `}
                    >
                      {t('productMockupGenerator.generateMockups')}
                    </button>

                    <button
                      onClick={() => setMode('Upload')}
                      className={`flex-1 px-4 py-2 rounded-lg font-semibold transition
                        ${mode === 'Upload'
                          ? 'bg-white text-black'
                          : 'text-white/70 hover:bg-white/10'}
                      `}
                    >
                      {t('productMockupGenerator.uploadMockup')}
                    </button>

                  </div>

                  {/* APPAREL DETAILS OPTIONS */}
                  {mode === 'Upload' && (
                    <div className=" mt-6 p-6 rounded-2xl bg-white/5 text-white/80">
                      <h4 className="font-semibold text-white/10"> {t('productMockupGenerator.uploadApparelMockup')}</h4>
                        <SideImageLoader
                          value={uploadedMockup}
                          onChange={setuploadedMockup}
                          onRemove={() => setuploadedMockup(undefined)}
                          fullWidth
                        />
                    </div>
                  )}

                  {mode === 'Generate' && (
                    <div className="mt-6 flex flex-col">
                      <h4 className="font-semibold text-white mb-3"> {t('productMockupGenerator.apparelStyle')}</h4>
                      <textarea
                        value={styleDescPrompt} 
                        onChange={(e) => setStyleDescPrompt(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 mb-2 rounded-xl bg-white/5 border border-white/15
                                  text-white placeholder-white/40 resize-none
                                  focus:outline-none focus:border-white"
                        placeholder={t('productMockupGenerator.apparelStylePlaceholder')}
                      />
                      <p className=" text-white/40 mb-3" >
                        {t('productMockupGenerator.apparelStyleDesc')}
                      </p>
                      <div className="w-full">
                        <h4 className="font-semibold text-white"> {t('productMockupGenerator.mockupStyle')}</h4>
                        <SingleSelectList
                          feature="productMockupGenerator"
                          keys={mockupStyle}  
                          value={selectedMockup}
                          onChange={(key) => setSelectedMockup(key)}
                        />
                      </div>

                    </div>
                  )}
                </div>

                <div
                  className="
                    rounded-xl
                    border border-white/20
                    bg-white/5
                    backdrop-blur-xl
                    h-fit
                    px-4
                    py-4
                    flex
                    flex-col
                    gap-4
                    w-full
                  "
                >
                  {/* TITLE */}
                  <div>
                    <h3 className="font-bold mb-1">
                      {t('productMockupGenerator.colorwayGenerator')}
                    </h3>
                    <p className="text-white/40 text-sm">
                      {t('productMockupGenerator.colorwayGeneratorDesc')}
                    </p>
                  </div>

                  {/* INPUT + ADD */}
                  <div className="flex gap-2 w-full">
                    <input
                      value={hexInput}
                      onChange={(e) => setHexInput(e.target.value.toUpperCase())}
                      placeholder="#FFFFFF"
                      className="
                        flex-1
                        px-4 py-3
                        rounded-lg
                        bg-white/10
                        border border-white/20
                        text-white
                        placeholder-white/40
                        focus:outline-none
                        focus:border-white/40
                      "
                    />

                    <button
                      disabled={!isValidHex(hexInput)}
                      onClick={() => {
                        if (!isValidHex(hexInput)) return;
                        if (colorways.includes(hexInput)) return;

                        setColorways((prev) => [...prev, hexInput]);
                        setHexInput('#');
                      }}
                      className="
                        px-6
                        rounded-lg
                        bg-white/20
                        text-white
                        font-semibold
                        hover:bg-white/30
                        transition
                        disabled:opacity-40
                        disabled:cursor-not-allowed
                      "
                    >
                      Add
                    </button>
                  </div>

                  {/* COLOR LIST */}
                  <div className="flex flex-wrap gap-2">
                    {colorways.map((hex) => (
                      <div
                        key={hex}
                        className="
                          flex items-center gap-2
                          px-3 py-2
                          rounded-full
                          bg-white/10
                          border border-white/20
                        "
                      >
                        {/* COLOR DOT */}
                        <div
                          className="w-5 h-5 rounded-full border border-white/30"
                          style={{ backgroundColor: hex }}
                        />

                        {/* HEX TEXT */}
                        <span className="text-sm font-medium">
                          {hex}
                        </span>

                        {/* REMOVE */}
                        <button
                          onClick={() =>
                            setColorways((prev) => prev.filter((c) => c !== hex))
                          }
                          className="
                            ml-1
                            text-white/40
                            hover:text-white
                            transition
                          "
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

            </div>

          </div> 
            <div className="w-fit mt-4">
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
                disabled={colorways.length === 0}
                onClick={() => setStatus(false)}
              >
                {t('productMockupGenerator.generateColorways', {
                  count: colorways.length,
                })}
              </button>
            </div>
          </div>:
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
                onClick={() => {
                  setStatus(true)
                  resetAll()
                }}
              >
                {t('common.startOver')}
              </button>

            </div>
          </div>
      }

    </div>
  );
};

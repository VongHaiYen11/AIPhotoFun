import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BackToTools } from '../../components/ui/BackToTools';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { SideImageLoader } from '../../components/ui/SideImageLoader';
import { SingleSelectList } from '../../components/ui/SingleSelectList';
import { ImageResultHolder } from '../../components/ui/ImageResultHolder';
import { useNavigate } from 'react-router-dom';
import { GoBackTools } from '../../components/ui/GoBackTools';
import { useApparelMockupStudio } from './useApparelMockupStudio';
import { generateGraphicFromPrompt, generateApparelMockup, generateProductMockup } from '../../services/geminiServices';
import { Loader2 } from 'lucide-react';


export const ApparelMockupStudio: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    status, setStatus,
    currentImage, setCurrentImage,
    AIDesignerPrompt, setAIDesignerPrompt,
    styleDescPrompt, setStyleDescPrompt,
    mode, setMode,
    uploadedMockup, setuploadedMockup,
    selectedMockup, setSelectedMockup,
    hexInput, setHexInput,
    colorways, setColorways
  } = useApparelMockupStudio();

  // Local state for generation status and results
  const [isGeneratingDesign, setIsGeneratingDesign] = useState(false);
  const [isGeneratingMockups, setIsGeneratingMockups] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<Array<{url: string, name: string}>>([]);


  const mockupStyle = ['hanging', 'flatLay', 'folded']

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
    setStyleDescPrompt('');
    // Results
    setGeneratedResults([]);
    setIsGeneratingDesign(false);
    setIsGeneratingMockups(false);
  };

  const handleGenerateDesign = async () => {
    if (!AIDesignerPrompt.trim()) return;

    setIsGeneratingDesign(true);
    try {
      const url = await generateGraphicFromPrompt(AIDesignerPrompt);
      setCurrentImage(url);
    } catch (error) {
      console.error("Design generation failed:", error);
      alert("Failed to generate design. Please try again.");
    } finally {
      setIsGeneratingDesign(false);
    }
  };

  const handleGenerateMockups = async () => {
    // Validation
    if (!currentImage) {
      alert("Please upload or generate a design first.");
      return;
    }
    if (mode === 'Upload' && !uploadedMockup) {
      alert("Please upload an apparel mockup image.");
      return;
    }
    if (mode === 'Generate' && !styleDescPrompt.trim()) {
      alert("Please describe the apparel style.");
      return;
    }

    setStatus(false);
    setIsGeneratingMockups(true);
    setGeneratedResults([]);

    try {
      if (mode === 'Upload' && uploadedMockup) {
        // Mode 1: Custom Mockup (Apply design to uploaded image)
        // We generate a single result for the uploaded mockup
        const url = await generateProductMockup(currentImage, uploadedMockup);
        setGeneratedResults([{ url, name: 'Custom Mockup' }]);
      } else {
        // Mode 2: Generative Mockup (Create new apparel from scratch)
        // Iterate through colorways
        const colorsToGenerate = colorways.length > 0 ? colorways : ['#FFFFFF']; // Default to white if empty

        for (const color of colorsToGenerate) {
          const prompt = `${styleDescPrompt}. Color hex code: ${color}. Mockup style: ${selectedMockup}.`;
          try {
             const url = await generateApparelMockup(currentImage, prompt);
             setGeneratedResults(prev => [...prev, { url, name: color }]);
          } catch (e) {
             console.error(`Failed to generate for color ${color}`, e);
          }
        }
      }
    } catch (error) {
      console.error("Mockup generation failed:", error);
      alert("Failed to generate mockups.");
    } finally {
      setIsGeneratingMockups(false);
    }
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
              // resetAll();   // Do not reset all, user might want to tweak settings
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
        <div className="flex flex-col items-center content-center w-full">
          <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* STEP 1 */}
            <div className="w-full md:col-span-1">
              <div className="bg-white/[0.04] backdrop-blur-xl border border-white/50 rounded-3xl p-8 mb-8 h-full">
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
                  label={t('productMockupGenerator.uploadDesign')}
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
                    disabled={isGeneratingDesign}
                  />

                  <button 
                    onClick={handleGenerateDesign}
                    disabled={!AIDesignerPrompt.trim() || isGeneratingDesign}
                    className="w-full mt-2 px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGeneratingDesign ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('productMockupGenerator.generating')}
                      </>
                    ) : (
                      t('productMockupGenerator.generateWithAI')
                    )}
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
              transition-opacity
              ${!currentImage
              ? 'opacity-50 pointer-events-none'
              : 'opacity-100'}
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
                  <div className="inline-flex bg-white/5 rounded-xl p-1 border border-white/20 w-full mb-4">
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
                    <div className="w-full mt-2 p-6 rounded-2xl bg-white/5 text-white/80 border border-white/10">
                      <h4 className="font-semibold text-white mb-3"> {t('productMockupGenerator.uploadApparelMockup')}</h4>
                        <SideImageLoader
                          value={uploadedMockup}
                          onChange={setuploadedMockup}
                          onRemove={() => setuploadedMockup(undefined)}
                          fullWidth
                          className="h-64"
                        />
                    </div>
                  )}

                  {mode === 'Generate' && (
                    <div className="mt-2 flex flex-col w-full">
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
                      <p className=" text-white/40 mb-3 text-sm" >
                        {t('productMockupGenerator.apparelStyleDesc')}
                      </p>
                      <div className="w-full mt-2">
                        <h4 className="font-semibold text-white mb-2"> {t('productMockupGenerator.mockupStyle')}</h4>
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

                {/* COLORWAY GENERATOR (Visible mostly for Generate mode, but disabled if Upload) */}
                <div
                  className={`
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
                    transition-opacity
                    ${mode === 'Upload' ? 'opacity-50 pointer-events-none' : 'opacity-100'}
                  `}
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
                      {t('productMockupGenerator.add')}
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
            <div className="w-fit mt-8">
              {/* Generate Photos */}
              <button
                className="
                  px-8 py-4
                  bg-white text-black
                  rounded-xl
                  font-bold
                  text-lg
                  hover:bg-white/90
                  transition
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  shadow-xl
                  flex items-center gap-3
                "
                disabled={
                    !currentImage ||
                    (mode === 'Generate' && colorways.length === 0) ||
                    (mode === 'Upload' && !uploadedMockup)
                }
                onClick={handleGenerateMockups}
              >
                 {t('productMockupGenerator.generateColorways', {
                  count: mode === 'Upload' ? 1 : colorways.length,
                })}
              </button>
            </div>
          </div>:
          <div className="flex flex-col gap-6 items-center w-full max-w-6xl">
            
            {/* RESULTS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {generatedResults.map((result, idx) => (
                <ImageResultHolder
                  key={idx}
                  imageUrl={result.url}
                  name={result.name}
                  width={undefined} // Let grid handle width
                />
              ))}

              {isGeneratingMockups && (
                   <div className="flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 rounded-2xl animate-pulse min-h-[400px]">
                      <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
                      <span className="text-white/60 font-semibold">{t('productMockupGenerator.generatingMockups')}</span>
                   </div>
              )}
            </div>
            
            {!isGeneratingMockups && generatedResults.length === 0 && (
                <div className="text-white/50 text-center py-10">
                    No results generated.
                </div>
            )}


            <div className="flex items-center gap-4 mt-8">
              {/* Download All (Mock) */}
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
                disabled={generatedResults.length === 0}
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
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BackToTools } from '../../components/ui/BackToTools';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { GoBackTools } from '../../components/ui/GoBackTools';
import { extractOutfitFromImage } from '../../services/geminiServices';
import { Loader2, Download, RefreshCcw } from 'lucide-react';

export const OutfitExtractor: React.FC = () => {
  const { t } = useTranslation();

  // State
  const [originalImage, setOriginalImage] = useState<string | undefined>();
  const [extractedImage, setExtractedImage] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [refineText, setRefineText] = useState('');

  // Reset
  const resetAll = () => {
    setOriginalImage(undefined);
    setExtractedImage(undefined);
    setIsGenerating(false);
    setRefineText('');
  };

  const handleGenerate = async () => {
    if (!originalImage) return;

    setIsGenerating(true);
    setExtractedImage(undefined);

    try {
      // Call the Gemini Service
      const url = await extractOutfitFromImage(originalImage, refineText);
      setExtractedImage(url);
    } catch (error) {
      console.error("Outfit extraction failed:", error);
      alert(t('outfitExtractor.extractionFailed'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!extractedImage) return;
    const link = document.createElement('a');
    link.href = extractedImage;
    link.download = `outfit-extracted-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-7xl px-6 md:px-12 py-12 flex flex-col items-center text-white">
      {/* Top bar */}
      <div className="w-full flex justify-between mb-8">
        {!originalImage ? (
          <BackToTools />
        ) : (
          <GoBackTools onClick={resetAll} />
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

      {!originalImage ? (
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
            value={originalImage}
            onChange={setOriginalImage}
            label={t('outfitExtractor.dropImage')}
            className="w-full h-96"
          />
        </div>
      ) : (
        /* ================= SPLIT VIEW STEP ================= */
        <div className="w-full flex flex-col items-center gap-8">
          
          {/* IMAGES ROW */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl">
            {/* LEFT: ORIGINAL */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col h-full">
               <h3 className="text-lg font-bold mb-4 text-white/90">{t('outfitExtractor.originalImage')}</h3>
               <div className="relative w-full aspect-[3/4] border-2 border-dashed border-white/20 rounded-xl overflow-hidden bg-black/20">
                 <img src={originalImage} className="w-full h-full object-contain" alt="Original" />
               </div>
            </div>

            {/* RIGHT: EXTRACTED OUTFIT */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col h-full">
               <h3 className="text-lg font-bold mb-4 text-white/90">{t('outfitExtractor.extractedOutfit')}</h3>
               <div className="relative w-full aspect-[3/4] border-2 border-dashed border-white/20 rounded-xl overflow-hidden bg-black/20 flex items-center justify-center">
                  {extractedImage ? (
                     <img src={extractedImage} className="w-full h-full object-contain" alt="Extracted Outfit" />
                  ) : isGenerating ? (
                     <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                        <span className="text-white/50 font-medium">Extracting outfit...</span>
                     </div>
                  ) : (
                     <div className="text-center px-6">
                        <p className="text-white/30 text-sm mb-4">Ready to extract the look?</p>
                        <button
                          onClick={handleGenerate}
                          className="px-6 py-2 bg-white text-black rounded-lg font-bold text-sm hover:bg-white/90 transition"
                        >
                          Extract Outfit
                        </button>
                     </div>
                  )}
               </div>
            </div>
          </div>

          {/* REFINE PANEL */}
          <div className="w-full max-w-2xl bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl">
             <h4 className="font-bold text-white mb-2">{t('common.refineLabel')}</h4>
             <textarea
                className="
                  w-full
                  bg-[#222]
                  border
                  border-white/10
                  rounded-xl
                  p-4
                  text-sm
                  text-white
                  placeholder:text-white/30
                  focus:outline-none
                  focus:border-indigo-500/50
                  focus:ring-1
                  focus:ring-indigo-500/50
                  resize-none
                  min-h-[100px]
                  mb-4
                "
                placeholder={t('common.refinePlaceholder')}
                value={refineText}
                onChange={(e) => setRefineText(e.target.value)}
             />
             <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="
                  px-5 py-2.5
                  bg-white
                  text-black
                  rounded-lg
                  font-bold
                  text-sm
                  flex
                  items-center
                  gap-2
                  hover:bg-gray-100
                  transition
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
             >
                <RefreshCcw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                {extractedImage ? t('common.regenerate') : "Extract Outfit"}
             </button>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={handleDownload}
              disabled={!extractedImage}
              className="
                px-8 py-3
                bg-white
                text-black
                rounded-lg
                font-bold
                flex
                items-center
                gap-2
                hover:bg-white/90
                transition
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              <Download className="w-4 h-4" />
              {t('common.download')}
            </button>

            <button
              onClick={resetAll}
              className="
                px-8 py-3
                border
                border-white/20
                rounded-lg
                text-white
                font-semibold
                hover:bg-white/10
                transition
              "
            >
              {t('common.startOver')}
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
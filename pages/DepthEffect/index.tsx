import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BackToTools } from '../../components/ui/BackToTools';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { GoBackTools } from '../../components/ui/GoBackTools';
import { generateDepthMap } from '../../services/geminiServices';
import { DepthViewer } from '../../components/ui/DepthViewer';
import { useMediaLibrary } from '../../contexts/MediaLibraryContext';
import { Loader2, Download, Layers } from 'lucide-react';

export const DepthEffect: React.FC = () => {
  const { t } = useTranslation();
  const { addImageToLibrary } = useMediaLibrary();

  // State
  const [originalImage, setOriginalImage] = useState<string | undefined>();
  const [depthMap, setDepthMap] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Reset
  const resetAll = () => {
    setOriginalImage(undefined);
    setDepthMap(undefined);
    setIsGenerating(false);
  };

  const handleGenerate = async () => {
    if (!originalImage) return;

    setIsGenerating(true);
    setDepthMap(undefined);

    try {
      const url = await generateDepthMap(originalImage);
      setDepthMap(url);
      addImageToLibrary(url);
    } catch (error) {
      console.error("Depth map generation failed:", error);
      alert(t('depthEffect.generationFailed'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!depthMap) return;
    const link = document.createElement('a');
    link.href = depthMap;
    link.download = `depth-map-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-7xl px-6 md:px-12 py-12 flex flex-col items-center text-white">
      {/* Top bar */}
      <div className="w-full flex justify-between mb-8">
        {!depthMap ? (
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
          {t('app.depthEffectTitle')}
        </h1>
        <p className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto">
          {t('depthEffect.subtitle')}
        </p>
      </motion.div>

      {!depthMap ? (
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
            gap-6
          "
        >
           <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{t('depthEffect.uploadTitle')}</h2>
            <p className="text-white/50">{t('depthEffect.uploadDesc')}</p>
           </div>

          <ImageUpload
            value={originalImage}
            onChange={setOriginalImage}
            label={t('depthEffect.dropImage')}
            className="w-full h-80"
          />

          <button
            onClick={handleGenerate}
            disabled={!originalImage || isGenerating}
            className="
                w-full
                py-4
                bg-white
                text-black
                rounded-xl
                font-bold
                text-lg
                hover:bg-white/90
                transition
                disabled:opacity-50
                disabled:cursor-not-allowed
                flex items-center justify-center gap-2
            "
          >
            {isGenerating ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('depthEffect.processingLayers')}
                </>
            ) : (
                <>
                    <Layers className="w-5 h-5" />
                    Generate 3D Effect
                </>
            )}
          </button>
        </div>
      ) : (
        /* ================= RESULT STEP ================= */
        <div className="w-full flex flex-col items-center gap-8">
          
          <div className="w-full max-w-5xl bg-white/[0.02] border border-white/10 rounded-3xl p-8 flex flex-col items-center">
               <h3 className="text-xl font-bold mb-6 text-white/90 flex items-center gap-2">
                 <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                  </span>
                 {t('depthEffect.resultTitle')}
               </h3>
               
               {/* 3D VIEWER */}
               <div className="w-full max-w-2xl aspect-[4/3] relative">
                    {originalImage && depthMap && (
                        <DepthViewer 
                            imageUrl={originalImage} 
                            depthUrl={depthMap} 
                        />
                    )}
               </div>

               {/* Hint */}
               <p className="mt-4 text-sm text-white/40">
                 Note: This effect simulates depth by displacing pixels based on the AI-generated depth map.
               </p>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={handleDownload}
              className="
                px-8 py-3
                bg-white/10
                border border-white/20
                text-white
                rounded-lg
                font-bold
                flex
                items-center
                gap-2
                hover:bg-white/20
                transition
              "
            >
              <Download className="w-4 h-4" />
              Download Depth Map
            </button>

            <button
              onClick={resetAll}
              className="
                px-8 py-3
                bg-white
                text-black
                rounded-lg
                font-bold
                hover:bg-white/90
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

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BackToTools } from '../../components/ui/BackToTools';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { GoBackTools } from '../../components/ui/GoBackTools';
import { SingleSelectList } from '../../components/ui/SingleSelectList';
import { generatePhotoBoothImage } from '../../services/geminiServices';
import { useMediaLibrary } from '../../contexts/MediaLibraryContext';
import { Loader2, Download } from 'lucide-react';

export const PhotoBooth: React.FC = () => {
  const { t } = useTranslation();
  const { addImageToLibrary, logGenerationActivity, selectedImageForTool, clearSelectedImageForTool } = useMediaLibrary();

  const [status, setStatus] = useState<boolean>(true); // true = input, false = result
  const [currentImage, setCurrentImage] = useState<string | undefined>();
  const [generatedImage, setGeneratedImage] = useState<string | undefined>();
  const [selectedNumPhotos, setSelectedNumPhotos] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const numberOfPhotos = ['photos_4', 'photos_6', 'photos_8', 'photos_9', 'photos_12'];
  const prefixednumberOfPhotos = numberOfPhotos.map(sz => `numberOfPhotos.${sz}`);

  // Handle Media Library Selection
  useEffect(() => {
    if (selectedImageForTool) {
        setCurrentImage(selectedImageForTool);
        clearSelectedImageForTool();
    }
  }, [selectedImageForTool, clearSelectedImageForTool]);

  const resetAll = () => {
    setStatus(true);
    setCurrentImage(undefined);
    setGeneratedImage(undefined);
    setSelectedNumPhotos(undefined);
    setIsGenerating(false);
  };

  const handleGenerate = async () => {
    if (!currentImage || !selectedNumPhotos) return;

    setStatus(false);
    setIsGenerating(true);
    setGeneratedImage(undefined);

    try {
      // Key format: "numberOfPhotos.photos_4" -> split by '_' -> ["numberOfPhotos.photos", "4"]
      const countStr = selectedNumPhotos.split('_')[1];
      const count = parseInt(countStr, 10);

      const url = await generatePhotoBoothImage(currentImage, count);
      setGeneratedImage(url);
      await addImageToLibrary(url);
      await logGenerationActivity('Photo Booth', { photoCount: count });
    } catch (error) {
      console.error("Photo Booth generation failed:", error);
      alert(t('photoBooth.generationFailed'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `photobooth-strip-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-7xl px-6 md:px-12 py-12 flex flex-col items-center text-white">
      {/* Top bar */}
      <div className="w-full flex justify-between mb-8">
        {status ? (
          <BackToTools />
        ) : (
          <GoBackTools onClick={() => setStatus(true)} />
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

      {status ? (
        /* ================= INPUT STEP ================= */
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT: UPLOAD */}
          <div className="w-full">
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/50 rounded-3xl p-8 mb-8 h-full flex flex-col">
              <h2 className="text-xl font-bold mb-6 text-center">
                {t('photoBooth.uploadTitle')}
              </h2>
              <div className="flex-1">
                <ImageUpload
                  value={currentImage}
                  height="h-full min-h-[400px]"
                  onChange={setCurrentImage}
                  onRemove={() => setCurrentImage(undefined)}
                  label={t('photoBooth.dropImage')}
                />
              </div>
            </div>
          </div>

          {/* RIGHT: OPTIONS */}
          <div className="w-full">
            <div
              className={`
                rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl
                h-fit
                p-8
                flex 
                flex-col
                items-start
                transition-opacity
                ${!currentImage ? 'opacity-50 pointer-events-none' : 'opacity-100'}
              `}
            >
              <h2 className="text-xl font-bold mb-6 text-center w-full">
                {t('photoBooth.optionsTitle')}
              </h2>
              
              <div className="w-full flex-1">
                 <SingleSelectList
                  feature="photoBooth"
                  keys={prefixednumberOfPhotos}
                  value={selectedNumPhotos || null}
                  onChange={setSelectedNumPhotos}
                  categories="photoCount"
                />
              </div>

              <button
                className="
                  mt-8
                  w-full
                  py-4
                  bg-white text-black
                  rounded-xl
                  font-bold
                  text-lg
                  hover:bg-white/90
                  transition
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  flex items-center justify-center gap-2
                "
                disabled={!selectedNumPhotos}
                onClick={handleGenerate}
              >
                {t(`photoBooth.generateButton`)}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ================= RESULT STEP ================= */
        <div className="w-full flex flex-col items-center gap-8">
          
          {/* IMAGES ROW */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl">
            {/* LEFT: ORIGINAL */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col h-full">
               <h3 className="text-lg font-bold mb-4 text-white/90">{t('common.original')}</h3>
               <div className="relative w-full aspect-[3/4] border-2 border-dashed border-white/20 rounded-xl overflow-hidden bg-black/20">
                 <img src={currentImage} className="w-full h-full object-contain" alt="Original" />
               </div>
            </div>

            {/* RIGHT: RESULT */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col h-full">
               <h3 className="text-lg font-bold mb-4 text-white/90">{t('photoBooth.resultTitle')}</h3>
               <div className="relative w-full aspect-[3/4] border-2 border-dashed border-white/20 rounded-xl overflow-hidden bg-black/20 flex items-center justify-center">
                  {generatedImage ? (
                     <img src={generatedImage} className="w-full h-full object-contain" alt="Photo Booth Strip" />
                  ) : isGenerating ? (
                     <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                        <span className="text-white/50 font-medium">{t('photoBooth.generatingButton')}</span>
                     </div>
                  ) : (
                     <div className="text-white/30 text-center px-6">
                        {t('photoBooth.generationFailed')}
                     </div>
                  )}
               </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={handleDownload}
              disabled={!generatedImage}
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

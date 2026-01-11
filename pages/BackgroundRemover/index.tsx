
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BackToTools } from '../../components/ui/BackToTools';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { GoBackTools } from '../../components/ui/GoBackTools';
import { removeBackgroundFromImageAtPoint } from '../../services/geminiServices';
import { useMediaLibrary } from '../../contexts/MediaLibraryContext';
import { Loader2, Download, MousePointerClick, Check, Eraser } from 'lucide-react';

export const BackgroundRemover: React.FC = () => {
  const { t } = useTranslation();
  const { addImageToLibrary, logGenerationActivity, selectedImageForTool, clearSelectedImageForTool } = useMediaLibrary();

  // State
  const [originalImage, setOriginalImage] = useState<string | undefined>();
  const [resultImage, setResultImage] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [clickCoords, setClickCoords] = useState<{ x: number; y: number } | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);

  // Handle Media Library Selection
  useEffect(() => {
    if (selectedImageForTool) {
      setOriginalImage(selectedImageForTool);
      setResultImage(undefined);
      setClickCoords(null);
      clearSelectedImageForTool();
    }
  }, [selectedImageForTool, clearSelectedImageForTool]);

  // Reset
  const resetAll = () => {
    setOriginalImage(undefined);
    setResultImage(undefined);
    setIsProcessing(false);
    setClickCoords(null);
  };

  // Handle click on the original image
  const handleImageClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!originalImage || isProcessing || !imageRef.current) return;

    const img = imageRef.current;
    const rect = img.getBoundingClientRect();

    // Calculate click position relative to the displayed image
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate scaling factor between displayed image and natural image size
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;

    // Actual coordinates on the full-resolution image
    const actualX = x * scaleX;
    const actualY = y * scaleY;

    // Visual feedback for the click
    setClickCoords({ x, y });

    setIsProcessing(true);
    setResultImage(undefined);

    try {
      const url = await removeBackgroundFromImageAtPoint(originalImage, actualX, actualY);
      setResultImage(url);
      await addImageToLibrary(url);
      await logGenerationActivity('Background Remover', { clickCoordinates: {x: actualX, y: actualY} });
    } catch (error) {
      console.error("Background removal failed:", error);
      alert(t('backgroundRemover.removalFailed'));
      setClickCoords(null); // Reset click indicator on fail
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `removed-bg-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Checkerboard pattern for transparency background
  const checkerboardStyle = {
    backgroundImage: `
      linear-gradient(45deg, #2a2a2a 25%, transparent 25%), 
      linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), 
      linear-gradient(45deg, transparent 75%, #2a2a2a 75%), 
      linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)
    `,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
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
        <div className="flex items-center justify-center gap-3 mb-4">
            <Eraser className="w-8 h-8 text-white" />
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
            {t('app.backgroundRemoverTitle')}
            </h1>
        </div>
        <p className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto">
          {t('backgroundRemover.subtitle')}
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
            gap-6
          "
        >
           <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{t('backgroundRemover.uploadPrompt')}</h2>
            <p className="text-white/50">{t('backgroundRemover.instructions')}</p>
           </div>

          <ImageUpload
            value={originalImage}
            onChange={setOriginalImage}
            label={t('backgroundRemover.dropImage')}
            className="w-full h-96"
          />
        </div>
      ) : (
        /* ================= INTERACTION STEP ================= */
        <div className="w-full flex flex-col items-center gap-8">
          
          {/* WORKSPACE ROW */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl">
            
            {/* LEFT: ORIGINAL (CLICKABLE) */}
            <div className="flex flex-col gap-4">
               <h3 className="text-lg font-bold text-center text-white/90">{t('common.original')}</h3>
               
               <div className="relative group bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex items-center justify-center min-h-[400px]">
                 <div className="relative inline-block overflow-hidden rounded-lg cursor-crosshair">
                     <img 
                        ref={imageRef}
                        src={originalImage} 
                        onClick={handleImageClick}
                        className={`max-w-full max-h-[600px] object-contain transition-opacity ${isProcessing ? 'opacity-50' : 'opacity-100'}`}
                        alt="Original" 
                     />
                     
                     {/* Hover Overlay Hint */}
                     {!isProcessing && !resultImage && (
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-sm font-semibold">
                                <MousePointerClick className="w-4 h-4 text-white" />
                                {t('backgroundRemover.clickToKeep')}
                            </div>
                        </div>
                     )}

                     {/* Click Indicator */}
                     {clickCoords && (
                        <motion.div 
                            initial={{ scale: 0, opacity: 1 }}
                            animate={{ scale: 1.5, opacity: 0 }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="absolute w-6 h-6 border-2 border-white rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2 shadow-lg bg-indigo-500/50"
                            style={{ 
                                left: clickCoords.x, 
                                top: clickCoords.y 
                            }}
                        />
                     )}
                 </div>
               </div>
            </div>

            {/* RIGHT: RESULT */}
            <div className="flex flex-col gap-4">
               <h3 className="text-lg font-bold text-center text-white/90">{t('backgroundRemover.result')}</h3>
               
               <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex items-center justify-center min-h-[400px] relative overflow-hidden">
                  
                  {/* Checkerboard Background for Transparency */}
                  <div className="absolute inset-0 opacity-20" style={checkerboardStyle} />

                  {/* Invisible Original to force height match */}
                  <img 
                      src={originalImage} 
                      className="max-w-full max-h-[600px] object-contain opacity-0 pointer-events-none invisible" 
                      alt="Spacer"
                  />

                  {/* Content Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    {resultImage ? (
                        <motion.img 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            src={resultImage} 
                            className="relative z-10 max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            alt="Result" 
                        />
                    ) : isProcessing ? (
                        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Eraser className="w-6 h-6 text-indigo-400 animate-pulse" />
                                </div>
                            </div>
                            <div>
                                <p className="text-white font-semibold text-lg">{t('backgroundRemover.processing')}</p>
                                <p className="text-white/40 text-sm">Analysing segmentation mask...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="relative z-10 text-center px-6 py-12 border-2 border-dashed border-white/10 rounded-xl bg-black/20">
                            <MousePointerClick className="w-12 h-12 text-white/20 mx-auto mb-4" />
                            <p className="text-white/40 font-medium">
                                {t('backgroundRemover.instructions')}
                            </p>
                        </div>
                    )}
                  </div>
               </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={handleDownload}
              disabled={!resultImage}
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
                shadow-lg shadow-white/5
              "
            >
              <Download className="w-4 h-4" />
              {t('common.download')}
            </button>

            <button
              onClick={resetAll}
              className="
                px-8 py-3
                bg-white/5
                border
                border-white/10
                rounded-lg
                text-white
                font-semibold
                hover:bg-white/10
                transition
                backdrop-blur-sm
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

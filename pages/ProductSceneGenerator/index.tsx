import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BackToTools } from '../../components/ui/BackToTools';
import { GoBackTools } from '../../components/ui/GoBackTools';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { MultiSelectList } from '../../components/ui/MultiSelectList';
import { ImageResultHolder } from '../../components/ui/ImageResultHolder';
import { useNavigate } from 'react-router-dom';
import { generateStyledImage } from '../../services/geminiServices';
import { useMediaLibrary } from '../../contexts/MediaLibraryContext';
import { Loader2 } from 'lucide-react';


export const ProductSceneGenerator: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addImageToLibrary, selectedImageForTool, clearSelectedImageForTool } = useMediaLibrary();

  const [status, setStatus] = useState<boolean>(true) // true = input, false = result

  // Ảnh đang thao tác
  const [currentImage, setCurrentImage] = useState<string | undefined>();

  const [selectedCameraAngle, setSelectedCameraAngle] = useState<string[]>([]);
  
  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<Array<{url: string, name: string}>>([]);

  const cameraAngle = ['front', 'back', 'side_left', 'side_right', 'top', 'bottom', 'three_quarter', 'close_up', 'in_context']
  const prefixedAngles = cameraAngle.map(angle => `angles.${angle}`);

  // Handle Media Library Selection
  useEffect(() => {
    if (selectedImageForTool) {
      setCurrentImage(selectedImageForTool);
      clearSelectedImageForTool();
    }
  }, [selectedImageForTool, clearSelectedImageForTool]);

  const resetAll = () => {
    // General
    setStatus(true);
    // Images
    setCurrentImage(undefined);
    // Options
    setSelectedCameraAngle([]);
    setGeneratedResults([]);
    setIsGenerating(false);
  };

  const handleGenerate = async () => {
    if (!currentImage || selectedCameraAngle.length === 0) return;

    setStatus(false);
    setIsGenerating(true);
    setGeneratedResults([]);

    try {
        for (const angleKey of selectedCameraAngle) {
            // angleKey format: "angles.front" -> extract "front" and make readable
            const rawAngle = angleKey.replace('angles.', '').replace(/_/g, ' ');
            const readableName = t(angleKey);

            const prompt = `
            Product Photography Generation.
            Input Image: Provided product image.
            Task: Generate a professional product shot of this exact item.
            Camera Angle: ${rawAngle} view.
            Style: Clean, commercial product photography, neutral professional studio lighting and background.
            Constraint: Preserve the product identity, logos, and details perfectly.
            `;

            try {
                const url = await generateStyledImage(prompt, [currentImage]);
                setGeneratedResults(prev => [...prev, { url, name: readableName }]);
                addImageToLibrary(url);
            } catch (error) {
                console.error(`Failed to generate angle ${rawAngle}:`, error);
            }
        }
    } catch (e) {
        console.error("Generation sequence failed", e);
        alert("An error occurred during generation.");
    } finally {
        setIsGenerating(false);
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
              // resetAll();      // Keep state if user wants to generate more
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
              <div className="bg-white/[0.04] backdrop-blur-xl border border-white/50 rounded-3xl p-8 mb-8 h-full">
                <h2 className="text-xl font-bold mb-6 text-center">
                  {t('productSceneGenerator.step1Title')}
                </h2>

                <ImageUpload
                  value={currentImage}
                  height="h-96"
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
              md:col-span-2
              ${!currentImage
              ? 'opacity-50 cursor-not-allowed pointer-events-none'
              : 'cursor-pointer'}
            `}>
                <h2 className="text-xl font-bold mb-4 text-center">
                  {t('productSceneGenerator.step2Title')}
                </h2>
                <p className="text-sm text-white/50 mb-4">{t('productSceneGenerator.step2Desc')}</p>
                <div className="w-full mb-8">
                    <MultiSelectList
                    feature="productSceneGenerator"
                    keys={prefixedAngles}
                    value={selectedCameraAngle}
                    onChange={setSelectedCameraAngle}
                    />
                </div>

              <div className="flex w-full items-center justify-between mt-auto">
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
                  onClick={handleGenerate}
                >
                  {`${t(`photoshoot.generateButton`)} (${selectedCameraAngle.length})`}
                </button>
              </div>

            </div>
          </div> :

          <div className="flex flex-col gap-6 items-center w-full max-w-6xl">
            {/* RESULTS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {generatedResults.map((res, idx) => (
                <ImageResultHolder
                  key={idx}
                  imageUrl={res.url}
                  name={res.name}
                />
              ))}
              
              {isGenerating && (
                   <div className="flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 rounded-2xl animate-pulse min-h-[400px]">
                      <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
                      <span className="text-white/60 font-semibold">{t('productSceneGenerator.generatingButton')}</span>
                      <span className="text-white/30 text-sm mt-2">Processing angle...</span>
                   </div>
              )}
            </div>

            {!isGenerating && generatedResults.length === 0 && (
                 <div className="text-white/50 text-center py-10">
                    No results generated.
                </div>
            )}

            <div className="flex items-center gap-4 mt-8">
              {/* Download All */}
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

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BackToTools } from '../../components/ui/BackToTools';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { GoBackTools } from '../../components/ui/GoBackTools';
import { generateTypographicIllustration } from '../../services/geminiServices';
import { useMediaLibrary } from '../../contexts/MediaLibraryContext';
import { Loader2 } from 'lucide-react';

export const TypographicIllustrator: React.FC = () => {
  const { t } = useTranslation();
  const { addImageToLibrary, logGenerationActivity } = useMediaLibrary();

  // true = input, false = result
  const [status, setStatus] = useState<boolean>(true);

  // TEXTAREA INPUT STATE
  const [scenePrompt, setScenePrompt] = useState<string>('');

  // GENERATION STATE
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // RESET ALL STATE
  const resetAll = () => {
    setStatus(true);
    setScenePrompt('');
    setResultImage(null);
    setIsGenerating(false);
  };
 
  const handleGenerate = async () => {
    if (!scenePrompt.trim()) return;

    setStatus(false);
    setIsGenerating(true);
    setResultImage(null);

    try {
      const url = await generateTypographicIllustration(scenePrompt);
      setResultImage(url);
      await addImageToLibrary(url);
      await logGenerationActivity('Typographic Illustration', { phrase: scenePrompt });
    } catch (error) {
      console.error("Generation failed:", error);
      alert(t('typographicIllustrator.generationFailed'));
      // Optionally go back to input or stay in result view with error state
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `typographic-illustration-${Date.now()}.png`;
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
          <GoBackTools
            onClick={() => {
              setStatus(true); // quay lại màn input
              // resetAll();   // user might want to edit prompt, so don't full reset
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
          {t('app.typographicIllustratorTitle')}
        </h1>

        <p className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto">
          {t('typographicIllustrator.subtitle')}
        </p>
      </motion.div>

      {status ? (
        /* ================= INPUT STEP ================= */
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
            gap-4
          "
        >
          <h2 className="text-xl font-bold mb-2">
            {t('typographicIllustrator.inputLabel')}
          </h2>

          <textarea
            rows={3}
            value={scenePrompt}
            onChange={(e) => setScenePrompt(e.target.value)}
            className="
              w-full
              px-4 py-3
              rounded-xl
              bg-white/5
              border
              border-white/15
              text-white
              placeholder-white/40
              resize-none
              focus:outline-none
              focus:border-white
            "
            placeholder={t('typographicIllustrator.inputPlaceholder')}
          />

          <button
            className="
              w-full
              px-6 py-3
              rounded-xl
              bg-white
              text-black
              font-semibold
              hover:bg-white/90
              transition
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
            disabled={!scenePrompt.trim()}
            onClick={handleGenerate}
          >
            {t('typographicIllustrator.generateButton')}
          </button>
        </div>
      ) : (
        /* ================= RESULT STEP ================= */
        <div className="w-full max-w-5xl flex flex-col gap-8 items-center">
          {/* ORIGINAL PHRASE */}
          <div
            className="
              w-full
              rounded-2xl
              border border-white/20
              bg-white/5
              backdrop-blur-xl
              px-6 py-4
              text-center
            "
          >
            <p className="text-xs tracking-widest text-white/50 mb-1">
              {t('typographicIllustrator.originalPhrase')}
            </p>
            <p className="text-xl font-semibold">
              “{scenePrompt}”
            </p>
          </div>

          {/* ILLUSTRATION */}
          <div
            className="
              w-[400px]
              rounded-2xl
              border border-white/20
              bg-white/5
              backdrop-blur-xl
              p-6
              flex
              flex-col
              gap-4
            "
          >
            <h3 className="text-lg font-bold">
              {t('typographicIllustrator.resultTitle')}
            </h3>

            {/* IMAGE HOLDER */}
            <div
              className="
                w-full
                aspect-square
                rounded-xl
                border
                border-dashed
                border-white/30
                bg-white/10
                flex
                items-center
                justify-center
                overflow-hidden
                relative
              "
            >
              {isGenerating ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-white/50" />
                  <span className="text-white/50 font-medium">
                    {t('typographicIllustrator.generatingButton')}
                  </span>
                </div>
              ) : resultImage ? (
                <img
                  src={resultImage}
                  alt="Illustration result"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-white/30">
                  {t('polaroid.generationFailed')}
                </span>
              )}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-4 mt-4">
            {/* Download */}
            <button
              onClick={handleDownload}
              disabled={!resultImage || isGenerating}
              className="
                px-6 py-3
                bg-white
                text-black
                rounded-lg
                font-semibold
                hover:bg-white/90
                transition
                flex
                items-center
                gap-2
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              {t('common.download')}
            </button>

            {/* Start Over */}
            <button
              className="
                px-6 py-3
                border
                border-white/20
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

      )}
    </div>
  );
};

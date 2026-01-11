import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BackToTools } from '../../components/ui/BackToTools';
import { GoBackTools } from '../../components/ui/GoBackTools';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { StepAccordion } from '../../components/ui/StepAccordion';
import { SideImageLoader } from '../../components/ui/SideImageLoader';
import { SingleSelectList } from '../../components/ui/SingleSelectList';
import { MultiSelectList } from '../../components/ui/MultiSelectList';
import { PolaroidCard } from '../../components/ui/PolaroidCard';
import { useNavigate } from 'react-router-dom';
import { RefinePanel } from '../../components/ui/RefinePanel';
import { X, Loader2 } from 'lucide-react';
import { usePhotoshoot } from './usePhotoshoot';
import { generateImageFromPrompt, generateStyledImage } from '../../services/geminiServices';
import { useMediaLibrary } from '../../contexts/MediaLibraryContext';

export const Photoshoot: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addImageToLibrary, selectedImageForTool, clearSelectedImageForTool } = useMediaLibrary();
  const {
    status, setStatus,
    currentImage, setCurrentImage,
    AIDesignerPrompt, setAIDesignerPrompt,
    modelLibrary, setModelLibrary,
    mode, setMode,
    openStep, toggleStep,
    outfitImage, setOutfitImage,
    objectImage, setObjectImage,
    backgroundImage, setBackgroundImage,
    selectedCameraAngle, setSelectedCameraAngle,
    selectedColorGrade, setSelectedColorGrade,
    selectedSize, setSelectedSize,
    selectedPoses, setSelectedPoses,
    refineText, setRefineText,
    isGeneratingModel, setIsGeneratingModel,
    isGeneratingPhotos, setIsGeneratingPhotos,
    generatedResults, setGeneratedResults
  } = usePhotoshoot();

  // Handle Media Library Selection
  useEffect(() => {
    if (selectedImageForTool) {
      if (status) {
        // If we are in setup mode, check if we need to set the main image or others
        // Simple logic: if currentImage is empty, set it. 
        // If we want more complex logic (e.g. set outfit if currentImage exists), we can add it here.
        // For now, let's just set the main model image as that's the primary use case.
        if (!currentImage) {
            setCurrentImage(selectedImageForTool);
            setModelLibrary((prev) =>
                prev.includes(selectedImageForTool) ? prev : [...prev, selectedImageForTool]
            );
        } else if (!outfitImage && openStep === 2) {
             setOutfitImage(selectedImageForTool);
        } else if (!objectImage && openStep === 2) {
             setObjectImage(selectedImageForTool);
        } else if (!backgroundImage && openStep === 2) {
             setBackgroundImage(selectedImageForTool);
        } else {
            // Default fallback to main image replacement
            setCurrentImage(selectedImageForTool);
            setModelLibrary((prev) =>
                prev.includes(selectedImageForTool) ? prev : [...prev, selectedImageForTool]
            );
        }
      }
      clearSelectedImageForTool();
    }
  }, [selectedImageForTool, clearSelectedImageForTool, currentImage, status, openStep, outfitImage, objectImage, backgroundImage, setCurrentImage, setModelLibrary, setOutfitImage, setObjectImage, setBackgroundImage]);


  const cameraAngle = ['eyeLevel', 'lowAngle', 'highAngle', 'dutchAngle', 'wormsEyeView', 'birdsEyeView']
  const prefixedAngles = cameraAngle.map(angle => `angles.${angle}`);

  const colorGrade = ['none', 'cinematic', 'vintage', 'highContrast', 'vibrant', 'muted', 'warm', 'cool']
  const prefixedColorGrade = colorGrade.map(color => `grades.${color}`)

  const imageSize = ['1_1', '9_16', '16_9', '4_3', '3_4']
  const prefixedImageSize = imageSize.map(sz => `imageSize.${sz}`)

  const poses = [
    'smiling_portrait',
    'laughing_portrait',
    'serious_close_up',
    'thoughtful_look',
    'side_profile',
    'head_tilt',
    'playful_wink',
    'soft_smile',

    'confident_full_body',
    'walking_pose',
    'hands_in_pockets',
    'arms_crossed',
    'hand_on_hip',
    'leaning_pose',
    'jumping_in_the_air',
    'twirling_shot',

    'low_angle_shot',
    'high_angle_shot',
    'from_below_face',
    'over_the_shoulder_glance',
    'looking_over_shoulder',

    'sitting_pose',
    'crouching_pose',
    'lying_on_grass',
    'hand_on_chin',
    'holding_balloons',
    'holding_flowers',

    'candid_moment',
    'hair_in_motion',
    'adjusting_jacket',
    'hand_towards_camera',
    'dancing_pose',
    'shielding_eyes_from_sun',
    
    'editorial_lean',
    'power_stance',
    'hand_on_collar',
    'silhouette_pose',
    'motion_blur',
    'architectural_pose',
    'lounging_elegantly',
    'dramatic_gaze',
  ];

  const prefixedPoses = poses.map(p => `poses.${p}`);

  const posesPortraitsCloseUp = prefixedPoses.slice(0, 8);
  const posesFullWediumShorts = prefixedPoses.slice(8, 16);
  const posesCreativeAngles = prefixedPoses.slice(16, 21);
  const posesThemed = prefixedPoses.slice(21, 27);
  const posesDynamic = prefixedPoses.slice(27, 33);
  const posesFashion = prefixedPoses.slice(33, 41);

  const resetAll = () => {
    // General
    setStatus(true);
    setMode('Upload');
    toggleStep(2);

    // Images
    setCurrentImage(undefined);
    setModelLibrary([]);

    // Step 2 – Assets
    setOutfitImage(undefined);
    setObjectImage(undefined);
    setBackgroundImage(undefined);

    // Options
    setSelectedCameraAngle('angles.eyeLevel');
    setSelectedColorGrade('grades.none');
    setSelectedSize('imageSize.1_1');
    setSelectedPoses([]);

    // Refine
    setRefineText('');
    setAIDesignerPrompt('');
    setGeneratedResults([]);
    setIsGeneratingModel(false);
    setIsGeneratingPhotos(false);
  };

  const handleGenerateModel = async () => {
    if (!AIDesignerPrompt.trim()) return;
    
    setIsGeneratingModel(true);
    try {
      const url = await generateImageFromPrompt(AIDesignerPrompt);
      setCurrentImage(url);
      setModelLibrary(prev => [...prev, url]);
      setMode('Upload'); // Switch back to see the image in the main uploader
    } catch (error) {
      console.error("Failed to generate model:", error);
      alert("Failed to generate model. Please try again.");
    } finally {
      setIsGeneratingModel(false);
    }
  };

  const handleGeneratePhotos = async () => {
    if (!currentImage || selectedPoses.length === 0) return;

    setStatus(false); // Switch to result view
    setIsGeneratingPhotos(true);
    setGeneratedResults([]);

    const imageInputs = [currentImage];
    let promptInstruction = "The first image is the reference person/model. Maintain their identity.";

    // Append auxiliary images and update instructions
    if (outfitImage) {
      imageInputs.push(outfitImage);
      promptInstruction += `\nThe second image is the outfit. The person MUST wear this outfit.`;
    }
    if (objectImage) {
      imageInputs.push(objectImage);
      promptInstruction += `\nThe ${outfitImage ? 'third' : 'second'} image is an object. The person should interact with it or hold it.`;
    }
    if (backgroundImage) {
      imageInputs.push(backgroundImage);
      promptInstruction += `\nThe ${[outfitImage, objectImage].filter(Boolean).length + 2}th image is the background. Place the person in this scene.`;
    }

    // Process poses
    for (const poseKey of selectedPoses) {
      const poseName = t(`photoshoot.${poseKey}`); // e.g. "Smiling Portrait"
      const angleName = t(`photoshoot.${selectedCameraAngle}` || '');
      const gradeName = t(`photoshoot.${selectedColorGrade}` || '');
      const sizeName = t(`photoshoot.${selectedSize}` || '');

      const fullPrompt = `
        Create a photorealistic photo based on the following:
        - Pose: ${poseName}
        - Camera Angle: ${angleName}
        - Color Grading Style: ${gradeName}
        - Aspect Ratio/Format: ${sizeName}
        
        ${promptInstruction}
      `;

      try {
        const url = await generateStyledImage(fullPrompt, imageInputs);
        setGeneratedResults(prev => [...prev, {
          id: crypto.randomUUID(),
          url,
          pose: poseName
        }]);
        addImageToLibrary(url);
      } catch (error) {
        console.error(`Failed to generate pose ${poseName}:`, error);
      }
    }
    
    setIsGeneratingPhotos(false);
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
              // resetAll();      // reset các state khác -- user probably wants to keep settings
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
          {t('app.photoshootTitle')}
        </h1>

        <p className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto">
          {t('photoshoot.subtitle')}
        </p>
      </motion.div>

      {
        status ?  
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
                    value={AIDesignerPrompt} 
                    onChange={(e) => setAIDesignerPrompt(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15
                              text-white placeholder-white/40 resize-none
                              focus:outline-none focus:border-white"
                    placeholder={t('photoshoot.modelGenPlaceholder')}
                    disabled={isGeneratingModel}
                  />

                  <button 
                    onClick={handleGenerateModel}
                    disabled={isGeneratingModel || !AIDesignerPrompt.trim()}
                    className="w-full px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGeneratingModel ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('photoshoot.generatingModel')}
                      </>
                    ) : (
                      t('photoshoot.generateModel')
                    )}
                  </button>
                </div>
              )}

              {/* MODEL LIBRARY */}
              <div className="mt-8 w-full">
                <h3 className="text-2xl font-bold mb-6">
                  {t('photoshoot.libraryTitle')}
                </h3>

                {modelLibrary.length > 0 ? (
                  <div className="flex gap-2 border border-slate-900/15 bg-white/5 rounded-lg px-4 py-4 overflow-x-auto overflow-y-hidden">
                    {modelLibrary.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImage(img)}
                          className={`
                            relative
                            w-16 h-16
                            rounded-lg
                            flex-shrink-0
                            flex items-center justify-center
                            hover:border-white/40
                            transition
                            group
                            ${currentImage === img ? 'ring-2 ring-indigo-500' : ''}
                          `}
                        >
                          <img
                            src={img}
                            alt={`Model ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />

                          {/* REMOVE BUTTON */}
                          <X
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
                          </X>
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
            <div 
              aria-disabled={!currentImage}
              className={`
              w-full 
              md:col-span-2
              ${!currentImage
              ? 'opacity-50 cursor-not-allowed pointer-events-none'
              : 'cursor-pointer'}
            `}>
              <div className="w-full flex flex-col gap-4">
                  <StepAccordion
                    title={t('photoshoot.step2Title')}
                    subtitle={t('photoshoot.step2Desc')}
                    isOpen={openStep === 2}
                    onToggle={() => toggleStep(2)}
                  >
                    <div className="flex flex-row gap-6 w-full">

                      {/* OUTFIT */}
                      <div className="flex flex-col gap-2 w-full">
                        <h4 className="font-semibold text-md text-white/80">
                          {t('photoshoot.outfit')}
                        </h4>

                        <SideImageLoader
                          value={outfitImage}
                          onChange={setOutfitImage}
                          onRemove={() => setOutfitImage(undefined)}
                          fullWidth
                        />
                      </div>

                      {/* OBJECT */}
                      <div className="flex flex-col gap-2 w-full">
                        <h4 className="font-semibold text-md text-white/80">
                          {t('photoshoot.object')}
                        </h4>

                        <SideImageLoader
                          value={objectImage}
                          onChange={setObjectImage}
                          onRemove={() => setObjectImage(undefined)}
                          fullWidth
                        />
                      </div>


                      {/* BACKGROUND */}
                      <div className="flex flex-col gap-2 w-full">
                        <h4 className="font-semibold text-md text-white/80">
                          {t('photoshoot.background')}
                        </h4>

                        <SideImageLoader
                          value={backgroundImage}
                          onChange={setBackgroundImage}
                          onRemove={() => setBackgroundImage(undefined)}
                          fullWidth
                        />
                      </div>

                    </div>
                  </StepAccordion>

                  <StepAccordion
                    title={t('photoshoot.step3Title')}
                    subtitle={t('photoshoot.step3Desc')}
                    isOpen={openStep === 3}
                    onToggle={() => toggleStep(3)}
                  >
                    <div className="flex flex-col gap-6 w-full">
                      {/* CAMERA ANGLE */}
                      <SingleSelectList
                        feature="photoshoot"
                        keys={prefixedAngles}           // ['eyeLevel', 'lowAngle', components.]
                        value={selectedCameraAngle}
                        onChange={(key) => setSelectedCameraAngle(key)}
                        categories='cameraAngle'
                      />

                      {/* COLOR GRADE */}
                      <SingleSelectList
                        feature="photoshoot"
                        keys={prefixedColorGrade}            // ['none', 'cinematic', components.]
                        value={selectedColorGrade}
                        onChange={(key) => setSelectedColorGrade(key)}
                        categories='colorGrade'
                      />
                    </div>
                  </StepAccordion>

                <StepAccordion
                  title={t('photoshoot.step4Title')}
                  subtitle={t('photoshoot.step4Desc')}
                  isOpen={openStep === 4}
                  onToggle={() => toggleStep(4)}
                >
                    {/* ASPECT RATIO */}
                    <SingleSelectList
                      feature="photoshoot"
                      keys={prefixedImageSize}  
                      value={selectedSize}
                      onChange={(key) => setSelectedSize(key)}
                      categories='aspectRatio'
                    />
                </StepAccordion>

                <StepAccordion
                  title={t('photoshoot.step5Title')}
                  subtitle={t('photoshoot.step5Desc')}
                  isOpen={openStep === 5}
                  onToggle={() => toggleStep(5)}
                >
                  <div className="max-h-[360px] overflow-y-auto pr-2">
                    <div className="flex gap-8 justify-end">
                      <button
                        className="text-white/50 hover:text-white font-semibold"
                        onClick={() => setSelectedPoses(prefixedPoses)}
                      >
                        {t('photoshoot.selectAll')}
                      </button>
                      <button
                        className="text-white/50 hover:text-red-500 font-semibold"
                        onClick={() => setSelectedPoses([])}
                      >
                        {t('photoshoot.clearSelection')}
                      </button>
                    </div>
                    <MultiSelectList
                      feature="photoshoot"
                      keys={posesPortraitsCloseUp}
                      value={selectedPoses}
                      onChange={setSelectedPoses}
                      categories='categories.Portraits & Close-ups'
                    />
                    <MultiSelectList
                      feature="photoshoot"
                      keys={posesFullWediumShorts}
                      value={selectedPoses}
                      onChange={setSelectedPoses}
                      categories='categories.Full & Medium Shots'
                    />
                    <MultiSelectList
                      feature="photoshoot"
                      keys={posesCreativeAngles}
                      value={selectedPoses}
                      onChange={setSelectedPoses}
                      categories='categories.Creative Angles & Perspectives'
                    />
                    <MultiSelectList
                      feature="photoshoot"
                      keys={posesFashion}
                      value={selectedPoses}
                      onChange={setSelectedPoses}
                      categories='categories.Fashion & Editorial'
                    />
                    <MultiSelectList
                      feature="photoshoot"
                      keys={posesThemed}
                      value={selectedPoses}
                      onChange={setSelectedPoses}
                      categories='categories.Themed, Sitting & Lying Poses'
                    />
                    <MultiSelectList
                      feature="photoshoot"
                      keys={posesDynamic}
                      value={selectedPoses}
                      onChange={setSelectedPoses}
                      categories='categories.Dynamic & Candid'
                    />
                  </div>
                </StepAccordion>

              </div>

              <div className="flex items-center justify-between mt-6">
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
                  disabled={selectedPoses.length === 0}
                  onClick={handleGeneratePhotos}
                >
                  {`${t(`photoshoot.generateButton`)} (${selectedPoses.length})`}
                </button>
              </div>

            </div>
          </div> :

          <div className="flex flex-col gap-6 items-center w-full">
            {/* GRID OF RESULTS */}
            {generatedResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
                {generatedResults.map((result) => (
                   <PolaroidCard
                    key={result.id}
                    imageUrl={result.url}
                    name={result.pose}
                  />
                ))}
                {isGeneratingPhotos && (
                   <div className="flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 rounded-2xl animate-pulse">
                      <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
                      <span className="text-white/60 font-semibold">{t('photoshoot.generatingButton')}</span>
                      <span className="text-white/40 text-sm mt-2">Processing remaining poses...</span>
                   </div>
                )}
              </div>
            ) : (
               <div className="flex flex-col items-center justify-center py-20">
                  {isGeneratingPhotos ? (
                    <>
                      <Loader2 className="w-16 h-16 text-indigo-400 animate-spin mb-6" />
                      <h2 className="text-2xl font-bold">{t('photoshoot.generatingButton')}</h2>
                      <p className="text-white/50 mt-2">Generating your photos, this might take a moment...</p>
                    </>
                  ) : (
                    <p className="text-white/50">No images generated.</p>
                  )}
               </div>
            )}


            <RefinePanel
              value={refineText}
              width={500}
              onChange={setRefineText}
              onApplyAll={() => {
                console.log('Apply instruction:', refineText);
                // Future: Implement refinement logic
              }}
            />
            <div className="flex items-center gap-4">
              {/* Download All (Simulated) */}
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
                disabled={generatedResults.length === 0 || isGeneratingPhotos}
              >
                {t(`photoshoot.downloadAllButton`)}
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
                disabled={isGeneratingPhotos}
              >
                {t('common.startOver')}
              </button>

            </div>
          </div>
      }

    </div>
  );
};

import { useState, useEffect } from 'react';

export interface GeneratedResult {
  id: string;
  url: string;
  pose: string;
}

export const usePhotoshoot = () => {
  const [status, setStatus] = useState<boolean>(true);
  const [currentImage, setCurrentImage] = useState<string | undefined>();
  const [AIDesignerPrompt, setAIDesignerPrompt] = useState<string>('');
  
  // Initialize modelLibrary from localStorage to persist user models
  const [modelLibrary, setModelLibrary] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('photoshoot_model_library');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load model library", e);
      return [];
    }
  });

  // Persist modelLibrary changes
  useEffect(() => {
    localStorage.setItem('photoshoot_model_library', JSON.stringify(modelLibrary));
  }, [modelLibrary]);

  const [mode, setMode] = useState<'Upload' | 'Generate'>('Upload');
  const [openStep, setOpenStep] = useState<number | null>(2);
  const toggleStep = (step: number) => setOpenStep(prev => (prev === step ? null : step));

  const [outfitImage, setOutfitImage] = useState<string | undefined>();
  const [objectImage, setObjectImage] = useState<string | undefined>();
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>();

  const [selectedCameraAngle, setSelectedCameraAngle] = useState<string | null>('angles.eyeLevel');
  const [selectedColorGrade, setSelectedColorGrade] = useState<string | null>('grades.none');
  const [selectedSize, setSelectedSize] = useState<string | null>('imageSize.1_1');

  const [selectedPoses, setSelectedPoses] = useState<string[]>([]);
  const [refineText, setRefineText] = useState<string>('');

  // New states for generation
  const [isGeneratingModel, setIsGeneratingModel] = useState(false);
  const [isGeneratingPhotos, setIsGeneratingPhotos] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>([]);

  return {
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
  };
};

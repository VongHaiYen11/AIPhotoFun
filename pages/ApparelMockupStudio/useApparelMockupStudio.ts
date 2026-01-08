import { useState } from 'react';

export const useApparelMockupStudio = () => {
  const [status, setStatus] = useState<boolean>(true) // true = input, false = result

  const [AIDesignerPrompt, setAIDesignerPrompt] = useState<string>('');
  const [styleDescPrompt, setStyleDescPrompt] = useState<string>('');

  // Ảnh đang thao tác
  const [currentImage, setCurrentImage] = useState<string | undefined>();

  const [uploadedMockup, setuploadedMockup] = useState<string | undefined>();

  const [selectedMockup, setSelectedMockup] = useState<string | null>('hanging');

  const [mode, setMode] = useState<'Upload' | 'Generate'>('Generate');

  const [hexInput, setHexInput] = useState('#FFFFFF');
  const [colorways, setColorways] = useState<string[]>(['#FFFFFF', '#18181b']);

  return {
    status, setStatus,
    currentImage, setCurrentImage,
    AIDesignerPrompt, setAIDesignerPrompt,
    styleDescPrompt, setStyleDescPrompt,
    mode, setMode,
    uploadedMockup, setuploadedMockup,
    selectedMockup, setSelectedMockup,
    hexInput, setHexInput,
    colorways, setColorways
  };
};

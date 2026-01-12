
import React, { useState, DragEvent, ChangeEvent, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { generateStyledImage } from '../../services/geminiServices';
import { cn } from '../../lib/utils';
import { BackToTools } from '../../components/ui/BackToTools';
import { GoBackTools } from '../../components/ui/GoBackTools';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { DrawingCanvas } from '../../components/ui/DrawingCanvas';
import { ThreeDeeCanvas } from '../../components/ui/ThreeDeeCanvas';
import { useMediaLibrary } from '../../contexts/MediaLibraryContext';
import { Loader2, Download, Upload, X, PersonStanding } from 'lucide-react';

// Uploader Component (for character & pose)
const Uploader = ({ onImageUpload, id }: { onImageUpload: (file: File) => void, id: string }) => {
    const { t } = useTranslation();
    const [isDragOver, setIsDragOver] = useState(false);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImageUpload(file);
        }
    };

    const handleDrop = (e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            onImageUpload(file);
        }
    };

    const handleDragEvents = (e: DragEvent<HTMLElement>, enter: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(enter);
    };

    return (
        <label
            htmlFor={id}
            className={cn(
                "cursor-pointer aspect-[4/5] w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-colors p-4",
                isDragOver ? "border-indigo-500 bg-indigo-500/10" : "border-white/20 bg-white/[0.02] hover:border-white/40"
            )}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => handleDragEvents(e, true)}
            onDragLeave={(e) => handleDragEvents(e, false)}
        >
            <Upload className="h-10 w-10 text-white/30 mb-4" />
            <span className="text-white/60 font-semibold">{t('poseAnimator.dropImage')}</span>
            <span className="text-white/40 text-sm mt-1">{t('poseAnimator.clickToUpload')}</span>
            <input id={id} type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
        </label>
    );
};

// ImageViewer Component
const ImageViewer = ({ title, imageUrl, children }: { title: string, imageUrl: string | null, children?: React.ReactNode }) => {
    return (
        <div className="bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col w-full">
            <h3 className="font-bold text-2xl text-white mb-4">{title}</h3>
            <div className="aspect-[4/5] w-full bg-white/[0.02] rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center text-white/40 text-center relative overflow-hidden">
                {imageUrl ? <img src={imageUrl} alt={title} className="w-full h-full object-contain" /> : null}
                {children}
            </div>
        </div>
    );
};

// Main component
export function PoseAnimator() {
    const { t } = useTranslation();
    const { addImageToLibrary, logGenerationActivity, selectedImageForTool, clearSelectedImageForTool } = useMediaLibrary();
    const [view, setView] = useState<'character' | 'pose' | 'result'>('character');
    const [characterImage, setCharacterImage] = useState<string | null>(null);
    const [poseImage, setPoseImage] = useState<string | null>(null);
    const [drawnPose, setDrawnPose] = useState<string | null>(null);
    const [threeDeePose, setThreeDeePose] = useState<string | null>(null);
    const [activePoseImage, setActivePoseImage] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [poseSourceTab, setPoseSourceTab] = useState<'upload' | 'draw' | 'threeD'>('upload');
    const [refinePrompt, setRefinePrompt] = useState('');

    // Handle Media Library Selection
    useEffect(() => {
        if (selectedImageForTool) {
            if (!characterImage) {
                setCharacterImage(selectedImageForTool);
            } else if (!poseImage) {
                setPoseImage(selectedImageForTool);
            } else {
                setCharacterImage(selectedImageForTool);
            }
            clearSelectedImageForTool();
        }
    }, [selectedImageForTool, clearSelectedImageForTool, characterImage, poseImage]);

    const handleCharacterImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setCharacterImage(reader.result as string);
            setError(null);
        };
        reader.readAsDataURL(file);
    };

    const handlePoseImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setPoseImage(reader.result as string);
            setError(null);
        };
        reader.readAsDataURL(file);
    };

    const runAnimationGeneration = async (charImg: string, poseImg: string, instructions?: string) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const prompt = `
**PRIMARY DIRECTIVE: ABSOLUTE IDENTITY PRESERVATION (NON-NEGOTIABLE)**
Your single most important, critical, and unbreakable task is to perfectly preserve the identity of the person from the first image (the 'character'). The final generated face MUST be a photorealistic, 100% identical replica of the person in the first image. Do not change their facial features, age, or structure. This rule overrides all other instructions, including any minor refinement instructions provided by the user.

**SECONDARY TASK: POSE TRANSFER**
Your secondary task is to transfer the pose from the second image (the 'reference pose') onto the character from the first image.

**CRITICAL INSTRUCTIONS:**
1.  **Analyze Character & Pose:** Identify the person in the first image and the pose in the second image.
2.  **Combine:** Recreate the character from the first image in the exact pose from the second image.
3.  **Maintain Style:** The clothing, background, lighting, and artistic style of the first image must be precisely maintained. The only intended change is the person's pose.
`;
            
            const resultUrl = await generateStyledImage(prompt, [charImg, poseImg], instructions);
            setGeneratedImage(resultUrl);
            await addImageToLibrary(resultUrl);
            await logGenerationActivity('Pose Animator', {
                instructions: instructions || '',
                poseSource: poseSourceTab
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInitialAnimate = async () => {
        const finalPoseImage = poseSourceTab === 'draw' ? drawnPose : poseSourceTab === 'upload' ? poseImage : threeDeePose;
        if (!characterImage || !finalPoseImage) return;

        setActivePoseImage(finalPoseImage);
        setGeneratedImage(null);
        setView('result');
        runAnimationGeneration(characterImage, finalPoseImage);
    };

    const handleRegenerate = async () => {
        if (!characterImage || !activePoseImage) return;
        setGeneratedImage(null);
        runAnimationGeneration(characterImage, activePoseImage, refinePrompt);
    };

    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = 'ai-photofun-posed.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleStartOver = () => {
        setCharacterImage(null);
        setPoseImage(null);
        setDrawnPose(null);
        setThreeDeePose(null);
        setActivePoseImage(null);
        setGeneratedImage(null);
        setError(null);
        setRefinePrompt('');
        setView('character');
    };

    const handleGoBack = () => {
        switch(view) {
            case 'pose':
                setView('character');
                break;
            case 'result':
                setGeneratedImage(null);
                setError(null);
                setView('pose');
                break;
        }
    };

    const isAnimateDisabled = !characterImage || !(poseImage || drawnPose || threeDeePose) || isLoading;

    const renderCharacterStep = () => (
        <div className="w-full max-w-md flex flex-col items-center gap-6">
            <div className="bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-lg w-fit">
                <h3 className="font-bold text-2xl text-white mb-2 text-center">{t('poseAnimator.step1Title')}</h3>
                <p className="text-white/60 mb-4 text-center">{t('poseAnimator.step1Desc')}</p>
                
                {characterImage ? (
                    <div className="relative group aspect-[4/5] rounded-xl overflow-hidden border border-white/10">
                        <img src={characterImage} alt={t('poseAnimator.characterImage')} className="w-full h-full object-cover" />
                        <button
                            onClick={() => setCharacterImage(null)}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-red-500/80 transition-all opacity-0 group-hover:opacity-100"
                            aria-label="Remove image"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <Uploader onImageUpload={handleCharacterImageUpload} id="character-upload" />
                )}
                
                <button
                    onClick={() => setView('pose')}
                    disabled={!characterImage}
                    className="w-full mt-6 flex items-center justify-center gap-2 text-black font-bold py-3 px-6 rounded-xl bg-white hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                    {t('common.nextStep')} &rarr;
                </button>
            </div>
        </div>
    );

    const renderPoseStep = () => (
        <div className="w-full max-w-4xl flex flex-col items-center gap-6">
            <div className="bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-lg w-full flex flex-col items-center">
                <h3 className="font-bold text-2xl text-white mb-2 text-center">{t('poseAnimator.step2Title')}</h3>
                <p className="text-white/60 mb-4 text-center">{t('poseAnimator.step2Desc')}</p>
                
                {/* Tab Switcher */}
                <div className="flex items-center justify-center gap-2 bg-white/5 p-1 rounded-lg mb-6 w-fit">
                    <button 
                        onClick={() => setPoseSourceTab('upload')} 
                        className={cn(
                            'px-4 py-2 text-sm rounded-lg transition-colors font-medium',
                            poseSourceTab === 'upload' ? 'bg-white text-black' : 'text-white/70 hover:bg-white/10'
                        )}
                    >
                        {t('poseAnimator.uploadTab')}
                    </button>
                    <button 
                        onClick={() => setPoseSourceTab('draw')} 
                        className={cn(
                            'px-4 py-2 text-sm rounded-lg transition-colors font-medium',
                            poseSourceTab === 'draw' ? 'bg-white text-black' : 'text-white/70 hover:bg-white/10'
                        )}
                    >
                        {t('poseAnimator.drawTab')}
                    </button>
                    <button 
                        onClick={() => setPoseSourceTab('threeD')} 
                        className={cn(
                            'px-4 py-2 text-sm rounded-lg transition-colors font-medium',
                            poseSourceTab === 'threeD' ? 'bg-white text-black' : 'text-white/70 hover:bg-white/10'
                        )}
                    >
                        {t('poseAnimator.threeDTab')}
                    </button>
                </div>
                
                <div className="w-full">
                    {poseSourceTab === 'upload' && (
                        <div className="w-full max-w-sm mx-auto">
                            {poseImage ? (
                                <div className="relative group aspect-[4/5] rounded-xl overflow-hidden border border-white/10">
                                    <img src={poseImage} alt={t('poseAnimator.poseImage')} className="w-full h-full object-cover" />
                                    <button 
                                        onClick={() => setPoseImage(null)} 
                                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-red-500/80 transition-all opacity-0 group-hover:opacity-100" 
                                        aria-label="Remove image"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <Uploader onImageUpload={handlePoseImageUpload} id="pose-upload" />
                            )}
                        </div>
                    )}
                    {poseSourceTab === 'draw' && (
                        <div className="max-w-sm mx-auto">
                            <DrawingCanvas onDrawingChange={setDrawnPose} />
                        </div>
                    )}
                    {poseSourceTab === 'threeD' && <ThreeDeeCanvas onPoseChange={setThreeDeePose} />}
                </div>
            </div>

            <button
                onClick={handleInitialAnimate}
                disabled={isAnimateDisabled}
                className="w-full max-w-sm flex items-center justify-center gap-2 text-black font-bold py-3 px-6 rounded-xl bg-white hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
            >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? t('poseAnimator.posingButton') : t('poseAnimator.poseButton')}
            </button>
        </div>
    );

    const renderResultView = () => (
        <div className="w-full flex flex-col items-center gap-8">
            <div className="w-full grid md:grid-cols-3 gap-6 max-w-6xl">
                <ImageViewer title={t('poseAnimator.characterImage')} imageUrl={characterImage} />
                <ImageViewer title={t('poseAnimator.poseImage')} imageUrl={activePoseImage} />
                <ImageViewer title={t('common.result')} imageUrl={generatedImage}>
                    {isLoading && (
                        <div className="w-full h-full flex items-center justify-center absolute bg-black/50">
                            <Loader2 className="h-10 w-10 text-white/40 animate-spin" />
                        </div>
                    )}
                    {error && !isLoading && (
                        <div className="p-4 text-red-400">
                            <p className="font-semibold mb-2">{t('poseAnimator.posingFailed')}</p>
                            <p className="text-xs text-white/40 mb-4">{error}</p>
                            <button onClick={handleRegenerate} className="text-sm bg-red-500/20 text-red-300 px-3 py-1 rounded-md hover:bg-red-500/40 transition-colors">{t('common.retry')}</button>
                        </div>
                    )}
                </ImageViewer>
            </div>
            
            {/* Refine Section */}
            <div className="w-full max-w-3xl bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-lg">
                <label htmlFor="refine-prompt" className="block text-lg font-bold text-white mb-2">{t('common.refineLabel')}</label>
                <textarea
                    id="refine-prompt"
                    value={refinePrompt}
                    onChange={(e) => setRefinePrompt(e.target.value)}
                    placeholder={t('common.refinePlaceholder')}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-white/30 focus:ring-2 focus:ring-white/30 focus:outline-none transition"
                />
                <button
                    onClick={handleRegenerate}
                    disabled={isLoading || !characterImage || !activePoseImage}
                    className="w-full sm:w-auto mt-4 flex items-center justify-center gap-2 text-black font-bold py-2 px-5 rounded-xl bg-white hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t('common.regenerate')}
                </button>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-8">
                <button
                    onClick={handleDownload}
                    disabled={!generatedImage || isLoading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 text-black font-bold py-3 px-6 rounded-xl bg-white hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                    <Download className="h-5 w-5" />
                    {t('common.download')}
                </button>
                <button
                    onClick={handleStartOver}
                    className="font-bold text-center text-white/40 hover:text-white transition-colors py-3 px-6"
                >
                    {t('common.startOver')}
                </button>
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-7xl px-6 md:px-12 py-12 flex flex-col items-center text-white">
            {/* Top bar */}
            <div className="w-full flex justify-between mb-8">
                {view === 'character' ? (
                    <BackToTools />
                ) : (
                    <GoBackTools onClick={handleGoBack} />
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
                {t('app.poseAnimatorTitle')}
                </h1>
                <p className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto">
                    {t('poseAnimator.subtitle')}
                </p>
            </motion.div>

            {view === 'character' && renderCharacterStep()}
            {view === 'pose' && renderPoseStep()}
            {view === 'result' && renderResultView()}
        </div>
    );
}

export default PoseAnimator;

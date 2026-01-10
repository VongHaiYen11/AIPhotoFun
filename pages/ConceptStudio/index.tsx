import React, { useState, DragEvent, ChangeEvent, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { generateStyledImage, generateBackgroundFromConcept, extractOutfitFromImage } from '../../services/geminiServices';
import { BackToTools } from '../../components/ui/BackToTools';
import { GoBackTools } from '../../components/ui/GoBackTools';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { useMediaLibrary } from '../../contexts/MediaLibraryContext';
import { Loader2, Download, Palette, Upload, X, RotateCcw } from 'lucide-react';

type Step = 'UPLOAD' | 'STUDIO';

interface GeneratedImageState {
    status: 'pending' | 'done' | 'error';
    url?: string;
    error?: string;
    poseId: string;
}

const Uploader = ({ 
    title, 
    description, 
    imageUrl, 
    onImageUpload, 
    onImageRemove, 
    inputId 
}: { 
    title: string;
    description: string;
    imageUrl: string | null;
    onImageUpload: (file: File) => void;
    onImageRemove: () => void;
    inputId: string;
}) => {
    const { t } = useTranslation();
    const [isDragOver, setIsDragOver] = useState(false);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImageUpload(e.target.files[0]);
        }
    };
    
    const handleDrop = (e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onImageUpload(e.dataTransfer.files[0]);
        }
    };
    
    const handleDragEvents = (e: DragEvent<HTMLElement>, enter: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(enter);
    };

    return (
        <div className="bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col items-center w-full h-full">
            <h3 className="font-bold text-2xl text-white mb-1">{t(title)}</h3>
            <p className="text-white/60 text-sm mb-4 text-center">{t(description)}</p>
            {imageUrl ? (
                <div className="relative group aspect-[4/5] w-full max-w-sm rounded-xl overflow-hidden mt-auto border border-white/10">
                    <img src={imageUrl} alt={t(title)} className="w-full h-full object-cover" />
                    <button 
                        onClick={onImageRemove} 
                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-red-500/80 transition-all opacity-0 group-hover:opacity-100" 
                        aria-label="Remove"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <label 
                    htmlFor={inputId} 
                    className={`cursor-pointer aspect-[4/5] w-full max-w-sm flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-colors mt-auto ${
                        isDragOver 
                            ? "border-indigo-500 bg-indigo-500/10" 
                            : "border-white/20 bg-white/[0.02] hover:border-white/40 hover:bg-white/[0.04]"
                    }`} 
                    onDrop={handleDrop} 
                    onDragOver={(e) => e.preventDefault()} 
                    onDragEnter={(e) => handleDragEvents(e, true)} 
                    onDragLeave={(e) => handleDragEvents(e, false)}
                >
                    <Upload className="h-10 w-10 text-white/30 mb-4" />
                    <span className="text-white/60 font-semibold">{t('conceptStudio.dropImage')}</span>
                    <span className="text-white/40 text-sm mt-1">{t('conceptStudio.clickToUpload')}</span>
                    <input 
                        id={inputId} 
                        type="file" 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/webp" 
                        onChange={handleFileChange} 
                    />
                </label>
            )}
        </div>
    );
};

const AssetViewer = ({ 
    title, 
    imageUrl, 
    isLoading, 
    error, 
    onRetry 
}: { 
    title: string;
    imageUrl: string | null;
    isLoading: boolean;
    error: string | null;
    onRetry?: () => void;
}) => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center gap-2 w-full">
            <p className="font-bold text-white/90">{title}</p>
            <div className="w-full aspect-[4/5] object-cover rounded-xl bg-white/[0.02] border-2 border-dashed border-white/10 flex items-center justify-center text-white/40 text-center relative overflow-hidden">
                {isLoading && (
                    <Loader2 className="h-10 w-10 text-white/40 animate-spin" />
                )}
                {error && !isLoading && (
                    <div className="p-4 text-red-400">
                        <p className="font-semibold mb-2">{t('conceptStudio.generationFailed')}</p>
                        <p className="text-xs text-white/40 mb-4">{error}</p>
                        {onRetry && (
                            <button 
                                onClick={onRetry} 
                                className="text-sm bg-red-500/20 text-red-300 px-3 py-1 rounded-md hover:bg-red-500/40 transition-colors"
                            >
                                {t('common.retry')}
                            </button>
                        )}
                    </div>
                )}
                {imageUrl && !isLoading && !error && (
                    <img src={imageUrl} alt={title} className="w-full h-full object-cover"/>
                )}
            </div>
        </div>
    );
};

const ADULT_POSES = [
    { id: 'prof_arms_crossed', labelKey: 'conceptStudio.poses.prof_arms_crossed', prompt: 'a confident, professional stance with arms crossed.' },
    { id: 'prof_presenting', labelKey: 'conceptStudio.poses.prof_presenting', prompt: 'a professional presenting gesture with one open hand towards an imaginary chart.' },
    { id: 'prof_leaning_desk', labelKey: 'conceptStudio.poses.prof_leaning_desk', prompt: 'casually leaning against the edge of a modern office desk.' },
    { id: 'prof_holding_tablet', labelKey: 'conceptStudio.poses.prof_holding_tablet', prompt: 'holding and looking at a tablet computer with a thoughtful expression.' },
    { id: 'prof_walking', labelKey: 'conceptStudio.poses.prof_walking', prompt: 'walking forward with a determined and confident expression.' },
    { id: 'prof_headshot', labelKey: 'conceptStudio.poses.prof_headshot', prompt: 'a professional headshot from the chest up, with a friendly and approachable smile.' },
    { id: 'prof_sitting_chair', labelKey: 'conceptStudio.poses.prof_sitting_chair', prompt: 'sitting in a modern office chair, leaning forward slightly as if in a meeting.' },
    { id: 'cas_laughing', labelKey: 'conceptStudio.poses.cas_laughing', prompt: 'a candid moment, laughing genuinely and looking slightly away from the camera.' },
    { id: 'cas_walking_street', labelKey: 'conceptStudio.poses.cas_walking_street', prompt: 'walking down a city street, looking thoughtfully to the side.' },
    { id: 'cas_sipping_coffee', labelKey: 'conceptStudio.poses.cas_sipping_coffee', prompt: 'sitting at an outdoor cafe table, sipping a cup of coffee.' },
    { id: 'cas_leaning_wall', labelKey: 'conceptStudio.poses.cas_leaning_wall', prompt: 'casually leaning against a rustic brick wall.' },
    { id: 'cas_hands_pockets', labelKey: 'conceptStudio.poses.cas_hands_pockets', prompt: 'a relaxed stance with hands in their pockets.' },
    { id: 'cas_sitting_steps', labelKey: 'conceptStudio.poses.cas_sitting_steps', prompt: 'sitting casually on outdoor concrete steps.' },
    { id: 'cas_over_shoulder', labelKey: 'conceptStudio.poses.cas_over_shoulder', prompt: 'glancing back over their shoulder towards the camera with a smile.' },
    { id: 'cas_joyful_jump', labelKey: 'conceptStudio.poses.cas_joyful_jump', prompt: 'captured mid-air in a joyful, energetic jump.' },
    { id: 'fas_low_angle', labelKey: 'conceptStudio.poses.fas_low_angle', prompt: 'a dramatic, full-body shot taken from a very low angle.' },
    { id: 'fas_static_pose', labelKey: 'conceptStudio.poses.fas_static_pose', prompt: 'a high-fashion, static, and slightly unconventional pose.' },
    { id: 'fas_twirling', labelKey: 'conceptStudio.poses.fas_twirling', prompt: 'a dynamic shot captured mid-twirl, with clothing showing motion.' },
    { id: 'fas_lying_down', labelKey: 'conceptStudio.poses.fas_lying_down', prompt: 'lying on their back or side on the ground, looking up at the camera.' },
    { id: 'fas_crouching', labelKey: 'conceptStudio.poses.fas_crouching', prompt: 'a stylish crouching or squatting pose.' },
    { id: 'fas_back_to_camera', labelKey: 'conceptStudio.poses.fas_back_to_camera', prompt: 'standing with their back to the camera, looking over one shoulder.' },
    { id: 'fas_shadow_play', labelKey: 'conceptStudio.poses.fas_shadow_play', prompt: 'interacting with strong light and shadows, creating artistic patterns on them.' },
    { id: 'fas_silhouette', labelKey: 'conceptStudio.poses.fas_silhouette', prompt: 'a powerful silhouette pose against a bright background.' },
    { id: 'act_yoga', labelKey: 'conceptStudio.poses.act_yoga', prompt: 'holding a strong and balanced yoga pose, like the Warrior II pose.' },
    { id: 'act_stretching', labelKey: 'conceptStudio.poses.act_stretching', prompt: 'in a dynamic pre-workout stretching pose.' },
    { id: 'act_jogging', labelKey: 'conceptStudio.poses.act_jogging', prompt: 'in a natural jogging or running motion.' },
    { id: 'act_holding_ball', labelKey: 'conceptStudio.poses.act_holding_ball', prompt: 'holding a basketball or soccer ball in a sporty, ready-to-play stance.' },
    { id: 'hob_reading', labelKey: 'conceptStudio.poses.hob_reading', prompt: 'sitting comfortably in a chair, engrossed in reading a book.' },
    { id: 'hob_guitar', labelKey: 'conceptStudio.poses.hob_guitar', prompt: 'sitting on a stool and playing an acoustic guitar.' },
    { id: 'hob_painting', labelKey: 'conceptStudio.poses.hob_painting', prompt: 'standing in front of an easel with a paintbrush, focused on their artwork.' },
];

export const ConceptStudio: React.FC = () => {
    const { t } = useTranslation();
    const { addImageToLibrary } = useMediaLibrary();
    const [step, setStep] = useState<Step>('UPLOAD');
    
    // Uploaded images
    const [characterImage, setCharacterImage] = useState<string | null>(null);
    const [conceptImage, setConceptImage] = useState<string | null>(null);
    
    // Generated assets
    const [extractedBackground, setExtractedBackground] = useState<string | null>(null);
    const [extractedOutfit, setExtractedOutfit] = useState<string | null>(null);
    
    // Generated final images
    const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImageState>>({});

    // Loading & Error states
    const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
    const [isOutfitLoading, setIsOutfitLoading] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    
    const [backgroundError, setBackgroundError] = useState<string | null>(null);
    const [outfitError, setOutfitError] = useState<string | null>(null);
    
    // Compose options
    const [selectedPoses, setSelectedPoses] = useState<string[]>([]);

    useEffect(() => {
        // Clear results when pose selection changes after a generation
        if (Object.keys(generatedImages).length > 0) {
            setGeneratedImages({});
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPoses]);

    const handleImageUpload = useCallback((file: File, setImage: (dataUrl: string) => void) => {
        const reader = new FileReader();
        reader.onloadend = () => { setImage(reader.result as string); };
        reader.readAsDataURL(file);
    }, []);

    const handleStartOver = () => {
        setStep('UPLOAD');
        setCharacterImage(null);
        setConceptImage(null);
        setExtractedBackground(null);
        setExtractedOutfit(null);
        setGeneratedImages({});
        setIsBackgroundLoading(false);
        setIsOutfitLoading(false);
        setIsComposing(false);
        setBackgroundError(null);
        setOutfitError(null);
        setSelectedPoses([]);
    };

    const handleGenerateBackground = async () => {
        if (!conceptImage) return;
        setIsBackgroundLoading(true);
        setBackgroundError(null);
        try {
            const result = await generateBackgroundFromConcept(conceptImage);
            setExtractedBackground(result);
        } catch (err) {
            setBackgroundError(err instanceof Error ? err.message : "Background creation failed.");
        } finally {
            setIsBackgroundLoading(false);
        }
    };
    
    const handleGenerateOutfit = async () => {
        if (!conceptImage) return;
        setIsOutfitLoading(true);
        setOutfitError(null);
        try {
            const result = await extractOutfitFromImage(conceptImage);
            setExtractedOutfit(result);
        } catch (err) {
            setOutfitError(err instanceof Error ? err.message : "Outfit extraction failed.");
        } finally {
            setIsOutfitLoading(false);
        }
    };

    const handleGenerateAssets = () => {
        setStep('STUDIO');
        handleGenerateBackground();
        handleGenerateOutfit();
    };

    const handlePoseToggle = (poseId: string) => {
        setSelectedPoses(prev =>
            prev.includes(poseId)
                ? prev.filter(id => id !== poseId)
                : [...prev, poseId]
        );
    };

    const generateSingleImage = async (poseId: string) => {
        if (!characterImage || !extractedBackground || !extractedOutfit) return;

        const pose = ADULT_POSES.find(p => p.id === poseId);
        if (!pose) return;

        setGeneratedImages(prev => ({
            ...prev,
            [poseId]: { status: 'pending', poseId }
        }));
        
        try {
            const prompt = `
**PRIMARY DIRECTIVE: ABSOLUTE IDENTITY PRESERVATION (NON-NEGOTIABLE)**
Your single most important, critical, and unbreakable task is to perfectly preserve the identity of the person from the first image (the 'Character' image). The final generated face MUST be a photorealistic, 100% identical replica.

-   **FACIAL FEATURES ARE SACRED:** You must replicate the **exact** shape of the eyes, nose, mouth, jawline, chin, and overall facial structure.
-   **UNIQUE DETAILS ARE CRITICAL:** Preserve any unique identifiers like moles, freckles, scars, or specific skin textures. Do not remove or alter them.
-   **HAIR INTEGRITY:** Maintain the original hair color, style, and texture as closely as possible.

**SECONDARY TASK: COMPOSITION**
After satisfying the identity preservation rule, perform the following composition:
1.  **Place the Character:** Take the person (from the first image) and place them realistically into the background (the second image).
2.  **Apply the Outfit:** Dress the person in the outfit provided in the third image. The fit should be natural.
3.  **Apply the Pose:** The person's final pose should be: ${pose.prompt}.
4.  **Seamless Integration:** The lighting, shadows, and color grading on the person must be adjusted to perfectly match the new background and environment for a cohesive final photograph.
`;
            
            const resultUrl = await generateStyledImage(prompt, [characterImage, extractedBackground, extractedOutfit]);
            setGeneratedImages(prev => ({
                ...prev,
                [poseId]: { ...prev[poseId], status: 'done', url: resultUrl }
            }));
            addImageToLibrary(resultUrl);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Final image generation failed.";
            setGeneratedImages(prev => ({
                ...prev,
                [poseId]: { ...prev[poseId], status: 'error', error: errorMessage }
            }));
        }
    };

    const handleFinalGeneration = async () => {
        if (selectedPoses.length === 0) return;
        setIsComposing(true);

        const generationPromises = selectedPoses.map(poseId => generateSingleImage(poseId));
        await Promise.all(generationPromises);

        setIsComposing(false);
    };

    const handleDownload = (url: string | null | undefined, poseId: string) => {
        if (!url) return;
        const link = document.createElement('a');
        link.href = url;
        link.download = `concept-studio-${poseId}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const generateButtonText = () => {
        if (isComposing) return t('conceptStudio.generatingFinalButton');
        const count = selectedPoses.length;
        if (count > 0) {
            return `${t('conceptStudio.generateFinalButton')} (${count})`;
        }
        return t('conceptStudio.generateFinalButton');
    };

    const renderUploadStep = () => (
        <div className="w-full flex flex-col items-center gap-8">
            <div className="w-full grid md:grid-cols-2 gap-8 max-w-4xl">
                <Uploader 
                    title='conceptStudio.characterImage' 
                    description='conceptStudio.characterImageDesc' 
                    imageUrl={characterImage} 
                    onImageUpload={(file) => handleImageUpload(file, setCharacterImage)} 
                    onImageRemove={() => setCharacterImage(null)} 
                    inputId="character-upload" 
                />
                <Uploader 
                    title='conceptStudio.conceptImage' 
                    description='conceptStudio.conceptImageDesc' 
                    imageUrl={conceptImage} 
                    onImageUpload={(file) => handleImageUpload(file, setConceptImage)} 
                    onImageRemove={() => setConceptImage(null)} 
                    inputId="concept-upload" 
                />
            </div>
            <button 
                onClick={handleGenerateAssets} 
                disabled={!characterImage || !conceptImage} 
                className="w-full max-w-sm flex items-center justify-center gap-2 text-black font-bold py-3 px-6 rounded-xl bg-white hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 mt-8"
            >
                {t('conceptStudio.createAssetsButton')}
            </button>
        </div>
    );
    
    const renderStudioStep = () => (
        <div className="w-full flex flex-col items-center gap-12">
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
                {/* Assets */}
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-2xl p-6">
                    <AssetViewer 
                        title={t('conceptStudio.assetCharacter')} 
                        imageUrl={characterImage} 
                        isLoading={false} 
                        error={null} 
                    />
                    <AssetViewer 
                        title={t('conceptStudio.assetBackground')} 
                        imageUrl={extractedBackground} 
                        isLoading={isBackgroundLoading} 
                        error={backgroundError} 
                        onRetry={handleGenerateBackground} 
                    />
                    <AssetViewer 
                        title={t('conceptStudio.assetOutfit')} 
                        imageUrl={extractedOutfit} 
                        isLoading={isOutfitLoading} 
                        error={outfitError} 
                        onRetry={handleGenerateOutfit} 
                    />
                </div>
    
                {/* Poses & Generation */}
                <div className="flex flex-col gap-4 bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-2xl p-6">
                    <h3 className="font-bold text-xl text-white">{t('conceptStudio.changePose')}</h3>
                    <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto pr-2">
                        {ADULT_POSES.map(pose => (
                             <button
                                key={pose.id}
                                onClick={() => handlePoseToggle(pose.id)}
                                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                                    selectedPoses.includes(pose.id)
                                        ? 'bg-white text-black font-bold'
                                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                                }`}
                            >
                                {t(pose.labelKey)}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={handleFinalGeneration} 
                        disabled={isComposing || !extractedBackground || !extractedOutfit || selectedPoses.length === 0} 
                        className="w-full mt-4 flex items-center justify-center gap-2 text-black font-bold py-3 px-6 rounded-xl bg-white hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                    >
                        {isComposing && <Loader2 className="w-4 h-4 animate-spin" />}
                        {generateButtonText()}
                    </button>
                </div>
            </div>
    
            {/* Result Area */}
            {(Object.keys(generatedImages).length > 0 || (isComposing && selectedPoses.length > 0)) && (
                <div className="w-full flex flex-col items-center gap-4 mt-8">
                    <h2 className="text-3xl font-extrabold text-white">{t('conceptStudio.finalResultTitle')}</h2>
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(isComposing && Object.keys(generatedImages).length === 0 ? selectedPoses : Object.keys(generatedImages)).map(poseId => {
                            const imgState = generatedImages[poseId];
                            const pose = ADULT_POSES.find(p => p.id === poseId)!;
                            return (
                                <div key={poseId} className="relative group">
                                    <AssetViewer
                                        title={t(pose.labelKey)}
                                        imageUrl={imgState?.url ?? null}
                                        isLoading={!imgState || imgState.status === 'pending'}
                                        error={imgState?.error ?? null}
                                        onRetry={() => generateSingleImage(poseId)}
                                    />
                                    {imgState?.status === 'done' && imgState.url && (
                                        <button
                                            onClick={() => handleDownload(imgState.url, poseId)}
                                            className="absolute top-12 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/75 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            aria-label={t('common.download')}
                                        >
                                            <Download className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
    
    return (
        <div className="w-full max-w-7xl px-6 md:px-12 py-12 flex flex-col items-center text-white">
            {/* Top bar */}
            <div className="w-full flex justify-between mb-8">
                {step === 'UPLOAD' ? (
                    <BackToTools />
                ) : (
                    <GoBackTools onClick={handleStartOver} />
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
                    <Palette className="w-8 h-8 text-white" />
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                        {t('app.conceptStudioTitle')}
                    </h1>
                </div>
                <p className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto">
                    {t('conceptStudio.subtitle')}
                </p>
            </motion.div>

            {step === 'UPLOAD' && renderUploadStep()}
            {step === 'STUDIO' && renderStudioStep()}
        </div>
    );
};

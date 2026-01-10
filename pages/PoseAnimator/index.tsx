import React, { useState, ChangeEvent, DragEvent, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { MainLayout } from '../../layouts/MainLayout';
import { BackToTools } from '../../components/ui/BackToTools';
import { GoBackTools } from '../../components/ui/GoBackTools';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { DrawingCanvas } from '../../components/ui/DrawingCanvas';
import { ThreeDeeCanvas } from '../../components/ui/ThreeDeeCanvas';
import { generateStyledImage } from '../../services/geminiServices';
import { 
    Loader2, 
    Upload, 
    Wand2, 
    Image as ImageIcon, 
    Check, 
    ChevronRight, 
    Download, 
    Undo2, 
    Pencil, 
    Move3D,
    ImagePlus
} from 'lucide-react';

type Step = 'UPLOAD' | 'POSE' | 'RESULT';
type PoseInputMode = '3d' | 'draw' | 'upload';

// Input modes for pose
const poseInputModes: { mode: PoseInputMode; icon: React.ReactNode; labelKey: string }[] = [
    { mode: '3d', icon: <Move3D className="w-4 h-4" />, labelKey: 'poseAnimator.mode3d' },
    { mode: 'draw', icon: <Pencil className="w-4 h-4" />, labelKey: 'poseAnimator.modeDraw' },
    { mode: 'upload', icon: <ImagePlus className="w-4 h-4" />, labelKey: 'poseAnimator.modeUpload' },
];

export const PoseAnimator: React.FC = () => {
    const { t } = useTranslation();
    
    const [step, setStep] = useState<Step>('UPLOAD');
    const [characterImage, setCharacterImage] = useState<string | null>(null);
    const [poseImage, setPoseImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [poseInputMode, setPoseInputMode] = useState<PoseInputMode>('3d');
    const [isDragOver, setIsDragOver] = useState(false);
    const [isPoseDragOver, setIsPoseDragOver] = useState(false);
    const [refinementPrompt, setRefinementPrompt] = useState('');

    // Handle file upload for character
    const handleCharacterUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setCharacterImage(reader.result as string);
            setStep('POSE');
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleCharacterUpload(e.target.files[0]);
        }
    };

    const handleDrop = (e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleCharacterUpload(e.dataTransfer.files[0]);
        }
    };

    const handleDragEvents = (e: DragEvent<HTMLElement>, enter: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(enter);
    };

    // Handle pose image upload (for 'upload' mode)
    const handlePoseImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setPoseImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handlePoseFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handlePoseImageUpload(e.target.files[0]);
        }
    };

    const handlePoseDrop = (e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsPoseDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handlePoseImageUpload(e.dataTransfer.files[0]);
        }
    };

    const handlePoseDragEvents = (e: DragEvent<HTMLElement>, enter: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsPoseDragOver(enter);
    };

    // Handle drawing change from DrawingCanvas
    const handleDrawingChange = useCallback((dataUrl: string | null) => {
        setPoseImage(dataUrl);
    }, []);

    // Handle 3D pose change from ThreeDeeCanvas
    const handlePoseChange = useCallback((dataUrl: string | null) => {
        setPoseImage(dataUrl);
    }, []);

    // Generate the result
    const handleGenerate = async () => {
        if (!characterImage || !poseImage) return;

        setIsLoading(true);
        setError(null);

        try {
            // Build prompt for pose transfer
            let prompt = `Take the person/character from the first image and recreate them in the exact pose shown in the second image (the pose reference). 
                         Maintain the character's original appearance, clothing, and style. 
                         The background should be neutral or similar to the original.`;
            
            let additionalInstructions = '';
            if (refinementPrompt.trim()) {
                additionalInstructions = refinementPrompt.trim();
            }

            // Use generateStyledImage with both images
            const result = await generateStyledImage(
                prompt,                             // prompt
                [characterImage, poseImage],        // imageUrls array
                additionalInstructions              // additional instructions
            );

            if (result) {
                setResultImage(result);
                setStep('RESULT');
            } else {
                setError(t('poseAnimator.generateError'));
            }
        } catch (err) {
            console.error('Error generating pose:', err);
            setError(t('poseAnimator.generateError'));
        } finally {
            setIsLoading(false);
        }
    };

    // Download result
    const handleDownload = () => {
        if (!resultImage) return;
        const link = document.createElement('a');
        link.download = `pose-animator-${Date.now()}.png`;
        link.href = resultImage;
        link.click();
    };

    // Reset to start
    const handleReset = () => {
        setStep('UPLOAD');
        setCharacterImage(null);
        setPoseImage(null);
        setResultImage(null);
        setRefinementPrompt('');
        setError(null);
    };

    // Go back to pose step
    const handleBackToPose = () => {
        setStep('POSE');
        setResultImage(null);
        setError(null);
    };

    return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
                {/* Header */}
                <div className="w-full max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <BackToTools />
                        <LanguageSwitcher />
                    </div>
                    
                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            {t('poseAnimator.title')}
                        </h1>
                        <p className="text-white/60 text-sm md:text-base">
                            {t('poseAnimator.description')}
                        </p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-center gap-4 mb-8">
                        {['UPLOAD', 'POSE', 'RESULT'].map((s, i) => (
                            <React.Fragment key={s}>
                                <div className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                                    step === s 
                                        ? "bg-indigo-500 text-white" 
                                        : ['UPLOAD', 'POSE', 'RESULT'].indexOf(step) > i
                                            ? "bg-green-500/20 text-green-400"
                                            : "bg-white/10 text-white/40"
                                )}>
                                    {['UPLOAD', 'POSE', 'RESULT'].indexOf(step) > i ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        <span className="w-4 h-4 flex items-center justify-center text-xs font-bold">
                                            {i + 1}
                                        </span>
                                    )}
                                    <span className="text-sm font-medium hidden md:inline">
                                        {t(`poseAnimator.step${s.charAt(0) + s.slice(1).toLowerCase()}`)}
                                    </span>
                                </div>
                                {i < 2 && (
                                    <ChevronRight className="w-4 h-4 text-white/20" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="w-full max-w-5xl mx-auto flex-grow">
                    <AnimatePresence mode="wait">
                        {/* UPLOAD Step */}
                        {step === 'UPLOAD' && (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="h-full flex flex-col items-center justify-center"
                            >
                                <label
                                    htmlFor="character-upload"
                                    className={cn(
                                        "w-full max-w-md aspect-square cursor-pointer",
                                        "flex flex-col items-center justify-center gap-4",
                                        "border-2 border-dashed rounded-2xl transition-all duration-300",
                                        isDragOver
                                            ? "border-indigo-500 bg-indigo-500/10"
                                            : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
                                    )}
                                    onDrop={handleDrop}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDragEnter={(e) => handleDragEvents(e, true)}
                                    onDragLeave={(e) => handleDragEvents(e, false)}
                                >
                                    <Upload className="w-12 h-12 text-white/30" />
                                    <div className="text-center">
                                        <p className="text-white font-medium">
                                            {t('poseAnimator.uploadCharacter')}
                                        </p>
                                        <p className="text-white/40 text-sm mt-1">
                                            {t('poseAnimator.dragOrClick')}
                                        </p>
                                    </div>
                                    <input
                                        id="character-upload"
                                        type="file"
                                        className="hidden"
                                        accept="image/png, image/jpeg, image/webp"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </motion.div>
                        )}

                        {/* POSE Step */}
                        {step === 'POSE' && (
                            <motion.div
                                key="pose"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="h-full"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Character Preview */}
                                    <div className="bg-white/5 rounded-2xl p-4 flex flex-col">
                                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                            <ImageIcon className="w-5 h-5" />
                                            {t('poseAnimator.yourCharacter')}
                                        </h3>
                                        <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-black/40">
                                            {characterImage && (
                                                <img
                                                    src={characterImage}
                                                    alt="Character"
                                                    className="w-full h-full object-contain"
                                                />
                                            )}
                                        </div>
                                        <button
                                            onClick={handleReset}
                                            className="mt-3 flex items-center justify-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                                        >
                                            <Undo2 className="w-4 h-4" />
                                            {t('poseAnimator.changeCharacter')}
                                        </button>
                                    </div>

                                    {/* Pose Input */}
                                    <div className="bg-white/5 rounded-2xl p-4 flex flex-col">
                                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                            <Move3D className="w-5 h-5" />
                                            {t('poseAnimator.definePose')}
                                        </h3>

                                        {/* Mode Tabs */}
                                        <div className="flex gap-2 mb-4">
                                            {poseInputModes.map(({ mode, icon, labelKey }) => (
                                                <button
                                                    key={mode}
                                                    onClick={() => {
                                                        setPoseInputMode(mode);
                                                        setPoseImage(null);
                                                    }}
                                                    className={cn(
                                                        "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                                                        poseInputMode === mode
                                                            ? "bg-indigo-500 text-white"
                                                            : "bg-white/10 text-white/60 hover:bg-white/20"
                                                    )}
                                                >
                                                    {icon}
                                                    <span className="hidden sm:inline">{t(labelKey)}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Mode Content */}
                                        <div className="flex-grow min-h-0">
                                            {poseInputMode === '3d' && (
                                                <ThreeDeeCanvas onPoseChange={handlePoseChange} />
                                            )}
                                            
                                            {poseInputMode === 'draw' && (
                                                <DrawingCanvas onDrawingChange={handleDrawingChange} />
                                            )}
                                            
                                            {poseInputMode === 'upload' && (
                                                <div className="h-full flex flex-col">
                                                    {poseImage ? (
                                                        <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-black/40 group">
                                                            <img
                                                                src={poseImage}
                                                                alt="Pose reference"
                                                                className="w-full h-full object-contain"
                                                            />
                                                            <button
                                                                onClick={() => setPoseImage(null)}
                                                                className="absolute top-2 right-2 p-2 bg-black/60 rounded-lg text-white hover:bg-red-500/80 transition-all opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Undo2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label
                                                            htmlFor="pose-upload"
                                                            className={cn(
                                                                "aspect-[4/5] cursor-pointer",
                                                                "flex flex-col items-center justify-center gap-4",
                                                                "border-2 border-dashed rounded-xl transition-all duration-300",
                                                                isPoseDragOver
                                                                    ? "border-indigo-500 bg-indigo-500/10"
                                                                    : "border-white/20 bg-white/5 hover:border-white/40"
                                                            )}
                                                            onDrop={handlePoseDrop}
                                                            onDragOver={(e) => e.preventDefault()}
                                                            onDragEnter={(e) => handlePoseDragEvents(e, true)}
                                                            onDragLeave={(e) => handlePoseDragEvents(e, false)}
                                                        >
                                                            <Upload className="w-8 h-8 text-white/30" />
                                                            <div className="text-center">
                                                                <p className="text-white/80 text-sm">
                                                                    {t('poseAnimator.uploadPose')}
                                                                </p>
                                                                <p className="text-white/40 text-xs mt-1">
                                                                    {t('poseAnimator.poseHint')}
                                                                </p>
                                                            </div>
                                                            <input
                                                                id="pose-upload"
                                                                type="file"
                                                                className="hidden"
                                                                accept="image/png, image/jpeg, image/webp"
                                                                onChange={handlePoseFileChange}
                                                            />
                                                        </label>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Refinement Prompt */}
                                <div className="mt-6 bg-white/5 rounded-xl p-4">
                                    <label className="block text-white/80 text-sm font-medium mb-2">
                                        {t('poseAnimator.refinementPrompt')} ({t('common.optional')})
                                    </label>
                                    <input
                                        type="text"
                                        value={refinementPrompt}
                                        onChange={(e) => setRefinementPrompt(e.target.value)}
                                        placeholder={t('poseAnimator.refinementPlaceholder')}
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Generate Button */}
                                <div className="mt-6 flex justify-center">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={!poseImage || isLoading}
                                        className={cn(
                                            "flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all",
                                            poseImage && !isLoading
                                                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/30"
                                                : "bg-white/10 text-white/30 cursor-not-allowed"
                                        )}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                {t('poseAnimator.generating')}
                                            </>
                                        ) : (
                                            <>
                                                <Wand2 className="w-5 h-5" />
                                                {t('poseAnimator.generate')}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* RESULT Step */}
                        {step === 'RESULT' && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="h-full flex flex-col items-center"
                            >
                                <div className="w-full max-w-2xl">
                                    {/* Result Image */}
                                    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-white/5 mb-6">
                                        {resultImage && (
                                            <img
                                                src={resultImage}
                                                alt="Result"
                                                className="w-full h-full object-contain"
                                            />
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-4 justify-center">
                                        <button
                                            onClick={handleDownload}
                                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
                                        >
                                            <Download className="w-5 h-5" />
                                            {t('common.download')}
                                        </button>
                                        <button
                                            onClick={handleBackToPose}
                                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors"
                                        >
                                            <Undo2 className="w-5 h-5" />
                                            {t('poseAnimator.tryAnotherPose')}
                                        </button>
                                        <button
                                            onClick={handleReset}
                                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors"
                                        >
                                            {t('common.startOver')}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="mt-8">
                    <GoBackTools />
                </div>
            </div>
    );
}

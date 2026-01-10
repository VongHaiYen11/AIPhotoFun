import React, { useState, ChangeEvent, DragEvent, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, RotateCcw, ChevronDown, Loader2 } from 'lucide-react';

interface ThreeDeeCanvasProps {
    onPoseChange: (dataUrl: string | null) => void;
}

// Simplified version without actual Three.js - provides pose image upload + basic controls
export const ThreeDeeCanvas: React.FC<ThreeDeeCanvasProps> = ({ onPoseChange }) => {
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const [poseReferenceImage, setPoseReferenceImage] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Draw stick figure on canvas
    const drawStickFigure = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.fillStyle = '#333333';
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
            ctx.stroke();
        }
        for (let i = 0; i < height; i += 40) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(width, i);
            ctx.stroke();
        }
        
        // Draw stick figure
        const centerX = width / 2;
        const headY = height * 0.15;
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        // Head
        ctx.beginPath();
        ctx.arc(centerX, headY, 25, 0, Math.PI * 2);
        ctx.stroke();
        
        // Neck
        const neckStart = headY + 25;
        const neckEnd = neckStart + 20;
        ctx.beginPath();
        ctx.moveTo(centerX, neckStart);
        ctx.lineTo(centerX, neckEnd);
        ctx.stroke();
        
        // Spine
        const spineEnd = neckEnd + 100;
        ctx.beginPath();
        ctx.moveTo(centerX, neckEnd);
        ctx.lineTo(centerX, spineEnd);
        ctx.stroke();
        
        // Arms
        const shoulderY = neckEnd + 10;
        ctx.beginPath();
        ctx.moveTo(centerX - 60, shoulderY + 50);
        ctx.lineTo(centerX, shoulderY);
        ctx.lineTo(centerX + 60, shoulderY + 50);
        ctx.stroke();
        
        // Hands
        ctx.beginPath();
        ctx.moveTo(centerX - 60, shoulderY + 50);
        ctx.lineTo(centerX - 80, shoulderY + 100);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX + 60, shoulderY + 50);
        ctx.lineTo(centerX + 80, shoulderY + 100);
        ctx.stroke();
        
        // Legs
        const hipY = spineEnd;
        ctx.beginPath();
        ctx.moveTo(centerX - 40, hipY + 80);
        ctx.lineTo(centerX, hipY);
        ctx.lineTo(centerX + 40, hipY + 80);
        ctx.stroke();
        
        // Lower legs
        ctx.beginPath();
        ctx.moveTo(centerX - 40, hipY + 80);
        ctx.lineTo(centerX - 45, hipY + 160);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX + 40, hipY + 80);
        ctx.lineTo(centerX + 45, hipY + 160);
        ctx.stroke();
        
        // Export as image
        const dataUrl = canvas.toDataURL('image/png');
        onPoseChange(dataUrl);
    }, [onPoseChange]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        canvas.width = 400;
        canvas.height = 500;
        
        drawStickFigure();
    }, [drawStickFigure]);

    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setPoseReferenceImage(result);
            onPoseChange(result);
        };
        reader.readAsDataURL(file);
    };
    
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleImageUpload(e.target.files[0]);
        }
    };
    
    const handleDrop = (e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageUpload(e.dataTransfer.files[0]);
        }
    };
    
    const handleDragEvents = (e: DragEvent<HTMLElement>, enter: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(enter);
    };

    const handleReset = () => {
        setPoseReferenceImage(null);
        drawStickFigure();
    };

    return (
        <div className="w-full h-full flex flex-col mt-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full flex-grow min-h-0">
                {/* 3D Canvas / Preview Area */}
                <div className="md:col-span-2 relative aspect-[4/5] md:aspect-auto w-full h-[50vh] md:h-auto rounded-xl overflow-hidden bg-white/[0.02] border-2 border-dashed border-white/20">
                    {poseReferenceImage ? (
                        <img 
                            src={poseReferenceImage} 
                            alt="Pose reference" 
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <canvas
                            ref={canvasRef}
                            className="w-full h-full object-contain"
                        />
                    )}
                    <div className="absolute bottom-4 left-4 right-4 text-center">
                        <p className="text-white/50 text-sm bg-black/50 rounded-lg px-3 py-1 inline-block">
                            {poseReferenceImage ? t('poseAnimator.poseImage') : 'Default T-Pose (Upload an image to change)'}
                        </p>
                    </div>
                </div>

                {/* Controls Panel */}
                <div className="md:col-span-1 flex flex-col gap-4 min-h-0">
                    {/* Pose from Image Upload */}
                    <div className="bg-white/5 p-4 rounded-xl">
                        <h4 className="text-sm font-bold text-white mb-2">{t('poseAnimator.poseFromImageTitle')}</h4>
                        <p className="text-xs text-white/50 mb-3">{t('poseAnimator.poseFromImageDesc')}</p>
                        
                        <div className="flex gap-3 items-start">
                            {poseReferenceImage ? (
                                <div className="relative group w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-white/20">
                                    <img 
                                        src={poseReferenceImage} 
                                        alt="Pose Reference" 
                                        className="w-full h-full object-cover" 
                                    />
                                    <button 
                                        onClick={() => setPoseReferenceImage(null)} 
                                        className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-red-500/80 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <label 
                                    htmlFor="pose-ref-upload-3d" 
                                    className={cn(
                                        "cursor-pointer w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors",
                                        isDragOver 
                                            ? "border-indigo-500 bg-indigo-500/10" 
                                            : "border-white/20 bg-white/[0.02] hover:border-white/40"
                                    )}
                                    onDrop={handleDrop}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDragEnter={(e) => handleDragEvents(e, true)}
                                    onDragLeave={(e) => handleDragEvents(e, false)}
                                >
                                    <Upload className="h-5 w-5 text-white/30 mb-1" />
                                    <span className="text-white/40 text-center text-[10px] leading-tight">Upload</span>
                                    <input 
                                        id="pose-ref-upload-3d" 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/png, image/jpeg, image/webp" 
                                        onChange={handleFileChange} 
                                    />
                                </label>
                            )}
                            
                            <div className="flex flex-col gap-2 flex-grow">
                                <button 
                                    onClick={handleReset}
                                    className="w-full flex items-center justify-center gap-2 text-sm py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 transition-colors"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    {t('poseAnimator.resetPose')}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Info Panel */}
                    <div className="bg-white/5 p-4 rounded-xl flex-grow">
                        <h4 className="text-sm font-bold text-white mb-2">{t('poseAnimator.manualControls')}</h4>
                        <p className="text-xs text-white/50">
                            Full 3D pose controls require Three.js library. 
                            For now, you can upload a pose reference image above, 
                            or use the "Upload" or "Draw" tabs for pose input.
                        </p>
                        
                        <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                            <p className="text-xs text-indigo-300">
                                💡 <strong>Tip:</strong> Upload an image of a person in the pose you want, 
                                and the AI will transfer that pose to your character.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

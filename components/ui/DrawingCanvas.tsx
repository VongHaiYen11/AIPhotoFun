import React, { useRef, useEffect, useState, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

interface DrawingCanvasProps {
    onDrawingChange: (dataUrl: string | null) => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onDrawingChange }) => {
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [brushSize, setBrushSize] = useState(5);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // For high-density displays
        const scale = window.devicePixelRatio;
        canvas.width = canvas.parentElement!.clientWidth * scale;
        canvas.height = canvas.parentElement!.clientHeight * scale;

        const context = canvas.getContext('2d');
        if (!context) return;
        
        context.scale(scale, scale);
        context.lineCap = 'round';
        context.strokeStyle = '#FFFFFF'; // Pen color
        context.lineWidth = brushSize;
        contextRef.current = context;
    }, []);

    useEffect(() => {
        if (contextRef.current) {
            contextRef.current.lineWidth = brushSize;
        }
    }, [brushSize]);

    const getCoords = (e: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>): { x: number, y: number } => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        }
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const startDrawing = (e: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const context = contextRef.current;
        if (!context) return;
        
        const { x, y } = getCoords(e);
        context.beginPath();
        context.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (!isDrawing || !contextRef.current) return;
        
        const context = contextRef.current;
        const { x, y } = getCoords(e);
        
        context.globalCompositeOperation = tool === 'pen' ? 'source-over' : 'destination-out';
        context.lineTo(x, y);
        context.stroke();
    };

    const stopDrawing = () => {
        const context = contextRef.current;
        if (!context) return;

        context.closePath();
        setIsDrawing(false);

        const dataUrl = canvasRef.current?.toDataURL('image/png');
        onDrawingChange(dataUrl || null);
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        if (canvas && context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            onDrawingChange(null);
        }
    };
    
    return (
        <div className="flex flex-col h-full mt-auto">
            <div className="relative aspect-[4/5] w-full rounded-lg overflow-hidden bg-black/40 border-2 border-dashed border-neutral-700">
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>
            <div className="bg-neutral-800/50 rounded-lg p-3 mt-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setTool('pen')}
                        className={cn("p-2 rounded-md transition-colors", tool === 'pen' ? 'bg-neutral-200 text-black' : 'bg-neutral-700/50 hover:bg-neutral-600/50 text-neutral-300')}
                        aria-label={t('poseAnimator.brush')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                    </button>
                    <button
                        onClick={() => setTool('eraser')}
                        className={cn("p-2 rounded-md transition-colors", tool === 'eraser' ? 'bg-neutral-200 text-black' : 'bg-neutral-700/50 hover:bg-neutral-600/50 text-neutral-300')}
                        aria-label={t('poseAnimator.eraser')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                    </button>
                </div>
                <div className="flex-grow flex items-center gap-2 text-sm text-neutral-300">
                    <label htmlFor="brush-size" className="whitespace-nowrap">{t('poseAnimator.brushSize')}:</label>
                    <input
                        id="brush-size"
                        type="range"
                        min="1"
                        max="50"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                <button
                    onClick={handleClear}
                    className="p-2 rounded-md bg-red-500/80 hover:bg-red-500 text-white transition-colors text-sm font-semibold flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    <span className="hidden sm:inline">{t('poseAnimator.clearAll')}</span>
                </button>
            </div>
        </div>
    );
};

export default DrawingCanvas;

import React, { useRef, useEffect, useState, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { Pencil, Eraser, Trash2 } from 'lucide-react';

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
        const parent = canvas.parentElement;
        if (!parent) return;
        
        canvas.width = parent.clientWidth * scale;
        canvas.height = parent.clientHeight * scale;

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
            <div className="relative aspect-[4/5] w-full rounded-xl overflow-hidden bg-black/40 border-2 border-dashed border-white/20">
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>
            <div className="bg-white/5 rounded-xl p-3 mt-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setTool('pen')}
                        className={cn(
                            "p-2 rounded-lg transition-colors",
                            tool === 'pen' ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20 text-white/70'
                        )}
                        aria-label={t('poseAnimator.brush')}
                    >
                        <Pencil className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => setTool('eraser')}
                        className={cn(
                            "p-2 rounded-lg transition-colors",
                            tool === 'eraser' ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20 text-white/70'
                        )}
                        aria-label={t('poseAnimator.eraser')}
                    >
                        <Eraser className="h-5 w-5" />
                    </button>
                </div>
                <div className="flex-grow flex items-center gap-2 text-sm text-white/70">
                    <label htmlFor="brush-size" className="whitespace-nowrap">{t('poseAnimator.brushSize')}:</label>
                    <input
                        id="brush-size"
                        type="range"
                        min="1"
                        max="50"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                <button
                    onClick={handleClear}
                    className="p-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition-colors flex items-center gap-2"
                >
                    <Trash2 className="h-5 w-5" />
                    <span className="hidden sm:inline text-sm font-semibold">{t('poseAnimator.clearAll')}</span>
                </button>
            </div>
        </div>
    );
};

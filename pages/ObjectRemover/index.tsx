import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BackToTools } from '../../components/ui/BackToTools';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { GoBackTools } from '../../components/ui/GoBackTools';
import { removeObjectFromImage } from '../../services/geminiServices';
import { Loader2, Download, Eraser, Brush, Trash2, Undo2 } from 'lucide-react';

export const ObjectRemover: React.FC = () => {
  const { t } = useTranslation();

  // State
  const [originalImage, setOriginalImage] = useState<string | undefined>();
  const [resultImage, setResultImage] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Canvas State
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [brushSize, setBrushSize] = useState<number>(30);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset
  const resetAll = () => {
    setOriginalImage(undefined);
    setResultImage(undefined);
    setIsProcessing(false);
  };

  const handleGoBack = () => {
    // Return to editor state
    setResultImage(undefined);
    setIsProcessing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Ensure canvas is cleared when new image loads
  useEffect(() => {
    clearCanvas();
  }, [originalImage]);

  // Sync canvas size with image size
  useEffect(() => {
    const resizeCanvas = () => {
      if (containerRef.current && canvasRef.current && imageRef.current) {
        const { width, height } = imageRef.current.getBoundingClientRect();
        
        // Only update if dimensions actually changed to avoid clearing canvas unnecessarily
        if (canvasRef.current.width !== width || canvasRef.current.height !== height) {
            canvasRef.current.width = width;
            canvasRef.current.height = height;
        }
      }
    };

    window.addEventListener('resize', resizeCanvas);
    // Initial delay to ensure image is rendered
    const timeout = setTimeout(resizeCanvas, 100);
    return () => {
        window.removeEventListener('resize', resizeCanvas);
        clearTimeout(timeout);
    };
  }, [originalImage, isProcessing]);

  // Helper to get coordinates
  const getCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      let x, y;
      if ('touches' in e) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        x = (e as React.MouseEvent).clientX - rect.left;
        y = (e as React.MouseEvent).clientY - rect.top;
      }
      return { x, y };
  };

  // Drawing Logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    
    // Immediate draw on start to handle clicks/taps instantly
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoords(e);

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'brush') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255, 255, 255, 1.0)'; // White mask
    } else {
      ctx.globalCompositeOperation = 'destination-out'; // Eraser
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y); // Draw dot
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.beginPath(); // Reset path
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoords(e);

    // Ensure styles are maintained during drag (React state might trigger re-renders but ctx persists)
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (tool === 'brush') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255, 255, 255, 1.0)';
    } else {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    
    // For smooth continuous lines:
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleGenerate = async () => {
    if (!originalImage || !imageRef.current || !canvasRef.current) return;

    // 1. Synchronously capture dimensions and mask data before unmounting/state change
    const naturalWidth = imageRef.current.naturalWidth;
    const naturalHeight = imageRef.current.naturalHeight;
    const displayWidth = imageRef.current.width;
    const displayHeight = imageRef.current.height;

    // Create a temp canvas to hold the mask data scaled to natural size
    const maskSnapshotCanvas = document.createElement('canvas');
    maskSnapshotCanvas.width = naturalWidth;
    maskSnapshotCanvas.height = naturalHeight;
    const maskSnapshotCtx = maskSnapshotCanvas.getContext('2d');
    
    if (!maskSnapshotCtx) return;

    // Draw the current display canvas onto the snapshot canvas (scaling up/down)
    maskSnapshotCtx.drawImage(
        canvasRef.current,
        0, 0, displayWidth, displayHeight,
        0, 0, naturalWidth, naturalHeight
    );

    // 2. Switch state to processing (shows loading view)
    setIsProcessing(true);
    setResultImage(undefined);

    try {
      // 3. Create the final composition for the API
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = naturalWidth;
      tempCanvas.height = naturalHeight;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) throw new Error("Could not create context");

      // Draw original image
      const img = new Image();
      img.src = originalImage;
      img.crossOrigin = "anonymous";
      await new Promise(r => img.onload = r);
      ctx.drawImage(img, 0, 0, naturalWidth, naturalHeight);

      // Cut out the mask (make transparent where the user painted white)
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(maskSnapshotCanvas, 0, 0);

      const maskedImageDataUrl = tempCanvas.toDataURL('image/png');

      // 4. Call API
      const url = await removeObjectFromImage(maskedImageDataUrl);
      setResultImage(url);
    } catch (error) {
      console.error("Object removal failed:", error);
      alert(t('objectRemover.removalFailed'));
      setIsProcessing(false); // Go back to editor
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `object-removed-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Determine View State
  const showUpload = !originalImage;
  const showResult = !!resultImage || isProcessing;
  const showEditor = originalImage && !showResult;

  return (
    <div className="w-full max-w-7xl px-6 md:px-12 py-12 flex flex-col items-center text-white">
      {/* Top bar */}
      <div className="w-full flex justify-between mb-8">
        {showUpload ? (
          <BackToTools />
        ) : (
          <GoBackTools onClick={resetAll} />
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
            <Brush className="w-8 h-8 text-white" />
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
            {t('app.objectRemoverTitle')}
            </h1>
        </div>
        <p className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto">
          {t('objectRemover.subtitle')}
        </p>
      </motion.div>

      {/* VIEW 1: UPLOAD */}
      {showUpload && (
        <div
          className="
            w-full
            max-w-4xl
            bg-white/[0.04]
            backdrop-blur-xl
            border
            border-white/50
            rounded-2xl
            p-8
            flex
            flex-col
            gap-6
          "
        >
          <ImageUpload
            value={originalImage}
            onChange={setOriginalImage}
            label={t('objectRemover.dragAndDrop')}
            className="w-full h-96"
          />
        </div>
      )}

      {/* VIEW 2: EDITOR */}
      {showEditor && (
        <div className="w-full max-w-4xl flex flex-col items-center gap-6">
            
             {/* CANVAS WORKSPACE */}
             <div 
                ref={containerRef}
                className="relative w-full bg-black/40 rounded-xl border border-white/10 overflow-hidden select-none"
                style={{ maxHeight: '70vh' }}
             >
                <div className="relative w-full h-full flex justify-center items-center">
                    {/* WRAPPER FOR ALIGNMENT: Relative container that shrinks to fit the image */}
                    <div className="relative inline-block">
                        {/* Underlying Image */}
                        <img 
                            ref={imageRef}
                            src={originalImage} 
                            className="max-w-full max-h-[70vh] block select-none pointer-events-none"
                            alt="Workspace"
                            onLoad={() => {
                                // Initial size sync when image loads
                                if (canvasRef.current && imageRef.current) {
                                    const { width, height } = imageRef.current.getBoundingClientRect();
                                    canvasRef.current.width = width;
                                    canvasRef.current.height = height;
                                }
                            }}
                        />
                        
                        {/* Drawing Canvas - Overlay exactly */}
                        <canvas
                            ref={canvasRef}
                            className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={(e) => { e.preventDefault(); startDrawing(e); }}
                            onTouchMove={(e) => { e.preventDefault(); draw(e); }}
                            onTouchEnd={stopDrawing}
                        />
                    </div>
                </div>
             </div>

             {/* CONTROLS */}
             <div className="w-full bg-[#111] border border-white/10 rounded-2xl p-6 shadow-xl">
                <div className="mb-4">
                    <span className="text-lg font-bold text-white block mb-1">{t('objectRemover.controls')}</span>
                    <p className="text-white/60 text-sm">{t('objectRemover.instructions')}</p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6 justify-between mb-6">
                    
                    <div className="flex items-center gap-6 w-full md:w-auto">
                        {/* TOOLS */}
                        <div className="flex items-center bg-black/40 p-1 rounded-lg border border-white/10">
                            <button
                                onClick={() => setTool('brush')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md transition font-medium text-sm ${tool === 'brush' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                            >
                                <Brush className="w-4 h-4" />
                                {t('objectRemover.brush')}
                            </button>
                            <button
                                onClick={() => setTool('eraser')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md transition font-medium text-sm ${tool === 'eraser' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                            >
                                <Eraser className="w-4 h-4" />
                                {t('objectRemover.eraser')}
                            </button>
                        </div>

                        {/* SLIDER */}
                        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                            <span className="text-sm text-white/60 whitespace-nowrap">{t('objectRemover.brushSize')}:</span>
                            <input 
                                type="range" 
                                min="5" 
                                max="100" 
                                value={brushSize} 
                                onChange={(e) => setBrushSize(Number(e.target.value))}
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                            />
                            <div 
                                className="w-4 h-4 rounded-full bg-white border border-white/30 flex-shrink-0"
                                style={{ width: Math.max(6, brushSize / 2), height: Math.max(6, brushSize / 2) }}
                            />
                        </div>
                    </div>
                    
                    {/* CLEAR */}
                    <button
                        onClick={clearCanvas}
                        className="px-4 py-2 bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/30 rounded-lg transition text-sm font-semibold flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        {t('objectRemover.clear')}
                    </button>
                </div>

                <button
                    onClick={handleGenerate}
                    className="w-full py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-white/90 transition shadow-lg shadow-white/5"
                >
                    {t('objectRemover.remove')}
                </button>
             </div>
        </div>
      )}

      {/* VIEW 3: RESULT */}
      {showResult && (
        <div className="w-full max-w-6xl flex flex-col items-center gap-8">
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* ORIGINAL */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-center font-bold text-lg text-white/90">{t('common.original')}</h3>
                    <div className="w-full border-2 border-dashed border-white/20 rounded-2xl p-2 bg-black/20 flex items-center justify-center">
                         <img 
                            src={originalImage} 
                            alt="Original" 
                            className="w-full h-auto max-h-[600px] object-contain rounded-xl" 
                         />
                    </div>
                </div>

                {/* RESULT */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-center font-bold text-lg text-white/90">{t('objectRemover.removedResult')}</h3>
                    <div className="w-full border-2 border-dashed border-white/20 rounded-2xl p-2 bg-black/20 flex items-center justify-center relative">
                        {isProcessing ? (
                             <>
                                {/* Invisible original to prop open the box to correct size */}
                                <img 
                                    src={originalImage} 
                                    className="w-full h-auto max-h-[600px] object-contain opacity-0 pointer-events-none" 
                                    alt="Placeholder"
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                                    <span className="text-white/50 font-medium">{t('objectRemover.removing')}</span>
                                </div>
                             </>
                        ) : (
                             <img 
                                src={resultImage} 
                                alt="Result" 
                                className="w-full h-auto max-h-[600px] object-contain rounded-xl" 
                             />
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 mt-4">
                <button
                    onClick={handleDownload}
                    disabled={isProcessing || !resultImage}
                    className="px-8 py-3 bg-white text-black rounded-lg font-bold hover:bg-white/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Download className="w-4 h-4" />
                    {t('common.download')}
                </button>
                
                <button
                    onClick={handleGoBack}
                    className="px-8 py-3 border border-white/20 rounded-lg text-white font-semibold hover:bg-white/10 transition"
                >
                    {t('common.goBack')}
                </button>
            </div>
        </div>
      )}
            
    </div>
  );
};

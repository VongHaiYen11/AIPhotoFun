import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange?: (base64: string) => void;
  onRemove?: () => void;
  width?: string;
  height?: string;
  className?: string;
  label?: string;
  isLoading?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onRemove,
  width = "w-full",
  height = "h-full",
  className = "",
  label,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (onChange) onChange(base64);
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div 
      className={`relative group ${width} ${height} ${className}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <AnimatePresence mode="wait">
        {value ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 group-hover:border-white/20 transition-colors shadow-2xl"
          >
            <img 
              src={value} 
              alt="Uploaded content" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove?.();
                }}
                className="p-3 bg-red-500/80 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-all transform hover:scale-110"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.label
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`
              flex flex-col items-center justify-center w-full h-full 
              border-2 border-dashed rounded-2xl cursor-pointer
              transition-all duration-300 min-h-[200px]
              ${isDragging 
                ? 'border-indigo-500 bg-indigo-500/10' 
                : 'border-white/10 bg-white/5 hover:bg-white/[0.08] hover:border-white/20'}
            `}
          >
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={onSelectFile}
              disabled={isLoading}
            />
            
            <div className="p-4 bg-white/5 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
              {isLoading ? (
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              ) : (
                <Upload className={`w-8 h-8 ${isDragging ? 'text-indigo-400' : 'text-slate-400'}`} />
              )}
            </div>
            
            <span className="text-sm font-bold text-slate-200 tracking-wide text-center px-4">
              {label || t('polaroid.uploadPhoto')}
            </span>
            <span className="text-xs text-slate-500 mt-2">
              {isDragging ? t('polaroid.dropUpload') : t('polaroid.clickUpload')}
            </span>
          </motion.label>
        )}
      </AnimatePresence>
    </div>
  );
};

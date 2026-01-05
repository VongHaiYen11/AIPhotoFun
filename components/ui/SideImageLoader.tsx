import React, { useCallback, useRef, useState } from 'react';
import { ImageIcon, X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SideImageLoaderProps {
  value?: string;
  onChange?: (base64: string) => void;
  onRemove?: () => void;

  size?: number;
  fullWidth?: boolean;
  isLoading?: boolean;
  className?: string;
}

export const SideImageLoader: React.FC<SideImageLoaderProps> = ({
  value,
  onChange,
  onRemove,
  size = 96,
  fullWidth = false,
  isLoading = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const style = fullWidth ? undefined : { width: size, height: size };

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onChange?.(base64);
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div
      style={style}
      onClick={() => !value && inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      className={`
        relative
        flex items-center justify-center
        rounded-lg
        overflow-hidden
        cursor-pointer
        transition
        ${fullWidth ? 'w-full aspect-square' : ''}
        ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border border-dashed border-white/30 bg-white/5'}
        ${className}
      `}
    >
      {/* INPUT */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSelect}
        disabled={isLoading}
      />

      {/* PREVIEW */}
      {value ? (
        <>
          <img
            src={value}
            alt="preview"
            className="w-full h-full object-cover"
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="
              absolute top-1 right-1
              w-6 h-6
              rounded-full
              bg-black/70
              text-white
              flex items-center justify-center
              hover:bg-black
            "
          >
            <X size={12} />
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center text-white/50 pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          ) : (
            <ImageIcon className="w-6 h-6" />
          )}
          <span className="text-[10px] mt-1 tracking-wide">
            {t('common.addImage')}
          </span>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Download, RefreshCcw } from 'lucide-react';

interface ImageResultHolderProps {
  imageUrl: string;
  name: string;

  color?: string; // optional màu hex hoặc rgb

  showDownload?: boolean;
  showRegenerate?: boolean;

  onRegenerate?: () => void;

  width?: number;
}

export const ImageResultHolder: React.FC<ImageResultHolderProps> = ({
  imageUrl,
  name,
  color,
  showDownload = true,
  showRegenerate = false,
  onRegenerate,
  width,
}) => {
  // DOWNLOAD IMAGE
  const handleDownload = async () => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `${name || 'image'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div
      style={width ? { width } : undefined}
      className="
        relative
        w-full
      "
    >
      {/* TITLE + OPTIONAL COLOR SWATCH */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {color && (
          <div
            className="w-4 h-4 rounded-sm border border-white/20"
            style={{ backgroundColor: color }}
          />
        )}
        <h3 className="text-lg font-semibold text-white/90 text-center">
          {name}
        </h3>
      </div>

      {/* IMAGE HOLDER */}
      <div
        className="
          relative
          w-full
          h-[400px]
          bg-black
          border
          border-white/20
          rounded-xl
          overflow-hidden
          px-6
          py-6
        "
      >
        {/* ACTION BUTTONS */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
          {showRegenerate && (
            <button
              onClick={onRegenerate}
              className="
                w-8 h-8
                rounded-full
                bg-black/70
                text-white
                flex items-center justify-center
                hover:bg-black
                transition
              "
              title="Regenerate"
            >
              <RefreshCcw size={14} />
            </button>
          )}

          {showDownload && (
            <button
              onClick={handleDownload}
              className="
                w-8 h-8
                rounded-full
                bg-black/70
                text-white
                flex items-center justify-center
                hover:bg-black
                transition
              "
              title="Download"
            >
              <Download size={14} />
            </button>
          )}
        </div>

        {/* IMAGE */}
        <img
          src={imageUrl}
          alt={name}
          className="
            w-full
            h-full
            object-contain
            rounded-xl
          "
        />
      </div>
    </div>
  );
};

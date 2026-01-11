import React from 'react';
import { Download, RefreshCcw } from 'lucide-react';

interface PolaroidCardProps {
  imageUrl: string;
  name: string;

  showDownload?: boolean;
  showRegenerate?: boolean;

  onRegenerate?: () => void;

  width?: number;
}

export const PolaroidCard: React.FC<PolaroidCardProps> = ({
  imageUrl,
  name,
  showDownload = true,
  showRegenerate = false,
  onRegenerate,
  width,
}) => {

  // DOWNLOAD IMAGE (REAL DOWNLOAD)
  const handleDownload = async () => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `${name || 'photo'}.jpg`;
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
        h-auto
        bg-white
        rounded-2xl
        shadow-xl
        p-4
        pb-6
      "
    >
      {/* ACTION BUTTONS */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
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
      <div
        className="
          w-full
          overflow-hidden
          rounded-xl
          bg-gray-100
        "
      >
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-auto object-contain"
        />
      </div>

      {/* CAPTION */}
      <div className="mt-4 text-center">
        <span className="text-sm font-medium text-gray-800">
          {name}
        </span>
      </div>
    </div>
  );
};

import React from 'react';
import { ImageIcon } from 'lucide-react';

interface SideImageLoaderProps {
  width?: number;   // px
  height?: number;  // px
  onClick?: () => void;
}

export const SideImageLoader: React.FC<SideImageLoaderProps> = ({
  width = 96,
  height = 96,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      style={{ width, height }}
      className="
        flex flex-col items-center justify-center
        rounded-lg
        border border-dashed border-white/30
        bg-white/5
        text-white/50
        transition
        hover:border-white
        hover:text-white
        hover:bg-white/10
        focus:outline-none
      "
    >
      <ImageIcon className="text-2xl leading-none font-light"></ImageIcon>
      <span className="text-[10px] mt-1 uppercase tracking-wide">
        Add image
      </span>
    </button>
  );
};

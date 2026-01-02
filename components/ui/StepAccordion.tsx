import React from 'react';
import { ChevronDown } from 'lucide-react'

interface StepAccordionProps {
  title: string;
  subtitle: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const StepAccordion: React.FC<StepAccordionProps> = ({
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
}) => {
  return (
    <div className="w-full rounded-2xl border border-white/15 bg-white/5 overflow-hidden">
      {/* HEADER */}
      <button
        onClick={onToggle}
        className="
          w-full
          flex items-center justify-between
          px-6 py-5
          text-left
          hover:bg-white/10
          transition
        "
      >
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-white">
            {title}
          </h2>
          <p className="text-sm text-white/50">
            {subtitle}
          </p>
        </div>

        <ChevronDown
          className={`transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
        </ChevronDown>
      </button>

      {/* CONTENT */}
      {isOpen && (
        <div className="px-6 py-4 text-white/70 text-sm leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
};

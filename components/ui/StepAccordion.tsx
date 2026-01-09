import React from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StepAccordionProps {
  title: string;
  subtitle?: string;
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
    <div className="w-full rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl overflow-hidden">
      {/* HEADER */}
      <motion.button
        onClick={onToggle}
        whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
        transition={{ duration: 0.15 }}
        className="
          w-full
          flex items-center justify-between
          px-6 py-5
          text-left
          outline-none
        "
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-sm text-white/50">{subtitle}</p>}
        </div>

        {/* CHEVRON */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <ChevronDown className="text-white/70" />
        </motion.div>
      </motion.button>

      {/* CONTENT */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="accordion-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: { duration: 0.35, ease: 'easeInOut' }, opacity: { duration: 0.25 } }}
            className="overflow-hidden w-full"
          >
            {/* CHILDREN FULL WIDTH */}
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.06 } },
              }}
              className="w-full"
            >
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                className="w-full px-6 py-5 text-white/70 text-sm leading-relaxed"
              >
                {children}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

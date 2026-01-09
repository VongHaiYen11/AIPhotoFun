import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Image as ImageIcon, X, Trash2, CheckCircle2 } from 'lucide-react';

// Mock data type for future integration
interface MediaItem {
  id: string;
  url: string;
  timestamp: number;
}

export const MediaLibrary: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<MediaItem[]>([]); // Empty for now to match screenshot
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Toggle selection
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Mock delete function
  const handleDelete = () => {
    if (confirm(t('mediaLibrary.confirmDeleteSelected'))) {
      setImages(prev => prev.filter(img => !selectedIds.has(img.id)));
      setSelectedIds(new Set());
    }
  };

  return (
    <>
      {/* Floating Action Button (Bottom Right) */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="
          fixed bottom-8 right-8 z-40
          w-14 h-14
          bg-white text-black
          rounded-full
          shadow-[0_0_20px_rgba(255,255,255,0.3)]
          flex items-center justify-center
          cursor-pointer
          hover:bg-gray-200
          transition-colors
        "
        title={t('mediaLibrary.title')}
      >
        <ImageIcon className="w-6 h-6" />
      </motion.button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="
                relative w-full max-w-6xl h-[85vh]
                bg-[#18181b] 
                border border-white/10
                rounded-2xl
                shadow-2xl
                flex flex-col
                overflow-hidden
              "
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#18181b]">
                <h2 className="text-xl font-bold text-white">
                  {t('mediaLibrary.title')}
                </h2>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="
                      px-4 py-2
                      rounded-lg
                      bg-white/5
                      text-white/70
                      font-medium
                      text-sm
                      hover:bg-white/10
                      hover:text-white
                      transition
                    "
                  >
                    {t('mediaLibrary.cancel')}
                  </button>

                  <button
                    onClick={handleDelete}
                    disabled={selectedIds.size === 0}
                    className={`
                      px-4 py-2
                      rounded-lg
                      font-medium
                      text-sm
                      flex items-center gap-2
                      transition
                      ${selectedIds.size > 0 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' 
                        : 'bg-red-900/10 text-red-900/40 border border-red-900/10 cursor-not-allowed'}
                    `}
                  >
                    {t('mediaLibrary.deleteSelected')} ({selectedIds.size})
                  </button>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="ml-2 p-2 text-white/40 hover:text-white transition rounded-full hover:bg-white/5"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              {/* Body / Grid */}
              <div className="flex-1 overflow-y-auto p-6 bg-black/20">
                {images.length === 0 ? (
                  /* Empty State */
                  <div className="w-full h-full flex flex-col items-center justify-center text-center">
                    <p className="text-white/30 text-lg">
                      {t('mediaLibrary.emptyMessage')}
                    </p>
                  </div>
                ) : (
                  /* Grid State (Prepared for future) */
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {images.map((img) => {
                      const isSelected = selectedIds.has(img.id);
                      return (
                        <div
                          key={img.id}
                          onClick={() => toggleSelection(img.id)}
                          className={`
                            group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all
                            ${isSelected ? 'border-indigo-500' : 'border-transparent hover:border-white/30'}
                          `}
                        >
                          <img
                            src={img.url}
                            alt="Generated"
                            className="w-full h-full object-cover"
                          />
                           
                          {/* Selection Overlay */}
                          <div className={`
                            absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity
                            ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                          `}>
                             {isSelected ? (
                               <CheckCircle2 className="w-8 h-8 text-indigo-400 fill-indigo-950" />
                             ) : (
                               <div className="w-6 h-6 rounded-full border-2 border-white/50" />
                             )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Sparkles } from 'lucide-react';
import { tools } from './tools';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="w-full max-w-7xl px-6 md:px-12 py-12 flex flex-col items-center">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16 md:mb-24"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase bg-indigo-500/5 border border-indigo-500/20 rounded-full backdrop-blur-md">
          <Sparkles className="w-3 h-3" />
          {t('common.welcome')}
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 leading-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-slate-500">
            {t('app.title')}
          </span>
        </h1>
        
        <p className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
          {t('app.subtitle')}
        </p>
      </motion.div>

      {/* Grid Section */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full"
      >
        {tools.map((tool) => (
          <motion.div
            key={tool.id}
            variants={itemVariants}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            onClick={() => navigate(`/${tool.id}`)} 
            className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 flex flex-col items-start hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300"
          >
            {/* Glow Effect on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500 pointer-events-none" />

            {/* Icon Box */}
            <div className="p-4 bg-white/5 rounded-2xl mb-6 border border-white/10 group-hover:border-white/30 transition-colors">
              <div className="text-neutral-300 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                {tool.icon}
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
              {t(`app.${tool.id}Title`)}
            </h3>
            
            <p className="text-slate-400 text-sm md:text-base flex-grow mb-8 leading-relaxed group-hover:text-slate-300 transition-colors">
              {t(`app.${tool.id}Desc`)}
            </p>
            
            <button 
              className="flex items-center gap-2 font-bold text-slate-300 group-hover:text-white transition-colors duration-300 mt-auto"
            >
              {t('app.start')}
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
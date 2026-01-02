import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';

export const Docs: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <main className="relative z-10 w-full max-w-4xl px-6">
      <div className="mb-12">
        <Button variant="secondary" onClick={() => navigate('/')} className="px-4 py-2 text-sm mb-8">
          {t('app.backHome')}
        </Button>
        
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
          Documentation
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
          Everything you need to build scalable, beautiful applications with our premium boilerplate.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { title: "Quick Start", desc: "Initialize your project in seconds using our CLI tools." },
          { title: "Components", desc: "A library of atomic UI elements styled with Tailwind." },
          { title: "Theming", desc: "Deep customization via CSS variables and Tailwind config." },
          { title: "Deployment", desc: "One-click deployments to modern cloud platforms." }
        ].map((item, i) => (
          <div key={i} className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm hover:border-indigo-500/30 transition-colors">
            <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
};
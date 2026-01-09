import React from 'react';
import { LanguageSwitcher } from '../components/ui/LanguageSwitcher';
import { useLocation } from 'react-router-dom';
import { MediaLibrary } from '../components/ui/MediaLibrary';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  
  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-black relative overflow-x-hidden">
      {/* Premium Studio Background Effects */} 
      <div className="fixed inset-0 pointer-events-none z-0"> 
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_#111111_0%,_#000000_100%)]" />
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[60%] bg-indigo-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[60%] bg-blue-500/10 rounded-full blur-[140px]" />
      </div>
            
      {/* Top Navigation / Controls */}
      <div className="fixed top-6 right-6 z-50">
        {isHome ? (
          <LanguageSwitcher />
        ) : (
          <div/>
        )}
      </div>
            
      {/* Content */}
      <div className="flex-1 w-full flex flex-col items-center py-12 relative z-10">
        {children}
      </div>
      {/* Global Media Library Floating Button */}
      <MediaLibrary />
    </div>
  );
};  

import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { LanguageSwitcher } from './components/ui/LanguageSwitcher';
import { MediaLibrary } from './components/ui/MediaLibrary';
import { supabase } from './lib/supabase';

import { Home } from './pages/Home/index';
import { Photoshoot } from './pages/Photoshoot/index';
import { ProductSceneGenerator } from './pages/ProductSceneGenerator/index';
import { ApparelMockupStudio } from './pages/ApparelMockupStudio/index';
import { TypographicIllustrator } from './pages/TypographicIllustrator/index';
import { PhotoBooth } from './pages/PhotoBooth/index';
import { CloneEffect } from './pages/CloneEffect/index';
import { OutfitExtractor } from './pages/OutfitExtractor/index';
import { ConceptStudio } from './pages/ConceptStudio/index';
import { PortraitGenerator } from './pages/PortraitGenerator/index';
import { PoseAnimator } from './pages/PoseAnimator/index';
import { DepthEffect } from './pages/DepthEffect/index';
import { BackgroundRemover } from './pages/BackgroundRemover/index';
import { ObjectRemover } from './pages/ObjectRemover/index';
import { Inpainter } from './pages/Inpainter/index';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("Chào mừng trở lại! ID của bạn là:", session.user.id);
        } else {
          console.log("Đang kiểm tra quyền tạo ID ẩn danh...");
          const { data, error } = await supabase.auth.signInAnonymously();
          
          if (error) {
            if (error.message.includes("Anonymous sign-ins are disabled")) {
              console.warn(
                "⚠️ Anonymous sign-ins are disabled in your Supabase project.\n" +
                "To fix this, go to: https://supabase.com/dashboard/project/lyhzsxokbnkxlxfdbuon/auth/providers\n" +
                "and enable 'Anonymous' under the Auth Providers section."
              );
              
              // Fallback to a local guest ID if Auth is disabled in dashboard
              let localId = localStorage.getItem('guest_id');
              if (!localId) {
                localId = 'guest_' + crypto.randomUUID();
                localStorage.setItem('guest_id', localId);
              }
              console.log("Sử dụng ID khách tạm thời (Local Storage):", localId);
            } else {
              throw error;
            }
          } else if (data.user) {
            console.log("Đã tạo ID ẩn danh thành công:", data.user.id);
            // Sync with profiles table if needed:
            // await supabase.from('profiles').upsert({ id: data.user.id, is_anonymous: true });
          }
        }
      } catch (err) {
        console.error("Lỗi xác thực người dùng:", err);
      }
    };

    checkUser();
  }, []);

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
        {isHome ? <LanguageSwitcher /> : <div />}
      </div>

      {/* Content */}
      <div className="flex-1 w-full flex flex-col items-center py-12 relative z-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/photoshoot" element={<Photoshoot />} />
          <Route path="/productSceneGenerator" element={<ProductSceneGenerator />} />
          <Route path="/apparelMockupStudio" element={<ApparelMockupStudio />} />
          <Route path="/typographicIllustrator" element={<TypographicIllustrator />} />
          <Route path="/photoBooth" element={<PhotoBooth />} />
          <Route path="/cloneEffect" element={<CloneEffect />} />
          <Route path="/outfitExtractor" element={<OutfitExtractor />} />
          <Route path="/conceptStudio" element={<ConceptStudio />} />
          <Route path="/portraitGenerator" element={<PortraitGenerator />} />
          <Route path="/poseAnimator" element={<PoseAnimator />} />
          <Route path="/depthEffect" element={<DepthEffect />} />
          <Route path="/backgroundRemover" element={<BackgroundRemover />} />
          <Route path="/objectRemover" element={<ObjectRemover />} />
          <Route path="/inpainter" element={<Inpainter />} />
        </Routes>
      </div>

      {/* Global Media Library Floating Button */}
      <MediaLibrary />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

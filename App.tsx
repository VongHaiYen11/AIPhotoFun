import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Home } from './pages/Home/index';
import { Photoshoot } from './pages/Photoshoot/index';
import { ProductSceneGenerator } from './pages/ProductSceneGenerator/index';
import { ApparelMockupStudio } from './pages/ApparelMockupStudio/index';
import { TypographicIllustrator } from './pages/TypographicIllustrator/index';
import { PhotoBooth } from './pages/PhotoBooth/index';
import { CloneEffect } from './pages/CloneEffect/index';
import { OutfitExtractor } from './pages/OutfitExtractor/index';

export const App: React.FC = () => {
  return (
    // Removed 'future' prop as it is not supported in the current type definition of HashRouterProps
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/photoshoot" element={<Photoshoot />} />
          <Route path="/productSceneGenerator" element={<ProductSceneGenerator />} />
          <Route path="/apparelMockupStudio" element={<ApparelMockupStudio />} />
          <Route path="/typographicIllustrator" element={<TypographicIllustrator />} />
          <Route path="/photoBooth" element={<PhotoBooth />} />
          <Route path="/cloneEffect" element={<CloneEffect />} />
          <Route path="/outfitExtractor" element={<OutfitExtractor />} />
        </Routes>
      </MainLayout>
    </Router>
  );
};
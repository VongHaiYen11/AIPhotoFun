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
import { DepthEffect } from './pages/DepthEffect/index';
import { BackgroundRemover } from './pages/BackgroundRemover/index';
import { ObjectRemover } from './pages/ObjectRemover/index';

export const App: React.FC = () => {
  return (
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
          <Route path="/depthEffect" element={<DepthEffect />} />
          <Route path="/backgroundRemover" element={<BackgroundRemover />} />
          <Route path="/objectRemover" element={<ObjectRemover />} />
        </Routes>
      </MainLayout>
    </Router>
  );
};

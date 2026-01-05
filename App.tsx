import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Hero } from './components/sections/Hero';
import { Docs } from './components/sections/Docs';
import { Photoshoot } from './components/sections/Photoshoot';
import { ProductSceneGenerator } from './components/sections/ProductSceneGenerator'
import { ApparelMockupStudio } from './components/sections/ApparelMockupStudio'
import { TypographicIllustrator } from './components/sections/TypographicIllustrator'
import { PhotoBooth } from './components/sections/PhotoBooth'
import { CloneEffect } from './components/sections/CloneEffect'
import { OutfitExtractor } from './components/sections/OutfitExtractor'

export const App: React.FC = () => {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Hero />} />
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
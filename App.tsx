import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Hero } from './components/sections/Hero';
import { Docs } from './components/sections/Docs';
import { Photoshoot } from './components/sections/Photoshoot'

export const App: React.FC = () => {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/photoshoot" element={<Photoshoot />} />
        </Routes>
      </MainLayout>
    </Router>
  );
};
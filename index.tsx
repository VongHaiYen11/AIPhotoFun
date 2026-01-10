import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { MediaLibraryProvider } from './contexts/MediaLibraryContext';
import './i18n'; // Initialize i18n 

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <MediaLibraryProvider>
        <App />
      </MediaLibraryProvider>
    </React.StrictMode>
  );
}
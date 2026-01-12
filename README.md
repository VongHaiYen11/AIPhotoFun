# AI Photofun - Premium AI Creative Studio

AI Photofun is a professional-grade suite of generative media tools designed to transform, enhance, and create images using the power of Google's Gemini 2.5 Flash and Imagen models.

## 🚀 Overview

This application provides a "Studio" experience where users can perform complex photo manipulations—ranging from professional ID portrait generation to 3D pose animation—through a sleek, dark-themed, and responsive interface.

## 🛠 Features

### 📸 Professional Tools
- **AI Photoshoot**: Generate dozens of different poses and angles from a single reference photo.
- **Portrait ID Generator**: Create professional-grade ID photos with customizable attire, backgrounds, and hairstyles.
- **Apparel Mockup Studio**: Design and visualize graphics on various apparel types using AI-generated or uploaded mockups.
- **Product Scene Generator**: Transform single product shots into full commercial scenes with varied angles.

### 🎨 Creative Effects
- **Pose Animator**: Bring characters to life by transferring poses from reference images, hand-drawn sketches, or a 3D model.
- **Clone Effect**: Magically duplicate subjects within the same scene while maintaining perfect identity consistency.
- **Typographic Illustrator**: Turn phrases into visual art using only the letters of the words themselves.
- **3D Depth Effect**: Add parallax depth to flat photos using AI-generated depth maps and WebGL.
- **AI Photo Booth**: Create multi-pose photobooth strips from a single image.

### 🪄 Utility & Editing
- **Background & Object Remover**: High-precision segmentation and inpainting to clean up photos.
- **AI Inpainter**: Add or change specific areas of an image using text-based instructions.
- **Outfit Extractor**: Isolate clothing and accessories onto neutral backgrounds for cataloging or redesign.

## 💻 Technical Stack

- **Frontend**: React (18.3.1) with TypeScript.
- **Styling**: Tailwind CSS for a premium glassmorphic UI.
- **Animations**: Framer Motion for smooth transitions and interactive states.
- **AI Engine**: Google Gemini API (`@google/genai`) utilizing `gemini-2.5-flash-image`, `gemini-3-flash-preview`, and `imagen-4.0`.
- **Backend/Storage**: Supabase for anonymous authentication, image storage, and activity logging.
- **3D Graphics**: Three.js for the interactive Pose Animator and Depth Viewer.
- **Localization**: Full English (EN) and Vietnamese (VI) support via `react-i18next`.

## 📦 Media Management

The app features a global **Media Library** powered by Supabase Storage. Images generated in one tool are automatically synced and can be instantly pulled into any other tool, enabling a seamless creative workflow.

---
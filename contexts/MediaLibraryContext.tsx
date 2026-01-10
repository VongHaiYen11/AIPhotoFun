import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';

interface MediaLibraryContextType {
    libraryImages: string[];
    addImageToLibrary: (imageUrl: string) => void;
    removeImagesFromLibrary: (imageUrls: string[]) => void;
    clearLibrary: () => void;
    selectImageForTool: (imageUrl: string) => void;
    selectedImageForTool: string | null;
    clearSelectedImageForTool: () => void;
}

const MediaLibraryContext = createContext<MediaLibraryContextType | undefined>(undefined);

export const MediaLibraryProvider = ({ children }: { children: ReactNode }) => {
    const [libraryImages, setLibraryImages] = useState<string[]>([]);
    const [selectedImageForTool, setSelectedImageForTool] = useState<string | null>(null);

    useEffect(() => {
        try {
            const savedLibrary = localStorage.getItem('ai-creative-suite-library');
            if (savedLibrary) {
                setLibraryImages(JSON.parse(savedLibrary));
            }
        } catch (error) {
            console.error("Failed to load media library from localStorage", error);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('ai-creative-suite-library', JSON.stringify(libraryImages));
        } catch (error) {
            console.error("Failed to save media library to localStorage", error);
        }
    }, [libraryImages]);

    const addImageToLibrary = useCallback((imageUrl: string) => {
        setLibraryImages(prev => {
            if (prev.includes(imageUrl)) {
                return prev;
            }
            return [imageUrl, ...prev];
        });
    }, []);

    const removeImagesFromLibrary = useCallback((imageUrls: string[]) => {
        setLibraryImages(prev => prev.filter(img => !imageUrls.includes(img)));
    }, []);

    const clearLibrary = useCallback(() => {
        setLibraryImages([]);
    }, []);

    const selectImageForTool = useCallback((imageUrl: string) => {
        setSelectedImageForTool(imageUrl);
    }, []);

    const clearSelectedImageForTool = useCallback(() => {
        setSelectedImageForTool(null);
    }, []);

    return (
        <MediaLibraryContext.Provider value={{
            libraryImages,
            addImageToLibrary,
            removeImagesFromLibrary,
            clearLibrary,
            selectImageForTool,
            selectedImageForTool,
            clearSelectedImageForTool
        }}>
            {children}
        </MediaLibraryContext.Provider>
    );
};

export const useMediaLibrary = (): MediaLibraryContextType => {
    const context = useContext(MediaLibraryContext);
    if (!context) {
        throw new Error('useMediaLibrary must be used within a MediaLibraryProvider');
    }
    return context;
};

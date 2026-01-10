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

// IndexedDB Helper Functions
const DB_NAME = 'AI_Creative_Suite_DB';
const STORE_NAME = 'library_store';
const KEY = 'media_library';

const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const saveToDB = async (images: string[]) => {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(images, KEY);
    } catch (e) {
        console.error('Error saving to IndexedDB', e);
    }
};

const loadFromDB = async (): Promise<string[]> => {
    try {
        const db = await initDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(KEY);
            request.onsuccess = () => {
                resolve(request.result || []);
            };
            request.onerror = () => resolve([]);
        });
    } catch (e) {
        console.error('Error loading from IndexedDB', e);
        return [];
    }
};

export const MediaLibraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [libraryImages, setLibraryImages] = useState<string[]>([]);
    const [selectedImageForTool, setSelectedImageForTool] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initial Load
    useEffect(() => {
        const load = async () => {
            const images = await loadFromDB();
            setLibraryImages(images);
            setIsInitialized(true);
        };
        load();
    }, []);

    // Save on Change
    useEffect(() => {
        if (isInitialized) {
            saveToDB(libraryImages);
        }
    }, [libraryImages, isInitialized]);

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

export const useMediaLibrary = () => {
    const context = useContext(MediaLibraryContext);
    if (context === undefined) {
        throw new Error('useMediaLibrary must be used within a MediaLibraryProvider');
    }
    return context;
};
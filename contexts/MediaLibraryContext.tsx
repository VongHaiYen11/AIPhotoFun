
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Asset {
    id: string;
    public_url: string;
    type: 'original' | 'generated';
    created_at: string;
    user_id: string;
    storage_path: string;
}

interface MediaLibraryContextType {
    libraryImages: Asset[];
    isLoading: boolean;
    addImageToLibrary: (dataUrl: string, type?: 'original' | 'generated') => Promise<void>;
    removeImagesFromLibrary: (ids: string[]) => Promise<void>;
    clearLibrary: () => Promise<void>;
    selectImageForTool: (imageUrl: string) => void;
    selectedImageForTool: string | null;
    clearSelectedImageForTool: () => void;
    refreshLibrary: () => Promise<void>;
    logGenerationActivity: (featureType: string, parameters: Record<string, any>) => Promise<void>;
}

const MediaLibraryContext = createContext<MediaLibraryContextType | undefined>(undefined);

// Helper to convert base64 data URL to Blob
const dataURLtoBlob = (dataurl: string) => {
    try {
        const arr = dataurl.split(',');
        if (arr.length < 2) return null;
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    } catch (e) {
        console.error("Error converting data URL to blob", e);
        return null;
    }
};

// Safe UUID generator that doesn't rely on crypto.randomUUID (which requires secure context)
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const MediaLibraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [libraryImages, setLibraryImages] = useState<Asset[]>([]);
    const [selectedImageForTool, setSelectedImageForTool] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAssets = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('assets')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLibraryImages(data || []);
        } catch (err: any) {
            console.error('Error fetching assets from Supabase:', err.message || err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch on mount and setup auth listener
    useEffect(() => {
        // Attempt initial fetch
        fetchAssets();

        // Listen for auth changes (e.g. when anonymous sign-in completes)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                if (session) {
                    fetchAssets();
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [fetchAssets]);

    const addImageToLibrary = async (dataUrl: string, type: 'original' | 'generated' = 'generated') => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                console.error("No active session found for upload. Please try refreshing or signing in.");
                return;
            }

            // Step 1: Prepare Blob and File Info
            const blob = dataURLtoBlob(dataUrl);
            if (!blob) {
                console.error("Failed to process image data.");
                return;
            }

            const timestamp = Date.now();
            const fileExt = blob.type.split('/')[1] || 'png';
            const fileName = `${timestamp}_${generateUUID()}.${fileExt}`;
            const filePath = `${session.user.id}/${fileName}`;

            // Step 2: Upload to Supabase Storage ('images' bucket)
            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, blob, {
                    contentType: blob.type,
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error("Storage upload failed:", uploadError);
                throw uploadError;
            }

            // Step 3: Get Public URL
            const { data: publicUrlData } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);
            
            const publicUrl = publicUrlData.publicUrl;

            // Step 4: Save Metadata to Database ('assets' table)
            const { data: dbData, error: dbError } = await supabase
                .from('assets')
                .insert([{ 
                    public_url: publicUrl, 
                    type, 
                    user_id: session.user.id,
                    storage_path: filePath // Include storage_path as required by DB constraints
                }])
                .select();

            if (dbError) {
                console.error("Database insert failed:", JSON.stringify(dbError));
                throw dbError;
            }

            // Step 5: Update Local UI State
            if (dbData) {
                setLibraryImages(prev => [dbData[0], ...prev]);
            }
        } catch (err: any) {
            console.error('Error adding image to Supabase:', err.message || JSON.stringify(err));
        }
    };

    const logGenerationActivity = async (featureType: string, parameters: Record<string, any>) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const { error } = await supabase
                .from('generations')
                .insert([{
                    user_id: session.user.id,
                    feature_type: featureType,
                    parameters: parameters,
                    status: 'completed'
                }]);

            if (error) {
                console.error('Error logging generation activity:', error);
            }
        } catch (err) {
            console.error('Error in logGenerationActivity:', err);
        }
    };

    const removeImagesFromLibrary = async (ids: string[]) => {
        try {
            // Find assets to delete to get their storage paths
            const assetsToDelete = libraryImages.filter(img => ids.includes(img.id));
            const storagePaths = assetsToDelete.map(img => img.storage_path).filter(Boolean);

            // Optimistic update
            const originalImages = [...libraryImages];
            setLibraryImages(prev => prev.filter(img => !ids.includes(img.id)));

            // 1. Delete from DB
            const { error: dbError } = await supabase
                .from('assets')
                .delete()
                .in('id', ids);

            if (dbError) {
                console.error('Error removing images from DB:', dbError);
                setLibraryImages(originalImages); // Revert on error
                return;
            }

            // 2. Delete from Storage (fire and forget or await)
            if (storagePaths.length > 0) {
                const { error: storageError } = await supabase.storage
                    .from('images')
                    .remove(storagePaths);
                
                if (storageError) {
                    console.error('Error removing files from Storage:', storageError);
                    // We don't revert DB deletion if storage fails, just log it.
                }
            }

        } catch (err: any) {
            console.error('Error in removeImagesFromLibrary:', err.message || err);
        }
    };

    const clearLibrary = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            // Get all paths for user to cleanup storage
            const { data: userAssets } = await supabase
                .from('assets')
                .select('storage_path')
                .eq('user_id', session.user.id);
            
            const storagePaths = userAssets?.map(a => a.storage_path).filter(Boolean) || [];

            setLibraryImages([]); // Optimistic clear

            // 1. Delete from DB
            const { error: dbError } = await supabase
                .from('assets')
                .delete()
                .eq('user_id', session.user.id);

            if (dbError) throw dbError;

            // 2. Delete from Storage
            if (storagePaths.length > 0) {
                // Supabase storage remove has a limit on files? Usually fine for batches.
                // We'll try to remove them.
                await supabase.storage.from('images').remove(storagePaths);
            }

        } catch (err: any) {
            console.error('Error clearing library in Supabase:', err.message || err);
            fetchAssets(); // Revert/Refresh on error
        }
    };

    const selectImageForTool = (imageUrl: string) => {
        setSelectedImageForTool(imageUrl);
    };

    const clearSelectedImageForTool = () => {
        setSelectedImageForTool(null);
    };

    return (
        <MediaLibraryContext.Provider value={{
            libraryImages,
            isLoading,
            addImageToLibrary,
            removeImagesFromLibrary,
            clearLibrary,
            selectImageForTool,
            selectedImageForTool,
            clearSelectedImageForTool,
            refreshLibrary: fetchAssets,
            logGenerationActivity
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

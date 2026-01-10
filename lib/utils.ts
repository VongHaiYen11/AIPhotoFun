/**
 * Utility function to merge class names conditionally (similar to clsx/classnames)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(' ');
}

/**
 * Crops an image to a specific aspect ratio
 * @param imageDataUrl - The base64 data URL of the image
 * @param targetAspectRatio - The target aspect ratio (width / height)
 * @returns Promise<string> - The cropped image as a base64 data URL
 */
export async function cropImageToAspectRatio(
    imageDataUrl: string,
    targetAspectRatio: number
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            const imgAspectRatio = img.width / img.height;
            
            let sourceX = 0;
            let sourceY = 0;
            let sourceWidth = img.width;
            let sourceHeight = img.height;

            if (imgAspectRatio > targetAspectRatio) {
                // Image is wider than target - crop the sides
                sourceWidth = img.height * targetAspectRatio;
                sourceX = (img.width - sourceWidth) / 2;
            } else {
                // Image is taller than target - crop top and bottom
                sourceHeight = img.width / targetAspectRatio;
                sourceY = (img.height - sourceHeight) / 2;
            }

            // Set canvas size to maintain quality
            canvas.width = sourceWidth;
            canvas.height = sourceHeight;

            ctx.drawImage(
                img,
                sourceX, sourceY, sourceWidth, sourceHeight,
                0, 0, canvas.width, canvas.height
            );

            resolve(canvas.toDataURL('image/jpeg', 0.95));
        };
        
        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };
        
        img.src = imageDataUrl;
    });
}

/**
 * Resizes an image to specific dimensions
 * @param imageDataUrl - The base64 data URL of the image
 * @param targetWidth - Target width in pixels
 * @param targetHeight - Target height in pixels
 * @returns Promise<string> - The resized image as a base64 data URL
 */
export async function resizeImage(
    imageDataUrl: string,
    targetWidth: number,
    targetHeight: number
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            resolve(canvas.toDataURL('image/jpeg', 0.95));
        };
        
        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };
        
        img.src = imageDataUrl;
    });
}

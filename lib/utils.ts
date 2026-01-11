
import JSZip from 'jszip';

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

/**
 * Downloads multiple images as a ZIP file
 * @param images - Array of objects with url and name
 * @param zipFilename - Name of the zip file to download
 */
export async function downloadAsZip(images: { url: string; name: string }[], zipFilename: string) {
  const zip = new JSZip();
  
  const promises = images.map(async (img, index) => {
    try {
      const response = await fetch(img.url);
      const blob = await response.blob();
      // Sanitize name and ensure extension
      let safeName = img.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      if (!safeName.endsWith('.png') && !safeName.endsWith('.jpg') && !safeName.endsWith('.jpeg')) {
          safeName += '.png'; 
      }
      // Avoid collisions by prepending index
      safeName = `${index + 1}_${safeName}`;
      
      zip.file(safeName, blob);
    } catch (e) {
      console.error(`Failed to add ${img.name} to zip`, e);
    }
  });

  await Promise.all(promises);

  const content = await zip.generateAsync({ type: "blob" });
  
  const url = window.URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

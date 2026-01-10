const DPI = 300;
const CM_TO_INCH = 1 / 2.54;

// 4x6 inch sheet dimensions at 300 DPI
const SHEET_WIDTH_INCH = 6;
const SHEET_HEIGHT_INCH = 4;
const SHEET_WIDTH_PX = SHEET_WIDTH_INCH * DPI; // 1800
const SHEET_HEIGHT_PX = SHEET_HEIGHT_INCH * DPI; // 1200

// Padding between photos in pixels
const PADDING = 15;
const MARGIN = 30;

/**
 * Creates a 4x6 inch print sheet with multiple copies of the portrait photo
 * @param imageDataUrl - The base64 data URL of the portrait image
 * @param photoWidthCm - Width of individual photo in cm
 * @param photoHeightCm - Height of individual photo in cm
 * @returns Promise<string> - The print sheet as a base64 data URL
 */
export async function createPrintSheet(
    imageDataUrl: string,
    photoWidthCm: number,
    photoHeightCm: number
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

            // Set canvas to 4x6 inch sheet size
            canvas.width = SHEET_WIDTH_PX;
            canvas.height = SHEET_HEIGHT_PX;

            // Fill with white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Calculate photo size in pixels
            const photoWidthPx = Math.round(photoWidthCm * CM_TO_INCH * DPI);
            const photoHeightPx = Math.round(photoHeightCm * CM_TO_INCH * DPI);

            // Calculate how many photos fit
            const availableWidth = SHEET_WIDTH_PX - (2 * MARGIN);
            const availableHeight = SHEET_HEIGHT_PX - (2 * MARGIN);

            const cols = Math.floor((availableWidth + PADDING) / (photoWidthPx + PADDING));
            const rows = Math.floor((availableHeight + PADDING) / (photoHeightPx + PADDING));

            // Calculate starting position to center the grid
            const totalGridWidth = cols * photoWidthPx + (cols - 1) * PADDING;
            const totalGridHeight = rows * photoHeightPx + (rows - 1) * PADDING;
            const startX = (SHEET_WIDTH_PX - totalGridWidth) / 2;
            const startY = (SHEET_HEIGHT_PX - totalGridHeight) / 2;

            // Draw photos in grid
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const x = startX + col * (photoWidthPx + PADDING);
                    const y = startY + row * (photoHeightPx + PADDING);
                    
                    ctx.drawImage(img, x, y, photoWidthPx, photoHeightPx);
                }
            }

            // Add subtle cut guides (dashed lines)
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = '#CCCCCC';
            ctx.lineWidth = 1;

            // Vertical cut lines
            for (let col = 0; col <= cols; col++) {
                const x = startX + col * (photoWidthPx + PADDING) - PADDING / 2;
                if (col > 0 && col < cols) {
                    ctx.beginPath();
                    ctx.moveTo(x, startY - 10);
                    ctx.lineTo(x, startY + totalGridHeight + 10);
                    ctx.stroke();
                }
            }

            // Horizontal cut lines
            for (let row = 0; row <= rows; row++) {
                const y = startY + row * (photoHeightPx + PADDING) - PADDING / 2;
                if (row > 0 && row < rows) {
                    ctx.beginPath();
                    ctx.moveTo(startX - 10, y);
                    ctx.lineTo(startX + totalGridWidth + 10, y);
                    ctx.stroke();
                }
            }

            resolve(canvas.toDataURL('image/jpeg', 0.95));
        };
        
        img.onerror = () => {
            reject(new Error('Failed to load image for print sheet'));
        };
        
        img.src = imageDataUrl;
    });
}

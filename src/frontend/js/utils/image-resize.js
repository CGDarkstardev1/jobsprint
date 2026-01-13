import { logger } from './logger.js';

/**
 * Image Resize Utility for Vision API Optimization
 * 
 * Resizes and compresses screenshots before sending to Claude Vision API
 * to prevent timeouts and reduce token usage.
 * 
 * Uses Sharp for Node.js image processing (preferred) with fallback to original.
 */
export class ImageResizeUtil {
    constructor(options = {}) {
        this.maxWidth = options.maxWidth || 1024;
        this.maxHeight = options.maxHeight || 768;
        this.quality = options.quality || 0.8;
        this.format = options.format || 'image/jpeg';
    }
    
    /**
     * Resize image - always returns a data URL string
     * @param {string|Buffer} imageData - Base64 encoded image or Buffer
     * @param {Object} options - Resize options
     * @returns {Promise<string>} - Resized image as base64 data URL
     */
    async resize(imageData, options = {}) {
        const {
            maxWidth = this.maxWidth,
            maxHeight = this.maxHeight,
            quality = this.quality
        } = options;
        
        try {
            // Extract base64 from data URL or convert buffer
            let base64;
            if (typeof imageData === 'string') {
                if (imageData.startsWith('data:')) {
                    base64 = imageData.split(',')[1];
                } else {
                    base64 = imageData;
                }
            } else if (Buffer.isBuffer(imageData)) {
                base64 = imageData.toString('base64');
            } else {
                base64 = String(imageData);
            }
            
            // Check size - if already small (< 100KB), return as data URL
            const size = Buffer.from(base64, 'base64').length;
            if (size < 100000) {
                return `data:image/png;base64,${base64}`;
            }
            
            // Try to resize using Sharp if available
            try {
                const sharp = (await import('sharp')).default;
                const buffer = Buffer.from(base64, 'base64');
                
                const resizedBuffer = await sharp(buffer)
                    .resize({
                        width: maxWidth,
                        height: maxHeight,
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .jpeg({ quality: Math.round(quality * 100) })
                    .toBuffer();
                
                return `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;
                
            } catch (sharpError) {
                // Sharp not available or failed, return original as data URL
                logger.warn('Sharp not available for image resize, using original');
                return `data:image/png;base64,${base64}`;
            }
            
        } catch (error) {
            logger.error('Image resize failed, returning original:', error.message);
            // Return original format as data URL
            const base64 = typeof imageData === 'string' 
                ? (imageData.includes(',') ? imageData.split(',')[1] : imageData)
                : (Buffer.isBuffer(imageData) ? imageData.toString('base64') : String(imageData));
            return `data:image/png;base64,${base64}`;
        }
    }
    
    /**
     * Get image size from data URL or base64 string
     */
    getImageSize(dataUrl) {
        if (!dataUrl) return '0 B';
        
        // Ensure we have a string
        const strData = typeof dataUrl === 'string' ? dataUrl : String(dataUrl);
        const base64 = strData.includes(',') ? strData.split(',')[1] : strData;
        try {
            const bytes = Buffer.from(base64, 'base64').length;
            
            if (bytes < 1024) return `${bytes} B`;
            if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        } catch (e) {
            return 'unknown';
        }
    }
    
    /**
     * Check if image needs resizing (> 100KB)
     */
    needsResize(imageData) {
        try {
            const size = this.getImageSize(imageData);
            const bytes = parseFloat(size) * (size.includes('KB') ? 1024 : size.includes('MB') ? 1024 * 1024 : 1);
            return bytes > 100000;
        } catch (e) {
            return false;
        }
    }
}

// Export singleton instance
export const imageResizeUtil = new ImageResizeUtil();

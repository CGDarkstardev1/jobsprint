import { logger } from './logger.js';

export class ImageResizeUtil {
  constructor(options = {}) {
    this.maxWidth = options.maxWidth || 1024;
    this.maxHeight = options.maxHeight || 768;
    this.quality = options.quality || 0.8;
    this.format = options.format || 'image/jpeg';
  }

  async resize(imageData, options = {}) {
    const {
      maxWidth = this.maxWidth,
      maxHeight = this.maxHeight,
      quality = this.quality,
    } = options;

    try {
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

      const size = Buffer.from(base64, 'base64').length;
      if (size < 100000) {
        return `data:image/png;base64,${base64}`;
      }

      try {
        const sharp = (await import('sharp')).default;
        const buffer = Buffer.from(base64, 'base64');

        const resizedBuffer = await sharp(buffer)
          .resize({
            width: maxWidth,
            height: maxHeight,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: Math.round(quality * 100) })
          .toBuffer();

        return `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;
      } catch (sharpError) {
        logger.warn('Sharp not available for image resize, using original');
        return `data:image/png;base64,${base64}`;
      }
    } catch (error) {
      logger.error('Image resize failed, returning original:', error.message);
      const base64 =
        typeof imageData === 'string'
          ? imageData.includes(',')
            ? imageData.split(',')[1]
            : imageData
          : Buffer.isBuffer(imageData)
            ? imageData.toString('base64')
            : String(imageData);
      return `data:image/png;base64,${base64}`;
    }
  }

  async resizeWithMetadata(imageData, options = {}) {
    const {
      maxWidth = this.maxWidth,
      maxHeight = this.maxHeight,
      quality = this.quality,
    } = options;

    try {
      let base64;
      if (typeof imageData === 'string') {
        base64 = imageData.startsWith('data:') ? imageData.split(',')[1] : imageData;
      } else if (Buffer.isBuffer(imageData)) {
        base64 = imageData.toString('base64');
      } else {
        base64 = String(imageData);
      }

      const buffer = Buffer.from(base64, 'base64');
      const sharp = (await import('sharp')).default;
      const sharpInstance = sharp(buffer);

      const metadata = await sharpInstance.metadata();

      let resultWidth = metadata.width;
      let resultHeight = metadata.height;

      if (resultWidth > maxWidth || resultHeight > maxHeight) {
        const ratio = Math.min(maxWidth / resultWidth, maxHeight / resultHeight);
        resultWidth = Math.round(resultWidth * ratio);
        resultHeight = Math.round(resultHeight * ratio);
      }

      const resizedBuffer = await sharpInstance
        .resize({
          width: maxWidth,
          height: maxHeight,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: Math.round(quality * 100) })
        .toBuffer();

      return {
        image: `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`,
        metadata: { width: resultWidth, height: resultHeight, original: metadata },
      };
    } catch (error) {
      logger.error('Image resize with metadata failed:', error.message);
      return {
        image:
          typeof imageData === 'string' && imageData.startsWith('data:')
            ? imageData
            : `data:image/png;base64,${imageData}`,
        metadata: { width: 1280, height: 720 },
      };
    }
  }

  getImageSize(dataUrl) {
    if (!dataUrl) return '0 B';

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
}

export const imageResizeUtil = new ImageResizeUtil();

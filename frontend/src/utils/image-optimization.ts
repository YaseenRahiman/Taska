// Image optimization utilities

export interface ImageOptimizationOptions {
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  width?: number;
  height?: number;
  lazy?: boolean;
}

/**
 * Image URL builder for optimized images
 */
export class ImageOptimizer {
  private static baseUrl = process.env.NEXT_PUBLIC_CDN_URL || '';

  static getOptimizedUrl(
    originalUrl: string,
    options: ImageOptimizationOptions = {}
  ): string {
    if (!this.baseUrl) {
      return originalUrl;
    }

    const params = new URLSearchParams();
    
    if (options.quality) {
      params.append('q', options.quality.toString());
    }
    
    if (options.format) {
      params.append('f', options.format);
    }
    
    if (options.width) {
      params.append('w', options.width.toString());
    }
    
    if (options.height) {
      params.append('h', options.height.toString());
    }

    const queryString = params.toString();
    const separator = originalUrl.includes('?') ? '&' : '?';
    
    return `${this.baseUrl}${originalUrl}${queryString ? separator + queryString : ''}`;
  }

  /**
   * Generate responsive image sources
   */
  static getResponsiveSources(originalUrl: string): Array<{ srcSet: string; media: string }> {
    const breakpoints = [
      { width: 320, media: '(max-width: 320px)' },
      { width: 768, media: '(max-width: 768px)' },
      { width: 1024, media: '(max-width: 1024px)' },
      { width: 1440, media: '(max-width: 1440px)' },
    ];

    return breakpoints.map(bp => ({
      srcSet: this.getOptimizedUrl(originalUrl, { 
        width: bp.width, 
        format: 'webp',
        quality: 80 
      }),
      media: bp.media,
    }));
  }

  /**
   * Preload critical images
   */
  static preloadImage(url: string, options: ImageOptimizationOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = this.getOptimizedUrl(url, options);
    });
  }

  /**
   * Convert image to WebP format (client-side)
   */
  static convertToWebP(file: File, quality = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image'));
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
}

/**
 * Progressive image loading component utility
 */
export class ProgressiveImageLoader {
  private placeholder: string;
  private lowQuality: string;
  private highQuality: string;

  constructor(placeholder: string, lowQuality: string, highQuality: string) {
    this.placeholder = placeholder;
    this.lowQuality = lowQuality;
    this.highQuality = highQuality;
  }

  async load(): Promise<string> {
    // Start with placeholder
    const img = new Image();
    
    // Load low quality first
    return new Promise((resolve) => {
      img.onload = () => {
        resolve(this.lowQuality);
        
        // Then load high quality in background
        const highQualityImg = new Image();
        highQualityImg.onload = () => {
          resolve(this.highQuality);
        };
        highQualityImg.src = this.highQuality;
      };
      img.src = this.lowQuality;
    });
  }
}

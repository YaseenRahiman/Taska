'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Download, Share2, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageItem {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  thumbnail?: string;
}

interface MobileImageGalleryProps {
  images: ImageItem[];
  initialIndex?: number;
  onClose?: () => void;
  className?: string;
}

export function MobileImageGallery({
  images,
  initialIndex = 0,
  onClose,
  className = ''
}: MobileImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [scale, setScale] = useState(1);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [canShare, setCanShare] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const currentImage = images[currentIndex];

  // Check if Web Share API is supported
  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  // Handle touch events for swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    const minSwipeDistance = 50;

    // Horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe left - next image
        goToNext();
      } else {
        // Swipe right - previous image
        goToPrevious();
      }
    }

    // Vertical swipe down to close (if not zoomed)
    if (!isZoomed && deltaY > minSwipeDistance && Math.abs(deltaX) < minSwipeDistance) {
      onClose?.();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Handle pinch-to-zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.min(Math.max(scale + delta, 0.5), 3);
    setScale(newScale);
    setIsZoomed(newScale > 1);
  };

  // Navigation functions
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    resetZoom();
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    resetZoom();
  };

  const resetZoom = () => {
    setScale(1);
    setIsZoomed(false);
  };

  const handleZoomIn = () => {
    const newScale = Math.min(scale + 0.5, 3);
    setScale(newScale);
    setIsZoomed(newScale > 1);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.5, 0.5);
    setScale(newScale);
    setIsZoomed(newScale > 1);
  };

  // Handle share functionality
  const handleShare = async () => {
    if (navigator.share && currentImage) {
      try {
        await navigator.share({
          title: currentImage.alt,
          text: currentImage.caption || currentImage.alt,
          url: currentImage.src
        });
      } catch (error) {
        console.log('Share failed:', error);
        // Fallback to copy URL
        await navigator.clipboard.writeText(currentImage.src);
      }
    }
  };

  // Handle download
  const handleDownload = () => {
    if (currentImage) {
      const link = document.createElement('a');
      link.href = currentImage.src;
      link.download = `taska-image-${currentImage.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose?.();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent body scroll when gallery is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className={`fixed inset-0 z-50 bg-black ${className}`}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center space-x-2 text-white">
          <span className="text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <button
            onClick={handleZoomOut}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors touch-target"
            disabled={scale <= 0.5}
          >
            <ZoomOut size={20} />
          </button>
          
          <button
            onClick={handleZoomIn}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors touch-target"
            disabled={scale >= 3}
          >
            <ZoomIn size={20} />
          </button>

          {/* Share Button */}
          {canShare && (
            <button
              onClick={handleShare}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors touch-target"
            >
              <Share2 size={20} />
            </button>
          )}

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors touch-target"
          >
            <Download size={20} />
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors touch-target"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Image */}
      <div
        ref={galleryRef}
        className="relative h-full flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {currentImage && (
          <img
            ref={imageRef}
            src={currentImage.src}
            alt={currentImage.alt}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{
              transform: `scale(${scale})`,
              cursor: isZoomed ? 'grab' : 'default'
            }}
            draggable={false}
          />
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white bg-black/30 hover:bg-black/50 rounded-full transition-colors touch-target"
            >
              <ChevronLeft size={24} />
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white bg-black/30 hover:bg-black/50 rounded-full transition-colors touch-target"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {/* Caption */}
      {currentImage.caption && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
          <p className="text-white text-sm text-center">{currentImage.caption}</p>
        </div>
      )}

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 bg-black/30 rounded-full p-2 image-gallery-mobile">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => {
                setCurrentIndex(index);
                resetZoom();
              }}
              className={`relative w-12 h-12 rounded-full overflow-hidden transition-all touch-target ${
                index === currentIndex
                  ? 'ring-2 ring-white scale-110'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={image.thumbnail || image.src}
                alt={image.alt}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Swipe Indicator */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-white/50 text-xs text-center">
        <p>Swipe to navigate • Pinch to zoom • Swipe down to close</p>
      </div>
    </div>
  );
}

// Thumbnail Gallery Component for displaying images in a grid
interface ThumbnailGalleryProps {
  images: ImageItem[];
  onImageClick: (index: number) => void;
  className?: string;
}

export function ThumbnailGallery({ images, onImageClick, className = '' }: ThumbnailGalleryProps) {
  return (
    <div className={`mobile-grid gap-2 ${className}`}>
      {images.map((image, index) => (
        <button
          key={image.id}
          onClick={() => onImageClick(index)}
          className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 touch-target group"
        >
          <img
            src={image.thumbnail || image.src}
            alt={image.alt}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </button>
      ))}
    </div>
  );
}

export default MobileImageGallery;

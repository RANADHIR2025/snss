import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface AboutBannerCarouselProps {
  images: string[];
  autoPlayInterval?: number;
}

export function AboutBannerCarousel({ 
  images, 
  autoPlayInterval = 4000 
}: AboutBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  // Auto-play functionality
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [images.length, autoPlayInterval, goToNext]);

  if (images.length === 0) return null;

  // Single image - static display
  if (images.length === 1) {
    return (
      <img 
        src={images[0]} 
        alt="About SNSS" 
        className="w-full h-full object-cover"
      />
    );
  }

  // Multiple images - carousel
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Images */}
      {images.map((image, index) => (
        <div
          key={index}
          className={cn(
            "absolute inset-0 transition-opacity duration-700 ease-in-out",
            index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
        >
          <img 
            src={image} 
            alt={`About SNSS ${index + 1}`} 
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {/* Indicator Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === currentIndex 
                ? "bg-primary w-6" 
                : "bg-primary/40 hover:bg-primary/60"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

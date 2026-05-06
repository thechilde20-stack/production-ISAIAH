import { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';

interface YoutubeThumbnailProps {
  videoId: string;
  alt: string;
  className?: string;
}

const urlCache = new Map<string, string>();

export default function YoutubeThumbnail({ videoId, alt, className }: YoutubeThumbnailProps) {
  const [src, setSrc] = useState<string>(urlCache.get(videoId) || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);

  useEffect(() => {
    if (urlCache.has(videoId)) return;

    const checkImage = (url: string) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        // YouTube returns a 120x90 placeholder when maxresdefault is not available
        let finalUrl = url;
        if (img.width === 120 && url.includes('maxresdefault')) {
          finalUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
        urlCache.set(videoId, finalUrl);
        setSrc(finalUrl);
      };
      img.onerror = () => {
        if (url.includes('maxresdefault')) {
          const fallbackUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          urlCache.set(videoId, fallbackUrl);
          setSrc(fallbackUrl);
        }
      };
    };

    checkImage(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
  }, [videoId]);

  return (
    <img
      src={src}
      alt={alt}
      className={cn("w-full h-full object-cover transition-transform duration-700", className)}
      referrerPolicy="no-referrer"
      loading="lazy"
      decoding="async"
    />
  );
}

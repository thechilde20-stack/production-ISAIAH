import { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';

interface YoutubeThumbnailProps {
  videoId: string;
  alt: string;
  className?: string;
}

export default function YoutubeThumbnail({ videoId, alt, className }: YoutubeThumbnailProps) {
  const [src, setSrc] = useState<string>(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);

  useEffect(() => {
    const checkImage = (url: string) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        // YouTube returns a 120x90 placeholder when maxresdefault is not available
        if (img.width === 120 && url.includes('maxresdefault')) {
          setSrc(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
        } else {
          setSrc(url);
        }
      };
      img.onerror = () => {
        if (url.includes('maxresdefault')) {
          setSrc(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
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
    />
  );
}

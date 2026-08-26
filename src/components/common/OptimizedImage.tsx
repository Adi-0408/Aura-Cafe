import React, { useState } from 'react';
import { Coffee, Image as ImageIcon } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallbackType?: 'coffee' | 'general';
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  fallbackType = 'coffee',
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {loading && !error && (
        <div className="absolute inset-0 bg-[#E5ECEE] animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-[#D2DFE2] flex items-center justify-center animate-bounce">
            <Coffee className="w-4 h-4 text-[#1B8585] opacity-50" />
          </div>
        </div>
      )}

      {error ? (
        <div className="w-full h-full min-h-[120px] bg-[#EEF4F6] flex flex-col items-center justify-center text-stone-400 p-4 text-center">
          {fallbackType === 'coffee' ? (
            <Coffee className="w-8 h-8 text-[#1B8585]/40 mb-1" />
          ) : (
            <ImageIcon className="w-8 h-8 text-stone-300 mb-1" />
          )}
          <span className="text-[10px] uppercase font-bold text-stone-400">Aura Artisan Selection</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoading(false)}
          onError={() => {
            setError(true);
            setLoading(false);
          }}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            loading ? 'opacity-0' : 'opacity-100'
          }`}
          {...props}
        />
      )}
    </div>
  );
};

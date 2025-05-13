"use client"

import { useState, useEffect, useRef } from 'react';
import { X, Check, RotateCcw, Sliders } from 'lucide-react';

type FilterMode = 'blackWhite' | 'grayscale' | 'color';

interface FilterOption {
  id: FilterMode;
  label: string;
}

interface ResultViewerProps {
  imageUrl: string;
  normalizedImageUrl?: string;
  onConfirm: (processedImageUrl: string) => void;
  onCancel: () => void;
}

const FILTER_OPTIONS: FilterOption[] = [
  { id: 'blackWhite', label: 'B&W' },
  { id: 'grayscale', label: 'Grayscale' },
  { id: 'color', label: 'Color' }
];

export default function ResultViewer({
  imageUrl,
  normalizedImageUrl,
  onConfirm,
  onCancel
}: ResultViewerProps) {
  const [rotation, setRotation] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<FilterMode>('color');
  const [showFilters, setShowFilters] = useState(false);
  const [processedImages, setProcessedImages] = useState<Record<FilterMode, string | null>>({
    blackWhite: null,
    grayscale: null,
    color: normalizedImageUrl || imageUrl
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Process image with different filters
  useEffect(() => {
    const processImage = async () => {
      if (!canvasRef.current) return;
      
      // Simple filter processing for demo purposes
      try {
        setIsProcessing(true);
        
        // Create a temporary image element to load the source image
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        // Wait for the image to load before processing
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = normalizedImageUrl || imageUrl;
        });
        
        // Create canvases for each filter type
        const blackWhiteCanvas = document.createElement('canvas');
        const grayscaleCanvas = document.createElement('canvas');
        const colorCanvas = document.createElement('canvas');
        
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        
        [blackWhiteCanvas, grayscaleCanvas, colorCanvas].forEach(canvas => {
          canvas.width = width;
          canvas.height = height;
        });
        
        // Apply black & white filter
        const bwCtx = blackWhiteCanvas.getContext('2d');
        if (bwCtx) {
          bwCtx.drawImage(img, 0, 0);
          const imageData = bwCtx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const value = avg > 128 ? 255 : 0; // Hard threshold for black & white
            data[i] = data[i + 1] = data[i + 2] = value;
          }
          
          bwCtx.putImageData(imageData, 0, 0);
        }
        
        // Apply grayscale filter
        const gsCtx = grayscaleCanvas.getContext('2d');
        if (gsCtx) {
          gsCtx.drawImage(img, 0, 0);
          const imageData = gsCtx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11);
            data[i] = data[i + 1] = data[i + 2] = avg;
          }
          
          gsCtx.putImageData(imageData, 0, 0);
        }
        
        // Color is just the original image
        const colorCtx = colorCanvas.getContext('2d');
        if (colorCtx) {
          colorCtx.drawImage(img, 0, 0);
        }
        
        // Update state with processed images
        setProcessedImages({
          blackWhite: blackWhiteCanvas.toDataURL('image/jpeg'),
          grayscale: grayscaleCanvas.toDataURL('image/jpeg'),
          color: colorCanvas.toDataURL('image/jpeg')
        });
      } catch (error) {
        console.error('Error processing image:', error);
        // Fallback: just use the original image for all filters
        setProcessedImages({
          blackWhite: imageUrl,
          grayscale: imageUrl,
          color: normalizedImageUrl || imageUrl
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processImage();
  }, [imageUrl, normalizedImageUrl]);

  const rotateImage = () => {
    setRotation((prev) => (prev - 90) % 360);
  };

  const handleFilterSelect = (filter: FilterMode) => {
    setSelectedFilter(filter);
    // Auto-hide filter panel after selection on mobile
    setShowFilters(false);
  };

  const getCurrentImage = () => {
    return processedImages[selectedFilter] || imageUrl;
  };

  const handleConfirm = () => {
    // If we need to apply rotation to the image before confirming
    if (rotation !== 0 && canvasRef.current) {
      const canvas = canvasRef.current;
      const img = new Image();
      
      img.onload = () => {
        canvas.width = rotation % 180 === 0 ? img.width : img.height;
        canvas.height = rotation % 180 === 0 ? img.height : img.width;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
          
          const rotatedImageUrl = canvas.toDataURL('image/jpeg');
          onConfirm(rotatedImageUrl);
        }
      };
      
      img.src = getCurrentImage() || imageUrl;
    } else {
      onConfirm(getCurrentImage() || imageUrl);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Top toolbar */}
      <div className="h-12 bg-black/80 flex items-center justify-between px-4 z-10">
        <button 
          type="button"
          className="text-white p-2 z-20" 
          onClick={rotateImage}
          aria-label="Rotate image"
        >
          <RotateCcw size={24} />
        </button>
        
        <button 
          type="button"
          className={`text-white p-2 z-20 ${showFilters ? 'bg-white/20 rounded' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          aria-label="Show filters"
        >
          <Sliders size={24} />
        </button>
      </div>
      
      {/* Filter options */}
      {showFilters && (
        <div className="h-16 bg-black/80 flex items-center px-4 space-x-4 z-10">
          {FILTER_OPTIONS.map((filter) => (
            <div
              key={filter.id}
              className="flex flex-col items-center"
              onClick={() => handleFilterSelect(filter.id)}
            >
              <div 
                className={`w-12 h-10 flex items-center justify-center rounded ${
                  selectedFilter === filter.id ? 'border border-blue-500' : ''
                }`}
              >
                <div 
                  className={`w-10 h-8 bg-cover bg-center rounded ${
                    !processedImages[filter.id] ? 
                    (filter.id === 'blackWhite' ? 'bg-gray-300' : 
                    filter.id === 'grayscale' ? 'bg-gray-500' : 'bg-blue-500') : ''
                  }`}
                  style={processedImages[filter.id] ? {
                    backgroundImage: `url(${processedImages[filter.id]})`
                  } : undefined}
                ></div>
              </div>
              <span className="text-white text-xs mt-1">{filter.label}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Image container */}
      <div className="flex-1 flex items-center justify-center p-4 bg-black">
        {isProcessing ? (
          <div className="text-white">Processing image...</div>
        ) : (
          <img
            src={getCurrentImage() || imageUrl}
            alt="Processed document"
            className="max-w-full max-h-full object-contain"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        )}
      </div>
      
      {/* Bottom toolbar */}
      <div className="h-16 bg-black/80 flex items-center justify-between px-8 z-10">
        <button 
          type="button"
          className="text-white p-3 z-20"
          onClick={onCancel}
          aria-label="Cancel"
        >
          <X size={28} />
        </button>
        
        <button 
          type="button"
          className="text-white p-3 z-20"
          onClick={handleConfirm}
          aria-label="Confirm"
        >
          <Check size={28} />
        </button>
      </div>
    </div>
  );
}
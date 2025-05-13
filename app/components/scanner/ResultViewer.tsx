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

  function handleConfirmClick() {
    console.log("Confirm clicked");
    try {
      // If we need to apply rotation to the image before confirming
      if (rotation !== 0 && canvasRef.current) {
        const canvas = canvasRef.current;
        const img = new Image();
        
        // Create a flag to avoid stale references
        let isCurrentConfirmation = true;
        
        img.onload = () => {
          // Skip if another confirm happened
          if (!isCurrentConfirmation) return;
          
          canvas.width = rotation % 180 === 0 ? img.width : img.height;
          canvas.height = rotation % 180 === 0 ? img.height : img.width;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);
            
            const rotatedImageUrl = canvas.toDataURL('image/jpeg');
            // Delay execution to ensure Safari handles events correctly
            setTimeout(() => {
              if (isCurrentConfirmation) {
                onConfirm(rotatedImageUrl);
              }
            }, 50); // Small delay to ensure button click is completed first
          }
        };
        
        img.src = getCurrentImage() || imageUrl;
        
        // Clean up function
        return () => {
          isCurrentConfirmation = false;
        };
      } else {
        // Delay execution to ensure Safari handles events correctly
        setTimeout(() => {
          onConfirm(getCurrentImage() || imageUrl);
        }, 50); // Small delay to ensure button click is completed first
      }
    } catch (error) {
      console.error("Error in confirm handler:", error);
    }
  }

  function handleCancelClick() {
    console.log("Cancel clicked");
    try {
      onCancel();
    } catch (error) {
      console.error("Error in cancel handler:", error);
    }
  }

  function handleRotateClick() {
    console.log("Rotate clicked");
    rotateImage();
  }

  function handleFiltersToggle() {
    console.log("Filters toggle clicked");
    setShowFilters(!showFilters);
  }

  return (
    <>
      {/* Main Image Container */}
      <div className="fixed inset-0 bg-black z-50">
        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Main Container with padding for fixed headers/footers */}
        <div className="absolute inset-0 flex flex-col pt-12 pb-16">
          {/* Image container */}
          <div className="flex-1 flex items-center justify-center p-4 bg-black overflow-hidden">
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
        </div>
        
        {/* Top toolbar - Absolutely positioned */}
        <div className="absolute top-0 left-0 right-0 h-12 bg-black/80 flex items-center justify-center z-[1000]">
          <div className="text-white text-sm font-bold">Adjust Image</div>
        </div>
        
        {/* Filter options - Only shown when toggled */}
        {showFilters && (
          <div 
            className="absolute top-12 left-0 right-0 h-16 bg-black/90 flex items-center justify-center px-4 space-x-6 z-[1000]"
          >
            {FILTER_OPTIONS.map((filter) => (
              <div
                key={filter.id}
                className="flex flex-col items-center"
                onClick={() => handleFilterSelect(filter.id)}
              >
                <div 
                  className={`w-12 h-10 flex items-center justify-center rounded p-1 ${
                    selectedFilter === filter.id ? 'bg-purple-600 border border-white' : 'bg-gray-700'
                  }`}
                >
                  <div 
                    className={`w-full h-full bg-cover bg-center rounded`}
                    style={processedImages[filter.id] ? {
                      backgroundImage: `url(${processedImages[filter.id]})`
                    } : {
                      backgroundColor: filter.id === 'blackWhite' ? '#fff' : 
                                       filter.id === 'grayscale' ? '#aaa' : '#5e97f6'
                    }}
                  ></div>
                </div>
                <span className="text-white text-xs mt-1">{filter.label}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Bottom toolbar */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-black/80 z-[1000] flex justify-center"></div>
      </div>

      {/* Buttons in completely separate containers outside the main component flow */}
      {/* Rotate Button - Fixed positioned */}
      <div className="fixed top-0 left-0 p-2 z-[9999]">
        <button 
          type="button"
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center"
          onClick={handleRotateClick}
          style={{ touchAction: 'manipulation' }}
          aria-label="Rotate image"
        >
          <RotateCcw size={28} />
        </button>
      </div>
      
      {/* Filter Button - Fixed positioned */}
      <div className="fixed top-0 right-0 p-2 z-[9999]">
        <button 
          type="button"
          className={`w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center ${showFilters ? 'bg-purple-600' : 'bg-blue-600'}`}
          onClick={handleFiltersToggle}
          style={{ touchAction: 'manipulation' }}
          aria-label="Toggle filters"
        >
          <Sliders size={28} />
        </button>
      </div>

      {/* Cancel Button - Fixed positioned */}
      <div className="fixed bottom-0 left-0 p-4 z-[9999]">
        <button 
          type="button"
          className="w-16 h-16 bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center"
          onClick={handleCancelClick}
          style={{ touchAction: 'manipulation' }}
          aria-label="Cancel"
        >
          <X size={32} />
        </button>
      </div>
      
      {/* Confirm Button - Fixed positioned */}
      <div className="fixed bottom-0 right-0 p-4 z-[9999]">
        <button 
          type="button"
          className="w-16 h-16 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center"
          onClick={handleConfirmClick}
          style={{ touchAction: 'manipulation' }}
          aria-label="Confirm"
        >
          <Check size={32} />
        </button>
      </div>
    </>
  );
}
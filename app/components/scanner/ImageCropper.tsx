"use client"

import { useEffect, useRef, useState, useCallback } from 'react';
import { Check, X } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Quad {
  points: Point[];
}

interface ImageCropperProps {
  imageUrl: string;
  initialQuad?: Quad;
  onConfirm: (quad: Quad) => void;
  onCancel: () => void;
}

export default function ImageCropper({
  imageUrl,
  initialQuad,
  onConfirm,
  onCancel
}: ImageCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [quad, setQuad] = useState<Quad | null>(null);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [selectedCorner, setSelectedCorner] = useState<number | null>(null);
  const [scale, setScale] = useState(1);

  // Initialize the cropper when the image is loaded
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const handleImageLoad = () => {
      const { naturalWidth, naturalHeight } = img;
      setImgSize({ width: naturalWidth, height: naturalHeight });

      // Calculate the scale to fit the image in the container
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        
        const widthScale = containerWidth / naturalWidth;
        const heightScale = containerHeight / naturalHeight;
        
        // Use the smaller scale to fit the image
        const newScale = Math.min(widthScale, heightScale, 1);
        setScale(newScale);
      }

      // If we have an initial quad, use it, otherwise create a default one
      if (initialQuad) {
        setQuad(initialQuad);
      } else {
        // Create a default quad (rectangle) based on the image dimensions
        const x = naturalWidth * 0.1;
        const y = naturalHeight * 0.1;
        const width = naturalWidth * 0.8;
        const height = naturalHeight * 0.8;

        setQuad({
          points: [
            { x, y },
            { x: x + width, y },
            { x: x + width, y: y + height },
            { x, y: y + height }
          ]
        });
      }
    };

    img.onload = handleImageLoad;
    if (img.complete) handleImageLoad();

    return () => {
      img.onload = null;
    };
  }, [imageUrl, initialQuad]);

  // Draw the quad on the canvas whenever it changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !quad) return;

    canvas.width = imgSize.width * scale;
    canvas.height = imgSize.height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw a semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the quad
    ctx.beginPath();
    ctx.moveTo(quad.points[0].x * scale, quad.points[0].y * scale);
    for (let i = 1; i < quad.points.length; i++) {
      ctx.lineTo(quad.points[i].x * scale, quad.points[i].y * scale);
    }
    ctx.closePath();

    // Cut out the quad area to show the image
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Draw the quad outline
    ctx.strokeStyle = '#39FF14';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw the corner handles
    const cornerSize = 20; // Increased from 10 for better touch targets
    quad.points.forEach((point, index) => {
      ctx.fillStyle = index === selectedCorner ? '#FF3939' : '#39FF14';
      ctx.fillRect(
        point.x * scale - cornerSize/2,
        point.y * scale - cornerSize/2,
        cornerSize,
        cornerSize
      );
    });
  }, [quad, selectedCorner, imgSize, scale]);

  // Handle mouse/touch interactions with improved touch support
  useEffect(() => {
    if (!quad || !canvasRef.current) return;
    
    const isMounted = { current: true };
    const canvas = canvasRef.current;

    const getEventPoint = (e: MouseEvent | TouchEvent): Point => {
      const canvasRect = canvas.getBoundingClientRect();
      let clientX, clientY;
      
      if ('touches' in e) {
        // Touch event
        if (e.touches.length === 0 && e.changedTouches.length > 0) {
          // For touchend events, use changedTouches
          clientX = e.changedTouches[0].clientX;
          clientY = e.changedTouches[0].clientY;
        } else if (e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          return { x: 0, y: 0 }; // Should not happen
        }
      } else {
        // Mouse event
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      return {
        x: (clientX - canvasRect.left) / scale,
        y: (clientY - canvasRect.top) / scale
      };
    };

    const findNearestCorner = (point: Point): number => {
      let minDistance = Number.MAX_VALUE;
      let cornerIndex = -1;

      quad.points.forEach((corner, index) => {
        const dx = corner.x - point.x;
        const dy = corner.y - point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
          minDistance = distance;
          cornerIndex = index;
        }
      });

      // Increased the tap target size for mobile (from 40 to 50)
      return minDistance < 50 / scale ? cornerIndex : -1;
    };

    // Use pointer events instead of separate mouse/touch events
    const onPointerDown = (e: PointerEvent) => {
      // Skip if this is a button or something else
      if (e.target !== canvas) return;
      
      e.preventDefault();
      const point = getEventPoint(e as any);
      const cornerIndex = findNearestCorner(point);
      
      if (cornerIndex >= 0 && isMounted.current) {
        setSelectedCorner(cornerIndex);
        // Set pointer capture to ensure all events go to the canvas
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (selectedCorner === null) return;
      
      e.preventDefault();
      const point = getEventPoint(e as any);
      
      if (isMounted.current) {
        setQuad(prev => {
          if (!prev) return prev;
          
          const newPoints = [...prev.points];
          newPoints[selectedCorner] = point;
          
          return { points: newPoints };
        });
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      e.preventDefault();
      
      // Release pointer capture
      if (e.target === canvas) {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      }
      
      if (isMounted.current) {
        setSelectedCorner(null);
      }
    };

    // Add pointer event listeners
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    return () => {
      isMounted.current = false;
      
      // Clean up event listeners
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    };
  }, [quad, selectedCorner, scale]);

  function handleCancelClick() {
    console.log("Cancel clicked");
    try {
      onCancel();
    } catch (error) {
      console.error("Error in cancel handler:", error);
    }
  }

  function handleConfirmClick() {
    console.log("Confirm clicked");
    try {
      if (quad) {
        onConfirm(quad);
      }
    } catch (error) {
      console.error("Error in confirm handler:", error);
    }
  }

  return (
    <>
      {/* The main canvas container */}
      <div className="fixed inset-0 bg-black z-50">
        {/* Main Canvas Area */}
        <div className="absolute inset-0 flex flex-col pt-12 pb-8">
          <div 
            ref={containerRef}
            className="flex-1 relative overflow-hidden"
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Document to crop"
              className="absolute hidden"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 m-auto max-w-full max-h-full"
              style={{ touchAction: 'none' }} /* Disable browser handling of touch gestures */
            />
          </div>
        </div>
        
        {/* Header - Absolutely positioned */}
        <div className="absolute top-0 left-0 right-0 h-12 bg-black/80 flex items-center justify-between px-4 z-[1000]">
          <div className="text-white text-sm font-bold">Adjust corners</div>
        </div>
        
        {/* Footer - Absolutely positioned */}
        <div className="absolute bottom-0 left-0 right-0 text-center text-white text-sm py-2 bg-black/80 z-[1000]">
          Drag the corners to adjust the document boundaries
        </div>
      </div>

      {/* Buttons in completely separate containers outside the main component flow */}
      {/* Cancel Button */}
      <div className="fixed top-0 left-0 p-2 z-[9999]">
        <button 
          type="button"
          className="w-14 h-14 bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center"
          onClick={handleCancelClick}
          style={{ touchAction: 'manipulation' }}
          aria-label="Cancel"
        >
          <X size={28} />
        </button>
      </div>
      
      {/* Confirm Button */}
      <div className="fixed top-0 right-0 p-2 z-[9999]">
        <button 
          type="button"
          className="w-14 h-14 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center"
          onClick={handleConfirmClick}
          style={{ touchAction: 'manipulation' }}
          aria-label="Confirm"
        >
          <Check size={28} />
        </button>
      </div>
    </>
  );
}
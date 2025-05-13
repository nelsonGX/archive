"use client"

import { useRef, useEffect, useState, useCallback } from 'react';
import { X, Zap, RotateCcw, FlipHorizontal, Camera } from 'lucide-react';
import { Resolution } from './ResolutionSelect';
import { 
  drawPolygonOnSvg, 
  scaleQuad, 
  isSteady, 
  isCameraSupported, 
  isSecureContext,
  createMockDetectionTools
} from '@/app/lib/scannerUtils';

interface ScannerCameraProps {
  deviceId: string;
  resolution: Resolution;
  onClose: () => void;
  onCapture: (imageData: string, detectedQuad?: any) => void;
}

export default function ScannerCamera({ 
  deviceId, 
  resolution, 
  onClose, 
  onCapture 
}: ScannerCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [autoCapture, setAutoCapture] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectedQuad, setDetectedQuad] = useState<any>(null);
  const [previousResults, setPreviousResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cameraSupported, setCameraSupported] = useState(true);

  // Create mock detection tools
  const mockDetection = createMockDetectionTools();

  // Check if camera is supported on this browser/device
  useEffect(() => {
    // Check if we're running in a browser environment
    if (typeof window === 'undefined') return;
    
    // Check if camera API is supported
    if (!isCameraSupported()) {
      setCameraSupported(false);
      setError('Camera API not supported in this browser');
      return;
    }

    // Check if we're in a secure context
    if (!isSecureContext()) {
      setCameraSupported(false);
      setError('Camera access requires a secure context (HTTPS)');
      return;
    }
  }, []);

  // Start camera
  useEffect(() => {
    if (!cameraSupported) return;

    const startCamera = async () => {
      try {
        if (stream) {
          // Stop any previous stream
          stream.getTracks().forEach(track => track.stop());
        }

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: 'environment', // Default to back camera on mobile
            width: { ideal: resolution.width },
            height: { ideal: resolution.height }
          },
          audio: false
        };

        // If we have a specific device ID, use it
        if (deviceId) {
          (constraints.video as MediaTrackConstraints).deviceId = { exact: deviceId };
        }

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(newStream);

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }

        // Check if torch is supported
        const videoTrack = newStream.getVideoTracks()[0];
        if (videoTrack?.getCapabilities?.()?.torch) {
          // Torch is supported
        }
      } catch (error) {
        console.error('Error starting camera:', error);
        setError('Unable to access camera. Please ensure you have granted camera permissions.');
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [deviceId, resolution, cameraSupported]);

  // Helper function to add a result to previousResults - avoid direct state update in useEffect
  const addResultToQueue = useCallback((quad: any) => {
    setPreviousResults(prev => {
      const updated = [...prev, quad];
      if (updated.length > 3) {
        updated.shift();
      }
      return updated;
    });
  }, []);

  // Capture function to avoid recreating in useEffect dependency
  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg');
      onCapture(imageData, detectedQuad);
    }
  }, [onCapture, detectedQuad]);

  // Set up document detection
  useEffect(() => {
    if (!cameraSupported || error) return;
    
    let detectionInterval: NodeJS.Timeout | null = null;
    let isComponentMounted = true;
    
    const startDetecting = () => {
      setDetecting(false);
      setPreviousResults([]); 
      
      detectionInterval = setInterval(async () => {
        if (!isComponentMounted) return;
        if (detecting || !videoRef.current || !svgRef.current || !hiddenCanvasRef.current) return;
        
        setDetecting(true);
        
        try {
          // Capture frame for detection
          const canvas = hiddenCanvasRef.current;
          const video = videoRef.current;
          
          // Scale down for detection if needed
          let scaleDownRatio = 1;
          let width = video.videoWidth;
          let height = video.videoHeight;
          
          if (width > 2000 || height > 2000) {
            width = 1080;
            height = width * (video.videoHeight / video.videoWidth);
            scaleDownRatio = width / video.videoWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);
          }
          
          // Use mock detection for document detection
          const quads = await mockDetection.detectQuad(canvas);
          
          if (!isComponentMounted) return;
          
          setDetecting(false);
          
          const svg = svgRef.current;
          if (!svg) return;
          
          svg.setAttribute("viewBox", `0 0 ${video.videoWidth} ${video.videoHeight}`);
          
          if (quads.length > 0) {
            const quad = quads[0];
            
            if (scaleDownRatio !== 1) {
              scaleQuad(quad, scaleDownRatio);
            }
            
            // Draw the detected quad on the overlay
            drawPolygonOnSvg(quad.location.points, svg);
            
            if (!isComponentMounted) return;
            setDetectedQuad(quad);
            
            if (autoCapture) {
              // Handle auto capture logic
              addResultToQueue(quad);
              
              // Check if the document is stable using the previous results + new quad
              const results = [...previousResults, quad];
              if (results.length >= 3 && isSteady(results)) {
                captureImage();
              }
            }
          } else {
            // Clear overlay if no quad detected
            svg.innerHTML = "";
          }
        } catch (error) {
          console.error('Error during document detection:', error);
          if (isComponentMounted) {
            setDetecting(false);
          }
        }
      }, 300);
    };
    
    // Start detection when video is loaded
    const handleVideoLoaded = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        startDetecting();
      }
    };
    
    if (videoRef.current) {
      if (videoRef.current.readyState >= 2) {
        startDetecting();
      } else {
        videoRef.current.onloadeddata = handleVideoLoaded;
      }
    }
    
    return () => {
      isComponentMounted = false;
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }
      if (videoRef.current) {
        videoRef.current.onloadeddata = null;
      }
    };
  }, [autoCapture, error, cameraSupported, addResultToQueue, captureImage]);

  const toggleTorch = async () => {
    if (!stream) return;
    
    try {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack.getCapabilities()?.torch) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !torchEnabled }]
        });
        setTorchEnabled(!torchEnabled);
      }
    } catch (error) {
      console.error('Error toggling torch:', error);
    }
  };

  const switchCamera = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      
      if (cameras.length <= 1) return;
      
      const currentIndex = cameras.findIndex(camera => camera.deviceId === deviceId);
      const nextIndex = (currentIndex + 1) % cameras.length;
      const nextCamera = cameras[nextIndex];
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: { exact: nextCamera.deviceId },
          width: { ideal: resolution.width },
          height: { ideal: resolution.height }
        },
        audio: false
      };
      
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error) {
      console.error('Error switching camera:', error);
    }
  };

  // If camera is not supported, show fallback UI
  if (!cameraSupported || error) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Camera Access Error</h2>
          <p className="mb-4 text-slate-600 dark:text-slate-300">{error || 'Camera is not supported on this device or browser.'}</p>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            Try using a different browser or device. Make sure you're on a secure (HTTPS) connection and have granted camera permissions.
          </p>
          <button 
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={onClose}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Toggle auto capture - memoize to avoid recreation in useEffect dependencies
  const toggleAutoCapture = useCallback(() => {
    setAutoCapture(prev => !prev);
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="relative h-full">
        {/* Video capture area */}
        <div className="relative w-full h-full">
          <video 
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          <svg 
            ref={svgRef}
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
            xmlns="http://www.w3.org/2000/svg"
          ></svg>
          
          {/* Hidden canvas for processing */}
          <canvas 
            ref={canvasRef}
            className="hidden"
          ></canvas>
          <canvas 
            ref={hiddenCanvasRef}
            className="hidden"
          ></canvas>
        </div>
        
        {/* Top toolbar */}
        <div className="absolute top-0 left-0 right-0 h-12 bg-black/80 flex items-center justify-between px-4 z-10">
          <button 
            type="button"
            onClick={onClose}
            className="text-white p-2 z-20"
          >
            <X size={24} />
          </button>
          
          <button 
            type="button"
            onClick={toggleTorch}
            className={`text-white p-2 z-20 ${torchEnabled ? 'bg-white/20 rounded-full' : ''}`}
          >
            <Zap size={24} />
          </button>
        </div>
        
        {/* Bottom toolbar */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-black/80 flex items-center justify-around px-4 z-10">
          <button 
            type="button"
            onClick={switchCamera}
            className="text-white p-3 z-20"
            aria-label="Switch camera"
          >
            <FlipHorizontal size={28} />
          </button>
          
          <button 
            type="button"
            onClick={captureImage}
            className="bg-white rounded-full p-4 mx-4 z-20"
            aria-label="Capture photo"
          >
            <div className="w-10 h-10 rounded-full border-2 border-gray-200"></div>
          </button>
          
          <button 
            type="button"
            onClick={toggleAutoCapture}
            className={`text-white p-3 z-20 ${autoCapture ? 'text-green-500' : ''}`}
            aria-label="Toggle auto capture"
          >
            <Camera size={28} />
          </button>
        </div>
      </div>
    </div>
  );
}
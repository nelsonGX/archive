"use client"

import { useState, useCallback, useEffect } from 'react';
import { Camera, Upload, AlertCircle } from 'lucide-react';
import { Resolution } from './ResolutionSelect';
import CameraSelect from './CameraSelect';
import ResolutionSelect from './ResolutionSelect';
import ScannerCamera from './ScannerCamera';
import ImageCropper from './ImageCropper';
import ResultViewer from './ResultViewer';
import { isCameraSupported, isSecureContext } from '@/app/lib/scannerUtils';

// Define scanner modes
type ScannerMode = 'setup' | 'camera' | 'cropper' | 'result' | 'complete';

interface Point {
  x: number;
  y: number;
}

interface Quad {
  points: Point[];
}

interface ScannedDocument {
  originalImage: string;
  processedImage: string;
}

interface DocumentScannerProps {
  onComplete: (documents: ScannedDocument[]) => void;
}

export default function DocumentScanner({ onComplete }: DocumentScannerProps) {
  // Check if camera is supported
  const [isCameraAvailable, setIsCameraAvailable] = useState(true);
  
  useEffect(() => {
    // Check if we're running in a browser environment
    if (typeof window === 'undefined') return;
    
    // Check browser support for camera
    setIsCameraAvailable(isCameraSupported() && isSecureContext());
  }, []);

  // State for camera and resolution selection
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [selectedResolution, setSelectedResolution] = useState<Resolution>({
    width: 1280,
    height: 720,
    label: 'HD (720p)'
  });
  
  // State for scanner workflow
  const [mode, setMode] = useState<ScannerMode>('setup');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedQuad, setDetectedQuad] = useState<Quad | null>(null);
  const [normalizedImage, setNormalizedImage] = useState<string | null>(null);
  const [scannedDocuments, setScannedDocuments] = useState<ScannedDocument[]>([]);
  
  // Handlers for camera setup
  const handleDeviceSelect = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId);
  }, []);
  
  const handleResolutionSelect = useCallback((resolution: Resolution) => {
    setSelectedResolution(resolution);
  }, []);
  
  // Handler for starting camera
  const startCamera = useCallback(() => {
    if (!isCameraAvailable) {
      alert('Camera is not supported in this browser or you are not in a secure context (HTTPS). Please use a different browser or upload an image instead.');
      return;
    }
    
    if (selectedDeviceId) {
      setMode('camera');
    } else {
      // Request camera permission first
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          // Stop the stream immediately, we just needed permission
          stream.getTracks().forEach(track => track.stop());
          // Now transition to camera mode
          setMode('camera');
        })
        .catch(err => {
          console.error('Error accessing camera:', err);
          alert('Camera access is required for document scanning. Please ensure you have granted camera permissions.');
        });
    }
  }, [selectedDeviceId, isCameraAvailable]);
  
  // Handler for image upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
        setMode('cropper');
      };
      reader.readAsDataURL(file);
    }
  }, []);
  
  // Handler for camera capture
  const handleCapture = useCallback((imageData: string, quad?: any) => {
    setCapturedImage(imageData);
    if (quad) {
      setDetectedQuad(quad.location);
    }
    setMode('cropper');
  }, []);
  
  // Handler for cropper confirm
  const handleCropConfirm = useCallback((quad: Quad) => {
    setDetectedQuad(quad);
    
    // In a real implementation, we would process the image with the quad here
    // using Dynamsoft Document Normalizer
    // For now, we'll just use the original image
    setNormalizedImage(capturedImage);
    
    setMode('result');
  }, [capturedImage]);
  
  // Handler for result confirm
  const handleResultConfirm = useCallback((processedImageUrl: string) => {
    if (capturedImage) {
      const newDocument: ScannedDocument = {
        originalImage: capturedImage,
        processedImage: processedImageUrl
      };
      
      setScannedDocuments(prev => [...prev, newDocument]);
      setCapturedImage(null);
      setDetectedQuad(null);
      setNormalizedImage(null);
      setMode('setup');
    }
  }, [capturedImage]);
  
  // Handler for completing the scanning process
  const handleComplete = useCallback(() => {
    onComplete(scannedDocuments);
    setMode('complete');
  }, [scannedDocuments, onComplete]);
  
  // Render different UI based on the current mode
  if (mode === 'camera') {
    return (
      <ScannerCamera
        deviceId={selectedDeviceId}
        resolution={selectedResolution}
        onClose={() => setMode('setup')}
        onCapture={handleCapture}
      />
    );
  }
  
  if (mode === 'cropper' && capturedImage) {
    return (
      <ImageCropper
        imageUrl={capturedImage}
        initialQuad={detectedQuad || undefined}
        onConfirm={handleCropConfirm}
        onCancel={() => {
          setCapturedImage(null);
          setDetectedQuad(null);
          setMode('setup');
        }}
      />
    );
  }
  
  if (mode === 'result' && capturedImage) {
    return (
      <ResultViewer
        imageUrl={capturedImage}
        normalizedImageUrl={normalizedImage || undefined}
        onConfirm={handleResultConfirm}
        onCancel={() => {
          setNormalizedImage(null);
          setMode('cropper');
        }}
      />
    );
  }
  
  // Default setup mode UI
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <div className="mb-8">
        <div className="w-full aspect-video bg-slate-900 rounded-lg flex items-center justify-center mb-4">
          {scannedDocuments.length > 0 ? (
            // Display the most recently scanned document
            <img
              src={scannedDocuments[scannedDocuments.length - 1].processedImage}
              alt="Last scanned document"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="text-center">
              <Camera 
                className="h-16 w-16 mx-auto text-slate-700"
              />
              <p className="mt-4 text-slate-400">
                {isCameraAvailable 
                  ? 'Camera access is required for document scanning'
                  : 'Camera not available on this device. Please upload an image instead.'}
              </p>
              {isCameraAvailable && (
                <button 
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
                  onClick={startCamera}
                >
                  Enable Camera
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="col-span-2">
          <h2 className="text-xl font-medium mb-4">Camera Controls</h2>
          
          {!isCameraAvailable && (
            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 p-3 rounded-md mb-4 flex items-start">
              <AlertCircle className="shrink-0 h-5 w-5 mr-2 mt-0.5" />
              <p className="text-sm">
                Camera API is not supported in this browser or you're not on a secure (HTTPS) connection. 
                Please use the "Upload Image" option or try a different browser.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <CameraSelect 
              onSelect={handleDeviceSelect}
              selectedDeviceId={selectedDeviceId}
            />
            
            <ResolutionSelect
              selectedResolution={selectedResolution}
              onSelect={handleResolutionSelect}
            />
          </div>
          
          <div className="flex space-x-4">
            <button 
              className={`flex-1 py-3 ${isCameraAvailable 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'} 
                rounded-md transition-colors flex items-center justify-center`}
              onClick={startCamera}
              disabled={!isCameraAvailable}
            >
              <Camera className="h-6 w-6 mr-2" />
              Capture
            </button>
            
            <label className="flex-1 py-3 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors flex items-center justify-center cursor-pointer">
              <Upload className="h-6 w-6 mr-2" />
              Upload Image
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>
      </div>
      
      {/* Scanned documents section */}
      <div className="mb-6">
        <h2 className="text-xl font-medium mb-4">Scanned Pages ({scannedDocuments.length})</h2>
        
        {scannedDocuments.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-center py-8">
            No pages scanned yet. Capture a document to get started.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {scannedDocuments.map((doc, index) => (
              <div 
                key={index} 
                className="aspect-[3/4] bg-slate-100 dark:bg-slate-700 rounded overflow-hidden border border-slate-300 dark:border-slate-600"
              >
                <img 
                  src={doc.processedImage} 
                  alt={`Scanned document ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-end space-x-4">
        <button 
          className="py-2 px-4 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          onClick={() => {
            setScannedDocuments([]);
          }}
          disabled={scannedDocuments.length === 0}
        >
          Clear All
        </button>
        <button 
          className={`py-2 px-4 rounded-md ${
            scannedDocuments.length === 0 
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white transition-colors'
          }`}
          onClick={handleComplete}
          disabled={scannedDocuments.length === 0}
        >
          Create PDF
        </button>
      </div>
    </div>
  );
}
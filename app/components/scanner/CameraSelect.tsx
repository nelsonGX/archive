"use client"

import { useEffect, useState } from 'react';

interface CameraSelectProps {
  onSelect: (deviceId: string) => void;
  selectedDeviceId?: string;
}

export default function CameraSelect({ onSelect, selectedDeviceId }: CameraSelectProps) {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCameras() {
      try {
        // Check if mediaDevices is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Camera API not supported in this browser');
          setLoading(false);
          return;
        }

        // Check if we're in a secure context (https or localhost)
        if (!window.isSecureContext) {
          setError('Camera access requires a secure context (HTTPS)');
          setLoading(false);
          return;
        }

        // Request camera permission first
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        
        // Get all video devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameras(videoDevices);
        
        // Stop the temporary stream
        stream.getTracks().forEach(track => track.stop());
        
        // Select the first camera if none is selected
        if (videoDevices.length > 0 && !selectedDeviceId) {
          onSelect(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error('Error accessing camera devices:', error);
        setError('Unable to access camera. Please ensure you have granted camera permissions.');
      } finally {
        setLoading(false);
      }
    }

    loadCameras();
  }, [onSelect, selectedDeviceId]);

  if (error) {
    return (
      <div>
        <label htmlFor="camera-select" className="block text-sm font-medium mb-1">
          Camera Source
        </label>
        <div className="w-full py-2 px-3 border border-red-300 dark:border-red-700 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="camera-select" className="block text-sm font-medium mb-1">
        Camera Source
      </label>
      <select
        id="camera-select"
        value={selectedDeviceId}
        onChange={(e) => onSelect(e.target.value)}
        disabled={loading || cameras.length === 0}
        className="w-full py-2 px-3 border border-slate-300 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-900"
      >
        {loading ? (
          <option>Loading cameras...</option>
        ) : cameras.length === 0 ? (
          <option>No cameras found</option>
        ) : (
          cameras.map((camera) => (
            <option key={camera.deviceId} value={camera.deviceId}>
              {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
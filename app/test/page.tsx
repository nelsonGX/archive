// Make sure this is the VERY FIRST line of the file
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Script from 'next/script'; // Import next/script
import {
  Camera,
  X,
  Zap,
  ZapOff,
  RefreshCw,
  ScanSearch,
  Check,
  RotateCcw,
  Palette,
  Image as ImageIcon,
  Loader2,
  Upload,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

// --- Helper Functions (Simulated or from utils.js) ---
const intersectionOverUnion = (quad1, quad2) => {
  // Placeholder implementation for IOU calculation
  // console.log('Calculating IOU (placeholder)', quad1, quad2);
  return Math.random() * 0.1 + 0.92; // Simulate high overlap
};

// --- Constants ---
const PAGES = { HOME: 0, SCANNER: 1, CROPPER: 2, RESULT_VIEWER: 3 };
const RESOLUTIONS = [
  { label: '1280x720', value: '1280x720', width: 1280, height: 720 },
  { label: '1920x1080', value: '1920x1080', width: 1920, height: 1080 },
  { label: '3840x2160', value: '3840x2160', width: 3840, height: 2160 },
];
const FILTER_MODES = [
  { id: 'blackWhite', label: 'B&W', templateName: 'CT_DOCUMENT_BINARY', colorMode: 'ICM_BINARY' },
  { id: 'grayscale', label: 'Grayscale', templateName: 'CT_DOCUMENT_GRAYSCALE', colorMode: 'ICM_GRAYSCALE' },
  { id: 'color', label: 'Color', templateName: 'CT_DOCUMENT_COLOR', colorMode: 'ICM_COLOUR' },
];

// --- Main App Component (assuming this is your page content) ---
export default function DocumentScannerPage() { // Renamed to reflect it's a page
  // --- State Variables ---
  const [currentPage, setCurrentPage] = useState(PAGES.HOME);
  const [isLoading, setIsLoading] = useState(true); // Start loading until scripts are ready
  const [statusText, setStatusText] = useState('Loading libraries...'); // Initial status
  const [isScriptLoading, setIsScriptLoading] = useState(true); // Track script loading specifically
  const [scriptsLoaded, setScriptsLoaded] = useState({ ddn: false, cropper: false });
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [selectedResolution, setSelectedResolution] = useState(RESOLUTIONS[0].value);
  const [results, setResults] = useState([]);
  const [ddnInstance, setDdnInstance] = useState(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isAutoCaptureOn, setIsAutoCaptureOn] = useState(false);
  const [showFilterList, setShowFilterList] = useState(false);
  const [rotationDegree, setRotationDegree] = useState(0);
  const [capturedImageDataURL, setCapturedImageDataURL] = useState(null);
  const [normalizedImageDataURL, setNormalizedImageDataURL] = useState(null);
  const [filterThumbnails, setFilterThumbnails] = useState({});
  const [detectedQuad, setDetectedQuad] = useState(null);
  const [isTorchSupported, setIsTorchSupported] = useState(false);

  // --- Refs ---
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const hiddenFrameCanvasRef = useRef(null);
  const imageCaptureRef = useRef(null);
  const localStreamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const cropperRef = useRef(null);
  const fileInputRef = useRef(null);
  const isDetectingRef = useRef(false);
  const previousDetectionResultsRef = useRef([]);
  const handleCaptureRef = useRef(null); // Ref to hold the latest handleCapture function

  // --- Script Load Handlers ---
  const handleDdnLoad = () => {
    console.log('Dynamsoft DDN Script loaded.');
    setScriptsLoaded(prev => ({ ...prev, ddn: true }));
  };

  const handleCropperLoad = () => {
    console.log('Image Cropper Loader Script loaded - but we are using our own implementation instead.');
    // We're not using this handler anymore as we've removed the script tag
    // The component is defined in the useEffect hook above

    /* Skip attempting to use the loaded script
    try {
      // Try to manually define the custom element using window-level access
      // This approach doesn't rely on importing the module directly
      if (typeof window !== 'undefined') {
        // Give a short delay to ensure the script is fully executed
        setTimeout(() => {
          // Check if the component was auto-registered by the script
          if (customElements.get('image-cropper')) {
            console.log('image-cropper was auto-registered by the script.');
          } else {
            console.warn('image-cropper not found in customElements registry after script load.');

            // Add a custom registration fallback that mimics basic component behavior
            try {
              // This is a last resort fallback if the component fails to register
              if (!customElements.get('image-cropper')) {
                console.log('Attempting to create a fallback image-cropper element');

                // Create a very basic custom element as fallback
                class FallbackImageCropper extends HTMLElement {
                  constructor() {
                    super();
                    this._img = null;
                    this._quad = null;
                    this.attachShadow({ mode: 'open' });
                    this.shadowRoot.innerHTML = `
                      <style>
                        :host { display: block; width: 100%; height: 100%; position: relative; }
                        .container { width: 100%; height: 100%; background: #222; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                        img { max-width: 100%; max-height: 80%; object-fit: contain; }
                        .controls { margin-top: 1rem; display: flex; gap: 0.5rem; }
                        button { padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer; }
                        .confirm { background: #4a8; color: white; }
                        .cancel { background: #888; color: white; }
                      </style>
                      <div class="container">
                        <img id="preview" />
                        <div class="controls">
                          <button class="confirm">Confirm</button>
                          <button class="cancel">Cancel</button>
                        </div>
                      </div>
                    `;

                    // Add event listeners
                    this.shadowRoot.querySelector('.confirm').addEventListener('click',
                      () => this.dispatchEvent(new CustomEvent('confirmed')));
                    this.shadowRoot.querySelector('.cancel').addEventListener('click',
                      () => this.dispatchEvent(new CustomEvent('canceled')));
                  }

                  // Simple getters/setters to mimic the original component
                  set img(val) {
                    this._img = val;
                    const imgEl = this.shadowRoot.querySelector('#preview');
                    if (imgEl && val && val.src) imgEl.src = val.src;
                  }

                  get img() { return this._img; }

                  set quad(val) { this._quad = val; }
                  get quad() { return this._quad; }

                  // Method to return the quad for the confirmed event handler
                  async getQuad() {
                    return this._quad;
                  }

                  // Reset method
                  reset() {
                    this._img = null;
                    this._quad = null;
                    const imgEl = this.shadowRoot.querySelector('#preview');
                    if (imgEl) imgEl.src = '';
                  }
                }

                customElements.define('image-cropper', FallbackImageCropper);
                console.log('Fallback image-cropper element defined successfully');
              }
            } catch (fallbackError) {
              console.error('Error creating fallback component:', fallbackError);
            }
          }

          // Regardless of the outcome, mark as loaded to avoid blocking the app
          setScriptsLoaded(prev => ({ ...prev, cropper: true }));
        }, 300);
      }
    } catch (error) {
      console.error('Error in cropper initialization:', error);
      setStatusText('Error initializing cropper component.');
      setScriptsLoaded(prev => ({ ...prev, cropper: true }));
    }
    */
  };

  const handleScriptError = (scriptName) => (e) => {
    console.error(`Error loading ${scriptName} Script:`, e);
    setStatusText(`Failed to load ${scriptName}. Please refresh.`);
    setIsScriptLoading(false); // Stop script loading phase on error
    setIsLoading(false); // Also stop overall loading
  };


  // Register our own custom image-cropper element
  useEffect(() => {
    if (typeof window !== 'undefined' && !customElements.get('image-cropper')) {
      try {
        console.log('Defining custom image-cropper element');

        // Also mark the cropper as loaded since we're defining it ourselves
        // This needs to happen BEFORE we define the component to avoid waiting forever
        setScriptsLoaded(prev => ({ ...prev, cropper: true }));

        class ImageCropper extends HTMLElement {
          constructor() {
            super();
            this._img = null;
            this._quad = null;
            this._isDragging = false;
            this._activeCorner = -1;
            this._scale = 1;

            this.attachShadow({ mode: 'open' });
            this.shadowRoot.innerHTML = `
              <style>
                :host { display: block; width: 100%; height: 100%; position: relative; }
                .container {
                  width: 100%;
                  height: 100%;
                  background: #222;
                  color: white;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  overflow: hidden;
                  position: relative;
                }
                img {
                  max-width: 100%;
                  max-height: calc(100% - 60px);
                  object-fit: contain;
                }
                .controls {
                  position: absolute;
                  bottom: 0;
                  left: 0;
                  right: 0;
                  padding: 1rem;
                  display: flex;
                  justify-content: space-between;
                  background: rgba(0,0,0,0.5);
                }
                button {
                  padding: 0.5rem 1rem;
                  border: none;
                  border-radius: 0.25rem;
                  cursor: pointer;
                  font-weight: bold;
                }
                .confirm { background: #4CAF50; color: white; }
                .cancel { background: #f44336; color: white; }
                .overlay {
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                  pointer-events: none;
                }
                .polygon {
                  fill: rgba(0, 255, 0, 0.2);
                  stroke: #4CAF50;
                  stroke-width: 2px;
                }
                .handle {
                  fill: white;
                  stroke: #4CAF50;
                  stroke-width: 2px;
                  cursor: move;
                  pointer-events: all;
                }
              </style>
              <div class="container">
                <img id="preview" />
                <svg class="overlay"></svg>
                <div class="controls">
                  <button class="cancel">Cancel</button>
                  <button class="confirm">Confirm</button>
                </div>
              </div>
            `;

            // Add event listeners for the buttons
            this.shadowRoot.querySelector('.confirm').addEventListener('click',
              () => this.dispatchEvent(new CustomEvent('confirmed')));
            this.shadowRoot.querySelector('.cancel').addEventListener('click',
              () => this.dispatchEvent(new CustomEvent('canceled')));

            // Get references to elements
            this.imgElement = this.shadowRoot.querySelector('#preview');
            this.svgOverlay = this.shadowRoot.querySelector('.overlay');

            // Bind methods
            this.updateQuadDisplay = this.updateQuadDisplay.bind(this);
            this.handleCornerDragStart = this.handleCornerDragStart.bind(this);
            this.handleCornerDragMove = this.handleCornerDragMove.bind(this);
            this.handleCornerDragEnd = this.handleCornerDragEnd.bind(this);

            // Add drag event listeners
            this.svgOverlay.addEventListener('pointerdown', this.handleCornerDragStart);
            document.addEventListener('pointermove', this.handleCornerDragMove);
            document.addEventListener('pointerup', this.handleCornerDragEnd);
            document.addEventListener('pointercancel', this.handleCornerDragEnd);
          }

          connectedCallback() {
            // Called when the element is added to the DOM
            if (this._img) {
              this.updateImage();
            }
          }

          disconnectedCallback() {
            // Remove event listeners when element is removed
            document.removeEventListener('pointermove', this.handleCornerDragMove);
            document.removeEventListener('pointerup', this.handleCornerDragEnd);
            document.removeEventListener('pointercancel', this.handleCornerDragEnd);
          }

          // Handle image updates
          set img(val) {
            if (!val) return;

            this._img = val;
            this.updateImage();
          }

          get img() {
            return this._img;
          }

          // Handle quad updates
          set quad(val) {
            if (!val) return;

            this._quad = val;
            this.updateQuadDisplay();
          }

          get quad() {
            return this._quad;
          }

          // Method to return the quad for the confirmed event handler
          async getQuad() {
            return this._quad;
          }

          // Reset method
          reset() {
            this._img = null;
            this._quad = null;
            if (this.imgElement) this.imgElement.src = '';
            this.clearOverlay();
          }

          // Update the image on the screen
          updateImage() {
            if (!this.imgElement || !this._img) return;

            // Set image source
            if (this._img.src) {
              this.imgElement.src = this._img.src;

              // After image loads, initialize or update the quad
              this.imgElement.onload = () => {
                // If no quad is set, create a default one
                if (!this._quad) {
                  const width = this.imgElement.naturalWidth;
                  const height = this.imgElement.naturalHeight;

                  // Create a default quad with margins
                  const margin = 0.1; // 10% margin
                  const marginX = width * margin;
                  const marginY = height * margin;

                  this._quad = {
                    points: [
                      { x: marginX, y: marginY },
                      { x: width - marginX, y: marginY },
                      { x: width - marginX, y: height - marginY },
                      { x: marginX, y: height - marginY }
                    ]
                  };
                }

                // Set up the SVG overlay dimensions
                this.svgOverlay.setAttribute('viewBox', `0 0 ${this.imgElement.naturalWidth} ${this.imgElement.naturalHeight}`);
                this.svgOverlay.style.width = `${this.imgElement.offsetWidth}px`;
                this.svgOverlay.style.height = `${this.imgElement.offsetHeight}px`;

                // Calculate scale for converting between natural image size and display size
                this._scale = this.imgElement.offsetWidth / this.imgElement.naturalWidth;

                // Update the quad display
                this.updateQuadDisplay();
              };
            }
          }

          // Update the quad display on the overlay
          updateQuadDisplay() {
            if (!this.svgOverlay || !this._quad || !this._quad.points) return;

            // Clear the overlay
            this.clearOverlay();

            // Create polygon for the quad
            const points = this._quad.points;
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');

            const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');
            polygon.setAttribute('points', pointsString);
            polygon.setAttribute('class', 'polygon');

            this.svgOverlay.appendChild(polygon);

            // Add corner handles
            points.forEach((point, index) => {
              const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
              handle.setAttribute('cx', point.x);
              handle.setAttribute('cy', point.y);
              handle.setAttribute('r', '10');
              handle.setAttribute('class', 'handle');
              handle.setAttribute('data-index', index);

              this.svgOverlay.appendChild(handle);
            });
          }

          // Clear the overlay
          clearOverlay() {
            while (this.svgOverlay.firstChild) {
              this.svgOverlay.removeChild(this.svgOverlay.firstChild);
            }
          }

          // Handle drag operations on the corners
          handleCornerDragStart(event) {
            const target = event.target;

            // Check if we're clicking on a handle
            if (target.classList.contains('handle')) {
              this._isDragging = true;
              this._activeCorner = parseInt(target.getAttribute('data-index'));

              // Prevent default to avoid selection
              event.preventDefault();
            }
          }

          handleCornerDragMove(event) {
            if (!this._isDragging || this._activeCorner === -1) return;

            // Calculate position in SVG coordinates
            const rect = this.svgOverlay.getBoundingClientRect();
            const x = (event.clientX - rect.left) / this._scale;
            const y = (event.clientY - rect.top) / this._scale;

            // Update the quad point
            if (this._quad && this._quad.points && this._quad.points[this._activeCorner]) {
              this._quad.points[this._activeCorner].x = Math.max(0, Math.min(this.imgElement.naturalWidth, x));
              this._quad.points[this._activeCorner].y = Math.max(0, Math.min(this.imgElement.naturalHeight, y));

              // Update the display
              this.updateQuadDisplay();
            }

            event.preventDefault();
          }

          handleCornerDragEnd(event) {
            this._isDragging = false;
            this._activeCorner = -1;
          }
        }

        // Register the custom element
        customElements.define('image-cropper', ImageCropper);
        console.log('Custom image-cropper element registered successfully');

      } catch (error) {
        console.error('Error defining custom image-cropper element:', error);
        // Still mark as loaded even if there's an error to avoid blocking the app
        setScriptsLoaded(prev => ({ ...prev, cropper: true }));
      }
    } else if (customElements.get('image-cropper')) {
      console.log('image-cropper already defined in the registry');
      // Mark as loaded if the component is already defined
      setScriptsLoaded(prev => ({ ...prev, cropper: true }));
    }
  }, []); // Run once on component mount

  // --- Initialization Effect (Depends on Scripts Loaded) ---
  useEffect(() => {
    // Only proceed if both scripts are marked as loaded
    if (!scriptsLoaded.ddn || !scriptsLoaded.cropper) {
      console.log("Waiting for scripts to load...");
      return; // Exit if scripts aren't ready
    }

    // Scripts are loaded, now initialize DDN and cameras
    setIsScriptLoading(false); // Mark script loading as complete
    setStatusText('Initializing scanner...'); // Update status

    // Check if image-cropper component is defined
    if (!customElements.get('image-cropper')) {
      console.warn('image-cropper custom element is still not defined at initialization time.');
      // We'll still proceed with initialization - our component should be defined by the earlier useEffect
    } else {
      console.log('image-cropper custom element is ready at initialization time.');
    }

    const initialize = async () => {
      try {
        // Clear the initializing status message to avoid UI getting stuck
        setStatusText('');

        // 1. Initialize Dynamsoft Document Normalizer (DDN)
        // Check if Dynamsoft is now available on window
        if (window.Dynamsoft && window.Dynamsoft.DDN) {
          window.Dynamsoft.DDN.DocumentNormalizer.license = "DLS2eyJoYW5kc2hha2VDb2RlIjoiMjM0ODEwLTE2NTMzNTY5NzQ0ODMiLCJvcmdhbml6YXRpb25JRCI6IjIzNDgxMCJ9"; // Replace with your license
          const ddn = await window.Dynamsoft.DDN.DocumentNormalizer.createInstance();
          ddn.maxCvsSideLength = 9999;
          setDdnInstance(ddn);
          console.log('DDN Initialized');
        } else {
          // This should ideally not happen if script loaded correctly, but check anyway
          console.warn('Dynamsoft DDN library not available after script load. Some features may not work.');
          // Don't throw error to allow app to continue
        }

        // 2. Load Camera Devices (request permission first)
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            try {
                const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                tempStream.getTracks().forEach(track => track.stop());
            } catch (permError) {
                 console.error("Camera permission denied or error:", permError);
                 setStatusText("Camera permission denied. Please allow camera access.");
                 setIsLoading(false);
                 return;
            }

            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setCameraDevices(videoDevices);
            if (videoDevices.length > 0) {
                setSelectedDeviceId(videoDevices[0].deviceId);
            } else {
                 setStatusText("No camera devices found.");
            }
            console.log('Camera devices loaded:', videoDevices);
        } else {
          console.warn('Camera enumeration not supported.');
          setStatusText("Camera access not supported by this browser.");
        }

        // 3. Check if image-cropper web component is defined
        if (!customElements.get('image-cropper')) {
           console.warn('image-cropper component still not defined after script load.');
           // It might have failed silently during script load
           setStatusText('Cropper component failed to initialize.');
        } else {
            console.log('image-cropper component confirmed as defined.');
        }

      } catch (error) {
        console.error("Initialization failed:", error);
        setStatusText(`Initialization failed: ${error.message}`);
      } finally {
          // Always mark initialization as complete regardless of outcome
          setIsLoading(false);

          // Always clear status text to prevent UI from appearing stuck
          setStatusText('');

          console.log('Initialization completed, UI should be interactive now');
      }
    };

    initialize(); // Run the initialization logic

    // Cleanup function for the initialization effect
    return () => {
      stopCamera(); // Includes stopping detection interval
      // Optional: Destroy DDN instance if applicable
      // if (ddnInstance && ddnInstance.destroy) {
      //   ddnInstance.destroy();
      // }
    };
  // Rerun this effect if the loaded status of scripts changes
  }, [scriptsLoaded.ddn, scriptsLoaded.cropper]);


  // --- Cropper Event Listener Effect ---
  useEffect(() => {
    const cropperElement = cropperRef.current;

    // Ensure the cropper element exists and we are on the correct page
    if (!cropperElement || currentPage !== PAGES.CROPPER) {
        return;
    }

    const handleConfirmed = async () => {
        console.log("Crop confirmed");
        setStatusText("Normalizing...");
        try {
            const quad = await cropperElement.getQuad();
            if (!quad) {
                throw new Error("Failed to get quad from cropper.");
            }
            const confirmedQuad = { location: quad };
            setDetectedQuad(confirmedQuad); // Store the user-confirmed quad

            // Generate normalized image and filter thumbnails
            await generateNormalizedAndFilterImages(capturedImageDataURL, confirmedQuad);

            // Directly set the page after async operation completes
            // The normalizedImageDataURL state will be updated by generateNormalizedAndFilterImages
            setCurrentPage(PAGES.RESULT_VIEWER);
            setStatusText(''); // Clear status after processing

        } catch (error) {
            console.error("Error during normalization:", error);
            setStatusText(`Normalization failed: ${error.message}`);
            // Optionally go back or show error state
            // setCurrentPage(PAGES.SCANNER); // Example: Go back to scanner on error
        }
    };

    const handleCanceled = () => {
        console.log("Crop canceled");
        setCurrentPage(PAGES.SCANNER);
        // Restart camera only if returning to scanner page
        // Use a small delay to allow state update and UI transition
        setTimeout(() => startCamera(), 50);
    };

    // Add event listeners
    cropperElement.addEventListener("confirmed", handleConfirmed);
    cropperElement.addEventListener("canceled", handleCanceled);
    console.log("Cropper event listeners attached.");

    // Cleanup listeners when the component unmounts or the cropper element changes
    return () => {
        if (cropperElement) {
            cropperElement.removeEventListener("confirmed", handleConfirmed);
            cropperElement.removeEventListener("canceled", handleCanceled);
            console.log("Cropper event listeners removed.");
        }
    };
    // Dependencies: Re-attach listeners if the page changes to Cropper or if the image changes
  }, [currentPage, capturedImageDataURL, ddnInstance]); // Added ddnInstance as generateNormalized depends on it

  // --- Camera Handling ---
  const startCamera = useCallback(async () => {
    // Continue even if DDN is not fully initialized - we'll just have a camera without quad detection
    if (isLoading || isScriptLoading) {
        console.log("Camera starting while scanner is still loading - some features may not work.");
        setStatusText("Starting camera (limited functionality)...");
    }
    // If no DDN instance, we'll just show camera without document detection
    if (!ddnInstance) {
        console.log("Starting camera without DDN instance - document detection disabled.");
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatusText('Camera not supported by this browser.');
      return;
    }
    stopCamera(); // Ensure previous stream is stopped
    setStatusText('Starting camera...');

    const resolution = RESOLUTIONS.find(r => r.value === selectedResolution);
    const constraints = {
      audio: false,
      video: {
        deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
        width: { ideal: resolution?.width || 1280 },
        height: { ideal: resolution?.height || 720 },
        facingMode: { ideal: "environment" } // Prefer back camera
      }
    };

    console.log('Camera constraints:', constraints);

    try {
      // Create a more robust video initialization process
      const startVideoStream = async () => {
        try {
          console.log("Requesting camera access...");
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          localStreamRef.current = stream;

          // Make sure tracks are enabled
          stream.getVideoTracks().forEach(track => {
            track.enabled = true;
            console.log(`Camera track enabled, readyState: ${track.readyState}`);
          });

          // Clear video element to reset it completely
          if (videoRef.current) {
            videoRef.current.onloadeddata = null;
            videoRef.current.onloadedmetadata = null;
            videoRef.current.oncanplay = null;
            videoRef.current.onerror = null;
            videoRef.current.srcObject = null;
            videoRef.current.muted = true;
            videoRef.current.load(); // Reset the video element
          }

          // Small delay to ensure reset took effect
          await new Promise(resolve => setTimeout(resolve, 150));

          // Set up new stream with proper event handling
          if (videoRef.current) {
            console.log("Setting video source with fresh stream");

            // Add event handler for errors
            videoRef.current.onerror = (e) => {
              console.error("Video element error:", e);
            };

            // Force aggressive styling to ensure visibility
            videoRef.current.style.cssText = `
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
              opacity: 1 !important;
              display: block !important;
              transform: translateZ(0);
              z-index: 1;
              background-color: #004400;
            `;

            // Apply the stream
            videoRef.current.srcObject = stream;

            // Set up a promise to monitor video readiness
            const videoReadyPromise = new Promise((resolve, reject) => {
              const timeoutId = setTimeout(() => {
                reject(new Error("Video element timed out while waiting to load"));
              }, 5000); // 5 second timeout

              const handleReady = () => {
                clearTimeout(timeoutId);
                resolve();
              };

              // Set up multiple event handlers to catch whichever fires
              videoRef.current.onloadeddata = handleReady;
              videoRef.current.onloadedmetadata = handleReady;
              videoRef.current.oncanplay = handleReady;

              // If video is already ready, resolve immediately
              if (videoRef.current.readyState >= 2) {
                handleReady();
              }
            });

            try {
              // Start playing the video
              videoRef.current.play().catch(e => {
                console.warn("Initial play attempt failed:", e);
              });

              // Wait for video to be ready (or timeout)
              await videoReadyPromise;
              console.log("Video is ready for display and capture");

              // Call handleVideoLoaded directly instead of relying solely on event
              handleVideoLoaded();
            } catch (videoError) {
              console.error("Error waiting for video to be ready:", videoError);
              // Still call handleVideoLoaded to try to set up what we can
              handleVideoLoaded();
            }
          }

          // Set up ImageCapture if available
          const track = stream.getVideoTracks()[0];
          if (track) {
            const capabilities = track.getCapabilities ? track.getCapabilities() : null;
            const hasTorch = !!(capabilities && capabilities.torch);
            setIsTorchSupported(hasTorch);
            setIsFlashOn(false);
            console.log("Torch supported:", hasTorch);

            if ('ImageCapture' in window) {
              try {
                imageCaptureRef.current = new ImageCapture(track);
                console.log('ImageCapture initialized');
              } catch (icError) {
                console.warn('ImageCapture initialization failed:', icError);
                imageCaptureRef.current = null;
              }
            } else {
              console.log('ImageCapture API not supported.');
              imageCaptureRef.current = null;
            }
          }
        } catch (streamError) {
          console.error('Error getting camera stream:', streamError);
          throw streamError;
        }
      };

      // Start the stream with retries
      let retries = 0;
      const maxRetries = 2;

      while (retries <= maxRetries) {
        try {
          await startVideoStream();
          setStatusText(''); // Clear status on success
          console.log("Camera started successfully");
          return; // Success - exit the retry loop
        } catch (err) {
          retries++;
          console.error(`Camera start attempt ${retries} failed:`, err);

          if (retries <= maxRetries) {
            // Wait before retrying
            setStatusText(`Retrying camera... (${retries}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            setStatusText(`Failed to access camera: ${err.message}`);
            stopCamera();
          }
        }
      }
    } catch (err) {
      console.error('getUserMedia Error:', err);
      setStatusText(`Failed to access camera: ${err.name}`);
      stopCamera();
    }
  }, [selectedDeviceId, selectedResolution, ddnInstance, isLoading, isScriptLoading]); // Updated dependencies

  const stopCamera = useCallback(() => {
    stopDetectionInterval();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      console.log('Camera stream stopped.');
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    imageCaptureRef.current = null;
    setIsFlashOn(false);
    setDetectedQuad(null);
  }, []); // Removed stopDetectionInterval from deps as it's stable

  const handleVideoLoaded = () => {
    console.log("Video metadata loaded or loadeddata event fired");

    // Ensure we have the video element
    if (!videoRef.current) {
      console.warn("Video reference is missing in handleVideoLoaded");
      return;
    }

    // Ensure we have the overlay
    if (!overlayRef.current) {
      console.warn("Overlay reference is missing in handleVideoLoaded");
      // We can still try to show video without overlay
    }

    const video = videoRef.current;

    // Check if video tracks are actually active
    const videoTracks = video.srcObject?.getVideoTracks?.() || [];
    if (videoTracks.length === 0) {
      console.warn("No video tracks found in stream");
    } else {
      console.log(`Video track active: ${videoTracks[0].enabled}, readyState: ${videoTracks[0].readyState}`);

      // Try to ensure track is enabled
      videoTracks.forEach(track => {
        if (!track.enabled) {
          console.log("Enabling video track that was disabled");
          track.enabled = true;
        }
      });
    }

    // Try to play the video if it's not already playing
    if (video.paused) {
      console.log("Attempting to play video that was paused");
      video.play().catch(err => console.error("Error playing video:", err));
    }

    // Get the dimensions and log them
    const { videoWidth, videoHeight } = video;
    console.log(`Video dimensions: ${videoWidth}x${videoHeight}`);

    // Check if dimensions are valid
    if (videoWidth === 0 || videoHeight === 0) {
      console.warn("Invalid video dimensions, waiting for proper dimensions...");
      // Try again in a moment to allow video to fully load
      setTimeout(handleVideoLoaded, 500);
      return;
    }

    // Force video to be visible with more aggressive styling
    video.style.cssText = `
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      opacity: 1 !important;
      display: block !important;
      transform: translateZ(0);
      z-index: 1;
    `;

    // Set a debug poster if video isn't showing
    if (hiddenCanvasRef.current) {
      const debugCanvas = hiddenCanvasRef.current;
      debugCanvas.width = 100;
      debugCanvas.height = 100;
      const ctx = debugCanvas.getContext('2d');

      // Draw a pattern to the debug canvas
      ctx.fillStyle = 'blue';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = 'red';
      ctx.fillRect(20, 20, 60, 60);

      // Try to display this pattern on the video element's poster
      try {
        const dataUrl = debugCanvas.toDataURL('image/png');
        video.poster = dataUrl;
        console.log("Set debug pattern as poster");
      } catch (e) {
        console.error("Failed to set debug poster:", e);
      }
    }

    // Set up the overlay if available
    if (overlayRef.current) {
      overlayRef.current.setAttribute("viewBox", `0 0 ${videoWidth} ${videoHeight}`);
      console.log(`Overlay viewBox set to: 0 0 ${videoWidth} ${videoHeight}`);
    }

    // Only start detection if we have DDN instance
    if (ddnInstance) {
      startDetectionInterval();
    } else {
      console.log("Camera ready but DDN not available - document detection disabled");
    }

    console.log("Video should now be visible");
  };

  const switchCamera = () => {
    if (cameraDevices.length > 1) {
      const currentIndex = cameraDevices.findIndex(device => device.deviceId === selectedDeviceId);
      const nextIndex = (currentIndex + 1) % cameraDevices.length;
      setSelectedDeviceId(cameraDevices[nextIndex].deviceId);
       setTimeout(startCamera, 50); // Restart camera after state update
    }
  };

  // --- Flash/Torch Control ---
   const toggleFlash = useCallback(async () => {
    if (!localStreamRef.current || !isTorchSupported) return;
    const track = localStreamRef.current.getVideoTracks()[0];
    const nextFlashState = !isFlashOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: nextFlashState }] });
      setIsFlashOn(nextFlashState);
      console.log(`Flash toggled: ${nextFlashState ? 'ON' : 'OFF'}`);
    } catch (err) {
      console.error('Failed to toggle flash:', err);
      setStatusText('Failed to control flash.');
    }
  }, [isFlashOn, isTorchSupported]);

  // --- Image Loading ---
  const handleLoadImageClick = () => {
    fileInputRef.current?.click();
  };

  const loadImageFromFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !ddnInstance) return;

    setStatusText('Loading image...');
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageDataUrl = e.target?.result;
      if (typeof imageDataUrl !== 'string') {
          setStatusText('Failed to read image file.');
          return;
      }
      setCapturedImageDataURL(imageDataUrl);
      resetCropperAndResults();

      if (cropperRef.current) {
          const img = new Image();
          img.onload = async () => {
              // Ensure cropper element is available and ready
              if (!customElements.get('image-cropper')) {
                   setStatusText('Cropper component not ready.');
                   return;
              }
               // Wait a tick for the component to potentially render/update
               await new Promise(resolve => setTimeout(resolve, 0));

              try {
                // Set image source for the web component
                cropperRef.current.img = img;
                console.log('Image set on cropper component.');

                setStatusText('Detecting document...');
                const quads = await ddnInstance.detectQuad(img);
                console.log('Detected quads in loaded image:', quads);
                let initialQuad;
                if (quads.length > 0) {
                    initialQuad = quads[0].location;
                } else {
                    const marginX = img.width * 0.1;
                    const marginY = img.height * 0.1;
                    initialQuad = { points: [
                        { x: marginX, y: marginY }, { x: img.width - marginX, y: marginY },
                        { x: img.width - marginX, y: img.height - marginY }, { x: marginX, y: img.height - marginY },
                    ]};
                    console.log('No quad detected, using default:', initialQuad);
                }
                setDetectedQuad({ location: initialQuad });

                // Set initial quad for the cropper web component
                cropperRef.current.quad = initialQuad;
                console.log('Initial quad set on cropper component.');

                setCurrentPage(PAGES.CROPPER);
                setStatusText('');

              } catch (cropperError) {
                  console.error('Error setting image or quad on cropper:', cropperError);
                  setStatusText(`Error initializing cropper: ${cropperError.message}`);
              }
          };
          img.onerror = () => setStatusText('Failed to load image data.');
          img.src = imageDataUrl;
      } else {
           setStatusText('Cropper component reference not available.');
      }
    };
    reader.onerror = () => setStatusText('Failed to read file.');
    reader.readAsDataURL(file);
    if (event.target) event.target.value = ''; // Reset file input
  };

  // --- Document Detection ---
  const drawOverlay = useCallback((quad) => {
    const svg = overlayRef.current;
    if (!svg || !quad?.location?.points) return;
    const points = quad.location.points;
    const pointsData = points.map(p => `${p.x},${p.y}`).join(' ');
    let polygon = svg.querySelector('polygon');
    if (!polygon) {
      polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      // Apply Tailwind classes via className attribute for SVG elements
      polygon.setAttribute("class", "detectedPolygon stroke-green-500 stroke-2 fill-lime-400 opacity-40");
      svg.appendChild(polygon);
    }
    polygon.setAttribute("points", pointsData);
  }, []);

  const clearOverlay = useCallback(() => {
    const svg = overlayRef.current;
    if (svg) {
      const polygon = svg.querySelector('polygon');
      if (polygon) svg.removeChild(polygon);
    }
  }, []);

  // Define handleCapture using useCallback and store its latest version in a ref
  // This allows detectDocument to always call the *latest* version without needing handleCapture in its own dependency array.
  const handleCapture = useCallback(async () => {
      console.log("⏺️ Capture initiated");
      stopDetectionInterval();
      setStatusText("Capturing...");
      let imageDataUrl = null;
      let captureMethod = "unknown"; // Track which method succeeded

      try {
          // Log video element state for debugging
          if (videoRef.current) {
              console.log(`Video state - readyState: ${videoRef.current.readyState}, paused: ${videoRef.current.paused}, muted: ${videoRef.current.muted}, width: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
          } else {
              console.warn("Video reference is missing at capture time");
          }

          // First try ImageCapture API if available
          if (imageCaptureRef.current) {
              try {
                  console.log("Attempting to use ImageCapture API");
                  imageDataUrl = await takePhotoWithImageCapture();

                  if (imageDataUrl) {
                      console.log("✅ ImageCapture API succeeded");
                      captureMethod = "ImageCapture";
                  }
              } catch (icError) {
                  console.warn("ImageCapture failed, falling back to canvas capture.", icError);
              }
          }

          // If ImageCapture failed or wasn't available, try canvas capture
          if (!imageDataUrl) {
              console.log("Using canvas capture method");

              // Make sure we have a valid canvas reference
              if (!hiddenCanvasRef.current) {
                  console.warn("Hidden canvas reference is missing, creating one");
                  hiddenCanvasRef.current = document.createElement('canvas');
              }

              // Try to capture frame from video
              imageDataUrl = captureFrameToDataURL(hiddenCanvasRef.current);

              if (imageDataUrl) {
                  console.log("✅ Canvas capture succeeded");
                  captureMethod = "Canvas";
              }
          }

          // If we still don't have an image, try creating from screen snapshot
          if (!imageDataUrl) {
              console.warn("Standard capture methods failed, trying snapshot approach");

              try {
                  // Create a snapshot of the current screen area with the video
                  const video = videoRef.current;
                  if (video && document.body.contains(video)) {
                      const snapCanvas = document.createElement('canvas');
                      snapCanvas.width = video.offsetWidth || 640;
                      snapCanvas.height = video.offsetHeight || 480;
                      const snapCtx = snapCanvas.getContext('2d');

                      // Fill with debug color
                      snapCtx.fillStyle = 'green';
                      snapCtx.fillRect(0, 0, snapCanvas.width, snapCanvas.height);

                      // Add a message to the canvas
                      snapCtx.fillStyle = 'white';
                      snapCtx.font = '16px Arial';
                      snapCtx.fillText('Snapshot capture', 20, 30);
                      snapCtx.fillText(`Time: ${new Date().toLocaleTimeString()}`, 20, 50);

                      // Try HTML2Canvas-like approach to capture what's showing on screen
                      const videoRect = video.getBoundingClientRect();
                      snapCtx.drawImage(
                          video,
                          0, 0, video.videoWidth || videoRect.width, video.videoHeight || videoRect.height,
                          0, 0, snapCanvas.width, snapCanvas.height
                      );

                      imageDataUrl = snapCanvas.toDataURL('image/jpeg', 0.92);
                      console.log("✅ Snapshot capture succeeded");
                      captureMethod = "Snapshot";
                  }
              } catch (snapError) {
                  console.error("Snapshot capture failed:", snapError);
              }
          }

          // If all capture methods failed, create a test pattern
          if (!imageDataUrl) {
              console.warn("🚨 All capture methods failed, creating test pattern");
              imageDataUrl = createFallbackImagePattern("All capture methods failed");
              captureMethod = "TestPattern";
          }

          console.log(`Capture completed using method: ${captureMethod}`);

          // Check if cropper component is available
          const isCropperAvailable = customElements.get('image-cropper') && cropperRef.current;
          console.log(`Cropper component available: ${isCropperAvailable}`);

          // SIMPLIFIED MODE - Direct to results when cropper isn't available
          if (!isCropperAvailable) {
              console.warn("*** SIMPLIFIED MODE - skipping cropper ***");
              // Skip the normal flow and go right to results
              setCapturedImageDataURL(imageDataUrl);
              setNormalizedImageDataURL(imageDataUrl); // Use the same image
              stopCamera(); // Stop camera
              resetCropperAndResults();
              setCurrentPage(PAGES.RESULT_VIEWER);
              setStatusText('');
              return; // Return early to skip the normal flow
          }

          // Normal flow - continue with cropper
          setCapturedImageDataURL(imageDataUrl);
          console.log("Image captured, preparing for cropper.");

          resetCropperAndResults();
          stopCamera(); // Stop camera after successful capture

          // Load the captured image
          const img = new Image();

          img.onload = async () => {
              console.log(`Image loaded successfully: ${img.width}x${img.height}`);

              // Wait for the component to be available with more retries
              let cropperReady = false;
              for (let attempt = 0; attempt < 8; attempt++) {
                  // Check if cropper element is available and ready
                  if (!cropperRef.current || !customElements.get('image-cropper')) {
                      console.log(`Waiting for cropper component - attempt ${attempt+1}/8`);
                      await new Promise(resolve => setTimeout(resolve, 250));
                      continue;
                  }

                  // If we get here, the component is available
                  console.log('Cropper component is available, proceeding');
                  cropperReady = true;
                  break;
              }

              // Check again if component is available
              if (!cropperReady || !cropperRef.current || !customElements.get('image-cropper')) {
                  console.log('❌ Cropper not available after waiting, using simplified mode');

                  // Make this a success flow instead of an error
                  setStatusText('Using simplified mode (no cropper)');
                  await new Promise(resolve => setTimeout(resolve, 500));

                  // Skip the cropper and go directly to result viewer with the original image
                  setNormalizedImageDataURL(imageDataUrl);
                  setCurrentPage(PAGES.RESULT_VIEWER);
                  setStatusText('');
                  return;
              }

              // Wait a tick for the component to update
              await new Promise(resolve => setTimeout(resolve, 150));

              try {
                  // Try setting the image on the cropper with extra safety
                  console.log('Setting image on cropper component...');
                  if (cropperRef.current && typeof cropperRef.current.img !== 'undefined') {
                      cropperRef.current.img = img;
                      console.log('✅ Image set on cropper successfully');
                  } else {
                      throw new Error("Cropper component is missing img property");
                  }

                  // Set the initial quad
                  let initialQuad = detectedQuad?.location;
                  if (!initialQuad) {
                      // Create a default quad with margins
                      const marginX = img.width * 0.1;
                      const marginY = img.height * 0.1;
                      initialQuad = {
                          points: [
                              { x: marginX, y: marginY },
                              { x: img.width - marginX, y: marginY },
                              { x: img.width - marginX, y: img.height - marginY },
                              { x: marginX, y: img.height - marginY }
                          ]
                      };
                      console.log('Using default quad for cropper');
                  } else {
                      console.log('Using detected quad for cropper');
                  }

                  // Set the quad on the cropper component
                  if (cropperRef.current && typeof cropperRef.current.quad !== 'undefined') {
                      cropperRef.current.quad = initialQuad;
                      console.log('✅ Quad set on cropper successfully');
                  } else {
                      throw new Error("Cropper component is missing quad property");
                  }

                  // Show the cropper page
                  setCurrentPage(PAGES.CROPPER);
                  setStatusText('');
              } catch (cropperError) {
                  console.error('❌ Error setting up cropper:', cropperError);
                  setStatusText(`Cropper error, using simplified mode`);

                  // If cropper setup fails, use simplified mode as a fallback
                  setTimeout(() => {
                      setNormalizedImageDataURL(imageDataUrl);
                      setCurrentPage(PAGES.RESULT_VIEWER);
                      setStatusText('');
                  }, 1000);
              }
          };

          // Handle image load errors
          img.onerror = (err) => {
              console.error('Failed to load captured image:', err);
              setStatusText('Failed to load image, using simplified mode');

              // Use simplified mode if image fails to load
              setTimeout(() => {
                  setNormalizedImageDataURL(imageDataUrl);
                  setCurrentPage(PAGES.RESULT_VIEWER);
                  setStatusText('');
              }, 1000);
          };

          // Set the image source to trigger loading
          img.src = imageDataUrl;

      } catch (error) {
          console.error("❌ Capture process failed:", error);
          setStatusText(`Capture failed: ${error.message}`);

          // Create a fallback image with the error message
          const errorImage = createFallbackImagePattern(`Error: ${error.message}`);
          setCapturedImageDataURL(errorImage);
          setNormalizedImageDataURL(errorImage);

          // Show the result directly
          setCurrentPage(PAGES.RESULT_VIEWER);
          setTimeout(() => setStatusText(''), 1500);
      }
  // Include dependencies needed *within* handleCapture
  }, [stopCamera, detectedQuad]); // Updated dependencies

  // Update the ref whenever handleCapture changes
  useEffect(() => {
    handleCaptureRef.current = handleCapture;
  }, [handleCapture]);


  const detectDocument = useCallback(async () => {
    // Check if we can detect documents
    if (!videoRef.current || videoRef.current.readyState < 2 || isDetectingRef.current) {
        return;
    }

    // Skip document detection if DDN is not available
    if (!ddnInstance) {
        // We can still use the camera view without document detection
        console.log("Document detection skipped - DDN not available");
        return;
    }

    isDetectingRef.current = true;
    const videoElement = videoRef.current;
    const frameCanvas = hiddenFrameCanvasRef.current;
    if (!frameCanvas) {
        isDetectingRef.current = false;
        return; // Should not happen if refs are set up
    }
    const context = frameCanvas.getContext('2d', { willReadFrequently: true });

    const maxDim = 1080;
    let scale = 1;
    let frameWidth = videoElement.videoWidth;
    let frameHeight = videoElement.videoHeight;

    if (frameWidth > maxDim || frameHeight > maxDim) {
        scale = (frameWidth > frameHeight) ? maxDim / frameWidth : maxDim / frameHeight;
        frameWidth = Math.round(frameWidth * scale);
        frameHeight = Math.round(frameHeight * scale);
    }

    frameCanvas.width = frameWidth;
    frameCanvas.height = frameHeight;

    try {
        context.drawImage(videoElement, 0, 0, frameWidth, frameHeight);
        const quads = await ddnInstance.detectQuad(frameCanvas);

        if (quads.length > 0) {
            const originalQuadPoints = quads[0].location.points.map(p => ({ x: Math.round(p.x / scale), y: Math.round(p.y / scale) }));
            const originalQuad = { ...quads[0], location: { points: originalQuadPoints } };

            setDetectedQuad(originalQuad);
            drawOverlay(originalQuad);

            if (isAutoCaptureOn) {
                 const currentResults = previousDetectionResultsRef.current;
                 currentResults.push(originalQuad);

                 if (currentResults.length > 2) {
                     const iou1 = intersectionOverUnion(currentResults[currentResults.length - 3].location.points, currentResults[currentResults.length - 2].location.points);
                     const iou2 = intersectionOverUnion(currentResults[currentResults.length - 2].location.points, currentResults[currentResults.length - 1].location.points);
                     const iou3 = intersectionOverUnion(currentResults[currentResults.length - 3].location.points, currentResults[currentResults.length - 1].location.points);
                     const stabilityThreshold = 0.92;

                     if (iou1 > stabilityThreshold && iou2 > stabilityThreshold && iou3 > stabilityThreshold) {
                         console.log("Stable detection - Auto capturing...");
                         // Call the latest handleCapture via the ref
                         if (handleCaptureRef.current) {
                            await handleCaptureRef.current();
                         }
                         previousDetectionResultsRef.current = [];
                     } else {
                         previousDetectionResultsRef.current.shift();
                     }
                 }
            } else {
                 previousDetectionResultsRef.current = [];
            }
        } else {
            clearOverlay();
            setDetectedQuad(null);
            previousDetectionResultsRef.current = [];
        }
    } catch (error) {
        console.error("Error during detection:", error);
        clearOverlay(); setDetectedQuad(null); previousDetectionResultsRef.current = [];
    } finally {
        isDetectingRef.current = false;
    }
  // REMOVED handleCapture from dependencies, relies on handleCaptureRef.current now
  }, [ddnInstance, drawOverlay, clearOverlay, isAutoCaptureOn]);


  const startDetectionInterval = useCallback(() => {
    stopDetectionInterval();
    isDetectingRef.current = false;
    previousDetectionResultsRef.current = [];
    console.log('Starting detection interval');
    // Use a longer interval? 300ms might be too fast depending on device
    detectionIntervalRef.current = setInterval(detectDocument, 400);
  }, [detectDocument]); // Depends on detectDocument

  const stopDetectionInterval = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
      console.log('Stopped detection interval');
    }
    clearOverlay();
  }, [clearOverlay]);


  // --- Image Capture Helpers ---
  const captureFrameToDataURL = (canvasElement) => {
    if (!videoRef.current || !canvasElement) return null;

    console.log("Capturing frame from video to canvas");
    const video = videoRef.current;

    // Check video readiness
    const readyState = video.readyState;
    console.log(`Current video readyState: ${readyState}`);

    // Wait briefly if video isn't ready yet
    if (readyState < 2) {
      console.warn("Video not fully ready for capture, readyState:", readyState);

      // For readyState 0 (HAVE_NOTHING), we'll create a fallback pattern
      if (readyState === 0) {
        console.log("Video has no data, creating fallback pattern");
        return createFallbackImagePattern("Video not ready");
      }

      // For readyState 1 (HAVE_METADATA), we have dimensions but might not have pixels
      // We'll still try to capture but be prepared for errors
    }

    // Get available dimensions
    console.log(`Video dimensions for capture: ${video.videoWidth}x${video.videoHeight}`);

    // If video dimensions are missing, try to get them from the element size
    const width = video.videoWidth || video.clientWidth || 640;
    const height = video.videoHeight || video.clientHeight || 480;

    // Set up the canvas with proper dimensions
    canvasElement.width = width;
    canvasElement.height = height;

    // Get the drawing context and clear it
    const ctx = canvasElement.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, width, height);

    // Try to draw the video to the canvas
    try {
      // Fill with background color first to avoid transparency issues
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, height);

      // Add some debug info to the canvas
      const now = new Date();
      ctx.fillStyle = '#444';
      ctx.font = '12px Arial';
      ctx.fillText(`Capture time: ${now.toLocaleTimeString()}`, 10, height - 20);
      ctx.fillText(`ReadyState: ${video.readyState}`, 10, height - 8);

      // Draw the video frame
      ctx.drawImage(video, 0, 0, width, height);
      console.log("Successfully drew video to canvas");

      // Convert to data URL with high quality
      const dataUrl = canvasElement.toDataURL('image/jpeg', 0.95);
      console.log("Successfully created data URL from canvas");
      return dataUrl;
    } catch (error) {
      console.error("Error capturing frame:", error);

      // Create fallback pattern with error info
      return createFallbackImagePattern(`Capture failed: ${error.message}`);
    }
  };

  // Helper to create a patterned fallback image when capture fails
  const createFallbackImagePattern = (message) => {
    console.log(`Creating fallback image pattern with message: ${message}`);
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    // Create a gradient background
    const gradient = ctx.createLinearGradient(0, 0, 640, 480);
    gradient.addColorStop(0, '#775599');
    gradient.addColorStop(1, '#334477');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 640, 480);

    // Add a document-like shape
    ctx.fillStyle = 'white';
    ctx.fillRect(80, 60, 480, 360);

    // Add border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, 60, 480, 360);

    // Add message
    ctx.fillStyle = 'black';
    ctx.font = '18px Arial';
    ctx.fillText(message, 150, 200);

    // Add timestamp for debugging
    ctx.font = '14px Arial';
    ctx.fillText(`Time: ${new Date().toLocaleTimeString()}`, 150, 230);

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const takePhotoWithImageCapture = async () => {
      if (!imageCaptureRef.current) throw new Error("ImageCapture not available.");
      try {
          console.log("Taking photo with ImageCapture...");

          // First try with grabFrame instead of takePhoto as it's more reliable
          try {
              console.log("Attempting to use grabFrame() first...");
              const frame = await imageCaptureRef.current.grabFrame();

              // Convert to blob/URL using canvas
              const canvas = document.createElement('canvas');
              canvas.width = frame.width;
              canvas.height = frame.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(frame, 0, 0);

              // Return as data URL directly
              console.log("Successfully captured frame with grabFrame()");
              return canvas.toDataURL('image/jpeg', 0.95);
          } catch (grabError) {
              console.warn("grabFrame() failed, falling back to takePhoto():", grabError);
          }

          // If grabFrame fails, try takePhoto with options to improve reliability
          const photoSettings = {
              imageWidth: 1920,
              imageHeight: 1080,
              fillLightMode: "auto"
          };

          // Use try-catch for setOptions since it might fail
          try {
              await imageCaptureRef.current.setOptions(photoSettings);
          } catch (settingsError) {
              console.warn("Failed to set photo options:", settingsError);
          }

          const blob = await imageCaptureRef.current.takePhoto();
          console.log("Photo taken with takePhoto(), creating URL...");
          return URL.createObjectURL(blob);
      } catch (error) {
          console.error("All ImageCapture methods failed:", error);
          throw error;
      }
  };

  // --- Normalization and Filtering ---
  const updateDdnTemplate = async (colorMode) => {
      if (!ddnInstance) return;
      const template = JSON.stringify({
          "GlobalParameter": { "Name": "GP", "MaxTotalImageDimension": 0 },
          "ImageParameterArray": [{ "Name": "IP-1", "NormalizerParameterName": "NP-1", "BaseImageParameterName": "" }],
          "NormalizerParameterArray": [{ "Name": "NP-1", "ContentType": "CT_DOCUMENT", "ColourMode": colorMode }]
      });
      console.log(`Setting DDN template for mode: ${colorMode}`);
      try {
          await ddnInstance.setRuntimeSettings(template);
      } catch (error) {
          console.error(`Failed to set DDN template for ${colorMode}:`, error);
          throw error;
      }
  };

  const generateNormalizedAndFilterImages = useCallback(async (sourceImageUrl, quadToUse) => {
      if (!ddnInstance || !sourceImageUrl || !quadToUse?.location?.points) {
          console.error("Cannot normalize: Missing DDN instance, image URL, or valid quad.");
           setStatusText("Normalization pre-requisites missing.");
          return;
      }

      setStatusText("Processing filters...");
      console.log("Generating normalized images with quad:", quadToUse);
      const newThumbnails = {};
      let fullColorNormalizedUrl = null;

      try {
          const sourceImage = new Image();
          sourceImage.src = sourceImageUrl;
          await new Promise((resolve, reject) => { sourceImage.onload = resolve; sourceImage.onerror = reject; });

          const thumbCanvas = document.createElement('canvas'); // Use offscreen canvas for thumbs
          const thumbCtx = thumbCanvas.getContext('2d');
          const thumbMaxSize = 150;
          let thumbW = sourceImage.naturalWidth, thumbH = sourceImage.naturalHeight, thumbScale = 1;
          if (thumbW > thumbMaxSize || thumbH > thumbMaxSize) {
              thumbScale = (thumbW > thumbH) ? thumbMaxSize / thumbW : thumbMaxSize / thumbH;
              thumbW = Math.round(thumbW * thumbScale); thumbH = Math.round(thumbH * thumbScale);
          }
          thumbCanvas.width = thumbW; thumbCanvas.height = thumbH;
          thumbCtx.drawImage(sourceImage, 0, 0, thumbW, thumbH);

          const scaledQuadPoints = quadToUse.location.points.map(p => ({ x: p.x * thumbScale, y: p.y * thumbScale }));
          const scaledQuad = { location: { points: scaledQuadPoints } };

          for (const mode of FILTER_MODES) {
              console.log(`Normalizing thumb for ${mode.label}...`);
              await updateDdnTemplate(mode.colorMode);
              try {
                  // Use thumbnail canvas and scaled quad for previews
                  const thumbResult = await ddnInstance.normalize(thumbCanvas, scaledQuad);
                  newThumbnails[mode.id] = thumbResult?.image?.toDataURL() || null;
              } catch (thumbError) {
                   console.error(`Error normalizing ${mode.label} thumbnail:`, thumbError);
                   newThumbnails[mode.id] = null;
              }

              // Generate full-res color image only once
              if (mode.id === 'color' && !fullColorNormalizedUrl) {
                  console.log("Normalizing full resolution color image...");
                  // Ensure color mode is set (might have been changed by previous loop iteration)
                   await updateDdnTemplate('ICM_COLOUR');
                  try {
                      // Use original image and original quad for full result
                      const fullResult = await ddnInstance.normalize(sourceImage, quadToUse);
                      fullColorNormalizedUrl = fullResult?.image?.toDataURL() || null;
                      console.log(`Full resolution color generated: ${!!fullColorNormalizedUrl}`);
                  } catch (fullError) {
                      console.error("Error normalizing full resolution color image:", fullError);
                  }
              }
          }

          setFilterThumbnails(newThumbnails);
          // Set the main viewer image - prioritize full color, fallback to color thumb, then null
          setNormalizedImageDataURL(fullColorNormalizedUrl || newThumbnails.color || null);
          console.log("Filter processing complete.");

      } catch (error) {
          console.error("Error during filter image generation:", error);
          setStatusText(`Filter processing failed: ${error.message}`);
          setFilterThumbnails({}); setNormalizedImageDataURL(null);
      } finally {
          setStatusText('');
      }
  }, [ddnInstance]); // Dependency

  const handleFilterSelect = async (modeId) => {
      const selectedThumbnail = filterThumbnails[modeId];
      const mode = FILTER_MODES.find(m => m.id === modeId);

      if (!mode) return; // Should not happen

      // If color is selected, use the pre-generated full-res (or its thumb fallback)
      if (mode.id === 'color') {
           // Find the URL for the full color image (might be null if generation failed)
           const fullColorUrl = Object.entries(filterThumbnails).find(([key, _]) => key === 'color')?.[1];
           // Need to access the potentially already generated fullColorNormalizedUrl state or refetch it
           // For simplicity, let's assume fullColorNormalizedUrl holds the best version if available
           setNormalizedImageDataURL(normalizedImageDataURL || fullColorUrl || null); // Use existing state if possible
           console.log(`Selected color filter. Using pre-generated: ${!!(normalizedImageDataURL || fullColorUrl)}`);
           return;
      }

      // For non-color filters, regenerate the full-res image for that mode
      if (!ddnInstance || !capturedImageDataURL || !detectedQuad) {
          console.error("Cannot regenerate filtered image: Missing data.");
          setStatusText("Error applying filter.");
          return;
      }

      setStatusText(`Applying ${mode.label} filter...`);
      try {
          const sourceImage = new Image();
          sourceImage.src = capturedImageDataURL;
          await new Promise((resolve, reject) => { sourceImage.onload = resolve; sourceImage.onerror = reject; });

          await updateDdnTemplate(mode.colorMode);
          const result = await ddnInstance.normalize(sourceImage, detectedQuad); // Use original quad

          if (result && result.image) {
              setNormalizedImageDataURL(result.image.toDataURL());
              console.log(`Applied ${mode.label} filter successfully.`);
          } else {
              throw new Error(`Normalization failed for ${mode.label} filter.`);
          }
          setStatusText('');
      } catch (error) {
          console.error(`Error applying ${mode.label} filter:`, error);
          setStatusText(`Error applying filter: ${error.message}`);
          // Revert to the color version's thumbnail as a fallback
          setNormalizedImageDataURL(filterThumbnails.color || null);
      }
  };

  // --- Result Handling ---
  const handleRotate = () => {
    setRotationDegree(prev => (prev - 90) % 360);
  };

  const handleResultAccept = () => {
    if (!normalizedImageDataURL) return;

    const img = document.createElement('img');
    img.onload = () => {
        let finalImageDataURL = normalizedImageDataURL;
        if (rotationDegree !== 0) {
            const canvas = hiddenCanvasRef.current;
            if (!canvas) { console.error("Hidden canvas ref not found for rotation."); return; }
            const ctx = canvas.getContext('2d');
            const angleInRadians = rotationDegree * Math.PI / 180;

            const absAngle = Math.abs(rotationDegree % 180);
            if (absAngle === 90) { canvas.width = img.height; canvas.height = img.width; }
            else { canvas.width = img.width; canvas.height = img.height; }

            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(angleInRadians);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);
            ctx.restore();
            finalImageDataURL = canvas.toDataURL('image/jpeg');
            console.log("Image rotated for saving.");
        }

        setResults(prev => [...prev, finalImageDataURL]);
        resetScannerState();
        setCurrentPage(PAGES.HOME);
    };
    img.onerror = () => {
        console.error("Failed to load normalized image for saving.");
        // Save unrotated as fallback
        setResults(prev => [...prev, normalizedImageDataURL]);
        resetScannerState(); setCurrentPage(PAGES.HOME);
    };
    img.src = normalizedImageDataURL;
};

  const handleResultCancel = () => {
    // Check if we're in simplified mode (no filter thumbnails available)
    const isSimplifiedMode = !Object.keys(filterThumbnails).length;

    if (isSimplifiedMode) {
      // In simplified mode, go back to scanner instead of cropper
      setCurrentPage(PAGES.SCANNER);
      // Reset rotation and UI state
      setRotationDegree(0);
      setShowFilterList(false);
      // Start camera after a short delay to allow for state update
      setTimeout(() => startCamera(), 100);
      console.log('Simplified mode: returning to camera view');
    } else {
      // Normal flow - go back to cropper
      setCurrentPage(PAGES.CROPPER);
      setRotationDegree(0);
      setShowFilterList(false);
      // Keep normalizedImageDataURL and filterThumbnails as they might be reused if user confirms again
      console.log('Normal mode: returning to cropper view');
    }
  };

  // --- Page Navigation and Resets ---
  const goToScanner = () => {
    // Don't reset camera/resolution selection
    resetScannerState(false); // Soft reset, keep selections
    setCurrentPage(PAGES.SCANNER);
    setTimeout(startCamera, 50); // Start camera after transition
  };

  const closeScanner = () => {
    resetScannerState(true); // Hard reset, clear everything
    setCurrentPage(PAGES.HOME);
  };

  // Reset function with option to keep selections
  const resetScannerState = (fullReset = true) => {
    stopCamera(); // Always stop camera and detection
    setCapturedImageDataURL(null);
    setNormalizedImageDataURL(null);
    setFilterThumbnails({});
    setDetectedQuad(null);
    setRotationDegree(0);
    setShowFilterList(false);
    setIsFlashOn(false);
    setStatusText('');
    resetCropperAndResults();

    if (fullReset) {
        // Optionally reset camera/resolution selection if needed
        // setSelectedDeviceId(cameraDevices.length > 0 ? cameraDevices[0].deviceId : '');
        // setSelectedResolution(RESOLUTIONS[0].value);
        setResults([]); // Clear final results on full reset (e.g., closing scanner)
    }
  };

   const resetCropperAndResults = () => {
        if (cropperRef.current) {
             try {
                 // Check if methods exist before calling
                 if (typeof cropperRef.current.reset === 'function') {
                    cropperRef.current.reset(); // Prefer reset method if available
                 } else {
                    // Fallback to setting properties if reset method doesn't exist
                    cropperRef.current.img = null;
                    cropperRef.current.quad = null;
                 }
                 console.log("Cropper reset.");
             } catch (e) {
                 console.warn("Could not reset cropper:", e);
             }
        }
        // Don't reset normalizedImageDataURL here, might be needed if user cancels result viewer
        // setNormalizedImageDataURL(null);
        setFilterThumbnails({}); // Reset filter previews
        setRotationDegree(0);
        setShowFilterList(false);
    };

  // --- Render Logic ---
  const renderPage = () => {
    // Show loading indicator until scripts and initialization are done
    if (isLoading || isScriptLoading) {
      return (
        <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-50">
          <div className="flex items-center space-x-3 bg-white py-3 px-6 rounded-lg shadow-xl">
            <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
            <span className="text-gray-700 font-medium">{statusText || 'Loading...'}</span>
          </div>
        </div>
      );
    }

    // Show error if initialization failed but loading is complete
     if (!ddnInstance && !isLoading) {
         return (
             <div className="p-4 flex flex-col items-center space-y-4 h-screen text-red-600 bg-gray-50">
                 <h2 className="text-2xl font-semibold mb-6">Scanner Error</h2>
                 <p>{statusText || 'Failed to initialize the document scanner library.'}</p>
                 <p>Please ensure scripts loaded correctly and check the console for details.</p>
                 {/* Optionally add a refresh button */}
             </div>
         );
     }


    // Render the current page based on state
    switch (currentPage) {
      case PAGES.SCANNER: return <ScannerPage />;
      case PAGES.CROPPER: return <CropperPage />;
      case PAGES.RESULT_VIEWER: return <ResultViewerPage />;
      case PAGES.HOME:
      default: return <HomePage />;
    }
  };

  // --- Sub-Components for Pages ---

  const HomePage = () => (
    <div className="p-4 flex flex-col items-center space-y-4 h-screen overflow-y-auto text-gray-800 bg-gray-50">
      <h2 className="text-2xl font-semibold mb-6">Document Scanner</h2>

      {/* Camera and Resolution Selection */}
      <div className="w-full max-w-xs space-y-2">
        <label htmlFor="cameraSelect" className="block text-sm font-medium text-gray-700">Camera:</label>
        <select
          id="cameraSelect"
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
          disabled={cameraDevices.length === 0}
        >
          {cameraDevices.length === 0 && <option>No cameras found</option>}
          {cameraDevices.map(device => (
            <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${device.deviceId.substring(0, 6)}`}</option>
          ))}
        </select>
      </div>
      <div className="w-full max-w-xs space-y-2">
        <label htmlFor="resolutionSelect" className="block text-sm font-medium text-gray-700">Resolution:</label>
        <select
          id="resolutionSelect"
          value={selectedResolution}
          onChange={(e) => setSelectedResolution(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
        >
          {RESOLUTIONS.map(res => (<option key={res.value} value={res.value}>{res.label}</option>))}
        </select>
      </div>

      {/* Action Buttons */}
      <button
        onClick={goToScanner}
        className="mt-4 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-50"
        disabled={cameraDevices.length === 0} // Only disable if no cameras are available
      >
        <Camera className="inline-block h-5 w-5 mr-2" /> Start Camera
      </button>
      <button
        onClick={handleLoadImageClick}
        className="mt-2 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-50"
      >
        <Upload className="inline-block h-5 w-5 mr-2" /> Load Image
      </button>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={loadImageFromFile} accept=".jpg,.jpeg,.png,.bmp" />

      {/* Display Results */}
      <div className="mt-8 w-full max-w-4xl">
        <h3 className="text-xl font-semibold mb-4 text-center">Processed Documents</h3>
        {results.length === 0 && <p className="text-center text-gray-500">No documents processed yet.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-2">
          {results.map((imgDataUrl, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
              <img src={imgDataUrl} alt={`Processed Document ${index + 1}`} className="w-full h-auto object-contain aspect-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ScannerPage = () => (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* Video Feed - Adjusted styles for better compatibility */}
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          backgroundColor: "transparent", // Changed from green
          display: "block",
          zIndex: 1
        }}
        muted
        autoPlay={true}
        playsInline={true}
        controls={false}
        onLoadedData={handleVideoLoaded}
        onLoadedMetadata={handleVideoLoaded}
        onPlay={() => console.log("Video play event fired")}
        onCanPlay={() => {
          console.log("Video can play");
          if (videoRef.current) {
            // Force play on canplay event
            videoRef.current.play().catch(e => console.error("Play error:", e));
          }
        }}
      ></video>
      {/* SVG Overlay */}
      <svg
        ref={overlayRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 2 }}
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
      ></svg>
      {/* Hidden Canvases */}
      <canvas ref={hiddenFrameCanvasRef} className="hidden"></canvas>
      <canvas ref={hiddenCanvasRef} className="hidden"></canvas>
      {/* Header */}
      <div className="absolute top-0 left-0 w-full h-16 bg-black bg-opacity-70 flex justify-between items-center px-4 z-10">
        <button onClick={closeScanner} className="text-white p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"><X size={28} /></button>
        {isTorchSupported && (
             <button onClick={toggleFlash} className={`text-white p-2 rounded-full transition-colors ${isFlashOn ? 'bg-yellow-400 text-black hover:bg-yellow-500' : 'hover:bg-white hover:bg-opacity-20'}`}>
                {isFlashOn ? <ZapOff size={28} /> : <Zap size={28} />}
             </button>
        )}
      </div>
      {/* Footer */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-black bg-opacity-70 flex justify-evenly items-center z-10">
        <button
          onClick={switchCamera}
          className="text-white p-3 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={cameraDevices.length <= 1}
          aria-label="Switch Camera"
        >
          <RefreshCw size={28} />
        </button>
        <button
          onClick={() => {
            if (handleCaptureRef.current) {
              // Show clear feedback when capturing
              setStatusText("Capturing...");
              // Add a slight delay to ensure the status is shown
              setTimeout(() => {
                handleCaptureRef.current();
              }, 100);
            }
          }}
          className="w-16 h-16 bg-gray-300 rounded-full p-1 flex items-center justify-center active:bg-gray-400 transition-colors shadow-lg"
          aria-label="Capture Document"
        >
          <div className="w-full h-full bg-white rounded-full"></div>
        </button>
        <button
          onClick={() => setIsAutoCaptureOn(prev => !prev)}
          className={`p-3 rounded-full transition-colors ${isAutoCaptureOn ? 'bg-green-500 text-white hover:bg-green-600' : 'text-white hover:bg-white hover:bg-opacity-20'}`}
          aria-label={`Auto Capture ${isAutoCaptureOn ? 'On' : 'Off'}`}
        >
          <ScanSearch size={28} />
        </button>
      </div>
    </div>
  );

  const CropperPage = () => {
    // Check if the custom element is defined before rendering
    const isCustomElementDefined = typeof window !== 'undefined' && window.customElements &&
                                   customElements.get('image-cropper');

    // If component isn't available, show a fallback UI with simple accept/cancel buttons
    if (!isCustomElementDefined) {
      return (
        <div className="relative w-screen h-screen bg-black flex flex-col items-center justify-center text-white">
          <div className="p-4 text-center max-w-lg w-full">
            <h3 className="text-xl mb-3 text-yellow-400">Simple Mode Active</h3>
            <p className="mb-4">The advanced cropper component isn't available. Using simplified mode.</p>

            {/* Show the image directly */}
            <div className="mb-4 bg-white p-2 rounded">
              <img
                src={capturedImageDataURL}
                alt="Captured"
                className="max-w-full max-h-80 object-contain mx-auto"
              />
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  // Skip cropping, go directly to result view
                  setNormalizedImageDataURL(capturedImageDataURL);
                  setCurrentPage(PAGES.RESULT_VIEWER);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                Accept Image
              </button>
              <button
                onClick={() => {
                  // Return to camera view
                  setCurrentPage(PAGES.SCANNER);
                  // Restart camera
                  setTimeout(() => startCamera(), 100);
                }}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Regular component render when it's available
    return (
      <div className="relative w-screen h-screen bg-black flex items-center justify-center">
        {/* Ensure the key changes if the image source changes to force re-render if necessary */}
        <image-cropper
          key={capturedImageDataURL} // Add key if re-rendering helps update
          ref={cropperRef}
          className="w-full h-full"
          // control-color="#ffffff" // Example attributes if supported
          // handle-color="#3b82f6"
          // handle-size="12"
          // line-width="2"
        >
           {/* Default controls are usually built-in, avoid adding conflicting ones unless needed */}
        </image-cropper>
      </div>
    );
  };

  const ResultViewerPage = () => {
    // For simplified mode, check if we have filters available
    const isSimplifiedMode = !Object.keys(filterThumbnails).length;

    return (
      <div className="relative w-screen h-screen bg-black flex flex-col">
        {/* Header */}
        <div className="w-full h-16 bg-black bg-opacity-80 flex justify-start items-center px-4 z-10 space-x-4">
          <button onClick={handleRotate} className="text-white p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors" aria-label="Rotate Counter-Clockwise"><RotateCcw size={28} /></button>

          {/* Only show filter button if we have filter thumbnails or DDN instance */}
          {!isSimplifiedMode && (
            <button
              onClick={() => setShowFilterList(prev => !prev)}
              className={`p-2 rounded-full transition-colors ${showFilterList ? 'bg-blue-500 text-white hover:bg-blue-600' : 'text-white hover:bg-white hover:bg-opacity-20'}`}
              aria-label="Toggle Color Filters"
            >
              <Palette size={28} />
            </button>
          )}

          {/* Show simplified mode indicator if applicable */}
          {isSimplifiedMode && (
            <span className="text-yellow-400 text-sm px-2 py-1 rounded bg-yellow-900 bg-opacity-50">
              Simplified Mode
            </span>
          )}
        </div>

        {/* Filter List - only show if we have filters */}
        {showFilterList && !isSimplifiedMode && (
          <div className="w-full h-24 bg-black bg-opacity-80 flex justify-center items-center px-4 z-10 space-x-4 overflow-x-auto">
            {FILTER_MODES.map(mode => (
              <button
                key={mode.id}
                onClick={() => handleFilterSelect(mode.id)}
                className={`flex flex-col items-center text-center p-1 rounded-md transition-colors ${
                  /* Placeholder for selection state */ false ? 'bg-blue-600' : 'hover:bg-white hover:bg-opacity-10'
                }`}
                disabled={!filterThumbnails[mode.id]}
              >
                <img
                  src={filterThumbnails[mode.id] || 'https://placehold.co/80x60/333/ccc?text=N/A'}
                  alt={`${mode.label} Preview`}
                  className={`h-12 w-auto object-contain border ${ /* Placeholder */ false ? 'border-blue-400' : 'border-transparent'} ${!filterThumbnails[mode.id] ? 'opacity-50' : ''}`}
                />
                <span className="text-white text-xs mt-1">{mode.label}</span>
              </button>
            ))}
          </div>
        )}
      {/* Image Container */}
      <div className="flex-grow flex items-center justify-center overflow-hidden p-2">
        {normalizedImageDataURL ? (
          <img src={normalizedImageDataURL} alt="Normalized Document" className="max-w-full max-h-full object-contain" style={{ transform: `rotate(${rotationDegree}deg)` }} />
        ) : (
           <div className="text-white flex flex-col items-center"><ImageIcon size={48} className="mb-2 text-gray-500"/><span>No processed image</span></div>
        )}
      </div>
      {/* Footer */}
      <div className="w-full h-20 bg-black bg-opacity-80 flex justify-between items-center px-8 z-10">
        <button
          onClick={handleResultCancel}
          className="text-white p-3 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors flex items-center space-x-2"
          aria-label="Back to crop"
        >
          <ArrowLeft size={28} /><span>{isSimplifiedMode ? 'Back to Camera' : 'Back to Crop'}</span>
        </button>
        <button
          onClick={handleResultAccept}
          className="text-green-400 p-3 rounded-full hover:bg-green-500 hover:text-white transition-colors flex items-center space-x-2"
          aria-label="Accept and save"
          disabled={!normalizedImageDataURL}
        >
          <Check size={28} /><span>Accept</span>
        </button>
      </div>
    </div>
    );
  };

  // --- Main Render ---
  return (
    <div className="w-screen h-screen font-sans">
      {/* Load scripts here, within the component */}
       <Script
          src="https://cdn.jsdelivr.net/npm/dynamsoft-document-normalizer@1.0.12/dist/ddn.js"
          strategy="afterInteractive"
          onLoad={handleDdnLoad}
          onError={handleScriptError('Dynamsoft DDN')}
        />
        {/* Removed external script dependency, using our own implementation */}

      {/* Render the appropriate page or loading state */}
      {renderPage()}

      {/* Global Status Mask/Overlay (Only shown when statusText is not empty and not loading scripts/initializing) */}
      {statusText && !isLoading && !isScriptLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 pointer-events-none">
          <div className="flex items-center space-x-3 bg-white py-3 px-6 rounded-lg shadow-xl">
            <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
            <span className="text-gray-700 font-medium">{statusText}</span>
          </div>
        </div>
      )}
    </div>
  );
}
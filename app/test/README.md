# Document Scanner Test

This directory contains a test implementation of the document scanner component. The original HTML scanner is based on [Dynamsoft Document Normalizer](https://www.dynamsoft.com/document-normalizer/docs/introduction/?ver=latest) and the [ImageCapture API](https://developer.mozilla.org/en-US/docs/Web/API/ImageCapture).

The React version has been implemented in the following files:

- `/app/components/scanner/DocumentScanner.tsx` - Main component
- `/app/components/scanner/ScannerCamera.tsx` - Camera handling and document detection
- `/app/components/scanner/ImageCropper.tsx` - Manual document boundary adjustment
- `/app/components/scanner/ResultViewer.tsx` - Image filters and rotation
- `/app/components/scanner/CameraSelect.tsx` - Camera device selection
- `/app/components/scanner/ResolutionSelect.tsx` - Camera resolution selection
- `/app/lib/scannerUtils.ts` - Utility functions for the scanner

## Mobile Safari Compatibility Notes

For mobile Safari compatibility, especially for button touch events, the following changes were made:

1. Buttons are placed in completely separate containers with `fixed` positioning and high z-index values (`z-[9999]`) to ensure they're always accessible
2. Button sizes are increased (16px×16px) to provide larger touch targets
3. Debug alerts are added to buttons to help troubleshoot touch events
4. Touch and pointer event handling is optimized with `touchAction: 'manipulation'` styles 
5. The ImageCropper uses pointer events API instead of separate mouse/touch events
6. Timeouts are added to callbacks to improve Safari event handling
7. All buttons include debug logging and alert dialogs

## Testing Instructions

To test the scanner:
1. Open the application on a mobile device or use browser device emulation
2. Navigate to the scan page
3. Allow camera access if prompted
4. Position a document in the camera view
5. Document boundaries should be automatically detected (green outline)
6. Tap the capture button to take a photo
7. Adjust corners if needed in the crop view (verify buttons work)
8. Select filter and rotation options in the result view (verify buttons work)
9. Confirm the final image

If any buttons are not working, especially on iOS devices, check the browser console for any errors and verify that the button element is receiving the click/touch event.

## Credits

Original implementation: [ImageCapture-Document-Scanner](https://github.com/tony-xlh/ImageCapture-Document-Scanner)
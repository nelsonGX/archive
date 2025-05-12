'use client';

import { createWorker } from 'tesseract.js';
import dynamic from 'next/dynamic';
import { getDecryptedFile } from './browserStorage';

// Import PDF.js dynamically only on the client side
const pdfjsLib = typeof window !== 'undefined'
  ? require('pdfjs-dist')
  : null;

// Set the PDF.js worker source (only in browser)
if (typeof window !== 'undefined' && pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

/**
 * Extracts text from an image using Tesseract OCR
 * @param imageData The image data as a Uint8Array or equivalent
 * @returns The extracted text
 */
export async function extractTextFromImage(imageData: Uint8Array | Blob): Promise<string> {
  // Check if running in browser
  if (typeof window === 'undefined') {
    throw new Error('OCR can only be performed in browser environment');
  }

  const worker = await createWorker();

  try {
    const { data } = await worker.recognize(imageData);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

/**
 * Extracts a page from a PDF as an image
 * @param pdfData The PDF data as an ArrayBuffer
 * @param pageNumber The page number to extract (1-based)
 * @returns The page as a canvas element
 */
async function extractPageAsImage(pdfData: ArrayBuffer, pageNumber: number): Promise<HTMLCanvasElement> {
  // Check if running in browser
  if (typeof window === 'undefined' || !pdfjsLib) {
    throw new Error('PDF extraction can only be performed in browser environment');
  }

  // Load the PDF document
  const loadingTask = pdfjsLib.getDocument({ data: pdfData });
  const pdf = await loadingTask.promise;

  // Get the specified page
  const page = await pdf.getPage(pageNumber);

  // Set viewport scale (adjust for better OCR results)
  const viewport = page.getViewport({ scale: 2.0 });

  // Create a canvas to render the page
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  // Render the page
  await page.render({
    canvasContext: context!,
    viewport: viewport
  }).promise;

  return canvas;
}

/**
 * Extracts text from a PDF document using OCR
 * @param pdfData The PDF data as an ArrayBuffer
 * @param maxPages Maximum number of pages to process (optional)
 * @returns The extracted text
 */
export async function extractTextFromPdf(pdfData: ArrayBuffer, maxPages?: number): Promise<string> {
  // Check if running in browser
  if (typeof window === 'undefined' || !pdfjsLib) {
    throw new Error('PDF extraction can only be performed in browser environment');
  }

  // Load the PDF document
  const loadingTask = pdfjsLib.getDocument({ data: pdfData });
  const pdf = await loadingTask.promise;

  // Determine how many pages to process
  const numPages = pdf.numPages;
  const pagesToProcess = maxPages ? Math.min(numPages, maxPages) : numPages;

  let fullText = '';

  // Process each page
  for (let i = 1; i <= pagesToProcess; i++) {
    // Extract page as image
    const canvas = await extractPageAsImage(pdfData, i);

    // Convert canvas to blob for OCR
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });

    // Extract text from the page image
    const pageText = await extractTextFromImage(blob);

    // Add page number and text to result
    fullText += `Page ${i}:\n${pageText}\n\n`;
  }

  return fullText;
}

/**
 * Process a document for OCR
 * @param fileId The file ID in browser storage
 * @param encryptionKey The encryption key
 * @param encryptionIv The encryption IV
 * @returns The extracted text
 */
export async function processDocumentOcr(
  fileId: string,
  encryptionKey: string,
  encryptionIv: string
): Promise<string> {
  // Check if running in browser
  if (typeof window === 'undefined') {
    throw new Error('OCR can only be performed in browser environment');
  }

  // Get the decrypted file from browser storage
  const fileData = await getDecryptedFile(fileId, encryptionKey, encryptionIv);

  // Process the PDF and extract text
  const extractedText = await extractTextFromPdf(fileData, 20); // Limit to 20 pages for performance

  return extractedText;
}
"use client"

import jsPDF from 'jspdf';

interface ScannedDocument {
  originalImage: string;
  processedImage: string;
}

/**
 * Creates a PDF from an array of scanned document images
 * @param documents Array of scanned documents with processed images
 * @param filename Filename for the PDF (without extension)
 * @returns Promise that resolves to the PDF data URL
 */
export async function createPdfFromImages(
  documents: ScannedDocument[],
  filename = 'scanned-document'
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      if (!documents.length) {
        throw new Error('No documents provided');
      }

      // Create a new PDF document with A4 size
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Page dimensions in mm (A4)
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      const contentHeight = pageHeight - (margin * 2);

      // Process each document
      const processImages = async () => {
        for (let i = 0; i < documents.length; i++) {
          // Add a new page for documents after the first one
          if (i > 0) {
            pdf.addPage();
          }

          // Get the processed image
          const imgData = documents[i].processedImage;
          
          // Load the image to get its dimensions
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = imgData;
          });

          // Calculate scaling to fit within the page margins
          const imgRatio = img.width / img.height;
          let imgWidth = contentWidth;
          let imgHeight = contentWidth / imgRatio;

          // If the height is too large, scale based on height instead
          if (imgHeight > contentHeight) {
            imgHeight = contentHeight;
            imgWidth = contentHeight * imgRatio;
          }

          // Center the image on the page
          const x = margin + (contentWidth - imgWidth) / 2;
          const y = margin + (contentHeight - imgHeight) / 2;

          // Add the image to the PDF
          pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
        }

        // Return the PDF as a data URL
        const pdfOutput = pdf.output('dataurlstring');
        resolve(pdfOutput);
      };

      processImages().catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Downloads a PDF file
 * @param pdfDataUrl PDF data URL
 * @param filename Filename for the PDF (without extension)
 */
export function downloadPdf(pdfDataUrl: string, filename = 'scanned-document'): void {
  // Create a link element
  const link = document.createElement('a');
  link.href = pdfDataUrl;
  link.download = `${filename}.pdf`;
  
  // Append to the document, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
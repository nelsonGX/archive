/**
 * Utilities for document scanning functionality
 */

interface Point {
  x: number;
  y: number;
}

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

/**
 * Check if camera API is supported in the current browser
 */
export function isCameraSupported(): boolean {
  return !!(navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Check if we're in a secure context (required for camera API)
 */
export function isSecureContext(): boolean {
  return window.isSecureContext === true;
}

/**
 * Calculate the intersection over union of two sets of points
 */
export function intersectionOverUnion(pts1: Point[], pts2: Point[]): number {
  try {
    const rect1 = getRectFromPoints(pts1);
    const rect2 = getRectFromPoints(pts2);
    return rectIntersectionOverUnion(rect1, rect2);
  } catch (error) {
    return 0;
  }
}

/**
 * Calculate the intersection over union of two rectangles
 */
export function rectIntersectionOverUnion(rect1: Rect, rect2: Rect): number {
  const leftColumnMax = Math.max(rect1.left, rect2.left);
  const rightColumnMin = Math.min(rect1.right, rect2.right);
  const upRowMax = Math.max(rect1.top, rect2.top);
  const downRowMin = Math.min(rect1.bottom, rect2.bottom);

  if (leftColumnMax >= rightColumnMin || downRowMin <= upRowMax) {
    return 0;
  }

  const s1 = rect1.width * rect1.height;
  const s2 = rect2.width * rect2.height;
  const sCross = (downRowMin - upRowMax) * (rightColumnMin - leftColumnMax);
  return sCross / (s1 + s2 - sCross);
}

/**
 * Create a rectangle from a set of points
 */
export function getRectFromPoints(points: Point[]): Rect {
  if (!points.length) {
    throw new Error("Invalid number of points");
  }

  let left = points[0].x;
  let top = points[0].y;
  let right = 0;
  let bottom = 0;

  points.forEach(point => {
    left = Math.min(point.x, left);
    top = Math.min(point.y, top);
    right = Math.max(point.x, right);
    bottom = Math.max(point.y, bottom);
  });

  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top
  };
}

/**
 * Draw a polygon on an SVG element based on points
 */
export function drawPolygonOnSvg(
  points: Point[], 
  svg: SVGElement
): SVGPolygonElement {
  let polygon: SVGPolygonElement;
  
  if (svg.getElementsByTagName("polygon").length === 1) {
    polygon = svg.getElementsByTagName("polygon")[0];
  } else {
    polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("class", "detectedPolygon");
    svg.appendChild(polygon);
  }
  
  polygon.setAttribute("points", getPointsData(points));
  return polygon;
}

/**
 * Convert points array to SVG points string format
 */
export function getPointsData(points: Point[]): string {
  return points
    .map(point => `${point.x},${point.y}`)
    .join(" ");
}

/**
 * Calculate and check if document detection is steady
 */
export function isSteady(results: Array<{location: {points: Point[]}}>, threshold = 0.9): boolean {
  if (results.length < 3) return false;
  
  const iou1 = intersectionOverUnion(results[0].location.points, results[1].location.points);
  const iou2 = intersectionOverUnion(results[1].location.points, results[2].location.points);
  const iou3 = intersectionOverUnion(results[0].location.points, results[2].location.points);
  
  return iou1 > threshold && iou2 > threshold && iou3 > threshold;
}

/**
 * Scale quad points by a ratio
 */
export function scaleQuad(quad: {location: {points: Point[]}}, scaleRatio: number): void {
  const points = quad.location.points;
  for (let i = 0; i < points.length; i++) {
    points[i].x = Math.round(points[i].x / scaleRatio);
    points[i].y = Math.round(points[i].y / scaleRatio);
  }
}

/**
 * Create a scaled copy of a quad
 */
export function createScaledQuad(quad: {location: {points: Point[]}}, scaleRatio: number): {location: {points: Point[]}} {
  const newQuad = JSON.parse(JSON.stringify(quad));
  const points = newQuad.location.points;
  
  for (let i = 0; i < points.length; i++) {
    points[i].x = Math.round(points[i].x * scaleRatio);
    points[i].y = Math.round(points[i].y * scaleRatio);
  }
  
  return newQuad;
}

/**
 * Create a mock implementation for document detection
 * This is used when the Dynamsoft Document Normalizer library is not available
 */
export function createMockDetectionTools() {
  return {
    detectQuad: async (canvas: HTMLCanvasElement) => {
      // Create a simple quad with margins
      const width = canvas.width;
      const height = canvas.height;
      const margin = Math.min(width, height) * 0.1;
      
      return [{
        location: {
          points: [
            { x: margin, y: margin },
            { x: width - margin, y: margin },
            { x: width - margin, y: height - margin },
            { x: margin, y: height - margin }
          ]
        }
      }];
    },
    normalize: async (img: HTMLImageElement | HTMLCanvasElement, options: any) => {
      // Create a simple normalized image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (img instanceof HTMLImageElement) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx?.drawImage(img, 0, 0);
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
      }
      
      return { 
        image: { 
          toCanvas: () => canvas 
        } 
      };
    }
  };
}
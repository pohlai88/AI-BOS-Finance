/**
 * useBioChartExport - Export functionality for BioChart
 *
 * Sprint E4+: Export/Print 100%
 * Provides PNG, SVG, and print export for charts.
 *
 * @example
 * const chartRef = useRef<HTMLDivElement>(null);
 * const { exportPNG, exportSVG, print } = useBioChartExport(chartRef);
 *
 * <button onClick={() => exportPNG('sales-chart')}>Download PNG</button>
 */

'use client';

import * as React from 'react';

// ============================================================
// Types
// ============================================================

export interface ChartExportOptions {
  /** Background color (default: white) */
  backgroundColor?: string;
  /** Scale factor for PNG (default: 2 for retina) */
  scale?: number;
  /** Quality for JPEG (0-1, default: 0.92) */
  quality?: number;
}

export interface UseBioChartExportReturn {
  /** Export chart as PNG image */
  exportPNG: (filename?: string, options?: ChartExportOptions) => Promise<void>;
  /** Export chart as SVG */
  exportSVG: (filename?: string) => void;
  /** Print the chart */
  print: (title?: string) => void;
  /** Copy chart image to clipboard */
  copyToClipboard: () => Promise<void>;
  /** Get chart as data URL */
  getDataURL: (format?: 'png' | 'jpeg', options?: ChartExportOptions) => Promise<string>;
}

// ============================================================
// Hook
// ============================================================

export function useBioChartExport(
  chartRef: React.RefObject<HTMLDivElement | null>
): UseBioChartExportReturn {
  /**
   * Get the SVG element from the chart container
   */
  const getSVGElement = React.useCallback((): SVGSVGElement | null => {
    if (!chartRef.current) return null;
    return chartRef.current.querySelector('svg');
  }, [chartRef]);

  /**
   * Convert SVG to canvas for image export
   */
  const svgToCanvas = React.useCallback(
    async (options: ChartExportOptions = {}): Promise<HTMLCanvasElement | null> => {
      const svg = getSVGElement();
      if (!svg) return null;

      const { backgroundColor = '#ffffff', scale = 2 } = options;

      // Clone SVG and serialize
      const clonedSvg = svg.cloneNode(true) as SVGSVGElement;

      // Get dimensions
      const bbox = svg.getBoundingClientRect();
      const width = bbox.width * scale;
      const height = bbox.height * scale;

      // Set dimensions on cloned SVG
      clonedSvg.setAttribute('width', String(width));
      clonedSvg.setAttribute('height', String(height));

      // Serialize to string
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(clonedSvg);

      // Add XML declaration and proper namespace
      if (!svgString.includes('xmlns')) {
        svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      // Create image from SVG
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      return new Promise((resolve) => {
        img.onload = () => {
          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            resolve(null);
            return;
          }

          // Fill background
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, width, height);

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          URL.revokeObjectURL(url);
          resolve(canvas);
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(null);
        };

        img.src = url;
      });
    },
    [getSVGElement]
  );

  /**
   * Get chart as data URL
   */
  const getDataURL = React.useCallback(
    async (format: 'png' | 'jpeg' = 'png', options: ChartExportOptions = {}): Promise<string> => {
      const canvas = await svgToCanvas(options);
      if (!canvas) return '';

      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const quality = options.quality ?? 0.92;

      return canvas.toDataURL(mimeType, quality);
    },
    [svgToCanvas]
  );

  /**
   * Export chart as PNG
   */
  const exportPNG = React.useCallback(
    async (filename: string = 'chart', options: ChartExportOptions = {}) => {
      const canvas = await svgToCanvas(options);
      if (!canvas) {
        console.warn('[BioChartExport] No chart found to export');
        return;
      }

      canvas.toBlob((blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
    },
    [svgToCanvas]
  );

  /**
   * Export chart as SVG
   */
  const exportSVG = React.useCallback(
    (filename: string = 'chart') => {
      const svg = getSVGElement();
      if (!svg) {
        console.warn('[BioChartExport] No chart found to export');
        return;
      }

      // Clone and add namespace
      const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
      if (!clonedSvg.getAttribute('xmlns')) {
        clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);

      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [getSVGElement]
  );

  /**
   * Print the chart
   */
  const print = React.useCallback(
    (title: string = 'Chart') => {
      const svg = getSVGElement();
      if (!svg) {
        console.warn('[BioChartExport] No chart found to print');
        return;
      }

      // Clone SVG
      const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
      if (!clonedSvg.getAttribute('xmlns')) {
        clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        console.warn('[BioChartExport] Could not open print window');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              @media print {
                body { margin: 0; padding: 20px; }
                h1 { font-family: system-ui, sans-serif; font-size: 18px; margin-bottom: 20px; }
                svg { max-width: 100%; height: auto; }
              }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            ${svgString}
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();

      // Wait for content to load
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    },
    [getSVGElement]
  );

  /**
   * Copy chart image to clipboard
   */
  const copyToClipboard = React.useCallback(async () => {
    const canvas = await svgToCanvas({ scale: 2 });
    if (!canvas) {
      console.warn('[BioChartExport] No chart found to copy');
      return;
    }

    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });

      if (!blob) return;

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
    } catch (err) {
      console.warn('[BioChartExport] Clipboard copy failed:', err);
    }
  }, [svgToCanvas]);

  return {
    exportPNG,
    exportSVG,
    print,
    copyToClipboard,
    getDataURL,
  };
}

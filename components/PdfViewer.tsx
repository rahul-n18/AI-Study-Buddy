import React, { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { ChevronLeftIcon, ChevronRightIcon, ZoomInIcon, ZoomOutIcon } from './Icons';

// Set up the worker to match the version from the importmap CDN
pdfjs.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfViewerProps {
  file: File;
  onPageChange: (text: string) => void;
  onTextSelect: (text: string) => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ file, onPageChange, onTextSelect }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);

  const onDocumentLoadSuccess = (pdfDoc: PDFDocumentProxy) => {
    setNumPages(pdfDoc.numPages);
    setPdf(pdfDoc);
    setPageNumber(1);
  };

  const extractText = useCallback(async (pageIdx: number) => {
    if (!pdf) return;
    try {
      const page = await pdf.getPage(pageIdx);
      const textContent = await page.getTextContent();
      const text = textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
      onPageChange(text);
    } catch (error) {
      console.error('Error extracting text from page', error);
      onPageChange('');
    }
  }, [pdf, onPageChange]);

  useEffect(() => {
    extractText(pageNumber);
  }, [pageNumber, extractText]);

  const handleTextSelection = () => {
    const text = window.getSelection()?.toString() ?? '';
    if (text) {
      onTextSelect(text);
    }
  };

  const goToPrevPage = () => setPageNumber(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(numPages, prev + 1));

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPage = parseInt(e.target.value, 10);
    if (newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-200 dark:bg-gray-600">
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 p-2 flex items-center justify-center sticky top-0 z-10 shadow-md">
        <button onClick={goToPrevPage} disabled={pageNumber <= 1} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <div className="mx-4">
          Page{' '}
          <input
            type="number"
            value={pageNumber}
            onChange={handlePageInputChange}
            className="w-12 text-center bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 py-1"
            min="1"
            max={numPages}
          />
          {' '}of {numPages}
        </div>
        <button onClick={goToNextPage} disabled={pageNumber >= numPages} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <ChevronRightIcon className="w-6 h-6" />
        </button>
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-4"></div>
        <button onClick={() => setScale(s => s - 0.1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <ZoomOutIcon className="w-6 h-6" />
        </button>
        <span className="mx-2 w-12 text-center">{(scale * 100).toFixed(0)}%</span>
        <button onClick={() => setScale(s => s + 0.1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <ZoomInIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-auto" onMouseUp={handleTextSelection}>
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(error) => console.error('Failed to load PDF:', error)}
          className="flex justify-center"
        >
          <Page pageNumber={pageNumber} scale={scale} />
        </Document>
      </div>
    </div>
  );
};

export default PdfViewer;
'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { pdfjs } from 'react-pdf';
import { MAX_IMAGE_SIZE_MB } from '@/lib/validation/book-registration.schema';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface CoverImageUploaderProps {
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
  existingImage?: string;
  pdfFile?: File | null;
}

export function CoverImageUploader({ onFileSelect, disabled, existingImage, pdfFile }: CoverImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(existingImage || null);
  const [error, setError] = useState<string | null>(null);
  const [isExisting, setIsExisting] = useState<boolean>(!!existingImage);
  const [isExtractingFromPdf, setIsExtractingFromPdf] = useState(false);

  const extractCoverFromPdf = async (pdf: File) => {
    setIsExtractingFromPdf(true);
    setError(null);

    try {
      const arrayBuffer = await pdf.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      const page = await pdfDoc.getPage(1);

      const scale = 2;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not get canvas context');
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      }).promise;

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const extractedFile = new File([blob], 'cover-from-pdf.jpg', { type: 'image/jpeg' });
            setFile(extractedFile);
            setPreview(canvas.toDataURL('image/jpeg', 0.9));
            setIsExisting(false);
            onFileSelect(extractedFile);
          } else {
            setError('Failed to extract cover from PDF');
          }
          setIsExtractingFromPdf(false);
        },
        'image/jpeg',
        0.9
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract cover from PDF');
      setIsExtractingFromPdf(false);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);

      if (acceptedFiles.length === 0) {
        setError('Please select a valid image file');
        return;
      }

      const selectedFile = acceptedFiles[0];

      if (selectedFile.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        setError(`Image size must be less than ${MAX_IMAGE_SIZE_MB}MB`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);

      setFile(selectedFile);
      setIsExisting(false);
      onFileSelect(selectedFile);
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles: 1,
    disabled,
  });

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setIsExisting(false);
    onFileSelect(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (preview) {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Cover Image (Optional)</label>
        <div className={`border rounded-lg p-4 ${isExisting ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
          <div className="flex items-start space-x-4">
            <div className="relative w-32 h-48 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
              <Image
                src={preview}
                alt="Cover preview"
                fill
                className="object-cover"
                unoptimized={isExisting}
              />
            </div>
            <div className="flex-1 min-w-0">
              {file ? (
                <>
                  <div className="font-medium text-gray-900 truncate">{file.name}</div>
                  <div className="text-sm text-gray-500 mt-1">{formatFileSize(file.size)}</div>
                </>
              ) : (
                <>
                  <div className="font-medium text-gray-900">Current Cover Image</div>
                  <div className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Keeping existing
                  </div>
                </>
              )}
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="mt-3 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                {isExisting ? 'Remove and upload new' : 'Remove image'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Cover Image (Optional)</label>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <svg
          className={`mx-auto h-12 w-12 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`}
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2 2l1.586-1.586a2 2 0 012.828 0L20 18m-2 2l1.586-1.586a2 2 0 012.828 0L24 20m-2 2l1.586-1.586a2 2 0 012.828 0L28 24m-2 2l1.586-1.586a2 2 0 012.828 0L32 28m-2 2l1.586-1.586a2 2 0 012.828 0L36 32M4 42h40"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="4" y="16" width="40" height="26" rx="2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="14" cy="24" r="2" fill="currentColor" />
        </svg>
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            {isDragActive ? (
              <span className="font-medium text-blue-600">Drop the image here</span>
            ) : (
              <>
                <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
              </>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PNG, JPG, WEBP up to {MAX_IMAGE_SIZE_MB}MB
          </p>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {pdfFile && !preview && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm text-blue-800">
                PDF detected: <span className="font-medium">{pdfFile.name}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => extractCoverFromPdf(pdfFile)}
              disabled={disabled || isExtractingFromPdf}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              {isExtractingFromPdf ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Extract from PDF</span>
                </>
              )}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-blue-600">
            Click to automatically use the first page of your PDF as the cover image
          </p>
        </div>
      )}
    </div>
  );
}
